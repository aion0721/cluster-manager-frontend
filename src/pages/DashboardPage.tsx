import { useEffect, useMemo, useState } from 'react'
import { getProvisioningSteps } from '../api/provisioningSteps'
import {
  ApiError,
} from '../api/client'
import {
  deleteUser,
  getUser,
  getUsers,
  reconcileUser,
  runProvisioningStep,
} from '../api/users'
import { PortForwardCommand } from '../components/PortForwardCommand'
import { ProvisioningStepsPanel } from '../components/ProvisioningStepsPanel'
import { UserCreateForm } from '../components/UserCreateForm'
import { UserDetail } from '../components/UserDetail'
import { UserList } from '../components/UserList'
import { useUser } from '../context/UserContext'
import type { ProvisioningStep, ProvisioningStepStatus } from '../types/provisioning'
import type { CreateUserRequest, UserResponse } from '../types/user'

export function DashboardPage() {
  const { currentUserId } = useUser()
  const [steps, setSteps] = useState<ProvisioningStep[]>([])
  const [stepStatuses, setStepStatuses] = useState<ProvisioningStepStatus[]>([])
  const [lastCreateRequest, setLastCreateRequest] = useState<CreateUserRequest>()
  const [users, setUsers] = useState<UserResponse[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>()
  const [selectedUser, setSelectedUser] = useState<UserResponse>()
  const [usersLoading, setUsersLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [provisioningRunning, setProvisioningRunning] = useState(false)
  const [actionRunning, setActionRunning] = useState(false)
  const [error, setError] = useState('')
  const [stepError, setStepError] = useState('')

  const failed = useMemo(
    () => stepStatuses.some((stepStatus) => stepStatus.status === 'FAILED'),
    [stepStatuses],
  )

  async function loadUsers(selectUserId?: string) {
    setUsersLoading(true)
    setError('')

    try {
      const response = await getUsers(currentUserId)
      setUsers(response)

      if (selectUserId) {
        setSelectedUserId(selectUserId)
      } else if (!selectedUserId && response[0]) {
        setSelectedUserId(response[0].userId)
      }
    } catch (caught) {
      setError(adminErrorMessage(caught, 'Failed to load users.'))
    } finally {
      setUsersLoading(false)
    }
  }

  async function loadSteps() {
    const response = await getProvisioningSteps(currentUserId)
    const ordered = [...response].sort((a, b) => a.order - b.order)
    setSteps(ordered)
    return ordered
  }

  function initializeStepStatuses(orderedSteps: ProvisioningStep[]) {
    setStepStatuses(
      orderedSteps.map((step) => ({
        key: step.key,
        label: step.label,
        status: 'PENDING',
      })),
    )
  }

  function patchStepStatus(key: string, patch: Partial<ProvisioningStepStatus>) {
    setStepStatuses((current) =>
      current.map((stepStatus) =>
        stepStatus.key === key ? { ...stepStatus, ...patch } : stepStatus,
      ),
    )
  }

  async function executeProvisioning(request: CreateUserRequest, retryFailedOnly = false) {
    setProvisioningRunning(true)
    setStepError('')
    setError('')
    setLastCreateRequest(request)

    try {
      const orderedSteps = steps.length ? steps : await loadSteps()
      if (!retryFailedOnly) {
        initializeStepStatuses(orderedSteps)
      }

      const failedIndex = stepStatuses.findIndex((stepStatus) => stepStatus.status === 'FAILED')
      const startIndex = retryFailedOnly && failedIndex >= 0 ? failedIndex : 0

      for (const step of orderedSteps.slice(startIndex)) {
        patchStepStatus(step.key, {
          status: 'RUNNING',
          message: `${step.method} ${step.endpointTemplate.replaceAll('{userId}', request.userId)}`,
          error: undefined,
        })

        try {
          await runProvisioningStep(request.userId, step, currentUserId)
          patchStepStatus(step.key, {
            status: 'DONE',
            message: 'Completed.',
          })
        } catch (caught) {
          const message = adminErrorMessage(caught, 'Provisioning step failed.')
          patchStepStatus(step.key, {
            status: 'FAILED',
            error: message,
          })
          setStepError(`${step.label} failed: ${message}`)
          return
        }
      }

      await loadUsers(request.userId)
    } catch (caught) {
      setStepError(adminErrorMessage(caught, 'Provisioning failed.'))
    } finally {
      setProvisioningRunning(false)
    }
  }

  async function handleRetry() {
    if (!lastCreateRequest) {
      setStepError('No failed create request is available.')
      return
    }

    await executeProvisioning(lastCreateRequest, true)
  }

  async function handleSelect(userId: string) {
    setSelectedUserId(userId)
  }

  async function handleDelete(userId: string) {
    const confirmed = window.confirm(`Delete user environment "${userId}"?`)
    if (!confirmed) {
      return
    }

    setActionRunning(true)
    setError('')

    try {
      await deleteUser(userId, currentUserId)
      setSelectedUser(undefined)
      setSelectedUserId(undefined)
      await loadUsers()
    } catch (caught) {
      setError(adminErrorMessage(caught, 'Failed to delete user.'))
    } finally {
      setActionRunning(false)
    }
  }

  async function handleReconcile(userId: string) {
    setActionRunning(true)
    setError('')

    try {
      await reconcileUser(userId, currentUserId)
      await loadUsers(userId)
      const refreshed = await getUser(userId, currentUserId)
      setSelectedUser(refreshed)
    } catch (caught) {
      setError(adminErrorMessage(caught, 'Failed to reconcile user.'))
    } finally {
      setActionRunning(false)
    }
  }

  useEffect(() => {
    void loadSteps().catch((caught) => {
      setStepError(adminErrorMessage(caught, 'Failed to load provisioning steps.'))
    })
    void loadUsers()
  }, [currentUserId])

  useEffect(() => {
    let cancelled = false

    async function loadSelectedUser() {
      if (!selectedUserId) {
        setSelectedUser(undefined)
        return
      }

      setDetailLoading(true)
      setError('')

      try {
        const response = await getUser(selectedUserId, currentUserId)
        if (!cancelled) {
          setSelectedUser(response)
        }
      } catch (caught) {
        if (!cancelled) {
          setSelectedUser(undefined)
          setError(adminErrorMessage(caught, 'Failed to load selected user.'))
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false)
        }
      }
    }

    void loadSelectedUser()

    return () => {
      cancelled = true
    }
  }, [currentUserId, selectedUserId])

  useEffect(() => {
    if (!selectedUserId) {
      return
    }

    if (!users.some((user) => user.userId === selectedUserId)) {
      setSelectedUserId(undefined)
      setSelectedUser(undefined)
    }
  }, [selectedUserId, users])

  return (
    <div className="dashboard-grid">
      {error ? <p className="error-banner full-width">{error}</p> : null}

      <div className="left-column">
        <UserCreateForm disabled={provisioningRunning} onCreate={executeProvisioning} />
        <ProvisioningStepsPanel
          steps={steps}
          statuses={stepStatuses}
          running={provisioningRunning}
          failed={failed}
          error={stepError}
          onRetry={handleRetry}
        />
      </div>

      <div className="right-column">
        <UserList
          users={users}
          loading={usersLoading}
          selectedUserId={selectedUserId}
          onRefresh={() => loadUsers()}
          onSelect={handleSelect}
        />
        <UserDetail
          user={selectedUser}
          loading={detailLoading}
          actionRunning={actionRunning}
          onDelete={handleDelete}
          onReconcile={handleReconcile}
        />
        <PortForwardCommand userId={selectedUserId} currentUserId={currentUserId} />
      </div>
    </div>
  )
}

function adminErrorMessage(caught: unknown, fallback: string) {
  if (caught instanceof ApiError && caught.status === 403) {
    return 'このユーザーIDでは管理操作できません。'
  }

  return caught instanceof Error ? caught.message : fallback
}

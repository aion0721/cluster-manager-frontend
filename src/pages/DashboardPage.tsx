import { useEffect, useMemo, useState } from 'react'
import { getProvisioningSteps } from '../api/provisioningSteps'
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
import type { ProvisioningStep, ProvisioningStepStatus } from '../types/provisioning'
import type { CreateUserRequest, UserResponse } from '../types/user'

export function DashboardPage() {
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
      const response = await getUsers()
      setUsers(response)

      if (selectUserId) {
        setSelectedUserId(selectUserId)
      } else if (!selectedUserId && response[0]) {
        setSelectedUserId(response[0].userId)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load users.')
    } finally {
      setUsersLoading(false)
    }
  }

  async function loadSteps() {
    const response = await getProvisioningSteps()
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
          await runProvisioningStep(request.userId, step)
          patchStepStatus(step.key, {
            status: 'DONE',
            message: 'Completed.',
          })
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : 'Provisioning step failed.'
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
      setStepError(caught instanceof Error ? caught.message : 'Provisioning failed.')
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
      await deleteUser(userId)
      setSelectedUser(undefined)
      setSelectedUserId(undefined)
      await loadUsers()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to delete user.')
    } finally {
      setActionRunning(false)
    }
  }

  async function handleReconcile(userId: string) {
    setActionRunning(true)
    setError('')

    try {
      await reconcileUser(userId)
      await loadUsers(userId)
      const refreshed = await getUser(userId)
      setSelectedUser(refreshed)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to reconcile user.')
    } finally {
      setActionRunning(false)
    }
  }

  useEffect(() => {
    void loadSteps().catch((caught) => {
      setStepError(caught instanceof Error ? caught.message : 'Failed to load provisioning steps.')
    })
    void loadUsers()
  }, [])

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
        const response = await getUser(selectedUserId)
        if (!cancelled) {
          setSelectedUser(response)
        }
      } catch (caught) {
        if (!cancelled) {
          setSelectedUser(undefined)
          setError(caught instanceof Error ? caught.message : 'Failed to load selected user.')
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
  }, [selectedUserId])

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
        <PortForwardCommand userId={selectedUserId} />
      </div>
    </div>
  )
}

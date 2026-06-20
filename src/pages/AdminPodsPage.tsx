import { useEffect, useState } from 'react'
import {
  createUserEnvironment,
  deleteUserEnvironment,
  getEnvironmentBaseImages,
} from '../api/environments'
import { getUser, getUsers, reconcileUser } from '../api/users'
import { EnvironmentCreatePanel } from '../components/EnvironmentCreatePanel'
import { EnvironmentDetail } from '../components/EnvironmentDetail'
import { EnvironmentList } from '../components/EnvironmentList'
import { PortForwardCommand } from '../components/PortForwardCommand'
import { useUser } from '../context/useUser'
import type { EnvironmentBaseImage, UserResponse } from '../types/user'
import { adminErrorMessage } from './adminErrors'

export function AdminPodsPage() {
  const { currentUserId } = useUser()
  const [environments, setEnvironments] = useState<UserResponse[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>()
  const [selectedEnvironment, setSelectedEnvironment] = useState<UserResponse>()
  const [baseImages, setBaseImages] = useState<EnvironmentBaseImage[]>([])
  const [loading, setLoading] = useState(false)
  const [baseImagesLoading, setBaseImagesLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [createRunning, setCreateRunning] = useState(false)
  const [actionRunning, setActionRunning] = useState(false)
  const [error, setError] = useState('')
  const selectedHasEnvironment = Boolean(
    selectedEnvironment?.deployment ||
      selectedEnvironment?.service ||
      selectedEnvironment?.devcontainerEndpoint,
  )

  async function loadEnvironments(selectUserId?: string) {
    setLoading(true)
    setError('')

    try {
      const response = await getUsers(currentUserId)
      setEnvironments(response)

      if (selectUserId) {
        setSelectedUserId(selectUserId)
      } else if (!selectedUserId && response[0]) {
        setSelectedUserId(response[0].userId)
      } else if (selectedUserId && !response.some((environment) => environment.userId === selectedUserId)) {
        setSelectedUserId(undefined)
        setSelectedEnvironment(undefined)
      }
    } catch (caught) {
      setError(adminErrorMessage(caught, 'Failed to load pods.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(userId: string, baseImage?: string) {
    setCreateRunning(true)
    setError('')

    try {
      await createUserEnvironment(userId, currentUserId, { baseImage })
      await loadEnvironments(userId)
    } catch (caught) {
      setError(adminErrorMessage(caught, 'Failed to create pod.'))
    } finally {
      setCreateRunning(false)
    }
  }

  async function handleDelete(userId: string) {
    const confirmed = window.confirm(`Delete pod resources for "${userId}"?`)
    if (!confirmed) {
      return
    }

    setActionRunning(true)
    setError('')

    try {
      await deleteUserEnvironment(userId, currentUserId)
      await loadEnvironments(userId)
      const refreshed = await getUser(userId, currentUserId)
      setSelectedEnvironment(refreshed)
    } catch (caught) {
      setError(adminErrorMessage(caught, 'Failed to delete pod.'))
    } finally {
      setActionRunning(false)
    }
  }

  async function handleReconcile(userId: string) {
    setActionRunning(true)
    setError('')

    try {
      await reconcileUser(userId, currentUserId)
      await loadEnvironments(userId)
      const refreshed = await getUser(userId, currentUserId)
      setSelectedEnvironment(refreshed)
    } catch (caught) {
      setError(adminErrorMessage(caught, 'Failed to reconcile pod.'))
    } finally {
      setActionRunning(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    void Promise.resolve().then(async () => {
      setLoading(true)
      setBaseImagesLoading(true)
      setError('')

      try {
        const [usersResponse, baseImagesResponse] = await Promise.all([
          getUsers(currentUserId),
          getEnvironmentBaseImages(currentUserId),
        ])
        if (cancelled) {
          return
        }

        setEnvironments(usersResponse)
        setBaseImages(baseImagesResponse)
        setSelectedUserId((currentSelectedUserId) => {
          if (currentSelectedUserId && usersResponse.some((environment) => environment.userId === currentSelectedUserId)) {
            return currentSelectedUserId
          }

          return usersResponse[0]?.userId
        })
      } catch (caught) {
        if (!cancelled) {
          setError(adminErrorMessage(caught, 'Failed to load pods or base images.'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setBaseImagesLoading(false)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [currentUserId])

  useEffect(() => {
    let cancelled = false

    void Promise.resolve().then(async () => {
      if (!selectedUserId) {
        if (!cancelled) {
          setSelectedEnvironment(undefined)
        }
        return
      }

      setDetailLoading(true)
      setError('')

      try {
        const response = await getUser(selectedUserId, currentUserId)
        if (!cancelled) {
          setSelectedEnvironment(response)
        }
      } catch (caught) {
        if (!cancelled) {
          setSelectedEnvironment(undefined)
          setError(adminErrorMessage(caught, 'Failed to load selected pod.'))
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [currentUserId, selectedUserId])

  return (
    <div className="dashboard-grid">
      {error ? <p className="error-banner full-width">{error}</p> : null}

      <div className="left-column">
        <EnvironmentCreatePanel
          users={environments}
          baseImages={baseImages}
          baseImagesLoading={baseImagesLoading}
          disabled={createRunning}
          onCreate={handleCreate}
        />
      </div>

      <div className="right-column">
        <EnvironmentList
          environments={environments}
          loading={loading}
          selectedUserId={selectedUserId}
          onRefresh={() => loadEnvironments()}
          onSelect={setSelectedUserId}
        />
        <EnvironmentDetail
          environment={selectedEnvironment}
          loading={detailLoading}
          actionRunning={actionRunning}
          onDelete={handleDelete}
          onReconcile={handleReconcile}
        />
        {selectedHasEnvironment && selectedUserId ? (
          <PortForwardCommand userId={selectedUserId} currentUserId={currentUserId} />
        ) : (
          <section className="card">
            <div className="section-heading">
              <h2>Connection</h2>
              <p>Create the pod before requesting connection details.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

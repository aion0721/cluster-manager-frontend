import { useEffect, useState } from 'react'
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  reconcileUser,
} from '../api/users'
import { UserCreateForm } from '../components/UserCreateForm'
import { UserCsvCreateForm } from '../components/UserCsvCreateForm'
import { UserDetail } from '../components/UserDetail'
import { UserList } from '../components/UserList'
import { useUser } from '../context/useUser'
import type { CreateUserRequest, UserResponse } from '../types/user'
import { adminErrorMessage } from './adminErrors'

export function AdminUsersPage() {
  const { currentUserId } = useUser()
  const [users, setUsers] = useState<UserResponse[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>()
  const [selectedUser, setSelectedUser] = useState<UserResponse>()
  const [usersLoading, setUsersLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [createRunning, setCreateRunning] = useState(false)
  const [actionRunning, setActionRunning] = useState(false)
  const [error, setError] = useState('')

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
      } else if (selectedUserId && !response.some((user) => user.userId === selectedUserId)) {
        setSelectedUserId(undefined)
        setSelectedUser(undefined)
      }
    } catch (caught) {
      setError(adminErrorMessage(caught, 'Failed to load users.'))
    } finally {
      setUsersLoading(false)
    }
  }

  async function handleCreate(request: CreateUserRequest) {
    setCreateRunning(true)
    setError('')

    try {
      await createUser(request, currentUserId)
      await loadUsers(request.userId)
    } catch (caught) {
      setError(adminErrorMessage(caught, 'Failed to create user.'))
    } finally {
      setCreateRunning(false)
    }
  }

  async function handleCreateMany(requests: CreateUserRequest[]) {
    setCreateRunning(true)
    setError('')

    try {
      for (const request of requests) {
        await createUser(request, currentUserId)
      }
      await loadUsers(requests.at(-1)?.userId)
    } catch (caught) {
      setError(adminErrorMessage(caught, 'CSVからのユーザ登録に失敗しました。'))
    } finally {
      setCreateRunning(false)
    }
  }

  async function handleDelete(userId: string) {
    const confirmed = window.confirm(`Delete user "${userId}"?`)
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
    let cancelled = false

    void Promise.resolve().then(async () => {
      setUsersLoading(true)
      setError('')

      try {
        const response = await getUsers(currentUserId)
        if (cancelled) {
          return
        }

        setUsers(response)
        setSelectedUserId((currentSelectedUserId) => {
          if (currentSelectedUserId && response.some((user) => user.userId === currentSelectedUserId)) {
            return currentSelectedUserId
          }

          return response[0]?.userId
        })
      } catch (caught) {
        if (!cancelled) {
          setError(adminErrorMessage(caught, 'Failed to load users.'))
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false)
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
          setSelectedUser(undefined)
        }
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
    })

    return () => {
      cancelled = true
    }
  }, [currentUserId, selectedUserId])

  return (
    <div className="dashboard-grid">
      {error ? <p className="error-banner full-width">{error}</p> : null}

      <div className="left-column">
        <UserCreateForm disabled={createRunning} onCreate={handleCreate} />
        <UserCsvCreateForm disabled={createRunning} onCreateMany={handleCreateMany} />
      </div>

      <div className="right-column">
        <UserList
          users={users}
          loading={usersLoading}
          selectedUserId={selectedUserId}
          onRefresh={() => loadUsers()}
          onSelect={setSelectedUserId}
        />
        <UserDetail
          user={selectedUser}
          loading={detailLoading}
          actionRunning={actionRunning}
          onDelete={handleDelete}
          onReconcile={handleReconcile}
        />
      </div>
    </div>
  )
}

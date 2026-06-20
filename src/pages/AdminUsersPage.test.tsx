import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AdminUsersPage } from './AdminUsersPage'
import { ApiError } from '../api/client'
import type { UserResponse } from '../types/user'

const users: UserResponse[] = [
  {
    userId: 'alice',
    displayName: 'Alice',
    namespace: 'alice',
    serviceAccount: 'alice-sa',
    status: 'USER_READY',
    createdAt: '2026-06-20T00:00:00Z',
  },
]

const api = vi.hoisted(() => ({
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  getUser: vi.fn(),
  getUsers: vi.fn(),
  reconcileUser: vi.fn(),
}))

vi.mock('../api/users', () => ({
  createUser: api.createUser,
  deleteUser: api.deleteUser,
  getUser: api.getUser,
  getUsers: api.getUsers,
  reconcileUser: api.reconcileUser,
}))

vi.mock('../context/useUser', () => ({
  useUser: () => ({ currentUserId: 'admin' }),
}))

describe('AdminUsersPage', () => {
  it('loads and displays users and selected user detail', async () => {
    api.getUsers.mockResolvedValue(users)
    api.getUser.mockResolvedValue(users[0])

    render(<AdminUsersPage />)

    expect(await screen.findAllByRole('cell', { name: 'alice' })).toHaveLength(2)
    expect(await screen.findByText('alice-sa')).toBeInTheDocument()
    expect(screen.getByText('USER_READY')).toBeInTheDocument()
  })

  it('creates a user and reloads the selected user', async () => {
    const user = userEvent.setup()
    const bob: UserResponse = {
      userId: 'bob',
      displayName: 'Bob',
      namespace: 'bob',
      serviceAccount: 'bob-sa',
      status: 'USER_READY',
    }
    api.getUsers.mockResolvedValueOnce(users).mockResolvedValueOnce([bob])
    api.getUser.mockResolvedValueOnce(users[0]).mockResolvedValueOnce(bob)
    api.createUser.mockResolvedValue(bob)

    render(<AdminUsersPage />)

    await user.type(await screen.findByLabelText('userId'), 'bob')
    await user.type(screen.getByLabelText('displayName'), 'Bob')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(api.createUser).toHaveBeenCalledWith(
        { userId: 'bob', displayName: 'Bob' },
        'admin',
      )
    })
  })

  it('does not delete when confirmation is cancelled', async () => {
    const user = userEvent.setup()
    api.getUsers.mockResolvedValue(users)
    api.getUser.mockResolvedValue(users[0])
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<AdminUsersPage />)

    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    expect(api.deleteUser).not.toHaveBeenCalled()
  })

  it('deletes a user after confirmation', async () => {
    const user = userEvent.setup()
    api.getUsers.mockResolvedValueOnce(users).mockResolvedValueOnce([])
    api.getUser.mockResolvedValue(users[0])
    api.deleteUser.mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<AdminUsersPage />)

    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(api.deleteUser).toHaveBeenCalledWith('alice', 'admin')
    })
  })

  it('reconciles the selected user', async () => {
    const user = userEvent.setup()
    api.getUsers.mockResolvedValue(users)
    api.getUser.mockResolvedValue(users[0])
    api.reconcileUser.mockResolvedValue(users[0])

    render(<AdminUsersPage />)

    await user.click(await screen.findByRole('button', { name: 'Reconcile' }))

    await waitFor(() => {
      expect(api.reconcileUser).toHaveBeenCalledWith('alice', 'admin')
    })
  })

  it('shows the admin permission error for 403 responses', async () => {
    api.getUsers.mockRejectedValue(new ApiError('forbidden', 403))

    render(<AdminUsersPage />)

    expect(await screen.findByText('このユーザーIDでは管理操作できません。')).toBeInTheDocument()
  })
})

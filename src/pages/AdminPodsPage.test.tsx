import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AdminPodsPage } from './AdminPodsPage'
import type { EnvironmentBaseImage, UserResponse } from '../types/user'

const users: UserResponse[] = [
  {
    userId: 'alice',
    namespace: 'alice',
    serviceAccount: 'alice-sa',
    deployment: null,
    service: null,
    devcontainerEndpoint: null,
    status: 'USER_READY',
  },
]

const readyUser: UserResponse = {
  ...users[0],
  deployment: 'devcontainer-alice',
  service: 'devcontainer-alice',
  baseImage: 'node-dev',
  status: 'READY',
}

const baseImages: EnvironmentBaseImage[] = [
  {
    id: 'ubuntu-dev',
    label: 'Ubuntu',
    default: true,
  },
  {
    id: 'node-dev',
    label: 'Node.js 22',
  },
]

const api = vi.hoisted(() => ({
  createUserEnvironment: vi.fn(),
  deleteUserEnvironment: vi.fn(),
  getEnvironmentBaseImages: vi.fn(),
  getUser: vi.fn(),
  getUsers: vi.fn(),
  reconcileUser: vi.fn(),
}))

vi.mock('../api/environments', () => ({
  createUserEnvironment: api.createUserEnvironment,
  deleteUserEnvironment: api.deleteUserEnvironment,
  getEnvironmentBaseImages: api.getEnvironmentBaseImages,
}))

vi.mock('../api/users', () => ({
  getUser: api.getUser,
  getUsers: api.getUsers,
  reconcileUser: api.reconcileUser,
}))

vi.mock('../context/useUser', () => ({
  useUser: () => ({ currentUserId: 'admin' }),
}))

describe('AdminPodsPage', () => {
  it('loads users and base images, then shows connection placeholder for USER_READY users', async () => {
    api.getUsers.mockResolvedValue(users)
    api.getEnvironmentBaseImages.mockResolvedValue(baseImages)
    api.getUser.mockResolvedValue(users[0])

    render(<AdminPodsPage />)

    expect(await screen.findByRole('option', { name: 'Ubuntu (default)' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'alice' })).toBeInTheDocument()
    expect(await screen.findByText('USER_READY')).toBeInTheDocument()
    expect(screen.getByText('Create the pod before requesting connection details.')).toBeInTheDocument()
  })

  it('creates an environment with the selected base image id', async () => {
    const user = userEvent.setup()
    api.getUsers.mockResolvedValueOnce(users).mockResolvedValueOnce([readyUser])
    api.getEnvironmentBaseImages.mockResolvedValue(baseImages)
    api.getUser.mockResolvedValueOnce(users[0]).mockResolvedValueOnce(readyUser)
    api.createUserEnvironment.mockResolvedValue(readyUser)

    render(<AdminPodsPage />)

    await user.type(await screen.findByLabelText('userId'), 'alice')
    await user.selectOptions(screen.getByLabelText('baseImage'), 'node-dev')
    await user.click(screen.getByRole('button', { name: 'Create Pod' }))

    await waitFor(() => {
      expect(api.createUserEnvironment).toHaveBeenCalledWith('alice', 'admin', {
        baseImage: 'node-dev',
      })
    })
  })
})

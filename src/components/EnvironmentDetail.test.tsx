import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EnvironmentDetail } from './EnvironmentDetail'
import type { UserResponse } from '../types/user'

const userReadyEnvironment: UserResponse = {
  userId: 'alice',
  namespace: 'alice',
  serviceAccount: 'alice-sa',
  deployment: null,
  service: null,
  devcontainerEndpoint: null,
  status: 'USER_READY',
}

const readyEnvironment: UserResponse = {
  userId: 'alice',
  namespace: 'alice',
  serviceAccount: 'alice-sa',
  deployment: 'devcontainer-alice',
  service: 'devcontainer-alice',
  baseImage: 'node-dev',
  image: 'ghcr.io/example/dev-node:22',
  devcontainerEndpoint: {
    nodePort: 30222,
    sshHost: 'localhost',
  },
  status: 'READY',
}

describe('EnvironmentDetail', () => {
  it('disables pod deletion when the environment is not created', () => {
    render(
      <EnvironmentDetail
        environment={userReadyEnvironment}
        loading={false}
        actionRunning={false}
        onDelete={vi.fn()}
        onReconcile={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Delete Pod' })).toBeDisabled()
    expect(screen.getByText(/Environment is not created yet/)).toBeInTheDocument()
    expect(screen.getByText('USER_READY')).toHaveClass('user-ready')
  })

  it('shows image details and allows deletion when deployment or service exists', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn().mockResolvedValue(undefined)

    render(
      <EnvironmentDetail
        environment={readyEnvironment}
        loading={false}
        actionRunning={false}
        onDelete={onDelete}
        onReconcile={vi.fn()}
      />,
    )

    expect(screen.getByText('node-dev')).toBeInTheDocument()
    expect(screen.getByText('ghcr.io/example/dev-node:22')).toBeInTheDocument()
    expect(screen.getByText('30222')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete Pod' }))
    expect(onDelete).toHaveBeenCalledWith('alice')
  })
})

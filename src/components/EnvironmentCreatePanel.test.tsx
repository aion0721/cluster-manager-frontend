import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EnvironmentCreatePanel } from './EnvironmentCreatePanel'
import type { EnvironmentBaseImage, UserResponse } from '../types/user'

const users: UserResponse[] = [
  {
    userId: 'alice',
    displayName: 'Alice',
    namespace: 'alice',
    serviceAccount: 'alice-sa',
    status: 'USER_READY',
  },
]

const baseImages: EnvironmentBaseImage[] = [
  {
    id: 'ubuntu-dev',
    label: 'Ubuntu',
    description: 'Basic Ubuntu environment',
    default: true,
  },
  {
    id: 'node-dev',
    label: 'Node.js 22',
    description: 'Node.js development tools',
  },
]

describe('EnvironmentCreatePanel', () => {
  it('selects the default base image and submits its id', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(undefined)

    render(
      <EnvironmentCreatePanel
        users={users}
        baseImages={baseImages}
        onCreate={onCreate}
      />,
    )

    await user.type(screen.getByLabelText('userId'), 'alice')
    expect(screen.getByLabelText('baseImage')).toHaveValue('ubuntu-dev')

    await user.click(screen.getByRole('button', { name: 'Create Pod' }))

    expect(onCreate).toHaveBeenCalledWith('alice', 'ubuntu-dev')
  })

  it('submits the selected base image id', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(undefined)

    render(
      <EnvironmentCreatePanel
        users={users}
        baseImages={baseImages}
        onCreate={onCreate}
      />,
    )

    await user.type(screen.getByLabelText('userId'), 'alice')
    await user.selectOptions(screen.getByLabelText('baseImage'), 'node-dev')
    await user.click(screen.getByRole('button', { name: 'Create Pod' }))

    expect(onCreate).toHaveBeenCalledWith('alice', 'node-dev')
  })

  it('omits baseImage when the catalog is empty', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(undefined)

    render(
      <EnvironmentCreatePanel
        users={users}
        baseImages={[]}
        onCreate={onCreate}
      />,
    )

    await user.type(screen.getByLabelText('userId'), 'alice')
    await user.click(screen.getByRole('button', { name: 'Create Pod' }))

    expect(onCreate).toHaveBeenCalledWith('alice', undefined)
  })
})

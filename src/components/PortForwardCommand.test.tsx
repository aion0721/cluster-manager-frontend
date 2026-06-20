import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PortForwardCommand } from './PortForwardCommand'

const api = vi.hoisted(() => ({
  getPortForwardCommand: vi.fn(),
}))

vi.mock('../api/users', () => ({
  getPortForwardCommand: api.getPortForwardCommand,
}))

describe('PortForwardCommand', () => {
  it('does not call the API when no user is selected', () => {
    render(<PortForwardCommand currentUserId="admin" />)

    expect(screen.getByText('Select a user to show the command.')).toBeInTheDocument()
    expect(api.getPortForwardCommand).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled()
  })

  it('loads and copies the port-forward command', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    api.getPortForwardCommand.mockResolvedValue({
      userId: 'alice',
      namespace: 'alice',
      command: 'kubectl -n alice port-forward svc/devcontainer 2222:22',
    })

    render(<PortForwardCommand userId="alice" currentUserId="admin" />)

    expect(
      await screen.findByText('kubectl -n alice port-forward svc/devcontainer 2222:22'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(writeText).toHaveBeenCalledWith(
      'kubectl -n alice port-forward svc/devcontainer 2222:22',
    )
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('shows API errors', async () => {
    api.getPortForwardCommand.mockRejectedValue(new Error('command unavailable'))

    render(<PortForwardCommand userId="alice" currentUserId="admin" />)

    expect(await screen.findByText('command unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled()
  })
})

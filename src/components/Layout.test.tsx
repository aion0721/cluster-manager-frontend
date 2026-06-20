import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { Layout } from './Layout'

const userState = vi.hoisted(() => ({
  value: {
    authMode: 'keycloak',
    authReady: true,
    currentUserId: '',
    login: vi.fn(),
    logout: vi.fn(),
    setCurrentUserId: vi.fn(),
    clearCurrentUserId: vi.fn(),
  },
}))

vi.mock('../context/useUser', () => ({
  useUser: () => userState.value,
}))

describe('Layout', () => {
  it('shows only login in the primary nav when signed out', async () => {
    const user = userEvent.setup()
    userState.value = {
      ...userState.value,
      authMode: 'keycloak',
      authReady: true,
      currentUserId: '',
      login: vi.fn().mockResolvedValue(undefined),
    }

    render(
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link', { name: 'Me' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Login' }))
    expect(userState.value.login).toHaveBeenCalledWith('/')
  })

  it('shows me/admin links when signed in', () => {
    userState.value = {
      ...userState.value,
      authMode: 'keycloak',
      authReady: true,
      currentUserId: 'alice',
      logout: vi.fn(),
    }

    render(
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Me' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument()
  })
})

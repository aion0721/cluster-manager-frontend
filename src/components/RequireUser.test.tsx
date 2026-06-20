import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { RequireUser } from './RequireUser'

const userState = vi.hoisted(() => ({
  value: {
    authMode: 'simple',
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

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}</span>
}

describe('RequireUser', () => {
  it('redirects simple auth users to top when userId is missing', () => {
    userState.value = {
      ...userState.value,
      authMode: 'simple',
      authReady: true,
      currentUserId: '',
    }

    render(
      <MemoryRouter initialEntries={['/me']}>
        <Routes>
          <Route
            path="/me"
            element={
              <RequireUser>
                <div>private</div>
              </RequireUser>
            }
          />
          <Route path="/" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })

  it('shows a Keycloak login prompt when signed out', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/admin/pods')
    userState.value = {
      ...userState.value,
      authMode: 'keycloak',
      authReady: true,
      currentUserId: '',
      login: vi.fn().mockResolvedValue(undefined),
    }

    render(
      <MemoryRouter initialEntries={['/admin/pods']}>
        <RequireUser>
          <div>private</div>
        </RequireUser>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Login' }))
    expect(userState.value.login).toHaveBeenCalledWith('/admin/pods')
  })

  it('renders children when a user is present', () => {
    userState.value = {
      ...userState.value,
      authMode: 'simple',
      authReady: true,
      currentUserId: 'alice',
    }

    render(
      <MemoryRouter>
        <RequireUser>
          <div>private</div>
        </RequireUser>
      </MemoryRouter>,
    )

    expect(screen.getByText('private')).toBeInTheDocument()
  })
})

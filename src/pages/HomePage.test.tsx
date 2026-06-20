import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'

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

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <HomePage />
              <LocationProbe />
            </>
          }
        />
        <Route path="/me" element={<LocationProbe />} />
        <Route path="/admin" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('logs in with a simple userId and navigates to Me', async () => {
    const user = userEvent.setup()
    userState.value = {
      ...userState.value,
      authMode: 'simple',
      currentUserId: '',
      setCurrentUserId: vi.fn(),
    }

    renderHome()

    await user.type(screen.getByLabelText('userId'), 'alice')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(userState.value.setCurrentUserId).toHaveBeenCalledWith('alice')
    expect(screen.getByTestId('location')).toHaveTextContent('/me')
  })

  it('validates simple userId format', async () => {
    const user = userEvent.setup()
    userState.value = {
      ...userState.value,
      authMode: 'simple',
      currentUserId: '',
      setCurrentUserId: vi.fn(),
    }

    renderHome()

    await user.type(screen.getByLabelText('userId'), 'Alice')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(screen.getByText(/Use lowercase letters/)).toBeInTheDocument()
    expect(userState.value.setCurrentUserId).not.toHaveBeenCalled()
  })

  it('shows Me and Admin entry points when already logged in', () => {
    userState.value = {
      ...userState.value,
      authMode: 'simple',
      currentUserId: 'alice',
    }

    renderHome()

    expect(screen.getByRole('button', { name: 'Go to Me' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to Admin' })).toBeInTheDocument()
    expect(screen.queryByLabelText('userId')).not.toBeInTheDocument()
  })

  it('calls Keycloak login when signed out in keycloak mode', async () => {
    const user = userEvent.setup()
    userState.value = {
      ...userState.value,
      authMode: 'keycloak',
      authReady: true,
      currentUserId: '',
      login: vi.fn().mockResolvedValue(undefined),
    }

    renderHome()

    await user.click(screen.getByRole('button', { name: 'Login' }))
    expect(userState.value.login).toHaveBeenCalledWith('/')
  })
})

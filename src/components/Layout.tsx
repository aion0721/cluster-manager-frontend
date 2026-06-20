import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useUser } from '../context/useUser'

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { authMode, authReady, currentUserId, login, logout } = useUser()
  const navigate = useNavigate()

  async function handleLogin() {
    if (authMode === 'keycloak') {
      await login('/')
      return
    }

    navigate('/')
  }

  function handleLogout() {
    logout()
    if (authMode === 'simple') {
      navigate('/')
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Cluster Manager</p>
          <h1>Developer Environment Access</h1>
          <p className="header-user">
            Current userId: <strong>{currentUserId || 'not set'}</strong>
            <span> / auth: {authMode}</span>
          </p>
        </div>
        <nav className="app-nav" aria-label="Primary">
          <NavLink to="/">Top</NavLink>
          {currentUserId ? (
            <>
              <NavLink to="/me">Me</NavLink>
              <NavLink to="/admin">Admin</NavLink>
              <button type="button" className="secondary-button" onClick={handleLogout}>
                {authMode === 'keycloak' ? 'Logout' : 'Change userId'}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={handleLogin}
              disabled={!authReady}
            >
              Login
            </button>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}

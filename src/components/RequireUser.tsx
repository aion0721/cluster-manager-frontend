import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useUser } from '../context/useUser'

type RequireUserProps = {
  children: ReactNode
}

export function RequireUser({ children }: RequireUserProps) {
  const { authMode, authReady, currentUserId, login } = useUser()

  if (!authReady) {
    return <p className="muted-text">認証状態を確認しています。</p>
  }

  if (!currentUserId) {
    if (authMode === 'keycloak') {
      return (
        <section className="card entry-card">
          <div className="section-heading">
            <p className="eyebrow">Login required</p>
            <h2>Keycloak Login</h2>
          </div>
          <button type="button" className="primary-button" onClick={() => login(window.location.pathname)}>
            Login
          </button>
        </section>
      )
    }

    return <Navigate to="/" replace />
  }

  return children
}

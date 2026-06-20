import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/useUser'

const userIdPattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/

export function HomePage() {
  const { authMode, authReady, currentUserId, login, setCurrentUserId } = useUser()
  const [userId, setUserId] = useState(currentUserId)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function enter(path: '/me' | '/admin') {
    const normalizedUserId = userId.trim()
    if (!normalizedUserId) {
      setError('Enter a userId.')
      return
    }

    if (!userIdPattern.test(normalizedUserId)) {
      setError('Use lowercase letters, numbers, and hyphens. The first and last character must be alphanumeric.')
      return
    }

    setCurrentUserId(normalizedUserId)
    navigate(path)
  }

  async function enterWithKeycloak(path: '/me' | '/admin') {
    if (currentUserId) {
      navigate(path)
      return
    }
    await login(path)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    enter('/me')
  }

  if (authMode === 'keycloak') {
    const loggedIn = Boolean(currentUserId)

    return (
      <div className="entry-layout">
        <section className="card entry-card">
          <div className="section-heading">
            <p className="eyebrow">Keycloak Login</p>
            <h2>Cluster Manager</h2>
            <p>
              Keycloakでログインしてから、ユーザー環境と管理機能にアクセスします。
            </p>
          </div>

          {!authReady ? <p className="muted-text">認証状態を確認しています。</p> : null}
          {currentUserId ? (
            <p className="muted-text">ログイン中: {currentUserId}</p>
          ) : null}

          <div className="button-row">
            {loggedIn ? (
              <>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => enterWithKeycloak('/me')}
                  disabled={!authReady}
                >
                  Go to Me
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => enterWithKeycloak('/admin')}
                  disabled={!authReady}
                >
                  Go to Admin
                </button>
              </>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={() => login('/')}
                disabled={!authReady}
              >
                Login
              </button>
            )}
          </div>
        </section>
      </div>
    )
  }

  if (currentUserId) {
    return (
      <div className="entry-layout">
        <section className="card entry-card">
          <div className="section-heading">
            <p className="eyebrow">MVP Login</p>
            <h2>{currentUserId}</h2>
            <p>この userId で操作中です。</p>
          </div>
          <div className="button-row">
            <button type="button" className="primary-button" onClick={() => navigate('/me')}>
              Go to Me
            </button>
            <button type="button" className="secondary-button" onClick={() => navigate('/admin')}>
              Go to Admin
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="entry-layout">
      <section className="card entry-card">
        <div className="section-heading">
          <p className="eyebrow">MVP Login</p>
          <h2>User ID</h2>
          <p>
            This is a temporary MVP user selector, not authentication. Only userId is stored in
            sessionStorage. Tokens and kubectl setup commands are never stored.
          </p>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            <span>userId</span>
            <input
              value={userId}
              onChange={(event) => {
                setUserId(event.target.value)
                setError('')
              }}
              placeholder="koba"
              autoFocus
            />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <div className="button-row">
            <button type="submit" className="primary-button">
              Login
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/useUser'

const userIdPattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/

export function HomePage() {
  const { currentUserId, setCurrentUserId } = useUser()
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    enter('/me')
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
              Go to Me
            </button>
            <button type="button" className="secondary-button" onClick={() => enter('/admin')}>
              Go to Admin
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

import { useState } from 'react'
import type { FormEvent } from 'react'
import type { UserResponse } from '../types/user'

type EnvironmentCreatePanelProps = {
  users: UserResponse[]
  disabled?: boolean
  onCreate: (userId: string) => Promise<void>
}

export function EnvironmentCreatePanel({
  users,
  disabled = false,
  onCreate,
}: EnvironmentCreatePanelProps) {
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const trimmedUserId = userId.trim()
    if (!trimmedUserId) {
      setError('userId is required.')
      return
    }

    await onCreate(trimmedUserId)
  }

  return (
    <section className="card">
      <div className="section-heading">
        <h2>Create Pod</h2>
        <p>Create the dev-container pod and service for an existing user.</p>
      </div>
      <form className="form-stack" onSubmit={handleSubmit}>
        <label>
          <span>userId</span>
          <input
            list="admin-user-options"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="alice"
            disabled={disabled}
          />
        </label>
        <datalist id="admin-user-options">
          {users.map((user) => (
            <option key={user.userId} value={user.userId} />
          ))}
        </datalist>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={disabled}>
          Create Pod
        </button>
      </form>
    </section>
  )
}

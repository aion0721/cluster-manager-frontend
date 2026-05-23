import { useState } from 'react'
import type { FormEvent } from 'react'
import type { CreateUserRequest } from '../types/user'

type UserCreateFormProps = {
  disabled?: boolean
  onCreate: (request: CreateUserRequest) => Promise<void>
}

export function UserCreateForm({ disabled = false, onCreate }: UserCreateFormProps) {
  const [userId, setUserId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const trimmedUserId = userId.trim()
    if (!trimmedUserId) {
      setError('userId is required.')
      return
    }

    await onCreate({
      userId: trimmedUserId,
      displayName: displayName.trim(),
    })
  }

  return (
    <section className="card">
      <div className="section-heading">
        <h2>Create User</h2>
        <p>Provision a namespace, RBAC, workload, and service through Backend APIs.</p>
      </div>
      <form className="form-stack" onSubmit={handleSubmit}>
        <label>
          <span>userId</span>
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="alice"
            disabled={disabled}
          />
        </label>
        <label>
          <span>displayName</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Alice"
            disabled={disabled}
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={disabled}>
          Create
        </button>
      </form>
    </section>
  )
}

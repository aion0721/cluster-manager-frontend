import { useState } from 'react'
import type { FormEvent } from 'react'

const userIdPattern = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/

type UserIdEntryPageProps = {
  storageKey: string
  onEnter: (userId: string) => void
}

export function UserIdEntryPage({ storageKey, onEnter }: UserIdEntryPageProps) {
  const [userId, setUserId] = useState(localStorage.getItem(storageKey) ?? '')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedUserId = userId.trim()
    if (!userIdPattern.test(normalizedUserId)) {
      setError('userId must match ^[a-z0-9]([-a-z0-9]*[a-z0-9])?$.')
      return
    }

    localStorage.setItem(storageKey, normalizedUserId)
    onEnter(normalizedUserId)
  }

  return (
    <div className="entry-layout">
      <section className="card entry-card">
        <div className="section-heading">
          <p className="eyebrow">MVP User Selection</p>
          <h2>ユーザーIDを入力</h2>
          <p>
            この画面は認証ではなく、MVP用の簡易ユーザー指定です。入力した userId は
            API の `X-User-Id` ヘッダーに付与されます。
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
          <button type="submit" className="primary-button">
            入る
          </button>
        </form>
      </section>
    </div>
  )
}

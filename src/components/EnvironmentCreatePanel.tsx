import { useState } from 'react'
import type { FormEvent } from 'react'
import type { EnvironmentBaseImage, UserResponse } from '../types/user'

type EnvironmentCreatePanelProps = {
  users: UserResponse[]
  baseImages: EnvironmentBaseImage[]
  baseImagesLoading?: boolean
  disabled?: boolean
  onCreate: (userId: string, baseImage?: string) => Promise<void>
}

export function EnvironmentCreatePanel({
  users,
  baseImages,
  baseImagesLoading = false,
  disabled = false,
  onCreate,
}: EnvironmentCreatePanelProps) {
  const [userId, setUserId] = useState('')
  const [baseImage, setBaseImage] = useState('')
  const [error, setError] = useState('')
  const defaultBaseImage = baseImages.find((image) => image.default) ?? baseImages[0]
  const selectedBaseImageId = baseImage || defaultBaseImage?.id || ''
  const currentBaseImage = selectedBaseImage(baseImages, selectedBaseImageId)
  const formDisabled = disabled || baseImagesLoading

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const trimmedUserId = userId.trim()
    if (!trimmedUserId) {
      setError('userId is required.')
      return
    }

    await onCreate(trimmedUserId, selectedBaseImageId || undefined)
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
            disabled={formDisabled}
          />
        </label>
        <datalist id="admin-user-options">
          {users.map((user) => (
            <option key={user.userId} value={user.userId} />
          ))}
        </datalist>
        <label>
          <span>baseImage</span>
          <select
            value={selectedBaseImageId}
            onChange={(event) => setBaseImage(event.target.value)}
            disabled={formDisabled || baseImages.length === 0}
          >
            {baseImages.length === 0 ? (
              <option value="">Backend default</option>
            ) : null}
            {baseImages.map((image) => (
              <option key={image.id} value={image.id}>
                {image.label}
                {image.default ? ' (default)' : ''}
              </option>
            ))}
          </select>
        </label>
        {baseImagesLoading ? <p className="muted-text">Loading base images...</p> : null}
        {currentBaseImage ? (
          <div className="inline-info">
            <strong>{currentBaseImage.id}</strong>
            {currentBaseImage.description ? (
              <span>{currentBaseImage.description}</span>
            ) : null}
            {currentBaseImage.image ? (
              <code>{currentBaseImage.image}</code>
            ) : null}
          </div>
        ) : null}
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={formDisabled}>
          Create Pod
        </button>
      </form>
    </section>
  )
}

function selectedBaseImage(baseImages: EnvironmentBaseImage[], id: string) {
  return baseImages.find((image) => image.id === id)
}

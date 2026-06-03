import type { UserResponse } from '../types/user'

type UserDetailProps = {
  user?: UserResponse
  loading: boolean
  actionRunning: boolean
  onDelete: (userId: string) => Promise<void>
  onReconcile: (userId: string) => Promise<void>
}

export function UserDetail({
  user,
  loading,
  actionRunning,
  onDelete,
  onReconcile,
}: UserDetailProps) {
  if (!user) {
    return (
      <section className="card">
        <div className="section-heading">
          <h2>User Detail</h2>
          <p>Select a user to view environment resources.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="card">
      <div className="section-heading split-heading">
        <div>
          <h2>User Detail</h2>
          <p>{loading ? 'Loading selected user...' : user.userId}</p>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onReconcile(user.userId)}
            disabled={actionRunning}
          >
            Reconcile
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={() => onDelete(user.userId)}
            disabled={actionRunning}
          >
            Delete
          </button>
        </div>
      </div>

      <dl className="detail-grid">
        <div>
          <dt>namespace</dt>
          <dd>{user.namespace}</dd>
        </div>
        <div>
          <dt>mode</dt>
          <dd>{user.mode ?? '-'}</dd>
        </div>
        <div>
          <dt>serviceAccount</dt>
          <dd>{user.serviceAccount ?? '-'}</dd>
        </div>
        <div>
          <dt>deployment</dt>
          <dd>{user.deployment ?? '-'}</dd>
        </div>
        <div>
          <dt>service</dt>
          <dd>{user.service ?? '-'}</dd>
        </div>
        <div>
          <dt>status</dt>
          <dd>{user.status ?? user.phase ?? '-'}</dd>
        </div>
        <div>
          <dt>createdAt</dt>
          <dd>{user.createdAt ?? '-'}</dd>
        </div>
        {user.mode === 'container-only' ? (
          <>
            <div>
              <dt>nodePort</dt>
              <dd>{user.devcontainerEndpoint?.nodePort ?? '-'}</dd>
            </div>
            <div>
              <dt>sshHost</dt>
              <dd>{user.devcontainerEndpoint?.sshHost ?? '-'}</dd>
            </div>
          </>
        ) : null}
      </dl>
    </section>
  )
}

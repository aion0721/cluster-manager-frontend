import type { UserResponse } from '../types/user'

type EnvironmentDetailProps = {
  environment?: UserResponse
  loading: boolean
  actionRunning: boolean
  onDelete: (userId: string) => Promise<void>
  onReconcile: (userId: string) => Promise<void>
}

export function EnvironmentDetail({
  environment,
  loading,
  actionRunning,
  onDelete,
  onReconcile,
}: EnvironmentDetailProps) {
  if (!environment) {
    return (
      <section className="card">
        <div className="section-heading">
          <h2>Pod Detail</h2>
          <p>Select a pod record to view dev-container resources.</p>
        </div>
      </section>
    )
  }

  const hasEnvironment = Boolean(
    environment.deployment || environment.service || environment.devcontainerEndpoint,
  )

  return (
    <section className="card">
      <div className="section-heading split-heading">
        <div>
          <h2>Pod Detail</h2>
          <p>{loading ? 'Loading selected pod...' : environment.userId}</p>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onReconcile(environment.userId)}
            disabled={actionRunning}
          >
            Reconcile
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={() => onDelete(environment.userId)}
            disabled={actionRunning || !hasEnvironment}
          >
            Delete Pod
          </button>
        </div>
      </div>

      <dl className="detail-grid">
        <div>
          <dt>userId</dt>
          <dd>{environment.userId}</dd>
        </div>
        <div>
          <dt>namespace</dt>
          <dd>{environment.namespace}</dd>
        </div>
        <div>
          <dt>serviceAccount</dt>
          <dd>{environment.serviceAccount ?? '-'}</dd>
        </div>
        <div>
          <dt>pod</dt>
          <dd>{environment.deployment ?? '-'}</dd>
        </div>
        <div>
          <dt>service</dt>
          <dd>{environment.service ?? '-'}</dd>
        </div>
        <div>
          <dt>baseImage</dt>
          <dd>{environment.baseImage ?? '-'}</dd>
        </div>
        <div>
          <dt>image</dt>
          <dd>{environment.image ?? '-'}</dd>
        </div>
        <div>
          <dt>status</dt>
          <dd>
            <span className={`status-pill ${statusClassName(environment.status ?? environment.phase)}`}>
              {environment.status ?? environment.phase ?? '-'}
            </span>
          </dd>
        </div>
        <div>
          <dt>nodePort</dt>
          <dd>{environment.devcontainerEndpoint?.nodePort ?? '-'}</dd>
        </div>
        <div>
          <dt>sshHost</dt>
          <dd>{environment.devcontainerEndpoint?.sshHost ?? '-'}</dd>
        </div>
      </dl>
      {!hasEnvironment ? (
        <p className="muted-text">
          Environment is not created yet. Create Pod will create the deployment and service.
        </p>
      ) : null}
    </section>
  )
}

function statusClassName(status?: string) {
  return (status ?? 'UNKNOWN').toLowerCase().replaceAll('_', '-')
}

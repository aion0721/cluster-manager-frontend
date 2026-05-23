import type {
  ProvisioningStep,
  ProvisioningStepStatus,
  ProvisioningStepStatusValue,
} from '../types/provisioning'

const statusIcons: Record<ProvisioningStepStatusValue, string> = {
  PENDING: '⬜',
  RUNNING: '⏳',
  DONE: '✅',
  FAILED: '❌',
  SKIPPED: '⏭️',
}

type ProvisioningStepsPanelProps = {
  steps: ProvisioningStep[]
  statuses: ProvisioningStepStatus[]
  running: boolean
  failed: boolean
  error?: string
  onRetry: () => Promise<void>
}

export function ProvisioningStepsPanel({
  steps,
  statuses,
  running,
  failed,
  error,
  onRetry,
}: ProvisioningStepsPanelProps) {
  const statusByKey = new Map(statuses.map((status) => [status.key, status]))
  const orderedSteps = [...steps].sort((a, b) => a.order - b.order)

  return (
    <section className="card">
      <div className="section-heading split-heading">
        <div>
          <h2>Provisioning Steps</h2>
          <p>Steps are loaded from Backend and executed in order.</p>
        </div>
        {failed ? (
          <button type="button" className="secondary-button" onClick={onRetry} disabled={running}>
            Retry
          </button>
        ) : null}
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      <ol className="step-list">
        {orderedSteps.map((step) => {
          const current = statusByKey.get(step.key)
          const status = current?.status ?? 'PENDING'

          return (
            <li key={step.key} className={`step-item ${status.toLowerCase()}`}>
              <div className="status-icon" aria-hidden="true">
                {statusIcons[status]}
              </div>
              <div>
                <div className="step-title-row">
                  <strong>{current?.label ?? step.label}</strong>
                  <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>
                </div>
                <p>{step.description || `${step.method} ${step.endpointTemplate}`}</p>
                {current?.message ? <p className="muted-text">{current.message}</p> : null}
                {current?.error ? <p className="error-text">{current.error}</p> : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

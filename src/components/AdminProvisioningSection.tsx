import { useEffect, useMemo, useState } from 'react'
import { getProvisioningSteps } from '../api/provisioningSteps'
import { runProvisioningStep } from '../api/users'
import { useUser } from '../context/useUser'
import type { ProvisioningStep, ProvisioningStepStatus } from '../types/provisioning'
import type { CreateUserRequest } from '../types/user'
import { ProvisioningStepsPanel } from './ProvisioningStepsPanel'
import { UserCreateForm } from './UserCreateForm'

export function AdminProvisioningSection() {
  const { currentUserId } = useUser()
  const [steps, setSteps] = useState<ProvisioningStep[]>([])
  const [statuses, setStatuses] = useState<ProvisioningStepStatus[]>([])
  const [lastRequest, setLastRequest] = useState<CreateUserRequest>()
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const failed = useMemo(
    () => statuses.some((status) => status.status === 'FAILED'),
    [statuses],
  )

  async function loadSteps() {
    const response = await getProvisioningSteps(currentUserId)
    const ordered = [...response].sort((a, b) => a.order - b.order)
    setSteps(ordered)
    return ordered
  }

  function initializeStatuses(orderedSteps: ProvisioningStep[]) {
    setStatuses(
      orderedSteps.map((step) => ({
        key: step.key,
        label: step.label,
        status: 'PENDING',
      })),
    )
  }

  function patchStatus(key: string, patch: Partial<ProvisioningStepStatus>) {
    setStatuses((current) =>
      current.map((status) => (status.key === key ? { ...status, ...patch } : status)),
    )
  }

  async function runCreateFlow(request: CreateUserRequest, retryFailedOnly = false) {
    setRunning(true)
    setError('')
    setMessage('')
    setLastRequest(request)

    try {
      const orderedSteps = steps.length ? steps : await loadSteps()

      if (!retryFailedOnly) {
        initializeStatuses(orderedSteps)
      }

      const failedIndex = statuses.findIndex((status) => status.status === 'FAILED')
      const startIndex = retryFailedOnly && failedIndex >= 0 ? failedIndex : 0

      for (const step of orderedSteps.slice(startIndex)) {
        const endpoint = step.endpointTemplate.replaceAll('{userId}', request.userId)
        patchStatus(step.key, {
          status: 'RUNNING',
          message: `${step.method} ${endpoint}`,
          error: undefined,
        })

        try {
          await runProvisioningStep(request.userId, step, currentUserId)
          patchStatus(step.key, {
            status: 'DONE',
            message: 'Completed.',
          })
        } catch (caught) {
          const stepError = caught instanceof Error ? caught.message : 'Provisioning step failed.'
          patchStatus(step.key, {
            status: 'FAILED',
            error: stepError,
          })
          setError(`${step.label} failed: ${stepError}`)
          return
        }
      }

      setMessage(`User environment "${request.userId}" was provisioned.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to provision user.')
    } finally {
      setRunning(false)
    }
  }

  async function handleRetry() {
    if (!lastRequest) {
      setError('Retry target is not available.')
      return
    }

    await runCreateFlow(lastRequest, true)
  }

  useEffect(() => {
    let cancelled = false

    void getProvisioningSteps(currentUserId)
      .then((response) => {
        if (!cancelled) {
          setSteps([...response].sort((a, b) => a.order - b.order))
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Failed to load provisioning steps.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [currentUserId])

  return (
    <section className="admin-section">
      <div className="section-heading">
        <p className="eyebrow">Admin</p>
        <h2>ユーザー環境作成</h2>
        <p>
          管理者向けの作成導線です。Backend から取得した provisioning steps を順番に呼び出します。
        </p>
      </div>

      {message ? <p className="success-banner">{message}</p> : null}

      <div className="admin-grid">
        <UserCreateForm disabled={running} onCreate={runCreateFlow} />
        <ProvisioningStepsPanel
          steps={steps}
          statuses={statuses}
          running={running}
          failed={failed}
          error={error}
          onRetry={handleRetry}
        />
      </div>
    </section>
  )
}

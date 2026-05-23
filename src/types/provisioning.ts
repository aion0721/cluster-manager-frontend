export type ProvisioningStep = {
  key: string
  label: string
  description?: string
  method: string
  endpointTemplate: string
  order: number
}

export type ProvisioningStepStatusValue =
  | 'PENDING'
  | 'RUNNING'
  | 'DONE'
  | 'FAILED'
  | 'SKIPPED'

export type ProvisioningStepStatus = {
  key: string
  label: string
  status: ProvisioningStepStatusValue
  message?: string
  error?: string
}

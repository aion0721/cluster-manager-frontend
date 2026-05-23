import { apiRequest } from './client'
import type { ProvisioningStep } from '../types/provisioning'

export function getProvisioningSteps() {
  return apiRequest<ProvisioningStep[]>('/api/provisioning-steps')
}

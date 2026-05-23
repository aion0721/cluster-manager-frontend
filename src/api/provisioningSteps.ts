import { apiRequest } from './client'
import type { ProvisioningStep } from '../types/provisioning'

export function getProvisioningSteps(userId?: string) {
  return apiRequest<ProvisioningStep[]>('/api/provisioning-steps', { userId })
}

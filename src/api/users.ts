import { apiRequest } from './client'
import type { ProvisioningStep } from '../types/provisioning'
import type {
  CreateUserRequest,
  PortForwardCommandResponse,
  UserResponse,
} from '../types/user'

export function getUsers() {
  return apiRequest<UserResponse[]>('/api/users')
}

export function getUser(userId: string) {
  return apiRequest<UserResponse>(`/api/users/${encodeURIComponent(userId)}`)
}

export function createUser(request: CreateUserRequest) {
  return apiRequest<UserResponse>('/api/users', {
    method: 'POST',
    body: request,
  })
}

export function deleteUser(userId: string) {
  return apiRequest<void>(`/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
}

export function reconcileUser(userId: string) {
  return apiRequest<UserResponse>(
    `/api/users/${encodeURIComponent(userId)}/reconcile`,
    { method: 'POST' },
  )
}

export function runProvisioningStep(userId: string, step: ProvisioningStep) {
  const endpoint = step.endpointTemplate.replaceAll(
    '{userId}',
    encodeURIComponent(userId),
  )

  return apiRequest<unknown>(endpoint, {
    method: step.method || 'POST',
  })
}

export function getPortForwardCommand(userId: string) {
  return apiRequest<PortForwardCommandResponse>(
    `/api/users/${encodeURIComponent(userId)}/port-forward-command`,
  )
}

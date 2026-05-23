import { apiRequest } from './client'
import type { ProvisioningStep } from '../types/provisioning'
import type {
  CreateUserRequest,
  PortForwardCommandResponse,
  UserResponse,
} from '../types/user'

export function getUsers(currentUserId: string) {
  return apiRequest<UserResponse[]>('/api/users', { userId: currentUserId })
}

export function getUser(userId: string, currentUserId: string) {
  return apiRequest<UserResponse>(`/api/users/${encodeURIComponent(userId)}`, {
    userId: currentUserId,
  })
}

export function createUser(request: CreateUserRequest, currentUserId: string) {
  return apiRequest<UserResponse>('/api/users', {
    method: 'POST',
    body: request,
    userId: currentUserId,
  })
}

export function deleteUser(userId: string, currentUserId: string) {
  return apiRequest<void>(`/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    userId: currentUserId,
  })
}

export function reconcileUser(userId: string, currentUserId: string) {
  return apiRequest<UserResponse>(
    `/api/users/${encodeURIComponent(userId)}/reconcile`,
    { method: 'POST', userId: currentUserId },
  )
}

export function runProvisioningStep(
  userId: string,
  step: ProvisioningStep,
  currentUserId: string,
) {
  const endpoint = step.endpointTemplate.replaceAll(
    '{userId}',
    encodeURIComponent(userId),
  )

  return apiRequest<unknown>(endpoint, {
    method: step.method || 'POST',
    userId: currentUserId,
  })
}

export function getPortForwardCommand(userId: string, currentUserId: string) {
  return apiRequest<PortForwardCommandResponse>(
    `/api/users/${encodeURIComponent(userId)}/port-forward-command`,
    { userId: currentUserId },
  )
}

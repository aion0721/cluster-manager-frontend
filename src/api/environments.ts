import { apiRequest } from './client'
import type {
  CreateEnvironmentRequest,
  EnvironmentBaseImage,
  UserResponse,
} from '../types/user'

export function getEnvironmentBaseImages(currentUserId: string) {
  return apiRequest<EnvironmentBaseImage[]>('/api/environment-base-images', {
    userId: currentUserId,
  })
}

export function createUserEnvironment(
  userId: string,
  currentUserId: string,
  request: CreateEnvironmentRequest = {},
) {
  return apiRequest<UserResponse>(
    `/api/users/${encodeURIComponent(userId)}/environment`,
    {
      method: 'POST',
      body: request,
      userId: currentUserId,
    },
  )
}

export function deleteUserEnvironment(userId: string, currentUserId: string) {
  return apiRequest<void>(
    `/api/users/${encodeURIComponent(userId)}/environment`,
    { method: 'DELETE', userId: currentUserId },
  )
}

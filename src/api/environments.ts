import { apiRequest } from './client'
import type { UserResponse } from '../types/user'

export function createUserEnvironment(userId: string, currentUserId: string) {
  return apiRequest<UserResponse>(
    `/api/users/${encodeURIComponent(userId)}/environment`,
    { method: 'POST', userId: currentUserId },
  )
}

export function deleteUserEnvironment(userId: string, currentUserId: string) {
  return apiRequest<void>(
    `/api/users/${encodeURIComponent(userId)}/environment`,
    { method: 'DELETE', userId: currentUserId },
  )
}

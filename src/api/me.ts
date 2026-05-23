import { apiRequest } from './client'
import type {
  ConnectionGuide,
  CurrentUserResponse,
  KubectlSetupCommandResponse,
  ServiceAccountTokenResponse,
} from '../types/me'

function userHeaders(userId: string) {
  return {
    'X-User-Id': userId,
  }
}

export function getMe(userId: string) {
  return apiRequest<CurrentUserResponse>('/api/me', {
    headers: userHeaders(userId),
  })
}

export function getConnectionGuide(userId: string) {
  return apiRequest<ConnectionGuide>('/api/me/connection-guide', {
    headers: userHeaders(userId),
  })
}

export function issueToken(userId: string) {
  return apiRequest<ServiceAccountTokenResponse>('/api/me/token', {
    method: 'POST',
    headers: userHeaders(userId),
  })
}

export function getKubectlSetupCommand(userId: string) {
  return apiRequest<KubectlSetupCommandResponse>('/api/me/kubectl-setup-command', {
    method: 'POST',
    headers: userHeaders(userId),
  })
}

export const createToken = issueToken

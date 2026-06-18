import { apiRequest } from './client'
import type {
  ConnectionGuide,
  CurrentUserResponse,
  KubectlSetupCommandResponse,
  ServiceAccountTokenResponse,
} from '../types/me'

export function getMe(userId: string) {
  return apiRequest<CurrentUserResponse>('/api/me', {
    userId,
  })
}

export function getConnectionGuide(userId: string) {
  return apiRequest<ConnectionGuide>('/api/me/connection-guide', {
    userId,
  })
}

export function issueToken(userId: string) {
  return apiRequest<ServiceAccountTokenResponse>('/api/me/token', {
    method: 'POST',
    userId,
  })
}

export function getKubectlSetupCommand(userId: string) {
  return apiRequest<KubectlSetupCommandResponse>('/api/me/kubectl-setup-command', {
    method: 'POST',
    userId,
  })
}

export const createToken = issueToken

import { ApiError } from '../api/client'

export function adminErrorMessage(caught: unknown, fallback: string) {
  if (caught instanceof ApiError && caught.status === 403) {
    return 'このユーザーIDでは管理操作できません。'
  }

  return caught instanceof Error ? caught.message : fallback
}

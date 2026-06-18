import { createContext } from 'react'
import type { AuthMode } from '../auth/config'

export type UserContextValue = {
  authMode: AuthMode
  authReady: boolean
  currentUserId: string
  login: (returnPath?: string) => Promise<void>
  logout: () => void
  setCurrentUserId: (userId: string) => void
  clearCurrentUserId: () => void
}

export const UserContext = createContext<UserContextValue | undefined>(undefined)

import { createContext } from 'react'

export type UserContextValue = {
  currentUserId: string
  setCurrentUserId: (userId: string) => void
  clearCurrentUserId: () => void
}

export const UserContext = createContext<UserContextValue | undefined>(undefined)

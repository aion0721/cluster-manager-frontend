import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { USER_ID_STORAGE_KEY } from '../api/client'
import { UserContext } from './userContextValue'

type UserProviderProps = {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [currentUserId, setCurrentUserIdState] = useState(
    () => sessionStorage.getItem(USER_ID_STORAGE_KEY) ?? '',
  )

  function setCurrentUserId(userId: string) {
    sessionStorage.setItem(USER_ID_STORAGE_KEY, userId)
    setCurrentUserIdState(userId)
  }

  function clearCurrentUserId() {
    sessionStorage.removeItem(USER_ID_STORAGE_KEY)
    setCurrentUserIdState('')
  }

  const value = useMemo(
    () => ({ currentUserId, setCurrentUserId, clearCurrentUserId }),
    [currentUserId],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

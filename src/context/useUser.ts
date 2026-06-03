import { useContext } from 'react'
import { UserContext } from './userContextValue'

export function useUser() {
  const value = useContext(UserContext)
  if (!value) {
    throw new Error('useUser must be used within UserProvider.')
  }

  return value
}

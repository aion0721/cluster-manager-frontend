import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

type RequireUserProps = {
  children: ReactNode
}

export function RequireUser({ children }: RequireUserProps) {
  const { currentUserId } = useUser()

  if (!currentUserId) {
    return <Navigate to="/" replace />
  }

  return children
}

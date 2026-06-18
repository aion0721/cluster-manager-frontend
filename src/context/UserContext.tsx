import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { setAccessTokenProvider, USER_ID_STORAGE_KEY } from '../api/client'
import { authMode, isKeycloakAuthMode } from '../auth/config'
import {
  clearStoredTokenSet,
  completeLoginCallback,
  getStoredTokenSet,
  getUserIdFromToken,
  logoutFromKeycloak,
  startLogin,
} from '../auth/oidc'
import { UserContext } from './userContextValue'

type UserProviderProps = {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [accessToken, setAccessToken] = useState<string>()
  const [idToken, setIdToken] = useState<string>()
  const [authReady, setAuthReady] = useState(authMode === 'simple')
  const [currentUserId, setCurrentUserIdState] = useState(
    () => authMode === 'simple' ? sessionStorage.getItem(USER_ID_STORAGE_KEY) ?? '' : '',
  )

  useEffect(() => {
    setAccessTokenProvider(() => accessToken)
  }, [accessToken])

  useEffect(() => {
    if (!isKeycloakAuthMode) {
      return
    }

    let cancelled = false

    void Promise.resolve().then(async () => {
      try {
        const callbackTokenSet = await completeLoginCallback()
        const tokenSet = callbackTokenSet ?? getStoredTokenSet()
        if (!tokenSet || cancelled) {
          return
        }

        setAccessToken(tokenSet.accessToken)
        setIdToken(tokenSet.idToken)
        setCurrentUserIdState(getUserIdFromToken(tokenSet.accessToken))
      } finally {
        if (!cancelled) {
          setAuthReady(true)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const setCurrentUserId = useCallback((userId: string) => {
    if (isKeycloakAuthMode) {
      return
    }
    sessionStorage.setItem(USER_ID_STORAGE_KEY, userId)
    setCurrentUserIdState(userId)
  }, [])

  const clearCurrentUserId = useCallback(() => {
    if (isKeycloakAuthMode) {
      clearStoredTokenSet()
      setAccessToken(undefined)
      setIdToken(undefined)
      setCurrentUserIdState('')
      return
    }
    sessionStorage.removeItem(USER_ID_STORAGE_KEY)
    setCurrentUserIdState('')
  }, [])

  const login = useCallback(async (returnPath = '/me') => {
    if (!isKeycloakAuthMode) {
      return
    }
    await startLogin(returnPath)
  }, [])

  const logout = useCallback(() => {
    if (isKeycloakAuthMode) {
      logoutFromKeycloak(idToken)
      setAccessToken(undefined)
      setIdToken(undefined)
      setCurrentUserIdState('')
      return
    }
    clearCurrentUserId()
  }, [clearCurrentUserId, idToken])

  const value = useMemo(
    () => ({
      authMode,
      authReady,
      currentUserId,
      login,
      logout,
      setCurrentUserId,
      clearCurrentUserId,
    }),
    [authReady, clearCurrentUserId, currentUserId, login, logout, setCurrentUserId],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

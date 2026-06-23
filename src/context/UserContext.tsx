import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { setAccessTokenProvider, USER_ID_STORAGE_KEY } from '../api/client'
import { authMode, isKeycloakAuthMode } from '../auth/config'
import {
  type OidcTokenSet,
  clearStoredTokenSet,
  completeLoginCallback,
  getStoredTokenSet,
  getUserIdFromToken,
  logoutFromKeycloak,
  refreshAccessToken,
  startLogin,
} from '../auth/oidc'
import { UserContext } from './userContextValue'

type UserProviderProps = {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [tokenSet, setTokenSet] = useState<OidcTokenSet>()
  const [authReady, setAuthReady] = useState(authMode === 'simple')
  const [currentUserId, setCurrentUserIdState] = useState(
    () => authMode === 'simple' ? sessionStorage.getItem(USER_ID_STORAGE_KEY) ?? '' : '',
  )

  useEffect(() => {
    setAccessTokenProvider(() => tokenSet?.accessToken)
  }, [tokenSet])

  const applyTokenSet = useCallback((nextTokenSet: OidcTokenSet) => {
    setAccessTokenProvider(() => nextTokenSet.accessToken)
    setTokenSet(nextTokenSet)
    setCurrentUserIdState(getUserIdFromToken(nextTokenSet.accessToken))
  }, [])

  useEffect(() => {
    if (!isKeycloakAuthMode) {
      return
    }

    let cancelled = false

    void Promise.resolve().then(async () => {
      try {
        const callbackTokenSet = await completeLoginCallback()
        const storedTokenSet = callbackTokenSet ?? getStoredTokenSet()
        if (!storedTokenSet || cancelled) {
          return
        }

        const activeTokenSet =
          storedTokenSet.expiresAt <= Date.now() && storedTokenSet.refreshToken
            ? await refreshAccessToken(storedTokenSet)
            : storedTokenSet

        if (!cancelled) {
          applyTokenSet(activeTokenSet)
        }
      } catch {
        if (!cancelled) {
          clearStoredTokenSet()
          setAccessTokenProvider(() => undefined)
          setTokenSet(undefined)
          setCurrentUserIdState('')
        }
      } finally {
        if (!cancelled) {
          setAuthReady(true)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [applyTokenSet])

  useEffect(() => {
    if (!isKeycloakAuthMode || !tokenSet) {
      return
    }

    let cancelled = false
    const refreshMarginMs = 30_000
    const delay = Math.max(tokenSet.expiresAt - Date.now() - refreshMarginMs, 0)

    const timer = window.setTimeout(() => {
      if (!tokenSet.refreshToken) {
        clearStoredTokenSet()
        setAccessTokenProvider(() => undefined)
        setTokenSet(undefined)
        setCurrentUserIdState('')
        return
      }

      void refreshAccessToken(tokenSet)
        .then((refreshedTokenSet) => {
          if (!cancelled) {
            applyTokenSet(refreshedTokenSet)
          }
        })
        .catch(() => {
          if (!cancelled) {
            clearStoredTokenSet()
            setAccessTokenProvider(() => undefined)
            setTokenSet(undefined)
            setCurrentUserIdState('')
          }
        })
    }, delay)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [applyTokenSet, tokenSet])

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
      setAccessTokenProvider(() => undefined)
      setTokenSet(undefined)
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
      setAccessTokenProvider(() => undefined)
      logoutFromKeycloak(tokenSet?.idToken)
      setTokenSet(undefined)
      setCurrentUserIdState('')
      return
    }
    clearCurrentUserId()
  }, [clearCurrentUserId, tokenSet?.idToken])

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

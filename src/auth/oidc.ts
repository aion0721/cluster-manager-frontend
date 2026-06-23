import { keycloakConfig, requireKeycloakConfig } from './config'

export type OidcTokenSet = {
  accessToken: string
  idToken?: string
  refreshToken?: string
  expiresAt: number
  refreshExpiresAt?: number
}

const callbackStateKey = 'cluster-manager.oidc.state'
const codeVerifierKey = 'cluster-manager.oidc.codeVerifier'
const tokenSetKey = 'cluster-manager.oidc.tokenSet'

export function getStoredTokenSet(): OidcTokenSet | undefined {
  const raw = sessionStorage.getItem(tokenSetKey)
  if (!raw) {
    return undefined
  }

  try {
    const tokenSet = JSON.parse(raw) as OidcTokenSet
    if (!tokenSet.accessToken) {
      clearStoredTokenSet()
      return undefined
    }

    if (tokenSet.refreshExpiresAt && tokenSet.refreshExpiresAt <= Date.now()) {
      clearStoredTokenSet()
      return undefined
    }

    if (!tokenSet.refreshToken && tokenSet.expiresAt <= Date.now()) {
      clearStoredTokenSet()
      return undefined
    }

    return tokenSet
  } catch {
    clearStoredTokenSet()
    return undefined
  }
}

export function storeTokenSet(tokenSet: OidcTokenSet) {
  sessionStorage.setItem(tokenSetKey, JSON.stringify(tokenSet))
}

export function clearStoredTokenSet() {
  sessionStorage.removeItem(tokenSetKey)
}

export function getUserIdFromToken(accessToken: string) {
  const claims = parseJwtClaims(accessToken)
  const userId = claims.preferred_username ?? claims.name ?? claims.sub
  return typeof userId === 'string' ? userId : ''
}

export async function startLogin(returnPath: string) {
  requireKeycloakConfig()

  const state = randomString()
  const codeVerifier = randomString()
  const codeChallenge = await sha256Base64Url(codeVerifier)

  sessionStorage.setItem(callbackStateKey, JSON.stringify({ state, returnPath }))
  sessionStorage.setItem(codeVerifierKey, codeVerifier)

  const params = new URLSearchParams({
    client_id: keycloakConfig.clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: keycloakConfig.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  window.location.assign(`${keycloakConfig.authServerUrl}/protocol/openid-connect/auth?${params}`)
}

export async function completeLoginCallback() {
  requireKeycloakConfig()

  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (!code || !state) {
    return undefined
  }

  const storedCallbackState = readCallbackState()
  const codeVerifier = sessionStorage.getItem(codeVerifierKey)
  if (!storedCallbackState || storedCallbackState.state !== state || !codeVerifier) {
    throw new Error('Invalid login callback state.')
  }

  const response = await fetch(`${keycloakConfig.authServerUrl}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: keycloakConfig.clientId,
      code,
      redirect_uri: redirectUri(),
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`)
  }

  const payload = await response.json() as {
    access_token: string
    id_token?: string
    refresh_token?: string
    expires_in?: number
    refresh_expires_in?: number
  }
  const tokenSet = tokenSetFromPayload(payload)

  storeTokenSet(tokenSet)
  sessionStorage.removeItem(callbackStateKey)
  sessionStorage.removeItem(codeVerifierKey)
  window.history.replaceState({}, document.title, storedCallbackState.returnPath)

  return tokenSet
}

export async function refreshAccessToken(tokenSet: OidcTokenSet) {
  requireKeycloakConfig()

  if (!tokenSet.refreshToken) {
    throw new Error('Refresh token is not available.')
  }

  const response = await fetch(`${keycloakConfig.authServerUrl}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: keycloakConfig.clientId,
      refresh_token: tokenSet.refreshToken,
    }),
  })

  if (!response.ok) {
    clearStoredTokenSet()
    throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`)
  }

  const payload = await response.json() as {
    access_token: string
    id_token?: string
    refresh_token?: string
    expires_in?: number
    refresh_expires_in?: number
  }
  const refreshedTokenSet = tokenSetFromPayload(payload, tokenSet)

  storeTokenSet(refreshedTokenSet)
  return refreshedTokenSet
}

export function logoutFromKeycloak(idToken?: string) {
  clearStoredTokenSet()

  if (!keycloakConfig.authServerUrl) {
    return
  }

  const params = new URLSearchParams({
    client_id: keycloakConfig.clientId,
    post_logout_redirect_uri: window.location.origin,
  })
  if (idToken) {
    params.set('id_token_hint', idToken)
  }

  window.location.assign(`${keycloakConfig.authServerUrl}/protocol/openid-connect/logout?${params}`)
}

function readCallbackState() {
  const raw = sessionStorage.getItem(callbackStateKey)
  if (!raw) {
    return undefined
  }

  try {
    return JSON.parse(raw) as { state: string, returnPath: string }
  } catch {
    return undefined
  }
}

function redirectUri() {
  return window.location.origin + '/'
}

function tokenSetFromPayload(
  payload: {
    access_token: string
    id_token?: string
    refresh_token?: string
    expires_in?: number
    refresh_expires_in?: number
  },
  previousTokenSet?: OidcTokenSet,
): OidcTokenSet {
  const now = Date.now()
  const refreshToken = payload.refresh_token ?? previousTokenSet?.refreshToken

  return {
    accessToken: payload.access_token,
    idToken: payload.id_token ?? previousTokenSet?.idToken,
    refreshToken,
    expiresAt: now + Math.max((payload.expires_in ?? 300) - 15, 0) * 1000,
    refreshExpiresAt: payload.refresh_expires_in
      ? now + Math.max(payload.refresh_expires_in - 15, 0) * 1000
      : previousTokenSet?.refreshExpiresAt,
  }
}

function parseJwtClaims(token: string) {
  const [, payload] = token.split('.')
  if (!payload) {
    return {}
  }

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return JSON.parse(atob(padded)) as Record<string, unknown>
}

function randomString() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return base64Url(bytes)
}

async function sha256Base64Url(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return base64Url(new Uint8Array(digest))
}

function base64Url(bytes: Uint8Array) {
  let value = ''
  bytes.forEach((byte) => {
    value += String.fromCharCode(byte)
  })
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./config', () => ({
  keycloakConfig: {
    authServerUrl: 'https://keycloak.example.com/realms/dev',
    clientId: 'cluster-manager',
    scope: 'openid profile email',
  },
  requireKeycloakConfig: vi.fn(),
}))

import {
  clearStoredTokenSet,
  completeLoginCallback,
  getStoredTokenSet,
  refreshAccessToken,
  storeTokenSet,
} from './oidc'

const tokenSetKey = 'cluster-manager.oidc.tokenSet'

describe('oidc token storage and refresh', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    sessionStorage.clear()
    window.history.replaceState({}, '', '/')
    clearStoredTokenSet()
  })

  it('stores refresh token returned by the login callback', async () => {
    vi.setSystemTime(new Date('2026-06-23T00:00:00Z'))
    sessionStorage.setItem(
      'cluster-manager.oidc.state',
      JSON.stringify({ state: 'state-1', returnPath: '/me' }),
    )
    sessionStorage.setItem('cluster-manager.oidc.codeVerifier', 'verifier-1')
    window.history.replaceState({}, '', '/?code=code-1&state=state-1')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: 'access-1',
            id_token: 'id-1',
            refresh_token: 'refresh-1',
            expires_in: 300,
            refresh_expires_in: 3600,
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const tokenSet = await completeLoginCallback()

    expect(tokenSet?.refreshToken).toBe('refresh-1')
    expect(tokenSet?.expiresAt).toBe(Date.now() + 285_000)
    expect(tokenSet?.refreshExpiresAt).toBe(Date.now() + 3_585_000)
    expect(getStoredTokenSet()?.refreshToken).toBe('refresh-1')
    expect(window.location.pathname).toBe('/me')
  })

  it('keeps an expired access token when a refresh token is still valid', () => {
    vi.setSystemTime(new Date('2026-06-23T00:00:00Z'))
    storeTokenSet({
      accessToken: 'expired-access',
      refreshToken: 'refresh-1',
      expiresAt: Date.now() - 1000,
      refreshExpiresAt: Date.now() + 3600_000,
    })

    expect(getStoredTokenSet()?.refreshToken).toBe('refresh-1')
  })

  it('refreshes the access token and stores the rotated refresh token', async () => {
    vi.setSystemTime(new Date('2026-06-23T00:00:00Z'))
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'access-2',
          refresh_token: 'refresh-2',
          expires_in: 600,
          refresh_expires_in: 3600,
        }),
        { headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const tokenSet = await refreshAccessToken({
      accessToken: 'access-1',
      idToken: 'id-1',
      refreshToken: 'refresh-1',
      expiresAt: Date.now() - 1000,
      refreshExpiresAt: Date.now() + 3600_000,
    })

    expect(tokenSet).toMatchObject({
      accessToken: 'access-2',
      idToken: 'id-1',
      refreshToken: 'refresh-2',
    })
    expect(getStoredTokenSet()?.accessToken).toBe('access-2')

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(String(init.body)).toContain('grant_type=refresh_token')
    expect(String(init.body)).toContain('refresh_token=refresh-1')
  })

  it('clears stored tokens when the refresh token is expired', () => {
    sessionStorage.setItem(
      tokenSetKey,
      JSON.stringify({
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        expiresAt: Date.now() - 1000,
        refreshExpiresAt: Date.now() - 1000,
      }),
    )

    expect(getStoredTokenSet()).toBeUndefined()
    expect(sessionStorage.getItem(tokenSetKey)).toBeNull()
  })
})

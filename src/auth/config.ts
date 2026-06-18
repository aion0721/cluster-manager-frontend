export type AuthMode = 'simple' | 'keycloak'

export const authMode: AuthMode =
  import.meta.env.VITE_AUTH_MODE === 'keycloak' ? 'keycloak' : 'simple'

export const isSimpleAuthMode = authMode === 'simple'
export const isKeycloakAuthMode = authMode === 'keycloak'

export const keycloakConfig = {
  authServerUrl: trimTrailingSlash(import.meta.env.VITE_KEYCLOAK_AUTH_SERVER_URL ?? ''),
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'cluster-manager',
  scope: import.meta.env.VITE_KEYCLOAK_SCOPE ?? 'openid profile email',
}

export function requireKeycloakConfig() {
  if (!keycloakConfig.authServerUrl) {
    throw new Error('VITE_KEYCLOAK_AUTH_SERVER_URL is required when VITE_AUTH_MODE=keycloak.')
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

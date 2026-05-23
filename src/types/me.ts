export type CurrentUserResponse = {
  userId: string
  displayName?: string
  namespace: string
  phase?: string
  serviceAccount?: string
  deployment?: string
  service?: string
  status?: string
  createdAt?: string
}

export type ConnectionGuide = {
  namespace: string
  serviceAccount: string
  portForwardCommand: string
}

export type ServiceAccountTokenResponse = {
  token: string
  namespace: string
  serviceAccount: string
  expiresAt: string
}

export type KubectlSetupCommandResponse = {
  namespace: string
  serviceAccount: string
  clusterName: string
  contextName: string
  credentialName: string
  expiresAt: string
  powershell: string
  bash: string
}

export type MeResponse = CurrentUserResponse
export type ConnectionGuideResponse = ConnectionGuide

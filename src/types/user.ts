import type { DevcontainerEndpoint, ProvisioningMode } from './me'

export type CreateUserRequest = {
  userId: string
  displayName: string
}

export type UserResponse = {
  userId: string
  displayName?: string
  namespace: string
  mode?: ProvisioningMode
  devcontainerEndpoint?: DevcontainerEndpoint | null
  phase?: string
  serviceAccount?: string
  deployment?: string
  service?: string
  status?: string
  createdAt?: string
  labels?: Record<string, string>
  annotations?: Record<string, string>
}

export type PortForwardCommandResponse = {
  userId: string
  namespace: string
  command: string
}

import type { DevcontainerEndpoint, ProvisioningMode } from './me'

export type CreateUserRequest = {
  userId: string
  displayName: string
}

export type CreateEnvironmentRequest = {
  baseImage?: string
}

export type EnvironmentBaseImage = {
  id: string
  label: string
  description?: string | null
  default?: boolean
  image?: string | null
}

export type UserStatus =
  | 'READY'
  | 'USER_READY'
  | 'PARTIAL'
  | 'MISSING'
  | 'DELETING'
  | string

export type UserResponse = {
  userId: string
  displayName?: string | null
  namespace: string
  mode?: ProvisioningMode
  devcontainerEndpoint?: DevcontainerEndpoint | null
  phase?: string
  serviceAccount?: string | null
  deployment?: string | null
  service?: string | null
  baseImage?: string | null
  image?: string | null
  status?: UserStatus
  createdAt?: string
  labels?: Record<string, string>
  annotations?: Record<string, string>
}

export type PortForwardCommandResponse = {
  userId: string
  namespace: string
  command: string
}

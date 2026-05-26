export type LoginSharingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

export type LoginSharingRequest = {
  requestId: string
  externalAgentName: string
  externalAgentEmail: string
  status: LoginSharingStatus
  requestedAt: string
  expiresAt: string
  respondedAt: string | null
  reason: string | null
}

export type CreateLoginSharingRequestPayload = {
  externalAgentName: string
  externalAgentEmail: string
  userEmail: string
}

export type LoginSharingResponsePayload = {
  approved: boolean
  reason: string
}

export type SharedUserDataResponse = {
  email: string
  nomeCompleto: string
  telefone: string
  status: string
  message: string
}

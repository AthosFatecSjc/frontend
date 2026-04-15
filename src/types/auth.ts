export type UserStatus = 'ATIVO' | 'PENDENTE' | 'REJEITADO'

export type LoginResultType = 'success' | 'pending' | 'rejected' | 'invalid'

export interface PendingTerm {
  termId: string
  type: string
  version: number
  required: boolean
}

export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  userId: string
  email: string
  nome: string
  role?: string | null
}

export interface BackendAuthError {
  timestamp: string
  status: number
  code: string
  message: string
  severity: string
  reason: string | null
  details?: {
    redirect?: string
    pendingTerms?: PendingTerm[]
  } | null
}

export interface LoginResult {
  type: LoginResultType
  message: string
  auth?: LoginResponse
  nextRoute?: string
}

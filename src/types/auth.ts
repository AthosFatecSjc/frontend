export type UserStatus = 'PENDENTE' | 'ATIVO' | 'REJEITADO'
export type UserRole = 'USER' | 'ADMIN'

export interface StoredUser {
  id: string
  nome: string
  email: string
  senhaHash: string
  status: UserStatus
  role: UserRole
}

export interface LogEntry {
  id: string
  userId: string
  userName: string
  action: string
  timestamp: string
  details?: string
}

export type LoginResultType = 'success' | 'pending' | 'rejected' | 'invalid'

export interface LoginResult {
  type: LoginResultType
  message: string
  user?: StoredUser
  nextRoute?: string
}

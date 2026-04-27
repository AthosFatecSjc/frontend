import type { BackendAuthError, LoginResponse, LoginResult } from '../types/auth'
import { API_BASE_URL } from './api'

const ACCESS_TOKEN_STORAGE_KEY = 'accessToken'
const AUTH_USER_STORAGE_KEY = 'authUser'

type StoredAuthUser = Pick<LoginResponse, 'userId' | 'email' | 'nome' | 'role'>

export function isAdminRole(role?: string | null) {
  if (!role) return false

  return ['ADMIN', 'ADM', 'ADMINISTRADOR'].includes(role.trim().toUpperCase())
}

export function hasAdminAccess() {
  return isAdminRole(getAuthUser()?.role)
}

function normalizeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    const message = error.message.trim()
    const normalizedMessage = message.toLowerCase()

    if (normalizedMessage.includes('review') && normalizedMessage.includes('term')) {
      return 'Ha termos vigentes pendentes. Revise-os antes de entrar na plataforma.'
    }

    return message
  }

  return fallback
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
}

export function getAuthUser(): StoredAuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as StoredAuthUser
  } catch {
    return null
  }
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  localStorage.removeItem(AUTH_USER_STORAGE_KEY)
}

export function storeAuthSession(payload: LoginResponse) {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, payload.accessToken)
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify({
    userId: payload.userId,
    email: payload.email,
    nome: payload.nome,
    role: payload.role ?? null,
  }))
}

export function createAuthHeaders() {
  const token = getAccessToken()

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      senha,
    }),
  })

  if (response.ok) {
    return parseJsonResponse<LoginResponse>(response)
  }

  const errorBody = await parseJsonResponse<BackendAuthError>(response)
  const error = new Error(errorBody.message || 'Falha ao realizar login.')
  Object.assign(error, {
    status: response.status,
    code: errorBody.code,
    reason: errorBody.reason,
    details: errorBody.details,
  })
  throw error
}

export async function loginWithStorage(email: string, senha: string): Promise<LoginResult> {
  clearAuthSession()

  try {
    const auth = await login(email, senha)
    storeAuthSession(auth)

    return {
      type: 'success',
      message: 'Login realizado com sucesso.',
      auth,
      nextRoute: '/minha-conta',
    }
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error
      ? Number(error.status)
      : 0
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : ''
    const reason = typeof error === 'object' && error !== null && 'reason' in error && error.reason
      ? String(error.reason)
      : undefined
    const details = typeof error === 'object' && error !== null && 'details' in error
      ? (error.details as BackendAuthError['details'])
      : undefined

    if (status === 401) {
      return {
        type: 'invalid',
        message: 'Credenciais invalidas. Verifique seu e-mail e senha.',
      }
    }

    if (status === 403 && code === 'USER_PENDING_APPROVAL') {
      return {
        type: 'pending',
        message: 'Seu cadastro esta pendente de aprovacao. Aguarde a analise do administrador.',
      }
    }

    if (status === 403 && code === 'USER_REJECTED') {
      return {
        type: 'rejected',
        message: reason
          ? `Seu acesso foi rejeitado. Motivo: ${reason}.`
          : 'Seu acesso foi rejeitado. Entre em contato com o administrador para mais informacoes.',
      }
    }

    if (status === 403 && code === 'INVALID_USER_STATUS') {
      return {
        type: 'invalid',
        message: 'Seu cadastro nao esta com status ativo. Entre em contato com o administrador.',
      }
    }

    return {
      type: 'invalid',
      message: normalizeErrorMessage(error, 'Nao foi possivel realizar login.'),
    }
  }
}

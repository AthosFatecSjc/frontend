import type { ConsentimentosVigentesResponse } from '../types/cadastro'
import type { LoginResponse,  } from '../types/auth'
import { API_BASE_URL } from './api'
import { getAuthUser } from './authService'
import type { Terms } from '@/types/terms'

const ACCESS_TOKEN_STORAGE_KEY = 'accessToken'
const AUTH_USER_STORAGE_KEY = 'authUser'

type ResolvePendingTermsPayload = {
  senha: string
  requiredTermsIds: string[]
  optionalAcceptedTermsIds: string[]
}

export async function buscarDocumentosVigentes(): Promise<ConsentimentosVigentesResponse> {
  const response = await fetch(`${API_BASE_URL}/documentos/consentimentos/vigentes`)

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar os documentos vigentes.')
  }

  return response.json() as Promise<ConsentimentosVigentesResponse>
}

export async function getPendingTerms(): Promise<Terms[]> {
  const authUser = getAuthUser()

  if (!authUser) {
    throw new Error('Usuario nao autenticado.')
  }

  const response = await fetch(`${API_BASE_URL}/users/${authUser.userId}/terms/pending`);

  if (!response.ok) {
    throw new Error('Nao foi possivel verificar os termos pendentes.')
  }

  return await response.json()
}

export async function resolverPendenciasDeTermos(
  payload: ResolvePendingTermsPayload,
): Promise<LoginResponse> {
  const authUser = getAuthUser()

  if (!authUser || !authUser.email) throw new Error('Usuario nao autenticado.')

  clearSessaoAutenticada()

  const response = await fetch(`${API_BASE_URL}/auth/terms/pending/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      email: authUser.email
    }),
  })

  if (!response.ok) {
    let errorBody: Record<string, unknown> = {}

    try {
      errorBody = await response.json() as Record<string, unknown>
    } catch {
      errorBody = {}
    }

    const error = new Error(
      String(errorBody.message ?? errorBody.mensagem ?? 'Nao foi possivel concluir a revisao dos termos.'),
    )
    Object.assign(error, {
      status: response.status,
      code: String(errorBody.code ?? errorBody.erro ?? ''),
    })
    throw error
  }

  const auth = await response.json() as LoginResponse
  storeSessaoAutenticada(auth)
  return auth
}

function clearSessaoAutenticada() {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  localStorage.removeItem(AUTH_USER_STORAGE_KEY)
}

function storeSessaoAutenticada(payload: LoginResponse) {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, payload.accessToken)
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify({
    userId: payload.userId,
    email: payload.email,
    nome: payload.nome,
  }))
}

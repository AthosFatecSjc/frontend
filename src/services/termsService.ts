import type { ConsentimentosVigentesResponse } from '../types/cadastro'
import type { LoginResponse, PendingTerm } from '../types/auth'
import { API_BASE_URL } from './api'

const PENDING_TERMS_CONTEXT_KEY = 'pendingTermsContext'
const ACCESS_TOKEN_STORAGE_KEY = 'accessToken'
const AUTH_USER_STORAGE_KEY = 'authUser'

export type PendingTermsContext = {
  email: string
  pendingTerms: PendingTerm[]
}

type ResolvePendingTermsPayload = {
  email: string
  senha: string
  requiredTermsIds: string[]
  optionalAcceptedTermsIds: string[]
}

export function storePendingTermsContext(context: PendingTermsContext) {
  sessionStorage.setItem(PENDING_TERMS_CONTEXT_KEY, JSON.stringify(context))
}

export function getPendingTermsContext(): PendingTermsContext | null {
  const raw = sessionStorage.getItem(PENDING_TERMS_CONTEXT_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as PendingTermsContext
  } catch {
    return null
  }
}

export function clearPendingTermsContext() {
  sessionStorage.removeItem(PENDING_TERMS_CONTEXT_KEY)
}

export async function buscarDocumentosVigentes(): Promise<ConsentimentosVigentesResponse> {
  const response = await fetch(`${API_BASE_URL}/documentos/consentimentos/vigentes`)

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar os documentos vigentes.')
  }

  return response.json() as Promise<ConsentimentosVigentesResponse>
}

export async function resolverPendenciasDeTermos(
  payload: ResolvePendingTermsPayload,
): Promise<LoginResponse> {
  clearSessaoAutenticada()

  const response = await fetch(`${API_BASE_URL}/auth/terms/pending/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
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
  clearPendingTermsContext()
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

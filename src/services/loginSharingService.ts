import type {
  CreateLoginSharingRequestPayload,
  LoginSharingRequest,
  LoginSharingResponsePayload,
  SharedUserDataResponse,
} from '@/types/loginSharing'
import { API_BASE_URL, createProtectedJsonRequest, parseApiResponse } from './api'

const API_URL = `${API_BASE_URL}/usuarios/login-sharing`

function createUserAuthRequest(tokenOverride?: string, init?: RequestInit): RequestInit {
  if (tokenOverride?.trim()) {
    return {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOverride.trim()}`,
        ...init?.headers,
      },
    }
  }

  return createProtectedJsonRequest(init)
}

export async function createLoginSharingRequest(payload: CreateLoginSharingRequestPayload) {
  const response = await fetch(`${API_URL}/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseApiResponse<LoginSharingRequest>(
    response,
    'Nao foi possivel criar a solicitacao de compartilhamento de login.',
  )
}

export async function getPendingLoginSharingRequests(tokenOverride?: string) {
  const response = await fetch(
    `${API_URL}/pending`,
    createUserAuthRequest(tokenOverride),
  )

  return parseApiResponse<LoginSharingRequest[]>(
    response,
    'Nao foi possivel carregar as solicitacoes pendentes.',
  )
}

export async function getLoginSharingConsent(requestId: string, tokenOverride?: string) {
  const response = await fetch(
    `${API_URL}/${requestId}/consent`,
    createUserAuthRequest(tokenOverride),
  )

  return parseApiResponse<LoginSharingRequest>(
    response,
    'Nao foi possivel carregar os detalhes da solicitacao.',
  )
}

export async function respondLoginSharingRequest(
  requestId: string,
  payload: LoginSharingResponsePayload,
  tokenOverride?: string,
) {
  const response = await fetch(
    `${API_URL}/${requestId}/respond`,
    createUserAuthRequest(tokenOverride, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  )

  return parseApiResponse<LoginSharingRequest>(
    response,
    'Nao foi possivel enviar a resposta da solicitacao.',
  )
}

export async function getLoginSharingUserData(requestId: string) {
  const response = await fetch(`${API_URL}/${requestId}/user-data`)

  return parseApiResponse<SharedUserDataResponse>(
    response,
    'Nao foi possivel recuperar os dados compartilhados do usuario.',
  )
}

export async function getLoginSharingHistory(tokenOverride?: string) {
  const response = await fetch(
    `${API_URL}/history`,
    createUserAuthRequest(tokenOverride),
  )

  return parseApiResponse<LoginSharingRequest[]>(
    response,
    'Nao foi possivel carregar o historico de compartilhamentos.',
  )
}

export async function revokeLoginSharingRequest(requestId: string, tokenOverride?: string) {
  const response = await fetch(
    `${API_URL}/${requestId}/revoke`,
    createUserAuthRequest(tokenOverride, {
      method: 'POST',
    }),
  )

  return parseApiResponse<LoginSharingRequest>(
    response,
    'Nao foi possivel revogar a solicitacao.',
  )
}

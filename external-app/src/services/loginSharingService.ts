import type {
  CreateLoginSharingRequestPayload,
  LoginSharingRequest,
} from '@/types/loginSharing'
import { API_BASE_URL, parseApiResponse } from './api'

const API_URL = `${API_BASE_URL}/usuarios/login-sharing`

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

export async function getPublicLoginSharingRequestStatus(requestId: string, publicToken?: string | null) {
  const path = `${API_URL}/public/${encodeURIComponent(requestId)}`
  let urlString: string

  try {
    // If API_URL is absolute this will succeed; otherwise fall back to relative fetch
    const tmp = new URL(path)
    if (publicToken) tmp.searchParams.set('token', publicToken)
    urlString = tmp.toString()
  } catch (err) {
    // API_URL is likely relative (e.g. '/api'), use relative URL string and append token if present
    urlString = path
    if (publicToken) urlString += (urlString.includes('?') ? '&' : '?') + `token=${encodeURIComponent(publicToken)}`
  }

  const response = await fetch(urlString, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return parseApiResponse<LoginSharingRequest>(
    response,
    'Nao foi possivel obter o status publico da solicitacao de login-sharing.',
  )
}

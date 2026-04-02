import type { MinhaContaResponse, MinhaContaUpdateRequest } from '@/types/minhaConta'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Falha ao processar a requisição.'

    try {
      const errorBody = await response.json()
      message = errorBody.message ?? errorBody.error ?? message
    } catch {
      message = response.statusText || message
    }

    if (response.status === 401) {
      throw new Error('O backend exige um usuário autenticado para carregar esta tela.')
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function fetchMinhaConta() {
  const response = await fetch('/api/usuarios/minha-conta', {
    credentials: 'include',
  })

  return parseResponse<MinhaContaResponse>(response)
}

export async function updateMinhaConta(payload: MinhaContaUpdateRequest) {
  const response = await fetch('/api/usuarios/minha-conta', {
    method: 'PUT',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  return parseResponse<MinhaContaResponse>(response)
}

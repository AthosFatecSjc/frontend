import type { MinhaContaResponse, MinhaContaUpdateRequest } from '@/types/minhaConta'
import { API_BASE_URL, createProtectedJsonRequest, parseApiResponse } from './api'

export async function fetchMinhaConta() {
  const response = await fetch(
    `${API_BASE_URL}/usuarios/minha-conta`,
    createProtectedJsonRequest(),
  )

  return parseApiResponse<MinhaContaResponse>(response, 'Não foi possível carregar os dados da conta.')
}

export async function updateMinhaConta(payload: MinhaContaUpdateRequest) {
  const response = await fetch(
    `${API_BASE_URL}/usuarios/minha-conta`,
    createProtectedJsonRequest({
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  )

  return parseApiResponse<MinhaContaResponse>(response, 'Não foi possível atualizar os dados da conta.')
}

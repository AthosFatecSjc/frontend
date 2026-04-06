import type {
  ConsentimentosVigentesResponse,
  UsuarioCadastroRequest,
  UsuarioCadastroResponse,
} from '../types/cadastro'
import { API_BASE_URL } from './api'

export async function buscarConsentimentosVigentes(): Promise<ConsentimentosVigentesResponse> {
  const response = await fetch(`${API_BASE_URL}/documentos/consentimentos/vigentes`)

  if (!response.ok) {
    let errorBody: Record<string, unknown> = {}

    try {
      errorBody = await response.json() as Record<string, unknown>
    } catch {
      errorBody = {}
    }

    const error = new Error(
      String(errorBody.message ?? errorBody.mensagem ?? 'Não foi possível carregar o Termo de Uso e o Aviso de Privacidade.'),
    )
    Object.assign(error, {
      status: response.status,
      code: String(errorBody.code ?? errorBody.erro ?? ''),
    })
    throw error
  }

  return response.json() as Promise<ConsentimentosVigentesResponse>
}

export async function cadastrarUsuario(payload: UsuarioCadastroRequest): Promise<UsuarioCadastroResponse> {
  const response = await fetch(`${API_BASE_URL}/usuarios/cadastro`, {
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

    const error = new Error(String(errorBody.message ?? errorBody.mensagem ?? 'Erro ao enviar cadastro.'))
    Object.assign(error, {
      status: response.status,
      code: String(errorBody.code ?? errorBody.erro ?? ''),
    })
    throw error
  }

  return response.json() as Promise<UsuarioCadastroResponse>
}

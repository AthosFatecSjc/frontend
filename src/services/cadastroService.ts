import axios from 'axios'

import type {
  ConsentimentosVigentesResponse,
  UsuarioCadastroRequest,
  UsuarioCadastroResponse,
} from '../types/cadastro'

export async function buscarConsentimentosVigentes(): Promise<ConsentimentosVigentesResponse> {
  const { data } = await axios.get<ConsentimentosVigentesResponse>('/api/documentos/consentimentos/vigentes')
  return data
}

export async function cadastrarUsuario(payload: UsuarioCadastroRequest): Promise<UsuarioCadastroResponse> {
  const { data } = await axios.post<UsuarioCadastroResponse>('/api/usuarios/cadastro', payload)
  return data
}

export interface ConsentimentoDocumento {
  documentId: string
  type: string
  version: number
  content: string
  required: boolean
}

export interface ConsentimentosVigentesResponse {
  terms: ConsentimentoDocumento
  privacy: ConsentimentoDocumento
  marketing: ConsentimentoDocumento | null
}

export interface UsuarioCadastroRequest {
  nomeCompleto: string
  email: string
  senha: string
  telefone?: string
  termsIds: string[]
}

export interface UsuarioCadastroResponse {
  mensagem: string
  email: string
  status: string
}

export interface BackendErrorResponse {
  erro?: string
  mensagem?: string
}

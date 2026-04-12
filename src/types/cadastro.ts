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
  marketing: ConsentimentoDocumento
}

export interface UsuarioCadastroRequest {
  nomeCompleto: string
  email: string
  senha: string
  telefone?: string
  terms: AcceptedTerm[]
}

export interface AcceptedTerm {
  id: string
  version: number
}

export interface UsuarioCadastroResponse {
  mensagem: string
  email: string
  status: string
}

export interface BackendErrorResponse {
  status?: number
  code?: string
  message?: string
  reason?: string | null
  erro?: string
  mensagem?: string
}

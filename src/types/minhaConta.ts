export type StatusConta = 'ATIVO' | 'PENDENTE' | 'REJEITADO' | 'APROVADO' | string | null

export interface MinhaContaResponse {
  nomeCompleto: string | null
  email: string | null
  telefone: string | null
  status: StatusConta
  dataCadastro: string | null
}

export interface MinhaContaUpdateRequest {
  nomeCompleto?: string | null
  telefone?: string | null
}

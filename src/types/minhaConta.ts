export type OfficialStatusConta = 'ATIVO' | 'PENDENTE' | 'REJEITADO'
export type StatusConta = OfficialStatusConta | null
export type StatusContaApi = OfficialStatusConta | string | null

export interface MinhaContaResponse {
  nomeCompleto: string | null
  email: string | null
  telefone: string | null
  status: StatusContaApi
  dataCadastro: string | null
}

export interface MinhaContaUpdateRequest {
  nomeCompleto?: string | null
  telefone?: string | null
}

export type DadoPrevisao = {
  data: string // ISO date format
  valor: number
  tipo: 'real' | 'previsao'
  intervaloInferior?: number
  intervaloSuperior?: number
}

export type DadoPrevisaoAgrupado = {
  data: string
  valorReal?: number
  valorPrevisao?: number
  intervaloInferior?: number
  intervaloSuperior?: number
}

export type ResultadoPrevisao = {
  indicador: 'DEC' | 'FEC'
  distribuidora: string
  conjuntoId: string
  conjuntoNome: string
  dados: DadoPrevisaoAgrupado[]
  ultimoValorHistorico: number
  previsaoMedia: number
}

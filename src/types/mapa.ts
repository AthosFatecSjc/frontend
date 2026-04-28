export type Criticidade = 'baixo' | 'moderado' | 'alto' | 'ausente'

export type Indicador = {
  id: string
  label: string
  valor: number
  limite: number
}

export type Conjunto = {
  id: string
  nome: string
  distribuidora: string
  estado: string
  subestacao: string
  criticidade: Criticidade
  indicadorPrincipal: Indicador
  indicadoresPrincipais: Indicador[]
  complementares: Indicador[]
  periodoReferencia: string
  geometry: GeoJSON.Geometry
}

export type FiltrosMapa = {
  ano: string
  distribuidora: string
  estado: string
  conjunto: string
  subestacao: string
}

export type CriticidadeMeta = Record<Criticidade, {
  label: string
  descricao: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
}>

export type MapaCalorApiResponse = {
  anosDisponiveis: number[]
  conjuntos: Conjunto[]
}

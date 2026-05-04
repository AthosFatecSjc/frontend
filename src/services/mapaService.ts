import { API_BASE_URL, createProtectedJsonRequest, parseApiResponse } from './api'
import type { Conjunto, Criticidade, CriticidadeMeta, MapaCalorApiResponse } from '@/types/mapa'

type MapaCalorServiceResponse = {
  conjuntos: Conjunto[]
  anosDisponiveis: string[]
}

const EMPTY_GEOJSON: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
  type: 'FeatureCollection',
  features: [],
}

const MUNICIPIOS_LAYER_TYPE_NAME = 'CCAR:BC250_2025_lml_municipio_a'

const UF_GEOCODIGO_PREFIX: Record<string, string> = {
  RO: '11',
  AC: '12',
  AM: '13',
  RR: '14',
  PA: '15',
  AP: '16',
  TO: '17',
  MA: '21',
  PI: '22',
  CE: '23',
  RN: '24',
  PB: '25',
  PE: '26',
  AL: '27',
  SE: '28',
  BA: '29',
  MG: '31',
  ES: '32',
  RJ: '33',
  SP: '35',
  PR: '41',
  SC: '42',
  RS: '43',
  MS: '50',
  MT: '51',
  GO: '52',
  DF: '53',
}

type RawIndicador = {
  id?: string
  label?: string
  valor?: number | null
  limite?: number | null
}

type RawConjunto = Omit<Conjunto, 'criticidade' | 'geometry' | 'indicadorPrincipal' | 'indicadoresPrincipais' | 'complementares'> & {
  criticidade: string
  geometry: GeoJSON.Geometry | null
  indicadorPrincipal: RawIndicador | null
  indicadoresPrincipais: RawIndicador[]
  complementares: RawIndicador[]
}

function toNumber(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }

  return value
}

function normalizeCriticidade(value: string): Criticidade {
  if (value === 'baixo' || value === 'moderado' || value === 'alto' || value === 'ausente') {
    return value
  }

  return 'ausente'
}

function toIndicador(raw: RawIndicador | null | undefined, fallback: { id: string, label: string }) {
  return {
    id: raw?.id ?? fallback.id,
    label: raw?.label ?? fallback.label,
    valor: toNumber(raw?.valor),
    limite: toNumber(raw?.limite),
  }
}

function normalizeConjunto(raw: RawConjunto): Conjunto | null {
  if (!raw.geometry) {
    return null
  }

  return {
    id: String(raw.id ?? ''),
    nome: raw.nome ?? 'Conjunto sem nome',
    distribuidora: raw.distribuidora ?? 'Distribuidora nao informada',
    estado: (raw.estado ?? 'N/A').toUpperCase(),
    subestacao: raw.subestacao ?? 'Nao informado',
    criticidade: normalizeCriticidade(raw.criticidade),
    indicadorPrincipal: toIndicador(raw.indicadorPrincipal, { id: 'dec', label: 'DEC' }),
    indicadoresPrincipais: (raw.indicadoresPrincipais ?? []).map((item, index) =>
      toIndicador(item, { id: `principal-${index}`, label: `Indicador ${index + 1}` }),
    ),
    complementares: (raw.complementares ?? []).map((item, index) =>
      toIndicador(item, { id: `complementar-${index}`, label: `Complementar ${index + 1}` }),
    ),
    periodoReferencia: raw.periodoReferencia ?? 'Sem referencia',
    geometry: raw.geometry,
  }
}

export async function fetchMapaCalorData(ano?: string): Promise<MapaCalorServiceResponse> {
  const params = new URLSearchParams()
  if (ano) {
    params.set('ano', ano)
  }

  const query = params.toString()
  const response = await fetch(`${API_BASE_URL}/indicadores/mapa-calor${query ? `?${query}` : ''}`, createProtectedJsonRequest())

  const payload = await parseApiResponse<MapaCalorApiResponse>(
    response,
    'Nao foi possivel carregar os dados do mapa de calor.',
  )

  const conjuntos = (payload.conjuntos as RawConjunto[])
    .map(normalizeConjunto)
    .filter((item): item is Conjunto => item !== null)

  const anosDisponiveis = (payload.anosDisponiveis ?? []).map((item) => String(item))

  return {
    conjuntos,
    anosDisponiveis,
  }
}

async function fetchMunicipiosByUf(uf: string): Promise<GeoJSON.FeatureCollection<GeoJSON.Geometry>> {
  const geocodigoPrefix = UF_GEOCODIGO_PREFIX[uf]

  if (!geocodigoPrefix) {
    return EMPTY_GEOJSON
  }

  const url = new URL('https://geoservicos.ibge.gov.br/geoserver/ows')
  url.searchParams.set('service', 'WFS')
  url.searchParams.set('version', '1.0.0')
  url.searchParams.set('request', 'GetFeature')
  url.searchParams.set('typeName', MUNICIPIOS_LAYER_TYPE_NAME)
  url.searchParams.set('outputFormat', 'application/json')
  url.searchParams.set('CQL_FILTER', `geocodigo LIKE '${geocodigoPrefix}%'`)

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Falha ao carregar municipios para ${uf}.`)
  }

  const payload = await response.json()

  if (payload?.type !== 'FeatureCollection' || !Array.isArray(payload.features)) {
    throw new Error(`Resposta invalida ao carregar municipios para ${uf}.`)
  }

  return payload as GeoJSON.FeatureCollection<GeoJSON.Geometry>
}

export async function fetchMunicipiosLayer(ufs: string[]): Promise<GeoJSON.FeatureCollection<GeoJSON.Geometry>> {
  const uniqueUfs = Array.from(new Set(ufs.map((item) => item.trim().toUpperCase()).filter((item) => item.length === 2)))

  if (!uniqueUfs.length) {
    return EMPTY_GEOJSON
  }

  const results = await Promise.allSettled(uniqueUfs.map((uf) => fetchMunicipiosByUf(uf)))

  const features: GeoJSON.Feature<GeoJSON.Geometry>[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      features.push(...(result.value.features ?? []))
    }
  }

  return {
    type: 'FeatureCollection',
    features,
  }
}

export const criticidadeMeta: CriticidadeMeta = {
  baixo: {
    label: 'Dentro do limite',
    descricao: 'Abaixo de 50% do limite',
    tone: 'success',
  },
  moderado: {
    label: 'Zona de atencao',
    descricao: 'Entre 50% e 100% do limite',
    tone: 'warning',
  },
  alto: {
    label: 'Acima do limite',
    descricao: 'Acima de 100% do limite',
    tone: 'danger',
  },
  ausente: {
    label: 'Indicador ausente',
    descricao: 'Indicador indisponivel no recorte',
    tone: 'neutral',
  },
}

export const legendItems = [
  { status: 'baixo', title: 'Verde', descricao: 'Abaixo de 50% do limite' },
  { status: 'moderado', title: 'Amarelo', descricao: 'Entre 50% e 100% do limite' },
  { status: 'alto', title: 'Vermelho', descricao: 'Acima de 100% do limite' },
  { status: 'ausente', title: 'Ausente', descricao: 'Indicador indisponivel' },
] as const

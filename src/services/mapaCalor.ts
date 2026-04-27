import { API_BASE_URL, createProtectedJsonRequest, parseApiResponse } from './api'

export type Criticidade = 'verde' | 'amarelo' | 'vermelho' | 'ausente'

type AnyGeoProperties = Record<string, unknown>

export interface MapaCriticidadeApiItem {
  nomeConjunto: string
  distribuidora: string | null
  estado: string | null
  dec: number | null
  fec: number | null
  decLim: number | null
  fecLim: number | null
  indiceCriticidadePercentual: number | null
  faixa: string | null
  geometryJson: string | null
}

export interface MapaFeatureProperties {
  nome: string
  distribuidora: string
  estado: string
  conjunto: string
  subestacao: string
  municipio?: string
  dec?: number | null
  dec_limite?: number | null
  fec?: number | null
  fec_limite?: number | null
  criticidade_percentual?: number | null
  faixa?: string | null
}

export interface MapaFeature {
  type: 'Feature'
  geometry: {
    type: string
    coordinates: unknown
  }
  properties: MapaFeatureProperties
}

export interface MapaFeatureCollection {
  type: 'FeatureCollection'
  features: MapaFeature[]
}

export interface MapaCalorData {
  municipios: MapaFeatureCollection
  conjuntos: MapaFeatureCollection
}

export interface MapaCalorFilters {
  mes: number
  ano: number
  nomeConjunto?: string
}

const FALLBACK_MUNICIPIOS: MapaFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        nome: 'Manaus',
        distribuidora: 'Amazonas Energia',
        estado: 'AM',
        conjunto: 'FLORES',
        subestacao: 'SE Flores',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-60.157, -3.035],
          [-59.948, -3.035],
          [-59.948, -2.945],
          [-60.157, -2.945],
          [-60.157, -3.035],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        nome: 'Iranduba',
        distribuidora: 'Amazonas Energia',
        estado: 'AM',
        conjunto: 'IRANDUBA',
        subestacao: 'SE Iranduba',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-60.210, -3.115],
          [-60.004, -3.115],
          [-60.004, -3.035],
          [-60.210, -3.035],
          [-60.210, -3.115],
        ]],
      },
    },
  ],
}

const FALLBACK_CONJUNTOS: MapaFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        nome: 'Conjunto Flores',
        distribuidora: 'Amazonas Energia',
        estado: 'AM',
        conjunto: 'FLORES',
        subestacao: 'SE Flores',
        municipio: 'Manaus',
        dec: 7.68,
        dec_limite: 6.5,
        fec: 3.68,
        fec_limite: 3.2,
        criticidade_percentual: 116,
        faixa: 'vermelho',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-60.112, -3.008],
          [-60.012, -3.008],
          [-60.012, -2.958],
          [-60.112, -2.958],
          [-60.112, -3.008],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        nome: 'Conjunto Iranduba Norte',
        distribuidora: 'Amazonas Energia',
        estado: 'AM',
        conjunto: 'IRANDUBA',
        subestacao: 'SE Iranduba',
        municipio: 'Iranduba',
        dec: 2.91,
        dec_limite: 6.5,
        fec: 1.42,
        fec_limite: 3.2,
        criticidade_percentual: 44,
        faixa: 'verde',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-60.170, -3.090],
          [-60.050, -3.090],
          [-60.050, -3.045],
          [-60.170, -3.045],
          [-60.170, -3.090],
        ]],
      },
    },
  ],
}

function isFeatureCollection(value: unknown): value is MapaFeatureCollection {
  if (!value || typeof value !== 'object') {
    return false
  }

  const maybeCollection = value as Partial<MapaFeatureCollection>
  return maybeCollection.type === 'FeatureCollection' && Array.isArray(maybeCollection.features)
}

function toNormalizedName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toUpperCase()
}

function isMapaCriticidadeApiItem(value: unknown): value is MapaCriticidadeApiItem {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<MapaCriticidadeApiItem>
  return typeof candidate.nomeConjunto === 'string'
}

function asString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return ''
}

function pickProperty(properties: AnyGeoProperties, aliases: string[]): string {
  for (const alias of aliases) {
    const value = asString(properties[alias])
    if (value) {
      return value
    }
  }

  return ''
}

function normalizeMunicipioFeature(feature: MapaFeature): MapaFeature {
  const properties = (feature.properties ?? {}) as unknown as AnyGeoProperties

  const nome = pickProperty(properties, [
    'nome',
    'NOME',
    'municipio',
    'MUNICIPIO',
    'NM_MUN',
    'NOME_MUN',
    'NOME_MUNICIPIO',
  ])

  return {
    ...feature,
    properties: {
      nome: nome || 'Municipio sem nome',
      distribuidora: pickProperty(properties, ['distribuidora', 'DISTRIBUIDORA']) || 'N/D',
      estado: pickProperty(properties, ['estado', 'UF', 'uf']) || 'N/D',
      conjunto: pickProperty(properties, ['conjunto', 'CONJUNTO']) || 'N/D',
      subestacao: pickProperty(properties, ['subestacao', 'SUBESTACAO']) || 'N/D',
      municipio: nome || 'N/D',
    },
  }
}

function normalizeConjuntoFeature(feature: MapaFeature): MapaFeature {
  const properties = (feature.properties ?? {}) as unknown as AnyGeoProperties

  const nomeConjunto = pickProperty(properties, [
    'conjunto',
    'CONJUNTO',
    'nome',
    'NOME',
    'DscConjUndConsumidoras',
    'dsc_conj_und_consumidoras',
    'DSC_CONJ_UND_CONSUMIDORAS',
  ])

  return {
    ...feature,
    properties: {
      nome: pickProperty(properties, ['nome', 'NOME']) || nomeConjunto || 'Conjunto sem nome',
      distribuidora: pickProperty(properties, ['distribuidora', 'DISTRIBUIDORA', 'razao_social', 'RAZAO_SOCIAL']) || 'N/D',
      estado: pickProperty(properties, ['estado', 'uf', 'UF']) || 'N/D',
      conjunto: nomeConjunto || 'Conjunto sem nome',
      subestacao: pickProperty(properties, ['subestacao', 'SUBESTACAO']) || 'N/D',
      municipio: pickProperty(properties, ['municipio', 'MUNICIPIO']) || undefined,
      dec: parseUnknownNumber(properties.dec),
      dec_limite: parseUnknownNumber(properties.dec_limite ?? properties.decLim),
      fec: parseUnknownNumber(properties.fec),
      fec_limite: parseUnknownNumber(properties.fec_limite ?? properties.fecLim),
      criticidade_percentual: parseUnknownNumber(properties.criticidade_percentual ?? properties.indiceCriticidadePercentual),
      faixa: pickProperty(properties, ['faixa', 'FAIXA']) || null,
    },
  }
}

async function loadFeatureCollection(url: string, fallback: MapaFeatureCollection): Promise<MapaFeatureCollection> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return fallback
    }

    const payload = await response.json() as unknown
    if (!isFeatureCollection(payload)) {
      return fallback
    }

    return payload
  } catch {
    return fallback
  }
}

async function loadMapaApi(filters: MapaCalorFilters): Promise<MapaCriticidadeApiItem[]> {
  const params = new URLSearchParams()
  params.set('mes', String(filters.mes))
  params.set('ano', String(filters.ano))
  if (filters.nomeConjunto && filters.nomeConjunto.trim()) {
    params.set('nomeConjunto', filters.nomeConjunto.trim())
  }

  const response = await fetch(
    `${API_BASE_URL}/indicadores/mapa?${params.toString()}`,
    createProtectedJsonRequest(),
  )

  const payload = await parseApiResponse<unknown[]>(response, 'Nao foi possivel carregar os indicadores do mapa.')
  return payload.filter(isMapaCriticidadeApiItem)
}

function parseGeometryJson(geometryJson: string | null): MapaFeature['geometry'] | null {
  if (!geometryJson) {
    return null
  }

  try {
    const geometry = JSON.parse(geometryJson) as MapaFeature['geometry']
    if (geometry && typeof geometry === 'object' && typeof geometry.type === 'string') {
      return geometry
    }

    return null
  } catch {
    return null
  }
}

function fallbackConjuntosFromApi(rows: MapaCriticidadeApiItem[]): MapaFeature[] {
  return rows.reduce<MapaFeature[]>((acc, row) => {
      const geometry = parseGeometryJson(row.geometryJson)
      if (!geometry) {
        return acc
      }

      acc.push({
        type: 'Feature',
        geometry,
        properties: {
          nome: row.nomeConjunto,
          distribuidora: row.distribuidora ?? 'N/D',
          estado: row.estado ?? 'N/D',
          conjunto: row.nomeConjunto,
          subestacao: 'N/D',
          dec: row.dec,
          dec_limite: row.decLim,
          fec: row.fec,
          fec_limite: row.fecLim,
          criticidade_percentual: row.indiceCriticidadePercentual,
          faixa: row.faixa,
        },
      })

      return acc
    }, [])
}

function mergeConjuntos(features: MapaFeature[], rows: MapaCriticidadeApiItem[]): MapaFeature[] {
  const rowsByConjunto = new Map(rows.map(row => [toNormalizedName(row.nomeConjunto), row]))

  return features.map((feature) => {
    const key = toNormalizedName(feature.properties.conjunto)
    const row = rowsByConjunto.get(key)

    if (!row) {
      return feature
    }

    return {
      ...feature,
      properties: {
        ...feature.properties,
        nome: row.nomeConjunto,
        conjunto: row.nomeConjunto,
        distribuidora: row.distribuidora ?? feature.properties.distribuidora,
        estado: row.estado ?? feature.properties.estado,
        dec: row.dec,
        fec: row.fec,
        dec_limite: row.decLim,
        fec_limite: row.fecLim,
        criticidade_percentual: row.indiceCriticidadePercentual,
        faixa: row.faixa,
      },
    }
  })
}

export async function loadMapaCalorData(filters: MapaCalorFilters): Promise<MapaCalorData> {
  const [municipiosRaw, conjuntosRaw] = await Promise.all([
    loadFeatureCollection('/geo/municipios.geojson', FALLBACK_MUNICIPIOS),
    loadFeatureCollection('/geo/conjuntos.geojson', FALLBACK_CONJUNTOS),
  ])

  const municipios = {
    ...municipiosRaw,
    features: municipiosRaw.features.map(normalizeMunicipioFeature),
  }

  const conjuntosNormalizados = conjuntosRaw.features.map(normalizeConjuntoFeature)

  try {
    const rows = await loadMapaApi(filters)
    const merged = mergeConjuntos(conjuntosNormalizados, rows)
    const hasRows = rows.length > 0
    const filteredMerged = hasRows
      ? merged.filter(feature => rows.some(row => toNormalizedName(row.nomeConjunto) === toNormalizedName(feature.properties.conjunto)))
      : merged

    const fallbackFromApi = filteredMerged.length > 0 ? [] : fallbackConjuntosFromApi(rows)

    return {
      municipios,
      conjuntos: {
        type: 'FeatureCollection',
        features: fallbackFromApi.length > 0 ? fallbackFromApi : filteredMerged,
      },
    }
  } catch {
    return {
      municipios,
      conjuntos: {
        type: 'FeatureCollection',
        features: conjuntosNormalizados,
      },
    }
  }
}

function parseNumber(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replace(',', '.'))
    return Number.isFinite(normalized) ? normalized : null
  }

  return null
}

function parseUnknownNumber(value: unknown): number | null {
  return parseNumber(value as number | string | null | undefined)
}

export function getCriticidade(feature: MapaFeature): Criticidade {
  const faixa = (feature.properties.faixa ?? '').trim().toLowerCase()
  if (faixa === 'verde' || faixa === 'amarelo' || faixa === 'vermelho' || faixa === 'ausente') {
    return faixa
  }

  const dec = parseNumber(feature.properties.dec)
  const fec = parseNumber(feature.properties.fec)
  const decLim = parseNumber(feature.properties.dec_limite)
  const fecLim = parseNumber(feature.properties.fec_limite)

  if (dec === null || fec === null || decLim === null || fecLim === null) {
    return 'ausente'
  }

  const mediaIndicadores = (dec + fec) / 2
  const mediaLimites = (decLim + fecLim) / 2
  if (mediaLimites <= 0) {
    return 'ausente'
  }

  const percentual = (mediaIndicadores / mediaLimites) * 100
  if (percentual < 50) {
    return 'verde'
  }

  if (percentual <= 100) {
    return 'amarelo'
  }

  return 'vermelho'
}

export const CRITICIDADE_LABEL: Record<Criticidade, string> = {
  verde: 'Abaixo de 50% do limite regulatorio',
  amarelo: 'Entre 50% e 100% do limite regulatorio',
  vermelho: 'Acima de 100% do limite regulatorio',
  ausente: 'Indicador complementar indisponivel',
}

export const CRITICIDADE_COLOR: Record<Criticidade, string> = {
  verde: '#10b981',
  amarelo: '#f59e0b',
  vermelho: '#ef4444',
  ausente: '#94a3b8',
}

import type { Conjunto, CriticidadeMeta } from '@/types/mapa'

const toPolygon = (coords: [number, number][]) => ({
  type: 'Polygon',
  coordinates: [[...coords, coords[0]]],
}) as GeoJSON.Polygon

export const conjuntosMock: Conjunto[] = [
  {
    id: 'encantado',
    nome: 'Encantado',
    distribuidora: 'RGE Sul',
    estado: 'RS',
    subestacao: 'Caxias 1',
    criticidade: 'alto',
    indicadorPrincipal: { id: 'dec', label: 'DEC', valor: 7.68, limite: 6.5 },
    indicadoresPrincipais: [
      { id: 'dec', label: 'DEC', valor: 7.68, limite: 6.5 },
      { id: 'fec', label: 'FEC', valor: 3.68, limite: 3.2 },
    ],
    complementares: [
      { id: 'perdas-tecnicas', label: 'Perdas tecnicas', valor: 3.79, limite: 3.03 },
      { id: 'perdas-nao-tecnicas', label: 'Perdas nao tecnicas', valor: 1.76, limite: 1.5 },
    ],
    periodoReferencia: '12/2022',
    geometry: toPolygon([
      [-51.95, -29.65],
      [-51.72, -29.63],
      [-51.66, -29.81],
      [-51.86, -29.92],
      [-52.02, -29.79],
    ]),
  },
  {
    id: 'gramado',
    nome: 'Gramado',
    distribuidora: 'RGE Sul',
    estado: 'RS',
    subestacao: 'Gramado 2',
    criticidade: 'moderado',
    indicadorPrincipal: { id: 'dec', label: 'DEC', valor: 4.12, limite: 6.5 },
    indicadoresPrincipais: [
      { id: 'dec', label: 'DEC', valor: 4.12, limite: 6.5 },
      { id: 'fec', label: 'FEC', valor: 2.85, limite: 3.2 },
    ],
    complementares: [
      { id: 'perdas-tecnicas', label: 'Perdas tecnicas', valor: 2.4, limite: 3.03 },
      { id: 'perdas-nao-tecnicas', label: 'Perdas nao tecnicas', valor: 0.92, limite: 1.5 },
    ],
    periodoReferencia: '12/2022',
    geometry: toPolygon([
      [-50.98, -29.26],
      [-50.73, -29.27],
      [-50.68, -29.43],
      [-50.89, -29.5],
      [-51.05, -29.42],
    ]),
  },
  {
    id: 'torres',
    nome: 'Torres',
    distribuidora: 'RGE Sul',
    estado: 'RS',
    subestacao: 'Torres 1',
    criticidade: 'baixo',
    indicadorPrincipal: { id: 'dec', label: 'DEC', valor: 2.18, limite: 6.5 },
    indicadoresPrincipais: [
      { id: 'dec', label: 'DEC', valor: 2.18, limite: 6.5 },
      { id: 'fec', label: 'FEC', valor: 1.42, limite: 3.2 },
    ],
    complementares: [
      { id: 'perdas-tecnicas', label: 'Perdas tecnicas', valor: 1.8, limite: 3.03 },
      { id: 'perdas-nao-tecnicas', label: 'Perdas nao tecnicas', valor: 0.74, limite: 1.5 },
    ],
    periodoReferencia: '12/2022',
    geometry: toPolygon([
      [-49.95, -29.22],
      [-49.67, -29.2],
      [-49.64, -29.39],
      [-49.87, -29.45],
      [-50.01, -29.36],
    ]),
  },
  {
    id: 'caxias',
    nome: 'Caxias do Sul',
    distribuidora: 'RGE Sul',
    estado: 'RS',
    subestacao: 'Caxias 2',
    criticidade: 'ausente',
    indicadorPrincipal: { id: 'dec', label: 'DEC', valor: 0, limite: 0 },
    indicadoresPrincipais: [
      { id: 'dec', label: 'DEC', valor: 0, limite: 0 },
      { id: 'fec', label: 'FEC', valor: 0, limite: 0 },
    ],
    complementares: [
      { id: 'perdas-tecnicas', label: 'Perdas tecnicas', valor: 0, limite: 0 },
      { id: 'perdas-nao-tecnicas', label: 'Perdas nao tecnicas', valor: 0, limite: 0 },
    ],
    periodoReferencia: '12/2022',
    geometry: toPolygon([
      [-51.37, -29.07],
      [-51.05, -29.03],
      [-51.01, -29.25],
      [-51.29, -29.34],
      [-51.45, -29.2],
    ]),
  },
]

export const municipiosMock: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { nome: 'Municipio A' },
      geometry: toPolygon([
        [-52.1, -29.95],
        [-51.78, -29.9],
        [-51.76, -29.7],
        [-52.05, -29.65],
      ]),
    },
    {
      type: 'Feature',
      properties: { nome: 'Municipio B' },
      geometry: toPolygon([
        [-51.76, -29.9],
        [-51.42, -29.87],
        [-51.35, -29.68],
        [-51.66, -29.6],
      ]),
    },
    {
      type: 'Feature',
      properties: { nome: 'Municipio C' },
      geometry: toPolygon([
        [-51.42, -29.87],
        [-51.03, -29.83],
        [-50.95, -29.6],
        [-51.35, -29.68],
      ]),
    },
    {
      type: 'Feature',
      properties: { nome: 'Municipio D' },
      geometry: toPolygon([
        [-51.03, -29.83],
        [-50.62, -29.78],
        [-50.56, -29.56],
        [-50.95, -29.6],
      ]),
    },
    {
      type: 'Feature',
      properties: { nome: 'Municipio E' },
      geometry: toPolygon([
        [-50.62, -29.78],
        [-50.29, -29.74],
        [-50.24, -29.5],
        [-50.56, -29.56],
      ]),
    },
  ],
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

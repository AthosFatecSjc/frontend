<script setup lang="ts">
import { computed, ref } from 'vue'

import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout.vue'

type Criticidade = 'baixo' | 'moderado' | 'alto' | 'ausente'

type Indicador = {
  id: string
  label: string
  valor: number
  limite: number
  unidade?: string
}

type Conjunto = {
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
  path: string
}

type Filters = {
  ano: string
  distribuidora: string
  estado: string
  conjunto: string
  subestacao: string
}

const BASE_SHAPE =
  'M90 90 L170 50 L270 60 L350 40 L460 80 L560 70 L640 150 L660 230 L630 320 L580 390 L470 430 L350 440 L250 420 L170 390 L120 320 L80 230 Z'

const municipios = [
  { id: 'm1', d: 'M140 150 L200 120 L250 150 L230 190 L160 180 Z' },
  { id: 'm2', d: 'M250 150 L320 120 L370 150 L350 200 L270 190 Z' },
  { id: 'm3', d: 'M370 150 L450 130 L500 160 L470 210 L390 200 Z' },
  { id: 'm4', d: 'M500 160 L570 140 L610 190 L580 230 L510 210 Z' },
  { id: 'm5', d: 'M130 200 L210 190 L250 230 L210 270 L150 260 Z' },
  { id: 'm6', d: 'M250 230 L330 200 L380 240 L350 290 L270 280 Z' },
  { id: 'm7', d: 'M380 240 L470 210 L520 260 L490 310 L400 300 Z' },
  { id: 'm8', d: 'M520 260 L600 230 L630 280 L600 330 L520 310 Z' },
  { id: 'm9', d: 'M150 280 L230 270 L260 310 L220 350 L160 340 Z' },
  { id: 'm10', d: 'M260 310 L340 290 L380 330 L350 370 L270 360 Z' },
  { id: 'm11', d: 'M380 330 L470 310 L520 350 L490 390 L400 380 Z' },
  { id: 'm12', d: 'M520 350 L590 330 L610 370 L580 400 L520 390 Z' },
]

const conjuntos = ref<Conjunto[]>([
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
    path: 'M170 210 L270 190 L350 230 L330 310 L230 340 L170 280 Z',
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
    path: 'M360 150 L500 150 L590 220 L520 300 L400 280 L350 210 Z',
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
    path: 'M400 300 L520 290 L600 340 L570 400 L450 410 L380 350 Z',
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
    path: 'M130 140 L230 110 L310 140 L270 200 L170 210 L120 170 Z',
  },
])

const criticidadeMeta: Record<Criticidade, { label: string; descricao: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
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

const legendItems = [
  { status: 'baixo', title: 'Verde', descricao: 'Abaixo de 50% do limite' },
  { status: 'moderado', title: 'Amarelo', descricao: 'Entre 50% e 100% do limite' },
  { status: 'alto', title: 'Vermelho', descricao: 'Acima de 100% do limite' },
  { status: 'ausente', title: 'Ausente', descricao: 'Indicador indisponivel' },
] as const

const initialFilters: Filters = {
  ano: '2022',
  distribuidora: 'RGE Sul',
  estado: 'RS',
  conjunto: 'todos',
  subestacao: 'todas',
}

const draftFilters = ref<Filters>({ ...initialFilters })
const activeFilters = ref<Filters>({ ...initialFilters })

const selectedConjuntoId = ref(conjuntos.value[0]?.id ?? '')
const mapZoom = ref(1)

const anoOptions = ['2022', '2023', '2024']

const distribuidoraOptions = computed(() => {
  const items = Array.from(new Set(conjuntos.value.map((item) => item.distribuidora)))
  return [{ value: 'todas', label: 'Todas' }, ...items.map((item) => ({ value: item, label: item }))]
})

const estadoOptions = computed(() => {
  const items = Array.from(new Set(conjuntos.value.map((item) => item.estado)))
  return [{ value: 'todos', label: 'Todos' }, ...items.map((item) => ({ value: item, label: item }))]
})

const conjuntoOptions = computed(() => [
  { value: 'todos', label: 'Todos' },
  ...conjuntos.value.map((item) => ({ value: item.id, label: item.nome })),
])

const subestacaoOptions = computed(() => {
  const items = Array.from(new Set(conjuntos.value.map((item) => item.subestacao)))
  return [{ value: 'todas', label: 'Todas' }, ...items.map((item) => ({ value: item, label: item }))]
})

const filteredConjuntos = computed(() => {
  const filters = activeFilters.value

  return conjuntos.value.filter((conjunto) => {
    const matchesDistribuidora = filters.distribuidora === 'todas' || conjunto.distribuidora === filters.distribuidora
    const matchesEstado = filters.estado === 'todos' || conjunto.estado === filters.estado
    const matchesConjunto = filters.conjunto === 'todos' || conjunto.id === filters.conjunto
    const matchesSubestacao = filters.subestacao === 'todas' || conjunto.subestacao === filters.subestacao

    return matchesDistribuidora && matchesEstado && matchesConjunto && matchesSubestacao
  })
})

const selectedConjunto = computed(() => {
  if (!filteredConjuntos.value.length) return null
  return filteredConjuntos.value.find((item) => item.id === selectedConjuntoId.value) ?? filteredConjuntos.value[0]
})

const mapScale = computed(() => `scale(${mapZoom.value})`)

function ensureSelected() {
  const matches = filteredConjuntos.value

  if (!matches.length) {
    selectedConjuntoId.value = ''
    return
  }

  if (!matches.some((item) => item.id === selectedConjuntoId.value)) {
    selectedConjuntoId.value = matches[0].id
  }
}

function applyFilters() {
  activeFilters.value = { ...draftFilters.value }
  ensureSelected()
}

function clearFilters() {
  draftFilters.value = { ...initialFilters }
  activeFilters.value = { ...initialFilters }
  selectedConjuntoId.value = conjuntos.value[0]?.id ?? ''
}

function selectConjunto(conjuntoId: string) {
  selectedConjuntoId.value = conjuntoId
}

function zoomIn() {
  mapZoom.value = Math.min(1.35, Number((mapZoom.value + 0.1).toFixed(2)))
}

function zoomOut() {
  mapZoom.value = Math.max(0.85, Number((mapZoom.value - 0.1).toFixed(2)))
}

function resetMapView() {
  mapZoom.value = 1
  ensureSelected()
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

function formatPercent(value: number, limit: number) {
  if (!limit) return 0
  return Math.min(100, Math.round((value / limit) * 100))
}
</script>

<template>
  <AuthenticatedLayout
    title="Mapa de Calor da Rede"
    description="Visualizacao geoespacial para destacar criticidade regulatoria e operacional por conjunto eletrico."
  >
    <UiCard class="filters-panel">
      <div class="filters-grid">
        <div class="field-group">
          <UiLabel class="field-label" for="filter-ano">Ano</UiLabel>
          <select id="filter-ano" v-model="draftFilters.ano" class="field-select">
            <option v-for="ano in anoOptions" :key="ano" :value="ano">
              {{ ano }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <UiLabel class="field-label" for="filter-distribuidora">Distribuidora</UiLabel>
          <select id="filter-distribuidora" v-model="draftFilters.distribuidora" class="field-select">
            <option v-for="option in distribuidoraOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <UiLabel class="field-label" for="filter-estado">Estado</UiLabel>
          <select id="filter-estado" v-model="draftFilters.estado" class="field-select">
            <option v-for="option in estadoOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <UiLabel class="field-label" for="filter-conjunto">Conjunto eletrico</UiLabel>
          <select id="filter-conjunto" v-model="draftFilters.conjunto" class="field-select">
            <option v-for="option in conjuntoOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <UiLabel class="field-label" for="filter-subestacao">Subestacao</UiLabel>
          <select id="filter-subestacao" v-model="draftFilters.subestacao" class="field-select">
            <option v-for="option in subestacaoOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="field-group field-group--action">
          <UiButton class="btn-clear" variant="secondary" @click="clearFilters">
            Limpar
          </UiButton>
          <UiButton class="btn-apply" @click="applyFilters">
            Aplicar filtros
          </UiButton>
        </div>
      </div>
    </UiCard>

    <section class="map-grid">
      <UiCard class="map-card">
        <header class="map-card__header">
          <div class="map-card__copy">
            <p class="map-card__eyebrow">Leitura geoespacial</p>
            <h2 class="map-card__title">Mapa operacional da rede com criticidade por conjunto eletrico</h2>
            <p class="map-card__subtitle">
              Selecione um conjunto eletrico para analisar a distribuicao de criticidade e a situacao dos indicadores.
            </p>
          </div>
          <div class="map-card__actions">
            <UiButton class="map-action" variant="secondary" @click="resetMapView">
              Centralizar mapa
            </UiButton>
          </div>
        </header>

        <div class="map-wrapper">
          <div class="map-canvas">
            <svg class="map-svg" viewBox="0 0 720 480" role="img" aria-label="Mapa de criticidade">
              <title>Mapa de criticidade</title>
              <defs>
                <clipPath id="mapClip">
                  <path :d="BASE_SHAPE" />
                </clipPath>
              </defs>

              <g class="map-zoom-layer" :style="{ transform: mapScale }" :clip-path="'url(#mapClip)'">
                <path :d="BASE_SHAPE" class="map-layer map-layer--base" />

                <g class="map-layer map-layer--municipios">
                  <path
                    v-for="municipio in municipios"
                    :key="municipio.id"
                    :d="municipio.d"
                    class="map-municipio"
                  />
                </g>

                <g class="map-layer map-layer--conjuntos">
                  <path
                    v-for="conjunto in filteredConjuntos"
                    :key="conjunto.id"
                    :d="conjunto.path"
                    class="map-conjunto"
                    :class="[
                      `map-conjunto--${conjunto.criticidade}`,
                      { 'map-conjunto--active': conjunto.id === selectedConjuntoId },
                    ]"
                    @click="selectConjunto(conjunto.id)"
                  />
                </g>
              </g>
            </svg>

            <div class="map-controls">
              <button type="button" class="map-control" aria-label="Aproximar" @click="zoomIn">+</button>
              <button type="button" class="map-control" aria-label="Afastar" @click="zoomOut">-</button>
            </div>

            <div v-if="selectedConjunto" class="map-pill">
              <span class="map-pill__label">Recorte ativo</span>
              <strong>{{ selectedConjunto.nome }}</strong>
              <span>{{ selectedConjunto.distribuidora }} | {{ selectedConjunto.estado }}</span>
            </div>

            <div v-if="filteredConjuntos.length === 0" class="map-empty">
              Nenhum conjunto disponivel para os filtros aplicados.
            </div>
          </div>
        </div>

        <div class="map-legend">
          <div
            v-for="item in legendItems"
            :key="item.status"
            class="legend-card"
            :class="`legend-card--${item.status}`"
          >
            <div class="legend-swatch" aria-hidden="true" />
            <div>
              <p class="legend-title">{{ item.title }}</p>
              <p class="legend-text">{{ item.descricao }}</p>
            </div>
          </div>
        </div>

        <p class="map-footnote">
          Fonte: base geoespacial simulada. Dados de criticidade e indicadores sao mock para composicao do layout.
        </p>
      </UiCard>

      <UiCard class="details-card">
        <div class="details-header">
          <h3 class="details-title">Detalhe do recorte selecionado</h3>
          <p class="details-subtitle">Resumo consolidado do conjunto eletrico e seus indicadores.</p>
        </div>

        <div v-if="!selectedConjunto" class="details-empty">
          Selecione um conjunto no mapa para visualizar os detalhes.
        </div>

        <template v-else>
          <div class="details-section">
            <p class="details-label">Conjunto eletrico</p>
            <strong class="details-value">{{ selectedConjunto.nome }}</strong>
            <span class="details-meta">{{ selectedConjunto.distribuidora }} | {{ selectedConjunto.estado }}</span>
          </div>

          <div class="details-section details-section--badge">
            <p class="details-label">Classificacao de criticidade</p>
            <UiBadge :tone="criticidadeMeta[selectedConjunto.criticidade].tone">
              {{ criticidadeMeta[selectedConjunto.criticidade].label }}
            </UiBadge>
            <span class="details-meta">{{ criticidadeMeta[selectedConjunto.criticidade].descricao }}</span>
          </div>

          <div class="details-grid">
            <div class="detail-kpi">
              <p>Indicador exibido</p>
              <strong>{{ formatNumber(selectedConjunto.indicadorPrincipal.valor) }}</strong>
              <span>{{ selectedConjunto.indicadorPrincipal.label }}</span>
            </div>
            <div class="detail-kpi">
              <p>Limite regulatorio</p>
              <strong>{{ formatNumber(selectedConjunto.indicadorPrincipal.limite) }}</strong>
              <span>Referencia para entrada de criticidade</span>
            </div>
          </div>

          <div class="details-section">
            <p class="details-label">Contexto operacional</p>
            <div class="details-list">
              <div>
                <span>Distribuidora</span>
                <strong>{{ selectedConjunto.distribuidora }}</strong>
              </div>
              <div>
                <span>Estado</span>
                <strong>{{ selectedConjunto.estado }}</strong>
              </div>
              <div>
                <span>Subestacao</span>
                <strong>{{ selectedConjunto.subestacao }}</strong>
              </div>
              <div>
                <span>Periodo de referencia</span>
                <strong>{{ selectedConjunto.periodoReferencia }}</strong>
              </div>
            </div>
          </div>

          <div class="details-section">
            <p class="details-label">Indicadores principais</p>
            <div class="details-metrics">
              <div v-for="metric in selectedConjunto.indicadoresPrincipais" :key="metric.id" class="metric-card">
                <div class="metric-card__row">
                  <strong>{{ metric.label }}</strong>
                  <span>{{ formatNumber(metric.valor) }}</span>
                </div>
                <div class="metric-card__meta">
                  Limite {{ formatNumber(metric.limite) }}
                </div>
                <div class="metric-meter">
                  <div
                    class="metric-meter__fill"
                    :style="{ width: `${formatPercent(metric.valor, metric.limite)}%` }"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="details-section">
            <p class="details-label">Leituras complementares</p>
            <div class="details-metrics">
              <div v-for="metric in selectedConjunto.complementares" :key="metric.id" class="metric-card">
                <div class="metric-card__row">
                  <strong>{{ metric.label }}</strong>
                  <span>{{ formatNumber(metric.valor) }}</span>
                </div>
                <div class="metric-card__meta">
                  Limite {{ formatNumber(metric.limite) }}
                </div>
                <div class="metric-meter">
                  <div
                    class="metric-meter__fill metric-meter__fill--soft"
                    :style="{ width: `${formatPercent(metric.valor, metric.limite)}%` }"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </UiCard>
    </section>
  </AuthenticatedLayout>
</template>

<style scoped>
.filters-panel {
  padding: 18px 20px;
  margin-bottom: 20px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) minmax(220px, auto);
  gap: 12px;
  align-items: end;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  font-size: 0.72rem;
}

.field-select {
  width: 100%;
  min-height: 2.6rem;
  border-radius: 0.9rem;
  border: 1px solid #dde2ea;
  background: #eefcff;
  padding: 0.65rem 0.85rem;
  color: #111827;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.field-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.field-group--action {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: stretch;
  justify-content: flex-end;
}

.btn-apply,
.btn-clear {
  width: auto;
  min-width: 120px;
  min-height: 2.6rem;
  white-space: nowrap;
}

.map-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 20px;
  align-items: start;
}

.map-card {
  padding: 18px 18px 16px;
  display: grid;
  gap: 16px;
}

.map-card__header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.map-card__copy {
  display: grid;
  gap: 8px;
}

.map-card__eyebrow {
  margin: 0;
  color: #0f8ab3;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.26em;
  text-transform: uppercase;
}

.map-card__title {
  margin: 0;
  color: #172554;
  font-size: 1.18rem;
  line-height: 1.35;
}

.map-card__subtitle {
  margin: 0;
  color: #60758c;
  font-size: 0.9rem;
}

.map-card__actions {
  display: flex;
  justify-content: flex-start;
}

.map-action {
  width: auto;
  min-width: 170px;
}

.map-wrapper {
  display: grid;
  gap: 12px;
}

.map-canvas {
  position: relative;
  height: 420px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.08), transparent 35%),
    radial-gradient(circle at 80% 30%, rgba(59, 130, 246, 0.08), transparent 35%),
    linear-gradient(180deg, #f8fbff 0%, #eef5fc 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.65);
}

.map-canvas::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg, rgba(148, 163, 184, 0.08) 0, rgba(148, 163, 184, 0.08) 1px, transparent 1px, transparent 32px),
    repeating-linear-gradient(90deg, rgba(148, 163, 184, 0.08) 0, rgba(148, 163, 184, 0.08) 1px, transparent 1px, transparent 32px);
  pointer-events: none;
}

.map-svg {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

.map-zoom-layer {
  transform-origin: 50% 50%;
  transform-box: fill-box;
  transition: transform 0.25s ease;
}

.map-layer--base {
  fill: rgba(239, 202, 193, 0.7);
  stroke: rgba(179, 83, 73, 0.7);
  stroke-width: 2;
}

.map-municipio {
  fill: none;
  stroke: rgba(168, 113, 99, 0.75);
  stroke-width: 1;
}

.map-conjunto {
  fill-opacity: 0.55;
  stroke-width: 2;
  cursor: pointer;
  transition: filter 0.2s ease, stroke-width 0.2s ease;
}

.map-conjunto--baixo {
  fill: rgba(34, 197, 94, 0.35);
  stroke: #16a34a;
}

.map-conjunto--moderado {
  fill: rgba(234, 179, 8, 0.35);
  stroke: #ca8a04;
}

.map-conjunto--alto {
  fill: rgba(239, 68, 68, 0.35);
  stroke: #dc2626;
}

.map-conjunto--ausente {
  fill: rgba(148, 163, 184, 0.35);
  stroke: #94a3b8;
}

.map-conjunto--active {
  stroke-width: 3.4;
  filter: drop-shadow(0 4px 12px rgba(15, 23, 42, 0.18));
}

.map-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  display: grid;
  gap: 8px;
  z-index: 2;
}

.map-control {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid #dbe3ec;
  background: #ffffff;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.map-control:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.16);
}

.map-pill {
  position: absolute;
  left: 18px;
  bottom: 18px;
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.88);
  color: #f8fafc;
  border-radius: 12px;
  font-size: 0.8rem;
  z-index: 2;
}

.map-pill__label {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.62rem;
  color: rgba(248, 250, 252, 0.72);
}

.map-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 2rem;
  color: #64748b;
  font-size: 0.9rem;
  z-index: 3;
  background: rgba(248, 250, 252, 0.92);
}

.map-legend {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.legend-card {
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 12px;
  display: grid;
  gap: 6px;
}

.legend-swatch {
  width: 36px;
  height: 8px;
  border-radius: 999px;
}

.legend-title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.legend-text {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
}

.legend-card--baixo .legend-swatch {
  background: #22c55e;
}

.legend-card--moderado .legend-swatch {
  background: #eab308;
}

.legend-card--alto .legend-swatch {
  background: #ef4444;
}

.legend-card--ausente .legend-swatch {
  background: #94a3b8;
}

.map-footnote {
  margin: 0;
  font-size: 0.72rem;
  color: #7a8699;
}

.details-card {
  padding: 18px;
  display: grid;
  gap: 16px;
}

.details-header {
  display: grid;
  gap: 6px;
}

.details-title {
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
}

.details-subtitle {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
}

.details-empty {
  padding: 1.6rem 1rem;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px dashed #cbd5f5;
}

.details-section {
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 12px;
  display: grid;
  gap: 6px;
}

.details-section--badge {
  background: #fff;
}

.details-label {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.65rem;
  color: #6b7280;
}

.details-value {
  font-size: 1.05rem;
  color: #0f172a;
}

.details-meta {
  color: #64748b;
  font-size: 0.78rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-kpi {
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 12px;
  display: grid;
  gap: 4px;
}

.detail-kpi p {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.detail-kpi strong {
  font-size: 1.15rem;
  color: #0f172a;
}

.detail-kpi span {
  font-size: 0.72rem;
  color: #94a3b8;
}

.details-list {
  display: grid;
  gap: 10px;
}

.details-list div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  color: #475569;
}

.details-list strong {
  color: #0f172a;
}

.details-metrics {
  display: grid;
  gap: 10px;
}

.metric-card {
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 10px;
  display: grid;
  gap: 6px;
}

.metric-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #0f172a;
}

.metric-card__meta {
  font-size: 0.72rem;
  color: #94a3b8;
}

.metric-meter {
  height: 6px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.metric-meter__fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9 0%, #22c55e 100%);
}

.metric-meter__fill--soft {
  background: linear-gradient(90deg, #94a3b8 0%, #38bdf8 100%);
}

@media (max-width: 1200px) {
  .filters-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .field-group--action {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}

@media (min-width: 960px) {
  .map-card__header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }

  .map-card__actions {
    justify-content: flex-end;
  }
}

@media (max-width: 980px) {
  .map-grid {
    grid-template-columns: 1fr;
  }

  .map-legend {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .map-card__actions {
    width: 100%;
  }

  .map-action {
    width: 100%;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .map-legend {
    grid-template-columns: 1fr;
  }
}
</style>

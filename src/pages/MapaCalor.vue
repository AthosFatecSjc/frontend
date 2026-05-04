<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import HeatmapGeoMap from '@/components/mapa/HeatmapGeoMap.vue'
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout.vue'
import { criticidadeMeta, fetchMapaCalorData, fetchMunicipiosLayer, legendItems } from '@/services/mapaService'
import type { Conjunto, FiltrosMapa } from '@/types/mapa'

const mapRef = ref<InstanceType<typeof HeatmapGeoMap> | null>(null)

const initialFilters: FiltrosMapa = {
  ano: '',
  distribuidora: 'todas',
  estado: 'todos',
  conjunto: 'todos',
  subestacao: 'todas',
}

const draftFilters = ref<FiltrosMapa>({ ...initialFilters })
const activeFilters = ref<FiltrosMapa>({ ...initialFilters })
const conjuntos = ref<Conjunto[]>([])
const anosDisponiveis = ref<string[]>([])
const municipiosGeoJson = ref<GeoJSON.FeatureCollection<GeoJSON.Geometry> | null>(null)
const selectedConjuntoId = ref('')
const loadingMapa = ref(false)
const loadError = ref('')

const anoOptions = computed(() => {
  if (anosDisponiveis.value.length > 0) {
    return anosDisponiveis.value
  }

  if (draftFilters.value.ano) {
    return [draftFilters.value.ano]
  }

  return []
})

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

function ensureSelected() {
  const matches = filteredConjuntos.value

  if (!matches.length) {
    selectedConjuntoId.value = ''
    return
  }

  if (!matches.some((item) => item.id === selectedConjuntoId.value)) {
    selectedConjuntoId.value = matches[0]!.id
  }
}

async function loadMunicipios() {
  try {
    const ufs = Array.from(new Set(conjuntos.value.map((item) => item.estado).filter(Boolean)))
    const data = await fetchMunicipiosLayer(ufs)
    municipiosGeoJson.value = data
  } catch {
    municipiosGeoJson.value = null
  }
}

async function loadMapaData(ano?: string) {
  loadingMapa.value = true
  loadError.value = ''

  try {
    const data = await fetchMapaCalorData(ano)
    conjuntos.value = data.conjuntos
    anosDisponiveis.value = data.anosDisponiveis

    if (!draftFilters.value.ano) {
      const anoPadrao = data.anosDisponiveis[0] ?? String(new Date().getFullYear())
      draftFilters.value.ano = anoPadrao
      activeFilters.value.ano = anoPadrao
    }

    await loadMunicipios()
    ensureSelected()
  } catch (error) {
    const message = error instanceof Error && error.message.trim()
      ? error.message
      : 'Nao foi possivel carregar os dados do mapa de calor.'
    loadError.value = message
    conjuntos.value = []
    municipiosGeoJson.value = null
    ensureSelected()
  } finally {
    loadingMapa.value = false
  }
}

async function applyFilters() {
  const anoMudou = draftFilters.value.ano !== activeFilters.value.ano

  if (anoMudou) {
    await loadMapaData(draftFilters.value.ano)
  }

  activeFilters.value = { ...draftFilters.value }
  ensureSelected()
}

async function clearFilters() {
  const anoPadrao = anosDisponiveis.value[0] ?? String(new Date().getFullYear())
  draftFilters.value = {
    ...initialFilters,
    ano: anoPadrao,
  }
  activeFilters.value = { ...draftFilters.value }
  selectedConjuntoId.value = ''

  await loadMapaData(anoPadrao)
  mapRef.value?.resetView()
}

function selectConjunto(conjuntoId: string) {
  selectedConjuntoId.value = conjuntoId
}

function resetMapView() {
  mapRef.value?.resetView()
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

function formatPercent(value: number, limit: number) {
  if (!limit) return 0
  return Math.min(100, Math.round((value / limit) * 100))
}

onMounted(async () => {
  await loadMapaData()
  activeFilters.value = { ...draftFilters.value }
  ensureSelected()
})
</script>

<template>
  <AuthenticatedLayout
    title="Mapa de Calor da Rede"
    description="Visualizacao geoespacial para destacar criticidade regulatoria e operacional por conjunto eletrico."
  >
    <UiAlert v-if="loadError" tone="danger" class="status-alert">
      {{ loadError }}
    </UiAlert>

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
          <UiButton class="btn-clear" variant="secondary" :disabled="loadingMapa" @click="clearFilters">
            Limpar
          </UiButton>
          <UiButton class="btn-apply" :disabled="loadingMapa" @click="applyFilters">
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
              Navegue com zoom e arraste. Clique nos recortes para analisar criticidade e indicadores.
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
            <HeatmapGeoMap
              ref="mapRef"
              :conjuntos="filteredConjuntos"
              :selected-conjunto-id="selectedConjuntoId"
              :municipios-geo-json="municipiosGeoJson"
              @select="selectConjunto"
            />

            <div v-if="selectedConjunto" class="map-pill">
              <span class="map-pill__label">Recorte ativo</span>
              <strong>{{ selectedConjunto.nome }}</strong>
              <span>{{ selectedConjunto.distribuidora }} | {{ selectedConjunto.estado }}</span>
            </div>

            <div v-if="loadingMapa" class="map-empty">
              Carregando dados geograficos do mapa...
            </div>

            <div v-else-if="filteredConjuntos.length === 0" class="map-empty">
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
          Fonte: PostGIS (camada de conjuntos e indicadores) e IBGE (limites municipais via WFS).
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
.status-alert {
  margin-bottom: 12px;
}

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
  height: 460px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  background: linear-gradient(180deg, #f8fbff 0%, #eef5fc 100%);
}

:deep(.leaflet-control-attribution) {
  font-size: 0.65rem;
}

:deep(.leaflet-tooltip) {
  border: 1px solid rgba(148, 163, 184, 0.45);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
  color: #0f172a;
  font-weight: 600;
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
  z-index: 650;
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
  z-index: 700;
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

<script setup lang="ts">
import 'leaflet/dist/leaflet.css'

import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import L from 'leaflet'

import {
  CRITICIDADE_COLOR,
  CRITICIDADE_LABEL,
  getCriticidade,
  loadMapaCalorData,
  type Criticidade,
  type MapaFeature,
  type MapaFeatureCollection,
} from '@/services/mapaCalor'

type SelectOption = {
  label: string
  value: string
}

const loading = ref(true)
const errorMessage = ref('')
const mapElement = ref<HTMLElement | null>(null)
const selectedFeature = ref<MapaFeature | null>(null)

const municipios = ref<MapaFeatureCollection>({
  type: 'FeatureCollection',
  features: [],
})
const conjuntos = ref<MapaFeatureCollection>({
  type: 'FeatureCollection',
  features: [],
})

const map = shallowRef<L.Map | null>(null)
const municipiosLayer = shallowRef<L.GeoJSON | null>(null)
const conjuntosLayer = shallowRef<L.GeoJSON | null>(null)

const defaultFilters = {
  ano: '2023',
  mes: '11',
  conjunto: 'all',
}

const draftFilters = reactive({ ...defaultFilters })

const appliedFilters = ref({ ...defaultFilters })
const catalogoConjuntos = ref<string[]>([])
const catalogoAnosMeses = ref<Array<{ ano: number; meses: number[] }>>([])

const optionsAno = computed(() =>
  catalogoAnosMeses.value.map(item => ({
    label: String(item.ano),
    value: String(item.ano)
  }))
)

const optionsMes = computed(() => {
  const anoSelecionado = Number(draftFilters.ano)
  const anoData = catalogoAnosMeses.value.find(item => item.ano === anoSelecionado)
  const meses = anoData?.meses ?? []

  return meses
    .sort((a, b) => a - b)
    .map(mes => ({ label: String(mes), value: String(mes) }))
})

const optionsConjunto = computed(() => {
  const values = catalogoConjuntos.value
  return [
    { label: 'Todos', value: 'all' },
    ...values.map(value => ({ label: value, value })),
  ]
})

const filteredConjuntos = computed(() => conjuntos.value.features)

const recorteSelecionado = computed(() => selectedFeature.value ?? filteredConjuntos.value[0] ?? null)

const selectedCriticidade = computed<Criticidade>(() => {
  if (!recorteSelecionado.value) {
    return 'ausente'
  }

  return getCriticidade(recorteSelecionado.value)
})

const indicadoresPrincipais = computed(() => {
  const feature = recorteSelecionado.value
  if (!feature) {
    return [
      { label: 'DEC', valor: '--', limite: '--' },
      { label: 'FEC', valor: '--', limite: '--' },
    ]
  }

  return [
    {
      label: 'DEC',
      valor: formatNumber(feature.properties.dec ?? null),
      limite: formatNumber(feature.properties.dec_limite ?? null),
    },
    {
      label: 'FEC',
      valor: formatNumber(feature.properties.fec ?? null),
      limite: formatNumber(feature.properties.fec_limite ?? null),
    },
  ]
})

const resumoCriticidade = computed(() => {
  const feature = recorteSelecionado.value
  if (!feature) {
    return '--'
  }

  return formatPercent(feature.properties.criticidade_percentual ?? null)
})

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return '--'
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return '--'
  }

  return `${formatNumber(value)}%`
}

function getMunicipiosFeatureCollection(): MapaFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: municipios.value.features,
  }
}

function getConjuntosFeatureCollection(): MapaFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: filteredConjuntos.value,
  }
}

async function applyDraftFilters() {
  appliedFilters.value = {
    ...draftFilters,
  }
  await loadMapData()
}

async function resetFilters() {
  Object.assign(draftFilters, defaultFilters)
  await applyDraftFilters()
}

function styleMunicipioLayer(): L.PathOptions {
  return {
    color: '#94a3b8',
    weight: 1.2,
    fillOpacity: 0,
    opacity: 0.95,
  }
}

function styleConjuntoLayer(feature: MapaFeature): L.PathOptions {
  const criticidade = getCriticidade(feature)
  return {
    color: '#ffffff',
    weight: 1,
    fillColor: CRITICIDADE_COLOR[criticidade],
    fillOpacity: 0.62,
    opacity: 0.98,
  }
}

function bindConjuntoTooltip(layer: L.Layer, feature: MapaFeature) {
  const criticidade = getCriticidade(feature)

  if (!('bindPopup' in layer)) {
    return
  }

  layer.bindPopup(`
    <div style="font-family: Inter, sans-serif; min-width: 220px;">
      <strong style="display:block; margin-bottom:6px;">${feature.properties.conjunto}</strong>
      <span style="display:block; color:#475569; margin-bottom:4px;">${feature.properties.distribuidora} - ${feature.properties.estado}</span>
      <span style="display:block;"><strong>DEC:</strong> ${formatNumber(feature.properties.dec ?? null)} (limite ${formatNumber(feature.properties.dec_limite ?? null)})</span>
      <span style="display:block;"><strong>FEC:</strong> ${formatNumber(feature.properties.fec ?? null)} (limite ${formatNumber(feature.properties.fec_limite ?? null)})</span>
      <span style="display:block;"><strong>Indice de criticidade:</strong> ${formatPercent(feature.properties.criticidade_percentual ?? null)}</span>
      <span style="display:block; margin-top:4px;"><strong>Criticidade:</strong> ${CRITICIDADE_LABEL[criticidade]}</span>
    </div>
  `)

  layer.on('click', () => {
    selectedFeature.value = feature
  })
}

function ensureMapReady() {
  if (map.value || !mapElement.value) {
    return
  }

  map.value = L.map(mapElement.value, {
    zoomControl: true,
    minZoom: 5,
  }).setView([-3.08, -60.04], 10)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map.value)

  municipiosLayer.value = L.geoJSON(getMunicipiosFeatureCollection() as unknown as GeoJSON.GeoJsonObject, {
    style: () => styleMunicipioLayer(),
  }).addTo(map.value)

  conjuntosLayer.value = L.geoJSON(getConjuntosFeatureCollection() as unknown as GeoJSON.GeoJsonObject, {
    style: (feature) => styleConjuntoLayer(feature as unknown as MapaFeature),
    onEachFeature: (feature, layer) => bindConjuntoTooltip(layer, feature as unknown as MapaFeature),
  }).addTo(map.value)

  fitToConjuntos()
}

function refreshConjuntosLayer() {
  if (!map.value) {
    return
  }

  if (municipiosLayer.value) {
    municipiosLayer.value.clearLayers()
    municipiosLayer.value.addData(getMunicipiosFeatureCollection() as unknown as GeoJSON.GeoJsonObject)
  }

  if (conjuntosLayer.value) {
    conjuntosLayer.value.clearLayers()
    conjuntosLayer.value.addData(getConjuntosFeatureCollection() as unknown as GeoJSON.GeoJsonObject)
    conjuntosLayer.value.setStyle((feature) => styleConjuntoLayer(feature as unknown as MapaFeature))
    conjuntosLayer.value.eachLayer((layer) => {
      const feature = (layer as L.Layer & { feature?: MapaFeature }).feature
      if (feature) {
        bindConjuntoTooltip(layer, feature)
      }
    })
  }

  fitToConjuntos()
}

function fitToConjuntos() {
  if (!map.value || !conjuntosLayer.value) {
    return
  }

  const bounds = conjuntosLayer.value.getBounds()
  if (bounds.isValid()) {
    map.value.fitBounds(bounds, {
      padding: [24, 24],
      maxZoom: 13,
    })
  }
}

async function loadCatalogo() {
  try {
    // Carregar anos e meses disponíveis
    const responseAnosMeses = await fetch('/api/indicadores/catalogo/anos-meses', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })

    if (responseAnosMeses.ok) {
      catalogoAnosMeses.value = await responseAnosMeses.json()

      // Atualizar ano padrão se o configurado não existir no catálogo
      if (!catalogoAnosMeses.value.some(item => item.ano === Number(defaultFilters.ano))) {
        const primeiroAno = catalogoAnosMeses.value[0]?.ano
        if (primeiroAno) {
          defaultFilters.ano = String(primeiroAno)
          draftFilters.ano = String(primeiroAno)

          // Atualizar mês padrão baseado no primeiro ano disponível
          const mesesDoAno = catalogoAnosMeses.value.find(item => item.ano === primeiroAno)?.meses ?? []
          const primeiroMes = mesesDoAno[mesesDoAno.length - 1]
          if (primeiroMes) {
            defaultFilters.mes = String(primeiroMes)
            draftFilters.mes = String(primeiroMes)
          }
        }
      }
    }

    // Carregar conjuntos disponíveis
    const responseConjuntos = await fetch('/api/indicadores/catalogo/conjuntos', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })

    if (responseConjuntos.ok) {
      const conjuntosData = await responseConjuntos.json()
      catalogoConjuntos.value = conjuntosData
        .map((item: { nome: string }) => item.nome)
        .sort((a: string, b: string) => a.localeCompare(b))
    }
  } catch (error) {
    console.warn('Nao foi possivel carregar catalogo de filtros:', error)
    // Manter valores padrão se falhar
  }
}

async function loadMapData() {
  loading.value = true
  errorMessage.value = ''

  try {
    const data = await loadMapaCalorData({
      mes: Number(appliedFilters.value.mes),
      ano: Number(appliedFilters.value.ano),
      nomeConjunto: appliedFilters.value.conjunto === 'all' ? undefined : appliedFilters.value.conjunto,
    })

    municipios.value = data.municipios
    conjuntos.value = data.conjuntos

    if (!selectedFeature.value || !filteredConjuntos.value.includes(selectedFeature.value)) {
      selectedFeature.value = filteredConjuntos.value[0] ?? null
    }

    ensureMapReady()
    refreshConjuntosLayer()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel carregar os dados do mapa.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadCatalogo()
  await loadMapData()
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove()
  }

  map.value = null
  municipiosLayer.value = null
  conjuntosLayer.value = null
})
</script>

<template>
  <AuthenticatedLayout
    title="Mapa de Calor da Rede"
    description="Visualizacao geoespacial adaptada para leitura de criticidade por conjunto eletrico e delimitacao municipal."
    user-name="Usuario interno"
    role-label="Plataforma"
  >
    <div class="heatmap-page">
      <UiCard>
        <div class="filters-card">
          <div class="filters-grid">
            <label class="filter-field">
              <span>Ano</span>
              <select v-model="draftFilters.ano">
                <option v-for="option in optionsAno" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>

            <label class="filter-field">
              <span>Mes</span>
              <select v-model="draftFilters.mes">
                <option v-for="option in optionsMes" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>

            <label class="filter-field">
              <span>Nome do conjunto</span>
              <select v-model="draftFilters.conjunto">
                <option v-for="option in optionsConjunto" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
          </div>

          <div class="filters-actions">
            <UiButton tone="secondary" @click="resetFilters">Limpar</UiButton>
            <UiButton @click="applyDraftFilters">Aplicar filtros</UiButton>
          </div>

          <div class="info-alerts">
            <UiAlert>
              Esta visualizacao prioriza duas camadas geograficas: delimitacao municipal e conjuntos da distribuidora com cor por criticidade.
            </UiAlert>
            <UiAlert>
              O indice de criticidade do mapa agora usa DEC/FEC do mes e ano selecionados, comparados com os limites regulatorios anuais.
            </UiAlert>
          </div>
        </div>
      </UiCard>

      <p v-if="errorMessage" class="map-error">{{ errorMessage }}</p>

      <div v-if="loading" class="loading-state">Carregando mapa geoespacial...</div>

      <div v-else class="content-grid">
        <UiCard>
          <div class="map-card">
            <div class="map-header">
              <div>
                <p class="card-eyebrow">Leitura geoespacial</p>
                <h2>Piloto V2 com malha desenhada da rede</h2>
                <p>
                  Delimitacao municipal e conjuntos coloridos pelo indice de criticidade consolidado.
                </p>
              </div>

              <UiButton tone="secondary" @click="fitToConjuntos">Centralizar mapa</UiButton>
            </div>

            <div ref="mapElement" class="map-canvas" role="img" aria-label="Mapa de criticidade"></div>

            <section class="legend">
              <p class="card-eyebrow">Legenda de criticidade</p>
              <div class="legend-grid">
                <article class="legend-item" data-tone="verde">
                  <strong>Verde</strong>
                  <span>{{ CRITICIDADE_LABEL.verde }}</span>
                </article>

                <article class="legend-item" data-tone="amarelo">
                  <strong>Amarelo</strong>
                  <span>{{ CRITICIDADE_LABEL.amarelo }}</span>
                </article>

                <article class="legend-item" data-tone="vermelho">
                  <strong>Vermelho</strong>
                  <span>{{ CRITICIDADE_LABEL.vermelho }}</span>
                </article>

                <article class="legend-item" data-tone="ausente">
                  <strong>Ausente</strong>
                  <span>{{ CRITICIDADE_LABEL.ausente }}</span>
                </article>
              </div>
            </section>
          </div>
        </UiCard>

        <div class="details-column">
          <UiCard>
            <div class="details-card">
              <h3>Detalhe do recorte geografico selecionado</h3>

              <article class="details-highlight">
                <p class="details-label">Conjunto eletrico</p>
                <strong>{{ recorteSelecionado?.properties.conjunto ?? '--' }}</strong>
                <span>
                  {{ recorteSelecionado?.properties.distribuidora ?? '--' }} - {{ recorteSelecionado?.properties.estado ?? '--' }}
                </span>
              </article>

              <article class="details-criticality" :class="`details-criticality--${selectedCriticidade}`">
                <p class="details-label">Classificacao de criticidade</p>
                <strong>{{ CRITICIDADE_LABEL[selectedCriticidade] }}</strong>
                <span>Indice: {{ resumoCriticidade }}</span>
              </article>

              <section>
                <p class="details-label">Indicadores principais</p>
                <div class="metrics-grid">
                  <article v-for="item in indicadoresPrincipais" :key="item.label" class="metric-item">
                    <p>{{ item.label }}</p>
                    <strong>{{ item.valor }}</strong>
                    <span>Limite {{ item.limite }}</span>
                  </article>
                </div>
              </section>

              <p class="details-footnote">
                Fonte ativa: geometria ANEEL (GeoJSON) e metricas oficiais carregadas da API de indicadores do backend.
              </p>
            </div>
          </UiCard>
        </div>
      </div>
    </div>
  </AuthenticatedLayout>
</template>

<style scoped>
.heatmap-page {
  display: grid;
  gap: 1rem;
}

.filters-card {
  padding: 1rem;
  display: grid;
  gap: 1rem;
}

.filters-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.filter-field {
  display: grid;
  gap: 0.35rem;
}

.filter-field span {
  font-size: 0.72rem;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
}

.filter-field select {
  min-height: 2.7rem;
  border-radius: 0.8rem;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0 0.8rem;
  color: #1e293b;
  font-weight: 600;
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.info-alerts {
  display: grid;
  gap: 0.6rem;
}

.content-grid {
  display: grid;
  gap: 1rem;
}

.map-card {
  padding: 1rem;
}

.map-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-eyebrow {
  margin: 0;
  color: #0f8ab3;
  font-size: 0.68rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  font-weight: 700;
}

.map-header h2 {
  margin: 0.45rem 0 0;
  color: #172554;
}

.map-header p {
  margin: 0.4rem 0 0;
  color: #5f738a;
  max-width: 50ch;
}

.map-canvas {
  width: 100%;
  min-height: 470px;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid #dbeafe;
}

.legend {
  margin-top: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1rem;
}

.legend-grid {
  margin-top: 0.65rem;
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 0.6rem;
}

.legend-item {
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
  padding: 0.65rem 0.7rem;
  display: grid;
  gap: 0.2rem;
}

.legend-item strong {
  color: #1e293b;
}

.legend-item span {
  color: #64748b;
  font-size: 0.88rem;
}

.legend-item[data-tone='verde'] {
  border-color: color-mix(in srgb, #10b981 35%, #ffffff);
}

.legend-item[data-tone='amarelo'] {
  border-color: color-mix(in srgb, #f59e0b 40%, #ffffff);
}

.legend-item[data-tone='vermelho'] {
  border-color: color-mix(in srgb, #ef4444 35%, #ffffff);
}

.legend-item[data-tone='ausente'] {
  border-color: color-mix(in srgb, #94a3b8 40%, #ffffff);
}

.details-column {
  display: grid;
  gap: 1rem;
}

.details-card {
  padding: 1rem;
  display: grid;
  gap: 0.9rem;
}

.details-card h3 {
  margin: 0;
  color: #1e3a8a;
  font-size: 1.1rem;
}

.details-highlight,
.details-criticality {
  border: 1px solid #e2e8f0;
  border-radius: 0.95rem;
  padding: 0.8rem;
  display: grid;
  gap: 0.25rem;
}

.details-label {
  margin: 0;
  color: #64748b;
  font-size: 0.68rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-weight: 700;
}

.details-highlight strong,
.details-criticality strong {
  font-size: 1.3rem;
  color: #0f172a;
}

.details-highlight span {
  color: #64748b;
  font-size: 0.88rem;
}

.details-criticality--verde {
  border-color: rgba(16, 185, 129, 0.35);
  background: rgba(16, 185, 129, 0.06);
}

.details-criticality--amarelo {
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.08);
}

.details-criticality--vermelho {
  border-color: rgba(239, 68, 68, 0.33);
  background: rgba(239, 68, 68, 0.08);
}

.details-criticality--ausente {
  border-color: rgba(148, 163, 184, 0.4);
  background: rgba(148, 163, 184, 0.08);
}

.metrics-grid {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.metric-item {
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
  padding: 0.7rem;
  display: grid;
  gap: 0.15rem;
}

.metric-item p {
  margin: 0;
  color: #64748b;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
}

.metric-item strong {
  color: #0f172a;
  font-size: 1.35rem;
}

.metric-item span {
  color: #64748b;
  font-size: 0.85rem;
}

.details-footnote {
  margin: 0;
  font-size: 0.86rem;
  color: #64748b;
  line-height: 1.55;
}

.loading-state,
.map-error {
  margin: 0;
  color: #1e293b;
}

@media (min-width: 760px) {
  .filters-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .legend-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1080px) {
  .filters-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: minmax(0, 2fr) minmax(330px, 0.9fr);
    align-items: start;
  }
}
</style>

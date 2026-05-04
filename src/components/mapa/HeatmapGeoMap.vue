<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as L from 'leaflet'

import type { Conjunto, Criticidade } from '@/types/mapa'

const props = defineProps<{
  conjuntos: Conjunto[]
  selectedConjuntoId: string
  municipiosGeoJson?: GeoJSON.FeatureCollection<GeoJSON.Geometry> | null
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let municipioLayer: L.GeoJSON | null = null
let conjuntosLayer: L.GeoJSON | null = null

function styleByCriticidade(criticidade: Criticidade, isSelected: boolean): L.PathOptions {
  const styles: Record<Criticidade, L.PathOptions> = {
    baixo: { fillColor: '#22c55e', color: '#16a34a' },
    moderado: { fillColor: '#eab308', color: '#ca8a04' },
    alto: { fillColor: '#ef4444', color: '#dc2626' },
    ausente: { fillColor: '#94a3b8', color: '#64748b' },
  }

  const base = styles[criticidade]

  return {
    ...base,
    weight: isSelected ? 3 : 2,
    fillOpacity: isSelected ? 0.55 : 0.38,
    opacity: 1,
  }
}

function buildConjuntosFeatureCollection(items: Conjunto[]): GeoJSON.FeatureCollection<GeoJSON.Geometry> {
  return {
    type: 'FeatureCollection',
    features: items.map((item) => ({
      type: 'Feature',
      properties: {
        id: item.id,
        nome: item.nome,
        criticidade: item.criticidade,
      },
      geometry: item.geometry,
    })),
  }
}

function renderMunicipios() {
  if (!map) return

  if (municipioLayer) {
    municipioLayer.remove()
    municipioLayer = null
  }

  if (!props.municipiosGeoJson || props.municipiosGeoJson.features.length === 0) {
    return
  }

  municipioLayer = L.geoJSON(props.municipiosGeoJson, {
    style: {
      color: '#b45349',
      weight: 1,
      fillOpacity: 0,
      dashArray: '3 2',
    },
    interactive: false,
  }).addTo(map)
}

function fitToCurrentConjuntos() {
  if (!map) return

  if (conjuntosLayer) {
    const conjuntoBounds = conjuntosLayer.getBounds()
    if (conjuntoBounds.isValid()) {
      map.fitBounds(conjuntoBounds.pad(0.15))
      return
    }
  }

  if (municipioLayer) {
    const municipioBounds = municipioLayer.getBounds()
    if (municipioBounds.isValid()) {
      map.fitBounds(municipioBounds.pad(0.08))
    }
  }
}

function renderConjuntos(fitBounds = false) {
  if (!map) return

  if (conjuntosLayer) {
    conjuntosLayer.remove()
    conjuntosLayer = null
  }

  if (!props.conjuntos.length) {
    if (fitBounds) {
      fitToCurrentConjuntos()
    }
    return
  }

  const geojson = buildConjuntosFeatureCollection(props.conjuntos)

  conjuntosLayer = L.geoJSON(geojson, {
    style: (feature) => {
      const criticidade = String(feature?.properties?.criticidade ?? 'ausente') as Criticidade
      const featureId = String(feature?.properties?.id ?? '')
      return styleByCriticidade(criticidade, featureId === props.selectedConjuntoId)
    },
    onEachFeature: (feature, layer) => {
      const featureId = String(feature.properties?.id ?? '')
      const nome = String(feature.properties?.nome ?? 'Conjunto')

      layer.bindTooltip(nome, {
        sticky: true,
        direction: 'top',
        offset: [0, -8],
      })

      layer.on('click', () => {
        emit('select', featureId)
      })
    },
  }).addTo(map)

  if (fitBounds) {
    fitToCurrentConjuntos()
  }
}

function resetView() {
  fitToCurrentConjuntos()
}

function zoomIn() {
  map?.zoomIn()
}

function zoomOut() {
  map?.zoomOut()
}

defineExpose({
  resetView,
  zoomIn,
  zoomOut,
})

onMounted(() => {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    minZoom: 5,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  renderMunicipios()
  renderConjuntos(true)
})

watch(
  () => props.conjuntos,
  () => {
    renderConjuntos(true)
  },
  { deep: true },
)

watch(
  () => props.selectedConjuntoId,
  () => {
    renderConjuntos(false)
  },
)

watch(
  () => props.municipiosGeoJson,
  () => {
    renderMunicipios()
    fitToCurrentConjuntos()
  },
  { deep: true },
)

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="leaflet-shell">
    <div ref="mapContainer" class="leaflet-map" role="img" aria-label="Mapa interativo de criticidade" />

    <div class="map-controls">
      <button type="button" class="map-control" aria-label="Aproximar" @click="zoomIn">+</button>
      <button type="button" class="map-control" aria-label="Afastar" @click="zoomOut">-</button>
    </div>
  </div>
</template>

<style scoped>
.leaflet-shell {
  position: relative;
  height: 100%;
}

.leaflet-map {
  width: 100%;
  height: 100%;
}

.map-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  display: grid;
  gap: 8px;
  z-index: 500;
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
</style>

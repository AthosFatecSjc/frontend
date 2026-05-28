<script setup lang="ts">
import { computed, ref } from 'vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiLabel from '@/components/ui/UiLabel.vue'

const props = defineProps<{
  regiaoId: string
  regiaoNome?: string
}>()

const indicadorSelecionado = ref<'DEC' | 'FEC'>('DEC')

const graphSource = computed(() => `/modelos-graficos/previsao_${indicadorSelecionado.value.toLowerCase()}_${props.regiaoId}.png`)
const seriesSource = computed(() => `/modelos-graficos/serie_temporal_${props.regiaoId}.png`)
const altText = computed(() => `Previsão de ${indicadorSelecionado.value} para ${props.regiaoNome || 'região selecionada'}`)

function mudarIndicador(novoIndicador: 'DEC' | 'FEC') {
  indicadorSelecionado.value = novoIndicador
}
</script>

<template>
  <UiCard class="grafico-previsao">
    <template #header>
      <div class="card-header">
        <div>
          <h2>Previsão do Modelo</h2>
          <p class="subtitle">Gráficos estáticos gerados no Colab com Prophet. Histórico real e previsão futura em destaque.</p>
        </div>

        <div class="indicador-buttons">
          <UiButton
            :variant="indicadorSelecionado === 'DEC' ? 'primary' : 'secondary'"
            size="small"
            @click="mudarIndicador('DEC')"
          >
            DEC
          </UiButton>
          <UiButton
            :variant="indicadorSelecionado === 'FEC' ? 'primary' : 'secondary'"
            size="small"
            @click="mudarIndicador('FEC')"
          >
            FEC
          </UiButton>
        </div>
      </div>
    </template>

    <div class="card-content">
      <div class="image-section">
        <figure class="image-card">
          <img :src="graphSource" :alt="altText" class="graph-image" />
          <figcaption>Previsão do indicador {{ indicadorSelecionado }} para {{ props.regiaoNome }}.</figcaption>
        </figure>
      </div>

      <div class="image-section secondary">
        <figure class="image-card">
          <img :src="seriesSource" :alt="`Série temporal da região ${props.regiaoNome}`" class="graph-image" />
          <figcaption>Série temporal comparativa dos indicadores para {{ props.regiaoNome }}.</figcaption>
        </figure>
      </div>
    </div>
  </UiCard>
</template>

<style scoped>
.grafico-previsao {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #555;
  line-height: 1.5;
}

.indicador-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.card-content {
  display: grid;
  gap: 1.5rem;
}

.grafico-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background-color: #f7fbff;
  border: 1px solid #d7e9ff;
  border-radius: 12px;
}

.grafico-info p {
  margin: 0.35rem 0 0;
  color: #444;
  font-size: 0.95rem;
  line-height: 1.4;
}

.image-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.image-section.secondary {
  margin-top: 0.5rem;
}

.image-card {
  border: 1px solid #ebf0f5;
  border-radius: 16px;
  overflow: hidden;
  background-color: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 34, 78, 0.06);
}

.graph-image {
  width: 100%;
  display: block;
  object-fit: contain;
}

.image-card figcaption {
  margin: 0;
  padding: 0.75rem 1rem;
  background-color: #f9fafb;
  color: #555;
  font-size: 0.9rem;
  border-top: 1px solid #eceff4;
}

.label {
  display: block;
  font-weight: 700;
  margin-bottom: 0.4rem;
  color: #222;
}

@media (max-width: 768px) {
  .card-header {
    align-items: flex-start;
  }
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchPrevisao } from '@/services/previsaoService'
import type { ResultadoPrevisao } from '@/types/previsao'
import UiCard from '@/components/ui/UiCard.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiLabel from '@/components/ui/UiLabel.vue'

const props = defineProps<{
  conjuntoId: string
  conjuntoNome?: string
}>()

import Chart from 'chart.js/auto'

interface ChartContext extends CanvasRenderingContext2D {
  chart?: Chart
}

const indicadorSelecionado = ref<'DEC' | 'FEC'>('DEC')
const carregando = ref(false)
const erro = ref('')
const previsao = ref<ResultadoPrevisao | null>(null)
const chartContainerId = ref(`chart-${Date.now()}`)

// Prepara os dados para o gráfico
const dadosGrafico = computed(() => {
  if (!previsao.value) return null

  const labels = previsao.value.dados.map((d) => {
    const data = new Date(d.data)
    return data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  })

  const datasReais = previsao.value.dados.map((d) => ({
    x: d.data,
    y: d.valorReal ?? null,
  }))

  const datasPrevisao = previsao.value.dados.map((d) => ({
    x: d.data,
    y: d.valorPrevisao ?? null,
  }))

  return {
    labels,
    datasReais,
    datasPrevisao,
    intervaloInferior: previsao.value.dados.map((d) => d.intervaloInferior ?? null),
    intervaloSuperior: previsao.value.dados.map((d) => d.intervaloSuperior ?? null),
  }
})

// Calcula estatísticas
const estatisticas = computed(() => {
  if (!previsao.value) return null

  const dadosReais = previsao.value.dados.filter((d) => d.valorReal !== undefined)
  const dadosPrevisao = previsao.value.dados.filter((d) => d.valorPrevisao !== undefined)

  const calcularMedia = (arr: (number | undefined)[]) => {
    const valores = arr.filter((v) => v !== undefined) as number[]
    return valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0
  }

  const calcularMax = (arr: (number | undefined)[]) => {
    const valores = arr.filter((v) => v !== undefined) as number[]
    return valores.length > 0 ? Math.max(...valores) : 0
  }

  const calcularMin = (arr: (number | undefined)[]) => {
    const valores = arr.filter((v) => v !== undefined) as number[]
    return valores.length > 0 ? Math.min(...valores) : 0
  }

  return {
    historico: {
      media: calcularMedia(dadosReais.map((d) => d.valorReal)),
      max: calcularMax(dadosReais.map((d) => d.valorReal)),
      min: calcularMin(dadosReais.map((d) => d.valorReal)),
      total: dadosReais.length,
    },
    previsao: {
      media: calcularMedia(dadosPrevisao.map((d) => d.valorPrevisao)),
      max: calcularMax(dadosPrevisao.map((d) => d.valorPrevisao)),
      min: calcularMin(dadosPrevisao.map((d) => d.valorPrevisao)),
      total: dadosPrevisao.length,
    },
  }
})

async function carregarPrevisao() {
  carregando.value = true
  erro.value = ''

  try {
    previsao.value = await fetchPrevisao(props.conjuntoId, indicadorSelecionado.value)
    // Renderizar gráfico após dados serem carregados
    await new Promise((resolve) => setTimeout(resolve, 100))
    renderizarGrafico()
  } catch (e) {
    erro.value = 'Erro ao carregar previsão. Tente novamente.'
    console.error(e)
  } finally {
    carregando.value = false
  }
}

function renderizarGrafico() {
  if (!previsao.value) return

  const canvas = document.getElementById(chartContainerId.value) as HTMLCanvasElement | null
  if (!canvas) return

  const ctx = canvas.getContext('2d') as ChartContext
  if (!ctx) return

  // Limpar gráfico anterior se existir
  if (ctx.chart) {
    ctx.chart.destroy()
  }

  const dados = dadosGrafico.value
  if (!dados) return

  // Criar dados para o gráfico
  interface ChartDataset {
    label: string
    data: (number | null)[]
    borderColor: string
    backgroundColor: string
    borderWidth: number
    fill: boolean
    pointRadius: number
    pointBackgroundColor: string
    pointBorderColor: string
    pointBorderWidth: number
    tension: number
    borderDash?: number[]
  }

  const chartData = {
    labels: dados.labels,
    datasets: [
      {
        label: '📊 Histórico Real',
        data: previsao.value.dados.map((d) => d.valorReal ?? null),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        borderWidth: 2,
        fill: false,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
      },
      {
        label: '🔮 Previsão',
        data: previsao.value.dados.map((d) => d.valorPrevisao ?? null),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(255, 159, 64)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
      },
      {
        label: '📈 Intervalo Superior',
        data: previsao.value.dados.map((d) => d.intervaloSuperior ?? null),
        borderColor: 'rgba(255, 159, 64, 0.3)',
        backgroundColor: 'rgba(255, 159, 64, 0.05)',
        borderWidth: 1,
        borderDash: [2, 2],
        fill: false,
        pointRadius: 0,
        tension: 0.4,
      },
      {
        label: '📉 Intervalo Inferior',
        data: previsao.value.dados.map((d) => d.intervaloInferior ?? null),
        borderColor: 'rgba(255, 159, 64, 0.3)',
        backgroundColor: 'rgba(255, 159, 64, 0.05)',
        borderWidth: 1,
        borderDash: [2, 2],
        fill: false,
        pointRadius: 0,
        tension: 0.4,
      },
    ] as ChartDataset[],
  }

  // Criar instância do Chart
  const ChartLib = (window as { Chart?: typeof Chart }).Chart
  if (!ChartLib) return

  ctx.chart = new ChartLib(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { size: 12 },
            padding: 15,
            usePointStyle: true,
          },
        },
        title: {
          display: true,
          text: `Previsão de ${indicadorSelecionado.value} - ${props.conjuntoNome || 'Conjunto'}`,
          font: { size: 16, weight: 'bold' },
          padding: 20,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 13 },
          bodyFont: { size: 12 },
          callbacks: {
            label: (context: { dataset: { label?: string }; parsed: { y: number | null } }) => {
              let label = context.dataset.label || ''
              if (label) label += ': '
              if (context.parsed.y !== null) {
                label += (context.parsed.y as number).toFixed(2)
              }
              return label
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: { display: true, text: 'Data', font: { size: 12 } },
        },
        y: {
          display: true,
          title: { display: true, text: `Valor ${indicadorSelecionado.value}`, font: { size: 12 } },
          min: 0,
        },
      },
    },
  })
}

onMounted(() => {
  carregarPrevisao()
})

function mudarIndicador(novoIndicador: 'DEC' | 'FEC') {
  indicadorSelecionado.value = novoIndicador
  carregarPrevisao()
}
</script>

<template>
  <UiCard class="grafico-previsao">
    <template #header>
      <div class="card-header">
        <h2>Previsão de Indicadores</h2>
        <div class="indicador-buttons">
          <UiButton
            :variant="indicadorSelecionado === 'DEC' ? 'primary' : 'secondary'"
            size="small"
            @click="mudarIndicador('DEC')"
            :disabled="carregando"
          >
            DEC
          </UiButton>
          <UiButton
            :variant="indicadorSelecionado === 'FEC' ? 'primary' : 'secondary'"
            size="small"
            @click="mudarIndicador('FEC')"
            :disabled="carregando"
          >
            FEC
          </UiButton>
        </div>
      </div>
    </template>

    <div class="card-content">
      <!-- Mensagem de erro -->
      <div v-if="erro" class="erro-message">
        {{ erro }}
      </div>

      <!-- Carregando -->
      <div v-if="carregando" class="loading-state">
        <p>Carregando previsão...</p>
      </div>

      <!-- Gráfico -->
      <template v-else-if="previsao">
        <div class="chart-container">
          <canvas :id="chartContainerId"></canvas>
        </div>

        <!-- Estatísticas -->
        <div v-if="estatisticas" class="estatisticas">
          <div class="estat-row">
            <div class="estat-item historico">
              <UiLabel class="label">📊 Histórico Real</UiLabel>
              <div class="valores">
                <div class="valor-item">
                  <span class="label-pequeno">Média</span>
                  <span class="valor">{{ estatisticas.historico.media.toFixed(2) }}</span>
                </div>
                <div class="valor-item">
                  <span class="label-pequeno">Máx</span>
                  <span class="valor">{{ estatisticas.historico.max.toFixed(2) }}</span>
                </div>
                <div class="valor-item">
                  <span class="label-pequeno">Mín</span>
                  <span class="valor">{{ estatisticas.historico.min.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div class="estat-item previsao">
              <UiLabel class="label">🔮 Previsão</UiLabel>
              <div class="valores">
                <div class="valor-item">
                  <span class="label-pequeno">Média</span>
                  <span class="valor">{{ estatisticas.previsao.media.toFixed(2) }}</span>
                </div>
                <div class="valor-item">
                  <span class="label-pequeno">Máx</span>
                  <span class="valor">{{ estatisticas.previsao.max.toFixed(2) }}</span>
                </div>
                <div class="valor-item">
                  <span class="label-pequeno">Mín</span>
                  <span class="valor">{{ estatisticas.previsao.min.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
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
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  flex: 1;
}

.indicador-buttons {
  display: flex;
  gap: 0.5rem;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-height: 400px;
}

.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
  margin-bottom: 1rem;
}

.chart-container canvas {
  max-width: 100%;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #999;
  font-size: 1.1rem;
}

.erro-message {
  padding: 1rem;
  background-color: #fee;
  border-left: 4px solid #f66;
  color: #c33;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.estatisticas {
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.estat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.estat-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: white;
  border-radius: 6px;
  border-left: 4px solid #ccc;
}

.estat-item.historico {
  border-left-color: rgb(75, 192, 192);
}

.estat-item.previsao {
  border-left-color: rgb(255, 159, 64);
}

.estat-item .label {
  font-weight: 600;
  font-size: 0.95rem;
}

.valores {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.valor-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background-color: #fafafa;
  border-radius: 4px;
  text-align: center;
}

.label-pequeno {
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
}

.valor {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .card-header h2 {
    margin-bottom: 0.5rem;
  }

  .indicador-buttons {
    width: 100%;
  }

  .chart-container {
    height: 300px;
  }

  .valores {
    grid-template-columns: 1fr;
  }
}
</style>

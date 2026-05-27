<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout.vue'
import GraficoPrevisao from '@/components/mapa/GraficoPrevisao.vue'
import UiCard from '@/components/ui/UiCard.vue'

// Mock data: em produção, virá da API
const conjuntosSelecionaveis = ref([
  { id: '1', nome: 'Conjunto Sul - PA' },
  { id: '2', nome: 'Conjunto Leste - PA' },
  { id: '3', nome: 'Conjunto Oeste - PA' },
  { id: '4', nome: 'Conjunto Centro - PA' },
])

const conjuntoSelecionado = ref<{ id: string; nome: string } | null>(null)

const informacaoGeral = ref(`
Previsões de Indicadores de Continuidade

Esta tela exibe análises preditivas dos indicadores DEC (Duração Equivalente de Interrupção por Consumidor) 
e FEC (Frequência Equivalente de Interrupção por Consumidor) baseadas em modelos de série temporal 
treinados com dados históricos da ANEEL.

As previsões mostram:
- 📊 Histórico Real: Dados coletados nos últimos 24 meses
- 🔮 Previsão: Estimativas para os próximos 12 meses
- 📈 Intervalo de Confiança: Margem de erro esperada da previsão

Selecione um conjunto de unidades consumidoras para visualizar as previsões.
`)

onMounted(() => {
  // Seleciona o primeiro conjunto por padrão
  const primeiro = conjuntosSelecionaveis.value[0]
  if (primeiro && !conjuntoSelecionado.value) {
    conjuntoSelecionado.value = primeiro
  }
})
</script>

<template>
  <AuthenticatedLayout title="Previsão" description="Gráficos de previsibilidade com histórico real e previsões futuras">
    <div class="previsao-container">
      <!-- Título e Descrição -->
      <div class="secao-titulo">
        <h1>Gráficos de Previsibilidade</h1>
        <p class="descricao-geral">{{ informacaoGeral }}</p>
      </div>

      <!-- Seleção de Conjunto -->
      <UiCard class="card-selecao">
        <template #header>
          <h2>Selecione um Conjunto</h2>
        </template>

        <div class="selecao-conjunto">
          <div class="conjunto-grid">
            <div
              v-for="conjunto in conjuntosSelecionaveis"
              :key="conjunto.id"
              class="conjunto-item"
              :class="{ ativo: conjuntoSelecionado?.id === conjunto.id }"
              @click="conjuntoSelecionado = conjunto"
            >
              <span class="conjunto-nome">{{ conjunto.nome }}</span>
            </div>
          </div>
        </div>
      </UiCard>

      <!-- Gráfico Selecionado -->
      <template v-if="conjuntoSelecionado">
        <GraficoPrevisao :conjunto-id="conjuntoSelecionado.id" :conjunto-nome="conjuntoSelecionado.nome" />
      </template>

      <!-- Legenda de Cores -->
      <UiCard class="card-legenda">
        <template #header>
          <h3>Legenda</h3>
        </template>

        <div class="legenda-grid">
          <div class="legenda-item">
            <div class="legenda-cor historico"></div>
            <div>
              <strong>📊 Histórico Real</strong>
              <p>Dados coletados e verificados da ANEEL</p>
            </div>
          </div>

          <div class="legenda-item">
            <div class="legenda-cor previsao"></div>
            <div>
              <strong>🔮 Previsão</strong>
              <p>Estimativa calculada pelo modelo de IA</p>
            </div>
          </div>

          <div class="legenda-item">
            <div class="legenda-cor intervalo"></div>
            <div>
              <strong>📈📉 Intervalo de Confiança</strong>
              <p>Margem de erro esperada (limite superior e inferior)</p>
            </div>
          </div>
        </div>
      </UiCard>

      <!-- Informações Técnicas -->
      <UiCard class="card-info">
        <template #header>
          <h3>Informações Técnicas</h3>
        </template>

        <div class="info-content">
          <div class="info-section">
            <h4>Indicadores</h4>
            <ul>
              <li>
                <strong>DEC</strong> - Duração Equivalente de Interrupção por Consumidor: tempo total de
                interrupção dividido pelo número de consumidores
              </li>
              <li>
                <strong>FEC</strong> - Frequência Equivalente de Interrupção por Consumidor: número total de
                interrupções dividido pelo número de consumidores
              </li>
            </ul>
          </div>

          <div class="info-section">
            <h4>Metodologia</h4>
            <ul>
              <li>Modelo: Prophet (Decomposição sazonal + Tendência)</li>
              <li>Dados de treinamento: 2010 - 2019 (ANEEL)</li>
              <li>Frequência: Mensal</li>
              <li>Horizonte de previsão: 12 meses</li>
            </ul>
          </div>

          <div class="info-section">
            <h4>Interpretação</h4>
            <ul>
              <li>Quanto menor os valores de DEC e FEC, melhor a qualidade do serviço</li>
              <li>O intervalo de confiança representa a incerteza da previsão</li>
              <li>Valores fora do intervalo indicam anomalias ou mudanças estruturais</li>
            </ul>
          </div>
        </div>
      </UiCard>
    </div>
  </AuthenticatedLayout>
</template>

<style scoped>
.previsao-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.secao-titulo {
  margin-bottom: 1rem;
}

.secao-titulo h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: #333;
}

.descricao-geral {
  font-size: 1rem;
  line-height: 1.6;
  color: #666;
  white-space: pre-wrap;
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
}

.card-selecao {
  width: 100%;
}

.selecao-conjunto {
  padding: 1rem;
}

.conjunto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.conjunto-item {
  padding: 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
  min-height: 80px;
}

.conjunto-item:hover {
  border-color: #2196f3;
  background-color: #f0f7ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.15);
}

.conjunto-item.ativo {
  border-color: #2196f3;
  background-color: #e3f2fd;
  font-weight: 600;
  color: #1976d2;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.25);
}

.conjunto-nome {
  font-size: 1rem;
  text-align: center;
}

.card-legenda {
  width: 100%;
}

.legenda-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.legenda-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.legenda-cor {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 0.2rem;
}

.legenda-cor.historico {
  background-color: rgb(75, 192, 192);
}

.legenda-cor.previsao {
  background-color: rgb(255, 159, 64);
  border: 2px dashed rgba(0, 0, 0, 0.3);
}

.legenda-cor.intervalo {
  background: linear-gradient(45deg, rgba(255, 159, 64, 0.3) 50%, transparent 50%);
  border: 1px dashed rgb(255, 159, 64);
}

.legenda-item strong {
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.25rem;
  display: block;
}

.legenda-item p {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}

.card-info {
  width: 100%;
}

.info-content {
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.info-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #2196f3;
  padding-bottom: 0.5rem;
}

.info-section ul {
  margin: 0;
  padding-left: 1.5rem;
  list-style: none;
}

.info-section li {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;
  position: relative;
  padding-left: 1rem;
}

.info-section li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #2196f3;
  font-weight: bold;
}

.info-section strong {
  color: #333;
}

@media (max-width: 768px) {
  .previsao-container {
    padding: 1rem;
  }

  .secao-titulo h1 {
    font-size: 1.8rem;
  }

  .conjunto-grid {
    grid-template-columns: 1fr;
  }

  .info-content {
    grid-template-columns: 1fr;
  }

  .legenda-grid {
    grid-template-columns: 1fr;
  }
}
</style>

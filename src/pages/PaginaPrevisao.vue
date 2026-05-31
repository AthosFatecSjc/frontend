<script setup lang="ts">
import { computed, ref } from 'vue'
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout.vue'
import GraficoPrevisao from '@/components/mapa/GraficoPrevisao.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiLabel from '@/components/ui/UiLabel.vue'

const regioesDisponiveis = [
  { id: 'centro_oeste', nome: 'Centro-Oeste' },
  { id: 'nordeste', nome: 'Nordeste' },
  { id: 'norte', nome: 'Norte' },
  { id: 'sul', nome: 'Sul' },
  { id: 'suldeste', nome: 'Sudeste' },
]

const regiaoIdSelecionada = ref('centro_oeste')
const indicadorSelecionado = ref<'DEC' | 'FEC'>('DEC')

const regiaoSelecionada = computed(
  () => regioesDisponiveis.find((r) => r.id === regiaoIdSelecionada.value) ?? regioesDisponiveis[0]!,
)
</script>

<template>
  <AuthenticatedLayout
    title="Gráficos de Previsibilidade"
    description="Gráficos gerados pelo modelo Prophet. A página apresenta as previsões, com separação clara entre histórico real e previsão futura."
  >
    <div class="previsao-container">
      <!-- Filtros -->
      <UiCard class="filters-panel">
        <div class="filters-grid">
          <div class="field-group">
            <UiLabel class="field-label">Região</UiLabel>
            <select v-model="regiaoIdSelecionada" class="field-input">
              <option v-for="regiao in regioesDisponiveis" :key="regiao.id" :value="regiao.id">
                {{ regiao.nome }}
              </option>
            </select>
          </div>
          <div class="field-group">
            <UiLabel class="field-label">Indicador</UiLabel>
            <select v-model="indicadorSelecionado" class="field-input">
              <option value="DEC">DEC — Duração Equivalente de Interrupção</option>
              <option value="FEC">FEC — Frequência Equivalente de Interrupção</option>
            </select>
          </div>
        </div>
      </UiCard>

      <!-- Gráficos -->
      <GraficoPrevisao
        :regiao-id="regiaoSelecionada.id"
        :regiao-nome="regiaoSelecionada.nome"
        :indicador="indicadorSelecionado"
      />

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

.filters-panel {
  padding: 18px 20px;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: end;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-label {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}

.field-input {
  width: 100%;
  box-sizing: border-box;
  background: #eefcff;
  color: #111827;
  border: 1px solid #dde2ea;
  border-radius: 1rem;
  padding: 0.8rem 0.9rem;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
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

  .filters-grid {
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

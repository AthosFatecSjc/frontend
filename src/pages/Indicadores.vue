<template>
  <div>
    <h1>Indicadores</h1>
    <div v-if="loading">Carregando...</div>
    <div v-else>
      <table v-if="indicadores.length">
        <thead>
          <tr>
            <th>ID</th>
            <th>Concessionária</th>
            <th>Ano</th>
            <th>Mês</th>
            <th>DEC Anual</th>
            <th>FEC Anual</th>
            <th>Data Atualização</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="indicador in indicadores" :key="indicador.id">
            <td>{{ indicador.id }}</td>
            <td>{{ indicador.concessionaria?.nome }}</td>
            <td>{{ indicador.ano }}</td>
            <td>{{ indicador.mes }}</td>
            <td>{{ indicador.decAnual }}</td>
            <td>{{ indicador.fecAnual }}</td>
            <td>{{ indicador.dataAtualizacao }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else>Nenhum indicador encontrado.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Concessionaria {
  id: number;
  nome: string;
  codigoAneel: string;
  regiao: string;
  dataCadastro: string;
}

interface Indicador {
  id: number;
  concessionaria: Concessionaria;
  ano: number;
  mes: number;
  decAnual: number;
  fecAnual: number;
  dataAtualizacao: string;
}

const indicadores = ref<Indicador[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await fetch('/api/indicadores');
    if (res.ok) {
      indicadores.value = await res.json();
    }
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}
th {
  background: #f0f0f0;
}
</style>

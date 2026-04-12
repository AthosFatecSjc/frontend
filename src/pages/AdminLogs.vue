<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AuthenticatedLayout from '../components/layout/AuthenticatedLayout.vue'
import { fetchAdminLogs } from '../services/adminLogs'
import type { AdminLogsFilters } from '../types/adminLogs'

type LogRow = {
  id: string
  createdAt: string
  origem: string
  usuario: string
  alvo: string
  evento: string
  descricao: string
  resultado: string
  categoria: string
  moduloResponsavel: string
}

const PAGE_SIZE = 10

const EVENT_OPTIONS = [
  { value: 'LOGIN_ATTEMPT', label: 'Tentativa de login' },
  { value: 'LOGIN_SUCCESS', label: 'Login com sucesso' },
  { value: 'LOGIN_FAIL', label: 'Falha no login' },
  { value: 'USER_REGISTER', label: 'Cadastro de usuario' },
  { value: 'USER_APPROVED', label: 'Usuario aprovado' },
  { value: 'USER_REJECTED', label: 'Usuario rejeitado' },
  { value: 'USER_EDITED', label: 'Usuario editado' },
  { value: 'USER_ANONYMIZED', label: 'Usuario anonimizado' },
  { value: 'USER_ANONYMIZATION_REAPPLIED', label: 'Reaplicacao de anonimizacao' },
  { value: 'ADMIN_ROLE_GRANTED', label: 'Perfil admin concedido' },
  { value: 'ADMIN_ROLE_REMOVED', label: 'Perfil admin removido' },
  { value: 'BACKUP_RESTORE_RECONCILIATION', label: 'Reconciliacao de backup' },
  { value: 'ANEEL_EXTRACTION_START', label: 'Extracao ANEEL iniciada' },
  { value: 'ANEEL_EXTRACTION_SUCCESS', label: 'Extracao ANEEL com sucesso' },
  { value: 'ANEEL_EXTRACTION_FAIL', label: 'Falha na extracao ANEEL' },
] as const

const RESULT_OPTIONS = [
  { value: 'SUCCESS', label: 'Sucesso' },
  { value: 'FAIL', label: 'Falha' },
] as const

const eventLabelMap = Object.fromEntries(EVENT_OPTIONS.map((item) => [item.value, item.label]))

const logs = ref<LogRow[]>([])
const total = ref(0)
const totalPages = ref(1)
const isLoading = ref(false)
const error = ref('')
const isAdmin = ref(true)
const currentPage = ref(1)

const filters = ref<Required<AdminLogsFilters>>({
  startDate: '',
  endDate: '',
  event: '',
  result: '',
})

const visiblePages = computed(() => {
  const totalPageCount = totalPages.value
  const page = currentPage.value

  if (totalPageCount <= 7) {
    return Array.from({ length: totalPageCount }, (_, index) => index + 1)
  }

  const pages: (number | string)[] = [1]

  if (page > 3) pages.push('...')

  for (let index = Math.max(2, page - 1); index <= Math.min(totalPageCount - 1, page + 1); index++) {
    pages.push(index)
  }

  if (page < totalPageCount - 2) pages.push('...')

  pages.push(totalPageCount)
  return pages
})

const paginationStart = computed(() => {
  if (total.value === 0) return 0
  return (currentPage.value - 1) * PAGE_SIZE + 1
})

const paginationEnd = computed(() => Math.min(currentPage.value * PAGE_SIZE, total.value))

async function loadLogs() {
  isLoading.value = true
  error.value = ''

  try {
    const pageResponse = await fetchAdminLogs(currentPage.value - 1, PAGE_SIZE, filters.value)
    isAdmin.value = true

    logs.value = pageResponse.content.map<LogRow>((item) => ({
      id: String(item.id),
      createdAt: item.createdAt,
      origem: item.sourceType,
      usuario: item.actorRef?.trim() || '-',
      alvo: item.targetRef?.trim() || '-',
      evento: item.event,
      descricao: item.description ?? '',
      resultado: item.result === 'SUCCESS' ? 'SUCCESS' : 'FAIL',
      categoria: item.logCategory?.trim() || '-',
      moduloResponsavel: item.createdByModule?.trim() || '-',
    }))

    total.value = pageResponse.totalElements
    totalPages.value = pageResponse.totalPages || 1
  } catch (exception) {
    const message = exception instanceof Error ? exception.message : 'Erro inesperado ao carregar logs.'
    const status = typeof exception === 'object' && exception !== null && 'status' in exception
      ? Number(exception.status)
      : 0

    if (status === 403) {
      isAdmin.value = false
      error.value = ''
    } else {
      error.value = message
    }

    logs.value = []
    total.value = 0
    totalPages.value = 1
  } finally {
    isLoading.value = false
  }
}

function applyFilters() {
  if ((filters.value.startDate && !filters.value.endDate) || (!filters.value.startDate && filters.value.endDate)) {
    error.value = 'Preencha data inicial e final para aplicar o filtro por periodo.'
    return
  }

  if (filters.value.startDate && filters.value.endDate && filters.value.startDate > filters.value.endDate) {
    error.value = 'A data inicial nao pode ser maior que a data final.'
    return
  }

  currentPage.value = 1
  void loadLogs()
}

function clearFilters() {
  filters.value = {
    startDate: '',
    endDate: '',
    event: '',
    result: '',
  }
  error.value = ''
  currentPage.value = 1
  void loadLogs()
}

function prevPage() {
  if (currentPage.value <= 1) return
  currentPage.value--
  void loadLogs()
}

function nextPage() {
  if (currentPage.value >= totalPages.value) return
  currentPage.value++
  void loadLogs()
}

function goToPage(page: number) {
  currentPage.value = page
  void loadLogs()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatResult(result: string) {
  return result === 'SUCCESS' ? 'SUCCESS' : 'FAIL'
}

function formatEvent(event: string) {
  return eventLabelMap[event] ?? event
}

onMounted(() => {
  void loadLogs()
})
</script>

<template>
  <AuthenticatedLayout
    title="Logs e Auditoria"
    description="Consulta de eventos criticos da plataforma para monitoramento tecnico e rastreabilidade administrativa"
  >
    <div v-if="!isAdmin" class="state-container state-restricted">
      <div class="state-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      </div>
      <p class="state-title">Acesso restrito</p>
      <p class="state-text">Area acessivel apenas por administradores autorizados.</p>
    </div>

    <template v-else>
      <UiCard class="filters-panel">
        <div class="filters-grid">
          <div class="field-group">
            <UiLabel class="field-label">Data inicial</UiLabel>
            <UiInput v-model="filters.startDate" type="date" class="field-input" />
          </div>
          <div class="field-group">
            <UiLabel class="field-label">Data final</UiLabel>
            <UiInput v-model="filters.endDate" type="date" class="field-input" />
          </div>
          <div class="field-group">
            <UiLabel class="field-label">Evento</UiLabel>
            <select v-model="filters.event" class="field-input">
              <option value="">Todos os eventos</option>
              <option v-for="option in EVENT_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="field-group">
            <UiLabel class="field-label">Resultado</UiLabel>
            <select v-model="filters.result" class="field-input">
              <option value="">Todos os resultados</option>
              <option v-for="option in RESULT_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="field-group field-group--action">
            <UiButton class="btn-apply" @click="applyFilters">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Filtrar
            </UiButton>
            <UiButton class="btn-clear" variant="secondary" @click="clearFilters">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
              Limpar
            </UiButton>
          </div>
        </div>
      </UiCard>

      <div v-if="isLoading" class="state-container">
        <div class="spinner"></div>
        <p class="state-text">Carregando registros...</p>
      </div>

      <UiAlert v-if="error" tone="danger" class="alert-inline">
        <div class="alert-inline__content">
          <div>
            <p class="state-title">Erro ao carregar</p>
            <p class="state-text">{{ error }}</p>
          </div>
          <UiButton class="btn-clear-inline" variant="secondary" @click="loadLogs">Tentar novamente</UiButton>
        </div>
      </UiAlert>

      <div v-if="!isLoading && total === 0 && !error" class="state-container state-empty">
        <div class="state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </div>
        <p class="state-title">Nenhum registro encontrado</p>
        <p class="state-text">Tente ajustar os filtros para ampliar a busca.</p>
        <UiButton class="btn-clear-inline" variant="secondary" @click="clearFilters">Limpar filtros</UiButton>
      </div>

      <UiCard v-if="!isLoading && logs.length > 0" class="table-wrapper">
        <table class="logs-table">
          <thead>
            <tr>
              <th>Data / Hora</th>
              <th>Origem</th>
              <th>Ator</th>
              <th>Alvo</th>
              <th>Evento</th>
              <th>Categoria</th>
              <th>Descricao</th>
              <th>Status</th>
              <th>Modulo responsavel</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td class="td-mono">{{ formatDate(log.createdAt) }}</td>
              <td><UiBadge class="tag-source">{{ log.origem }}</UiBadge></td>
              <td class="td-placeholder">{{ log.usuario }}</td>
              <td class="td-placeholder">{{ log.alvo }}</td>
              <td>{{ formatEvent(log.evento) }}</td>
              <td><UiBadge class="tag-category">{{ log.categoria }}</UiBadge></td>
              <td class="td-description">{{ log.descricao }}</td>
              <td>
                <UiBadge :tone="log.resultado === 'SUCCESS' ? 'success' : 'danger'">
                  {{ formatResult(log.resultado) }}
                </UiBadge>
              </td>
              <td class="td-placeholder">{{ log.moduloResponsavel }}</td>
            </tr>
          </tbody>
        </table>
      </UiCard>

      <div v-if="!isLoading && totalPages > 1" class="pagination-section">
        <div class="pagination-info">
          Mostrando {{ paginationStart }} a {{ paginationEnd }} de {{ total }} registros
        </div>
        <div class="pagination">
          <UiButton class="pag-btn" variant="secondary" :disabled="currentPage === 1" @click="prevPage">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"/></svg>
            Anterior
          </UiButton>
          <div class="pag-pages">
            <button
              v-for="page in visiblePages"
              :key="page"
              class="pag-num"
              :class="{ active: page === currentPage, ellipsis: page === '...' }"
              @click="typeof page === 'number' ? goToPage(page) : null"
            >
              {{ page }}
            </button>
          </div>
          <UiButton class="pag-btn" variant="secondary" :disabled="currentPage === totalPages" @click="nextPage">
            Proxima
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
          </UiButton>
        </div>
      </div>
    </template>
  </AuthenticatedLayout>
</template>

<style scoped>
.filters-panel {
  padding: 18px 20px;
  margin-bottom: 20px;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr minmax(210px, auto);
  gap: 12px;
  align-items: end;
}

@media (max-width: 860px) {
  .filters-grid {
    grid-template-columns: 1fr 1fr;
  }

  .field-group--action {
    grid-column: 1 / -1;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .field-group--action .btn-apply,
  .field-group--action .btn-clear {
    flex: 1 1 140px;
    justify-content: center;
  }
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-group--action {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: stretch;
  justify-content: flex-end;
}

.field-label {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}

.field-input {
  border: 1px solid #dde2ea;
  font-size: 0.85rem;
  color-scheme: light;
}

.field-input.ui-input {
  min-height: 2.6rem;
  border-radius: 0.9rem;
}

.field-input:not(.ui-input) {
  width: 100%;
  box-sizing: border-box;
  background: #eefcff;
  color: #111827;
  border-radius: 1rem;
  padding: 0.8rem 0.9rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.btn-apply {
  width: auto;
  min-width: 120px;
  min-height: 2.6rem;
  white-space: nowrap;
}

.btn-clear {
  width: auto;
  min-width: 120px;
  min-height: 2.6rem;
  white-space: nowrap;
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 72px 24px;
  background: #ffffff;
  border: 1px solid #dde2ea;
  border-radius: 8px;
  text-align: center;
}

.state-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f0f3f7;
  border: 1px solid #dde2ea;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  margin-bottom: 4px;
}

.state-error .state-icon {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.2);
}

.state-restricted .state-icon {
  color: #b45309;
  background: rgba(180, 83, 9, 0.08);
  border-color: rgba(180, 83, 9, 0.2);
}

.state-empty .state-icon {
  color: #9ca3af;
}

.state-title {
  font-weight: 600;
  font-size: 1rem;
  color: #111827;
  margin: 0;
}

.state-text {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
  max-width: 320px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 2px solid #dde2ea;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin-bottom: 4px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-clear-inline {
  width: auto;
  min-height: 2.4rem;
  padding: 0.4rem 0.9rem;
}

.table-wrapper {
  overflow: hidden;
  overflow-x: auto;
  margin-bottom: 20px;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
  font-size: 0.84rem;
}

.logs-table thead {
  background: #f0f3f7;
  border-bottom: 1px solid #dde2ea;
}

.logs-table th {
  padding: 11px 14px;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #6b7280;
  white-space: nowrap;
  position: sticky;
  top: 0;
  background: #f0f3f7;
  z-index: 1;
  border-bottom: 1px solid #dde2ea;
}

.logs-table tbody tr {
  border-bottom: 1px solid #eef1f5;
  background: #ffffff;
  transition: background 0.1s;
}

.logs-table tbody tr:last-child {
  border-bottom: none;
}

.logs-table tbody tr:hover {
  background: #f0f3f7;
}

.logs-table td {
  padding: 10px 14px;
  vertical-align: middle;
  color: #111827;
}

.td-description {
  color: #475569;
  line-height: 1.45;
  white-space: normal;
}

.td-placeholder {
  color: #94a3b8;
  font-style: italic;
  white-space: nowrap;
}

.td-mono {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
  font-size: 0.78rem;
}

.tag-source {
  min-height: 1.8rem;
  padding: 0.2rem 0.7rem;
  letter-spacing: 0.04em;
}

.tag-category {
  min-height: 1.8rem;
  padding: 0.2rem 0.7rem;
  letter-spacing: 0.04em;
  background-color: #e9d5ff;
  color: #5b21b6;
}

.pagination-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.pagination-info {
  font-size: 0.8rem;
  color: #6b7280;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pag-btn {
  width: auto;
  min-width: 120px;
  min-height: 2.4rem;
  padding: 0.45rem 0.85rem;
}

.pag-pages {
  display: flex;
  gap: 4px;
}

.pag-num {
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 6px;
  color: #6b7280;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pag-num:hover:not(.ellipsis) {
  background: #ffffff;
  border-color: #dde2ea;
  color: #111827;
}

.pag-num.active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
  cursor: default;
}

.pag-num.ellipsis {
  cursor: default;
}

.alert-inline {
  margin-bottom: 20px;
}

.alert-inline__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

@media (max-width: 720px) {
  .alert-inline__content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

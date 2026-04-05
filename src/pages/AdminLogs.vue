<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AuthenticatedLayout from '../components/layout/AuthenticatedLayout.vue'
import type { StoredUser } from '../types/auth'

type BackendLogResponse = {
  id: number
  timestamp: string
  actorRef?: string
  sourceType: string
  event: string
  result: string
  description?: string
  metadata?: string
  createdByModule?: string
  module?: string
}

type BackendLogsPayload =
  | BackendLogResponse[]
  | { data?: BackendLogResponse[]; content?: BackendLogResponse[]; logs?: BackendLogResponse[] }

type LogRow = {
  id: string
  timestamp: string
  origem: string
  usuario: string
  evento: string
  descricao: string
  resultado: string
  moduloResponsavel: string
}

const API_URL = '/api/admin/logs'
const PAGE_SIZE = 50

const allLogs = ref<LogRow[]>([])
const total = ref(0)
const isLoading = ref(false)
const error = ref('')
const isAdmin = ref(false)
const currentPage = ref(1)

const filters = ref({
  startDate: '',
  endDate: '',
  evento: '',
  resultado: '',
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

const logs = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return allLogs.value.slice(start, end)
})

const visiblePages = computed(() => {
  const t = totalPages.value
  const c = currentPage.value
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (c > 3) pages.push('...')
  for (let i = Math.max(2, c - 1); i <= Math.min(t - 1, c + 1); i++) pages.push(i)
  if (c < t - 2) pages.push('...')
  pages.push(t)
  return pages
})

async function fetchLogs() {
  isLoading.value = true
  error.value = ''

  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

    const payload: BackendLogsPayload = await res.json()
    const logsList = extractLogs(payload)

    const mapped = logsList.map<LogRow>((item) => ({
      id: String(item.id),
      timestamp: item.timestamp,
      origem: item.sourceType,
      usuario: item.actorRef?.trim() || 'Pendente no backend',
      evento: item.event,
      descricao: item.description ?? '',
      resultado: item.result === 'SUCCESS' ? 'SUCCESS' : 'FAIL',
      moduloResponsavel: getModuleValue(item),
    }))

    allLogs.value = mapped
    total.value = mapped.length
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro inesperado ao carregar logs.'
    allLogs.value  = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

function extractLogs(payload: BackendLogsPayload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.content)) return payload.content
  if (Array.isArray(payload.logs)) return payload.logs

  throw new Error('Formato de resposta invalido para logs.')
}

function getModuleValue(item: BackendLogResponse) {
  const direct = item.createdByModule?.trim() || item.module?.trim()
  if (direct) return direct

  return getModuleFromMetadata(item.metadata)
}

function applyFilters() {
  currentPage.value = 1
  fetchLogs()
}

function clearFilters() {
  filters.value = { startDate: '', endDate: '', evento: '', resultado: '' }
  currentPage.value = 1
  fetchLogs()
}

function prevPage() {
  if (currentPage.value > 1) { currentPage.value--; fetchLogs() }
}

function nextPage() {
  if (currentPage.value < totalPages.value) { currentPage.value++; fetchLogs() }
}

function goToPage(p: number) {
  currentPage.value = p
  fetchLogs()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function formatResult(result: string) {
  return result === 'SUCCESS' ? 'SUCCESS' : 'FAIL'
}

function getModuleFromMetadata(metadata?: string) {
  if (!metadata?.trim()) return 'Pendente no backend'

  try {
    const parsed = JSON.parse(metadata) as Record<string, unknown>
    const moduleValue = parsed.module ?? parsed.createdByModule
    if (typeof moduleValue === 'string' && moduleValue.trim()) return moduleValue.trim()
  } catch {
    const moduleMatch = metadata.match(/(?:module|createdByModule)\s*[=:]\s*([\w.-]+)/i)
    if (moduleMatch?.[1]) return moduleMatch[1]
  }

  return 'Pendente no backend'
}

function placeholderText(value: string) {
  return value
}

function checkAdmin() {
  const userStr = localStorage.getItem('currentUser')
  if (userStr) {
    const user: StoredUser = JSON.parse(userStr)
    isAdmin.value = user.role === 'ADMIN'
  }
}

onMounted(() => {
  checkAdmin()
  if (isAdmin.value) fetchLogs()
})
</script>

<template>
  <AuthenticatedLayout
    title="Logs e Auditoria"
    description="Consulta de eventos críticos da plataforma para monitoramento técnico e rastreabilidade administrativa"
  >
    <!-- Acesso restrito -->
    <div v-if="!isAdmin" class="state-container state-restricted">
      <div class="state-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      </div>
      <p class="state-title">Acesso restrito</p>
      <p class="state-text">Área acessível apenas por administradores autorizados.</p>
    </div>

    <template v-else>
      <!-- Filters -->
      <div class="filters-panel">
      <div class="filters-grid">
        <div class="field-group">
          <label class="field-label">Data inicial</label>
          <input type="date" v-model="filters.startDate" class="field-input" />
        </div>
        <div class="field-group">
          <label class="field-label">Data final</label>
          <input type="date" v-model="filters.endDate" class="field-input" />
        </div>
        <div class="field-group">
          <label class="field-label">Evento</label>
          <select v-model="filters.evento" class="field-input">
            <option value="">Todos os eventos</option>
            <option value="Login realizado">Login realizado</option>
            <option value="Tentativa de login">Tentativa de login</option>
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Resultado</label>
          <select v-model="filters.resultado" class="field-input">
            <option value="">Todos os resultados</option>
            <option value="Sucesso">Sucesso</option>
            <option value="Falha">Falha</option>
          </select>
        </div>
        <div class="field-group field-group--action">
          <button class="btn-apply" @click="applyFilters">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Filtrar
          </button>
          <button class="btn-clear" @click="clearFilters">Limpar</button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="state-container">
      <div class="spinner"></div>
      <p class="state-text">Carregando registros...</p>
    </div>

      <!-- Error -->
      <div v-if="error" class="state-container state-error">
        <div class="state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
        </div>
        <p class="state-title">Erro ao carregar</p>
        <p class="state-text">{{ error }}</p>
        <button class="btn-clear-inline" @click="fetchLogs">Tentar novamente</button>
      </div>
      <!-- Results bar -->
      <div class="results-bar">
        <span class="results-count">
          <strong>{{ total }}</strong>
          {{ total === 1 ? 'registro encontrado' : 'registros encontrados' }}
        </span>
        <span v-if="totalPages > 1" class="results-page">
          Pagina {{ currentPage }} de {{ totalPages }}
        </span>
      </div>

      <!-- Empty -->
      <div v-if="total === 0" class="state-container state-empty">
        <div class="state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </div>
        <p class="state-title">Nenhum registro encontrado</p>
        <p class="state-text">Tente ajustar os filtros para ampliar a busca.</p>
        <button class="btn-clear-inline" @click="clearFilters">Limpar filtros</button>
      </div>

      <!-- Table — dados ja paginados pelo backend, sem slice local -->
      <div v-else class="table-wrapper">
        <table class="logs-table">
          <thead>
            <tr>
              <th>Data / Hora</th>
              <th>Origem</th>
              <th>Usuario</th>
              <th>Evento</th>
              <th>Descricao</th>
              <th>Status</th>
              <th>Modulo responsavel</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td class="td-mono">{{ formatDate(log.timestamp) }}</td>
              <td><span class="tag tag-source">{{ log.origem }}</span></td>
              <td class="td-placeholder">{{ placeholderText(log.usuario) }}</td>
              <td>{{ log.evento }}</td>
              <td class="td-description">{{ log.descricao }}</td>
              <td>
                <span class="tag" :class="log.resultado === 'SUCCESS' ? 'tag-success' : 'tag-fail'">
                  {{ formatResult(log.resultado) }}
                </span>
              </td>
              <td class="td-placeholder">{{ placeholderText(log.moduloResponsavel) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginacao — totalPages vem de total/PAGE_SIZE -->
      <div v-if="totalPages > 1" class="pagination">
        <button class="pag-btn" @click="prevPage" :disabled="currentPage === 1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"/></svg>
          Anterior
        </button>
        <div class="pag-pages">
          <button
            v-for="p in visiblePages"
            :key="p"
            class="pag-num"
            :class="{ active: p === currentPage, ellipsis: p === '...' }"
            @click="typeof p === 'number' ? goToPage(p) : null"
          >{{ p }}</button>
        </div>
        <button class="pag-btn" @click="nextPage" :disabled="currentPage === totalPages">
          Proxima
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </template>
  </AuthenticatedLayout>
</template>

<style scoped>
/* Filters */
.filters-panel {
  background: #ffffff;
  border: 1px solid #dde2ea;
  border-radius: 8px;
  padding: 18px 20px;
  margin-bottom: 20px;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr auto;
  gap: 12px;
  align-items: end;
}

@media (max-width: 860px) {
  .filters-grid {
    grid-template-columns: 1fr 1fr;
  }
  .field-group--action {
    grid-column: 1 / -1;
  }
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-group--action {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.field-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}

.field-input {
  background: #f5f7fa;
  border: 1px solid #dde2ea;
  color: #111827;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
  color-scheme: light;
}

.field-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.btn-apply {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, transform 0.1s;
}

.btn-apply:hover {
  background: #1d4ed8;
}

.btn-apply:active {
  transform: scale(0.97);
}

.btn-clear {
  background: transparent;
  color: #6b7280;
  border: 1px solid #dde2ea;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
}

.btn-clear:hover {
  color: #111827;
  border-color: #6b7280;
}

/* Results bar */
.results-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 0.8rem;
  color: #6b7280;
}

.results-count strong {
  color: #111827;
  font-weight: 600;
}

.integration-note {
  margin: 0 0 14px;
  font-size: 0.8rem;
  color: #64748b;
}

/* States */
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
  margin-top: 6px;
  background: transparent;
  border: 1px solid #dde2ea;
  color: #6b7280;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.btn-clear-inline:hover {
  color: #111827;
  border-color: #6b7280;
}

/* Table */
.table-wrapper {
  border: 1px solid #dde2ea;
  border-radius: 8px;
  overflow: hidden;
  overflow-x: auto;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
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

.td-muted {
  color: #6b7280;
}

/* Tags */
.tag {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.tag-source {
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  border: 1px solid rgba(100, 116, 139, 0.22);
}

.tag-success {
  background: rgba(22, 163, 74, 0.08);
  color: #16a34a;
  border: 1px solid rgba(22, 163, 74, 0.2);
}

.tag-fail {
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}

.pag-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #ffffff;
  border: 1px solid #dde2ea;
  color: #6b7280;
  border-radius: 6px;
  padding: 6px 13px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.pag-btn:hover:not(:disabled) {
  color: #111827;
  border-color: #6b7280;
}

.pag-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
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
</style>

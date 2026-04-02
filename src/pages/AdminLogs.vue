<template>
  <section class="audit-page">

    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div>
          <h1 class="page-title">Logs &amp; Auditoria</h1>
          <p class="page-subtitle">Eventos criticos da plataforma · Monitoramento e rastreabilidade</p>
        </div>
      </div>
      <div class="header-badges">
        <span class="badge badge-secure">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Dados minimizados
        </span>
        <span class="badge badge-anon">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
          IDs pseudonimizados
        </span>
      </div>
    </div>

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
    <div v-else-if="error" class="state-container state-error">
      <div class="state-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
      </div>
      <p class="state-title">Erro ao carregar</p>
      <p class="state-text">{{ error }}</p>
      <button class="btn-clear-inline" @click="fetchLogs">Tentar novamente</button>
    </div>

    <!-- Sem permissao -->
    <div v-else-if="!isAdmin" class="state-container state-restricted">
      <div class="state-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      </div>
      <p class="state-title">Acesso restrito</p>
      <p class="state-text">Esta area e acessivel apenas por administradores autorizados.</p>
    </div>

    <template v-else>
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
              <th>Categoria</th>
              <th>Evento</th>
              <th>Resultado</th>
              <th>Origem</th>
              <th>Actor Ref</th>
              <th>Modulo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td class="td-mono">{{ formatDate(log.timestamp) }}</td>
              <td><span class="tag tag-cat">{{ log.categoria }}</span></td>
              <td>{{ log.evento }}</td>
              <td>
                <span class="tag" :class="log.resultado === 'Sucesso' ? 'tag-success' : 'tag-fail'">
                  {{ log.resultado }}
                </span>
              </td>
              <td class="td-mono td-muted">{{ log.origem }}</td>
              <td class="td-mono td-muted">{{ log.actorRef }}</td>
              <td>{{ log.modulo }}</td>
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

  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { LogEntry, StoredUser } from '../types/auth'

// ── Constantes ───────────────────────────────────────────────
const API_URL = '/api/energia/system-logs' // ajuste para sua baseURL/instancia axios
const PAGE_SIZE = 50

// ── Estado ───────────────────────────────────────────────────
const logs = ref<LogEntry[]>([])
const total = ref(0)          // total geral retornado pelo backend
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

// ── Derivados ─────────────────────────────────────────────────
// totalPages calculado a partir do total do backend — sem dados locais
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

// Paginacao estilo "1 ... 4 5 6 ... 20"
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

// ── API ──────────────────────────────────────────────────────
async function fetchLogs() {
  isLoading.value = true
  error.value = ''

  // Monta query params — filtros vazios sao omitidos
  const params = new URLSearchParams({
    page:     String(currentPage.value),
    pageSize: String(PAGE_SIZE),
  })
  if (filters.value.startDate) params.set('startDate', filters.value.startDate)
  if (filters.value.endDate)   params.set('endDate',   filters.value.endDate)
  if (filters.value.evento)    params.set('evento',    filters.value.evento)
  if (filters.value.resultado) params.set('resultado', filters.value.resultado)

  try {
    const res = await fetch(`${API_URL}?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

    // Contrato esperado: { data: LogEntry[], total: number }
    const json: { data: LogEntry[]; total: number } = await res.json()
    logs.value  = json.data
    total.value = json.total
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro inesperado ao carregar logs.'
    logs.value  = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

// ── Acoes ────────────────────────────────────────────────────
function applyFilters() {
  currentPage.value = 1  // sempre reinicia na pagina 1 ao filtrar
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

// ── Utilitarios ──────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function checkAdmin() {
  const userStr = localStorage.getItem('currentUser')
  if (userStr) {
    const user: StoredUser = JSON.parse(userStr)
    isAdmin.value = user.role === 'ADMIN'
  }
}

// ── Init ─────────────────────────────────────────────────────
onMounted(() => {
  checkAdmin()
  if (isAdmin.value) fetchLogs()
})
</script>

<style scoped>
.audit-page {
  --bg: #f5f7fa;
  --surface: #ffffff;
  --surface-2: #f0f3f7;
  --border: #dde2ea;
  --border-light: #eef1f5;
  --text: #111827;
  --text-muted: #6b7280;
  --text-dim: #9ca3af;
  --accent: #2563eb;
  --accent-dim: rgba(37,99,235,0.08);
  --success: #16a34a;
  --success-dim: rgba(22,163,74,0.08);
  --danger: #dc2626;
  --danger-dim: rgba(220,38,38,0.08);
  --warning: #b45309;
  --radius: 8px;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
  --font-sans: 'IBM Plex Sans', 'DM Sans', system-ui, sans-serif;

  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding: 32px 28px 64px;
  max-width: 1320px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* Header */
.page-header {
  display: flex; align-items: flex-start;
  justify-content: space-between; flex-wrap: wrap;
  gap: 16px; margin-bottom: 28px;
}
.header-left { display: flex; align-items: center; gap: 14px; }
.header-icon {
  width: 46px; height: 46px; border-radius: var(--radius);
  background: var(--accent-dim); border: 1px solid rgba(37,99,235,0.2);
  display: flex; align-items: center; justify-content: center;
  color: var(--accent); flex-shrink: 0;
}
.page-title { font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; color: var(--text); margin: 0 0 3px; }
.page-subtitle { font-size: 0.8rem; color: var(--text-muted); margin: 0; }
.header-badges { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 500; letter-spacing: 0.01em;
}
.badge-secure { background: var(--success-dim); color: var(--success); border: 1px solid rgba(22,163,74,0.2); }
.badge-anon   { background: var(--accent-dim);  color: var(--accent);  border: 1px solid rgba(37,99,235,0.2); }

/* Filters */
.filters-panel {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 18px 20px; margin-bottom: 20px;
}
.filters-grid {
  display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto;
  gap: 12px; align-items: end;
}
@media (max-width: 860px) {
  .filters-grid { grid-template-columns: 1fr 1fr; }
  .field-group--action { grid-column: 1 / -1; }
}
.field-group { display: flex; flex-direction: column; gap: 5px; }
.field-group--action { display: flex; gap: 8px; align-items: flex-end; }
.field-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.field-input {
  background: var(--bg); border: 1px solid var(--border); color: var(--text);
  border-radius: 6px; padding: 7px 10px; font-size: 0.85rem;
  font-family: var(--font-sans); outline: none;
  transition: border-color 0.15s; width: 100%; box-sizing: border-box; color-scheme: light;
}
.field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
.btn-apply {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--accent); color: #fff; border: none; border-radius: 6px;
  padding: 8px 16px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
  white-space: nowrap; transition: background 0.15s, transform 0.1s;
}
.btn-apply:hover  { background: #1d4ed8; }
.btn-apply:active { transform: scale(0.97); }
.btn-clear {
  background: transparent; color: var(--text-muted);
  border: 1px solid var(--border); border-radius: 6px;
  padding: 8px 14px; font-size: 0.85rem; cursor: pointer;
  white-space: nowrap; transition: color 0.15s, border-color 0.15s;
}
.btn-clear:hover { color: var(--text); border-color: var(--text-muted); }

/* Results bar */
.results-bar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px; font-size: 0.8rem; color: var(--text-muted);
}
.results-count strong { color: var(--text); font-weight: 600; }

/* States */
.state-container {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; padding: 72px 24px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); text-align: center;
}
.state-icon {
  width: 60px; height: 60px; border-radius: 50%;
  background: var(--surface-2); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-dim); margin-bottom: 4px;
}
.state-error      .state-icon { color: var(--danger);  background: var(--danger-dim);   border-color: rgba(220,38,38,0.2); }
.state-restricted .state-icon { color: var(--warning); background: rgba(180,83,9,0.08); border-color: rgba(180,83,9,0.2); }
.state-empty      .state-icon { color: var(--text-dim); }
.state-title { font-weight: 600; font-size: 1rem; color: var(--text); margin: 0; }
.state-text  { font-size: 0.85rem; color: var(--text-muted); margin: 0; max-width: 320px; }

.spinner {
  width: 32px; height: 32px;
  border: 2px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.7s linear infinite; margin-bottom: 4px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.btn-clear-inline {
  margin-top: 6px; background: transparent;
  border: 1px solid var(--border); color: var(--text-muted);
  border-radius: 6px; padding: 6px 14px; font-size: 0.82rem;
  cursor: pointer; transition: color 0.15s, border-color 0.15s;
}
.btn-clear-inline:hover { color: var(--text); border-color: var(--text-muted); }

/* Table */
.table-wrapper { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; overflow-x: auto; }
.logs-table { width: 100%; border-collapse: collapse; min-width: 860px; font-size: 0.84rem; }
.logs-table thead { background: var(--surface-2); border-bottom: 1px solid var(--border); }
.logs-table th {
  padding: 11px 14px; text-align: left; font-size: 0.7rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted);
  white-space: nowrap; position: sticky; top: 0;
  background: var(--surface-2); z-index: 1; border-bottom: 1px solid var(--border);
}
.logs-table tbody tr { border-bottom: 1px solid var(--border-light); background: var(--surface); transition: background 0.1s; }
.logs-table tbody tr:last-child { border-bottom: none; }
.logs-table tbody tr:hover { background: var(--surface-2); }
.logs-table td { padding: 10px 14px; vertical-align: middle; color: var(--text); }
.td-mono  { font-family: var(--font-mono); font-size: 0.78rem; }
.td-muted { color: var(--text-muted); }

/* Tags */
.tag { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap; }
.tag-cat     { background: var(--accent-dim);  color: var(--accent);  border: 1px solid rgba(37,99,235,0.2); }
.tag-success { background: var(--success-dim); color: var(--success); border: 1px solid rgba(22,163,74,0.2); }
.tag-fail    { background: var(--danger-dim);  color: var(--danger);  border: 1px solid rgba(220,38,38,0.2); }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 20px; }
.pag-btn {
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--surface); border: 1px solid var(--border);
  color: var(--text-muted); border-radius: 6px; padding: 6px 13px;
  font-size: 0.82rem; cursor: pointer; transition: color 0.15s, border-color 0.15s;
}
.pag-btn:hover:not(:disabled) { color: var(--text); border-color: var(--text-muted); }
.pag-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pag-pages { display: flex; gap: 4px; }
.pag-num {
  width: 32px; height: 32px; border: 1px solid transparent; background: transparent;
  border-radius: 6px; color: var(--text-muted); font-size: 0.82rem; cursor: pointer;
  transition: all 0.15s; display: flex; align-items: center; justify-content: center;
}
.pag-num:hover:not(.ellipsis) { background: var(--surface); border-color: var(--border); color: var(--text); }
.pag-num.active   { background: var(--accent); color: #fff; border-color: var(--accent); cursor: default; }
.pag-num.ellipsis { cursor: default; }
</style>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import {
  getLoginSharingHistory,
  revokeLoginSharingRequest,
} from '@/services/loginSharingService'
import type {
  LoginSharingRequest,
  LoginSharingStatus,
} from '@/types/loginSharing'

type ApiError = {
  message: string
  status?: number
  code?: string
}

const loadingHistory = ref(false)
const revokingRequestId = ref<string | null>(null)
const requestHistory = ref<LoginSharingRequest[]>([])

const statusMessage = ref('')
const apiError = ref<ApiError | null>(null)

const refreshState = reactive({
  lastLoadedAt: '' as string,
})

function toApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    const status = typeof (error as { status?: unknown }).status === 'number'
      ? Number((error as { status?: number }).status)
      : undefined
    const code = typeof (error as { code?: unknown }).code === 'string'
      ? String((error as { code?: string }).code)
      : undefined

    return { message: error.message, status, code }
  }

  return { message: 'Erro inesperado ao executar a operacao.' }
}

function clearAlerts() {
  statusMessage.value = ''
  apiError.value = null
}

function formatDateTime(value: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

function statusTone(status: LoginSharingStatus) {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED' || status === 'EXPIRED') return 'danger'
  if (status === 'PENDING') return 'warning'
  return 'neutral'
}

function statusLabel(status: LoginSharingStatus) {
  if (status === 'PENDING') return 'Pendente'
  if (status === 'APPROVED') return 'Aprovada'
  if (status === 'REJECTED') return 'Rejeitada'
  return 'Expirada'
}

function toPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

async function loadHistory() {
  clearAlerts()
  loadingHistory.value = true

  try {
    requestHistory.value = await getLoginSharingHistory()
    refreshState.lastLoadedAt = new Date().toISOString()
    statusMessage.value = `Histórico carregado. Total: ${requestHistory.value.length} solicitações.`
  } catch (error) {
    apiError.value = toApiError(error)
  } finally {
    loadingHistory.value = false
  }
}

async function handleRevoke(requestId: string) {
  clearAlerts()
  revokingRequestId.value = requestId

  try {
    await revokeLoginSharingRequest(requestId)
    statusMessage.value = 'Solicitação revogada com sucesso.'
    await loadHistory()
  } catch (error) {
    apiError.value = toApiError(error)
  } finally {
    revokingRequestId.value = null
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<template>
  <AuthenticatedLayout
    title="Painel interno"
    description="Este painel não cria solicitações. Ele apenas gerencia o histórico de login-sharing e permite revogar acessos já aprovados. A aplicação externa foi movida para uma app separada."
    user-name="Aplicação interna"
    role-label="Gestão"
  >
    <div class="page-grid">
      <UiCard>
        <div class="card-block">
          <p class="section-eyebrow">Solicitações</p>
          <h2 class="section-title">Histórico e revogação</h2>
          <p class="section-description">
            Aqui ficam somente o acompanhamento das solicitações e a revogação de acessos já aprovados.
          </p>

          <div class="actions">
            <UiButton :disabled="loadingHistory" @click="loadHistory">
              {{ loadingHistory ? 'Atualizando...' : 'Atualizar histórico' }}
            </UiButton>
          </div>

          <div v-if="refreshState.lastLoadedAt" class="meta-inline">
            Última atualização: {{ formatDateTime(refreshState.lastLoadedAt) }}
          </div>
        </div>
      </UiCard>

      <UiCard>
        <div class="card-block">
          <p class="section-eyebrow">Lista</p>
          <h2 class="section-title">Todas as solicitações</h2>

          <div v-if="loadingHistory" class="empty-state">
            <p>Carregando histórico...</p>
          </div>

          <div v-else-if="requestHistory.length > 0" class="history-list">
            <div v-for="req in requestHistory" :key="req.requestId" class="history-item">
              <div class="history-item__header">
                <UiBadge :tone="statusTone(req.status)">{{ statusLabel(req.status) }}</UiBadge>
                <span class="meta-inline">{{ formatDateTime(req.requestedAt) }}</span>
              </div>

              <p class="history-item__meta">
                Aplicação: <strong>{{ req.externalAgentName }}</strong><br />
                E-mail: {{ req.externalAgentEmail }}<br />
                Request ID: {{ req.requestId }}
              </p>

              <div v-if="req.respondedAt" class="history-item__response">
                <p class="history-item__meta">
                  Respondida em {{ formatDateTime(req.respondedAt) }}
                  <span v-if="req.reason">({{ req.reason }})</span>
                </p>
              </div>

              <div v-if="req.status === 'APPROVED'" class="history-item__actions">
                <UiButton
                  :disabled="revokingRequestId === req.requestId"
                  @click="handleRevoke(req.requestId)"
                >
                  {{ revokingRequestId === req.requestId ? 'Revogando...' : 'Revogar acesso' }}
                </UiButton>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <p>Nenhuma solicitação de compartilhamento no histórico.</p>
          </div>
        </div>
      </UiCard>

      <UiCard>
        <div class="card-block">
          <p class="section-eyebrow">Diagnóstico</p>
          <h2 class="section-title">Resposta bruta do histórico</h2>
          <div v-if="requestHistory.length > 0" class="result-box">
            <pre>{{ toPrettyJson(requestHistory) }}</pre>
          </div>
          <div v-else class="empty-state">
            <p>Sem dados para exibir.</p>
          </div>
        </div>
      </UiCard>
    </div>

    <UiAlert v-if="statusMessage" class="notice">{{ statusMessage }}</UiAlert>
    <UiAlert v-if="apiError" tone="danger" class="notice">
      {{ apiError.message }}
      <span v-if="apiError.status">(status: {{ apiError.status }})</span>
      <span v-if="apiError.code"> - {{ apiError.code }}</span>
    </UiAlert>
  </AuthenticatedLayout>
</template>

<style scoped>
.page-grid {
  display: grid;
  gap: 1rem;
}

.card-block {
  display: grid;
  gap: 0.95rem;
}

.section-eyebrow {
  margin: 0;
  color: #0f8ab3;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.section-title {
  margin: 0;
  font-size: 1.15rem;
  color: #172554;
}

.section-description {
  margin: 0;
  color: #60758c;
  font-size: 0.9rem;
}

.actions {
  display: grid;
  gap: 0.65rem;
}

.result-box {
  border: 1px solid #dbeafe;
  border-radius: 0.8rem;
  padding: 0.85rem;
  background: #f8fbff;
}

.result-box pre {
  margin: 0;
  overflow: auto;
  font-size: 0.78rem;
  line-height: 1.42;
}

.history-list {
  display: grid;
  gap: 0.75rem;
}

.history-item {
  border: 1px solid #dbeafe;
  border-radius: 0.6rem;
  padding: 0.65rem;
  background: #f8fbff;
}

.history-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.history-item__meta {
  margin: 0.25rem 0;
  font-size: 0.78rem;
  color: #5f7387;
}

.history-item__response {
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px solid #bfdbfe;
}

.history-item__actions {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e0f2fe;
  display: grid;
  gap: 0.4rem;
}

.meta-inline {
  color: #64748b;
  font-size: 0.78rem;
}

.empty-state {
  border: 1px dashed #cbd5e1;
  border-radius: 0.8rem;
  background: #f8fafc;
  color: #475569;
  padding: 0.85rem;
}

.notice {
  margin-top: 1rem;
}

@media (min-width: 900px) {
  .page-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-grid > :nth-child(3) {
    grid-column: 1 / -1;
  }
}
</style>

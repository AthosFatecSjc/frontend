<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import {
  createLoginSharingRequest,
  getLoginSharingConsent,
  getLoginSharingHistory,
  getLoginSharingUserData,
  getPendingLoginSharingRequests,
  respondLoginSharingRequest,
} from '@/services/loginSharingService'
import type {
  CreateLoginSharingRequestPayload,
  LoginSharingRequest,
  LoginSharingResponsePayload,
  LoginSharingStatus,
  SharedUserDataResponse,
} from '@/types/loginSharing'

type ApiError = {
  message: string
  status?: number
  code?: string
}

const loadingState = reactive({
  creating: false,
  pending: false,
  consent: false,
  responding: false,
  userData: false,
  history: false,
})

const createForm = reactive<CreateLoginSharingRequestPayload>({
  externalAgentName: 'Facebook',
  externalAgentEmail: 'oauth@facebook.com',
  userEmail: '',
})

const userAccess = reactive({
  requestId: '',
})

const responseForm = reactive<LoginSharingResponsePayload>({
  approved: true,
  reason: 'I trust this external agent with my login data',
})

const statusMessage = ref('')
const apiError = ref<ApiError | null>(null)

const createdRequest = ref<LoginSharingRequest | null>(null)
const consentDetails = ref<LoginSharingRequest | null>(null)
const userDataResponse = ref<SharedUserDataResponse | null>(null)
const pendingRequests = ref<LoginSharingRequest[]>([])
const historyRequests = ref<LoginSharingRequest[]>([])

const canUseRequestIdActions = computed(() => userAccess.requestId.trim().length > 0)

function toApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    const status = typeof (error as { status?: unknown }).status === 'number'
      ? Number((error as { status?: number }).status)
      : undefined
    const code = typeof (error as { code?: unknown }).code === 'string'
      ? String((error as { code?: string }).code)
      : undefined

    return {
      message: error.message,
      status,
      code,
    }
  }

  return {
    message: 'Erro inesperado ao executar a operacao.',
  }
}

function clearAlerts() {
  statusMessage.value = ''
  apiError.value = null
}

function setRequestId(value: string) {
  userAccess.requestId = value
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

async function handleCreateRequest() {
  clearAlerts()
  loadingState.creating = true

  try {
    const payload = {
      externalAgentName: createForm.externalAgentName.trim(),
      externalAgentEmail: createForm.externalAgentEmail.trim(),
      userEmail: createForm.userEmail.trim(),
    }

    const response = await createLoginSharingRequest(payload)
    createdRequest.value = response
    setRequestId(response.requestId)
    statusMessage.value = `Solicitacao criada com sucesso. Request ID: ${response.requestId}`
  } catch (error) {
    apiError.value = toApiError(error)
  } finally {
    loadingState.creating = false
  }
}

async function handleLoadPending() {
  clearAlerts()
  loadingState.pending = true

  try {
    pendingRequests.value = await getPendingLoginSharingRequests()
    statusMessage.value = `Pendencias carregadas: ${pendingRequests.value.length}`
  } catch (error) {
    apiError.value = toApiError(error)
  } finally {
    loadingState.pending = false
  }
}

async function handleLoadConsent() {
  if (!canUseRequestIdActions.value) return

  clearAlerts()
  loadingState.consent = true

  try {
    consentDetails.value = await getLoginSharingConsent(userAccess.requestId.trim())
    statusMessage.value = 'Detalhes da solicitacao carregados com sucesso.'
  } catch (error) {
    apiError.value = toApiError(error)
  } finally {
    loadingState.consent = false
  }
}

async function handleRespond() {
  if (!canUseRequestIdActions.value) return

  clearAlerts()
  loadingState.responding = true

  try {
    consentDetails.value = await respondLoginSharingRequest(
      userAccess.requestId.trim(),
      {
        approved: responseForm.approved,
        reason: responseForm.reason.trim(),
      },
    )
    statusMessage.value = responseForm.approved
      ? 'Solicitacao aprovada com sucesso.'
      : 'Solicitacao rejeitada com sucesso.'

    await handleLoadPending()
  } catch (error) {
    apiError.value = toApiError(error)
  } finally {
    loadingState.responding = false
  }
}

async function handleFetchUserData() {
  if (!canUseRequestIdActions.value) return

  clearAlerts()
  loadingState.userData = true

  try {
    userDataResponse.value = await getLoginSharingUserData(userAccess.requestId.trim())
    statusMessage.value = 'Dados compartilhados recuperados com sucesso.'
  } catch (error) {
    apiError.value = toApiError(error)
  } finally {
    loadingState.userData = false
  }
}

async function handleLoadHistory() {
  clearAlerts()
  loadingState.history = true

  try {
    historyRequests.value = await getLoginSharingHistory()
    statusMessage.value = `Historico carregado: ${historyRequests.value.length} registro(s).`
  } catch (error) {
    apiError.value = toApiError(error)
  } finally {
    loadingState.history = false
  }
}
</script>

<template>
  <AuthenticatedLayout
    title="Login Sharing API"
    description="Tela de testes para simular o fluxo OAuth-like entre agente externo, consentimento do usuario e compartilhamento de dados."
    user-name="Usuário interno"
    role-label="Plataforma"
  >
    <div class="grid-layout">
      <UiCard>
        <div class="card-block">
          <p class="section-eyebrow">1. Agente Externo</p>
          <h2 class="section-title">Criar solicitação de login-sharing</h2>
          <p class="section-description">
            Simula o endpoint público <strong>POST /usuarios/login-sharing/request</strong> sem autenticação.
          </p>

          <div class="form-grid">
            <div class="field">
              <UiLabel>Nome do agente externo</UiLabel>
              <UiInput v-model="createForm.externalAgentName" placeholder="Facebook" />
            </div>

            <div class="field">
              <UiLabel>E-mail do agente externo</UiLabel>
              <UiInput v-model="createForm.externalAgentEmail" placeholder="oauth@facebook.com" />
            </div>

            <div class="field field--full">
              <UiLabel>E-mail do usuário alvo</UiLabel>
              <UiInput v-model="createForm.userEmail" placeholder="user@example.com" />
            </div>
          </div>

          <div class="actions">
            <UiButton :disabled="loadingState.creating" @click="handleCreateRequest">
              {{ loadingState.creating ? 'Criando...' : 'Criar solicitação' }}
            </UiButton>
          </div>

          <div v-if="createdRequest" class="result-box">
            <div class="result-box__header">
              <UiBadge :tone="statusTone(createdRequest.status)">{{ statusLabel(createdRequest.status) }}</UiBadge>
              <button type="button" class="link-button" @click="setRequestId(createdRequest.requestId)">
                usar requestId no fluxo
              </button>
            </div>
            <pre>{{ toPrettyJson(createdRequest) }}</pre>
          </div>
        </div>
      </UiCard>

      <UiCard>
        <div class="card-block">
          <p class="section-eyebrow">2. Usuário</p>
          <h2 class="section-title">Request ID</h2>
          <div class="form-grid">
            <div class="field field--full">
              <UiLabel>Request ID alvo</UiLabel>
              <UiInput v-model="userAccess.requestId" placeholder="550e8400-e29b-41d4-a716-446655440000" />
            </div>
          </div>

          <div class="actions actions--split">
            <UiButton variant="secondary" :disabled="loadingState.pending" @click="handleLoadPending">
              {{ loadingState.pending ? 'Carregando...' : 'GET /pending' }}
            </UiButton>
            <UiButton variant="secondary" :disabled="loadingState.history" @click="handleLoadHistory">
              {{ loadingState.history ? 'Carregando...' : 'GET /history' }}
            </UiButton>
          </div>

          <div v-if="pendingRequests.length" class="list-box">
            <h3 class="list-title">Pendentes</h3>
            <ul class="request-list">
              <li v-for="request in pendingRequests" :key="request.requestId" class="request-item">
                <div class="request-item__head">
                  <strong>{{ request.externalAgentName }}</strong>
                  <UiBadge :tone="statusTone(request.status)">{{ statusLabel(request.status) }}</UiBadge>
                </div>
                <p class="request-item__meta">{{ request.externalAgentEmail }}</p>
                <p class="request-item__meta">expira em {{ formatDateTime(request.expiresAt) }}</p>
                <button type="button" class="link-button" @click="setRequestId(request.requestId)">
                  usar {{ request.requestId }}
                </button>
              </li>
            </ul>
          </div>

          <div v-if="historyRequests.length" class="result-box">
            <h3 class="list-title">Histórico</h3>
            <pre>{{ toPrettyJson(historyRequests) }}</pre>
          </div>
        </div>
      </UiCard>

      <UiCard>
        <div class="card-block">
          <p class="section-eyebrow">3. Consentimento</p>
          <h2 class="section-title">Detalhar e responder solicitação</h2>

          <div class="actions actions--split">
            <UiButton
              variant="secondary"
              :disabled="loadingState.consent || !canUseRequestIdActions"
              @click="handleLoadConsent"
            >
              {{ loadingState.consent ? 'Consultando...' : 'GET /{requestId}/consent' }}
            </UiButton>
            <UiButton
              variant="secondary"
              :disabled="loadingState.userData || !canUseRequestIdActions"
              @click="handleFetchUserData"
            >
              {{ loadingState.userData ? 'Buscando...' : 'GET /{requestId}/user-data' }}
            </UiButton>
          </div>

          <div class="response-box">
            <UiLabel>Resposta do usuário</UiLabel>
            <div class="radio-group">
              <label class="radio-item">
                <input v-model="responseForm.approved" type="radio" :value="true" />
                Aprovar
              </label>
              <label class="radio-item">
                <input v-model="responseForm.approved" type="radio" :value="false" />
                Rejeitar
              </label>
            </div>
            <UiInput v-model="responseForm.reason" placeholder="Motivo da aprovação/rejeição" />
            <UiButton
              :disabled="loadingState.responding || !canUseRequestIdActions"
              @click="handleRespond"
            >
              {{ loadingState.responding ? 'Enviando...' : 'POST /{requestId}/respond' }}
            </UiButton>
          </div>

          <div v-if="consentDetails" class="result-box">
            <h3 class="list-title">Detalhes da solicitação</h3>
            <pre>{{ toPrettyJson(consentDetails) }}</pre>
          </div>

          <div v-if="userDataResponse" class="result-box">
            <h3 class="list-title">Dados compartilhados</h3>
            <pre>{{ toPrettyJson(userDataResponse) }}</pre>
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
.grid-layout {
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

.form-grid {
  display: grid;
  gap: 0.75rem;
}

.field {
  display: grid;
  gap: 0.4rem;
}

.field--full {
  grid-column: 1 / -1;
}

.field-hint {
  color: #64748b;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
}

.actions {
  display: grid;
  gap: 0.65rem;
}

.actions--split {
  grid-template-columns: repeat(1, minmax(0, 1fr));
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

.result-box__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
}

.list-box {
  border: 1px solid #dbeafe;
  border-radius: 0.8rem;
  padding: 0.85rem;
  background: #f8fbff;
}

.list-title {
  margin: 0 0 0.65rem;
  color: #1e293b;
  font-size: 0.92rem;
}

.request-list {
  display: grid;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.request-item {
  border: 1px solid #e2e8f0;
  border-radius: 0.72rem;
  background: #fff;
  padding: 0.7rem;
}

.request-item__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.request-item__meta {
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  color: #5f7387;
}

.response-box {
  display: grid;
  gap: 0.6rem;
  border: 1px dashed #bfdbfe;
  border-radius: 0.8rem;
  padding: 0.8rem;
  background: #f9fcff;
}

.radio-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.9rem;
}

.radio-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #334155;
  font-size: 0.9rem;
}

.link-button {
  border: 0;
  background: transparent;
  color: #0369a1;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
}

.notice {
  margin-top: 1rem;
}

@media (min-width: 1100px) {
  .grid-layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grid-layout > :last-child {
    grid-column: 1 / -1;
  }

  .actions--split {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

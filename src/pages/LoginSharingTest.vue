<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  createLoginSharingRequest,
} from '@/services/loginSharingService'
import type {
  CreateLoginSharingRequestPayload,
  LoginSharingRequest,
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
  opening: false,
})

const router = useRouter()
const CONSENT_RESULT_KEY = 'login-sharing-consent-result'

const createForm = reactive<CreateLoginSharingRequestPayload>({
  externalAgentName: 'Facebook',
  externalAgentEmail: 'oauth@facebook.com',
  userEmail: '',
})

const statusMessage = ref('')
const apiError = ref<ApiError | null>(null)

const createdRequest = ref<LoginSharingRequest | null>(null)
const sharedDataResult = ref<SharedUserDataResponse | null>(null)
const decisionResult = ref<{
  requestId: string
  externalAgentName: string
  status: LoginSharingStatus
  requestedAt: string
  expiresAt: string
  respondedAt: string
  reason: string | null
} | null>(null)

const canOpenConsent = computed(() => Boolean(createdRequest.value))

const MESSAGE_TYPE = 'login-sharing-consent-result'

type LoginSharingConsentResultMessage = {
  type: typeof MESSAGE_TYPE
  payload: {
    requestId: string
    externalAgentName: string
    status: LoginSharingStatus
    approved: boolean
    reason: string | null
    data: SharedUserDataResponse | null
    respondedAt: string
  }
}

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

function applyConsentResult(message: LoginSharingConsentResultMessage) {
  decisionResult.value = {
    requestId: message.payload.requestId,
    externalAgentName: message.payload.externalAgentName,
    status: message.payload.status,
    requestedAt: createdRequest.value?.requestedAt ?? message.payload.respondedAt,
    expiresAt: createdRequest.value?.expiresAt ?? message.payload.respondedAt,
    respondedAt: message.payload.respondedAt,
    reason: message.payload.reason,
  }

  sharedDataResult.value = message.payload.data

  if (createdRequest.value) {
    createdRequest.value = {
      ...createdRequest.value,
      status: message.payload.status,
      respondedAt: message.payload.respondedAt,
      reason: message.payload.reason,
    }
  }

}

function handleWindowMessage(event: MessageEvent) {
  if (event.origin !== window.location.origin) return

  const data = event.data as LoginSharingConsentResultMessage | undefined

  if (!data || data.type !== MESSAGE_TYPE) return

  try {
    applyConsentResult(data)
  } catch (err) {
    console.error('[login-sharing] applyConsentResult failed', err, data)
    apiError.value = toApiError(err)
  }
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key !== CONSENT_RESULT_KEY || !event.newValue) return

  try {
    const data = JSON.parse(event.newValue) as LoginSharingConsentResultMessage
    if (data.type === MESSAGE_TYPE) {
      applyConsentResult(data)
    }
  } catch {
    // ignore malformed fallback messages
  }
}

onMounted(() => {
  window.addEventListener('message', handleWindowMessage)
  window.addEventListener('storage', handleStorageEvent)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleWindowMessage)
  window.removeEventListener('storage', handleStorageEvent)
})

async function handleCreateRequest() {
  clearAlerts()
  loadingState.creating = true

  try {
    const payload = {
      externalAgentName: createForm.externalAgentName.trim(),
      externalAgentEmail: createForm.externalAgentEmail.trim(),
      userEmail: createForm.userEmail.trim(),
    }

    createdRequest.value = await createLoginSharingRequest(payload)
    sharedDataResult.value = null
    decisionResult.value = null
    statusMessage.value = `Solicitação criada com sucesso. Request ID: ${createdRequest.value.requestId}`
  } catch (error) {
    apiError.value = toApiError(error)
  } finally {
    loadingState.creating = false
  }
}

async function handleOpenConsentPopup() {
  if (!createdRequest.value) return

  clearAlerts()
  loadingState.opening = true

  try {
    const { requestId, externalAgentName, externalAgentEmail } = createdRequest.value
    const consentUrl = router.resolve({
      name: 'LoginSharingConsentPopup',
      query: {
        requestId,
        userEmail: createForm.userEmail.trim(),
        externalAgentName,
        externalAgentEmail,
      },
    }).href

    const popup = window.open(
      consentUrl,
      'login-sharing-consent-popup',
      'width=980,height=860',
    )

    if (!popup) {
      throw new Error('Nao foi possivel abrir o pop-up de consentimento.')
    }

    statusMessage.value = 'Pop-up de consentimento aberto em nova janela.'
  } catch (error) {
    apiError.value = toApiError(error)
  } finally {
    loadingState.opening = false
  }
}
</script>

<template>
  <AuthenticatedLayout
    title="Aplicação externa"
    description="Esta tela simula uma aplicação OAuth2-like que solicita acesso aos dados do usuário. O consentimento acontece em um pop-up dentro da mesma experiência."
    user-name="Aplicação externa"
    role-label="Solicitante"
  >
    <div class="page-grid">
      <UiCard>
        <div class="card-block">
          <p class="section-eyebrow">1. Solicitação</p>
          <h2 class="section-title">Criar solicitação de login-sharing</h2>
          <p class="section-description">
            Primeiro a aplicação externa cria a solicitação. Depois, ao clicar em <strong>Solicitar dados</strong>, a janela de consentimento da nossa aplicação é aberta em outra aba/janela.
          </p>

          <div class="form-grid">
            <div class="field">
              <UiLabel>Nome da aplicação</UiLabel>
              <UiInput v-model="createForm.externalAgentName" placeholder="Facebook" />
            </div>

            <div class="field">
              <UiLabel>E-mail da aplicação</UiLabel>
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

            <UiButton :disabled="loadingState.opening || !canOpenConsent" @click="handleOpenConsentPopup">
              {{ loadingState.opening ? 'Abrindo...' : 'Solicitar dados' }}
            </UiButton>
          </div>

          <div v-if="createdRequest" class="result-box">
            <div class="result-box__header">
              <UiBadge :tone="statusTone(createdRequest.status)">{{ statusLabel(createdRequest.status) }}</UiBadge>
              <span class="meta-inline">Request ID: {{ createdRequest.requestId }}</span>
            </div>
            <pre>{{ toPrettyJson(createdRequest) }}</pre>
          </div>
        </div>
      </UiCard>

      <UiCard>
        <div class="card-block">
          <p class="section-eyebrow">2. Resultado</p>
          <h2 class="section-title">Status e dados retornados</h2>

          <div v-if="decisionResult" class="result-box">
            <div class="result-box__header">
              <UiBadge :tone="statusTone(decisionResult.status)">{{ statusLabel(decisionResult.status) }}</UiBadge>
              <span class="meta-inline">Respondida em {{ formatDateTime(decisionResult.respondedAt) }}</span>
            </div>

            <p class="request-item__meta">
              Aplicação: {{ decisionResult.externalAgentName }}<br />
              E-mail: {{ createdRequest?.externalAgentEmail }}
            </p>

            <div v-if="sharedDataResult">
              <p class="request-item__meta">Dados enviados para a aplicação:</p>
              <pre>{{ toPrettyJson(sharedDataResult) }}</pre>
            </div>

            <div v-else>
              <p class="request-item__meta">Acesso rejeitado.</p>
              <p v-if="decisionResult.reason" class="request-item__meta">
                Motivo: {{ decisionResult.reason }}
              </p>
            </div>
          </div>

          <div v-else class="empty-state">
            <p>Nenhuma resposta foi concluída ainda.</p>
            <p>Após aprovar ou negar no pop-up, o status e os dados aparecem aqui.</p>
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

.result-box pre,
.modal-panel pre {
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

.list-title {
  margin: 0 0 0.65rem;
  color: #1e293b;
  font-size: 0.92rem;
}

.request-item__meta {
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  color: #5f7387;
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

@media (min-width: 900px) {
  .page-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-grid > :last-child {
    grid-column: 1 / -1;
  }
}
</style>

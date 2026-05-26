<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { getAuthUser } from '@/services/authService'
import {
  getLoginSharingConsent,
  respondLoginSharingRequest,
} from '@/services/loginSharingService'
import type {
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

type ConsentResultMessage = {
  type: 'login-sharing-consent-result'
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

const route = useRoute()
const CONSENT_RESULT_KEY = 'login-sharing-consent-result'

const loadingState = reactive({
  loading: false,
  responding: false,
})

const responseForm = reactive<LoginSharingResponsePayload>({
  approved: true,
  reason: 'Autorizando o compartilhamento dos dados de login',
})

const statusMessage = ref('')
const apiError = ref<ApiError | null>(null)
const consentRequest = ref<LoginSharingRequest | null>(null)
const previewData = ref<SharedUserDataResponse | null>(null)
const isUserVerified = ref(false)
const verificationError = ref<string | null>(null)

const requestId = computed(() => {
  const value = route.query.requestId
  return Array.isArray(value) ? value[0] ?? '' : (typeof value === 'string' ? value : '')
})

const userEmail = computed(() => {
  const value = route.query.userEmail
  return Array.isArray(value) ? value[0] ?? '' : (typeof value === 'string' ? value : '')
})

const externalAgentName = computed(() => {
  const value = route.query.externalAgentName
  return Array.isArray(value) ? value[0] ?? '' : (typeof value === 'string' ? value : '')
})

const externalAgentEmail = computed(() => {
  const value = route.query.externalAgentEmail
  return Array.isArray(value) ? value[0] ?? '' : (typeof value === 'string' ? value : '')
})

const sourceOrigin = computed(() => {
  const value = route.query.sourceOrigin
  return Array.isArray(value) ? value[0] ?? '' : (typeof value === 'string' ? value : '')
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

function buildPreviewData() {
  const email = userEmail.value.trim()
  const localPart = email.split('@')[0] || 'usuario'
  const prettyName = localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())

  return {
    email,
    nomeCompleto: prettyName || 'Usuario de demonstracao',
    telefone: '(11) 99999-0000',
    status: 'PREVIEW',
    message: 'Estes dados seriam compartilhados com a aplicação externa caso o acesso fosse permitido.',
  }
}

function verifyUserIdentity(): boolean {
  // Verificar se o usuário está autenticado e se seu email corresponde ao userEmail solicitado
  const authUser = getAuthUser()
  const requestedEmail = userEmail.value.trim().toLowerCase()

  if (!authUser) {
    verificationError.value = 'Usuario não está autenticado. Faça login para continuar.'
    return false
  }

  const authenticatedEmail = (authUser.email ?? '').trim().toLowerCase()

  if (authenticatedEmail !== requestedEmail) {
    verificationError.value = `Acesso negado. Você está autenticado como "${authUser.email}" mas esta solicitação é para "${userEmail.value}". Faça logout e entre com a conta correta.`
    return false
  }

  isUserVerified.value = true
  return true
}

async function loadConsent() {
  if (!requestId.value) return

  // Validar identidade do usuário primeiro
  if (!verifyUserIdentity()) {
    loadingState.loading = false
    return
  }

  clearAlerts()
  loadingState.loading = true

  // Always build a preview from query params immediately so the UI shows data
  // even if the API call to fetch the consent details fails or is restricted.
  previewData.value = buildPreviewData()

  try {
    consentRequest.value = await getLoginSharingConsent(requestId.value)
    statusMessage.value = 'Dados do consentimento carregados.'
  } catch (error) {
    apiError.value = toApiError(error)
  } finally {
    loadingState.loading = false
  }
}

async function handleRespond() {
  if (!requestId.value || !isUserVerified.value) {
    apiError.value = toApiError(new Error('Usuário não verificado. Operação não permitida.'))
    return
  }

  clearAlerts()
  loadingState.responding = true

  try {
    const requestSnapshot = consentRequest.value ?? {
      requestId: requestId.value,
      externalAgentName: externalAgentName.value || 'Aplicação externa',
      externalAgentEmail: externalAgentEmail.value || '',
      status: 'PENDING' as LoginSharingStatus,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      respondedAt: null,
      reason: null,
    }

    let response: LoginSharingRequest

    try {
      response = await respondLoginSharingRequest(requestId.value, {
        approved: responseForm.approved,
        reason: responseForm.reason.trim(),
      })
    } catch (error) {
      if (!responseForm.approved) {
        throw error
      }

      response = {
        ...requestSnapshot,
        status: 'APPROVED',
        respondedAt: new Date().toISOString(),
        reason: responseForm.reason.trim() || null,
      }
    }

    const payloadData = responseForm.approved
      ? (previewData.value ?? buildPreviewData())
      : null

    if (responseForm.approved && !previewData.value) {
      previewData.value = payloadData
    }

    const resolvedStatus: LoginSharingStatus = responseForm.approved ? 'APPROVED' : 'REJECTED'

    const message: ConsentResultMessage = {
      type: 'login-sharing-consent-result',
      payload: {
        requestId: response.requestId,
        externalAgentName: response.externalAgentName,
        status: resolvedStatus,
        approved: responseForm.approved,
        reason: response.reason,
        data: payloadData,
        respondedAt: response.respondedAt ?? new Date().toISOString(),
      },
    }

    // debug: log message before posting so we can inspect in devtools if something breaks
    console.log('[login-sharing] posting consent result to opener/localStorage', message)
    try {
      window.opener?.postMessage(message, sourceOrigin.value || window.location.origin)
    } catch (err) {
      console.error('[login-sharing] postMessage failed', err, message)
    }

    try {
      window.localStorage.setItem(CONSENT_RESULT_KEY, JSON.stringify(message))
    } catch (err) {
      console.error('[login-sharing] localStorage.setItem failed', err, message)
    }
    statusMessage.value = responseForm.approved
      ? 'Acesso aprovado. Esta janela pode ser fechada.'
      : 'Acesso rejeitado. Esta janela pode ser fechada.'

    window.setTimeout(() => window.close(), 500)
  } catch (error) {
    console.error('[login-sharing] handleRespond error', error)
    apiError.value = toApiError(error)
  } finally {
    loadingState.responding = false
  }
}

onMounted(() => {
  loadConsent()
})

</script>

<template>
  <AuthenticatedLayout
    title="Sessão de consentimento"
    description="Esta é a janela da nossa aplicação que exibe os dados pedidos e permite aprovar ou negar o acesso."
    user-name="Nossa aplicação"
    role-label="Consentimento"
  >
    <div class="popup-grid">
      <UiCard>
        <div class="card-block">
          <p class="section-eyebrow">Aplicação externa</p>
          <h2 class="section-title">Solicitação recebida</h2>

          <div v-if="consentRequest" class="result-box">
            <div class="result-box__header">
              <UiBadge :tone="statusTone(consentRequest.status)">{{ statusLabel(consentRequest.status) }}</UiBadge>
              <span class="meta-inline">Request ID: {{ consentRequest.requestId }}</span>
            </div>
            <p class="request-item__meta">
              Aplicação: {{ externalAgentName || consentRequest.externalAgentName }}<br />
              E-mail: {{ externalAgentEmail || consentRequest.externalAgentEmail }}<br />
              Solicitada em: {{ formatDateTime(consentRequest.requestedAt) }}
            </p>
            <pre>{{ toPrettyJson(consentRequest) }}</pre>
          </div>
        </div>
      </UiCard>

      <UiCard>
        <div class="card-block">
          <p class="section-eyebrow">Dados</p>
          <h2 class="section-title">O que será cedido</h2>

          <div class="result-box">
            <pre>{{ toPrettyJson(previewData) }}</pre>
          </div>

          <div v-if="isUserVerified" class="response-box">
            <UiLabel>Decisão</UiLabel>
            <div class="radio-group">
              <label class="radio-item">
                <input v-model="responseForm.approved" type="radio" :value="true" />
                Permitir
              </label>
              <label class="radio-item">
                <input v-model="responseForm.approved" type="radio" :value="false" />
                Negar
              </label>
            </div>

            <UiInput v-model="responseForm.reason" placeholder="Motivo da decisão" />

            <UiButton :disabled="loadingState.responding" @click="handleRespond">
              {{ loadingState.responding ? 'Enviando...' : 'Confirmar' }}
            </UiButton>
          </div>

          <div v-else class="empty-state">
            <p>Verificação de identidade pendente.</p>
            <p>Você precisa estar autenticado com a conta correta para confirmar.</p>
          </div>
        </div>
      </UiCard>
    </div>

    <UiAlert v-if="statusMessage" class="notice">{{ statusMessage }}</UiAlert>
    <UiAlert v-if="verificationError" tone="danger" class="notice">
      {{ verificationError }}
    </UiAlert>
    <UiAlert v-if="apiError" tone="danger" class="notice">
      {{ apiError.message }}
      <span v-if="apiError.status">(status: {{ apiError.status }})</span>
      <span v-if="apiError.code"> - {{ apiError.code }}</span>
    </UiAlert>
  </AuthenticatedLayout>
</template>

<style scoped>
.popup-grid {
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

.request-item__meta {
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  color: #5f7387;
}

.meta-inline {
  color: #64748b;
  font-size: 0.78rem;
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

.notice {
  margin-top: 1rem;
}

@media (min-width: 900px) {
  .popup-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .popup-grid > :last-child {
    grid-column: 1 / -1;
  }
}
</style>
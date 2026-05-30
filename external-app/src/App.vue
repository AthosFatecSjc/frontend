<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

import {
  createLoginSharingRequest,
  getPublicLoginSharingRequestStatus,
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
  submitting: false,
})

const consentAppBaseUrl = import.meta.env.VITE_CONSENT_APP_BASE_URL ?? 'http://localhost:3000'
const popupOrigin = computed(() => {
  try {
    return new URL(consentAppBaseUrl).origin
  } catch (err) {
    console.warn('[login-sharing] invalid consent app base URL', consentAppBaseUrl)
    return ''
  }
})
const sourceOrigin = window.location.origin
const MESSAGE_TYPE = 'login-sharing-consent-result'

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

let pollingInterval: number | null = null
let pollingTimeout: number | null = null

const POLL_INTERVAL = Number(import.meta.env.VITE_EXTERNAL_POLL_INTERVAL) || 3000
const POLL_TIMEOUT = Number(import.meta.env.VITE_EXTERNAL_POLL_TIMEOUT) || 60000

const canSubmit = computed(() => Boolean(createForm.userEmail.trim()))

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
  if (status === 'REJECTED' || status === 'EXPIRED' || status === 'REVOKED') return 'danger'
  if (status === 'PENDING') return 'warning'
  return 'neutral'
}

function statusLabel(status: LoginSharingStatus) {
  if (status === 'PENDING') return 'Pendente'
  if (status === 'APPROVED') return 'Aprovada'
  if (status === 'REJECTED') return 'Rejeitada'
  if (status === 'REVOKED') return 'Revogada'
  return 'Expirada'
}

function toPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function buildPreviewData() {
  const email = createForm.userEmail.trim()
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

function applyConsentResult(message: LoginSharingConsentResultMessage) {
  const resolvedStatus = message.payload.approved ? 'APPROVED' : message.payload.status

  decisionResult.value = {
    requestId: message.payload.requestId,
    externalAgentName: message.payload.externalAgentName,
    status: resolvedStatus,
    requestedAt: createdRequest.value?.requestedAt ?? message.payload.respondedAt,
    expiresAt: createdRequest.value?.expiresAt ?? message.payload.respondedAt,
    respondedAt: message.payload.respondedAt,
    reason: message.payload.reason,
  }

  sharedDataResult.value = message.payload.data

  if (createdRequest.value) {
    createdRequest.value = {
      ...createdRequest.value,
      status: resolvedStatus,
      respondedAt: message.payload.respondedAt,
      reason: message.payload.reason,
    }
  }

  if (!message.payload.approved) {
    clearPolling()
  }
}

function clearPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
  if (pollingTimeout) {
    clearTimeout(pollingTimeout)
    pollingTimeout = null
  }
}

async function startPolling(requestId: string, publicToken?: string | null) {
  clearPolling()

  const startedAt = Date.now()

  pollingInterval = window.setInterval(async () => {
    try {
      const req = await getPublicLoginSharingRequestStatus(requestId, publicToken)
      if (!req) return

      // update local copy
      createdRequest.value = req

      if (req.status === 'APPROVED') {
        decisionResult.value = {
          requestId: req.requestId,
          externalAgentName: req.externalAgentName,
          status: req.status,
          requestedAt: req.requestedAt,
          expiresAt: req.expiresAt,
          respondedAt: req.respondedAt ?? '',
          reason: req.reason ?? null,
        }

        statusMessage.value = 'Acesso aprovado. Aguardando possíveis alterações de status.'
      } else if (req.status && req.status !== 'PENDING') {
        decisionResult.value = {
          requestId: req.requestId,
          externalAgentName: req.externalAgentName,
          status: req.status,
          requestedAt: req.requestedAt,
          expiresAt: req.expiresAt,
          respondedAt: req.respondedAt ?? '',
          reason: req.reason ?? null,
        }

        statusMessage.value = `Status atualizado: ${statusLabel(req.status)}`
        clearPolling()
      } else if (Date.now() - startedAt > POLL_TIMEOUT) {
        clearPolling()
        statusMessage.value = 'Tempo de espera esgotado para atualização do status.'
      }
    } catch (err) {
      apiError.value = toApiError(err)
    }
  }, POLL_INTERVAL) as unknown as number
}



async function handleSubmit() {
  clearAlerts()
  loadingState.submitting = true

  try {
    const payload = {
      externalAgentName: createForm.externalAgentName.trim(),
      externalAgentEmail: createForm.externalAgentEmail.trim(),
      userEmail: createForm.userEmail.trim(),
    }

    createdRequest.value = await createLoginSharingRequest(payload)
    sharedDataResult.value = null
    decisionResult.value = null
    statusMessage.value = 'Solicitação criada com sucesso. Abrindo janela de consentimento...'

    const { requestId, externalAgentName, externalAgentEmail } = createdRequest.value
    let consentUrl: URL
    try {
      consentUrl = new URL('/testes/login-sharing/consent', consentAppBaseUrl)
    } catch (err) {
      throw new Error('VITE_CONSENT_APP_BASE_URL inválida. Configure uma URL válida para abrir o popup.')
    }

    consentUrl.searchParams.set('requestId', requestId)
    consentUrl.searchParams.set('userEmail', payload.userEmail)
    consentUrl.searchParams.set('externalAgentName', externalAgentName)
    consentUrl.searchParams.set('externalAgentEmail', externalAgentEmail)
    consentUrl.searchParams.set('sourceOrigin', sourceOrigin)

    const popup = window.open(
      consentUrl.toString(),
      'login-sharing-consent-popup',
      'width=980,height=860',
    )

    if (!popup) {
      throw new Error('Nao foi possivel abrir o pop-up de consentimento.')
    }

    statusMessage.value = 'Pop-up de consentimento aberto em nova janela.'

    // start polling a public status endpoint so this external app reflects approvals/revocations
    try {
      const token = (createdRequest.value as any)?.publicToken ?? null
      startPolling(createdRequest.value.requestId, token)
    } catch (err) {
      apiError.value = toApiError(err)
    }
  } catch (error) {
    apiError.value = toApiError(error)
  } finally {
    loadingState.submitting = false
  }
}

</script>

<template>
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">Aplicação externa</p>
      <h1>Solicitar acesso aos dados do usuário</h1>
      <p>
        Esta aplicação é separada do painel interno. Ela apenas cria a solicitação e abre o consentimento
        na aplicação principal.
      </p>
    </section>

    <section class="grid">
      <article class="panel">
        <header class="panel__header">
          <p class="eyebrow">1. Solicitação</p>
          <h2>Criar solicitação de login-sharing</h2>
        </header>

        <div class="form-grid">
          <label class="field">
            <span>Nome da aplicação</span>
            <input v-model="createForm.externalAgentName" type="text" placeholder="Facebook" />
          </label>

          <label class="field">
            <span>E-mail da aplicação</span>
            <input v-model="createForm.externalAgentEmail" type="email" placeholder="oauth@facebook.com" />
          </label>

          <label class="field field--full">
            <span>E-mail do usuário alvo</span>
            <input v-model="createForm.userEmail" type="email" placeholder="user@example.com" />
          </label>
        </div>

        <button class="primary-button" :disabled="loadingState.submitting || !canSubmit" @click="handleSubmit">
          {{ loadingState.submitting ? 'Processando...' : 'Solicitar dados' }}
        </button>

        <div v-if="createdRequest" class="result-box">
          <div class="result-box__header">
            <span class="badge" :data-tone="statusTone(createdRequest.status)">{{ statusLabel(createdRequest.status) }}</span>
            <span class="meta-inline">Request ID: {{ createdRequest.requestId }}</span>
          </div>
          <pre>{{ toPrettyJson(createdRequest) }}</pre>
        </div>
      </article>

      <article class="panel">
        <header class="panel__header">
          <p class="eyebrow">2. Resultado</p>
          <h2>Status e dados retornados</h2>
        </header>

        <div v-if="decisionResult" class="result-box">
          <div class="result-box__header">
            <span class="badge" :data-tone="statusTone(decisionResult.status)">{{ statusLabel(decisionResult.status) }}</span>
            <span class="meta-inline">Respondida em {{ formatDateTime(decisionResult.respondedAt) }}</span>
          </div>

          <p class="meta-block">
            Aplicação: {{ decisionResult.externalAgentName }}<br />
            E-mail: {{ createdRequest?.externalAgentEmail }}
          </p>

          <div v-if="sharedDataResult">
            <p class="meta-block">Dados enviados para a aplicação:</p>
            <pre>{{ toPrettyJson(sharedDataResult) }}</pre>
          </div>

          <div v-else>
            <p class="meta-block">Acesso rejeitado.</p>
            <p v-if="decisionResult.reason" class="meta-block">Motivo: {{ decisionResult.reason }}</p>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>Nenhuma resposta foi concluída ainda.</p>
          <p>Após aprovar ou negar no pop-up, o status e os dados aparecem aqui.</p>
        </div>
      </article>
    </section>

    <section v-if="statusMessage" class="notice success">{{ statusMessage }}</section>
    <section v-if="apiError" class="notice danger">
      {{ apiError.message }}
      <span v-if="apiError.status">(status: {{ apiError.status }})</span>
      <span v-if="apiError.code"> - {{ apiError.code }}</span>
    </section>
  </main>
</template>

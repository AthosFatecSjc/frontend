<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { fetchMinhaConta, updateMinhaConta } from '@/services/minhaConta'
import type { MinhaContaResponse, OfficialStatusConta, StatusContaApi } from '@/types/minhaConta'

const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const account = ref<MinhaContaResponse | null>(null)
const form = ref({
  nomeCompleto: '',
  telefone: '',
})

function normalizeStatus(status: StatusContaApi): OfficialStatusConta | null {
  if (status === 'ATIVO' || status === 'PENDENTE' || status === 'REJEITADO') {
    return status
  }

  return null
}

const normalizedStatus = computed<OfficialStatusConta | null>(() => normalizeStatus(account.value?.status ?? null))

const hasUnexpectedStatus = computed(() => {
  const rawStatus = account.value?.status ?? null
  return rawStatus !== null && normalizeStatus(rawStatus) === null
})

const statusTone = computed(() => {
  switch (normalizedStatus.value) {
    case 'ATIVO':
      return 'success'
    case 'PENDENTE':
      return 'warning'
    case 'REJEITADO':
      return 'danger'
    default:
      return 'neutral'
  }
})

const hasChanges = computed(() => (
  form.value.nomeCompleto !== (account.value?.nomeCompleto ?? '')
  || form.value.telefone !== (account.value?.telefone ?? '')
))

function isAllowedControlKey(event: KeyboardEvent) {
  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ]

  if (allowedKeys.includes(event.key)) return true

  if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x', 'z', 'y'].includes(event.key.toLowerCase())) {
    return true
  }

  return false
}

function handleNomeCompletoKeydown(event: KeyboardEvent) {
  if (isAllowedControlKey(event)) return
  if (/^\d$/.test(event.key)) event.preventDefault()
}

function handleNomeCompletoBeforeInput(event: InputEvent) {
  if (event.data && /\d/.test(event.data)) event.preventDefault()
}

function handleNomeCompletoPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (/\d/.test(text)) event.preventDefault()
}

function handleTelefoneKeydown(event: KeyboardEvent) {
  if (isAllowedControlKey(event)) return
  if (!/^\d$/.test(event.key)) event.preventDefault()
}

function handleTelefoneBeforeInput(event: InputEvent) {
  if (event.data && /\D/.test(event.data)) event.preventDefault()
}

function handleTelefonePaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (/\D/.test(text)) event.preventDefault()
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function applyAccountData(data: MinhaContaResponse) {
  account.value = data
  form.value.nomeCompleto = data.nomeCompleto ?? ''
  form.value.telefone = data.telefone ?? ''
}

function formatDate(value: string | null) {
  if (!value) return ''

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function statusLabel(status: StatusContaApi) {
  const normalized = normalizeStatus(status)
  if (normalized === 'ATIVO') return 'Ativa'
  if (normalized === 'PENDENTE') return 'Pendente'
  if (normalized === 'REJEITADO') return 'Rejeitada'

  if (status === null || status.trim?.() === '') {
    return 'Sem status'
  }

  return 'Status não reconhecido'
}

async function loadMinhaConta() {
  loading.value = true
  errorMessage.value = ''

  try {
    const data = await fetchMinhaConta()
    applyAccountData(data)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Não foi possível carregar a conta.'
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!hasChanges.value || saving.value) return

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const data = await updateMinhaConta({
      nomeCompleto: form.value.nomeCompleto.trim(),
      telefone: form.value.telefone.trim(),
    })

    applyAccountData(data)
    successMessage.value = 'Alterações salvas com sucesso.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Não foi possível salvar as alterações.'
  } finally {
    saving.value = false
  }
}

onMounted(loadMinhaConta)
</script>

<template>
  <AuthenticatedLayout
    title="Minha Conta"
    description="Atualize os dados permitidos do seu cadastro e acompanhe as informações protegidas vinculadas ao seu acesso."
    user-name="Usuário interno"
    role-label="Plataforma"
  >
    <UiCard>
      <div class="card-body">
        <p class="section-eyebrow">Dados cadastrais</p>
        <h2 class="section-title">Minha Conta</h2>
        <p class="section-description">
          Os campos editáveis podem ser alterados diretamente. E-mail, data de cadastro e status permanecem protegidos.
        </p>

        <UiAlert v-if="errorMessage" tone="danger">{{ errorMessage }}</UiAlert>
        <UiAlert v-else-if="successMessage">{{ successMessage }}</UiAlert>
        <UiAlert v-if="hasUnexpectedStatus" tone="warning">
          O sistema retornou um status de conta não reconhecido. Entre em contato com o suporte.
        </UiAlert>

        <div v-if="loading" class="loading-state">Carregando dados da conta...</div>

        <form v-else class="form-grid" @submit.prevent="handleSave">
          <div class="field field--full">
            <UiLabel for="nomeCompleto">Nome completo</UiLabel>
            <UiInput
              id="nomeCompleto"
              v-model="form.nomeCompleto"
              @keydown="handleNomeCompletoKeydown"
              @beforeinput="handleNomeCompletoBeforeInput"
              @paste="handleNomeCompletoPaste"
            />
            <span class="field-hint field-hint--editable">Campo editável</span>
          </div>

          <div class="field field--full">
            <UiLabel for="telefone">Telefone</UiLabel>
            <UiInput
              id="telefone"
              :model-value="form.telefone"
              placeholder="(11) 99999-9999"
              @keydown="handleTelefoneKeydown"
              @beforeinput="handleTelefoneBeforeInput"
              @paste="handleTelefonePaste"
              @update:model-value="form.telefone = formatPhone($event)"
            />
            <span class="field-hint field-hint--editable">Campo editável</span>
          </div>

          <div class="field">
            <UiLabel for="email">E-mail</UiLabel>
            <UiInput id="email" :model-value="account?.email ?? ''" disabled />
            <span class="field-hint">Somente leitura</span>
          </div>

          <div class="field">
            <UiLabel for="dataCadastro">Data de cadastro</UiLabel>
            <UiInput id="dataCadastro" :model-value="formatDate(account?.dataCadastro ?? null)" disabled />
            <span class="field-hint">Somente leitura</span>
          </div>

          <div class="field field--full">
            <UiLabel>Status da conta</UiLabel>
            <div class="status-box">
              <div class="status-inline">
                <span class="status-marker"></span>
                <UiBadge :tone="statusTone">{{ statusLabel(account?.status ?? null) }}</UiBadge>
              </div>
              <span class="field-hint">Somente leitura</span>
            </div>
          </div>

          <UiButton type="submit" :disabled="!hasChanges || saving">
            {{ saving ? 'Salvando...' : 'Salvar alterações' }}
          </UiButton>
        </form>
      </div>
    </UiCard>
  </AuthenticatedLayout>
</template>

<style scoped>
.card-body {
  padding: 18px 18px 16px;
}

.section-eyebrow {
  margin: 0;
  color: #0f8ab3;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.26em;
  text-transform: uppercase;
}

.section-title {
  margin: 10px 0 0;
  font-size: 1.2rem;
  color: #172554;
}

.section-description {
  margin: 8px 0 18px;
  font-size: 0.9rem;
  color: #60758c;
}

.loading-state {
  padding: 2rem 0 0.6rem;
  color: var(--text-muted);
}

.form-grid {
  display: grid;
  gap: 14px;
}

.field {
  display: grid;
  gap: 6px;
}

.field-hint {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-soft);
}

.field-hint--editable {
  color: #0f8ab3;
}

.status-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 2.95rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 1rem;
  background: #fff;
}

.status-inline {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.status-marker {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #fff;
}

@media (min-width: 980px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .field--full {
    grid-column: 1 / -1;
  }

  :deep(.ui-button) {
    grid-column: 1 / -1;
  }
}
</style>

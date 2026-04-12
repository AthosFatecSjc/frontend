<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppHeading from '../components/utils/AppHeading.vue'
import { clearAuthSession } from '../services/authService'
import {
  buscarDocumentosVigentes,
  clearPendingTermsContext,
  getPendingTermsContext,
  resolverPendenciasDeTermos,
} from '../services/termsService'
import type { ConsentimentoDocumento, ConsentimentosVigentesResponse } from '../types/cadastro'

const router = useRouter()

const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const documentos = ref<ConsentimentosVigentesResponse | null>(null)
const pendingEmail = ref('')
const senha = ref('')
const pendingTerms = ref<{ termId: string; type: string; version: number; required: boolean }[]>([])
const aceitarMarketing = ref(false)

const requiredPendingIds = computed(() =>
  pendingTerms.value.filter(item => item.required).map(item => item.termId),
)

const optionalPendingIds = computed(() =>
  pendingTerms.value.filter(item => !item.required).map(item => item.termId),
)

const documentosPendentes = computed(() => {
  if (!documentos.value) {
    return []
  }

  const vigentes = [documentos.value.terms, documentos.value.privacy, documentos.value.marketing]
    .filter((item): item is ConsentimentoDocumento => Boolean(item))

  return vigentes.filter(item =>
    pendingTerms.value.some(pending => pending.termId === item.documentId),
  )
})

async function carregarTela() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const context = getPendingTermsContext()
    if (!context) {
      await router.replace('/login')
      return
    }

    pendingEmail.value = context.email
    pendingTerms.value = context.pendingTerms
    documentos.value = await buscarDocumentosVigentes()
    aceitarMarketing.value = optionalPendingIds.value.length === 0
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Não foi possível carregar os documentos vigentes.'
  } finally {
    isLoading.value = false
  }
}

async function confirmar() {
  if (!senha.value.trim()) {
    errorMessage.value = 'Informe sua senha para confirmar os termos.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await resolverPendenciasDeTermos({
      email: pendingEmail.value,
      senha: senha.value,
      requiredTermsIds: requiredPendingIds.value,
      optionalAcceptedTermsIds: aceitarMarketing.value ? optionalPendingIds.value : [],
    })
    await router.replace('/minha-conta')
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Não foi possível concluir a revisão dos termos.'
  } finally {
    isSubmitting.value = false
  }
}

function sair() {
  clearPendingTermsContext()
  clearAuthSession()
  router.replace('/login')
}

onMounted(() => {
  carregarTela()
})
</script>

<template>
  <div class="pending-shell">
    <main class="pending-main">
      <UiCard class="pending-card">
        <header class="pending-head">
          <AppHeading
            eyebrow="Consentimentos"
            title="Revise os termos antes de entrar"
            subtitle="Quando uma versão vigente muda, o acesso fica bloqueado até você decidir sobre os documentos pendentes."
            size="lg"
          />
        </header>

        <UiAlert v-if="errorMessage" tone="danger">
          {{ errorMessage }}
        </UiAlert>

        <div v-if="isLoading" class="pending-loading">
          Carregando termos vigentes...
        </div>

        <template v-else>
          <section
            v-for="documento in documentosPendentes"
            :key="documento.documentId"
            class="document-block"
          >
            <div class="document-meta">
              <strong>{{ documento.type }}</strong>
              <span>Versão {{ documento.version }}</span>
            </div>
            <div class="document-content">{{ documento.content }}</div>
          </section>

          <label v-if="optionalPendingIds.length" class="marketing-choice">
            <input v-model="aceitarMarketing" type="checkbox">
            <span>Desejo aceitar o consentimento opcional de comunicação vigente.</span>
          </label>

          <div class="confirmation-block">
            <UiLabel for="pending-password">Confirme sua senha para concluir</UiLabel>
            <UiInput
              id="pending-password"
              v-model="senha"
              type="password"
              placeholder="Digite sua senha"
            />
          </div>

          <div class="pending-actions">
            <UiButton type="button" class="primary-action" :disabled="isSubmitting" @click="confirmar">
              {{ isSubmitting ? 'Confirmando...' : 'Confirmar e entrar' }}
            </UiButton>

            <UiButton type="button" variant="secondary" @click="sair">
              Voltar ao login
            </UiButton>
          </div>
        </template>
      </UiCard>
    </main>
  </div>
</template>

<style scoped>
.pending-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(37, 99, 235, 0.12), transparent 38%),
    linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
  padding: 32px 16px;
}

.pending-main {
  max-width: 960px;
  margin: 0 auto;
}

.pending-card {
  display: grid;
  gap: 20px;
}

.pending-head {
  display: grid;
  gap: 12px;
}

.pending-loading {
  color: #475569;
}

.document-block {
  border: 1px solid #d7e1ec;
  border-radius: 18px;
  background: #fff;
  padding: 20px;
  display: grid;
  gap: 12px;
}

.document-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #0f172a;
}

.document-content {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #334155;
}

.marketing-choice,
.confirmation-block {
  display: grid;
  gap: 10px;
  color: #334155;
}

.marketing-choice {
  grid-template-columns: auto 1fr;
  align-items: start;
}

.pending-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.primary-action {
  min-width: 220px;
}

@media (max-width: 640px) {
  .pending-actions {
    flex-direction: column;
  }

  .primary-action {
    min-width: 100%;
  }

  .document-meta {
    flex-direction: column;
  }
}
</style>

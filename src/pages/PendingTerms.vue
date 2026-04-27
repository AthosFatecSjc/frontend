<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppHeading from '../components/utils/AppHeading.vue'
import { clearAuthSession } from '../services/authService'
import { getPendingTerms, resolverPendenciasDeTermos } from '../services/termsService'
import type { Terms } from '@/types/terms'

type TermGroup = {
  type: string;
  required: boolean;
  ids: string[];
  contents: string[];
};

const router = useRouter()

const isCheckingPendingContext = ref(true)
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const documentos = ref<Terms[] | null>(null)
const senha = ref('')
const aceitarMarketing = ref(false)

const documentosOrEmpty = computed(() => documentos.value ?? [])

const requiredPendingIds = computed(() =>
  documentosOrEmpty.value.filter(item => item.required).map(item => item.termId),
)

const optionalPendingIds = computed(() =>
  documentosOrEmpty.value.filter(item => !item.required).map(item => item.termId),
)

const documentosPendentes = computed(() => {
  if (!documentos.value) {
    return []
  }

  return documentosOrEmpty.value.reduce((acc, item) => {
    const group = acc.find(g => g.type === item.typeName && g.required === item.required)

    if (group) {
      group.ids.push(item.termId)
      group.contents.push(item.content)
    } else {
      acc.push({
        type: item.typeName,
        required: item.required,
        ids: [item.termId],
        contents: [item.content],
      })
    }

    return acc
  }, [] as TermGroup[])
})

async function carregarTela() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    documentos.value = await getPendingTerms()

    if (!documentos.value) {
      router.replace('/')
      return
    }

    isCheckingPendingContext.value = false

    aceitarMarketing.value = optionalPendingIds.value.length === 0
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Nao foi possivel carregar os documentos vigentes.'
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
      senha: senha.value,
      requiredTermsIds: requiredPendingIds.value,
      optionalAcceptedTermsIds: aceitarMarketing.value ? optionalPendingIds.value : [],
    })
    await router.replace('/minha-conta')
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Nao foi possivel concluir a revisao dos termos.'
  } finally {
    isSubmitting.value = false
  }
}

function sair() {
  clearAuthSession()
  router.replace('/login')
}

onMounted(() => {
  void carregarTela()
})
</script>

<template>
  <div v-if="isCheckingPendingContext" class="pending-shell">Carregando...</div>
  <div v-else class="pending-shell">
    <main class="pending-main">
      <UiCard class="pending-card">
        <AppHeading class="pending-head" eyebrow="Consentimentos" title="Revise os termos antes de entrar"
          subtitle="Quando uma versao vigente muda, o acesso fica bloqueado ate voce decidir sobre os documentos pendentes."
          size="lg" />

        <UiAlert v-if="errorMessage" tone="danger">
          {{ errorMessage }}
        </UiAlert>

        <div v-if="isLoading" class="pending-loading">
          Carregando termos vigentes...
        </div>

        <template v-else>
          <section v-for="termsGroup in documentosPendentes" :key="termsGroup.type" class="document-block">
            <div class="document-meta">
              <strong>{{ termsGroup.type }}</strong>
              <span>{{ termsGroup.ids.length }} Cláusulas</span>
            </div>
            <div v-for="(clauseContent, i) in termsGroup.contents" class="document-content">{{ i + 1 }}. {{
              clauseContent
            }}</div>
          </section>

          <label v-if="optionalPendingIds.length" class="marketing-choice">
            <input v-model="aceitarMarketing" type="checkbox">
            <span>Desejo aceitar o consentimento opcional de comunicacao vigente.</span>
          </label>

          <div class="confirmation-block">
            <UiLabel for="pending-password">Confirme sua senha para concluir</UiLabel>
            <UiInput id="pending-password" v-model="senha" type="password" placeholder="Digite sua senha" />
          </div>

          <div class="pending-actions">
            <UiButton type="button" class="primary-action" :disabled="isSubmitting" @click="confirmar">
              {{ isSubmitting ? 'Confirmando...' : 'Confirmar e entrar' }}
            </UiButton>

            <UiButton type="button" variant="secondary" @click="sair">
              Sair
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
  gap: 2rem;
}

.pending-head {
  display: grid;
  gap: 1rem;
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
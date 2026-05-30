<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout.vue'

import {
  approveTerms,
  getAcceptedTerms,
  getPendingTerms,
  revokeTerms,
} from '@/services/termsService'

import type { Terms } from '../types/terms'

type TermWithSelection = Terms & {
  selected: boolean
}

const isLoading = ref(false)
const isSaving = ref(false)

const errorMessage = ref('')
const feedbackMessage = ref('')

const password = ref('')

const allTerms = ref<TermWithSelection[]>([])

const REQUIRED_TYPES = ['TERMS_OF_USE', 'PRIVACY_POLICY']

function formatTypeName(typeName: string) {
  switch (typeName) {
    case 'TERMS_OF_USE':
      return 'Termos de Uso'

    case 'PRIVACY_POLICY':
      return 'Política de Privacidade'

    case 'MARKETING':
      return 'Marketing'

    default:
      return typeName
        .replace('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase())
  }
}

const termsOfUseTerms = computed(() =>
  allTerms.value.filter(term => term.typeName === 'TERMS_OF_USE'),
)

const privacyPolicyTerms = computed(() =>
  allTerms.value.filter(term => term.typeName === 'PRIVACY_POLICY'),
)

const optionalTerms = computed(() =>
  allTerms.value.filter(
    term => !REQUIRED_TYPES.includes(term.typeName),
  ),
)

async function loadTerms() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [acceptedTerms, pendingTerms] = await Promise.all([
      getAcceptedTerms(),
      getPendingTerms(false),
    ])

    const acceptedIds = new Set(
      acceptedTerms.map(term => term.termId),
    )

    const mergedTerms = [...acceptedTerms, ...pendingTerms]

    const uniqueTermsMap = new Map<string, TermWithSelection>()

    for (const term of mergedTerms) {
      uniqueTermsMap.set(term.termId, {
        ...term,
        selected:
          term.required || acceptedIds.has(term.termId),
      })
    }

    allTerms.value = Array.from(uniqueTermsMap.values())
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Erro ao carregar termos.'
  } finally {
    isLoading.value = false
  }
}

async function saveTerms() {
  errorMessage.value = ''
  feedbackMessage.value = ''

  if (!password.value.trim()) {
    errorMessage.value = 'Informe sua senha para continuar.'
    return
  }

  isSaving.value = true

  try {
    const approvedIds = allTerms.value
      .filter(term => term.required || term.selected)
      .map(term => term.termId)

    const revokedIds = optionalTerms.value
      .filter(term => !term.selected)
      .map(term => term.termId)

    await Promise.all([
      approveTerms(approvedIds),
      revokeTerms(revokedIds),
    ])

    feedbackMessage.value =
      'Preferências salvas com sucesso.'

    await loadTerms()

    password.value = ''
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Erro ao salvar preferências.'
  } finally {
    isSaving.value = false
  }
}

function cancelChanges() {
  password.value = ''
  loadTerms()
}

onMounted(() => {
  loadTerms()
})
</script>

<template>
  <AuthenticatedLayout
    title="Termos e Políticas"
    description="Gerencie suas preferências de privacidade e comunicações opcionais."
  >
    <UiAlert
      v-if="errorMessage"
      tone="danger"
      class="inline-alert"
    >
      {{ errorMessage }}
    </UiAlert>

    <UiAlert
      v-else-if="feedbackMessage"
      class="inline-alert"
    >
      {{ feedbackMessage }}
    </UiAlert>

    <div
      v-if="isLoading"
      class="state-empty"
    >
      Carregando termos...
    </div>

    <template v-else>
      <div class="required-groups-grid">
        <!-- TERMS OF USE -->

        <UiCard class="terms-card">
          <div class="required-header">
            <div>
              <h3 class="section-title">
                Termos de Uso
              </h3>

              <p class="section-description">
                Este grupo é obrigatório e estará sempre aceito.
              </p>
            </div>

            <label class="checkbox-wrapper checkbox-wrapper--required">
              <input
                type="checkbox"
                checked
                disabled
              >

              <span>Aceito</span>
            </label>
          </div>

          <div class="required-terms-list">
            <div
              v-for="term in termsOfUseTerms"
              :key="term.termId"
              class="required-term-item"
            >
              {{ term.content }}
            </div>
          </div>
        </UiCard>

        <!-- PRIVACY POLICY -->

        <UiCard class="terms-card">
          <div class="required-header">
            <div>
              <h3 class="section-title">
                Política de Privacidade
              </h3>

              <p class="section-description">
                Este grupo é obrigatório e estará sempre aceito.
              </p>
            </div>

            <label class="checkbox-wrapper checkbox-wrapper--required">
              <input
                type="checkbox"
                checked
                disabled
              >

              <span>Aceito</span>
            </label>
          </div>

          <div class="required-terms-list">
            <div
              v-for="term in privacyPolicyTerms"
              :key="term.termId"
              class="required-term-item"
            >
              {{ term.content }}
            </div>
          </div>
        </UiCard>
      </div>

      <!-- OPTIONAL TERMS -->

      <UiCard class="terms-card">
        <div class="card-header">
          <h3 class="section-title">
            Termos Opcionais
          </h3>

          <p class="section-description">
            Todos os termos selecionados serão aceitos caso ainda não estejam ativos, e todos os termos não selecionados serão revogados.
          </p>
        </div>

        <div
          v-if="optionalTerms.length === 0"
          class="state-empty"
        >
          Nenhum termo opcional disponível.
        </div>

        <div
          v-else
          class="optional-terms-list"
        >
          <article
            v-for="term in optionalTerms"
            :key="term.termId"
            class="optional-term-card"
          >
            <div class="term-card__header">
              <label class="checkbox-wrapper">
                <input
                  v-model="term.selected"
                  type="checkbox"
                >

                <span>
                  {{ formatTypeName(term.typeName) }}
                </span>
              </label>
            </div>

            <div class="term-content">
              {{ term.content }}
            </div>
          </article>
        </div>
      </UiCard>

      <!-- PASSWORD + ACTIONS -->

      <UiCard class="terms-card">
        <div class="form-group">
          <label class="field-label">
            Confirme sua senha
          </label>

          <UiInput
            v-model="password"
            type="password"
            placeholder="Digite sua senha"
          />
        </div>

        <div class="page-actions">
          <UiButton
            :loading="isSaving"
            @click="saveTerms"
          >
            Salvar
          </UiButton>

          <UiButton
            variant="secondary"
            :disabled="isSaving"
            @click="cancelChanges"
          >
            Cancelar
          </UiButton>
        </div>
      </UiCard>
    </template>
  </AuthenticatedLayout>
</template>

<style scoped>
.terms-card {
  margin-bottom: 1.25rem;
  padding: 1.25rem;
}

.inline-alert {
  margin-bottom: 1rem;
}

.required-groups-grid {
  display: grid;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
  align-items: stretch;
}

.required-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-header {
  margin-bottom: 1rem;
}

.section-title {
  margin: 0;
  font-size: 1.15rem;
  color: #172554;
}

.section-description {
  margin-top: 0.5rem;
  color: #64748b;
  line-height: 1.6;
}

.required-terms-list {
  display: grid;
  gap: 1rem;
}

.required-term-item {
  padding: 1rem;
  border-radius: 0.85rem;
  border: 1px solid #dbe7f3;
  background: #f8fbff;
  color: #334155;
  line-height: 1.65;
  white-space: pre-line;
}

.optional-terms-list {
  display: grid;
  gap: 1rem;
}

.terms-grid {
  display: grid;
  gap: 1rem;
}

.term-card {
  display: grid;
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 1rem;
  border: 1px solid #dbe7f3;
  background: #f8fbff;
}

.optional-term-card {
  display: flex;
  justify-content: flex-start;
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 1rem;
  border: 1px solid #dbe7f3;
  background: #f8fbff;
}

.term-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: #1e293b;
}

.checkbox-wrapper--required {
  flex-shrink: 0;
}

.checkbox-wrapper input {
  width: 1rem;
  height: 1rem;
}

.term-content {
  color: #334155;
  line-height: 1.65;
  white-space: pre-line;
}

.state-empty {
  padding: 1rem 0;
  color: #64748b;
}

.form-group {
  display: grid;
  gap: 0.5rem;
}

.field-label {
  font-weight: 600;
  color: #1e293b;
}

.page-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.required-term-item {
  min-width: 0;
  overflow-wrap: anywhere;
}

@media (min-width: 900px) {
  .required-groups-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .required-groups-grid > * {
    min-width: 0;
    height: 100%;
  }

  .terms-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .required-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-actions {
    flex-direction: column;
  }
}
</style>
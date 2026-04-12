<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import logoImage from '../assets/logo.png'
import AppHeading from '../components/utils/AppHeading.vue'
import { cadastrarUsuario } from '../services/cadastroService'
import type {
  BackendErrorResponse,
  UsuarioCadastroRequest,
} from '../types/cadastro'

type FeedbackTone = 'info' | 'danger'

const router = useRouter()

const nome = ref('')
const email = ref('')
const senha = ref('')
const confirmarSenha = ref('')
const telefone = ref('')

const aceitaTermo = ref(false)
const aceitaPrivacidade = ref(false)
const aceitaMarketing = ref(false)

const showTermsDialog = ref(false)
const showPrivacyDialog = ref(false)

const isLoading = ref(false)

const feedbackMessage = ref('')
const feedbackTone = ref<FeedbackTone>('info')

const errors = ref({
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
})

const submitText = computed(() =>
  isLoading.value ? 'Enviando...' : 'Solicitar acesso',
)

const isSubmitDisabled = computed(() =>
  isLoading.value,
)

function setDangerFeedback(message: string) {
  feedbackTone.value = 'danger'
  feedbackMessage.value = message
}

function clearFieldErrors() {
  errors.value = {
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  }
}

function isEmailValido(valor: string) {
  return /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(valor)
}

function validateForm() {
  clearFieldErrors()
  feedbackMessage.value = ''

  let isValid = true

  if (!nome.value.trim()) {
    errors.value.nome = 'Nome completo é obrigatório.'
    isValid = false
  }

  if (!email.value.trim()) {
    errors.value.email = 'E-mail é obrigatório.'
    isValid = false
  } else if (!isEmailValido(email.value.trim())) {
    errors.value.email = 'E-mail inválido.'
    isValid = false
  }

  if (!senha.value) {
    errors.value.senha = 'Senha é obrigatória.'
    isValid = false
  } else if (senha.value.length < 8) {
    errors.value.senha = 'Senha fraca. Use no mínimo 8 caracteres.'
    isValid = false
  }

  if (!confirmarSenha.value) {
    errors.value.confirmarSenha = 'Confirme a senha.'
    isValid = false
  } else if (senha.value !== confirmarSenha.value) {
    errors.value.confirmarSenha = 'As senhas não coincidem.'
    isValid = false
  }

  if (!aceitaTermo.value) {
    setDangerFeedback('Você precisa aceitar o Termo de Uso para continuar.')
    isValid = false
  }

  if (!aceitaPrivacidade.value) {
    setDangerFeedback('Você precisa confirmar ciência do Aviso de Privacidade.')
    isValid = false
  }

  return isValid
}

function montarTermsIds() {
  return []
}

async function onSubmit() {
  if (!validateForm()) {
    return
  }

  isLoading.value = true

  const payload: UsuarioCadastroRequest = {
    nomeCompleto: nome.value.trim(),
    email: email.value.trim(),
    senha: senha.value,
    termsIds: montarTermsIds(),
  }

  if (telefone.value.trim()) {
    payload.telefone = telefone.value.trim()
  }

  try {
    const response = await cadastrarUsuario(payload)
    feedbackTone.value = 'info'
    feedbackMessage.value = response.mensagem
  } catch (error) {
    const backendError = error as Error & BackendErrorResponse
    const status = backendError.status
    const backendCode = backendError.code ?? backendError.erro
    const backendMessage = backendError.message ?? backendError.mensagem

    if (status === 409) {
      setDangerFeedback('E-mail já cadastrado.')
    } else if (backendCode === 'TERMO_NAO_ENCONTRADO') {
      setDangerFeedback('Você precisa aceitar o Termo de Uso para continuar.')
    } else if (backendMessage) {
      setDangerFeedback(backendMessage)
    } else {
      setDangerFeedback('Erro ao enviar cadastro. Tente novamente.')
    }
  } finally {
    isLoading.value = false
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="login-shell">
    <header class="login-topbar">
      <div class="login-topbar-inner">
        <div class="brand-lockup">
          <img class="brand-icon" :src="logoImage" alt="HiATHOS" />
          <div class="brand-copy">
            <strong>HiATHOS</strong>
            <span>TECSYS</span>
          </div>
        </div>
        <span class="topbar-badge">PLATAFORMA ANALÍTICA</span>
      </div>
    </header>

    <main class="login-main spaced">
      <UiCard class="login-card">
        <header class="login-head">
          <AppHeading
            eyebrow="Cadastro"
            title="Solicitar acesso à plataforma"
            subtitle="Preencha seus dados para solicitar acesso. Seu cadastro será analisado por um administrador."
            size="lg"
          />
        </header>

        <form class="login-form" @submit.prevent="onSubmit">
          <UiAlert v-if="feedbackMessage" :tone="feedbackTone">
            {{ feedbackMessage }}
          </UiAlert>

          <div class="login-field">
            <UiLabel for="cadastro-nome">Nome completo *</UiLabel>
            <UiInput
              id="cadastro-nome"
              v-model="nome"
              placeholder="Seu nome completo"
              :class="{ 'input-error': errors.nome }"
            />
            <small v-if="errors.nome" class="error-text">{{ errors.nome }}</small>
          </div>

          <div class="login-field">
            <UiLabel for="cadastro-email">E-mail *</UiLabel>
            <UiInput
              id="cadastro-email"
              v-model="email"
              type="email"
              placeholder="seu.email@empresa.com"
              :class="{ 'input-error': errors.email }"
            />
            <small v-if="errors.email" class="error-text">{{ errors.email }}</small>
          </div>

          <div class="login-field">
            <UiLabel for="cadastro-senha">Senha *</UiLabel>
            <UiInput
              id="cadastro-senha"
              v-model="senha"
              type="password"
              placeholder="Digite sua senha"
              :class="{ 'input-error': errors.senha }"
            />
            <small v-if="errors.senha" class="error-text">{{ errors.senha }}</small>
          </div>

          <div class="login-field">
            <UiLabel for="cadastro-confirmar-senha">Confirmar senha *</UiLabel>
            <UiInput
              id="cadastro-confirmar-senha"
              v-model="confirmarSenha"
              type="password"
              placeholder="Confirme sua senha"
              :class="{ 'input-error': errors.confirmarSenha }"
            />
            <small v-if="errors.confirmarSenha" class="error-text">{{ errors.confirmarSenha }}</small>
          </div>

          <div class="login-field">
            <UiLabel for="cadastro-telefone">Telefone (opcional)</UiLabel>
            <UiInput id="cadastro-telefone" v-model="telefone" placeholder="(11) 99999-9999" />
          </div>

          <div class="terms-block">
            <label class="term-item">
              <input v-model="aceitaTermo" type="checkbox">
              <span>
                Li e aceito o Termo de Uso
                <button type="button" class="term-link" @click="showTermsDialog = true">
                  Visualizar Termo de Uso
                </button>
              </span>
            </label>

            <label class="term-item">
              <input v-model="aceitaPrivacidade" type="checkbox">
              <span>
                Li o Aviso de Privacidade
                <button type="button" class="term-link" @click="showPrivacyDialog = true">
                  Visualizar Aviso de Privacidade
                </button>
              </span>
            </label>

            <label class="term-item">
              <input v-model="aceitaMarketing" type="checkbox">
              <span>
                Aceito receber comunicações e novidades por e-mail
              </span>
            </label>
          </div>

          <UiButton class="login-submit" type="submit" :disabled="isSubmitDisabled">
            {{ submitText }}
            <span aria-hidden="true">&#8594;</span>
          </UiButton>

          <UiButton type="button" variant="secondary" class="secondary-action" @click="goToLogin">
            Já tenho conta
          </UiButton>

          <p class="login-info">
            Após o cadastro, sua conta ficará pendente até aprovação administrativa.
          </p>
        </form>
      </UiCard>
    </main>

    <AppFooter />

    <div v-if="showTermsDialog" class="modal-overlay" @click.self="showTermsDialog = false">
      <div class="modal-card">
        <h3>Termo de Uso</h3>
        <p class="doc-version">Resumo informativo</p>
        <div class="doc-content">Ao solicitar acesso, você confirma que utilizará a plataforma conforme as regras internas da organização e que as informações fornecidas no cadastro são verdadeiras.</div>
        <button type="button" class="modal-close" @click="showTermsDialog = false">Fechar</button>
      </div>
    </div>

    <div v-if="showPrivacyDialog" class="modal-overlay" @click.self="showPrivacyDialog = false">
      <div class="modal-card">
        <h3>Aviso de Privacidade</h3>
        <p class="doc-version">Resumo informativo</p>
        <div class="doc-content">Os dados informados no cadastro serão usados para análise de acesso, autenticação e administração da sua conta, conforme necessidade operacional da plataforma.</div>
        <button type="button" class="modal-close" @click="showPrivacyDialog = false">Fechar</button>
      </div>
    </div>
  </div>
</template>

<style scoped src="../styles/login-screen.css"></style>

<style scoped>
.spaced {
  margin-top: 48px;
}

@media (min-width: 768px) {
  .spaced {
    margin-top: 72px;
  }
}

.input-error {
  border: 1px solid #ef4444 !important;
}

.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.terms-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.term-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  line-height: 1.4;
}

.term-item input {
  margin-top: 3px;
}

.term-link {
  margin-left: 6px;
  border: none;
  background: transparent;
  padding: 0;
  color: #2563eb;
  text-decoration: underline;
  font-weight: 500;
  cursor: pointer;
}

.secondary-action {
  width: 100%;
}

.login-info {
  color: #5e6f87;
  font-size: 13px;
  margin: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 40;
  padding: 20px;
}

.modal-card {
  width: min(760px, 100%);
  max-height: 82vh;
  overflow: auto;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #dbe4ef;
  padding: 20px;
  box-shadow: var(--shadow-md);
}

.modal-card h3 {
  margin: 0;
}

.doc-version {
  margin: 8px 0 12px;
  color: #64748b;
  font-size: 13px;
}

.doc-content {
  white-space: pre-wrap;
  line-height: 1.45;
  color: #1f2937;
  margin-bottom: 20px;
}

.modal-close {
  border: 1px solid #d1dbe7;
  border-radius: 10px;
  background: #eef2f7;
  color: #334155;
  min-height: 40px;
  padding: 0 16px;
  cursor: pointer;
}
</style>

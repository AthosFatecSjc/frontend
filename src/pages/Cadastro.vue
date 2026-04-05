```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

import logoImage from '../assets/logo.png'
import AppHeading from '../components/utils/AppHeading.vue'

const router = useRouter()

const nome = ref('')
const email = ref('')
const senha = ref('')
const confirmarSenha = ref('')
const telefone = ref('')

const aceitaTermo = ref(false)
const aceitaPrivacidade = ref(false)
const aceitaMarketing = ref(false)

const status = ref<string | null>(null)
const isLoading = ref(false)

const errors = ref({
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
  telefone: ''
})

const submitText = computed(() =>
  isLoading.value ? 'Enviando...' : 'Solicitar acesso'
)

const isSubmitDisabled = computed(() =>
  isLoading.value ||
  !aceitaTermo.value ||
  !aceitaPrivacidade.value
)

function validate() {
  errors.value = {
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: ''
  }

  let isValid = true

  if (!nome.value) {
    errors.value.nome = 'Nome é obrigatório'
    isValid = false
  }

  if (!email.value) {
    errors.value.email = 'E-mail é obrigatório'
    isValid = false
  } else if (!email.value.includes('@')) {
    errors.value.email = 'E-mail inválido'
    isValid = false
  }

  if (!senha.value) {
    errors.value.senha = 'Senha é obrigatória'
    isValid = false
  } else if (senha.value.length < 6) {
    errors.value.senha = 'Mínimo de 6 caracteres'
    isValid = false
  }

  if (!confirmarSenha.value) {
    errors.value.confirmarSenha = 'Confirme a senha'
    isValid = false
  } else if (senha.value !== confirmarSenha.value) {
    errors.value.confirmarSenha = 'As senhas não coincidem'
    isValid = false
  }

  if (!telefone.value) {
    errors.value.telefone = 'Telefone é obrigatório'
    isValid = false
  }

  return isValid
}

async function onSubmit() {
  status.value = null

  if (!validate()) return

  if (!aceitaTermo.value) {
    status.value = 'Você precisa aceitar o Termo de Uso para continuar.'
    return
  }

  if (!aceitaPrivacidade.value) {
    status.value = 'Você precisa confirmar ciência do Aviso de Privacidade.'
    return
  }

  isLoading.value = true

  setTimeout(() => {
    status.value = 'Cadastro realizado com sucesso. Sua solicitação está em análise.'
    isLoading.value = false
  }, 1000)
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
          <img class="brand-icon" :src="logoImage" alt="HiAthos" />
          <div class="brand-copy">
            <strong>HiAthos</strong>
            <span>TECSYS</span>
          </div>
        </div>
        <span class="topbar-badge">PLATAFORMA ANALITICA</span>
      </div>
    </header>

    <main class="login-main">
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
          <UiAlert v-if="status" tone="info">
            {{ status }}
          </UiAlert>

          <div class="login-field">
            <UiLabel>Nome completo *</UiLabel>
            <UiInput v-model="nome" placeholder="Seu nome completo" :class="{ 'input-error': errors.nome }" />
            <small v-if="errors.nome" class="error-text">{{ errors.nome }}</small>
          </div>

          <div class="login-field">
            <UiLabel>E-mail *</UiLabel>
            <UiInput v-model="email" type="email" placeholder="seu.email@empresa.com" :class="{ 'input-error': errors.email }" />
            <small v-if="errors.email" class="error-text">{{ errors.email }}</small>
          </div>

          <div class="login-field">
            <UiLabel>Senha *</UiLabel>
            <UiInput v-model="senha" type="password" placeholder="Digite sua senha" :class="{ 'input-error': errors.senha }" />
            <small v-if="errors.senha" class="error-text">{{ errors.senha }}</small>
          </div>

          <div class="login-field">
            <UiLabel>Confirmar senha *</UiLabel>
            <UiInput v-model="confirmarSenha" type="password" placeholder="Confirme sua senha" :class="{ 'input-error': errors.confirmarSenha }" />
            <small v-if="errors.confirmarSenha" class="error-text">{{ errors.confirmarSenha }}</small>
          </div>

          <div class="login-field">
            <UiLabel>Telefone *</UiLabel>
            <UiInput v-model="telefone" placeholder="(11) 99999-9999" :class="{ 'input-error': errors.telefone }" />
            <small v-if="errors.telefone" class="error-text">{{ errors.telefone }}</small>
          </div>

          <div class="terms-block">
            <label>
              <input type="checkbox" v-model="aceitaTermo" />
              Li e aceito o
              <a href="/termos" target="_blank">Termo de Uso</a>
            </label>

            <label>
              <input type="checkbox" v-model="aceitaPrivacidade" />
              Li o
              <a href="/privacidade" target="_blank">Aviso de Privacidade</a>
            </label>

            <label>
              <input type="checkbox" v-model="aceitaMarketing" />
              Aceito receber comunicações e novidades por e-mail
            </label>
          </div>

          <UiButton
            class="login-submit"
            type="submit"
            :disabled="isSubmitDisabled"
          >
            {{ submitText }}
            <span aria-hidden="true">&#8594;</span>
          </UiButton>

          <div class="login-footer">
            <span>Já possui conta?</span>
            <button type="button" @click="goToLogin">
              Entrar
            </button>
          </div>

          <p class="login-info">
            Após o cadastro, sua conta ficará pendente até aprovação administrativa.
          </p>
        </form>
      </UiCard>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped src="../styles/login-screen.css"></style>

<style scoped>
.input-error {
  border: 1px solid #ef4444 !important;
}

.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}
</style>
```

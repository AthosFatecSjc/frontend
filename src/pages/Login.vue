<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import logoImage from '../assets/logo.png'
import AppHeading from '../components/utils/AppHeading.vue'
import { loginWithStorage } from '../services/authService'
import type { LoginResultType } from '../types/auth'

type StatusState = {
  type: LoginResultType
  message: string
} | null

const router = useRouter()

const email = ref('')
const senha = ref('')
const showPassword = ref(false)
const status = ref<StatusState>(null)
const isLoading = ref(false)

const submitText = computed(() => (isLoading.value ? 'Entrando...' : 'Entrar'))
const passwordToggleLabel = computed(() => (showPassword.value ? 'Ocultar senha' : 'Mostrar senha'))

async function onSubmit() {
  status.value = null
  isLoading.value = true

  try {
    const result = await loginWithStorage(email.value, senha.value)

    if (result.nextRoute) {
      await router.push(result.nextRoute)
      return
    }

    status.value = { type: result.type, message: result.message }
  } catch {
    status.value = {
      type: 'invalid',
      message: 'Não foi possível realizar login. Tente novamente.',
    }
  } finally {
    isLoading.value = false
  }
}

function goToRegister() {
  router.push('/cadastro')
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
            eyebrow="Autenticacao"
            title="Entrar na plataforma"
            subtitle="O acesso esta disponivel apenas para usuarios com conta ATIVA."
            size="lg"
          />
        </header>

        <form class="login-form" @submit.prevent="onSubmit">
          <UiAlert v-if="status" :tone="status.type === 'invalid' || status.type === 'rejected' ? 'danger' : 'info'">
            {{ status.message }}
          </UiAlert>

          <div class="login-field">
            <UiLabel for="login-email">E-mail</UiLabel>
            <UiInput
              id="login-email"
              v-model="email"
              type="email"
              placeholder="seu.email@empresa.com"
            />
          </div>

          <div class="login-field">
            <UiLabel for="login-senha">Senha</UiLabel>
            <UiInput
              id="login-senha"
              v-model="senha"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Digite sua senha"
            />
            <button type="button" class="password-switch" :aria-label="passwordToggleLabel" @click="showPassword = !showPassword">
              {{ passwordToggleLabel }}
            </button>
          </div>

          <UiButton class="login-submit" type="submit" :disabled="isLoading">
            {{ submitText }}
            <span aria-hidden="true">&#8594;</span>
          </UiButton>

          <div class="login-footer">
            <span>Ainda nao possui acesso?</span>
            <button type="button" @click="goToRegister">Solicitar acesso</button>
          </div>
        </form>
      </UiCard>
    </main>

    <AppFooter />
  </div>
</template>

<style src="../styles/login-screen.css"></style>

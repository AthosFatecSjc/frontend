<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { loginWithStorage } from '../services/authService'
import type { LoginResultType } from '../types/auth'
import logoImage from '../assets/logo.png'

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

  const result = await loginWithStorage(email.value, senha.value)

  if (result.type === 'success' && result.nextRoute) {
    await router.push(result.nextRoute)
    isLoading.value = false
    return
  }

  status.value = { type: result.type, message: result.message }
  isLoading.value = false
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
      <section class="login-card">
        <header class="login-head">
          <p class="login-kicker">AUTENTICACAO</p>
          <h1 class="login-title">Entrar na plataforma</h1>
          <p class="login-subtitle">O acesso esta disponivel apenas para usuarios aprovados.</p>
        </header>

        <form class="login-form" @submit.prevent="onSubmit">
          <div v-if="status" class="login-status" :class="status.type">{{ status.message }}</div>

          <div class="login-field">
            <label for="login-email">E-mail</label>
            <div class="login-input-wrap">
              <span class="left-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 7.75C4 6.78 4.78 6 5.75 6H18.25C19.22 6 20 6.78 20 7.75V16.25C20 17.22 19.22 18 18.25 18H5.75C4.78 18 4 17.22 4 16.25V7.75Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                  />
                  <path d="M5 8L12 13L19 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
              </span>
              <input
                id="login-email"
                v-model="email"
                class="login-input"
                type="email"
                autocomplete="email"
                placeholder="seu.email@empresa.com"
                required
              />
            </div>
          </div>

          <div class="login-field">
            <label for="login-senha">Senha</label>
            <div class="login-input-wrap">
              <span class="left-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8" />
                  <path
                    d="M8.5 10V7.75C8.5 5.96 9.96 4.5 11.75 4.5H12.25C14.04 4.5 15.5 5.96 15.5 7.75V10"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              <input
                id="login-senha"
                v-model="senha"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Digite sua senha"
                required
              />
              <button type="button" class="login-toggle" :aria-label="passwordToggleLabel" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M2.75 12C4.57 8.58 8.08 6.5 12 6.5C15.92 6.5 19.43 8.58 21.25 12C19.43 15.42 15.92 17.5 12 17.5C8.08 17.5 4.57 15.42 2.75 12Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.8" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4L20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  <path
                    d="M2.75 12C4.57 8.58 8.08 6.5 12 6.5C13.58 6.5 15.09 6.84 16.45 7.46M18.55 8.54C19.69 9.38 20.61 10.54 21.25 12C19.43 15.42 15.92 17.5 12 17.5C10.42 17.5 8.91 17.16 7.55 16.54"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <button class="login-submit" type="submit" :disabled="isLoading">
            {{ submitText }}
            <span aria-hidden="true">&#8594;</span>
          </button>

          <div class="login-footer">
            <span>Ainda não possui acesso?</span>
            <button type="button" @click="goToRegister">Solicitar acesso</button>
          </div>
        </form>
      </section>

      <p class="login-disclaimer">Tecsys · HiAthos</p>
    </main>
  </div>
</template>

<style src="../styles/login-screen.css"></style>

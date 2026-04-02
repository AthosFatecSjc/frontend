<script setup lang="ts">
import { useRouter } from 'vue-router'

import logoImage from '../assets/logo.png'
import AppHeading from '../components/utils/AppHeading.vue'

const router = useRouter()

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
      <section class="redirect-panel">
        <AppHeading
          eyebrow="Cadastro"
          title="Solicitacao de acesso indisponivel"
          subtitle="Volte para a tela inicial para continuar o fluxo atual."
          size="lg"
        />

        <UiButton class="redirect-panel__button" type="button" @click="goToLogin">
          Voltar para login
        </UiButton>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped src="../styles/login-screen.css"></style>

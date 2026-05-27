<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { hasAdminAccess } from '@/services/authService'

const props = withDefaults(defineProps<{
  collapsed?: boolean
}>(), {
  collapsed: false,
})

const route = useRoute()

const items = [
  { label: 'Minha Conta', to: '/minha-conta', icon: 'user', match: ['/minha-conta'] },
  { label: 'Mapa de Calor', to: '/mapa-calor', icon: 'map', match: ['/mapa-calor'] },
  { label: 'Previsão', to: '/previsao', icon: 'chart', match: ['/previsao'] },
  { label: 'Teste Login Sharing', to: '/testes/login-sharing', icon: 'share', match: ['/testes/login-sharing'] },
  { label: 'Gestão de Usuários', to: '/admin/usuarios', icon: 'users', match: ['/admin/usuarios'] },
  { label: 'Logs e Auditoria', to: '/admin/logs', icon: 'logs', match: ['/admin/logs'] },
]

const visibleItems = computed(() => items.map(item => ({
  ...item,
  isActive: item.match.some(path => route.path.startsWith(path)),
})).filter((item) => item.to === '/minha-conta' || item.to === '/mapa-calor' || item.to === '/previsao' || item.to === '/testes/login-sharing' || hasAdminAccess()))
</script>

<template>
  <nav class="modules-menu">
    <div class="modules-menu__header">
      <p v-if="!props.collapsed" class="modules-menu__eyebrow">Módulos</p>
      <div v-else class="modules-menu__spacer"></div>
    </div>

    <div class="modules-menu__items">
      <RouterLink
        v-for="item in visibleItems"
        :key="item.to"
        :to="item.to"
        class="modules-menu__item"
        :class="{ 'modules-menu__item--active': item.isActive, 'modules-menu__item--collapsed': props.collapsed }"
        :title="props.collapsed ? item.label : undefined"
      >
        <span class="modules-menu__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="modules-menu__svg">
            <template v-if="item.icon === 'map'">
              <path
                d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2Z"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
              />
              <path
                d="M9 4v14M15 6v14"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
              />
            </template>
            <template v-else-if="item.icon === 'chart'">
              <path
                d="M3 3v18h18"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
              />
              <path
                d="M6 18v-5M11 18v-8M16 18v-3"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
              />
            </template>
            <template v-else-if="item.icon === 'logs'">
              <path
                d="M14 3h-4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9Z"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
              />
              <path
                d="M14 3v6h6M11 13h6M11 17h6"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
              />
            </template>
            <template v-else-if="item.icon === 'share'">
              <circle
                cx="6.5"
                cy="12"
                r="2"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
              />
              <circle
                cx="16.5"
                cy="6"
                r="2"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
              />
              <circle
                cx="16.5"
                cy="18"
                r="2"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
              />
              <path
                d="M8.2 11.1 14.8 7M8.2 12.9 14.8 17"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
              />
            </template>
            <template v-else-if="item.icon === 'users'">
              <path
                d="M9.5 12.25a3.5 3.5 0 1 0-3.5-3.5 3.5 3.5 0 0 0 3.5 3.5Zm7.25 0a2.75 2.75 0 1 0-2.75-2.75 2.75 2.75 0 0 0 2.75 2.75ZM4.5 19.5a5 5 0 0 1 10 0"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
              />
              <path
                d="M14.75 19.5a4.25 4.25 0 0 0-8.5 0"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
              />
            </template>
            <template v-else>
              <path
                d="M7.75 18.25a4.25 4.25 0 0 1 8.5 0M15.75 8.75A3.75 3.75 0 1 1 12 5a3.75 3.75 0 0 1 3.75 3.75Z"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.7"
              />
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
              />
            </template>
          </svg>
        </span>
        <span v-if="!props.collapsed">{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.modules-menu {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.modules-menu__header {
  margin-bottom: 0.75rem;
}

.modules-menu__eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #64748b;
}

.modules-menu__spacer {
  height: 32px;
}

.modules-menu__items {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
}

.modules-menu__item {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  border-radius: 0.9rem;
  padding: 0.75rem 0.9rem;
  color: #475569;
  font-size: 0.92rem;
  font-weight: 500;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.modules-menu__item:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modules-menu__item--active {
  background: #0f172a;
  color: #fff;
}

.modules-menu__item--collapsed {
  justify-content: center;
  padding-inline: 0;
}

.modules-menu__icon {
  display: inline-grid;
  place-items: center;
  width: 1rem;
  min-width: 1rem;
}

.modules-menu__svg {
  width: 16px;
  height: 16px;
}
</style>

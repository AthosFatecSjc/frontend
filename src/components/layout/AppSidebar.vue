<script setup lang="ts">
import logoUrl from '@/assets/logo.png'

defineProps<{
  expanded: boolean
  userName?: string
  roleLabel?: string
}>()
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--expanded': expanded }">
    <div class="sidebar__brand" :class="{ 'sidebar__brand--expanded': expanded }">
      <img :src="logoUrl" alt="Logo HiAthos" class="sidebar__logo" />
      <div v-if="expanded">
        <p class="sidebar__title">HiAthos</p>
        <p class="sidebar__subtitle">Tecsys</p>
      </div>
    </div>

    <div v-if="expanded" class="sidebar__user">
      <p class="sidebar__user-name">{{ userName || 'Usuario interno' }}</p>
      <p class="sidebar__user-role">{{ roleLabel || 'Plataforma' }}</p>
    </div>

    <div class="sidebar__menu">
      <AppModulesMenu :collapsed="!expanded" />
    </div>

    <button type="button" class="sidebar__logout" :class="{ 'sidebar__logout--collapsed': !expanded }">
      <span class="sidebar__logout-icon">&#8627;</span>
      <span v-if="expanded">Sair</span>
    </button>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  display: none;
  width: 80px;
  flex-direction: column;
  border-right: 1px solid rgba(226, 232, 240, 0.7);
  background: rgba(255, 255, 255, 0.88);
  padding: 1rem 0.75rem;
  backdrop-filter: blur(16px);
  transition: width 0.2s ease;
}

.sidebar--expanded {
  width: 256px;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar__brand--expanded {
  justify-content: flex-start;
  gap: 1rem;
}

.sidebar__logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.sidebar__title {
  margin: 0;
  color: #0f172a;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.sidebar__subtitle {
  margin: 0;
  color: #64748b;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.sidebar__user {
  margin-top: 1.25rem;
  padding-inline: 0.25rem;
}

.sidebar__user-name {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.sidebar__user-role {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.sidebar__menu {
  margin-top: 1.25rem;
  flex: 1;
}

.sidebar__logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 40px;
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  background: #fff;
  color: #475569;
  font-weight: 500;
}

.sidebar__logout--collapsed {
  padding-inline: 0;
}

.sidebar__logout-icon {
  font-size: 0.95rem;
}

@media (min-width: 1024px) {
  .sidebar {
    display: flex;
  }
}
</style>

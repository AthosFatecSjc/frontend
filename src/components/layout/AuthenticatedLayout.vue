<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title: string
  description: string
  userName?: string
  roleLabel?: string
}>()

const sidebarHovered = ref(false)
</script>

<template>
  <div class="layout-shell">
    <div class="layout-root">
      <AppSidebar
        :expanded="sidebarHovered"
        :user-name="userName"
        :role-label="roleLabel"
        @mouseenter="sidebarHovered = true"
        @mouseleave="sidebarHovered = false"
      />

      <div class="content" :class="{ 'content--expanded': sidebarHovered }">
        <div class="content__body">
          <main class="content__main">
            <AppHeader :title="title" :description="description" />
            <slot />
          </main>
        </div>

        <AppFooter />
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 26%),
    linear-gradient(180deg, #f7fbff 0%, #eef6ff 46%, #eaf2fb 100%);
  color: #0f172a;
}

.layout-root {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.content {
  display: flex;
  min-height: 100vh;
  width: 100%;
  flex: 1;
  flex-direction: column;
}

.content__body {
  flex: 1;
  padding: 1.5rem 1rem 0;
}

.content__main {
  width: 100%;
  padding-bottom: 1.5rem;
}

@media (min-width: 1024px) {
  .content {
    margin-left: 80px;
    transition: margin-left 0.2s ease;
  }

  .content--expanded {
    margin-left: 256px;
  }

  .content__body {
    padding: 2rem 2rem 0;
  }
}
</style>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="page-header">
    <p class="page-header__eyebrow">Area interna</p>
    <div class="page-header__stack">
      <div>
        <h1 class="page-header__title">{{ title }}</h1>
        <p class="page-header__description">{{ description }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 1.5rem;
}

.page-header__eyebrow {
  margin: 0;
  color: rgba(14, 116, 144, 0.8);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.page-header__stack {
  margin-top: 0.5rem;
}

.page-header__title {
  margin: 0;
  color: #0f172a;
  font-size: clamp(2rem, 4vw, 2.25rem);
  font-weight: 600;
  letter-spacing: -0.025em;
}

.page-header__description {
  margin: 0.75rem 0 0;
  max-width: 64rem;
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.65;
}
</style>

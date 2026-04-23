<script setup lang="ts">
defineProps<{
  tone?: 'info' | 'danger' | 'warning'
}>()
</script>

<template>
  <div class="ui-alert" :class="`ui-alert--${tone ?? 'info'}`">
    <slot />
  </div>
</template>

<style scoped>
.ui-alert {
  padding: 1rem 1.1rem;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-size: 0.95rem;
}

.ui-alert--info {
  background: rgba(224, 242, 254, 0.9);
  border-color: rgba(125, 211, 252, 0.8);
  color: #0f4c81;
}

.ui-alert--danger {
  background: var(--danger-bg);
  border-color: var(--danger-border);
  color: var(--danger-text);
}

.ui-alert--warning {
  background: var(--warning-bg);
  border-color: var(--warning-border);
  color: var(--warning-text);
}
</style>

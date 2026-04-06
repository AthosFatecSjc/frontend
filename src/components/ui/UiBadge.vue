<script setup lang="ts">
defineProps<{
  tone?: 'success' | 'warning' | 'danger' | 'neutral'
}>()
</script>

<template>
  <span class="ui-badge" :class="`ui-badge--${tone ?? 'neutral'}`">
    <slot />
  </span>
</template>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.ui-badge--success {
  background: var(--success-bg);
  border-color: var(--success-border);
  color: var(--success-text);
}

.ui-badge--warning {
  background: var(--warning-bg);
  border-color: var(--warning-border);
  color: var(--warning-text);
}

.ui-badge--danger {
  background: var(--danger-bg);
  border-color: var(--danger-border);
  color: var(--danger-text);
}

.ui-badge--neutral {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}
</style>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'outline'
  color?: 'default' | 'success' | 'danger' | 'warning'
  size?: 'sm' | 'md'
  disabled?: boolean
}>(), {
  type: 'button',
  variant: 'primary',
  color: 'default',
  size: 'md',
  disabled: false,
})
</script>

<template>
  <button :type="props.type" class="ui-button" :class="[
    `ui-button--${props.variant}`,
    `ui-button--${props.color}`,
    props.size === 'sm' ? 'ui-button--sm' : '',
  ]" :disabled="props.disabled">
    <slot />
  </button>
</template>

<style scoped>
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: auto;
  min-height: 2.2rem;
  padding: 0.45rem 1.1rem;
  border: 0;
  border-radius: 0.7rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease;
}
.ui-button--sm {
  min-height: 1.8rem;
  font-size: 0.97rem;
  padding: 0.25rem 0.7rem;
  border-radius: 0.6rem;
}
.ui-button--primary {
  color: #fff;
  background: linear-gradient(90deg, #77c8ef 0%, #7da4ea 55%, #84c4bb 100%);
  box-shadow: none;
}
.ui-button--secondary {
  color: #22223b;
  background: #f8fafc;
  border: 1px solid #d1d5db;
}
.ui-button--outline {
  background: #fff;
  border: 1.5px solid #d1d5db;
  color: #22223b;
  box-shadow: none;
}
/* Colors for outline variant */
.ui-button--outline.ui-button--success {
  border-color: #22c55e;
  color: #22c55e;
}
.ui-button--outline.ui-button--danger {
  border-color: #ef4444;
  color: #ef4444;
}
.ui-button--outline.ui-button--warning {
  border-color: #f59e42;
  color: #f59e42;
}
.ui-button--outline.ui-button--default {
  border-color: #d1d5db;
  color: #22223b;
}
.ui-button:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-1px);
  opacity: 0.93;
}
.ui-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  box-shadow: none;
}
</style>

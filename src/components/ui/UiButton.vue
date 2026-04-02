<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}>(), {
  type: 'button',
  variant: 'primary',
  disabled: false,
})
</script>

<template>
  <button :type="props.type" class="ui-button" :class="[`ui-button--${props.variant}`]" :disabled="props.disabled">
    <slot />
  </button>
</template>

<style scoped>
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  width: 100%;
  min-height: 2.8rem;
  padding: 0.75rem 1.2rem;
  border: 0;
  border-radius: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease;
}

.ui-button--primary {
  color: #fff;
  background: linear-gradient(90deg, #77c8ef 0%, #7da4ea 55%, #84c4bb 100%);
  box-shadow: none;
}

.ui-button--secondary {
  color: var(--text);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border);
}

.ui-button:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

.ui-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  box-shadow: none;
}
</style>

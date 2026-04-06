<script setup lang="ts">
defineProps<{
  modelValue: string
  id?: string
  type?: string
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    :id="id"
    :type="type ?? 'text'"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    class="ui-input"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<style scoped>
.ui-input {
  width: 100%;
  min-height: 2.9rem;
  padding: 0.8rem 0.9rem;
  border-radius: 1rem;
  border: 1px solid #b6ecff;
  background: #eefcff;
  color: var(--text);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.ui-input::placeholder {
  color: #94a3b8;
}

.ui-input:focus {
  border-color: rgba(14, 165, 233, 0.5);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.12);
}

.ui-input:disabled {
  color: var(--text-soft);
  background: #f8fbff;
  border-color: #e5edf6;
}
</style>

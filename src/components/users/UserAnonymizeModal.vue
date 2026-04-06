<template>
  <div class="custom-modal-backdrop">
    <div class="custom-modal-card" style="min-width:340px;max-width:98vw;">
      <div class="custom-modal-header">
        <div>
          <div class="custom-modal-title">Tem certeza que deseja anonimizar este usuario?</div>
          <div class="custom-modal-subtitle">Essa acao substituira os dados pessoais por informacoes genericas e nao podera ser desfeita.</div>
        </div>
        <button class="custom-modal-close" @click="$emit('close')">
          <v-icon size="22">mdi-close</v-icon>
        </button>
      </div>
      <div class="custom-modal-fields">
        <input class="custom-modal-input" :value="user.name" readonly />
        <div class="custom-modal-actions">
          <button type="button" class="custom-modal-btn custom-modal-btn-outlined" @click="$emit('close')">Cancelar</button>
          <button type="button" class="custom-modal-btn custom-modal-btn-orange" @click="anonymize">Anonimizar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ user: any }>();
const emit = defineEmits(['close', 'anonymized']);
function anonymize() {
  emit('anonymized', props.user);
}
</script>

<style scoped>
.custom-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(30, 41, 59, 0.13);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.custom-modal-card {
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 4px 32px #0002;
  animation: fadeIn 0.18s;
  padding-bottom: 18px;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.custom-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 28px 0 28px;
}
.custom-modal-title {
  font-size: 1.22rem;
  font-weight: 700;
  color: #22223b;
}
.custom-modal-subtitle {
  color: #64748b;
  font-size: 0.97rem;
  margin-top: 2px;
}
.custom-modal-close {
  background: none;
  border: none;
  color: #64748b;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 2px;
  border-radius: 6px;
  transition: background 0.15s;
}
.custom-modal-close:hover {
  background: #f1f5f9;
}
.custom-modal-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px 28px 0 28px;
}
.custom-modal-input {
  border: 1.5px solid #e5e7eb;
  border-radius: 11px;
  padding: 10px 14px;
  font-size: 1.08rem;
  font-weight: 500;
  background: #f8fafc;
  color: #22223b;
  outline: none;
  transition: border 0.18s;
}
.custom-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
.custom-modal-btn {
  border-radius: 9px;
  font-size: 1.05rem;
  font-weight: 600;
  padding: 8px 22px;
  border: none;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.custom-modal-btn-outlined {
  background: #fff;
  color: #22223b;
  border: 1.5px solid #e5e7eb;
}
.custom-modal-btn-outlined:hover {
  background: #f1f5f9;
}
.custom-modal-btn-orange {
  background: #f59e42;
  color: #fff;
}
.custom-modal-btn-orange:hover {
  background: #e07c1b;
}
</style>

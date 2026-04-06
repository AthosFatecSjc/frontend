<template>
  <div class="custom-modal-backdrop">
    <div class="custom-modal-card">
      <div class="custom-modal-header">
        <div>
          <div class="custom-modal-title">Editar Usuario</div>
          <div class="custom-modal-subtitle">Altere as informacoes do usuario abaixo.</div>
        </div>
        <button class="custom-modal-close" @click="$emit('close')">
          <v-icon size="22">mdi-close</v-icon>
        </button>
      </div>
      <form class="custom-modal-fields" @submit.prevent="save">
        <div class="custom-modal-form-group">
          <label class="custom-modal-label">Nome completo</label>
          <input v-model="editUser.name" required class="custom-modal-input" />
        </div>
        <div class="custom-modal-form-group">
          <label class="custom-modal-label">E-mail</label>
          <input v-model="editUser.email" required type="email" class="custom-modal-input" />
        </div>
        <div class="custom-modal-form-group">
          <label class="custom-modal-label">Telefone</label>
          <input v-model="editUser.phone" class="custom-modal-input" />
        </div>
        <div class="custom-modal-note">Nota: A data de cadastro nao pode ser alterada.</div>
        <div class="custom-modal-actions">
          <button type="button" class="custom-modal-btn custom-modal-btn-outlined" @click="$emit('close')">Cancelar</button>
          <button type="submit" class="custom-modal-btn custom-modal-btn-dark">Salvar alteracoes</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
const props = defineProps<{ user: any }>();
const emit = defineEmits(['close']);
const editUser = reactive({ ...props.user });
watch(() => props.user, (val) => Object.assign(editUser, val));
function save() {
  Object.assign(props.user, editUser);
  emit('close');
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
  min-width: 340px;
  max-width: 98vw;
  padding: 0 0 18px 0;
  animation: fadeIn 0.18s;
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
  gap: 14px;
  padding: 24px 28px 0 28px;
}
.custom-modal-form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.custom-modal-label {
  color: #64748b;
  font-size: 0.97rem;
  font-weight: 500;
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
.custom-modal-input:focus {
  border-color: #7da4ea;
}
.custom-modal-note {
  background: #fffbe7;
  color: #b45309;
  border-radius: 8px;
  font-size: 0.97rem;
  font-weight: 500;
  padding: 8px 14px;
  margin-top: 2px;
  margin-bottom: 2px;
  border: 1px solid #ffe9a7;
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
.custom-modal-btn-dark {
  background: #0f172a;
  color: #fff;
}
.custom-modal-btn-dark:hover {
  background: #22223b;
}
</style>

<template>
  <div class="custom-modal-backdrop">
    <div class="custom-modal-card">
      <div class="custom-modal-header">
        <div>
          <div class="custom-modal-title">Detalhes do Usuario</div>
          <div class="custom-modal-subtitle">Informacoes completas do usuario cadastrado.</div>
        </div>
        <button class="custom-modal-close" @click="$emit('close')">
          <v-icon size="22">mdi-close</v-icon>
        </button>
      </div>
      <div class="custom-modal-fields">
        <div class="custom-modal-field">
          <v-icon class="custom-modal-field-icon" color="#64748b">mdi-account</v-icon>
          <div>
            <div class="custom-modal-label">Nome completo</div>
            <div class="custom-modal-value">{{ user.name }}</div>
          </div>
        </div>
        <div class="custom-modal-field">
          <v-icon class="custom-modal-field-icon" color="#64748b">mdi-email</v-icon>
          <div>
            <div class="custom-modal-label">E-mail</div>
            <div class="custom-modal-value">{{ user.email }}</div>
          </div>
        </div>
        <div class="custom-modal-field">
          <v-icon class="custom-modal-field-icon" color="#64748b">mdi-phone</v-icon>
          <div>
            <div class="custom-modal-label">Telefone</div>
            <div class="custom-modal-value">{{ user.phone || '-' }}</div>
          </div>
        </div>
        <div class="custom-modal-field">
          <v-icon class="custom-modal-field-icon" color="#64748b">mdi-shield-account</v-icon>
          <div>
            <div class="custom-modal-label">Status de acesso</div>
            <v-chip
              v-if="user.status === 'ATIVO'"
              color="success"
              variant="outlined"
              size="small"
              class="font-weight-bold mx-0"
              style="letter-spacing:0.03em;"
            >ATIVO</v-chip>
            <v-chip
              v-else-if="user.status === 'PENDENTE'"
              color="warning"
              variant="outlined"
              size="small"
              class="font-weight-bold mx-0"
              style="letter-spacing:0.03em;"
            >PENDENTE</v-chip>
            <v-chip
              v-else-if="user.status === 'REJEITADO'"
              color="error"
              variant="outlined"
              size="small"
              class="font-weight-bold mx-0"
              style="letter-spacing:0.03em;"
            >REJEITADO</v-chip>
            <v-chip
              v-else
              color="orange"
              variant="outlined"
              size="small"
              class="font-weight-bold mx-0"
              style="letter-spacing:0.03em;"
            >ANONIMIZADO</v-chip>
          </div>
        </div>
        <div class="custom-modal-field">
          <v-icon class="custom-modal-field-icon" color="#64748b">mdi-account-badge</v-icon>
          <div>
            <div class="custom-modal-label">Papel no sistema</div>
            <div class="custom-modal-value">{{ user.role }}</div>
          </div>
        </div>
        <div class="custom-modal-field">
          <v-icon class="custom-modal-field-icon" color="#64748b">mdi-calendar</v-icon>
          <div>
            <div class="custom-modal-label">Data de cadastro</div>
            <div class="custom-modal-value">{{ user.createdAt }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ user: any }>();
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
.custom-modal-field {
  background: #f6f8fa;
  border-radius: 13px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 18px;
}
.custom-modal-field-icon {
  opacity: 0.85;
}
.custom-modal-label {
  color: #64748b;
  font-size: 0.97rem;
  font-weight: 500;
}
.custom-modal-value {
  color: #22223b;
  font-size: 1.08rem;
  font-weight: 600;
  margin-top: 1px;
}
</style>

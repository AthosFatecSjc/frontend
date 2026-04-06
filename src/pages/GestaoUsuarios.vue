<template>
  <AuthenticatedLayout>
    <div class="usuarios-page">
      <div class="usuarios-header">
        <div class="usuarios-title">Gestão de Usuários</div>
        <div class="usuarios-desc">Gerencie solicitações de acesso, acompanhe o status dos cadastros e execute ações administrativas sobre os usuários da plataforma.</div>
      </div>
      <div class="usuarios-toolbar-card">
        <div class="usuarios-toolbar">
          <div class="toolbar-search">
            <label class="input-label">Buscar por nome</label>
            <input
              v-model="search"
              class="search-input"
              placeholder="Digite o nome do usuário"
            />
          </div>
          <div class="toolbar-filter">
            <label for="statusFilter">Filtrar por status</label>
            <select v-model="statusFilter" id="statusFilter" class="status-filter">
              <option value="">Todos</option>
              <option value="ATIVO">Ativo</option>
              <option value="PENDENTE">Pendente</option>
            </select>
          </div>
        </div>
      </div>
      <div class="usuarios-table-card">
        <div class="usuarios-table-title">Usuários cadastrados</div>
        <table class="usuarios-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Data de cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td><b>{{ user.name }}</b></td>
              <td>{{ user.email }}</td>
              <td>{{ user.phone || '-' }}</td>
              <td>
                <v-chip
                  v-if="user.status === 'ATIVO'"
                  color="success"
                  variant="outlined"
                  size="default"
                  class="font-weight-bold px-5 py-1 text-body-2"
                  style="letter-spacing:0.03em;"
                >ATIVO</v-chip>
                <v-chip
                  v-else-if="user.status === 'PENDENTE'"
                  color="warning"
                  variant="outlined"
                  size="default"
                  class="font-weight-bold px-5 py-1 text-body-2"
                  style="letter-spacing:0.03em;"
                >PENDENTE</v-chip>
                <v-chip
                  v-else-if="user.status === 'REJEITADO'"
                  color="error"
                  variant="outlined"
                  size="default"
                  class="font-weight-bold px-5 py-1 text-body-2"
                  style="letter-spacing:0.03em;"
                >REJEITADO</v-chip>
                <v-chip
                  v-else
                  color="orange"
                  variant="outlined"
                  size="default"
                  class="font-weight-bold px-5 py-1 text-body-2"
                  style="letter-spacing:0.03em;"
                >ANONIMIZADO</v-chip>
              </td>
              <td>{{ user.createdAt }}</td>
              <td class="usuarios-actions">
                <UiButton @click="openView(user)" size="sm" variant="outline" color="default">
                  <v-icon size="20">mdi-eye-outline</v-icon> Visualizar
                </UiButton>
                <UiButton @click="openEdit(user)" size="sm" variant="outline" color="default">
                  <v-icon size="20">mdi-pencil</v-icon> Editar
                </UiButton>
                <UiButton v-if="user.status === 'PENDENTE'" @click="openApprove(user)" size="sm" variant="outline" color="success">
                  <v-icon size="20" color="success">mdi-check</v-icon> Aprovar
                </UiButton>
                <UiButton v-if="user.status === 'PENDENTE'" @click="openReject(user)" size="sm" variant="outline" color="danger">
                  <v-icon size="20" color="error">mdi-close</v-icon> Rejeitar
                </UiButton>
                <UiButton @click="openAnonymize(user)" size="sm" variant="outline" color="warning">
                  <v-icon size="20" color="warning">mdi-account-off</v-icon> Anonimizar
                </UiButton>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="text-center">Nenhum usuário encontrado.</td>
            </tr>
          </tbody>
        </table>
        <div class="usuarios-table-footer">Mostrando {{ filteredUsers.length }} de {{ users.length }} registros</div>
      </div>
      <!-- Modais -->
      <UserViewModal v-if="modal.view" :user="modal.user" @close="closeModal" />
      <UserEditModal v-if="modal.edit" :user="modal.user" @close="closeModal" />
      <UserApproveModal v-if="modal.approve" :user="modal.user" @close="closeModal" @approved="approveUser" />
      <UserRejectModal v-if="modal.reject" :user="modal.user" @close="closeModal" @rejected="rejectUser" />
      <UserAnonymizeModal v-if="modal.anonymize" :user="modal.user" @close="closeModal" @anonymized="anonymizeUser" />
    </div>
  </AuthenticatedLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout.vue';
import AppHeading from '@/components/utils/AppHeading.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UserViewModal from '@/components/users/UserViewModal.vue';
import UserEditModal from '@/components/users/UserEditModal.vue';
import UserApproveModal from '@/components/users/UserApproveModal.vue';
import UserRejectModal from '@/components/users/UserRejectModal.vue';
import UserAnonymizeModal from '@/components/users/UserAnonymizeModal.vue';


type User = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: 'ATIVO' | 'PENDENTE' | 'REJEITADO' | 'ANONIMIZADO';
  createdAt: string;
  role: string;
  rejectionReason?: string;
};

// Mock de usuários
const users = ref<User[]>([
  {
    id: 1,
    name: 'Administrador',
    email: 'admin@tecsys.com',
    phone: '',
    status: 'ATIVO',
    createdAt: '23/03/2026',
    role: 'Administrador',
  },
  {
    id: 2,
    name: 'Ruth',
    email: 'ruth@gmail.com',
    phone: '(12) 98703-8248',
    status: 'PENDENTE',
    createdAt: '23/03/2026',
    role: 'Usuario',
  },
]);

const search = ref('');
const statusFilter = ref('');

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const matchesName = u.name.toLowerCase().includes(search.value.toLowerCase());
    const matchesStatus = !statusFilter.value || u.status === statusFilter.value;
    return matchesName && matchesStatus;
  });
});

const modal = ref<{
  view: boolean;
  edit: boolean;
  approve: boolean;
  reject: boolean;
  anonymize: boolean;
  user: User | null;
}>({
  view: false,
  edit: false,
  approve: false,
  reject: false,
  anonymize: false,
  user: null,
});

function openView(user: User) {
  modal.value = { view: true, edit: false, approve: false, reject: false, anonymize: false, user };
}
function openEdit(user: User) {
  modal.value = { view: false, edit: true, approve: false, reject: false, anonymize: false, user };
}
function openApprove(user: User) {
  modal.value = { view: false, edit: false, approve: true, reject: false, anonymize: false, user };
}
function openReject(user: User) {
  modal.value = { view: false, edit: false, approve: false, reject: true, anonymize: false, user };
}
function openAnonymize(user: User) {
  modal.value = { view: false, edit: false, approve: false, reject: false, anonymize: true, user };
}
function closeModal() {
  modal.value = { view: false, edit: false, approve: false, reject: false, anonymize: false, user: null };
}
function approveUser(user: User) {
  user.status = 'ATIVO';
  closeModal();
}
function rejectUser(user: User, motivo: string) {
  user.status = 'REJEITADO';
  user.rejectionReason = motivo;
  closeModal();
}
function anonymizeUser(user: User) {
  user.name = 'Usuário Anônimo';
  user.email = 'anonimo@anonimo.com';
  user.phone = '-';
  user.status = 'ANONIMIZADO';
  closeModal();
}
</script>

<style scoped>
.usuarios-page {
  padding: 32px 0 0 0;
  background: #f3f6fa;
  min-height: 100vh;
}
.usuarios-header {
  margin-left: 32px;
  margin-bottom: 16px;
}
.usuarios-title {
  font-size: 2rem;
  font-weight: 700;
  color: #22223b;
}
.usuarios-desc {
  color: #6b7280;
  font-size: 1rem;
  margin-top: 2px;
}
.usuarios-toolbar-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px #0001;
  margin: 0 32px 24px 32px;
  padding: 18px 24px 10px 24px;
}
.usuarios-toolbar {
  display: flex;
  align-items: flex-end;
  gap: 24px;
}
.toolbar-search {
  flex: 1;
}
.search-input {
  width: 100%;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  background: #f8fafc;
  font-size: 1rem;
}
.toolbar-filter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
}
.status-filter {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #f8fafc;
  font-size: 1rem;
}
.usuarios-table-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px #0001;
  margin: 0 32px;
  padding: 18px 24px 10px 24px;
}
.usuarios-table-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #22223b;
  margin-bottom: 8px;
}
.usuarios-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px #0001;
}
.usuarios-table th, .usuarios-table td {
  padding: 12px 10px;
  text-align: left;
  font-size: 1rem;
}
.usuarios-table th {
  color: #6b7280;
  font-weight: 600;
  background: #f1f5f9;
  border-bottom: 1px solid #e5e7eb;
}
.usuarios-table tr {
  border-bottom: 1px solid #e5e7eb;
}
.usuarios-table tr:last-child {
  border-bottom: none;
}
.usuarios-actions {
  display: flex;
  gap: 6px;
}
.usuarios-table-footer {
  color: #6b7280;
  font-size: 14px;
  margin-top: 8px;
}
.text-center {
  text-align: center;
}
@media (max-width: 900px) {
  .usuarios-header, .usuarios-toolbar-card, .usuarios-table-card {
    margin-left: 8px;
    margin-right: 8px;
  }
}

.breadcrumbs-small {
  background: transparent;
  box-shadow: none;
  padding: 2px 0;
}


</style>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout.vue'
import { hasAdminAccess } from '@/services/authService'
import { API_BASE_URL, createProtectedJsonRequest } from '@/services/api'

type UserStatus = 'ATIVO' | 'PENDENTE' | 'REJEITADO'
type UserRole = 'ADMIN' | 'USUARIO'
type DialogType = 'details' | 'edit' | 'approve' | 'reject' | 'role' | 'delete'

type UserRow = {
  id: string
  nomeCompleto: string
  email: string
  telefone: string
  status: UserStatus
  role: UserRole
  dataCadastro: string
  justificativa?: string
}

type UserApiRow = {
  id: string
  nomeCompleto: string
  email: string
  telefone: string | null
  status: UserStatus
  role: string
  dataCadastro: string
}

type UserEditPayload = {
  novoEmail: string
}

type FilterState = {
  query: string
  status: '' | UserStatus
  role: '' | UserRole
}

const users = ref<UserRow[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const feedbackMessage = ref('')
const filters = reactive<FilterState>({
  query: '',
  status: '',
  role: '',
})

const selectedUserId = ref('')
const selectedDialog = ref<DialogType | null>(null)
const rejectJustification = ref('')
const roleChangeTargetRole = ref<UserRole>('ADMIN')
const isSubmittingRoleChange = ref(false)

const editForm = reactive({
  email: '',
})

const canAccessAdminArea = computed(() => hasAdminAccess())

const selectedUser = computed(() => users.value.find(user => user.id === selectedUserId.value) ?? null)

const filteredUsers = computed(() => {
  const query = filters.query.trim().toLowerCase()

  return users.value.filter((user) => {
    const matchesQuery = !query || user.nomeCompleto.toLowerCase().includes(query)
    const matchesStatus = !filters.status || user.status === filters.status
    const matchesRole = !filters.role || user.role === filters.role

    return matchesQuery && matchesStatus && matchesRole
  })
})

const totalRecords = computed(() => filteredUsers.value.length)

const paginationStart = computed(() => (totalRecords.value === 0 ? 0 : 1))

const paginationEnd = computed(() => totalRecords.value)

function normalizeUser(apiUser: UserApiRow): UserRow {
  return {
    id: apiUser.id,
    nomeCompleto: apiUser.nomeCompleto,
    email: apiUser.email,
    telefone: apiUser.telefone?.trim() ? apiUser.telefone : '-',
    status: apiUser.status,
    role: apiUser.role.trim().toLowerCase() === 'admin' ? 'ADMIN' : 'USUARIO',
    dataCadastro: apiUser.dataCadastro,
  }
}

async function loadUsers() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/usuarios`,
      createProtectedJsonRequest(),
    )

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(errorBody.message || 'Falha ao carregar usuários')
    }

    const data = await response.json() as UserApiRow[]
    users.value = data.map(normalizeUser)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erro ao carregar usuários'
    users.value = []
  } finally {
    isLoading.value = false
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function statusLabel(status: UserStatus) {
  if (status === 'ATIVO') return 'Ativo'
  if (status === 'PENDENTE') return 'Pendente'
  return 'Rejeitado'
}

function roleLabel(role: UserRole) {
  return role === 'ADMIN' ? 'ADMIN' : 'USUÁRIO'
}

function statusTone(status: UserStatus) {
  if (status === 'ATIVO') return 'success'
  if (status === 'PENDENTE') return 'warning'
  return 'danger'
}

function openDialog(type: DialogType, user: UserRow) {
  selectedUserId.value = user.id
  selectedDialog.value = type
  feedbackMessage.value = ''
  errorMessage.value = ''

  if (type === 'edit') {
    editForm.email = user.email
  }

  if (type === 'reject') {
    rejectJustification.value = ''
  }

  if (type === 'role') {
    roleChangeTargetRole.value = user.role === 'ADMIN' ? 'USUARIO' : 'ADMIN'
  }
}

function closeDialog() {
  selectedDialog.value = null
  selectedUserId.value = ''
  isSubmittingRoleChange.value = false
}

async function persistUserEdit(userId: string, payload: UserEditPayload) {
  const candidateUrls = [
    `${API_BASE_URL}/admin/usuarios/${userId}/email`,
    `${API_BASE_URL}/usuarios/${userId}/email`,
  ]
  const candidateMethods: Array<'PATCH'> = ['PATCH']
  let lastError: Error | null = null

  for (const url of candidateUrls) {
    for (const method of candidateMethods) {
      const response = await fetch(
        url,
        {
          ...createProtectedJsonRequest(),
          method,
          body: JSON.stringify(payload),
        },
      )

      if (response.ok) {
        return
      }

      const errorBody = await response.json().catch(() => ({} as {
        message?: string
        mensagem?: string
        error?: string
      }))
      const message = errorBody.message ?? errorBody.mensagem ?? errorBody.error ?? 'Falha ao salvar alterações do usuário'

      if (response.status === 404 || response.status === 405) {
        lastError = new Error(message)
        continue
      }

      throw new Error(message)
    }
  }

  throw lastError ?? new Error('Falha ao salvar alterações do usuário')
}

async function confirmApprove() {
  if (!selectedUser.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/usuarios/${selectedUser.value.id}/status`,
      {
        ...createProtectedJsonRequest(),
        method: 'PATCH',
        body: JSON.stringify({ status: 'ATIVO', motivo: null }),
      },
    )

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(errorBody.message || 'Falha ao aprovar usuário')
    }

    feedbackMessage.value = `${selectedUser.value.nomeCompleto} foi aprovada(o) com sucesso.`
    closeDialog()
    await loadUsers()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erro ao aprovar usuário'
  } finally {
    isLoading.value = false
  }
}

async function confirmReject() {
  if (!selectedUser.value || !rejectJustification.value.trim()) {
    errorMessage.value = 'Informe a justificativa da rejeição.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/usuarios/${selectedUser.value.id}/status`,
      {
        ...createProtectedJsonRequest(),
        method: 'PATCH',
        body: JSON.stringify({ status: 'REJEITADO', motivo: rejectJustification.value.trim() }),
      },
    )

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(errorBody.message || 'Falha ao rejeitar usuário')
    }

    feedbackMessage.value = `${selectedUser.value.nomeCompleto} foi rejeitada(o) com sucesso.`
    closeDialog()
    await loadUsers()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erro ao rejeitar usuário'
  } finally {
    isLoading.value = false
  }
}

async function confirmSaveEdit() {
  if (!selectedUser.value) return

  const payload: UserEditPayload = {
    novoEmail: editForm.email.trim(),
  }

  if (!payload.novoEmail) {
    errorMessage.value = 'E-mail é obrigatório.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await persistUserEdit(selectedUser.value.id, payload)
    feedbackMessage.value = `E-mail de ${selectedUser.value.nomeCompleto} atualizado com sucesso.`
    closeDialog()
    await loadUsers()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erro ao salvar alterações do usuário'
  } finally {
    isLoading.value = false
  }
}

async function confirmRoleChange() {
  if (!selectedUser.value) return

  isSubmittingRoleChange.value = true
  errorMessage.value = ''

  try {
    const roleName = roleChangeTargetRole.value === 'ADMIN' ? 'admin' : 'user'
    const response = await fetch(
      `${API_BASE_URL}/admin/usuarios/${selectedUser.value.id}/role`,
      {
        ...createProtectedJsonRequest(),
        method: 'PATCH',
        body: JSON.stringify({ roleName }),
      }
    )

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(errorBody.message || 'Falha ao alterar role do usuário')
    }

    feedbackMessage.value = `Perfil de ${selectedUser.value.nomeCompleto} atualizado com sucesso.`
    closeDialog()
    await loadUsers()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erro ao alterar role'
  } finally {
    isSubmittingRoleChange.value = false
  }
}

async function confirmAnonymizeUser() {
  if (!selectedUser.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(
      `${API_BASE_URL}/usuarios/${selectedUser.value.id}/anonimizar`,
      {
        ...createProtectedJsonRequest(),
        method: 'POST',
      },
    )

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(errorBody.message || 'Falha ao deletar usuário')
    }

    feedbackMessage.value = `${selectedUser.value.nomeCompleto} foi deletado(a) com sucesso.`
    closeDialog()
    await loadUsers()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erro ao deletar usuário'
  } finally {
    isLoading.value = false
  }
}

function resetFilters() {
  filters.query = ''
  filters.status = ''
  filters.role = ''
}

function openRoleChangeDialog(user: UserRow) {
  if (user.status !== 'ATIVO') return
  openDialog('role', user)
}

onMounted(() => {
  if (!canAccessAdminArea.value) {
    return
  }

  loadUsers()
})
</script>

<template>
  <AuthenticatedLayout
    title="Gestão de Usuários"
    description="Gerencie solicitações de acesso, acompanhe o status dos cadastros e execute ações administrativas sobre os usuários da plataforma."
  >
    <template v-if="!canAccessAdminArea">
      <UiCard class="restricted-card">
        <p class="section-eyebrow">Área restrita</p>
        <h2 class="section-title">Acesso exclusivo para administradores</h2>
        <p class="section-description">A tela de gestão de usuários fica disponível apenas para perfis administrativos.</p>
      </UiCard>
    </template>

    <template v-else>
      <UiCard class="filters-card">
        <div class="filters-grid">
          <div class="field-group field-group--wide">
            <UiLabel for="user-search">Buscar por nome</UiLabel>
            <div class="input-shell">
              <span class="input-shell__icon" aria-hidden="true">⌕</span>
              <UiInput id="user-search" v-model="filters.query" placeholder="Digite o nome do usuario" />
            </div>
          </div>

          <div class="field-group">
            <UiLabel for="status-filter">Filtrar por status</UiLabel>
            <select id="status-filter" v-model="filters.status" class="field-select">
              <option value="">Todos</option>
              <option value="ATIVO">Ativo</option>
              <option value="PENDENTE">Pendente</option>
              <option value="REJEITADO">Rejeitado</option>
            </select>
          </div>

          <div class="field-group">
            <UiLabel for="role-filter">Filtrar por perfil</UiLabel>
            <select id="role-filter" v-model="filters.role" class="field-select">
              <option value="">Todos</option>
              <option value="ADMIN">ADMIN</option>
              <option value="USUARIO">USUÁRIO</option>
            </select>
          </div>

          <div class="field-group field-group--action">
            <UiButton variant="secondary" class="clear-button" @click="resetFilters">
              Limpar filtros
            </UiButton>
          </div>
        </div>
      </UiCard>

      <UiAlert v-if="errorMessage" tone="danger" class="inline-alert">
        {{ errorMessage }}
      </UiAlert>

      <UiAlert v-else-if="feedbackMessage" class="inline-alert">
        {{ feedbackMessage }}
      </UiAlert>

      <UiCard class="table-card">
        <div class="table-card__header">
          <div>
            <p class="section-eyebrow">Usuários cadastrados</p>
            <h2 class="section-title">Controle de acesso e perfis</h2>
          </div>
        </div>

        <div v-if="isLoading" class="state-empty">Carregando usuários...</div>

        <div v-else-if="filteredUsers.length === 0" class="state-empty state-empty--soft">
          Nenhum usuário encontrado com os filtros aplicados.
        </div>

        <div v-else class="table-scroll">
          <table class="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Perfil</th>
                <th>Data de cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>
                  <div class="user-name-cell">
                    <strong>{{ user.nomeCompleto }}</strong>
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>{{ user.telefone }}</td>
                <td><UiBadge :tone="statusTone(user.status)">{{ statusLabel(user.status) }}</UiBadge></td>
                <td>
                  <div class="role-cell">
                    <UiBadge :tone="user.role === 'ADMIN' ? 'success' : 'neutral'">{{ roleLabel(user.role) }}</UiBadge>
                    <button
                      v-if="user.status === 'ATIVO'"
                      type="button"
                      :class="['role-toggle-button', { 'role-toggle-button--active': user.role === 'ADMIN' }]"
                      :aria-label="`Alternar perfil de ${user.nomeCompleto}`"
                      @click="openRoleChangeDialog(user)"
                    >
                      <span class="role-toggle-slider" />
                    </button>
                  </div>
                </td>
                <td>{{ formatDate(user.dataCadastro) }}</td>
                <td>
                  <div class="action-row">
                    <button type="button" class="action-button action-button--ghost" @click="openDialog('details', user)">Visualizar</button>
                    <button type="button" class="action-button action-button--ghost" @click="openDialog('edit', user)">Editar</button>
                    <button type="button" class="action-button action-button--danger" @click="openDialog('delete', user)">
                      deletar
                    </button>
                    <button
                      v-if="user.status === 'PENDENTE'"
                      type="button"
                      class="action-button action-button--success"
                      @click="openDialog('approve', user)"
                    >
                      Aprovar
                    </button>
                    <button
                      v-if="user.status === 'PENDENTE'"
                      type="button"
                      class="action-button action-button--danger"
                      @click="openDialog('reject', user)"
                    >
                      Rejeitar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="table-footer">
          Mostrando {{ paginationStart }} a {{ paginationEnd }} de {{ totalRecords }} registros
        </footer>
      </UiCard>
    </template>

    <div v-if="selectedDialog" class="modal-overlay" @click.self="closeDialog">
      <div v-if="selectedDialog === 'details' && selectedUser" class="modal-card modal-card--details">
        <button type="button" class="modal-close" aria-label="Fechar" @click="closeDialog">×</button>
        <p class="modal-eyebrow">Detalhes do Usuário</p>
        <h3 class="modal-title">Informações completas do usuário cadastrado.</h3>

        <div class="detail-list">
          <div class="detail-item">
            <span class="detail-label">Nome completo</span>
            <strong>{{ selectedUser.nomeCompleto }}</strong>
          </div>
          <div class="detail-item">
            <span class="detail-label">E-mail</span>
            <strong>{{ selectedUser.email }}</strong>
          </div>
          <div class="detail-item">
            <span class="detail-label">Telefone</span>
            <strong>{{ selectedUser.telefone }}</strong>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status de acesso</span>
            <UiBadge :tone="statusTone(selectedUser.status)">{{ statusLabel(selectedUser.status) }}</UiBadge>
          </div>
          <div class="detail-item">
            <span class="detail-label">Papel no sistema</span>
            <strong>{{ roleLabel(selectedUser.role) }}</strong>
          </div>
          <div class="detail-item">
            <span class="detail-label">Data de cadastro</span>
            <strong>{{ formatDateTime(selectedUser.dataCadastro) }}</strong>
          </div>
        </div>
      </div>

      <div v-else-if="selectedDialog === 'edit' && selectedUser" class="modal-card">
        <button type="button" class="modal-close" aria-label="Fechar" @click="closeDialog">×</button>
        <p class="modal-eyebrow">Editar Usuário</p>
        <h3 class="modal-title">Altere o e-mail do usuário abaixo.</h3>

        <div class="modal-form">
          <div class="modal-field">
            <UiLabel for="edit-email">E-mail</UiLabel>
            <UiInput id="edit-email" v-model="editForm.email" />
          </div>
          <UiAlert tone="warning" class="modal-note">Somente administradores podem alterar e-mail de usuários.</UiAlert>
        </div>

        <div class="modal-actions">
          <UiButton variant="secondary" class="modal-action" @click="closeDialog">Cancelar</UiButton>
          <UiButton class="modal-action" @click="confirmSaveEdit">Salvar alterações</UiButton>
        </div>
      </div>

      <div v-else-if="selectedDialog === 'approve' && selectedUser" class="modal-card modal-card--compact">
        <button type="button" class="modal-close" aria-label="Fechar" @click="closeDialog">×</button>
        <p class="modal-title modal-title--compact">Tem certeza que deseja aprovar este usuário?</p>
        <p class="modal-description">Essa ação liberará o acesso do cadastro pendente.</p>
        <div class="modal-actions">
          <UiButton variant="secondary" class="modal-action" @click="closeDialog">Cancelar</UiButton>
          <UiButton class="modal-action modal-action--success" @click="confirmApprove">Aprovar</UiButton>
        </div>
      </div>

      <div v-else-if="selectedDialog === 'reject' && selectedUser" class="modal-card modal-card--compact">
        <button type="button" class="modal-close" aria-label="Fechar" @click="closeDialog">×</button>
        <p class="modal-title modal-title--compact">Tem certeza que deseja rejeitar este usuário?</p>
        <p class="modal-description">A rejeição exige uma justificativa para registro futuro.</p>

        <div class="modal-field">
          <UiLabel for="reject-reason">Justificativa</UiLabel>
          <textarea
            id="reject-reason"
            v-model="rejectJustification"
            class="modal-textarea"
            rows="4"
            placeholder="Descreva o motivo da rejeição"
          />
        </div>

        <div class="modal-actions">
          <UiButton variant="secondary" class="modal-action" @click="closeDialog">Cancelar</UiButton>
          <UiButton class="modal-action modal-action--danger" @click="confirmReject">Rejeitar</UiButton>
        </div>
      </div>

      <div v-else-if="selectedDialog === 'role' && selectedUser" class="modal-card modal-card--compact">
        <button type="button" class="modal-close" aria-label="Fechar" @click="closeDialog">×</button>
        <p class="modal-title modal-title--compact">Alterar perfil do usuário</p>
        <p class="modal-description">
          {{ roleChangeTargetRole === 'ADMIN'
            ? 'Tem certeza que deseja tornar este usuário ADMIN?'
            : 'Tem certeza que deseja voltar este usuário para USUÁRIO?'
          }}
        </p>

        <div class="modal-actions">
          <UiButton variant="secondary" class="modal-action" @click="closeDialog" :disabled="isSubmittingRoleChange">
            Cancelar
          </UiButton>
          <UiButton class="modal-action" @click="confirmRoleChange" :disabled="isSubmittingRoleChange">
            {{ isSubmittingRoleChange
              ? 'Atualizando...'
              : (roleChangeTargetRole === 'ADMIN' ? 'Sim, tornar ADMIN' : 'Sim, tornar USUÁRIO')
            }}
          </UiButton>
        </div>
      </div>

      <div v-else-if="selectedDialog === 'delete' && selectedUser" class="modal-card modal-card--compact">
        <button type="button" class="modal-close" aria-label="Fechar" @click="closeDialog">×</button>
        <p class="modal-title modal-title--compact">Anonimizar este usuário?</p>
        <p class="modal-description">
          Essa ação remove os dados pessoais do cadastro e não pode ser desfeita.
        </p>

        <div class="modal-actions">
          <UiButton variant="secondary" class="modal-action" @click="closeDialog" :disabled="isLoading">
            Cancelar
          </UiButton>
          <UiButton class="modal-action modal-action--danger" @click="confirmAnonymizeUser" :disabled="isLoading">
            {{ isLoading ? 'Anonimizando...' : 'Sim, anonimizar' }}
          </UiButton>
        </div>
      </div>
    </div>
  </AuthenticatedLayout>
</template>

<style scoped>
.restricted-card,
.filters-card,
.table-card {
  margin-bottom: 1.25rem;
}

.restricted-card,
.table-card {
  padding: 1.25rem;
}

.section-eyebrow {
  margin: 0;
  color: #0f8ab3;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.26em;
  text-transform: uppercase;
}

.section-title {
  margin: 0.55rem 0 0;
  font-size: 1.2rem;
  color: #172554;
}

.section-description {
  margin: 0.5rem 0 0;
  color: #60758c;
}

.filters-card {
  padding: 1rem 1.1rem;
}

.filters-grid {
  display: grid;
  gap: 1rem;
}

.field-group {
  display: grid;
  gap: 0.4rem;
}

.field-group--wide {
  grid-column: 1 / -1;
}

.field-group--action {
  align-self: end;
}

.input-shell {
  position: relative;
}

.input-shell__icon {
  position: absolute;
  inset: 50% auto auto 0.9rem;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 1.05rem;
  pointer-events: none;
}

.input-shell :deep(.ui-input) {
  padding-left: 2.35rem;
}

.field-select {
  width: 100%;
  min-height: 2.9rem;
  padding: 0.8rem 0.9rem;
  border-radius: 1rem;
  border: 1px solid #b6ecff;
  background: #eefcff;
  color: var(--text);
  outline: none;
}

.field-select:focus {
  border-color: rgba(14, 165, 233, 0.5);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.12);
}

.clear-button {
  width: 100%;
}

.inline-alert {
  margin-bottom: 1rem;
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.table-card__header {
  padding: 1.2rem 1.25rem 0.75rem;
}

.table-scroll {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

.users-table th,
.users-table td {
  padding: 1rem 1.25rem;
  border-top: 1px solid #e4edf6;
  text-align: left;
  vertical-align: middle;
}

.users-table th {
  color: #637289;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.users-table td {
  color: #334155;
}

.user-name-cell strong {
  color: #1e293b;
}

.role-cell {
  display: grid;
  gap: 0.55rem;
}

.role-toggle-button {
  display: inline-flex;
  align-items: center;
  width: 3.5rem;
  height: 2rem;
  padding: 0.2rem;
  border: 2px solid #d1e7f0;
  border-radius: 1rem;
  background: #f0f8fb;
  cursor: pointer;
  transition: all 0.3s ease;
}

.role-toggle-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.role-toggle-button:hover:not(:disabled) {
  border-color: #0f8ab3;
  background: #e8f4f9;
}

.role-toggle-button--active {
  border-color: #0f8ab3;
  background: #0f8ab3;
}

.role-toggle-slider {
  display: inline-block;
  width: 1.45rem;
  height: 1.45rem;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.22);
  transition: transform 0.3s ease;
}

.role-toggle-button--active .role-toggle-slider {
  transform: translateX(1.45rem);
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.action-button {
  width: auto;
  min-height: 2.4rem;
  padding: 0.55rem 0.9rem;
  border-radius: 0.9rem;
  border: 1px solid transparent;
  background: #fff;
  color: #334155;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.action-button:hover {
  transform: translateY(-1px);
  filter: brightness(1.02);
}

.action-button--ghost {
  border-color: #d8e3ef;
}

.action-button--success {
  border-color: #a7f3d0;
  background: #ecfdf5;
  color: #047857;
}

.action-button--danger {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.table-footer {
  padding: 1rem 1.25rem 1.25rem;
  color: #64748b;
  border-top: 1px solid #e4edf6;
}

.state-empty {
  padding: 2rem 1.25rem;
  color: #475569;
}

.state-empty--soft {
  color: #64748b;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.46);
}

.modal-card {
  position: relative;
  width: min(100%, 460px);
  border-radius: 1.2rem;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.2);
  padding: 1.35rem 1.35rem 1.2rem;
  display: grid;
  gap: 1rem;
}

.modal-card--details {
  width: min(100%, 390px);
}

.modal-card--compact {
  width: min(100%, 420px);
}

.modal-close {
  position: absolute;
  top: 0.85rem;
  right: 0.9rem;
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}

.modal-eyebrow {
  margin: 0;
  color: #0f8ab3;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.modal-title {
  margin: 0;
  color: #1f2a44;
  font-size: 1.1rem;
  line-height: 1.35;
}

.modal-title--compact {
  padding-right: 1.5rem;
}

.modal-description {
  margin: -0.35rem 0 0;
  color: #64748b;
}

.detail-list,
.modal-form {
  display: grid;
  gap: 0.85rem;
}

.detail-item {
  display: grid;
  gap: 0.2rem;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 1px solid #dbe5f0;
  background: #f8fbff;
}

.detail-label {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
}

.modal-field {
  display: grid;
  gap: 0.45rem;
}

.modal-note {
  margin-top: 0.15rem;
}

.modal-textarea {
  width: 100%;
  padding: 0.8rem 0.9rem;
  border-radius: 1rem;
  border: 1px solid #b6ecff;
  background: #eefcff;
  color: var(--text);
  outline: none;
  resize: vertical;
  min-height: 6rem;
}

.modal-textarea:focus {
  border-color: rgba(14, 165, 233, 0.5);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.12);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.modal-action {
  width: auto;
  min-width: 110px;
}

.modal-action--success {
  background: #0f766e;
  color: #fff;
}

.modal-action--danger {
  background: #f97316;
  color: #fff;
}

@media (min-width: 900px) {
  .filters-grid {
    grid-template-columns: minmax(0, 1.4fr) minmax(200px, 0.65fr) minmax(200px, 0.65fr) auto;
    align-items: end;
  }

  .field-group--wide {
    grid-column: auto;
  }

  .clear-button {
    width: auto;
    min-width: 140px;
  }
}

@media (max-width: 640px) {
  .action-row,
  .modal-actions {
    flex-direction: column;
  }

  .modal-action,
  .action-button,
  .clear-button {
    width: 100%;
  }
}
</style>

<template>
  <div class="login-page">
    <header class="topbar">
      <div class="brand">
        <img :src="logo" alt="Logo HiAthos" class="brand-mark" />
        <div>
          <p class="brand-title">HiAthos</p>
          <p class="brand-subtitle">Tecsys</p>
        </div>
      </div>
      <img :src="logo" alt="Icone HiAthos" class="corner-icon" />
    </header>

    <main class="content">
      <section class="card">
        <div class="card-head">
          <p class="eyebrow">Autenticacao</p>
          <h1>Entrar na plataforma</h1>
          <p class="description">O acesso esta disponivel apenas para usuarios aprovados.</p>
        </div>

        <form class="form" @submit.prevent="handleSubmit">
          <div v-if="statusMessage" :class="['message', statusMessage.type]">
            {{ statusMessage.message }}
          </div>

          <div class="field">
            <label for="email">E-mail</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="seu.email@empresa.com"
              autocomplete="email"
            />
          </div>

          <div class="field">
            <label for="senha">Senha</label>
            <div class="password-wrap">
              <input
                id="senha"
                v-model="senha"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="Digite sua senha"
                autocomplete="current-password"
              />
              <button type="button" class="toggle-btn" @click="showPassword = !showPassword">
                {{ showPassword ? 'Ocultar' : 'Mostrar' }}
              </button>
            </div>
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>

          <div class="cta-box">
            <span>Ainda nao possui acesso?</span>
            <a href="#">Solicitar acesso</a>
          </div>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import logo from '../assets/logo.png';

type StatusType = 'pending' | 'rejected' | 'error';

type StatusMessage = {
  type: StatusType;
  message: string;
} | null;

type StoredUser = {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  status: 'PENDENTE' | 'ATIVO' | 'REJEITADO';
  role: 'USER' | 'ADMIN';
};

const router = useRouter();

const email = ref('');
const senha = ref('');
const showPassword = ref(false);
const loading = ref(false);
const statusMessage = ref<StatusMessage>(null);

function getUsers(): StoredUser[] {
  const usersData = localStorage.getItem('users');
  if (!usersData) {
    return [];
  }

  try {
    return JSON.parse(usersData) as StoredUser[];
  } catch {
    return [];
  }
}

function addLog(entry: {
  userId: string;
  userName: string;
  action: string;
  details?: string;
}) {
  const logsRaw = localStorage.getItem('logs');
  const logs = logsRaw ? JSON.parse(logsRaw) : [];

  logs.push({
    id: Date.now().toString(),
    userId: entry.userId,
    userName: entry.userName,
    action: entry.action,
    timestamp: new Date().toISOString(),
    details: entry.details,
  });

  localStorage.setItem('logs', JSON.stringify(logs));
}

async function handleSubmit() {
  loading.value = true;
  statusMessage.value = null;

  const users = getUsers();
  const user = users.find(currentUser => currentUser.email === email.value);

  if (user?.status === 'PENDENTE') {
    statusMessage.value = {
      type: 'pending',
      message: 'Seu cadastro esta pendente de aprovacao. Aguarde a analise do administrador.',
    };
    loading.value = false;
    return;
  }

  if (user?.status === 'REJEITADO') {
    statusMessage.value = {
      type: 'rejected',
      message: 'Seu acesso foi rejeitado. Entre em contato com o administrador para mais informacoes.',
    };
    loading.value = false;
    return;
  }

  const foundUser = users.find(
    currentUser => currentUser.email === email.value && currentUser.senhaHash === senha.value,
  );

  if (!foundUser || foundUser.status !== 'ATIVO') {
    addLog({
      userId: 'unknown',
      userName: email.value,
      action: 'Tentativa de login',
      details: 'Login falhou',
    });

    statusMessage.value = {
      type: 'error',
      message: 'Credenciais invalidas. Verifique seu e-mail e senha.',
    };
    loading.value = false;
    return;
  }

  localStorage.setItem('currentUser', JSON.stringify(foundUser));

  addLog({
    userId: foundUser.id,
    userName: foundUser.nome,
    action: 'Login realizado',
  });

  const preferredPath = foundUser.role === 'ADMIN' ? '/dashboard' : '/dashboard-ranking';
  const hasPreferredPath = router.getRoutes().some(route => route.path === preferredPath);

  await router.push(hasPreferredPath ? preferredPath : '/indicadores');

  loading.value = false;
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  color: #0f172a;
  background:
    radial-gradient(circle at 10% 10%, rgba(14, 165, 233, 0.1), transparent 25%),
    radial-gradient(circle at 90% 90%, rgba(16, 185, 129, 0.08), transparent 20%),
    linear-gradient(180deg, #f8fbff 0%, #eef4fb 45%, #e7eff8 100%);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
}

.brand-title {
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.brand-subtitle {
  margin: 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #0e7490;
}

.corner-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  object-fit: cover;
}

.content {
  display: grid;
  place-items: center;
  padding: 28px 16px;
}

.card {
  width: min(100%, 680px);
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.card-head {
  padding: 24px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.eyebrow {
  margin: 0 0 10px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #0e7490;
}

h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
}

.description {
  margin: 12px 0 0;
  color: #475569;
}

.form {
  display: grid;
  gap: 16px;
  padding: 20px;
}

.field {
  display: grid;
  gap: 8px;
}

.field label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.field input {
  height: 46px;
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 0 12px;
  font-size: 15px;
  background: #ffffff;
}

.field input:focus {
  outline: 2px solid rgba(14, 165, 233, 0.22);
  border-color: #0ea5e9;
}

.password-wrap {
  position: relative;
}

.password-wrap input {
  padding-right: 80px;
}

.toggle-btn {
  position: absolute;
  right: 6px;
  top: 6px;
  height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: #f1f5f9;
  color: #334155;
  cursor: pointer;
}

.submit-btn {
  border: 0;
  height: 46px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  cursor: pointer;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #0f766e 100%);
  box-shadow: 0 18px 40px rgba(14, 165, 233, 0.24);
}

.submit-btn:disabled {
  opacity: 0.78;
  cursor: wait;
}

.cta-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 14px;
  color: #475569;
}

.cta-box a {
  color: #0e7490;
  font-weight: 600;
}

.message {
  border: 1px solid;
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
}

.message.pending {
  border-color: #fcd34d;
  background: #fffbeb;
  color: #92400e;
}

.message.rejected,
.message.error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

@media (min-width: 768px) {
  .topbar {
    padding-left: 32px;
    padding-right: 32px;
  }

  .content {
    padding: 48px 20px;
  }

  .card-head,
  .form {
    padding-left: 28px;
    padding-right: 28px;
  }
}
</style>

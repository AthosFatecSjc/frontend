import type { LogEntry, LoginResult, StoredUser } from '../types/auth'

const STORAGE = {
  users: 'users',
  currentUser: 'currentUser',
  logs: 'logs',
} as const

function readUsers(): StoredUser[] {
  const raw = localStorage.getItem(STORAGE.users)
  if (!raw) {
    return []
  }

  try {
    return JSON.parse(raw) as StoredUser[]
  } catch {
    return []
  }
}

function readLogs(): LogEntry[] {
  const raw = localStorage.getItem(STORAGE.logs)
  if (!raw) {
    return []
  }

  try {
    return JSON.parse(raw) as LogEntry[]
  } catch {
    return []
  }
}

function appendLog(entry: LogEntry) {
  const logs = readLogs()
  logs.push(entry)
  localStorage.setItem(STORAGE.logs, JSON.stringify(logs))
}

function createAuthLog(entry: {
  actorRef: string
  evento: string
  resultado: string
  details?: string
}): LogEntry {
  return {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    categoria: 'AUTENTICACAO',
    evento: entry.evento,
    resultado: entry.resultado,
    origem: 'LOGIN',
    actorRef: entry.actorRef,
    modulo: 'authService',
    details: entry.details,
  }
}

export async function loginWithStorage(email: string, senha: string): Promise<LoginResult> {
  const users = readUsers()

  // Primeiro, valide as credenciais (e-mail + senha) para evitar expor status
  const user = users.find(currentUser => currentUser.email === email && currentUser.senhaHash === senha)

  if (!user) {
    appendLog(createAuthLog({
      actorRef: email,
      evento: 'LOGIN_ATTEMPT',
      resultado: 'FAIL',
      details: 'Login falhou',
    }))

    return {
      type: 'invalid',
      message: 'Credenciais inválidas. Verifique seu e-mail e senha.',
    }
  }

  // Após autenticar, trate o status do usuário autenticado
  if (user.status === 'PENDENTE') {
    return {
      type: 'pending',
      message: 'Seu cadastro está pendente de aprovação. Aguarde a análise do administrador.',
    }
  }

  if (user.status === 'REJEITADO') {
    return {
      type: 'rejected',
      message: 'Seu acesso foi rejeitado. Entre em contato com o administrador para mais informações.',
    }
  }

  if (user.status !== 'ATIVO') {
    appendLog(createAuthLog({
      actorRef: email,
      evento: 'LOGIN_ATTEMPT',
      resultado: 'FAIL',
      details: 'Login falhou',
    }))

    return {
      type: 'invalid',
      message: 'Credenciais inválidas. Verifique seu e-mail e senha.',
    }
  }

  localStorage.setItem(STORAGE.currentUser, JSON.stringify(user))

  appendLog(createAuthLog({
    actorRef: user.nome,
    evento: 'LOGIN_SUCCESS',
    resultado: 'SUCCESS',
  }))

  return {
    type: 'success',
    message: 'Login realizado com sucesso.',
    user,
    nextRoute: user.role === 'ADMIN' ? '/dashboard' : '/indicadores',
  }
}

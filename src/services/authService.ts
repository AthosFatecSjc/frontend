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

export async function loginWithStorage(email: string, senha: string): Promise<LoginResult> {
  const users = readUsers()
  const userByEmail = users.find(user => user.email === email)

  if (userByEmail?.status === 'PENDENTE') {
    return {
      type: 'pending',
      message: 'Seu cadastro esta pendente de aprovacao. Aguarde a analise do administrador.',
    }
  }

  if (userByEmail?.status === 'REJEITADO') {
    return {
      type: 'rejected',
      message: 'Seu acesso foi rejeitado. Entre em contato com o administrador para mais informacoes.',
    }
  }

  const user = users.find(currentUser => currentUser.email === email && currentUser.senhaHash === senha)

  if (!user || user.status !== 'ATIVO') {
    appendLog({
      id: Date.now().toString(),
      userId: 'unknown',
      userName: email,
      action: 'Tentativa de login',
      timestamp: new Date().toISOString(),
      details: 'Login falhou',
    })

    return {
      type: 'invalid',
      message: 'Credenciais invalidas. Verifique seu e-mail e senha.',
    }
  }

  localStorage.setItem(STORAGE.currentUser, JSON.stringify(user))

  appendLog({
    id: Date.now().toString(),
    userId: user.id,
    userName: user.nome,
    action: 'Login realizado',
    timestamp: new Date().toISOString(),
  })

  return {
    type: 'success',
    message: 'Login realizado com sucesso.',
    user,
    nextRoute: user.role === 'ADMIN' ? '/dashboard' : '/indicadores',
  }
}

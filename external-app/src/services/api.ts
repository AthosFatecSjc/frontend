export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

type BackendError = {
  status?: number
  code?: string
  erro?: string
  message?: string
  mensagem?: string
  error?: string
  severity?: string
  reason?: string | null
}

export async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    let errorBody: BackendError = {}

    try {
      errorBody = await response.json() as BackendError
    } catch {
      errorBody = {}
    }

    const error = new Error(errorBody.message ?? errorBody.mensagem ?? errorBody.error ?? fallbackMessage)
    Object.assign(error, {
      status: response.status,
      code: errorBody.code ?? errorBody.erro,
      reason: errorBody.reason,
    })
    throw error
  }

  return response.json() as Promise<T>
}

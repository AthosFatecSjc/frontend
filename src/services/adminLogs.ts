import type { AdminLogsFilters, AdminLogsPageResponse } from '@/types/adminLogs'

const API_URL = '/api/admin/logs'

function toLocalDateTime(value: string, endOfDay = false) {
  if (!value) return ''
  return `${value}T${endOfDay ? '23:59:59' : '00:00:00'}`
}

function buildQueryParams(page: number, size: number, filters: AdminLogsFilters) {
  const params = new URLSearchParams()
  params.append('page', String(page))
  params.append('size', String(size))

  if (filters.startDate && filters.endDate) {
    params.append('startDate', toLocalDateTime(filters.startDate))
    params.append('endDate', toLocalDateTime(filters.endDate, true))
  }

  if (filters.event) params.append('event', filters.event)
  if (filters.result) params.append('result', filters.result)

  return params
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Falha ao carregar os logs.'

    try {
      const errorBody = await response.json()
      message = errorBody.message ?? errorBody.error ?? message
    } catch {
      message = response.statusText || message
    }

    if (response.status === 401) {
      throw new Error('O backend exige um usuario autenticado para acessar os logs.')
    }

    if (response.status === 403) {
      throw new Error('Apenas administradores podem acessar os logs.')
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function fetchAdminLogs(page: number, size: number, filters: AdminLogsFilters) {
  const params = buildQueryParams(page, size, filters)
  const response = await fetch(`${API_URL}?${params.toString()}`, {
    credentials: 'include',
  })

  return parseResponse<AdminLogsPageResponse>(response)
}

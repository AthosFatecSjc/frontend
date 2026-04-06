import type { AdminLogsFilters, AdminLogsPageResponse } from '@/types/adminLogs'
import { API_BASE_URL, createProtectedJsonRequest, parseApiResponse } from './api'

const API_URL = `${API_BASE_URL}/admin/logs`

function createEmptyPageResponse(page: number, size: number): AdminLogsPageResponse {
  return {
    content: [],
    page,
    size,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  }
}

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

export async function fetchAdminLogs(page: number, size: number, filters: AdminLogsFilters) {
  const params = buildQueryParams(page, size, filters)
  const response = await fetch(
    `${API_URL}?${params.toString()}`,
    createProtectedJsonRequest(),
  )

  if (response.status === 204 || response.status === 404) {
    return createEmptyPageResponse(page, size)
  }

  const contentLength = response.headers.get('content-length')
  if (response.ok && (contentLength === '0' || response.statusText === 'No Content')) {
    return createEmptyPageResponse(page, size)
  }

  if (response.status === 500) {
    let message = ''

    try {
      const clonedResponse = response.clone()
      const errorBody = await clonedResponse.json()
      message = String(errorBody.message ?? errorBody.error ?? '').trim()
    } catch {
      try {
        const clonedResponse = response.clone()
        message = (await clonedResponse.text()).trim()
      } catch {
        message = ''
      }
    }

    if (!message || message === 'Internal Server Error') {
      return createEmptyPageResponse(page, size)
    }
  }

  return parseApiResponse<AdminLogsPageResponse>(response, 'Falha ao carregar os logs.')
}

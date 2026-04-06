export interface AdminLogResponse {
  id: number
  timestamp: string
  actorRef?: string
  sourceType: string
  event: string
  result: string
  description?: string
  metadata?: string
  createdByModule?: string
}

export interface AdminLogsPageResponse {
  content: AdminLogResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface AdminLogsFilters {
  startDate?: string
  endDate?: string
  event?: string
  result?: string
}

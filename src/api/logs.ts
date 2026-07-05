import api from './index'

export interface LogQueryParams {
  page?: number
  limit?: number
  level?: string
  source?: string
  module?: string
  userId?: string
  search?: string
  startDate?: string
  endDate?: string
  resolved?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface LogEntry {
  id: string
  level: string
  source: string
  message: string
  stackTrace: string | null
  context: Record<string, any> | null
  module: string | null
  userId: string | null
  correlationId: string | null
  url: string | null
  method: string | null
  statusCode: number | null
  ip: string | null
  userAgent: string | null
  tags: string[] | null
  environment: string
  appVersion: string | null
  resolved: boolean
  resolvedBy: string | null
  resolvedAt: string | null
  resolvedNote: string | null
  occurrenceCount: number
  lastOccurrenceAt: string | null
  createdAt: string
  updatedAt: string
}

export interface LogStats {
  total: number
  byLevel: Record<string, number>
  bySource: Record<string, number>
  byModule: Record<string, number>
  byDate: Record<string, number>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const logsApi = {
  getLogs: (params?: LogQueryParams) =>
    api.get<PaginatedResponse<LogEntry>>('/admin/logs', { params }),

  getLogById: (id: string) =>
    api.get<LogEntry>(`/admin/logs/${id}`),

  getStats: (params?: LogQueryParams) =>
    api.get<LogStats>('/admin/logs/stats', { params }),

  resolveLog: (id: string, note?: string) =>
    api.put(`/admin/logs/${id}/resolve`, { note }),

  bulkResolve: (ids: string[], note?: string) =>
    api.put('/admin/logs/bulk-resolve', { ids, note }),

  purgeLogs: () =>
    api.post<{ purged: number }>('/admin/logs/purge'),

  exportLogs: (params?: LogQueryParams) =>
    api.get('/admin/logs/export', { params, responseType: 'blob' }),
}

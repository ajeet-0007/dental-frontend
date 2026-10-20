import api from './index'

export interface CreatePageVisitPayload {
  path: string
  pageTitle?: string
  referrer?: string
}

export interface PageVisit {
  id: string
  visitorId: string
  userId: string | null
  path: string
  pageTitle: string | null
  referrer: string | null
  ip: string | null
  userAgent: string | null
  deviceType: 'desktop' | 'mobile' | 'tablet'
  createdAt: string
  user: { id: string; email: string; firstName: string; lastName: string } | null
}

export interface PageVisitQueryParams {
  page?: number
  limit?: number
  search?: string
  visitorId?: string
  userId?: string
  device?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface VisitorSummary {
  visitorId: string
  visitCount: number
  lastSeen: string
  firstSeen: string
  userId: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
}

export interface VisitorJourney {
  visitorId: string
  visitCount: number
  firstSeen: string
  lastSeen: string
  user: { id: string; email: string; firstName: string; lastName: string } | null
  visits: PageVisit[]
}

export interface PageVisitStats {
  visitsToday: number
  visits7d: number
  visits30d: number
  uniqueVisitors7d: number
  uniqueVisitors30d: number
  topPages: { path: string; visits: number; visitors: number }[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const pageVisitsApi = {
  record: (payload: CreatePageVisitPayload) =>
    api.post('/page-visits', payload),

  getVisits: (params?: PageVisitQueryParams) =>
    api.get<PaginatedResponse<PageVisit>>('/page-visits', { params }),

  getStats: () => api.get<PageVisitStats>('/page-visits/stats'),

  getVisitors: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<VisitorSummary>>('/page-visits/visitors', { params }),

  getVisitorJourney: (visitorId: string) =>
    api.get<VisitorJourney>(`/page-visits/visitor/${visitorId}`),

  purge: (olderThan: string) =>
    api.delete<{ deleted: number }>('/page-visits/purge', { params: { olderThan } }),
}

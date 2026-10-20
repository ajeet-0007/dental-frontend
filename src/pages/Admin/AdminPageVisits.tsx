import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, Filter, RefreshCw, Users, Eye, Monitor,
  Smartphone, Tablet, ChevronDown, ChevronUp, ExternalLink, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  pageVisitsApi,
  PageVisit,
  PageVisitStats,
  VisitorSummary,
} from '../../api/pageVisits'

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: 'bg-blue-50 text-blue-600',
  mobile: 'bg-purple-50 text-purple-600',
  tablet: 'bg-amber-50 text-amber-600',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function StatsCard({ stats, isLoading }: { stats: PageVisitStats | undefined; isLoading: boolean }) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse h-24" />
        ))}
      </div>
    )
  }

  const cards = [
    { label: 'Visits Today', value: stats.visitsToday, color: 'text-primary-600' },
    { label: 'Visits (7d)', value: stats.visits7d, color: 'text-gray-900' },
    { label: 'Visits (30d)', value: stats.visits30d, color: 'text-gray-900' },
    { label: 'Visitors (7d)', value: stats.uniqueVisitors7d, color: 'text-blue-600' },
    { label: 'Visitors (30d)', value: stats.uniqueVisitors30d, color: 'text-blue-600' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}

function Pagination({
  pagination,
  onPage,
}: {
  pagination: { page: number; limit: number; total: number; totalPages: number }
  onPage: (page: number) => void
}) {
  if (pagination.totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
        {pagination.total.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
          const start = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4))
          const page = start + i
          if (page > pagination.totalPages) return null
          return (
            <button
              key={page}
              onClick={() => onPage(page)}
              className={`px-3 py-1 text-sm border rounded ${
                page === pagination.page
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          )
        })}
        <button
          onClick={() => onPage(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default function AdminPageVisits() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [tab, setTab] = useState<'visits' | 'visitors'>(searchParams.get('tab') === 'visitors' ? 'visitors' : 'visits')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [device, setDevice] = useState(searchParams.get('device') || '')
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [showFilters, setShowFilters] = useState(false)

  const syncUrl = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v)
      else next.delete(k)
    })
    setSearchParams(next, { replace: true })
  }

  const selectTab = (t: 'visits' | 'visitors') => {
    setTab(t)
    setPage(1)
    syncUrl({ tab: t === 'visitors' ? 'visitors' : '', page: '' })
  }

  const onSearch = (value: string) => {
    setSearch(value)
    setPage(1)
    syncUrl({ search: value, page: '' })
  }

  const onPage = (p: number) => {
    setPage(p)
    syncUrl({ page: p > 1 ? String(p) : '' })
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-page-visits', { search, device, startDate, endDate, page }],
    queryFn: () =>
      pageVisitsApi.getVisits({
        page,
        limit: 50,
        search: search || undefined,
        device: device || undefined,
        startDate: startDate || undefined,
        endDate: endDate ? `${endDate}T23:59:59` : undefined,
      }),
    refetchInterval: tab === 'visits' ? 15000 : false,
  })

  const { data: visitorsData, isLoading: visitorsLoading } = useQuery({
    queryKey: ['admin-page-visitors', { search, page }],
    queryFn: () =>
      pageVisitsApi.getVisitors({ page, limit: 50, search: search || undefined }),
    enabled: tab === 'visitors',
  })

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-page-visits-stats'],
    queryFn: () => pageVisitsApi.getStats(),
    refetchInterval: 30000,
  })

  const purgeMutation = useMutation({
    mutationFn: () => {
      const d = new Date()
      d.setDate(d.getDate() - 90)
      if (!window.confirm(`Delete all visits older than ${d.toISOString().slice(0, 10)}?`)) {
        return Promise.reject(new Error('cancelled'))
      }
      return pageVisitsApi.purge(d.toISOString())
    },
    onSuccess: (res) => {
      toast.success(`Deleted ${res.data.deleted} visits`)
      queryClient.invalidateQueries({ queryKey: ['admin-page-visits'] })
      queryClient.invalidateQueries({ queryKey: ['admin-page-visits-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-page-visitors'] })
    },
    onError: (e: any) => {
      if (e?.message !== 'cancelled') toast.error('Failed to purge visits')
    },
  })

  const visits: PageVisit[] = data?.data?.data || []
  const visitors: VisitorSummary[] = visitorsData?.data?.data || []
  const pagination = data?.data
  const visitorPagination = visitorsData?.data

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Page Visits</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track which pages users visit, and individual visitor journeys
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => purgeMutation.mutate()}
            disabled={purgeMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            Purge 90d+
          </button>
          <button
            onClick={() => {
              refetch()
              queryClient.invalidateQueries({ queryKey: ['admin-page-visits-stats'] })
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <StatsCard stats={statsData?.data} isLoading={statsLoading} />

      {statsData?.data?.topPages?.length ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Top pages (7 days)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {statsData.data.topPages.map((p) => (
              <div key={p.path} className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-gray-50">
                <span className="text-gray-800 truncate mr-3 font-mono text-xs">{p.path}</span>
                <span className="text-gray-500 whitespace-nowrap">
                  {Number(p.visits).toLocaleString()} visits · {Number(p.visitors).toLocaleString()} visitors
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-100 flex">
          <button
            onClick={() => selectTab('visits')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'visits'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            Visits
          </button>
          <button
            onClick={() => selectTab('visitors')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'visitors'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Visitors
          </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={tab === 'visits' ? 'Search by page path or title...' : 'Search by visitor id or user email...'}
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {tab === 'visits' && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  showFilters
                    ? 'bg-primary-50 text-primary-700 border-primary-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {showFilters && tab === 'visits' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
              <select
                value={device}
                onChange={(e) => {
                  setDevice(e.target.value)
                  setPage(1)
                  syncUrl({ device: e.target.value, page: '' })
                }}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Devices</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPage(1)
                  syncUrl({ startDate: e.target.value, page: '' })
                }}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPage(1)
                  syncUrl({ endDate: e.target.value, page: '' })
                }}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {tab === 'visits' ? (
            isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading visits...</div>
            ) : visits.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No visits found</p>
                <p className="text-sm mt-1">Visits appear here as users browse the storefront</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-28">Time</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Page</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-52">Visitor</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-24">Device</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-40">Referrer</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-32">IP</th>
                    <th className="w-12 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((visit) => {
                    const DeviceIcon = DEVICE_ICONS[visit.deviceType] || Monitor
                    return (
                      <tr key={visit.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap" title={new Date(visit.createdAt).toLocaleString()}>
                          {timeAgo(visit.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <a
                              href={visit.path}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-gray-900 hover:text-primary-600 font-mono truncate max-w-md"
                            >
                              {visit.path}
                            </a>
                            {visit.pageTitle && (
                              <span className="text-xs text-gray-400 truncate max-w-md">{visit.pageTitle}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {visit.user ? (
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-900 truncate">
                                {visit.user.firstName} {visit.user.lastName}
                              </span>
                              <span className="text-xs text-gray-400 truncate">{visit.user.email}</span>
                            </div>
                          ) : (
                            <Link
                              to={`/admin/page-visits/visitor/${visit.visitorId}`}
                              className="text-xs font-mono text-gray-500 hover:text-primary-600"
                              title={visit.visitorId}
                            >
                              anon_{visit.visitorId.slice(0, 8)}
                            </Link>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${DEVICE_COLORS[visit.deviceType] || ''}`}>
                            <DeviceIcon className="w-3 h-3" />
                            {visit.deviceType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[10rem]" title={visit.referrer || ''}>
                          {visit.referrer ? (() => {
                            try { return new URL(visit.referrer).hostname } catch { return visit.referrer }
                          })() : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{visit.ip || '—'}</td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/admin/page-visits/visitor/${visit.visitorId}`}
                            className="text-gray-400 hover:text-primary-600"
                            title="View visitor journey"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          ) : visitorsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading visitors...</div>
          ) : visitors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No visitors found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-44">Visitor</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">User</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-24">Visits</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-32">First Seen</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-32">Last Seen</th>
                  <th className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v.visitorId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/page-visits/visitor/${v.visitorId}`}
                        className="text-xs font-mono text-primary-600 hover:underline"
                        title={v.visitorId}
                      >
                        {v.visitorId.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {v.email ? (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">{v.firstName} {v.lastName}</span>
                          <span className="text-xs text-gray-400">{v.email}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Anonymous</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-700 bg-gray-100 rounded-full px-2 py-0.5">
                        {v.visitCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap" title={new Date(v.firstSeen).toLocaleString()}>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(v.firstSeen)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap" title={new Date(v.lastSeen).toLocaleString()}>
                      {timeAgo(v.lastSeen)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/page-visits/visitor/${v.visitorId}`}
                        className="text-gray-400 hover:text-primary-600"
                        title="View journey"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {tab === 'visits' && pagination && (
          <Pagination
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              totalPages: pagination.totalPages,
            }}
            onPage={onPage}
          />
        )}
        {tab === 'visitors' && visitorPagination && (
          <Pagination
            pagination={{
              page: visitorPagination.page,
              limit: visitorPagination.limit,
              total: visitorPagination.total,
              totalPages: visitorPagination.totalPages,
            }}
            onPage={onPage}
          />
        )}
      </div>
    </div>
  )
}

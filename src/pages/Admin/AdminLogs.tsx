import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  AlertTriangle, AlertCircle, Info, Bug, 
  Search, Filter, Download, CheckCircle, 
  XCircle, ChevronDown, ChevronUp, RefreshCw,
  Trash2, ExternalLink
} from 'lucide-react'
import { logsApi, LogEntry, LogStats } from '../../api/logs'

const LEVEL_ICONS: Record<string, typeof AlertTriangle> = {
  fatal: AlertTriangle,
  error: AlertCircle,
  warn: AlertTriangle,
  info: Info,
  debug: Bug,
}

const LEVEL_COLORS: Record<string, string> = {
  fatal: 'bg-red-100 text-red-800 border-red-200',
  error: 'bg-red-50 text-red-700 border-red-100',
  warn: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  info: 'bg-blue-50 text-blue-700 border-blue-100',
  debug: 'bg-gray-50 text-gray-600 border-gray-100',
}

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  backend: { label: 'BE', color: 'bg-purple-100 text-purple-700' },
  frontend: { label: 'FE', color: 'bg-cyan-100 text-cyan-700' },
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

function StatsCard({ stats, isLoading }: { stats: LogStats | undefined; isLoading: boolean }) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse h-24" />
        ))}
      </div>
    )
  }

  const cards = [
    { label: 'Total Errors', value: stats.total, color: 'text-gray-900' },
    { label: 'Errors', value: (stats.byLevel?.error || 0) + (stats.byLevel?.fatal || 0), color: 'text-red-600' },
    { label: 'Warnings', value: stats.byLevel?.warn || 0, color: 'text-yellow-600' },
    { label: 'Frontend', value: stats.bySource?.frontend || 0, color: 'text-cyan-600' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>
            {card.value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}

export default function AdminLogs() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [filters, setFilters] = useState({
    page: parseInt(searchParams.get('page') || '1'),
    limit: 50,
    level: searchParams.get('level') || '',
    source: searchParams.get('source') || '',
    module: searchParams.get('module') || '',
    search: searchParams.get('search') || '',
    resolved: searchParams.get('resolved') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [resolveNote, setResolveNote] = useState('')

  const queryParams = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== '')
  )

  const { data, isLoading } = useQuery({
    queryKey: ['admin-logs', queryParams],
    queryFn: () => logsApi.getLogs(queryParams),
  })

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-logs-stats', { startDate: filters.startDate, endDate: filters.endDate }],
    queryFn: () => logsApi.getStats({ startDate: filters.startDate, endDate: filters.endDate }),
    refetchInterval: 30000,
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      logsApi.resolveLog(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] })
      queryClient.invalidateQueries({ queryKey: ['admin-logs-stats'] })
    },
  })

  const bulkResolveMutation = useMutation({
    mutationFn: ({ ids, note }: { ids: string[]; note?: string }) =>
      logsApi.bulkResolve(ids, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] })
      queryClient.invalidateQueries({ queryKey: ['admin-logs-stats'] })
      setSelectedIds(new Set())
    },
  })

  const purgeMutation = useMutation({
    mutationFn: () => logsApi.purgeLogs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] })
      queryClient.invalidateQueries({ queryKey: ['admin-logs-stats'] })
    },
  })

  const exportMutation = useMutation({
    mutationFn: () => logsApi.exportLogs(queryParams),
    onSuccess: (response) => {
      const blob = new Blob([response.data as any], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    },
  })

  const updateFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? parseInt(value) : 1 }))
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    setSearchParams(params)
  }, [setSearchParams, searchParams])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!data?.data?.data) return
    if (selectedIds.size === data.data.data.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(data.data.data.map(l => l.id)))
    }
  }

  const logs = data?.data?.data || []
  const pagination = data?.data ? { total: data.data.total, page: data.data.page, limit: data.data.limit, totalPages: data.data.totalPages } : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Error Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Centralized error tracking for backend & frontend
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportMutation.mutate()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => purgeMutation.mutate()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Purge Old
          </button>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-logs'] })}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <StatsCard stats={statsData?.data} isLoading={statsLoading} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs by message, module, or stack trace..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
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
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 pt-3 border-t border-gray-100">
              <select
                value={filters.level}
                onChange={(e) => updateFilter('level', e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Levels</option>
                <option value="fatal">Fatal</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>

              <select
                value={filters.source}
                onChange={(e) => updateFilter('source', e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Sources</option>
                <option value="backend">Backend</option>
                <option value="frontend">Frontend</option>
              </select>

              <select
                value={filters.resolved}
                onChange={(e) => updateFilter('resolved', e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Status</option>
                <option value="false">Unresolved</option>
                <option value="true">Resolved</option>
              </select>

              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilter('startDate', e.target.value)}
                placeholder="Start date"
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              />

              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilter('endDate', e.target.value)}
                placeholder="End date"
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="px-4 py-2 bg-primary-50 border-b border-primary-100 flex items-center gap-3">
            <span className="text-sm text-primary-700 font-medium">
              {selectedIds.size} selected
            </span>
            <input
              type="text"
              placeholder="Resolution note (optional)..."
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              className="flex-1 text-sm border border-primary-200 rounded px-2 py-1"
            />
            <button
              onClick={() => bulkResolveMutation.mutate({ ids: Array.from(selectedIds), note: resolveNote || undefined })}
              className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
            >
              Resolve All
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
              <p className="font-medium">No errors found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={logs.length > 0 && selectedIds.size === logs.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-20">Level</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-16">Src</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Message</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-28">Module</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-20">Code</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-24">Count</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-20">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 w-28">Time</th>
                  <th className="w-16 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: LogEntry) => {
                  const LevelIcon = LEVEL_ICONS[log.level] || AlertCircle
                  const sourceBadge = SOURCE_BADGES[log.source] || SOURCE_BADGES.backend
                  
                  return (
                    <tr 
                      key={log.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        !log.resolved && log.level === 'error' ? 'bg-red-50/30' : ''
                      } ${!log.resolved && log.level === 'fatal' ? 'bg-red-100/50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(log.id)}
                          onChange={() => toggleSelect(log.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${LEVEL_COLORS[log.level] || LEVEL_COLORS.info}`}>
                          <LevelIcon className="w-3 h-3" />
                          {log.level}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${sourceBadge.color}`}>
                          {sourceBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link 
                          to={`/admin/logs/${log.id}`}
                          className="text-sm text-gray-900 hover:text-primary-600 block max-w-md truncate"
                          title={log.message}
                        >
                          {log.message}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{log.module || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {log.statusCode ? (
                          <span className={`text-xs font-mono ${
                            log.statusCode >= 500 ? 'text-red-600' : 
                            log.statusCode >= 400 ? 'text-yellow-600' : 
                            'text-gray-500'
                          }`}>
                            {log.statusCode}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.occurrenceCount > 1 ? (
                          <span className="text-xs font-medium text-gray-700 bg-gray-100 rounded-full px-2 py-0.5">
                            ×{log.occurrenceCount}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.resolved ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Resolved
                          </span>
                        ) : (
                          <button
                            onClick={() => resolveMutation.mutate({ id: log.id })}
                            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary-600"
                          >
                            <XCircle className="w-3 h-3" />
                            Resolve
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {timeAgo(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/logs/${log.id}`}
                          className="text-gray-400 hover:text-primary-600"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total.toLocaleString()} logs
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateFilter('page', String(pagination.page - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const start = Math.max(1, pagination.page - 2)
                const page = start + i
                if (page > pagination.totalPages) return null
                return (
                  <button
                    key={page}
                    onClick={() => updateFilter('page', String(page))}
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
                onClick={() => updateFilter('page', String(pagination.page + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

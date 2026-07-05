import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, AlertTriangle, AlertCircle, Info, Bug,
  CheckCircle, Clock, Globe, Server, User,
  Hash, Link as LinkIcon, Tag, ChevronDown, ChevronRight,
  FileText, Copy, Check
} from 'lucide-react'
import { useState } from 'react'
import { logsApi } from '../../api/logs'

const LEVEL_CONFIG: Record<string, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  fatal: { icon: AlertTriangle, color: 'text-red-800', bg: 'bg-red-100' },
  error: { icon: AlertCircle, color: 'text-red-700', bg: 'bg-red-50' },
  warn: { icon: AlertTriangle, color: 'text-yellow-700', bg: 'bg-yellow-50' },
  info: { icon: Info, color: 'text-blue-700', bg: 'bg-blue-50' },
  debug: { icon: Bug, color: 'text-gray-700', bg: 'bg-gray-50' },
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string | null; icon?: typeof User }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 font-mono break-all">{value || '-'}</p>
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600 ml-2 shrink-0">
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}

function JsonViewer({ data, label }: { data: any; label: string }) {
  const [expanded, setExpanded] = useState(true)
  const text = data ? JSON.stringify(data, null, 2) : 'null'

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {label}
      </button>
      {expanded && (
        <pre className="p-4 text-xs font-mono text-gray-700 overflow-auto max-h-96 bg-white">
          {text}
        </pre>
      )}
    </div>
  )
}

export default function AdminLogDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [resolveNote, setResolveNote] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-log', id],
    queryFn: () => logsApi.getLogById(id!),
    enabled: !!id,
  })

  const resolveMutation = useMutation({
    mutationFn: ({ note }: { note?: string }) => logsApi.resolveLog(id!, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-log', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] })
    },
  })

  const log = data?.data

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    )
  }

  if (error || !log) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Log not found</p>
        <Link to="/admin/logs" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to logs
        </Link>
      </div>
    )
  }

  const levelConfig = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.info
  const LevelIcon = levelConfig.icon

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/admin/logs"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Log Detail</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-lg ${levelConfig.bg}`}>
                <LevelIcon className={`w-6 h-6 ${levelConfig.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${levelConfig.bg} ${levelConfig.color}`}>
                    {log.level}
                  </span>
                  <span className="text-xs text-gray-500">
                    {log.source === 'backend' ? 'Backend' : 'Frontend'}
                  </span>
                  {log.statusCode && (
                    <span className="text-xs font-mono text-gray-500">
                      HTTP {log.statusCode}
                    </span>
                  )}
                  {log.occurrenceCount > 1 && (
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                      Occurred {log.occurrenceCount} times
                    </span>
                  )}
                </div>
                <p className="text-lg font-medium text-gray-900 break-words">
                  {log.message}
                </p>
              </div>
            </div>

            {!log.resolved && (
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <input
                  type="text"
                  placeholder="Resolution note (optional)..."
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
                <button
                  onClick={() => resolveMutation.mutate({ note: resolveNote || undefined })}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Resolved
                </button>
              </div>
            )}

            {log.resolved && (
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Resolved by {log.resolvedBy || 'admin'}</span>
                {log.resolvedAt && (
                  <span className="text-gray-500">
                    on {new Date(log.resolvedAt).toLocaleString()}
                  </span>
                )}
                {log.resolvedNote && (
                  <span className="text-gray-500">— {log.resolvedNote}</span>
                )}
              </div>
            )}
          </div>

          {log.stackTrace && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Stack Trace</span>
                <CopyButton text={log.stackTrace} />
              </div>
              <pre className="p-4 text-xs font-mono text-gray-700 overflow-auto max-h-96 leading-relaxed">
                {log.stackTrace}
              </pre>
            </div>
          )}

          {log.context && Object.keys(log.context).length > 0 && (
            <JsonViewer data={log.context} label="Context Data" />
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Details
            </h3>
            <div className="divide-y divide-gray-100">
              <InfoRow label="Log ID" value={log.id} icon={Hash} />
              <InfoRow label="Correlation ID" value={log.correlationId} icon={LinkIcon} />
              <InfoRow label="Module" value={log.module} icon={Server} />
              <InfoRow label="Environment" value={log.environment} icon={Globe} />
              <InfoRow label="App Version" value={log.appVersion} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Request Info
            </h3>
            <div className="divide-y divide-gray-100">
              <InfoRow label="URL" value={log.url} />
              <InfoRow label="Method" value={log.method} />
              <InfoRow label="Status Code" value={log.statusCode?.toString() || null} />
              <InfoRow label="IP Address" value={log.ip} />
              <InfoRow label="User Agent" value={log.userAgent} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              User
            </h3>
            <div className="divide-y divide-gray-100">
              <InfoRow label="User ID" value={log.userId} icon={User} />
            </div>
          </div>

          {log.tags && log.tags.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {log.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              {log.lastOccurrenceAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Last Occurrence</span>
                  <span className="text-gray-900">
                    {new Date(log.lastOccurrenceAt).toLocaleString()}
                  </span>
                </div>
              )}
              {log.resolvedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Resolved</span>
                  <span className="text-gray-900">
                    {new Date(log.resolvedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

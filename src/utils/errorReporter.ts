import api from '../api'

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface ErrorReport {
  level: LogLevel
  message: string
  stackTrace?: string
  context?: Record<string, any>
  url?: string
  userId?: string
  userAgent?: string
  tags?: string[]
}

interface QueuedReport extends ErrorReport {
  timestamp: number
  retryCount: number
}

class ErrorReporter {
  private queue: QueuedReport[] = []
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private flushInterval = 5000
  private batchSize = 10
  private rateLimitCount = 0
  private rateLimitReset = Date.now()
  private maxRatePerMinute = 20
  private dedupWindow = 60000
  private recentErrors = new Map<string, number>()
  private isSending = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupGlobalHandlers()
      this.setupOfflineHandlers()
      this.flushTimer = setInterval(() => this.flush(), this.flushInterval)

      window.addEventListener('beforeunload', () => this.flushSync())
    }
  }

  private setupGlobalHandlers(): void {
    window.onerror = (message, source, lineno, colno, error) => {
      this.captureError({
        level: 'error',
        message: typeof message === 'string' ? message : 'Unhandled error',
        stackTrace: error?.stack,
        context: { source, lineno, colno },
        tags: ['unhandled'],
      })
      return false
    }

    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      this.captureError({
        level: 'error',
        message: reason?.message || 'Unhandled Promise rejection',
        stackTrace: reason?.stack,
        context: { reason: String(reason) },
        tags: ['unhandled_rejection'],
      })
    }
  }

  private setupOfflineHandlers(): void {
    window.addEventListener('online', () => {
      this.flush()
    })
  }

  private getStorageKey(): string {
    return 'dk_error_queue'
  }

  private persistQueue(): void {
    try {
      const data = this.queue.map(({ timestamp, retryCount, ...rest }) => ({
        ...rest,
        _ts: timestamp,
        _retry: retryCount,
      }))
      localStorage.setItem(this.getStorageKey(), JSON.stringify(data))
    } catch {
      // localStorage full - clear oldest entries
      try {
        const existing = localStorage.getItem(this.getStorageKey())
        if (existing) {
          const parsed = JSON.parse(existing)
          parsed.splice(0, Math.ceil(parsed.length / 2))
          localStorage.setItem(this.getStorageKey(), JSON.stringify(parsed))
        }
      } catch {
        localStorage.removeItem(this.getStorageKey())
      }
    }
  }

  restoreQueue(): void {
    try {
      const stored = localStorage.getItem(this.getStorageKey())
      if (stored) {
        const parsed = JSON.parse(stored)
        this.queue = parsed.map((item: any) => ({
          level: item.level,
          message: item.message,
          stackTrace: item.stackTrace,
          context: item.context,
          url: item.url,
          userId: item.userId,
          userAgent: item.userAgent,
          tags: item.tags,
          timestamp: item._ts || Date.now(),
          retryCount: item._retry || 0,
        }))
        localStorage.removeItem(this.getStorageKey())
      }
    } catch {
      localStorage.removeItem(this.getStorageKey())
    }
  }

  private isDuplicate(report: ErrorReport): boolean {
    const key = `${report.level}:${report.message}:${report.tags?.join(',') || ''}`
    const now = Date.now()
    const lastSeen = this.recentErrors.get(key)

    if (lastSeen && now - lastSeen < this.dedupWindow) {
      return true
    }

    this.recentErrors.set(key, now)
    if (this.recentErrors.size > 100) {
      const oldest = this.recentErrors.keys().next().value
      if (oldest) this.recentErrors.delete(oldest)
    }
    return false
  }

  private checkRateLimit(): boolean {
    const now = Date.now()
    if (now - this.rateLimitReset > 60000) {
      this.rateLimitCount = 0
      this.rateLimitReset = now
    }
    this.rateLimitCount++
    return this.rateLimitCount <= this.maxRatePerMinute
  }

  captureError(report: ErrorReport): void {
    if (!navigator.onLine) {
      this.queue.push({ ...report, timestamp: Date.now(), retryCount: 0 })
      this.persistQueue()
      return
    }

    if (this.isDuplicate(report)) return
    if (!this.checkRateLimit()) return

    this.queue.push({ ...report, timestamp: Date.now(), retryCount: 0 })

    if (this.queue.length >= this.batchSize) {
      this.flush()
    }
  }

  captureException(error: Error, context?: Record<string, any>): void {
    this.captureError({
      level: 'error',
      message: error.message || 'Unknown error',
      stackTrace: error.stack,
      context,
    })
  }

  captureApiError(error: any, context?: Record<string, any>): void {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'API request failed'

    const statusCode = error?.response?.status
    const url = error?.config?.url
    const method = error?.config?.method

    this.captureError({
      level: statusCode >= 500 ? 'error' : 'warn',
      message: `[${method?.toUpperCase()}] ${url} - ${statusCode} - ${message}`,
      stackTrace: error?.stack,
      context: {
        ...context,
        statusCode,
        url,
        method,
        responseData: error?.response?.data
          ? JSON.parse(JSON.stringify(error?.response?.data)).message || undefined
          : undefined,
      },
      tags: ['api_error', statusCode >= 500 ? 'server_error' : 'client_error'],
    })
  }

  captureReactError(error: Error, errorInfo: React.ErrorInfo): void {
    this.captureError({
      level: 'error',
      message: `React Error Boundary: ${error.message}`,
      stackTrace: error.stack,
      context: {
        componentStack: errorInfo.componentStack,
      },
      tags: ['react_error_boundary'],
    })
  }

  private async flush(): Promise<void> {
    if (this.isSending || this.queue.length === 0 || !navigator.onLine) return

    this.isSending = true
    const batch = this.queue.splice(0, this.batchSize)

    try {
      const payload = batch.map(({ timestamp, retryCount, ...report }) => ({
        ...report,
        userAgent: report.userAgent || navigator.userAgent,
        url: report.url || window.location.href,
      }))

      await api.post('/logs/client/batch', { logs: payload })
      this.persistQueue()
    } catch (err) {
      batch.forEach((item) => {
        item.retryCount++
        if (item.retryCount < 5) {
          const backoff = Math.min(1000 * Math.pow(2, item.retryCount), 30000)
          setTimeout(() => {
            this.queue.push(item)
          }, backoff)
        }
      })
      this.persistQueue()
    } finally {
      this.isSending = false
    }
  }

  private flushSync(): void {
    if (this.queue.length === 0) return

    if (navigator.onLine) {
      const payload = this.queue.map(({ timestamp, retryCount, ...report }) => ({
        ...report,
        userAgent: report.userAgent || navigator.userAgent,
      }))

      navigator.sendBeacon(
        `${import.meta.env.VITE_API_URL}/api/logs/client/batch`,
        JSON.stringify({ logs: payload }),
      )
    } else {
      this.persistQueue()
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    window.onerror = null
    window.onunhandledrejection = null
  }
}

export const errorReporter = new ErrorReporter()

export function initErrorReporter(): void {
  errorReporter.restoreQueue()
}

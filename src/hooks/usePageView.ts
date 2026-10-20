import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { pageVisitsApi } from '../api/pageVisits'

const SKIP_PREFIXES = ['/admin', '/login', '/register', '/forgot-password', '/auth']

export default function usePageView() {
  const location = useLocation()
  const lastTracked = useRef<string | null>(null)

  useEffect(() => {
    const path = location.pathname + location.search
    if (lastTracked.current === path) return
    if (SKIP_PREFIXES.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'))) {
      return
    }
    // Skip the prerender browser (Playwright reports navigator.webdriver).
    if (typeof navigator !== 'undefined' && navigator.webdriver) return

    lastTracked.current = path
    pageVisitsApi
      .record({
        path: location.pathname + location.search,
        pageTitle: document.title || undefined,
        referrer: document.referrer || undefined,
      })
      .catch(() => {})
  }, [location.pathname, location.search])
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import { hydrate, type DehydratedState } from '@tanstack/react-query'
import App from './App'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'
import ErrorBoundary from './components/ErrorBoundary'
import { initErrorReporter } from './utils/errorReporter'
import api from './api'
import { queryClient } from './queryClient'
import { errorReporter } from './utils/errorReporter'

initErrorReporter()

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status !== 401) {
      errorReporter.captureApiError(error)
    }
    return Promise.reject(error)
  }
)

if (typeof window !== 'undefined' && window.__DENTZOO_DEHYDRATED__) {
  hydrate(queryClient, window.__DENTZOO_DEHYDRATED__ as DehydratedState)
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const container = document.getElementById('root')!

const app = (
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </GoogleOAuthProvider>
  </React.StrictMode>
)

if (container.hasChildNodes()) {
  ReactDOM.hydrateRoot(container, app)
} else {
  ReactDOM.createRoot(container).render(app)
}

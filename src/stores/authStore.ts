import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  phone: string
  firstName: string
  lastName: string
  role: 'user' | 'admin'
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  token: string | null
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setUser: (user: User) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      get token() {
        return get().accessToken
      },
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ user, accessToken, refreshToken, isAuthenticated: true })
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
      hydrate: () => {
        const accessToken = localStorage.getItem('accessToken')
        const refreshToken = localStorage.getItem('refreshToken')
        const userStr = localStorage.getItem('auth-storage')
        if (accessToken && refreshToken && userStr) {
          try {
            const { state } = JSON.parse(userStr)
            if (state?.user && state?.isAuthenticated) {
              set({ 
                user: state.user, 
                accessToken, 
                refreshToken, 
                isAuthenticated: true 
              })
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/api'

interface User {
  id: string
  email: string
  phone: string
  firstName: string
  lastName: string
  avatar?: string
  role: 'user' | 'admin'
  isProfessionalVerified?: boolean
  dentalRegistrationId?: string
  stateDentalCouncil?: string
  isEmailVerified?: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setAuth: (user: User) => void
  setUser: (user: User) => void
  logout: () => void
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => {
        set({ user, isAuthenticated: true })
      },
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null, isAuthenticated: false })
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        api.post('/auth/logout').catch(() => {})
      },
      hydrate: async () => {
        try {
          const response = await api.get('/auth/me')
          set({ user: response.data, isAuthenticated: true })
        } catch {
          set({ user: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

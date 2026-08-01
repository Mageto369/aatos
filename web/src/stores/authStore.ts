import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  status: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  setToken: (token: string) => void
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setToken: (token: string) => {
        localStorage.setItem('aatos_token', token)
        set({ token, isAuthenticated: true })
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const res = await api.post('/auth/login', { email, password })
          const { accessToken, user } = res.data
          localStorage.setItem('aatos_token', accessToken)
          set({ user, token: accessToken, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true })
        try {
          const res = await api.post('/auth/register', data)
          const { accessToken, user } = res.data
          localStorage.setItem('aatos_token', accessToken)
          set({ user, token: accessToken, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('aatos_token')
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        window.location.href = '/login'
      },

      refreshUser: async () => {
        const token = get().token || localStorage.getItem('aatos_token')
        if (!token) return
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const res = await api.get('/auth/me')
          set({ user: res.data, isAuthenticated: true })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'aatos-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)

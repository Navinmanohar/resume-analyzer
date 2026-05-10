import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
  user: User | null
  isHR: boolean
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isHR: false,
  token: null,
  login: (user, token) => {
    localStorage.setItem('hf_token', token)
    set({ user, token, isHR: user.role === 'hr' })
  },
  logout: () => {
    localStorage.removeItem('hf_token')
    set({ user: null, token: null, isHR: false })
  },
  setUser: (user) => set({ user, isHR: user.role === 'hr' }),
}))

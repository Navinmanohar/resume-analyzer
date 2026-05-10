import api from './client'

export interface AuthResponse {
  token: string
  user: { id: number; name: string; email: string; role: 'hr' | 'employee' }
}

export const registerUser = (data: { name: string; email: string; password: string; role: string }) =>
  api.post('/auth/register', data).then((r) => r.data.data as AuthResponse)

export const loginUser = (data: { email: string; password: string }) =>
  api.post('/auth/login', data).then((r) => r.data.data as AuthResponse)

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data.data)

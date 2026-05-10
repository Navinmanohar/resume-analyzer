import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('hf_token') : null
  if (stored) config.headers.Authorization = `Bearer ${stored}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('hf_token')
      window.location.href = '/login'
    }
    const msg = err?.response?.data?.error || err.message || 'Something went wrong'
    return Promise.reject(new Error(msg))
  },
)

export default api

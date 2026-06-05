import axios from 'axios'

// Backend: context-path=/api, controllers prefix=/api/...
// Resulting URLs: http://localhost:8080/api/api/auth/... and /api/api/v1/...
// Vite proxy: /api → http://localhost:8080 (passthrough)
// So axios baseURL = /api/api covers both auth and v1 endpoints.
const api = axios.create({
  baseURL: '/api/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
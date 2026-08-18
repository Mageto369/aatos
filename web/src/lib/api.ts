import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aatos_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    // The API wraps every successful payload as { data, meta } via the
    // server's TransformInterceptor. Unwrap it once here so callers can read
    // the payload as res.data, which is what every page already assumes.
    const body = response.data
    if (body && typeof body === 'object' && 'data' in body && 'meta' in body) {
      response.data = body.data
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('aatos_token')
      // A rejected sign-in also returns 401. Redirecting from the login page
      // back to itself would reload away the error the user needs to read.
      if (window.location.pathname !== '/login') {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/login?returnTo=${returnTo}`
      }
    }
    return Promise.reject(error)
  }
)

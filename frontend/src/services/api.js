import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('expensy_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    // Expired or invalid session: clear it and send them to login once.
    if (status === 401) {
      localStorage.removeItem('expensy_token')
      localStorage.removeItem('expensy_user')
      const path = window.location.pathname
      if (path !== '/login' && path !== '/signup') {
        window.location.replace('/login')
      }
    }

    // Give every caller a readable `error.message` regardless of what failed.
    error.friendlyMessage = readableMessage(error)
    return Promise.reject(error)
  }
)

function readableMessage(error) {
  if (error.code === 'ECONNABORTED') {
    return 'The server took too long to answer. Check your connection and try again.'
  }
  if (!error.response) {
    return 'Cannot reach the server. Make sure the backend is running on port 8000.'
  }

  const detail = error.response.data?.detail

  // FastAPI validation errors arrive as an array of objects.
  if (Array.isArray(detail)) {
    return detail[0]?.msg || 'Please check the form and try again.'
  }
  if (typeof detail === 'string') return detail

  if (error.response.status >= 500) {
    return 'The server hit an error. Please try again in a moment.'
  }
  return 'Something went wrong. Please try again.'
}

export default api
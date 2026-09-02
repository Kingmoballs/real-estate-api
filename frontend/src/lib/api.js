import axios from 'axios'

const unsafeMethods = new Set(['post', 'put', 'patch', 'delete'])
let csrfToken = null
let refreshRequest = null

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

export const setCsrfToken = (token) => {
  csrfToken = token || null
}

export const ensureCsrfToken = async () => {
  if (csrfToken) return csrfToken

  const response = await api.get('/auth/csrf-token', {
    skipAuthRefresh: true,
  })
  setCsrfToken(response.data.csrfToken)
  return csrfToken
}

api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase()

  if (unsafeMethods.has(method) && csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const shouldRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh

    if (!shouldRefresh) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      refreshRequest ||= api
        .post('/auth/refresh-token', undefined, {
          skipAuthRefresh: true,
        })
        .then((response) => {
          setCsrfToken(response.data.csrfToken)
          return response
        })
        .finally(() => {
          refreshRequest = null
        })

      await refreshRequest
      return api(originalRequest)
    } catch (refreshError) {
      setCsrfToken(null)
      return Promise.reject(refreshError)
    }
  },
)

export default api

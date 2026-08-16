import axios from 'axios'

export const BASE_URL = `${import.meta.env.VITE_API_URL}/api`

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise: Promise<unknown> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
            .finally(() => {
              refreshPromise = null
            })
        }
        await refreshPromise
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('auth-storage')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export default api

export const reviewsApi = {
  create: (data: { productId: number; rating: number; title?: string; comment?: string; images?: string[] }) => 
    api.post('/reviews', data),
  
  getByProduct: (productId: string | number, params?: { page?: number; limit?: number; sort?: string }) => 
    api.get(`/reviews/product/${productId}`, { params }),
  
  getStats: (productId: string | number) => api.get(`/reviews/product/${productId}/stats`),
  
  update: (id: string, data: { rating?: number; title?: string; comment?: string; images?: string[] }) =>
    api.put(`/reviews/${id}`, data),
  
  delete: (id: string) => api.delete(`/reviews/${id}`),
  
  markHelpful: (id: string) => api.post(`/reviews/${id}/helpful`),
}

export const cartApi = {
  reorder: (orderId: string) => api.post('/cart/reorder', { orderId }),
}

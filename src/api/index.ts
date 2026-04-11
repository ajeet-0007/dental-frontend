import axios from 'axios'

export const BASE_URL = `${import.meta.env.VITE_API_URL}/api`

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefreshToken } = response.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export default api

export const reviewsApi = {
  canReview: (productId: string | number) => api.get(`/reviews/user/can-review/${productId}`),
  
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

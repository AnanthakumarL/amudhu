import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL environment variable is not defined')
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
}

export const productionManagementAPI = {
  list: (params) => api.get('/production-managements', { params }),
  get: (id) => api.get(`/production-managements/${id}`),
  create: (data) => api.post('/production-managements', data),
  update: (id, data) => api.put(`/production-managements/${id}`, data),
  delete: (id) => api.delete(`/production-managements/${id}`),
}

export const ordersAPI = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.put(`/orders/${id}`, data),
}

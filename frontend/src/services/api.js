import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export const productApi = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
};

export const customerApi = {
  getAll: () => api.get('/customers'),
  create: (data) => api.post('/customers', data),
};

export const orderApi = {
  getAll: () => api.get('/orders'),
  create: (data) => api.post('/orders', data),
};

export default api;

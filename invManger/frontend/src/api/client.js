import axios from 'axios';

// Base URL defaults to a relative /api (works with the nginx proxy in Docker
// and the Vite dev proxy). Override with VITE_API_URL when the API is on a
// different origin (e.g. a separately deployed backend).
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL });

// Attach the JWT from localStorage to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear the session and bounce to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Normalize backend error messages for display.
export function apiError(err) {
  return (
    err.response?.data?.error ||
    err.response?.data?.details?.[0]?.message ||
    err.message ||
    'Something went wrong'
  );
}

export default api;

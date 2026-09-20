import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT or Anonymous Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('anon_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

// Response Interceptor: Refresh Token Handler
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && !originalRequest.headers.Authorization?.includes(sessionStorage.getItem('anon_token') || '__no_anon_token__')) {
        try {
          refreshPromise ??= axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
          const res = await refreshPromise;
          const newAccessToken = res.data.access_token;
          const newRefreshToken = res.data.refresh_token;

          localStorage.setItem('access_token', newAccessToken);
          localStorage.setItem('refresh_token', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } finally {
          refreshPromise = null;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

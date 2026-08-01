import axios from 'axios';

export const API_BASE_URL = 'https://fitopiaapi.pythonanywhere.com/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Bearer token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fitopia_auth_token');
    if (token && token !== 'null' && token !== 'undefined' && config.headers) {
      // Only set Authorization header if not already set
      if (!config.headers.Authorization && !config.headers.authorization) {
        // Do not send dummy mock token strings as Bearer headers to backend
        if (!token.startsWith('fitopia_session_') && !token.startsWith('session_')) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized responses safely
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('API returned 401 Unauthorized:', error.config?.url);

      const isAuthRequest = error.config?.url?.includes('/auth/');
      // Only redirect if NOT an auth request and user is not already on login page
      if (!isAuthRequest && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        const storedToken = localStorage.getItem('fitopia_auth_token');
        // If there was an actual token stored and request failed with 401, clear it and redirect
        if (storedToken) {
          localStorage.removeItem('fitopia_auth_token');
          localStorage.removeItem('fitopia_gym_access');
          localStorage.removeItem('fitopia_current_gym');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

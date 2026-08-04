import axios from 'axios';

export const API_BASE_URL = 'https://fitopiaapi.pythonanywhere.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Bearer token and debug logging
api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('fitopia_auth_token');
    if (token) {
      token = token.trim().replace(/^["']|["']$/g, '');
      if (token && token !== 'null' && token !== 'undefined' && config.headers) {
        if (!config.headers.Authorization && !config.headers.authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }

    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    console.log(`[API Request] ${config.method?.toUpperCase()} -> ${fullUrl}`, {
      hasAuth: !!config.headers?.Authorization || !!config.headers?.authorization,
      authHeader: config.headers?.Authorization ? 'Bearer <token_present>' : 'None',
      data: config.data || null,
    });
    return config;
  },
  (error) => Promise.reject(error)
);

let isRedirectingToWelcome = false;

// Response interceptor to handle 401 Unauthorized responses safely
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response Success] ${response.config.method?.toUpperCase()} ${response.config.url} (${response.status})`);
    return response;
  },
  (error) => {
    const fullUrl = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
    console.error(`[API Response Error] ${error.config?.method?.toUpperCase()} ${fullUrl}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      isNetworkError: !error.response && !!error.request,
    });

    if (error.response && error.response.status === 401) {
      console.warn('API returned 401 Unauthorized:', error.config?.url);

      const isAuthRequest = error.config?.url?.includes('/auth/');
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

      if (
        !isAuthRequest &&
        currentPath !== '/login' &&
        currentPath !== '/welcome' &&
        !isRedirectingToWelcome
      ) {
        isRedirectingToWelcome = true;

        // Save current location so user can be restored after logging back in
        if (currentPath && currentPath !== '/' && currentPath !== '/login' && currentPath !== '/welcome') {
          localStorage.setItem('fitopia_redirect_target', currentPath);
        }

        // Clear authentication tokens and cached gym data
        localStorage.removeItem('fitopia_auth_token');
        localStorage.removeItem('fitopia_gym_access');
        localStorage.removeItem('fitopia_current_gym');

        // Redirect to welcome/session expired page
        window.location.href = '/welcome';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

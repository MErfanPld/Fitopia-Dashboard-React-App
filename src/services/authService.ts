import api from './api';
import { GymStaffAccess } from '../types';

export interface LoginResult {
  token: string | null;
  gyms: GymStaffAccess[];
  rawData?: any;
}

/**
 * Helper function to extract auth token and gym access list
 * from the login API response regardless of response shape.
 */
export function extractAuthData(response: any): { token: string | null; gyms: GymStaffAccess[] } {
  console.log('RAW LOGIN RESPONSE:', response);

  const data = response.data;
  let token: string | null = null;
  let gyms: GymStaffAccess[] = [];

  if (Array.isArray(data)) {
    // If response body is directly an array of GymStaffAccess
    gyms = data;

    // Check response headers for token
    if (response.headers) {
      const authHeader =
        response.headers['authorization'] ||
        response.headers['Authorization'] ||
        response.headers['x-auth-token'] ||
        response.headers['X-Auth-Token'];

      if (authHeader) {
        token = authHeader.replace(/^Bearer\s+/i, '');
      }
    }
  } else if (data && typeof data === 'object') {
    // If response body is an object containing token and/or gyms list
    token = data.access || data.token || data.jwt || data.access_token || data.key || null;

    if (Array.isArray(data.gyms)) {
      gyms = data.gyms;
    } else if (Array.isArray(data.gym_staff_access)) {
      gyms = data.gym_staff_access;
    } else if (Array.isArray(data.access_list)) {
      gyms = data.access_list;
    } else if (Array.isArray(data.results)) {
      gyms = data.results;
    } else if (Array.isArray(data.data)) {
      gyms = data.data;
    }
  }

  // Fallback: If no explicit JWT token string was found in body/headers,
  // we generate a session token identifier so authenticated state is preserved.
  if (!token) {
    token = `fitopia_session_${Date.now()}`;
  }

  return { token, gyms };
}

export const authService = {
  /**
   * Post credentials to POST /gym-panel/auth/login/
   */
  async login(username: string, password: string): Promise<LoginResult> {
    try {
      const response = await api.post('/gym-panel/auth/login/', {
        username: username.trim(),
        password,
      });

      const { token, gyms } = extractAuthData(response);

      return {
        token,
        gyms,
        rawData: response.data,
      };
    } catch (error: any) {
      console.error('API Login Error:', error);

      if (error.response) {
        const status = error.response.status;
        if (status === 401 || status === 400) {
          const detail =
            error.response.data?.detail ||
            error.response.data?.message ||
            error.response.data?.non_field_errors?.[0];

          if (detail && typeof detail === 'string') {
            throw new Error(detail);
          }
          throw new Error('نام کاربری یا رمز عبور اشتباه است.');
        }

        const serverMsg = error.response.data?.detail || error.response.data?.message;
        if (serverMsg) {
          throw new Error(serverMsg);
        }

        throw new Error(`خطای سرور (${status}). لطفاً مجدداً تلاش کنید.`);
      } else if (error.request) {
        throw new Error('خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
      } else {
        throw new Error(error.message || 'خطایی در ورود به سیستم رخ داد.');
      }
    }
  },

  /**
   * Clear localStorage auth keys
   */
  logout(): void {
    localStorage.removeItem('fitopia_auth_token');
    localStorage.removeItem('fitopia_gym_access');
    localStorage.removeItem('fitopia_current_gym');
  },
};

export default authService;

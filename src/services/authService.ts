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

  const data = response?.data;
  let token: string | null = null;
  let gyms: GymStaffAccess[] = [];

  // Helper function to search for JWT or token strings in object/array/headers
  const findTokenIn = (obj: any): string | null => {
    if (!obj) return null;

    if (typeof obj === 'string') {
      const cleaned = obj.trim().replace(/^Bearer\s+/i, '');
      if (cleaned.length > 10) return cleaned;
      return null;
    }

    if (typeof obj === 'object') {
      // Direct known fields
      const candidates = [
        obj.access,
        obj.access_token,
        obj.accessToken,
        obj.token,
        obj.jwt,
        obj.key,
        obj.auth_token,
        obj.authToken,
        obj.id_token,
        obj.data?.access,
        obj.data?.token,
      ];

      for (const cand of candidates) {
        if (typeof cand === 'string' && cand.trim().length > 10) {
          return cand.trim().replace(/^Bearer\s+/i, '');
        }
      }

      // Check array elements if obj is array
      if (Array.isArray(obj)) {
        for (const item of obj) {
          if (item && typeof item === 'object') {
            const itemToken = findTokenIn(item);
            if (itemToken) return itemToken;
          }
        }
      } else {
        // Deep scan object properties
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if (typeof val === 'string') {
            const cleaned = val.trim().replace(/^Bearer\s+/i, '');
            if (cleaned.startsWith('eyJ') || (cleaned.split('.').length === 3 && cleaned.length > 20)) {
              return cleaned;
            }
          } else if (typeof val === 'object' && val !== null) {
            const nested = findTokenIn(val);
            if (nested) return nested;
          }
        }
      }
    }
    return null;
  };

  // 1. Try finding token in response body
  token = findTokenIn(data);

  // 2. Try finding token in response headers
  if (!token && response?.headers) {
    const authHeader =
      response.headers['authorization'] ||
      response.headers['Authorization'] ||
      response.headers['x-auth-token'] ||
      response.headers['X-Auth-Token'] ||
      response.headers['access-token'];

    if (authHeader && typeof authHeader === 'string') {
      token = authHeader.replace(/^Bearer\s+/i, '').trim();
    }
  }

  // Extract Gyms list
  if (Array.isArray(data)) {
    gyms = data;
  } else if (data && typeof data === 'object') {
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

  // Fallback session identifier if backend uses session auth
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

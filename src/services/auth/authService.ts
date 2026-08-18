import api, { tokenStorage, getErrorMessage } from '../apiClient';
import type { AuthUser, GymAccess, LoginResponse } from '../../types/api';

const GYMS_KEY = 'fitopia_gym_access';
const CURRENT_GYM_KEY = 'fitopia_current_gym';
const USER_KEY = 'fitopia_user';

function isJwt(token: string): boolean {
  return token.split('.').length === 3 && token.length > 20;
}

function mapGymAccess(raw: unknown): GymAccess | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const gym = Number(o.gym ?? o.gym_id ?? o.id);
  if (!gym || Number.isNaN(gym)) return null;
  return {
    id: Number(o.id ?? gym),
    gym,
    gym_name: String(o.gym_name ?? o.name ?? `باشگاه ${gym}`),
    gym_address: o.gym_address ? String(o.gym_address) : undefined,
    role: String(o.role ?? 'staff'),
  };
}

export interface LoginResult {
  token: string | null;
  gyms: GymAccess[];
  access: string;
  refresh: string;
  user: AuthUser;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResult> {
    try {
      const { data } = await api.post<LoginResponse | GymAccess[] | Record<string, unknown>>(
        '/gym-panel/auth/login/',
        { username: username.trim(), password },
      );

      let access = '';
      let refresh = '';
      let user: AuthUser = {};
      let gyms: GymAccess[] = [];

      if (Array.isArray(data)) {
        gyms = data.map(mapGymAccess).filter(Boolean) as GymAccess[];
      } else if (data && typeof data === 'object') {
        const d = data as LoginResponse & Record<string, unknown>;
        access = String(d.tokens?.access || d.access || '');
        refresh = String(d.tokens?.refresh || d.refresh || '');
        if (d.user) user = d.user;
        if (Array.isArray(d.gyms)) {
          gyms = d.gyms.map(mapGymAccess).filter(Boolean) as GymAccess[];
        }
      }

      if (!access || !isJwt(access)) {
        try {
          const { data: acc } = await api.post<Record<string, unknown>>('/accounts/login/', {
            username: username.trim(),
            password,
          });
          const a = String(
            (acc as { tokens?: { access?: string }; access?: string; access_token?: string }).tokens?.access ||
              (acc as { access?: string }).access ||
              (acc as { access_token?: string }).access_token ||
              '',
          );
          const r = String(
            (acc as { tokens?: { refresh?: string }; refresh?: string; refresh_token?: string }).tokens?.refresh ||
              (acc as { refresh?: string }).refresh ||
              (acc as { refresh_token?: string }).refresh_token ||
              '',
          );
          if (a && isJwt(a)) {
            access = a;
            refresh = r || refresh;
          }
        } catch {
          /* keep gym-panel failure as primary */
        }
      }

      if (!access || !isJwt(access)) {
        throw new Error('پاسخ سرور فاقد توکن JWT معتبر است. قرارداد لاگین را در Backend بررسی کنید.');
      }

      if (!gyms.length) {
        try {
          const { data: glist } = await api.get('/gym-panel/gyms/', {
            headers: { Authorization: `Bearer ${access}` },
          });
          const arr = Array.isArray(glist) ? glist : [];
          gyms = arr.map(mapGymAccess).filter(Boolean) as GymAccess[];
        } catch {
          /* keep empty */
        }
      }

      tokenStorage.setTokens(access, refresh);
      localStorage.setItem(GYMS_KEY, JSON.stringify(gyms));
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      if (gyms.length > 0) localStorage.setItem(CURRENT_GYM_KEY, JSON.stringify(gyms[0]));
      else localStorage.removeItem(CURRENT_GYM_KEY);

      return { token: access, access, refresh, user, gyms };
    } catch (e) {
      throw new Error(getErrorMessage(e, 'نام کاربری یا رمز عبور اشتباه است.'));
    }
  },

  /**
   * Client session is always cleared.
   * Best-effort server logout while JWT is still attached; ignore 401/network errors.
   */
  async logout(): Promise<void> {
    try {
      const token = tokenStorage.getAccess();
      if (token) {
        await api.post('/accounts/logout/');
      }
    } catch {
      /* server may return 401 if token already expired — still clear local session */
    } finally {
      tokenStorage.clear();
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(GYMS_KEY);
      localStorage.removeItem(CURRENT_GYM_KEY);
    }
  },

  getStoredSession() {
    const access = tokenStorage.getAccess();
    let gyms: GymAccess[] = [];
    let currentGym: GymAccess | null = null;
    let user: AuthUser | null = null;
    try {
      const g = localStorage.getItem(GYMS_KEY);
      if (g) gyms = JSON.parse(g);
    } catch {
      /* */
    }
    try {
      const c = localStorage.getItem(CURRENT_GYM_KEY);
      if (c) currentGym = JSON.parse(c);
    } catch {
      /* */
    }
    try {
      const u = localStorage.getItem(USER_KEY);
      if (u) user = JSON.parse(u);
    } catch {
      /* */
    }
    if (currentGym && gyms.length) {
      const still = gyms.find((g) => g.gym === currentGym!.gym);
      if (!still) currentGym = gyms[0];
    } else if (!currentGym && gyms.length) currentGym = gyms[0];
    return { access, gyms, currentGym, user };
  },

  persistCurrentGym(gym: GymAccess) {
    localStorage.setItem(CURRENT_GYM_KEY, JSON.stringify(gym));
  },

  async fetchMyGyms(): Promise<GymAccess[]> {
    const { data } = await api.get('/gym-panel/gyms/');
    const gyms = (Array.isArray(data) ? data : []).map(mapGymAccess).filter(Boolean) as GymAccess[];
    localStorage.setItem(GYMS_KEY, JSON.stringify(gyms));
    return gyms;
  },
};

export default authService;

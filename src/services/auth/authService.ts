import api, { tokenStorage, getErrorMessage } from '../apiClient';
import type { AuthUser, GymAccess, LoginResponse } from '../../types/api';

const GYMS_KEY = 'fitopia_gym_access';
const CURRENT_GYM_KEY = 'fitopia_current_gym';
const USER_KEY = 'fitopia_user';

function isJwt(token: string): boolean {
  return token.split('.').length === 3 && token.length > 20;
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
      const { data } = await api.post<LoginResponse>('/gym-panel/auth/login/', {
        username: username.trim(),
        password,
      });
      const access = data?.tokens?.access;
      const refresh = data?.tokens?.refresh;
      if (!access || !isJwt(access)) throw new Error('\u067e\u0627\u0633\u062e \u0633\u0631\u0648\u0631 \u0641\u0627\u0642\u062f \u062a\u0648\u06a9\u0646 \u0645\u0639\u062a\u0628\u0631 \u0627\u0633\u062a.');
      const gyms: GymAccess[] = Array.isArray(data.gyms) ? data.gyms : [];
      const user = data.user || ({} as AuthUser);
      tokenStorage.setTokens(access, refresh);
      localStorage.setItem(GYMS_KEY, JSON.stringify(gyms));
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      if (gyms.length > 0) localStorage.setItem(CURRENT_GYM_KEY, JSON.stringify(gyms[0]));
      else localStorage.removeItem(CURRENT_GYM_KEY);
      return { token: access, access, refresh: refresh || '', user, gyms };
    } catch (e) {
      throw new Error(getErrorMessage(e, '\u0646\u0627\u0645 \u06a9\u0627\u0631\u0628\u0631\u06cc \u06cc\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0634\u062a\u0628\u0627\u0647 \u0627\u0633\u062a.'));
    }
  },
  logout() {
    tokenStorage.clear();
    localStorage.removeItem(USER_KEY);
  },
  getStoredSession() {
    const access = tokenStorage.getAccess();
    let gyms: GymAccess[] = [];
    let currentGym: GymAccess | null = null;
    let user: AuthUser | null = null;
    try { const g = localStorage.getItem(GYMS_KEY); if (g) gyms = JSON.parse(g); } catch { /* */ }
    try { const c = localStorage.getItem(CURRENT_GYM_KEY); if (c) currentGym = JSON.parse(c); } catch { /* */ }
    try { const u = localStorage.getItem(USER_KEY); if (u) user = JSON.parse(u); } catch { /* */ }
    if (currentGym && gyms.length) {
      const still = gyms.find((g) => g.gym === currentGym!.gym);
      if (!still) currentGym = gyms[0];
    } else if (!currentGym && gyms.length) currentGym = gyms[0];
    return { access, gyms, currentGym, user };
  },
  persistCurrentGym(gym: GymAccess) {
    localStorage.setItem(CURRENT_GYM_KEY, JSON.stringify(gym));
  },
  async fetchMyGyms() {
    const { data } = await api.get('/gym-panel/gyms/');
    const list: GymAccess[] = Array.isArray(data) ? data : [];
    localStorage.setItem(GYMS_KEY, JSON.stringify(list));
    return list;
  },
};
export default authService;

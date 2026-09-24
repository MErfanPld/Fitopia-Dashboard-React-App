import api, { getErrorMessage } from '../apiClient';

export type TokenUser = {
  id?: number;
  full_name?: string;
  phone_number?: string;
  phone?: string;
  username?: string;
};

export type TokenLookupResult = {
  valid: boolean;
  can_admit: boolean;
  message?: string;
  token_code?: string;
  status?: string;
  is_universal?: boolean;
  gym_id?: number;
  issued_at?: string | null;
  valid_until?: string | null;
  expires_in_seconds?: number | null;
  user?: TokenUser | null;
};

export type TokenAdmitResult = {
  valid: boolean;
  message?: string;
  token?: {
    token_code?: string;
    status?: string;
    used_at?: string | null;
  };
  user?: TokenUser | null;
  visit_id?: number | null;
  used_at?: string | null;
};

export type TokenTodayEntry = {
  visit_id?: number;
  token_code?: string;
  used_at?: string | null;
  check_in_at?: string | null;
  user?: TokenUser | null;
  guest_name?: string;
};

export type TokenTodayResult = {
  date?: string;
  count: number;
  results: TokenTodayEntry[];
};

function normalizeLookup(raw: unknown): TokenLookupResult {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const user = o.user && typeof o.user === 'object' ? (o.user as TokenUser) : null;
  return {
    valid: Boolean(o.valid),
    can_admit: Boolean(o.can_admit),
    message: typeof o.message === 'string' ? o.message : undefined,
    token_code: o.token_code != null ? String(o.token_code) : undefined,
    status: o.status != null ? String(o.status) : undefined,
    is_universal: Boolean(o.is_universal),
    gym_id: o.gym_id != null ? Number(o.gym_id) : undefined,
    issued_at: (o.issued_at as string) || null,
    valid_until: (o.valid_until as string) || null,
    expires_in_seconds:
      o.expires_in_seconds != null && Number.isFinite(Number(o.expires_in_seconds))
        ? Number(o.expires_in_seconds)
        : null,
    user,
  };
}

function normalizeAdmit(raw: unknown): TokenAdmitResult {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const token =
    o.token && typeof o.token === 'object'
      ? (o.token as TokenAdmitResult['token'])
      : undefined;
  const user = o.user && typeof o.user === 'object' ? (o.user as TokenUser) : null;
  return {
    valid: Boolean(o.valid),
    message: typeof o.message === 'string' ? o.message : undefined,
    token,
    user,
    visit_id: o.visit_id != null ? Number(o.visit_id) : null,
    used_at: (o.used_at as string) || null,
  };
}

function normalizeToday(raw: unknown): TokenTodayResult {
  if (!raw || typeof raw !== 'object') return { count: 0, results: [] };
  const o = raw as Record<string, unknown>;
  const list = Array.isArray(o.results)
    ? (o.results as TokenTodayEntry[])
    : Array.isArray(o)
      ? (o as TokenTodayEntry[])
      : [];
  const count =
    o.count != null && Number.isFinite(Number(o.count)) ? Number(o.count) : list.length;
  return {
    date: typeof o.date === 'string' ? o.date : undefined,
    count,
    results: list,
  };
}

export const tokensService = {
  /** بررسی توکن بدون مصرف */
  async lookup(gymId: number, tokenCode: string): Promise<TokenLookupResult> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/tokens/lookup/`, {
        token_code: String(tokenCode).trim(),
      });
      return normalizeLookup(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در بررسی توکن'));
    }
  },

  /** تایید ورود و مصرف توکن */
  async admit(gymId: number, tokenCode: string): Promise<TokenAdmitResult> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/tokens/admit/`, {
        token_code: String(tokenCode).trim(),
      });
      return normalizeAdmit(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در تایید ورود با توکن'));
    }
  },

  /** لیست ورودهای امروز با توکن */
  async today(gymId: number): Promise<TokenTodayResult> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/tokens/today/`);
      return normalizeToday(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت ورودهای توکن امروز'));
    }
  },
};

export default tokensService;

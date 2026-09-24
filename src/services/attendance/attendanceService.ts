import api, { unwrapList, getErrorMessage } from '../apiClient';
import type {
  AttendanceStats,
  GymVisit,
  AttendanceCheckInInput,
} from '../../types/api';

function normalizeStats(raw: unknown): AttendanceStats {
  if (!raw || typeof raw !== 'object') {
    return { today_visits: 0, currently_inside: 0, month_visits: 0, total_visits: 0 };
  }
  const o = raw as Record<string, unknown>;
  const num = (...keys: string[]) => {
    for (const k of keys) {
      if (o[k] != null && Number.isFinite(Number(o[k]))) return Number(o[k]);
    }
    return 0;
  };
  return {
    today_visits: num('today_visits', 'today', 'visits_today'),
    currently_inside: num('currently_inside', 'inside', 'open_visits', 'present'),
    month_visits: num('month_visits', 'this_month', 'monthly_visits'),
    total_visits: num('total_visits', 'total', 'all_visits'),
  };
}

/**
 * Backend CheckInSerializer (Fitopia-API):
 *   customer_id: int (required)
 *   method: qr|token|manual|membership (default manual)
 *   sport_id: int optional
 */
function sanitizeCheckIn(payload: AttendanceCheckInInput): Record<string, unknown> {
  const customerId =
    payload.customer_id != null && Number(payload.customer_id) > 0
      ? Number(payload.customer_id)
      : payload.customer != null && Number(payload.customer) > 0
        ? Number(payload.customer)
        : null;

  if (!customerId) {
    throw new Error('انتخاب عضو الزامی است');
  }

  const body: Record<string, unknown> = {
    customer_id: customerId,
    method: payload.method || 'manual',
  };

  const sportId =
    payload.sport_id != null && Number(payload.sport_id) > 0
      ? Number(payload.sport_id)
      : payload.sport != null && Number(payload.sport) > 0
        ? Number(payload.sport)
        : null;

  if (sportId) {
    body.sport_id = sportId;
  }

  return body;
}

function pickStr(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

/** Normalize visit payloads from membership / token / manual check-in variants */
function normalizeVisit(raw: unknown): GymVisit | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = o.id != null ? Number(o.id) : NaN;
  if (!Number.isFinite(id)) return null;

  const user =
    o.user && typeof o.user === 'object' ? (o.user as Record<string, unknown>) : null;
  const customerObj =
    o.customer && typeof o.customer === 'object'
      ? (o.customer as Record<string, unknown>)
      : null;

  const customerId =
    o.customer_id != null && Number.isFinite(Number(o.customer_id))
      ? Number(o.customer_id)
      : typeof o.customer === 'number' || (typeof o.customer === 'string' && o.customer !== '')
        ? Number(o.customer)
        : customerObj?.id != null
          ? Number(customerObj.id)
          : null;

  const customer_name = pickStr(
    o.customer_name,
    o.member_name,
    o.user_name,
    o.full_name,
    user?.full_name,
    customerObj?.full_name,
    customerObj?.name,
    o.guest_name,
  );

  const guest_phone = pickStr(
    o.guest_phone,
    o.phone,
    o.phone_number,
    user?.phone_number,
    user?.phone,
    customerObj?.phone,
    customerObj?.phone_number,
  );

  const method = pickStr(o.method, o.check_in_method, o.entry_method) || undefined;
  const source = pickStr(o.source, o.origin) || undefined;

  const token_code = pickStr(o.token_code, o.token);
  const finalMethod = method || (token_code ? 'token' : undefined);
  const finalSource = source || (token_code ? 'token' : undefined);

  const sport =
    o.sport_id != null && Number.isFinite(Number(o.sport_id))
      ? Number(o.sport_id)
      : o.sport != null && Number.isFinite(Number(o.sport))
        ? Number(o.sport)
        : null;

  return {
    ...(o as GymVisit),
    id,
    customer: customerId,
    customer_id: customerId,
    customer_name,
    member_name: pickStr(o.member_name),
    user_name: pickStr(o.user_name),
    full_name: pickStr(o.full_name, user?.full_name),
    guest_name: pickStr(o.guest_name),
    guest_phone,
    phone: guest_phone,
    phone_number: guest_phone,
    sport,
    sport_name: pickStr(o.sport_name, o.sport_title),
    method: finalMethod as GymVisit['method'],
    source: finalSource as GymVisit['source'],
    token_code,
    check_in_at: pickStr(o.check_in_at, o.checked_in_at, o.entry_at, o.created_at),
    check_out_at: pickStr(o.check_out_at, o.checked_out_at, o.exit_at),
    is_open:
      typeof o.is_open === 'boolean'
        ? o.is_open
        : o.check_out_at == null && o.checked_out_at == null,
    user: user
      ? {
          id: user.id != null ? Number(user.id) : undefined,
          full_name: pickStr(user.full_name) || undefined,
          phone_number: pickStr(user.phone_number, user.phone) || undefined,
          phone: pickStr(user.phone, user.phone_number) || undefined,
          username: pickStr(user.username) || undefined,
        }
      : null,
  };
}

export const attendanceService = {
  async list(
    gymId: number,
    params?: { date?: string; is_open?: boolean },
  ): Promise<GymVisit[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/attendance/`, { params });
      return unwrapList<unknown>(data)
        .map(normalizeVisit)
        .filter((x): x is GymVisit => x != null);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت لیست حضور'));
    }
  },

  async stats(gymId: number): Promise<AttendanceStats> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/attendance/stats/`);
      return normalizeStats(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت آمار حضور'));
    }
  },

  async checkIn(gymId: number, payload: AttendanceCheckInInput): Promise<GymVisit | unknown> {
    try {
      const { data } = await api.post(
        `/gym-panel/gyms/${gymId}/attendance/check-in/`,
        sanitizeCheckIn(payload),
      );
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت ورود'));
    }
  },

  /** Backend CheckOutSerializer: { visit_id: int } */
  async checkOut(gymId: number, visitId: number): Promise<GymVisit | unknown> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/attendance/check-out/`, {
        visit_id: visitId,
      });
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت خروج'));
    }
  },
};

export default attendanceService;

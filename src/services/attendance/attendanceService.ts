import api, { unwrapList, getErrorMessage } from '../apiClient';
import type {
  AttendanceStats,
  GymVisit,
  AttendanceCheckInInput,
  AttendanceCheckOutInput,
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

function sanitizeCheckIn(payload: AttendanceCheckInInput): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  const customer =
    payload.customer_id != null && Number(payload.customer_id) > 0
      ? Number(payload.customer_id)
      : payload.customer != null && Number(payload.customer) > 0
        ? Number(payload.customer)
        : null;

  if (customer) {
    body.customer = customer;
    body.customer_id = customer;
  }

  const sport =
    payload.sport_id != null && Number(payload.sport_id) > 0
      ? Number(payload.sport_id)
      : payload.sport != null && Number(payload.sport) > 0
        ? Number(payload.sport)
        : null;
  if (sport) {
    body.sport = sport;
    body.sport_id = sport;
  }

  body.method = payload.method || 'manual';
  if (payload.source) body.source = payload.source;

  if (payload.price != null && payload.price !== ('' as unknown)) {
    body.price = Number(payload.price);
  }

  if (payload.guest_name?.trim()) {
    body.guest_name = payload.guest_name.trim();
    body.source = payload.source || 'direct';
  }
  if (payload.guest_phone?.trim()) {
    body.guest_phone = payload.guest_phone.trim();
  }

  if (!customer && !payload.guest_name?.trim()) {
    throw new Error('عضو یا نام مهمان را وارد کنید');
  }

  return body;
}

export const attendanceService = {
  async list(
    gymId: number,
    params?: { date?: string; is_open?: boolean },
  ): Promise<GymVisit[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/attendance/`, { params });
      return unwrapList<GymVisit>(data);
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

  async checkOut(gymId: number, visitId: number): Promise<GymVisit | unknown> {
    try {
      const body: AttendanceCheckOutInput = {
        visit_id: visitId,
        visit: visitId,
        id: visitId,
      };
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/attendance/check-out/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت خروج'));
    }
  },
};

export default attendanceService;

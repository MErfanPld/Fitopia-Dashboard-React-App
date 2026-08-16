import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymOffering, GymOfferingInput, OfferingSchedule } from '../../types/api';

/**
 * Gym panel offerings API.
 * Contract: /api/gym-panel/gyms/{gym_id}/offerings/
 */
function sanitizeSchedule(s: OfferingSchedule): Record<string, unknown> {
  const row: Record<string, unknown> = {
    day_of_week: Number(s.day_of_week),
    start_time: normalizeTime(s.start_time),
    end_time: normalizeTime(s.end_time),
  };
  if (s.id != null) row.id = s.id;
  return row;
}

/** Accept HH:MM or HH:MM:SS → prefer HH:MM:SS for OpenAPI time format */
function normalizeTime(t?: string | null): string {
  if (!t) return '00:00:00';
  const parts = String(t).trim().split(':');
  const h = (parts[0] || '0').padStart(2, '0');
  const m = (parts[1] || '0').padStart(2, '0');
  const sec = (parts[2] || '00').padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function sanitizePayload(payload: Partial<GymOfferingInput>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.sport !== undefined) body.sport = payload.sport;
  if (payload.description !== undefined) body.description = payload.description ?? '';
  if (payload.coaches !== undefined) body.coaches = payload.coaches || [];
  if (payload.capacity !== undefined) body.capacity = payload.capacity;
  if (payload.single_session_price !== undefined) body.single_session_price = payload.single_session_price;
  if (payload.course_price !== undefined) body.course_price = payload.course_price;
  if (payload.monthly_price !== undefined) body.monthly_price = payload.monthly_price;
  if (payload.duration_minutes !== undefined) body.duration_minutes = payload.duration_minutes;
  if (payload.skill_level !== undefined) body.skill_level = payload.skill_level;
  if (payload.gender_restriction !== undefined) body.gender_restriction = payload.gender_restriction;
  if (payload.min_age !== undefined) body.min_age = payload.min_age;
  if (payload.max_age !== undefined) body.max_age = payload.max_age;
  if (payload.is_active !== undefined) body.is_active = payload.is_active;
  if (payload.schedules !== undefined) {
    body.schedules = (payload.schedules || []).map(sanitizeSchedule);
  }
  return body;
}

export const offeringsService = {
  async list(gymId: number): Promise<GymOffering[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/offerings/`);
      return unwrapList<GymOffering>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت خدمات باشگاه'));
    }
  },

  async get(gymId: number, id: number): Promise<GymOffering> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/offerings/${id}/`);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خدمت پیدا نشد'));
    }
  },

  async create(gymId: number, payload: GymOfferingInput): Promise<GymOffering> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/offerings/`, sanitizePayload(payload));
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت خدمت'));
    }
  },

  async update(gymId: number, id: number, payload: Partial<GymOfferingInput>): Promise<GymOffering> {
    try {
      const { data } = await api.patch(`/gym-panel/gyms/${gymId}/offerings/${id}/`, sanitizePayload(payload));
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی خدمت'));
    }
  },

  async replace(gymId: number, id: number, payload: GymOfferingInput): Promise<GymOffering> {
    try {
      const { data } = await api.put(`/gym-panel/gyms/${gymId}/offerings/${id}/`, sanitizePayload(payload));
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی خدمت'));
    }
  },

  async remove(gymId: number, id: number): Promise<void> {
    try {
      await api.delete(`/gym-panel/gyms/${gymId}/offerings/${id}/`);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در حذف خدمت'));
    }
  },

  async suggestSport(gymId: number, payload: { name: string; category_id: number }): Promise<unknown> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/suggest-sport/`, payload);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ارسال پیشنهاد رشته'));
    }
  },
};

export default offeringsService;

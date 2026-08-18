import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymMember, GymMemberInput } from '../../types/api';

/**
 * Gym panel members API (OpenAPI: gym-mgmt-customers).
 * Base: /api/gym-panel/gyms/{gym_id}/members/
 */
export const membersService = {
  async list(gymId: number): Promise<GymMember[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/members/`);
      return unwrapList<GymMember>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت اعضای باشگاه'));
    }
  },

  async get(gymId: number, id: number): Promise<GymMember> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/members/${id}/`);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'عضو پیدا نشد'));
    }
  },

  async create(gymId: number, payload: GymMemberInput): Promise<GymMember> {
    try {
      const body = sanitizePayload(payload);
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/members/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت عضو'));
    }
  },

  async update(gymId: number, id: number, payload: Partial<GymMemberInput>): Promise<GymMember> {
    try {
      const body = sanitizePayload(payload as GymMemberInput, true);
      const { data } = await api.patch(`/gym-panel/gyms/${gymId}/members/${id}/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی عضو'));
    }
  },

  async replace(gymId: number, id: number, payload: GymMemberInput): Promise<GymMember> {
    try {
      const body = sanitizePayload(payload);
      const { data } = await api.put(`/gym-panel/gyms/${gymId}/members/${id}/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی عضو'));
    }
  },

  async remove(gymId: number, id: number): Promise<void> {
    try {
      await api.delete(`/gym-panel/gyms/${gymId}/members/${id}/`);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در حذف عضو'));
    }
  },
};

function sanitizePayload(payload: Partial<GymMemberInput>, partial = false): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const set = (key: keyof GymMemberInput, transform?: (v: unknown) => unknown) => {
    if (!partial || payload[key] !== undefined) {
      const v = payload[key];
      body[key as string] = transform ? transform(v) : v;
    }
  };

  set('full_name', (v) => String(v ?? '').trim());
  set('phone', (v) => String(v ?? '').trim().replace(/\s+/g, ''));
  set('join_date', (v) => (v ? String(v) : undefined));

  if (!partial || payload.sport !== undefined) {
    body.sport = payload.sport != null && payload.sport !== 0 ? payload.sport : null;
  }
  if (!partial || payload.coach !== undefined) {
    body.coach = payload.coach != null && payload.coach !== 0 ? payload.coach : null;
  }
  if (!partial || payload.fitopia_user !== undefined) {
    body.fitopia_user = payload.fitopia_user != null ? payload.fitopia_user : null;
  }
  if (!partial || payload.source !== undefined) {
    if (payload.source) body.source = payload.source;
  }
  if (!partial || payload.sessions_total !== undefined) {
    body.sessions_total = payload.sessions_total ?? null;
  }
  if (!partial || payload.sessions_remaining !== undefined) {
    body.sessions_remaining = payload.sessions_remaining ?? null;
  }
  if (!partial || payload.sessions_used !== undefined) {
    body.sessions_used = payload.sessions_used ?? null;
  }
  if (!partial || payload.price_paid !== undefined) {
    body.price_paid = payload.price_paid ?? null;
  }
  if (!partial || payload.photo !== undefined) {
    if (payload.photo) body.photo = payload.photo;
  }
  if (!partial || payload.membership_status !== undefined) {
    if (payload.membership_status) body.membership_status = payload.membership_status;
  }
  if (!partial || payload.membership_type !== undefined) {
    if (payload.membership_type) body.membership_type = payload.membership_type;
  }
  if (!partial || payload.membership_start !== undefined) {
    body.membership_start = payload.membership_start || null;
  }
  if (!partial || payload.membership_end !== undefined) {
    body.membership_end = payload.membership_end || null;
  }
  if (!partial || payload.notes !== undefined) {
    body.notes = payload.notes ?? '';
  }
  if (!partial || payload.is_active !== undefined) {
    if (payload.is_active !== undefined) body.is_active = payload.is_active;
  }

  if (!partial) {
    if (!body.full_name) throw new Error('نام و نام خانوادگی الزامی است');
    if (!body.phone) throw new Error('شماره موبایل الزامی است');
    if (!body.join_date) throw new Error('تاریخ عضویت الزامی است');
  }

  return body;
}

export default membersService;

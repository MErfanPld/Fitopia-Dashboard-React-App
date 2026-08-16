import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymMember, GymMemberInput } from '../../types/api';

/**
 * Gym panel customers (members) API.
 * Primary contract: /api/gym-panel/gyms/{gym_id}/customers/
 * JWT and gymId are provided by the central apiClient + caller context.
 */
export const membersService = {
  async list(gymId: number): Promise<GymMember[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/customers/`);
      return unwrapList<GymMember>(data);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در دریافت اعضای باشگاه'));
    }
  },

  async get(gymId: number, id: number): Promise<GymMember> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/customers/${id}/`);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'عضو پیدا نشد'));
    }
  },

  async create(gymId: number, payload: GymMemberInput): Promise<GymMember> {
    try {
      const body = sanitizePayload(payload);
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/customers/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در ثبت عضو'));
    }
  },

  async update(gymId: number, id: number, payload: Partial<GymMemberInput>): Promise<GymMember> {
    try {
      const body = sanitizePayload(payload as GymMemberInput, true);
      const { data } = await api.patch(`/gym-panel/gyms/${gymId}/customers/${id}/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی عضو'));
    }
  },

  async replace(gymId: number, id: number, payload: GymMemberInput): Promise<GymMember> {
    try {
      const body = sanitizePayload(payload);
      const { data } = await api.put(`/gym-panel/gyms/${gymId}/customers/${id}/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در به‌روزرسانی عضو'));
    }
  },

  async remove(gymId: number, id: number): Promise<void> {
    try {
      await api.delete(`/gym-panel/gyms/${gymId}/customers/${id}/`);
    } catch (e) {
      throw new Error(getErrorMessage(e, 'خطا در حذف عضو'));
    }
  },
};

function sanitizePayload(payload: Partial<GymMemberInput>, partial = false): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (!partial || payload.full_name !== undefined) {
    body.full_name = String(payload.full_name ?? '').trim();
  }
  if (!partial || payload.phone !== undefined) {
    body.phone = String(payload.phone ?? '').trim();
  }
  if (!partial || payload.sport !== undefined) {
    body.sport = payload.sport ?? null;
  }
  if (!partial || payload.sessions_total !== undefined) {
    body.sessions_total = payload.sessions_total ?? null;
  }
  if (!partial || payload.sessions_remaining !== undefined) {
    body.sessions_remaining = payload.sessions_remaining ?? null;
  }
  if (!partial || payload.price_paid !== undefined) {
    body.price_paid = payload.price_paid ?? null;
  }
  if (!partial || payload.join_date !== undefined) {
    body.join_date = payload.join_date ? String(payload.join_date).trim() : null;
  }
  return body;
}

export default membersService;

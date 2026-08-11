import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymMember, GymMemberInput } from '../../types/api';

export const membersService = {
  async list(gymId: number): Promise<GymMember[]> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/members/`);
      return unwrapList<GymMember>(data);
    } catch {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/customers/`);
      return unwrapList<GymMember>(data);
    }
  },
  async get(gymId: number, id: number): Promise<GymMember> {
    try {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/members/${id}/`);
      return data;
    } catch {
      const { data } = await api.get(`/gym-panel/gyms/${gymId}/customers/${id}/`);
      return data;
    }
  },
  async create(gymId: number, payload: GymMemberInput): Promise<GymMember> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/members/`, payload);
      return data;
    } catch {
      try {
        const { data } = await api.post(`/gym-panel/gyms/${gymId}/customers/`, payload);
        return data;
      } catch (e) {
        throw new Error(getErrorMessage(e));
      }
    }
  },
  async update(gymId: number, id: number, payload: Partial<GymMemberInput>): Promise<GymMember> {
    try {
      const { data } = await api.patch(`/gym-panel/gyms/${gymId}/members/${id}/`, payload);
      return data;
    } catch {
      try {
        const { data } = await api.patch(`/gym-panel/gyms/${gymId}/customers/${id}/`, payload);
        return data;
      } catch (e) {
        throw new Error(getErrorMessage(e));
      }
    }
  },
  async remove(gymId: number, id: number): Promise<void> {
    try {
      await api.delete(`/gym-panel/gyms/${gymId}/members/${id}/`);
    } catch {
      await api.delete(`/gym-panel/gyms/${gymId}/customers/${id}/`);
    }
  },
};
export default membersService;

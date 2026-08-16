import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymUpdatePayload, GymChangeRequest } from '../../types/api';

export const gymService = {
  async update(gymId: number, payload: GymUpdatePayload): Promise<unknown> {
    try {
      const { data } = await api.patch(`/gym-panel/gyms/${gymId}/update/`, payload);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },
  async listChangeRequests(gymId: number): Promise<GymChangeRequest[]> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/change-requests/list/`);
    return unwrapList<GymChangeRequest>(data);
  },
  async createChangeRequest(gymId: number, payload: Record<string, unknown>): Promise<unknown> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/change-requests/`, payload);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },
};
export default gymService;

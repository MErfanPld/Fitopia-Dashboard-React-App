import api, { getErrorMessage } from '../apiClient';
import type { GymUpdatePayload } from '../../types/api';
export const gymService = {
  async update(gymId: number, payload: GymUpdatePayload): Promise<unknown> {
    try {
      const { data } = await api.patch(`/gym-panel/gyms/${gymId}/update/`, payload);
      return data;
    } catch (e) { throw new Error(getErrorMessage(e)); }
  },
};
export default gymService;

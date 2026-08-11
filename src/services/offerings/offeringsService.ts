import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymOffering } from '../../types/api';
export const offeringsService = {
  async list(gymId: number): Promise<GymOffering[]> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/offerings/`);
    return unwrapList<GymOffering>(data);
  },
  async create(gymId: number, payload: Partial<GymOffering>): Promise<GymOffering> {
    try { const { data } = await api.post(`/gym-panel/gyms/${gymId}/offerings/`, payload); return data; }
    catch (e) { throw new Error(getErrorMessage(e)); }
  },
  async update(gymId: number, id: number, payload: Partial<GymOffering>): Promise<GymOffering> {
    try { const { data } = await api.patch(`/gym-panel/gyms/${gymId}/offerings/${id}/`, payload); return data; }
    catch (e) { throw new Error(getErrorMessage(e)); }
  },
  async remove(gymId: number, id: number): Promise<void> {
    await api.delete(`/gym-panel/gyms/${gymId}/offerings/${id}/`);
  },
};
export default offeringsService;

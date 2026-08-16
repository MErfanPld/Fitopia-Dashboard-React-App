import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymPrice, GymPriceInput } from '../../types/api';

export const pricesService = {
  async list(gymId: number): Promise<GymPrice[]> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/prices/`);
    return unwrapList<GymPrice>(data);
  },
  async get(gymId: number, id: number): Promise<GymPrice> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/prices/${id}/`);
    return data;
  },
  async create(gymId: number, payload: GymPriceInput): Promise<GymPrice> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/prices/`, payload);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },
  async update(gymId: number, id: number, payload: Partial<GymPriceInput>): Promise<GymPrice> {
    try {
      const { data } = await api.patch(`/gym-panel/gyms/${gymId}/prices/${id}/`, payload);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },
  async remove(gymId: number, id: number): Promise<void> {
    try {
      await api.delete(`/gym-panel/gyms/${gymId}/prices/${id}/`);
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },
};
export default pricesService;

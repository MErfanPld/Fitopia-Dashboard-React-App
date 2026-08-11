import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { SingleSession } from '../../types/api';
export const sessionsService = {
  async list(gymId: number): Promise<SingleSession[]> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/single-sessions/`);
    return unwrapList<SingleSession>(data);
  },
  async create(gymId: number, payload: { customer: number; sport?: number | null; price: number }): Promise<SingleSession> {
    try { const { data } = await api.post(`/gym-panel/gyms/${gymId}/single-sessions/`, payload); return data; }
    catch (e) { throw new Error(getErrorMessage(e)); }
  },
};
export default sessionsService;

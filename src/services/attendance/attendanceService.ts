import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { AttendanceStats, GymVisit } from '../../types/api';
export const attendanceService = {
  async list(gymId: number, params?: { date?: string; is_open?: boolean }): Promise<GymVisit[]> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/attendance/`, { params });
    return unwrapList<GymVisit>(data);
  },
  async stats(gymId: number): Promise<AttendanceStats> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/attendance/stats/`);
    return data;
  },
  async checkIn(gymId: number, payload: { customer_id: number; method?: string; sport_id?: number | null }): Promise<GymVisit> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/attendance/check-in/`, {
        customer_id: payload.customer_id, method: payload.method || 'manual', sport_id: payload.sport_id ?? null,
      });
      return data;
    } catch (e) { throw new Error(getErrorMessage(e)); }
  },
  async checkOut(gymId: number, visitId: number): Promise<GymVisit> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/attendance/check-out/`, { visit_id: visitId });
      return data;
    } catch (e) { throw new Error(getErrorMessage(e)); }
  },
};
export default attendanceService;

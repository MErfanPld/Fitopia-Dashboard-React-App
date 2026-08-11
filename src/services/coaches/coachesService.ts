import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymCoach, GymCoachInput } from '../../types/api';

export const coachesService = {
  async list(gymId: number): Promise<GymCoach[]> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/coaches/`);
    return unwrapList<GymCoach>(data);
  },
  async create(gymId: number, payload: GymCoachInput): Promise<GymCoach> {
    try {
      if (payload.image instanceof File) {
        const fd = new FormData();
        fd.append('full_name', payload.full_name);
        if (payload.specialty) fd.append('specialty', payload.specialty);
        fd.append('image', payload.image);
        const { data } = await api.post(`/gym-panel/gyms/${gymId}/coaches/`, fd);
        return data;
      }
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/coaches/`, {
        full_name: payload.full_name, specialty: payload.specialty, sports: payload.sports,
      });
      return data;
    } catch (e) { throw new Error(getErrorMessage(e)); }
  },
  async update(gymId: number, id: number, payload: Partial<GymCoachInput>): Promise<GymCoach> {
    try {
      const body: Record<string, unknown> = {};
      if (payload.full_name !== undefined) body.full_name = payload.full_name;
      if (payload.specialty !== undefined) body.specialty = payload.specialty;
      if (payload.sports !== undefined) body.sports = payload.sports;
      const { data } = await api.patch(`/gym-panel/gyms/${gymId}/coaches/${id}/`, body);
      return data;
    } catch (e) { throw new Error(getErrorMessage(e)); }
  },
  async remove(gymId: number, id: number): Promise<void> {
    await api.delete(`/gym-panel/gyms/${gymId}/coaches/${id}/`);
  },
};
export default coachesService;

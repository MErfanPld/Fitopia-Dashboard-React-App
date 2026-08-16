import api, { unwrapList, getErrorMessage } from './apiClient';
import type { GymCoach, GymCoachInput } from '../types/api';

function appendCoachFormData(payload: Partial<GymCoachInput>): FormData {
  const fd = new FormData();
  if (payload.full_name !== undefined) fd.append('full_name', payload.full_name);
  if (payload.specialty !== undefined) fd.append('specialty', payload.specialty || '');
  if (payload.sports !== undefined) {
    payload.sports.forEach((id) => fd.append('sports', String(id)));
  }
  if (payload.image instanceof File) fd.append('image', payload.image);
  return fd;
}

/** Legacy coach service — prefer services/coaches/coachesService */
export const coachService = {
  async list(gymId: number): Promise<GymCoach[]> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/coaches/`);
    return unwrapList<GymCoach>(data);
  },
  async create(gymId: number, payload: GymCoachInput): Promise<GymCoach> {
    try {
      if (payload.image instanceof File) {
        const { data } = await api.post(`/gym-panel/gyms/${gymId}/coaches/`, appendCoachFormData(payload));
        return data;
      }
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/coaches/`, {
        full_name: payload.full_name,
        specialty: payload.specialty,
        sports: payload.sports,
      });
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },
  async update(gymId: number, coachId: number, payload: Partial<GymCoachInput>): Promise<GymCoach> {
    try {
      if (payload.image instanceof File) {
        const { data } = await api.patch(`/gym-panel/gyms/${gymId}/coaches/${coachId}/`, appendCoachFormData(payload));
        return data;
      }
      const body: Record<string, unknown> = {};
      if (payload.full_name !== undefined) body.full_name = payload.full_name;
      if (payload.specialty !== undefined) body.specialty = payload.specialty;
      if (payload.sports !== undefined) body.sports = payload.sports;
      const { data } = await api.patch(`/gym-panel/gyms/${gymId}/coaches/${coachId}/`, body);
      return data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },
  async remove(gymId: number, coachId: number): Promise<void> {
    try {
      await api.delete(`/gym-panel/gyms/${gymId}/coaches/${coachId}/`);
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },
};
export default coachService;

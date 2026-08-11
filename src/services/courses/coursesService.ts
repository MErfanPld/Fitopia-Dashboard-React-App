import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { Course } from '../../types/api';
export const coursesService = {
  async list(gymId: number): Promise<Course[]> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/courses/`);
    return unwrapList<Course>(data);
  },
  async get(gymId: number, id: number): Promise<Course> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/courses/${id}/`);
    return data;
  },
  async create(gymId: number, payload: Partial<Course>): Promise<Course> {
    try { const { data } = await api.post(`/gym-panel/gyms/${gymId}/courses/`, payload); return data; }
    catch (e) { throw new Error(getErrorMessage(e)); }
  },
  async update(gymId: number, id: number, payload: Partial<Course>): Promise<Course> {
    try { const { data } = await api.patch(`/gym-panel/gyms/${gymId}/courses/${id}/`, payload); return data; }
    catch (e) { throw new Error(getErrorMessage(e)); }
  },
  async remove(gymId: number, id: number): Promise<void> {
    await api.delete(`/gym-panel/gyms/${gymId}/courses/${id}/`);
  },
  async enroll(gymId: number, courseId: number, payload: { customer: number; price_paid?: number }): Promise<unknown> {
    try { const { data } = await api.post(`/gym-panel/gyms/${gymId}/courses/${courseId}/enroll/`, payload); return data; }
    catch (e) { throw new Error(getErrorMessage(e)); }
  },
};
export default coursesService;

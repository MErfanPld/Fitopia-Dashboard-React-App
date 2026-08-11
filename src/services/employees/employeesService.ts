import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { PermissionCode, StaffEmployee, StaffEmployeeInput } from '../../types/api';

export const employeesService = {
  async list(gymId: number): Promise<StaffEmployee[]> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/employees/`);
    return unwrapList<StaffEmployee>(data);
  },
  async get(gymId: number, id: number): Promise<StaffEmployee> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/employees/${id}/`);
    return data;
  },
  async create(gymId: number, payload: StaffEmployeeInput): Promise<StaffEmployee> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/employees/`, payload);
      return data;
    } catch (e) { throw new Error(getErrorMessage(e)); }
  },
  async update(gymId: number, id: number, payload: Partial<StaffEmployeeInput>): Promise<StaffEmployee> {
    try {
      const { data } = await api.patch(`/gym-panel/gyms/${gymId}/employees/${id}/`, payload);
      return data;
    } catch (e) { throw new Error(getErrorMessage(e)); }
  },
  async remove(gymId: number, id: number): Promise<void> {
    await api.delete(`/gym-panel/gyms/${gymId}/employees/${id}/`);
  },
  async setPermissions(gymId: number, id: number, codes: PermissionCode[]): Promise<void> {
    try {
      await api.put(`/gym-panel/gyms/${gymId}/employees/${id}/permissions/`, { codes });
    } catch (e) { throw new Error(getErrorMessage(e)); }
  },
};
export default employeesService;

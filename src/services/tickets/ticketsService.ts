import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { GymChangeRequest, TicketMessage } from '../../types/api';
export const ticketsService = {
  async list(gymId: number): Promise<GymChangeRequest[]> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/change-requests/list/`);
    return unwrapList<GymChangeRequest>(data);
  },
  async get(gymId: number, id: number): Promise<GymChangeRequest> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/tickets/${id}/`);
    return data;
  },
  async reply(gymId: number, ticketId: number, message: string): Promise<TicketMessage> {
    try {
      const { data } = await api.post(`/gym-panel/gyms/${gymId}/tickets/${ticketId}/messages/`, { message });
      return data;
    } catch (e) { throw new Error(getErrorMessage(e)); }
  },
};
export default ticketsService;

import api from './api';

export interface GymTicketMessage {
  id: number;
  sender_role: 'gym' | 'admin' | 'system' | string;
  message: string;
  created_at: string;
}

export interface GymChangeRequest {
  id: number;
  request_type: 'field_edit' | 'new_sport' | string;
  payload?: any;
  status: 'pending' | 'approved' | 'rejected' | string;
  admin_note?: string;
  created_at: string;
  reviewed_at?: string;
  messages?: GymTicketMessage[];
}

export const ticketService = {
  /**
   * GET /gym-panel/gyms/{gym_id}/change-requests/list/
   * List change requests / tickets for gym
   */
  async getTickets(gymId: number | string): Promise<GymChangeRequest[]> {
    const response = await api.get(`/gym-panel/gyms/${gymId}/change-requests/list/`);
    return response.data;
  },

  /**
   * GET /gym-panel/gyms/{gym_id}/tickets/{id}/
   * Single ticket details + message thread
   */
  async getTicketDetail(gymId: number | string, ticketId: number | string): Promise<GymChangeRequest> {
    const response = await api.get(`/gym-panel/gyms/${gymId}/tickets/${ticketId}/`);
    return response.data;
  },

  /**
   * POST /gym-panel/gyms/{gym_id}/tickets/{ticket_id}/messages/
   * Send a reply message in a ticket thread
   */
  async sendMessage(gymId: number | string, ticketId: number | string, message: string): Promise<GymTicketMessage> {
    const response = await api.post(`/gym-panel/gyms/${gymId}/tickets/${ticketId}/messages/`, {
      message,
    });
    return response.data;
  },
};

export default ticketService;

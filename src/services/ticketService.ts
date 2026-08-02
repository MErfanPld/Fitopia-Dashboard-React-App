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
    const localTickets: GymChangeRequest[] = JSON.parse(
      localStorage.getItem(`fitopia_tickets_${gymId}`) || '[]'
    );
    try {
      const response = await api.get(`/gym-panel/gyms/${gymId}/change-requests/list/`);
      const apiTickets: GymChangeRequest[] = Array.isArray(response.data) ? response.data : [];
      // Combine API tickets with locally saved pending tickets
      const existingIds = new Set(apiTickets.map((t) => t.id));
      const combined = [...localTickets.filter((lt) => !existingIds.has(lt.id)), ...apiTickets];
      return combined;
    } catch (err: any) {
      console.warn('Failed to fetch tickets from server, returning local tickets:', err);
      return localTickets;
    }
  },

  /**
   * GET /gym-panel/gyms/{gym_id}/tickets/{id}/
   * Single ticket details + message thread
   */
  async getTicketDetail(gymId: number | string, ticketId: number | string): Promise<GymChangeRequest> {
    try {
      const response = await api.get(`/gym-panel/gyms/${gymId}/tickets/${ticketId}/`);
      return response.data;
    } catch (err: any) {
      console.warn('Failed to fetch ticket detail from server, checking local storage:', err);
      const localTickets: GymChangeRequest[] = JSON.parse(
        localStorage.getItem(`fitopia_tickets_${gymId}`) || '[]'
      );
      const found = localTickets.find((t) => String(t.id) === String(ticketId));
      if (found) return found;
      throw err;
    }
  },

  /**
   * POST /gym-panel/gyms/{gym_id}/tickets/{ticket_id}/messages/
   * Send a reply message in a ticket thread
   */
  async sendMessage(gymId: number | string, ticketId: number | string, message: string): Promise<GymTicketMessage> {
    const newMsg: GymTicketMessage = {
      id: Date.now(),
      sender_role: 'gym',
      message,
      created_at: new Date().toISOString(),
    };

    try {
      const response = await api.post(`/gym-panel/gyms/${gymId}/tickets/${ticketId}/messages/`, {
        message,
      });
      return response.data || newMsg;
    } catch (err: any) {
      if (!err.response || err.message === 'Network Error' || err.response?.status === 404) {
        console.warn('Network error when sending message. Saving locally:', err);
        const localTickets: GymChangeRequest[] = JSON.parse(
          localStorage.getItem(`fitopia_tickets_${gymId}`) || '[]'
        );
        const ticket = localTickets.find((t) => String(t.id) === String(ticketId));
        if (ticket) {
          ticket.messages = [...(ticket.messages || []), newMsg];
          localStorage.setItem(`fitopia_tickets_${gymId}`, JSON.stringify(localTickets));
        }
        return newMsg;
      }
      throw err;
    }
  },

  /**
   * Update status of a ticket/change request (for testing/admin review simulation)
   */
  async updateTicketStatus(
    gymId: number | string,
    ticketId: number | string,
    status: 'pending' | 'approved' | 'rejected',
    adminNote?: string
  ): Promise<GymChangeRequest> {
    const localTickets: GymChangeRequest[] = JSON.parse(
      localStorage.getItem(`fitopia_tickets_${gymId}`) || '[]'
    );
    const ticket = localTickets.find((t) => String(t.id) === String(ticketId));
    if (ticket) {
      ticket.status = status;
      if (adminNote) ticket.admin_note = adminNote;
      ticket.reviewed_at = new Date().toISOString();
      ticket.messages = ticket.messages || [];
      ticket.messages.push({
        id: Date.now(),
        sender_role: 'system',
        message:
          status === 'approved'
            ? 'درخواست تغییر اطلاعات توسط پشتیبانی تایید گردید.'
            : status === 'rejected'
            ? `درخواست تغییر اطلاعات توسط پشتیبانی رد شد. ${adminNote ? 'علت: ' + adminNote : ''}`
            : 'وضعیت درخواست به در حال بررسی تغییر یافت.',
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(`fitopia_tickets_${gymId}`, JSON.stringify(localTickets));

      // If approved and has payload, apply to local overrides
      if (status === 'approved' && ticket.payload) {
        const localOverrides = JSON.parse(localStorage.getItem('fitopia_gym_overrides') || '{}');
        localOverrides[gymId] = {
          ...(localOverrides[gymId] || {}),
          ...(ticket.payload.name ? { name: ticket.payload.name } : {}),
          ...(ticket.payload.address ? { address: ticket.payload.address } : {}),
          ...(ticket.payload.latitude ? { latitude: ticket.payload.latitude } : {}),
          ...(ticket.payload.longitude ? { longitude: ticket.payload.longitude } : {}),
        };
        localStorage.setItem('fitopia_gym_overrides', JSON.stringify(localOverrides));
      }
      return ticket;
    }

    try {
      const response = await api.patch(`/gym-panel/gyms/${gymId}/change-requests/${ticketId}/`, {
        status,
        admin_note: adminNote,
      });
      return response.data;
    } catch (err: any) {
      return {
        id: Number(ticketId),
        request_type: 'field_edit',
        status,
        admin_note: adminNote,
        created_at: new Date().toISOString(),
      };
    }
  },
};

export default ticketService;

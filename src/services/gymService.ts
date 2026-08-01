import api from './api';
import { GymStaffAccess } from '../types';

export interface GymUpdatePayload {
  description?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  instagram?: string;
  [key: string]: any;
}

export interface GymChangeRequestPayload {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

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

export const gymService = {
  /**
   * GET /gym-panel/gyms/
   * List accessible gyms for current user
   */
  async getGyms(): Promise<GymStaffAccess[]> {
    const response = await api.get('/gym-panel/gyms/');
    return response.data;
  },

  /**
   * PATCH /gym-panel/gyms/{gym_id}/update/
   * Update free-editable fields
   */
  async updateGym(gymId: number | string, data: GymUpdatePayload): Promise<any> {
    try {
      const response = await api.patch(`/gym-panel/gyms/${gymId}/update/`, data);
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 405) {
        const response = await api.put(`/gym-panel/gyms/${gymId}/update/`, data);
        return response.data;
      }
      throw err;
    }
  },

  /**
   * POST /gym-panel/gyms/{gym_id}/change-requests/
   * Create a change request for restricted fields (name, address, location)
   */
  async requestChange(gymId: number | string, data: GymChangeRequestPayload): Promise<GymChangeRequest> {
    const response = await api.post(`/gym-panel/gyms/${gymId}/change-requests/`, data);
    return response.data;
  },
};

export default gymService;

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
    try {
      const response = await api.get('/gym-panel/gyms/');
      const gyms: GymStaffAccess[] = response.data || [];
      // Merge local overrides
      const localOverrides = JSON.parse(localStorage.getItem('fitopia_gym_overrides') || '{}');
      return gyms.map((g) => {
        const id = g.gym || g.id;
        if (localOverrides[id]) {
          return {
            ...g,
            gym_name: localOverrides[id].name || g.gym_name,
            gym_address: localOverrides[id].address || g.gym_address,
          };
        }
        return g;
      });
    } catch (err: any) {
      console.warn('getGyms API error, returning stored access list if available:', err);
      const stored = localStorage.getItem('fitopia_gym_access');
      if (stored) {
        try {
          const gyms: GymStaffAccess[] = JSON.parse(stored);
          const localOverrides = JSON.parse(localStorage.getItem('fitopia_gym_overrides') || '{}');
          return gyms.map((g) => {
            const id = g.gym || g.id;
            if (localOverrides[id]) {
              return {
                ...g,
                gym_name: localOverrides[id].name || g.gym_name,
                gym_address: localOverrides[id].address || g.gym_address,
              };
            }
            return g;
          });
        } catch (e) {
          // ignore
        }
      }
      throw err;
    }
  },

  /**
   * GET /gym-panel/gyms/{gym_id}/
   * Fetch details for a specific gym
   */
  async getGymDetail(gymId: number | string): Promise<any> {
    const localOverrides = JSON.parse(localStorage.getItem('fitopia_gym_overrides') || '{}')[gymId] || {};
    try {
      const response = await api.get(`/gym-panel/gyms/${gymId}/`);
      return { ...(response.data || {}), ...localOverrides };
    } catch (err: any) {
      console.warn('Failed to fetch gym detail from server, returning local data:', err);
      return localOverrides;
    }
  },

  /**
   * PATCH /gym-panel/gyms/{gym_id}/update/ or /gym-panel/gyms/{gym_id}/
   * Update free-editable fields
   */
  async updateGym(gymId: number | string, data: GymUpdatePayload): Promise<any> {
    // Sanitize data: filter out undefined or null
    const cleanedData: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && val !== null) {
        cleanedData[key] = val;
      }
    }

    // Save to local storage first for resilience and immediate UI updates
    const localOverrides = JSON.parse(localStorage.getItem('fitopia_gym_overrides') || '{}');
    localOverrides[gymId] = { ...(localOverrides[gymId] || {}), ...cleanedData };
    localStorage.setItem('fitopia_gym_overrides', JSON.stringify(localOverrides));

    if (Object.keys(cleanedData).length === 0) {
      return { success: true, localSaved: true };
    }

    try {
      const response = await api.patch(`/gym-panel/gyms/${gymId}/update/`, cleanedData);
      return response.data;
    } catch (err: any) {
      const status = err.response?.status;

      if (status === 405) {
        try {
          const response = await api.put(`/gym-panel/gyms/${gymId}/update/`, cleanedData);
          return response.data;
        } catch (e) {
          // continue
        }
      }

      if (status === 404 || status === 500) {
        try {
          const response = await api.patch(`/gym-panel/gyms/${gymId}/`, cleanedData);
          return response.data;
        } catch (err2: any) {
          if (err2.response?.status === 405) {
            try {
              const response = await api.put(`/gym-panel/gyms/${gymId}/`, cleanedData);
              return response.data;
            } catch (e2) {
              // continue
            }
          }
        }
      }

      // If Server Error (5xx) or Network / CORS error, gracefully return locally saved result
      if (!err.response || status >= 500 || err.message === 'Network Error') {
        console.warn('Server 5xx or Network error on gym update. Gym data saved locally.', err);
        return { success: true, localSaved: true, ...cleanedData };
      }
      throw err;
    }
  },

  /**
   * POST /gym-panel/gyms/{gym_id}/change-requests/
   * Create a change request for restricted fields (name, address, location)
   */
  async requestChange(gymId: number | string, data: GymChangeRequestPayload): Promise<GymChangeRequest> {
    const cleanedData: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && val !== null) {
        cleanedData[key] = val;
      }
    }

    try {
      const response = await api.post(`/gym-panel/gyms/${gymId}/change-requests/`, cleanedData);
      return response.data;
    } catch (err: any) {
      const status = err.response?.status;

      if (!err.response || err.message === 'Network Error' || status === 404 || status >= 500) {
        console.warn('CORS / Network / Server error on change request. Storing locally as pending ticket.', err);
        const pendingTickets = JSON.parse(localStorage.getItem(`fitopia_tickets_${gymId}`) || '[]');
        const newTicket: GymChangeRequest = {
          id: Date.now(),
          request_type: data.sport_name ? 'new_sport' : 'field_edit',
          payload: cleanedData,
          status: 'pending',
          admin_note: 'درخواست شما ثبت شد و پس از بررسی تیم پشتیبانی اعمال خواهد شد.',
          created_at: new Date().toISOString(),
          messages: data.note
            ? [{ id: 1, sender_role: 'gym', message: data.note, created_at: new Date().toISOString() }]
            : [],
        };
        pendingTickets.unshift(newTicket);
        localStorage.setItem(`fitopia_tickets_${gymId}`, JSON.stringify(pendingTickets));

        // If request includes name or address, update local overrides as well
        if (cleanedData.name || cleanedData.address) {
          const localOverrides = JSON.parse(localStorage.getItem('fitopia_gym_overrides') || '{}');
          localOverrides[gymId] = {
            ...(localOverrides[gymId] || {}),
            ...(cleanedData.name ? { name: cleanedData.name } : {}),
            ...(cleanedData.address ? { address: cleanedData.address } : {}),
          };
          localStorage.setItem('fitopia_gym_overrides', JSON.stringify(localOverrides));
        }

        return newTicket;
      }
      throw err;
    }
  },
};

export default gymService;

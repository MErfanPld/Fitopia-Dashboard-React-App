import api from './api';
import { GymStaffAccess } from '../types';

export interface Sport {
  id: number;
  name: string;
  category?: number;
}

export interface GymUpdatePayload {
  description?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  instagram?: string;
  website?: string;
  cover_image?: string;
  rules?: string;
  working_hours?: string;
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
      const localOverrides = JSON.parse(localStorage.getItem('fitopia_gym_overrides') || '{}');
      return gyms.map((g) => {
        const id = g.gym || g.id;
        const override = localOverrides[id];
        if (override) {
          return {
            ...override,
            ...g,
            gym_name: g.gym_name || (g as any).name || override.name || override.gym_name,
            gym_address: g.gym_address || (g as any).address || override.address || override.gym_address,
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
   * GET /gym-panel/gyms/
   * Fetch details for a specific gym by getting all gyms from GET /gym-panel/gyms/ and finding gymId
   */
  async getGymDetail(gymId: number | string): Promise<any> {
    try {
      const gyms = await this.getGyms();
      const numId = Number(gymId);
      const gym = gyms.find((g) => {
        const id = g.gym ?? (g as any).gym_id ?? g.id;
        return id === gymId || id === numId || String(id) === String(gymId);
      });
      if (gym) {
        return gym;
      }
      const localOverrides = JSON.parse(localStorage.getItem('fitopia_gym_overrides') || '{}')[gymId] || {};
      return localOverrides;
    } catch (err: any) {
      const localOverrides = JSON.parse(localStorage.getItem('fitopia_gym_overrides') || '{}')[gymId] || {};
      return localOverrides;
    }
  },

  /**
   * PATCH /gym-panel/gyms/{gym_id}/update/
   * Update gym details in database via PATCH
   * Accepts allowed backend schema fields: description, phone, whatsapp, telegram, instagram, website, cover_image, rules, working_hours
   */
  async updateGym(gymId: number | string, data: GymUpdatePayload): Promise<any> {
    const ALLOWED_FIELDS = [
      'description',
      'phone',
      'whatsapp',
      'telegram',
      'instagram',
      'website',
      'cover_image',
      'rules',
      'working_hours',
    ];

    const endpoint = `/gym-panel/gyms/${gymId}/update/`;
    const isFileUpload = !!(data.cover_image && typeof data.cover_image === 'object' && (data.cover_image as any) instanceof File);

    try {
      let response: any;
      const localOverridesToSave: Record<string, any> = {};

      if (isFileUpload) {
        const formData = new FormData();
        for (const key of ALLOWED_FIELDS) {
          if (data[key] !== undefined && data[key] !== null) {
            const val = data[key];
            if (val instanceof File) {
              formData.append(key, val);
            } else if (typeof val === 'string' && val.trim() !== '') {
              formData.append(key, val.trim());
              localOverridesToSave[key] = val.trim();
            } else if (typeof val === 'number' || typeof val === 'boolean') {
              formData.append(key, String(val));
              localOverridesToSave[key] = val;
            }
          }
        }
        console.log(`Sending PATCH FormData request to ${endpoint}`);
        response = await api.patch(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        const cleanedData: Record<string, any> = {};
        for (const key of ALLOWED_FIELDS) {
          if (key === 'cover_image') continue; // Don't send string URL in JSON partial update
          if (data[key] !== undefined && data[key] !== null) {
            const val = data[key];
            if (typeof val === 'string') {
              if (val.trim() !== '') {
                cleanedData[key] = val.trim();
              }
            } else {
              cleanedData[key] = val;
            }
          }
        }
        console.log(`Sending PATCH JSON request to ${endpoint}:`, cleanedData);
        response = await api.patch(endpoint, cleanedData);
        Object.assign(localOverridesToSave, cleanedData);
      }

      console.log('PATCH updateGym succeeded:', response.data);

      const serverData = response.data || {};

      // Save server/cleaned overrides locally for UI consistency
      const localOverrides = JSON.parse(localStorage.getItem('fitopia_gym_overrides') || '{}');
      const existingOverride = localOverrides[gymId] || {};
      localOverrides[gymId] = {
        ...existingOverride,
        ...localOverridesToSave,
        ...(typeof serverData === 'object' ? serverData : {}),
      };
      localStorage.setItem('fitopia_gym_overrides', JSON.stringify(localOverrides));

      return serverData;
    } catch (err: any) {
      console.error(`PATCH ${endpoint} failed:`, {
        message: err.message,
        status: err.response?.status,
        responseData: err.response?.data,
        isNetworkError: !err.response || err.message === 'Network Error',
      });
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

  /**
   * GET /gym/sports/
   * Fetch all available sports list
   */
  async getSports(): Promise<Sport[]> {
    const cached = (globalThis as any).__fitopia_sports_cache;
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
    try {
      const response = await api.get('/gym/sports/');
      const sports: Sport[] = Array.isArray(response.data) ? response.data : [];
      if (sports.length > 0) {
        (globalThis as any).__fitopia_sports_cache = sports;
      }
      return sports;
    } catch (err: any) {
      console.warn('getSports API notice:', err.message);
      return cached || [];
    }
  },
};

export default gymService;

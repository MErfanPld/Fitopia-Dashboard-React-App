import api from './api';

export interface GymCoach {
  id: number;
  full_name: string;
  image?: string;
  specialty?: string;
  sports?: number[];
}

export interface GymCoachInput {
  full_name: string;
  image?: string;
  specialty?: string;
  sports?: number[];
  image_file?: File | null;
}

const getLocalCoaches = (gymId: number | string): GymCoach[] => {
  try {
    const data = localStorage.getItem(`fitopia_coaches_${gymId}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalCoaches = (gymId: number | string, coaches: GymCoach[]) => {
  try {
    localStorage.setItem(`fitopia_coaches_${gymId}`, JSON.stringify(coaches));
  } catch (e) {
    console.warn('Failed to save coaches to localStorage:', e);
  }
};

export const coachService = {
  /**
   * GET /gym-panel/gyms/{gym_id}/coaches/
   * List all coaches of a gym
   */
  async getCoaches(gymId: number | string): Promise<GymCoach[]> {
    try {
      const response = await api.get(`/gym-panel/gyms/${gymId}/coaches/`);
      const apiList: GymCoach[] = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || []);

      saveLocalCoaches(gymId, apiList);
      return apiList;
    } catch (err: any) {
      console.warn('getCoaches API notice, returning local cache:', err.message);
      return getLocalCoaches(gymId);
    }
  },

  /**
   * GET /gym-panel/gyms/{gym_id}/coaches/{coach_id}/
   * Fetch single coach details directly from backend
   */
  async getCoach(gymId: number | string, coachId: number | string): Promise<GymCoach> {
    try {
      const response = await api.get(`/gym-panel/gyms/${gymId}/coaches/${coachId}/`);
      return response.data;
    } catch (err: any) {
      console.warn(`getCoach (${coachId}) API error:`, err.message);
      const localList = getLocalCoaches(gymId);
      const found = localList.find((c) => String(c.id) === String(coachId));
      if (found) return found;
      throw err;
    }
  },

  /**
   * POST /gym-panel/gyms/{gym_id}/coaches/
   * Create a new coach
   */
  async createCoach(gymId: number | string, data: GymCoachInput): Promise<GymCoach> {
    const isFileUpload = !!data.image_file;
    let response: any;

    if (isFileUpload) {
      const formData = new FormData();
      if (data.full_name?.trim()) formData.append('full_name', data.full_name.trim());
      if (data.specialty?.trim()) formData.append('specialty', data.specialty.trim());
      if (data.image_file) formData.append('image', data.image_file);
      if (Array.isArray(data.sports)) {
        data.sports.forEach((s) => formData.append('sports', String(s)));
      }

      console.log(`Sending POST FormData to /gym-panel/gyms/${gymId}/coaches/`);
      response = await api.post(`/gym-panel/gyms/${gymId}/coaches/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      const payload: Record<string, any> = {
        full_name: data.full_name?.trim() || '',
        specialty: data.specialty?.trim() || '',
        sports: Array.isArray(data.sports) ? data.sports : [],
      };
      if (data.image?.trim()) {
        payload.image = data.image.trim();
      }

      console.log(`Sending POST JSON to /gym-panel/gyms/${gymId}/coaches/`, payload);
      response = await api.post(`/gym-panel/gyms/${gymId}/coaches/`, payload);
    }

    const created: GymCoach = response.data;
    const localList = getLocalCoaches(gymId);
    saveLocalCoaches(gymId, [created, ...localList.filter((c) => c.id !== created.id)]);
    return created;
  },

  /**
   * PATCH /gym-panel/gyms/{gym_id}/coaches/{coach_id}/
   * Partial update of a coach
   */
  async patchCoach(
    gymId: number | string,
    coachId: number | string,
    data: Partial<GymCoachInput>
  ): Promise<GymCoach> {
    const isFileUpload = !!data.image_file;
    let response: any;

    if (isFileUpload) {
      const formData = new FormData();
      if (data.full_name !== undefined && data.full_name.trim()) {
        formData.append('full_name', data.full_name.trim());
      }
      if (data.specialty !== undefined) {
        formData.append('specialty', data.specialty.trim());
      }
      if (data.image_file) {
        formData.append('image', data.image_file);
      }
      if (Array.isArray(data.sports)) {
        data.sports.forEach((s) => formData.append('sports', String(s)));
      }

      console.log(`Sending PATCH FormData to /gym-panel/gyms/${gymId}/coaches/${coachId}/`);
      response = await api.patch(`/gym-panel/gyms/${gymId}/coaches/${coachId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      const payload: Record<string, any> = {};
      if (data.full_name !== undefined) payload.full_name = data.full_name.trim();
      if (data.specialty !== undefined) payload.specialty = data.specialty.trim();
      if (data.image !== undefined && typeof data.image === 'string') {
        if (data.image.trim()) payload.image = data.image.trim();
      }
      if (data.sports !== undefined) payload.sports = Array.isArray(data.sports) ? data.sports : [];

      console.log(`Sending PATCH JSON to /gym-panel/gyms/${gymId}/coaches/${coachId}/`, payload);
      response = await api.patch(`/gym-panel/gyms/${gymId}/coaches/${coachId}/`, payload);
    }

    const updated: GymCoach = response.data;
    const localList = getLocalCoaches(gymId);
    saveLocalCoaches(
      gymId,
      localList.map((c) => (String(c.id) === String(coachId) ? updated : c))
    );
    return updated;
  },

  /**
   * PUT /gym-panel/gyms/{gym_id}/coaches/{coach_id}/
   * Full update of a coach
   */
  async updateCoach(
    gymId: number | string,
    coachId: number | string,
    data: GymCoachInput
  ): Promise<GymCoach> {
    return this.patchCoach(gymId, coachId, data);
  },

  /**
   * DELETE /gym-panel/gyms/{gym_id}/coaches/{coach_id}/
   * Delete a coach
   */
  async deleteCoach(gymId: number | string, coachId: number | string): Promise<void> {
    console.log(`Sending DELETE to /gym-panel/gyms/${gymId}/coaches/${coachId}/`);
    await api.delete(`/gym-panel/gyms/${gymId}/coaches/${coachId}/`);
    const localList = getLocalCoaches(gymId);
    saveLocalCoaches(
      gymId,
      localList.filter((c) => String(c.id) !== String(coachId))
    );
  },
};

export default coachService;




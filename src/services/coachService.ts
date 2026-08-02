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
   */
  async getCoaches(gymId: number | string): Promise<GymCoach[]> {
    const localList = getLocalCoaches(gymId);
    try {
      const response = await api.get(`/gym-panel/gyms/${gymId}/coaches/`);
      const apiList: GymCoach[] = Array.isArray(response.data) ? response.data : [];
      
      const apiIds = new Set(apiList.map((c) => String(c.id)));
      const extraLocal = localList.filter((c) => !apiIds.has(String(c.id)));
      const combined = [...apiList, ...extraLocal];
      
      saveLocalCoaches(gymId, combined);
      return combined;
    } catch (err: any) {
      console.warn('getCoaches API notice:', err.message);
      return localList;
    }
  },

  /**
   * POST /gym-panel/gyms/{gym_id}/coaches/
   */
  async createCoach(gymId: number | string, data: GymCoachInput): Promise<GymCoach> {
    const payload = {
      full_name: data.full_name?.trim() || '',
      image: data.image?.trim() || '',
      specialty: data.specialty?.trim() || '',
      sports: Array.isArray(data.sports) ? data.sports : [],
    };

    const localList = getLocalCoaches(gymId);
    const newLocalCoach: GymCoach = {
      id: Date.now(),
      ...payload,
    };

    try {
      const response = await api.post(`/gym-panel/gyms/${gymId}/coaches/`, payload);
      const created: GymCoach = response.data || newLocalCoach;
      const updatedList = [created, ...localList.filter((c) => String(c.id) !== String(created.id))];
      saveLocalCoaches(gymId, updatedList);
      return created;
    } catch (err: any) {
      console.warn('createCoach API notice, saving coach locally:', err.message);
      const updatedList = [newLocalCoach, ...localList];
      saveLocalCoaches(gymId, updatedList);
      return newLocalCoach;
    }
  },

  /**
   * GET /gym-panel/gyms/{gym_id}/coaches/{coach_id}/
   */
  async getCoach(gymId: number | string, coachId: number | string): Promise<GymCoach> {
    try {
      const response = await api.get(`/gym-panel/gyms/${gymId}/coaches/${coachId}/`);
      return response.data;
    } catch (err: any) {
      const localList = getLocalCoaches(gymId);
      const found = localList.find((c) => String(c.id) === String(coachId));
      if (found) return found;
      throw err;
    }
  },

  /**
   * PUT /gym-panel/gyms/{gym_id}/coaches/{coach_id}/
   */
  async updateCoach(
    gymId: number | string,
    coachId: number | string,
    data: Partial<GymCoachInput>
  ): Promise<GymCoach> {
    const numericCoachId = Number(coachId) || Date.now();

    const payloadWithId = {
      id: numericCoachId,
      full_name: data.full_name?.trim() || '',
      image: data.image?.trim() || '',
      specialty: data.specialty?.trim() || '',
      sports: Array.isArray(data.sports) ? data.sports : [],
    };

    const payloadWithoutId = {
      full_name: payloadWithId.full_name,
      image: payloadWithId.image,
      specialty: payloadWithId.specialty,
      sports: payloadWithId.sports,
    };

    // Immediate local state update for quick UI feedback
    const localList = getLocalCoaches(gymId);
    let updatedCoach: GymCoach = payloadWithId;
    const existingIdx = localList.findIndex((c) => String(c.id) === String(coachId));

    if (existingIdx >= 0) {
      updatedCoach = { ...localList[existingIdx], ...payloadWithId };
      localList[existingIdx] = updatedCoach;
    } else {
      localList.push(updatedCoach);
    }
    saveLocalCoaches(gymId, localList);

    // Try PUT with payload variants
    for (const body of [payloadWithId, payloadWithoutId]) {
      try {
        const response = await api.put(`/gym-panel/gyms/${gymId}/coaches/${coachId}/`, body);
        if (response && response.data) {
          const serverCoach: GymCoach = response.data;
          const finalList = getLocalCoaches(gymId).map((c) =>
            String(c.id) === String(coachId) ? { ...c, ...serverCoach } : c
          );
          saveLocalCoaches(gymId, finalList);
          return serverCoach;
        }
      } catch (err: any) {
        console.warn(`PUT /gym-panel/gyms/${gymId}/coaches/${coachId}/ notice:`, err.response?.data || err.message);
      }
    }

    return updatedCoach;
  },

  /**
   * DELETE /gym-panel/gyms/{gym_id}/coaches/{coach_id}/
   */
  async deleteCoach(gymId: number | string, coachId: number | string): Promise<void> {
    const localList = getLocalCoaches(gymId);
    const filtered = localList.filter((c) => String(c.id) !== String(coachId));
    saveLocalCoaches(gymId, filtered);

    try {
      await api.delete(`/gym-panel/gyms/${gymId}/coaches/${coachId}/`);
    } catch (err: any) {
      console.warn('deleteCoach API notice:', err.message);
    }
  },
};

export default coachService;



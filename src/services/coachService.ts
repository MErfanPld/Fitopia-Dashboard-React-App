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

export const coachService = {
  /**
   * GET /gym-panel/gyms/{gym_id}/coaches/
   */
  async getCoaches(gymId: number | string): Promise<GymCoach[]> {
    const response = await api.get(`/gym-panel/gyms/${gymId}/coaches/`);
    return response.data;
  },

  /**
   * POST /gym-panel/gyms/{gym_id}/coaches/
   */
  async createCoach(gymId: number | string, data: GymCoachInput): Promise<GymCoach> {
    const response = await api.post(`/gym-panel/gyms/${gymId}/coaches/`, data);
    return response.data;
  },

  /**
   * GET /gym-panel/gyms/{gym_id}/coaches/{id}/
   */
  async getCoach(gymId: number | string, coachId: number | string): Promise<GymCoach> {
    const response = await api.get(`/gym-panel/gyms/${gymId}/coaches/${coachId}/`);
    return response.data;
  },

  /**
   * PATCH /gym-panel/gyms/{gym_id}/coaches/{id}/
   */
  async updateCoach(gymId: number | string, coachId: number | string, data: Partial<GymCoachInput>): Promise<GymCoach> {
    const response = await api.patch(`/gym-panel/gyms/${gymId}/coaches/${coachId}/`, data);
    return response.data;
  },

  /**
   * DELETE /gym-panel/gyms/{gym_id}/coaches/{id}/
   */
  async deleteCoach(gymId: number | string, coachId: number | string): Promise<void> {
    await api.delete(`/gym-panel/gyms/${gymId}/coaches/${coachId}/`);
  },
};

export default coachService;

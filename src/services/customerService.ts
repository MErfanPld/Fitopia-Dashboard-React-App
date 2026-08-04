import api from './api';

export interface GymCustomer {
  id: number;
  full_name: string;
  phone: string;
  sport?: number | null;
  sport_name?: string;
  join_date?: string;
  is_fitopia_user?: string | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GymCustomerInput {
  full_name: string;
  phone: string;
  sport?: number | null;
  join_date?: string;
}

export const customerService = {
  /**
   * GET /gym-panel/gyms/{gym_id}/customers/
   */
  async getCustomers(gymId: number | string): Promise<GymCustomer[]> {
    const response = await api.get(`/gym-panel/gyms/${gymId}/customers/`);
    return Array.isArray(response.data) ? response.data : response.data?.results || [];
  },

  /**
   * POST /gym-panel/gyms/{gym_id}/customers/
   */
  async createCustomer(gymId: number | string, data: GymCustomerInput): Promise<GymCustomer> {
    const payload: any = {
      full_name: data.full_name.trim(),
      phone: data.phone.trim(),
    };
    if (data.sport !== undefined && data.sport !== null) {
      payload.sport = data.sport;
    }
    if (data.join_date && data.join_date.trim()) {
      payload.join_date = data.join_date.trim();
    }

    const response = await api.post(`/gym-panel/gyms/${gymId}/customers/`, payload);
    return response.data;
  },

  /**
   * GET /gym-panel/gyms/{gym_id}/customers/{customer_id}/
   */
  async getCustomer(gymId: number | string, customerId: number | string): Promise<GymCustomer> {
    const response = await api.get(`/gym-panel/gyms/${gymId}/customers/${customerId}/`);
    return response.data;
  },

  /**
   * PATCH /gym-panel/gyms/{gym_id}/customers/{customer_id}/
   */
  async patchCustomer(
    gymId: number | string,
    customerId: number | string,
    data: Partial<GymCustomerInput>
  ): Promise<GymCustomer> {
    const response = await api.patch(`/gym-panel/gyms/${gymId}/customers/${customerId}/`, data);
    return response.data;
  },

  /**
   * DELETE /gym-panel/gyms/{gym_id}/customers/{customer_id}/
   */
  async deleteCustomer(gymId: number | string, customerId: number | string): Promise<void> {
    await api.delete(`/gym-panel/gyms/${gymId}/customers/${customerId}/`);
  },
};

export default customerService;


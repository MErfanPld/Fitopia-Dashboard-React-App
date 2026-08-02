import api from './api';

export interface GymCustomer {
  id: number;
  full_name: string;
  phone?: string;
  email?: string;
  national_code?: string;
  gender?: string;
  status?: string;
  image?: string;
  join_date?: string;
  gym?: number;
  [key: string]: any;
}

export interface GymCustomerInput {
  full_name: string;
  phone?: string;
  email?: string;
  national_code?: string;
  gender?: string;
  status?: string;
  image?: string;
}

const getLocalCustomers = (gymId: number | string): GymCustomer[] => {
  try {
    const data = localStorage.getItem(`fitopia_customers_${gymId}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalCustomers = (gymId: number | string, customers: GymCustomer[]) => {
  try {
    localStorage.setItem(`fitopia_customers_${gymId}`, JSON.stringify(customers));
  } catch (e) {
    console.warn('Failed to save customers to localStorage:', e);
  }
};

export const customerService = {
  /**
   * GET /gym-panel/gyms/{gym_id}/customers/
   */
  async getCustomers(gymId: number | string): Promise<GymCustomer[]> {
    const localList = getLocalCustomers(gymId);
    try {
      const response = await api.get(`/gym-panel/gyms/${gymId}/customers/`);
      const apiList: GymCustomer[] = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      const apiIds = new Set(apiList.map((c) => String(c.id)));
      const extraLocal = localList.filter((c) => !apiIds.has(String(c.id)));
      const combined = [...apiList, ...extraLocal];

      saveLocalCustomers(gymId, combined);
      return combined;
    } catch (err: any) {
      console.warn('getCustomers API notice:', err.message);
      return localList;
    }
  },

  /**
   * POST /gym-panel/gyms/{gym_id}/customers/
   */
  async createCustomer(gymId: number | string, data: GymCustomerInput): Promise<GymCustomer> {
    const payload = {
      full_name: data.full_name?.trim() || '',
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      national_code: data.national_code?.trim() || '',
      gender: data.gender || 'male',
      status: data.status || 'active',
      image: data.image?.trim() || '',
    };

    const localList = getLocalCustomers(gymId);
    const newLocalCustomer: GymCustomer = {
      id: Date.now(),
      gym: Number(gymId) || 0,
      join_date: new Date().toISOString().split('T')[0],
      ...payload,
    };

    try {
      const response = await api.post(`/gym-panel/gyms/${gymId}/customers/`, payload);
      const created: GymCustomer = response.data || newLocalCustomer;
      const updatedList = [created, ...localList.filter((c) => String(c.id) !== String(created.id))];
      saveLocalCustomers(gymId, updatedList);
      return created;
    } catch (err: any) {
      console.warn('createCustomer API notice, saving customer locally:', err.message);
      const updatedList = [newLocalCustomer, ...localList];
      saveLocalCustomers(gymId, updatedList);
      return newLocalCustomer;
    }
  },

  /**
   * GET /gym-panel/gyms/{gym_id}/customers/{customer_id}/
   */
  async getCustomer(gymId: number | string, customerId: number | string): Promise<GymCustomer> {
    try {
      const response = await api.get(`/gym-panel/gyms/${gymId}/customers/${customerId}/`);
      return response.data;
    } catch (err: any) {
      const localList = getLocalCustomers(gymId);
      const found = localList.find((c) => String(c.id) === String(customerId));
      if (found) return found;
      throw err;
    }
  },

  /**
   * PUT /gym-panel/gyms/{gym_id}/customers/{customer_id}/
   */
  async updateCustomer(
    gymId: number | string,
    customerId: number | string,
    data: Partial<GymCustomerInput>
  ): Promise<GymCustomer> {
    const numericCustomerId = Number(customerId) || Date.now();

    const payloadWithId = {
      id: numericCustomerId,
      full_name: data.full_name?.trim() || '',
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      national_code: data.national_code?.trim() || '',
      gender: data.gender || 'male',
      status: data.status || 'active',
      image: data.image?.trim() || '',
    };

    const payloadWithoutId = {
      full_name: payloadWithId.full_name,
      phone: payloadWithId.phone,
      email: payloadWithId.email,
      national_code: payloadWithId.national_code,
      gender: payloadWithId.gender,
      status: payloadWithId.status,
      image: payloadWithId.image,
    };

    // Immediate local state update for instant response
    const localList = getLocalCustomers(gymId);
    let updatedCustomer: GymCustomer = payloadWithId;
    const existingIdx = localList.findIndex((c) => String(c.id) === String(customerId));

    if (existingIdx >= 0) {
      updatedCustomer = { ...localList[existingIdx], ...payloadWithId };
      localList[existingIdx] = updatedCustomer;
    } else {
      localList.push(updatedCustomer);
    }
    saveLocalCustomers(gymId, localList);

    // Try PUT / PATCH with payload variants
    for (const body of [payloadWithId, payloadWithoutId]) {
      try {
        const response = await api.put(`/gym-panel/gyms/${gymId}/customers/${customerId}/`, body);
        if (response && response.data) {
          const serverCustomer: GymCustomer = response.data;
          const finalList = getLocalCustomers(gymId).map((c) =>
            String(c.id) === String(customerId) ? { ...c, ...serverCustomer } : c
          );
          saveLocalCustomers(gymId, finalList);
          return serverCustomer;
        }
      } catch (err: any) {
        console.warn(`PUT /gym-panel/gyms/${gymId}/customers/${customerId}/ notice:`, err.response?.data || err.message);
      }
    }

    return updatedCustomer;
  },

  /**
   * DELETE /gym-panel/gyms/{gym_id}/customers/{customer_id}/
   */
  async deleteCustomer(gymId: number | string, customerId: number | string): Promise<void> {
    const localList = getLocalCustomers(gymId);
    const filtered = localList.filter((c) => String(c.id) !== String(customerId));
    saveLocalCustomers(gymId, filtered);

    try {
      await api.delete(`/gym-panel/gyms/${gymId}/customers/${customerId}/`);
    } catch (err: any) {
      console.warn('deleteCustomer API notice:', err.message);
    }
  },
};

export default customerService;

import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { CustomerPayment, FinanceReport, FinanceTransaction, Refund } from '../../types/api';
export const financeService = {
  async listTransactions(gymId: number): Promise<FinanceTransaction[]> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/finance/transactions/`);
    return unwrapList<FinanceTransaction>(data);
  },
  async createTransaction(gymId: number, payload: Partial<FinanceTransaction>): Promise<FinanceTransaction> {
    try { const { data } = await api.post(`/gym-panel/gyms/${gymId}/finance/transactions/`, payload); return data; }
    catch (e) { throw new Error(getErrorMessage(e)); }
  },
  async listPayments(gymId: number): Promise<CustomerPayment[]> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/finance/payments/`);
    return unwrapList<CustomerPayment>(data);
  },
  async createPayment(gymId: number, payload: Partial<CustomerPayment>): Promise<CustomerPayment> {
    try { const { data } = await api.post(`/gym-panel/gyms/${gymId}/finance/payments/`, payload); return data; }
    catch (e) { throw new Error(getErrorMessage(e)); }
  },
  async createRefund(gymId: number, payload: { original_transaction: number; amount: number; reason?: string }): Promise<Refund> {
    try { const { data } = await api.post(`/gym-panel/gyms/${gymId}/finance/refunds/`, payload); return data; }
    catch (e) { throw new Error(getErrorMessage(e)); }
  },
  async report(gymId: number): Promise<FinanceReport> {
    const { data } = await api.get(`/gym-panel/gyms/${gymId}/finance/reports/`);
    return data;
  },
};
export default financeService;

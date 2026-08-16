import api, { unwrapList, getErrorMessage } from '../apiClient';
import type { Sport, SportCategory } from '../../types/api';

/** Public catalog endpoints from OpenAPI: /api/gym/categories/, /api/gym/sports/ */
export const sportsService = {
  async listCategories(): Promise<SportCategory[]> {
    const { data } = await api.get('/gym/categories/');
    return unwrapList<SportCategory>(data);
  },
  async listSports(): Promise<Sport[]> {
    const { data } = await api.get('/gym/sports/');
    return unwrapList<Sport>(data);
  },
};
export default sportsService;

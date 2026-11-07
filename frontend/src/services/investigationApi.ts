import { apiClient } from './api';
import { Investigation, InvestigationListResponse } from '../types/investigation';

export const investigationApi = {
  create: async (data: { title: string; case_ref?: string; description?: string }): Promise<Investigation> => {
    const res = await apiClient.post<Investigation>('/investigations', data);
    return res.data;
  },

  list: async (skip = 0, limit = 50, status?: string): Promise<InvestigationListResponse> => {
    const res = await apiClient.get<InvestigationListResponse>('/investigations', {
      params: { skip, limit, status },
    });
    return res.data;
  },

  getById: async (id: string): Promise<Investigation> => {
    const res = await apiClient.get<Investigation>(`/investigations/${id}`);
    return res.data;
  },

  triggerAnalysis: async (id: string): Promise<{ message: string; status: string }> => {
    const res = await apiClient.post(`/investigations/${id}/analyze`);
    return res.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/investigations/${id}`);
    return res.data;
  },
};


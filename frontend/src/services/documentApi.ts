import { apiClient, API_BASE_URL } from './api';
import { DocumentItem, DocumentFieldsResponse } from '../types/document';

export const documentApi = {
  upload: async (investigationId: string, files: File[]): Promise<DocumentItem[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const res = await apiClient.post<DocumentItem[]>(
      `/investigations/${investigationId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },

  listByInvestigation: async (investigationId: string): Promise<DocumentItem[]> => {
    const res = await apiClient.get<DocumentItem[]>(`/investigations/${investigationId}/documents`);
    return res.data;
  },

  getById: async (documentId: string): Promise<DocumentItem> => {
    const res = await apiClient.get<DocumentItem>(`/documents/${documentId}`);
    return res.data;
  },

  getFields: async (documentId: string): Promise<DocumentFieldsResponse> => {
    const res = await apiClient.get<DocumentFieldsResponse>(`/documents/${documentId}/fields`);
    return res.data;
  },

  getPreviewUrl: (documentId: string, page = 1, dpi = 150): string => {
    return `${API_BASE_URL}/documents/${documentId}/preview?page=${page}&dpi=${dpi}`;
  },

  retry: async (documentId: string): Promise<{ message: string; status: string }> => {
    const res = await apiClient.post(`/documents/${documentId}/retry`);
    return res.data;
  },
};


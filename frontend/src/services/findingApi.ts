import { apiClient, API_BASE_URL } from './api';
import { Finding, CrossDocumentComparisonResponse } from '../types/finding';

export const findingApi = {
  listByInvestigation: async (
    investigationId: string,
    filters?: { severity?: string; category?: string; review_status?: string }
  ): Promise<Finding[]> => {
    const res = await apiClient.get<Finding[]>(`/investigations/${investigationId}/findings`, {
      params: filters,
    });
    return res.data;
  },

  getComparison: async (investigationId: string): Promise<CrossDocumentComparisonResponse> => {
    const res = await apiClient.get<CrossDocumentComparisonResponse>(
      `/investigations/${investigationId}/comparison`
    );
    return res.data;
  },

  updateReview: async (
    findingId: string,
    reviewStatus: string,
    reviewerNotes?: string
  ): Promise<Finding> => {
    const res = await apiClient.patch<Finding>(`/findings/${findingId}/review`, {
      review_status: reviewStatus,
      reviewer_notes: reviewerNotes,
    });
    return res.data;
  },

  getReportDownloadUrl: (investigationId: string): string => {
    return `${API_BASE_URL}/investigations/${investigationId}/report/download`;
  },
};


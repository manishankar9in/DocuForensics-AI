import { apiClient } from './api';

export interface HealthResponse {
  status: string;
  app_env: string;
  database: {
    mode: string;
    connected: boolean;
  };
  ocr: {
    engine: string;
    available: boolean;
  };
  storage: {
    mode: string;
    path: string;
  };
  llm: {
    provider: string;
    configured: boolean;
  };
}

export const healthApi = {
  getHealth: async (): Promise<HealthResponse> => {
    const res = await apiClient.get<HealthResponse>('/health');
    return res.data;
  },
};


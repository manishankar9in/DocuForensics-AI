import axios from 'axios';

const localHost = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? window.location.hostname
  : '127.0.0.1';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `http://${localHost}:8000/api`;

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorDetail =
      error.response?.data?.detail || error.response?.data?.error || error.message;
    console.error('[API Error]:', errorDetail);
    return Promise.reject(new ApiError(errorDetail, error.response?.status));
  }
);

import { apiClient } from './api';
import { AuthUser } from '../types/auth';

export const authApi = {
  signUp: async (email: string, password: string): Promise<AuthUser> => {
    const response = await apiClient.post<AuthUser>('/auth/signup', { email, password });
    return response.data;
  },

  logIn: async (email: string, password: string): Promise<AuthUser> => {
    const response = await apiClient.post<AuthUser>('/auth/login', { email, password });
    return response.data;
  },

  currentUser: async (): Promise<AuthUser> => {
    const response = await apiClient.get<AuthUser>('/auth/me');
    return response.data;
  },

  logOut: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};

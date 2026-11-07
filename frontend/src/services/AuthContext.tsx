import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from './api';
import { authApi } from './authApi';
import { AuthUser } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  acceptUser: (user: AuthUser) => void;
  refresh: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const queryClient = useQueryClient();
  const requestId = useRef(0);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const currentUser = await authApi.currentUser();
      if (requestId.current === currentRequestId) {
        setUser(currentUser);
      }
    } catch (requestError) {
      if (requestId.current === currentRequestId) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          setUser(null);
        } else {
          setError(requestError instanceof Error ? requestError.message : 'Unable to verify your session.');
        }
      }
    } finally {
      if (requestId.current === currentRequestId) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const acceptUser = useCallback(
    (authenticatedUser: AuthUser) => {
      requestId.current += 1;
      queryClient.clear();
      setError(null);
      setIsLoading(false);
      setUser(authenticatedUser);
    },
    [queryClient]
  );

  const logOut = useCallback(async () => {
    requestId.current += 1;
    await authApi.logOut();
    queryClient.clear();
    setUser(null);
    setError(null);
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, isLoading, error, acceptUser, refresh, logOut }),
    [user, isLoading, error, acceptUser, refresh, logOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
};

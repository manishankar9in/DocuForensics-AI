import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoaderCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { Button } from '../common/Button';

export const ProtectedRoute: React.FC = () => {
  const { user, isLoading, error, refresh } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070B12] text-[#A7B4C7]">
        <div className="flex items-center gap-3 text-sm">
          <LoaderCircle className="w-5 h-5 animate-spin text-[#20B8A6]" />
          Verifying your session...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070B12] px-6">
        <div className="max-w-md rounded-xl border border-[#243247] bg-[#121B29] p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 h-8 w-8 text-[#F59E0B]" />
          <h1 className="text-lg font-semibold text-[#F1F5F9]">Could not verify your session</h1>
          <p className="mt-2 text-sm text-[#A7B4C7]">{error}</p>
          <Button className="mt-5" variant="primary" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};

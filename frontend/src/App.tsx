import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { NewInvestigationPage } from './pages/NewInvestigationPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { DocumentViewerPage } from './pages/DocumentViewerPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { FindingsPage } from './pages/FindingsPage';
import { DossierPage } from './pages/DossierPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './services/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/investigations/new" element={<NewInvestigationPage />} />
              <Route path="/investigations" element={<HistoryPage />} />
              <Route path="/investigations/:investigationId" element={<WorkspacePage />} />
              <Route
                path="/investigations/:investigationId/documents/:documentId"
                element={<DocumentViewerPage />}
              />
              <Route path="/investigations/:investigationId/compare" element={<ComparisonPage />} />
              <Route path="/investigations/:investigationId/findings" element={<FindingsPage />} />
              <Route path="/investigations/:investigationId/report" element={<DossierPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

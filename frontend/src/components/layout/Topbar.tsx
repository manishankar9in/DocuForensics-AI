import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Database, Cpu, LogOut, Menu, User, ShieldCheck } from 'lucide-react';
import { healthApi } from '../../services/healthApi';
import { useAuth } from '../../services/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const pathParts = location.pathname.split('/').filter(Boolean);

  const handleLogOut = async () => {
    try {
      await logOut();
      navigate('/', { replace: true });
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Unable to sign out.');
    }
  };

  const { data: health } = useQuery({
    queryKey: ['system-health-topbar'],
    queryFn: healthApi.getHealth,
    refetchInterval: 30000,
  });

  const dbConnected = health?.database?.connected ?? true;
  const ocrAvailable = health?.ocr?.available ?? false;

  return (
    <header className="h-16 bg-[#0D1420] border-b border-[#243247] flex items-center justify-between px-6 shrink-0">
      {/* Left: Navigation Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {logoutError && <span role="alert" className="hidden text-[10px] text-[#FCA5A5] xl:inline">{logoutError}</span>}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 -ml-1.5 text-[#A7B4C7] hover:text-[#F1F5F9] hover:bg-[#172235] rounded lg:hidden"
          title="Toggle Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <nav className="flex items-center gap-1.5 text-xs text-[#A7B4C7]">
          <Link to="/dashboard" className="hover:text-[#F1F5F9] font-medium text-[#A7B4C7] transition-colors">
            Workspace
          </Link>
          {pathParts.map((part, index) => {
            const url = `/${pathParts.slice(0, index + 1).join('/')}`;
            const isLast = index === pathParts.length - 1;
            const displayLabel =
              part === 'investigations'
                ? 'Investigations'
                : part === 'new'
                ? 'Intake'
                : part === 'compare'
                ? 'Cross-Compare'
                : part === 'findings'
                ? 'Findings Registry'
                : part === 'report'
                ? 'Dossier'
                : part === 'documents'
                ? 'Viewer'
                : part === 'settings'
                ? 'Settings'
                : part.length > 14
                ? `${part.slice(0, 10)}...`
                : part;

            return (
              <React.Fragment key={url}>
                <ChevronRight className="w-3.5 h-3.5 text-[#4B5A70]" />
                {isLast ? (
                  <span className="font-semibold text-[#F1F5F9] capitalize">{displayLabel}</span>
                ) : (
                  <Link to={url} className="text-[#A7B4C7] hover:text-[#F1F5F9] capitalize transition-colors font-medium">
                    {displayLabel}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Real Engine & System Status */}
      <div className="flex items-center gap-3">
        {/* Live System Operational Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#121B29] border border-[#243247] text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              dbConnected ? 'bg-[#22C55E] animate-pulse' : 'bg-[#EF4444]'
            }`}
          />
          <span className="text-[#F1F5F9]">
            {dbConnected ? 'System Operational' : 'Offline'}
          </span>
          <span className="text-[#718096] text-[10px]">
            ({health?.database?.mode === 'mongodb' ? 'Atlas' : 'Local Store'})
          </span>
        </div>

        {/* OCR Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#121B29] border border-[#243247] text-xs font-mono text-[#A7B4C7]">
          <Cpu className="w-3.5 h-3.5 text-[#20B8A6]" />
          <span>{ocrAvailable ? 'Tesseract OCR' : 'PyMuPDF'}</span>
        </div>

        {/* Examiner Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#243247]">
          <div className="w-7 h-7 rounded-full bg-[#172235] border border-[#243247] flex items-center justify-center text-[#20B8A6]">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="max-w-[170px] truncate text-xs text-[#A7B4C7] font-medium hidden md:inline">
            {user?.email || 'Examiner Console'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogOut}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-[#A7B4C7] transition-colors hover:bg-[#172235] hover:text-white"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
};

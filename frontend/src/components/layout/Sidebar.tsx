import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderPlus,
  FileSearch,
  Scale,
  AlertTriangle,
  FileText,
  History,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  FolderArchive,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const { investigationId } = useParams<{ investigationId?: string }>();

  const mainNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Investigations', path: '/investigations', icon: FolderArchive },
    { label: 'New Investigation', path: '/investigations/new', icon: FolderPlus },
  ];

  const caseNavItems = investigationId
    ? [
        { label: 'Case Workspace', path: `/investigations/${investigationId}`, icon: FileSearch },
        { label: 'Cross-Compare', path: `/investigations/${investigationId}/compare`, icon: Scale },
        { label: 'Findings Registry', path: `/investigations/${investigationId}/findings`, icon: AlertTriangle },
        { label: 'Audit Dossier', path: `/investigations/${investigationId}/report`, icon: FileText },
      ]
    : [];

  return (
    <aside
      className={`bg-[#0D1420] border-r border-[#243247] flex flex-col h-screen select-none shrink-0 transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-[250px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 border-b border-[#243247] flex items-center justify-between px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-[8px] bg-[#20B8A6]/10 border border-[#20B8A6]/30 flex items-center justify-center text-[#20B8A6] shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <h1 className="font-semibold text-sm tracking-wide text-[#F1F5F9]">
                DocuForensics AI
              </h1>
              <p className="text-[10px] text-[#718096] font-mono tracking-wider">
                Enterprise Station
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1 text-[#718096] hover:text-[#F1F5F9] hover:bg-[#172235] rounded transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        <div>
          {!isCollapsed && (
            <p className="px-4 text-[10px] font-mono font-semibold text-[#718096] uppercase tracking-widest mb-2">
              Console
            </p>
          )}
          <nav className="space-y-0.5">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 text-xs transition-colors border-l-2 ${
                      isActive
                        ? 'border-[#20B8A6] bg-[#20B8A6]/10 text-[#F1F5F9] font-medium'
                        : 'border-transparent text-[#A7B4C7] hover:bg-[#172235] hover:text-[#F1F5F9]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-[#20B8A6]" />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {caseNavItems.length > 0 && (
          <div>
            {!isCollapsed ? (
              <div className="px-4 flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono font-semibold text-[#718096] uppercase tracking-widest">
                  Active Case
                </p>
                <span className="font-mono text-[10px] text-[#20B8A6] bg-[#20B8A6]/10 border border-[#20B8A6]/20 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                  {investigationId?.slice(0, 8)}
                </span>
              </div>
            ) : (
              <div className="h-px bg-[#243247] my-2" />
            )}
            <nav className="space-y-0.5">
              {caseNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === `/investigations/${investigationId}`}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 text-xs transition-colors border-l-2 ${
                        isActive
                          ? 'border-[#20B8A6] bg-[#20B8A6]/10 text-[#F1F5F9] font-medium'
                          : 'border-transparent text-[#A7B4C7] hover:bg-[#172235] hover:text-[#F1F5F9]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 text-[#20B8A6]" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* System Footer Link */}
      <div className="p-3 border-t border-[#243247]">
        <NavLink
          to="/settings"
          title={isCollapsed ? 'Settings & System Diagnostics' : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-xs rounded transition-colors ${
              isActive
                ? 'bg-[#20B8A6]/10 text-[#20B8A6] font-medium'
                : 'text-[#A7B4C7] hover:bg-[#172235] hover:text-[#F1F5F9]'
            }`
          }
        >
          <Settings className="w-4 h-4 shrink-0 text-[#718096]" />
          {!isCollapsed && <span>Settings & Health</span>}
        </NavLink>
      </div>
    </aside>
  );
};

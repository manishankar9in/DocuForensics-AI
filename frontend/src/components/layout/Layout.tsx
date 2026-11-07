import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  return (
    <div className="flex h-screen bg-[#070B12] overflow-hidden font-sans text-[#F1F5F9]">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#070B12]">
        <Topbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#070B12]">
          <div className="max-w-[1440px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

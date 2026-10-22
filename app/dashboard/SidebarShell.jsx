// app/dashboard/SidebarShell.jsx
'use client';

import { useState } from 'react';
import { Menu as MenuIcon } from 'lucide-react';
import Sidebar from './Sidebar';

export default function SidebarShell({ menu, userEmail, logoutButton }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        menu={menu}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b h-14 px-4 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded hover:bg-gray-100"
            aria-label="Open menu"
          >
            <MenuIcon size={20} />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600 truncate max-w-[180px]">
              {userEmail}
            </span>
            {logoutButton}
          </div>
        </header>

        <main className="p-6">{/* children injected below */}</main>
      </div>
    </div>
  );
}

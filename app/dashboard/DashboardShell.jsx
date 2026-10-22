// app/dashboard/DashboardShell.jsx
'use client';

import { useState } from 'react';
import Sidebar from './sidebar';

export default function DashboardShell({ menu, userEmail, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar
        menu={menu}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        userEmail={userEmail}
      />
      <main className="flex-1 min-w-0 p-6">{children}</main>
    </div>
  );
}

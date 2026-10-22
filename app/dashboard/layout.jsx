// app/dashboard/layout.jsx
import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { resolveEffectivePermissions } from '@/lib/policy';
import { MENU } from '@/lib/menu';
import { filterMenu } from '@/lib/permissions';
import DashboardShell from './DashboardShell';
import PermissionHintProvider from './PermissionHintProvider';

export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardChrome>{children}</DashboardChrome>
    </Suspense>
  );
}

async function DashboardChrome({ children }) {
  const session = await getServerSession(authOptions);
  const user = session?.user ?? null;

  const { isSysAdmin, map } = user
    ? await resolveEffectivePermissions(user.id)
    : { isSysAdmin: false, map: new Map() };

  // shape expected by filterMenu / can
  const perms = Object.fromEntries(
    [...map.entries()].map(([name, e]) => [
      name,
      { allowed: [...e.allowed], denied: [...e.denied] },
    ])
  );

  // ✅ pass { isSysAdmin, permissions }, not the raw `user`
  const menu = filterMenu(MENU, { isSysAdmin, permissions: perms });

  return (
    <PermissionHintProvider isSysAdmin={isSysAdmin} permissions={perms}>
      <DashboardShell menu={menu} userEmail={user?.email ?? ''}>
        {children}
      </DashboardShell>
    </PermissionHintProvider>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="w-64 bg-white/90 backdrop-blur-md shadow-[0_8px_32px_rgba(15,23,42,0.08)] hidden md:block" />
      <div className="flex-1 p-6">
        <div className="h-10 bg-white/60 rounded-lg animate-pulse mb-4" />
        <div className="h-64 bg-white/60 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

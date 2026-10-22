// app/dashboard/PermissionHintProvider.jsx
'use client';

import { createContext, useContext, useCallback, useMemo } from 'react';

const Ctx = createContext({
  isSysAdmin: false,
  permissions: {},
  can: () => false,
});

export function usePermissions() {
  return useContext(Ctx);
}

export default function PermissionHintProvider({
  isSysAdmin = false,
  permissions = {},
  children,
}) {
  // Freeze the permissions object reference so `can` doesn't get a new
  // dependency on every parent re-render.
  const perms = useMemo(() => permissions, [permissions]);

  const can = useCallback(
    (permission) => {
      if (!permission) return true;
      if (isSysAdmin) return true;

      const check = (p) => {
        const entry = perms?.[p];
        if (!entry) return false;
        if (Array.isArray(entry.denied) && entry.denied.includes('GLOBAL')) {
          return false;
        }
        return Array.isArray(entry.allowed) && entry.allowed.includes('GLOBAL');
      };

      if (Array.isArray(permission)) {
        return permission.some((p) => check(p));
      }
      return check(permission);
    },
    [isSysAdmin, perms]
  );

  const value = useMemo(
    () => ({ isSysAdmin, permissions: perms, can }),
    [isSysAdmin, perms, can]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

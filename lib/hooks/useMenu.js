// lib/hooks/useMenu.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import { MENU } from '@/lib/menu';

export function useMenu() {
  const [state, setState] = useState({
    loading: true,
    permissions: {},
    isSysAdmin: false,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/me/permissions', { cache: 'no-store' });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(`${res.status} ${body.error || res.statusText}`);
        }
        if (!alive) return;
        setState({
          loading: false,
          permissions: body.permissions || {},
          isSysAdmin: !!body.isSysAdmin,
          error: null,
        });
      } catch (e) {
        if (!alive) return;
        setState({
          loading: false,
          permissions: {},
          isSysAdmin: false,
          error: e.message,
        });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const can = (permission) => {
    if (!permission) return true;
    if (state.isSysAdmin) return true;
    const entry = state.permissions[permission];
    if (!entry) return false;
    if (entry.denied?.includes('GLOBAL')) return false;
    return entry.allowed?.includes('GLOBAL');
  };

  const menu = useMemo(() => {
    if (state.loading) return [];
    return MENU.filter((item) => !item.adminOnly || state.isSysAdmin)
      .filter((item) => can(item.permission))
      .map((item) => ({
        ...item,
        children: item.children?.filter((c) => can(c.permission)),
      }))
      .filter((item) => !item.children || item.children.length > 0);
  }, [state]);

  return { menu, loading: state.loading, error: state.error, can };
}

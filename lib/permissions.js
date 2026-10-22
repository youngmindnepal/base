// lib/permissions.js
//
// ⚠️  Do NOT add 'use client'. Imported by both Server and Client Components.

// ─────────────────────────────────────────────────────────────
// SERVER / ISOMORPHIC — permission snapshot checks
// ─────────────────────────────────────────────────────────────

export function can(permission, ctx) {
  if (!permission) return true;
  if (!ctx) return false;
  if (ctx.isSysAdmin) return true;

  const entry = ctx.permissions?.[permission];
  if (!entry) return false;

  if (Array.isArray(entry.denied) && entry.denied.includes('GLOBAL')) {
    return false;
  }
  return Array.isArray(entry.allowed) && entry.allowed.includes('GLOBAL');
}

export function filterMenu(menu, ctx) {
  if (!Array.isArray(menu)) return [];

  return menu
    .filter((item) => !item.adminOnly || ctx?.isSysAdmin)
    .map((item) => ({
      ...item,
      children: item.children ? filterMenu(item.children, ctx) : undefined,
    }))
    .filter((item) => {
      if (item.children && item.children.length === 0) return false;
      return can(item.permission, ctx);
    });
}

// ─────────────────────────────────────────────────────────────
// CLIENT — API helpers
// ─────────────────────────────────────────────────────────────

const API_URL = '/api';

// ─── Fetchers ────────────────────────────────────────────────

export async function fetchRoles() {
  const res = await fetch(`${API_URL}/roles`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch roles');
  const data = await res.json();
  return data.roles || [];
}

export async function fetchPermissions() {
  const res = await fetch(`${API_URL}/permissions`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch permissions');
  const data = await res.json();
  return data.permissions || [];
}

// ─── Role ↔ Permission — SINGLE ─────────────────────────────
// ✅ REQUIRED by AssignmentTab.js — must exist.

export async function assignPermissionToRole(roleId, permissionId) {
  const res = await fetch(`${API_URL}/roles/${roleId}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissionId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to assign permission');
  }
  return res.json().catch(() => ({}));
}

export async function removePermissionFromRole(roleId, permissionId) {
  const res = await fetch(
    `${API_URL}/roles/${roleId}/permissions?permissionId=${permissionId}`,
    { method: 'DELETE' }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to remove permission');
  }
  return res.json().catch(() => ({}));
}

// ─── Role ↔ Permission — BULK ───────────────────────────────

export async function assignPermissionsToRole(roleId, permissionIds) {
  if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
    return { ok: true, added: [] };
  }
  const res = await fetch(`${API_URL}/roles/${roleId}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissionIds }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to assign permissions');
  }
  return res.json().catch(() => ({}));
}

export async function removePermissionsFromRole(roleId, permissionIds) {
  if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
    return { ok: true, removed: [] };
  }
  const res = await fetch(`${API_URL}/roles/${roleId}/permissions`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissionIds }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to remove permissions');
  }
  return res.json().catch(() => ({}));
}

export async function removeAllPermissionsFromRole(roleId) {
  const res = await fetch(`${API_URL}/roles/${roleId}/permissions`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to clear permissions');
  }
  return res.json().catch(() => ({}));
}

// ─── Local role-permission check ────────────────────────────

export function roleHasPermission(role, permissionId) {
  const list = role?.permissions || [];
  const target = Number(permissionId);
  if (!Number.isFinite(target)) return false;
  return list.some((p) => {
    if (typeof p === 'number') return p === target;
    const id = Number(p?.permissionId ?? p?.permission?.id ?? p?.id);
    return id === target;
  });
}

// ─────────────────────────────────────────────────────────────
// PRESENTATION helpers (pure)
// ─────────────────────────────────────────────────────────────

export function groupPermissionsByCategory(permissions = []) {
  return permissions.reduce((acc, perm) => {
    const key = perm.category?.code || perm.module || 'OTHER';
    if (!acc[key]) acc[key] = [];
    acc[key].push(perm);
    return acc;
  }, {});
}

export function getCategoryDisplayInfo(categoryOrCode) {
  if (!categoryOrCode) {
    return { label: 'Other', icon: 'Folder', color: 'slate' };
  }
  if (typeof categoryOrCode === 'string') {
    return {
      label: categoryOrCode.replace(/_/g, ' '),
      icon: 'Folder',
      color: 'slate',
    };
  }
  return {
    label:
      categoryOrCode.name || categoryOrCode.code?.replace(/_/g, ' ') || 'Other',
    icon: categoryOrCode.icon || 'Folder',
    color: categoryOrCode.color || 'slate',
  };
}

export function getActionColor(action) {
  const map = {
    CREATE: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    READ: 'bg-blue-50 text-blue-700 ring-blue-100',
    UPDATE: 'bg-amber-50 text-amber-700 ring-amber-100',
    DELETE: 'bg-red-50 text-red-700 ring-red-100',
    MANAGE: 'bg-purple-50 text-purple-700 ring-purple-100',
    IMPORT: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    EXPORT: 'bg-teal-50 text-teal-700 ring-teal-100',
  };
  return map[action] || 'bg-slate-50 text-slate-600 ring-slate-200';
}

export function getCategoryColorClass(color) {
  const map = {
    blue: 'ring-blue-200 bg-blue-50/60 text-blue-700',
    purple: 'ring-purple-200 bg-purple-50/60 text-purple-700',
    violet: 'ring-violet-200 bg-violet-50/60 text-violet-700',
    amber: 'ring-amber-200 bg-amber-50/60 text-amber-700',
    emerald: 'ring-emerald-200 bg-emerald-50/60 text-emerald-700',
    indigo: 'ring-indigo-200 bg-indigo-50/60 text-indigo-700',
    teal: 'ring-teal-200 bg-teal-50/60 text-teal-700',
    orange: 'ring-orange-200 bg-orange-50/60 text-orange-700',
    rose: 'ring-rose-200 bg-rose-50/60 text-rose-700',
    cyan: 'ring-cyan-200 bg-cyan-50/60 text-cyan-700',
    sky: 'ring-sky-200 bg-sky-50/60 text-sky-700',
    red: 'ring-red-200 bg-red-50/60 text-red-700',
    gray: 'ring-gray-200 bg-gray-50/60 text-gray-700',
    slate: 'ring-slate-200 bg-slate-50/60 text-slate-700',
  };
  return map[color] || map.slate;
}

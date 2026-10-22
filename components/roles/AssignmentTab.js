// components/roles/AssignmentTab.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import {
  fetchRoles,
  fetchPermissions,
  assignPermissionToRole,
  assignPermissionsToRole,
  removePermissionFromRole,
  removePermissionsFromRole,
  removeAllPermissionsFromRole,
  groupPermissionsByCategory,
  getActionColor,
} from '@/lib/permissions';
import { usePermissions } from '@/app/dashboard/PermissionHintProvider';

// ─── Role grouping (ordering only) ───────────────────────────
function getRoleGroup(role) {
  const name = (role?.name || '').trim();
  if (!name) return 'Other';
  const tokens = name.split(/[\s_-]+/).filter(Boolean);
  return tokens.length > 1 ? tokens[tokens.length - 1] : name;
}

function groupRolesByGroup(roles) {
  return roles.reduce((acc, role) => {
    const key = getRoleGroup(role);
    if (!acc[key]) acc[key] = [];
    acc[key].push(role);
    return acc;
  }, {});
}

export default function AssignmentTab({ categories = [] }) {
  const { can } = usePermissions();

  // ─── Read / grant / revoke gates ────────────────────────────
  const canView =
    can('ROLE_PERMISSION_ASSIGNMENT_READ') ||
    can('ROLE_MANAGEMENT_READ') ||
    can('PERMISSION_MANAGEMENT_READ') ||
    can('ROLE_PERMISSION_ASSIGNMENT_CREATE') ||
    can('ROLE_PERMISSION_ASSIGNMENT_UPDATE');

  const canGrant = can('ROLE_PERMISSION_ASSIGNMENT_CREATE');
  const canRevoke = can('ROLE_PERMISSION_ASSIGNMENT_UPDATE');

  // Any write permission means the matrix is editable — individual
  // actions are gated more narrowly below.
  const canWriteAny = canGrant || canRevoke;

  const [roles, setRoles] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  const [roleMap, setRoleMap] = useState(() => new Map());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [visibleRoleIds, setVisibleRoleIds] = useState(() => new Set());

  // ─── Load base data (only if canView) ──────────────────────
  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErr('');
      try {
        const [r, p] = await Promise.all([fetchRoles(), fetchPermissions()]);
        if (cancelled) return;
        setRoles(r);
        setPermissionsList(p);
        setVisibleRoleIds(new Set(r.map((x) => Number(x.id))));
        const pairs = await Promise.all(
          r.map(async (role) => {
            try {
              const res = await fetch(`/api/roles/${role.id}/permissions`, {
                cache: 'no-store',
              });
              const data = res.ok ? await res.json() : { permissionIds: [] };
              return [
                Number(role.id),
                new Set((data.permissionIds || []).map(Number)),
              ];
            } catch {
              return [Number(role.id), new Set()];
            }
          })
        );
        if (cancelled) return;
        setRoleMap(new Map(pairs));
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [canView]);

  const visibleRoles = useMemo(
    () => roles.filter((r) => visibleRoleIds.has(Number(r.id))),
    [roles, visibleRoleIds]
  );

  const groupedRoles = useMemo(
    () => groupRolesByGroup(visibleRoles),
    [visibleRoles]
  );

  const orderedRoles = useMemo(() => {
    const out = [];
    for (const [group, list] of Object.entries(groupedRoles)) {
      list.forEach((role, i) => {
        out.push({ role, group, isFirstInGroup: i === 0 });
      });
    }
    return out;
  }, [groupedRoles]);

  const filteredPermissions = useMemo(() => {
    let list = permissionsList;
    if (selectedCategory !== 'all') {
      list = list.filter(
        (p) => String(p.categoryId) === String(selectedCategory)
      );
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [permissionsList, selectedCategory, search]);

  const groupedPermissions = useMemo(
    () => groupPermissionsByCategory(filteredPermissions),
    [filteredPermissions]
  );

  const columnPermissions = useMemo(() => {
    const out = [];
    for (const list of Object.values(groupedPermissions)) {
      for (const p of list) out.push(p);
    }
    return out;
  }, [groupedPermissions]);

  const columnBoundaries = useMemo(() => {
    const map = new Map();
    for (const list of Object.values(groupedPermissions)) {
      if (list.length === 0) continue;
      list.forEach((perm, i) => {
        map.set(Number(perm.id), {
          isFirst: i === 0,
          isLast: i === list.length - 1,
        });
      });
    }
    return map;
  }, [groupedPermissions]);

  // ─── Feedback ────────────────────────────────────────────────
  function flashSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 2500);
  }
  function flashError(msg) {
    setErr(msg);
    setTimeout(() => setErr(''), 3500);
  }

  // ─── Helpers ─────────────────────────────────────────────────
  function hasRolePermission(roleId, permissionId) {
    return roleMap.get(Number(roleId))?.has(Number(permissionId)) ?? false;
  }

  // ─── Cell toggle — uses CREATE to grant, UPDATE to revoke ──
  async function toggleCell(roleId, permission) {
    const isGrant = !hasRolePermission(roleId, permission.id);
    if (isGrant && !canGrant) return;
    if (!isGrant && !canRevoke) return;

    setSaving(true);
    setErr('');
    try {
      if (isGrant) {
        await assignPermissionToRole(roleId, permission.id);
        setRoleMap((prev) => {
          const next = new Map(prev);
          const set = new Set(next.get(Number(roleId)) || []);
          set.add(Number(permission.id));
          next.set(Number(roleId), set);
          return next;
        });
      } else {
        await removePermissionFromRole(roleId, permission.id);
        setRoleMap((prev) => {
          const next = new Map(prev);
          const set = new Set(next.get(Number(roleId)) || []);
          set.delete(Number(permission.id));
          next.set(Number(roleId), set);
          return next;
        });
      }
    } catch (e) {
      flashError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── Bulk: column ──────────────────────────────────────────
  async function toggleColumn(permission) {
    const toGrant = [];
    const toRevoke = [];
    for (const role of visibleRoles) {
      if (hasRolePermission(role.id, permission.id)) toRevoke.push(role.id);
      else toGrant.push(role.id);
    }

    if (toGrant.length > 0 && !canGrant) {
      flashError('You do not have permission to grant');
      return;
    }
    if (toRevoke.length > 0 && !canRevoke) {
      flashError('You do not have permission to revoke');
      return;
    }

    setSaving(true);
    setErr('');
    try {
      // Decide mode: if anything is unassigned, treat as "grant all";
      // otherwise revoke all.
      if (toGrant.length > 0) {
        await Promise.all(
          toGrant.map((roleId) => assignPermissionToRole(roleId, permission.id))
        );
        setRoleMap((prev) => {
          const next = new Map(prev);
          for (const roleId of toGrant) {
            const set = new Set(next.get(Number(roleId)) || []);
            set.add(Number(permission.id));
            next.set(Number(roleId), set);
          }
          return next;
        });
        flashSuccess(
          `Granted "${permission.name}" to ${toGrant.length} role(s)`
        );
      } else if (toRevoke.length > 0) {
        await Promise.all(
          toRevoke.map((roleId) =>
            removePermissionFromRole(roleId, permission.id)
          )
        );
        setRoleMap((prev) => {
          const next = new Map(prev);
          for (const roleId of toRevoke) {
            const set = new Set(next.get(Number(roleId)) || []);
            set.delete(Number(permission.id));
            next.set(Number(roleId), set);
          }
          return next;
        });
        flashSuccess(
          `Revoked "${permission.name}" from ${toRevoke.length} role(s)`
        );
      }
    } catch (e) {
      flashError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── Bulk: row ──────────────────────────────────────────────
  async function toggleRow(role) {
    const targetIds = filteredPermissions.map((p) => Number(p.id));
    const current = roleMap.get(Number(role.id)) || new Set();
    const allSelected = targetIds.every((id) => current.has(id));

    if (allSelected && !canRevoke) {
      flashError('You do not have permission to revoke');
      return;
    }
    if (!allSelected && !canGrant) {
      flashError('You do not have permission to grant');
      return;
    }

    setSaving(true);
    setErr('');
    try {
      if (allSelected) {
        await removePermissionsFromRole(role.id, targetIds);
        setRoleMap((prev) => {
          const next = new Map(prev);
          const set = new Set(next.get(Number(role.id)) || []);
          for (const id of targetIds) set.delete(id);
          next.set(Number(role.id), set);
          return next;
        });
        flashSuccess(
          `Removed ${targetIds.length} permission(s) from ${role.name}`
        );
      } else {
        await assignPermissionsToRole(role.id, targetIds);
        setRoleMap((prev) => {
          const next = new Map(prev);
          const set = new Set(next.get(Number(role.id)) || []);
          for (const id of targetIds) set.add(id);
          next.set(Number(role.id), set);
          return next;
        });
        flashSuccess(
          `Granted ${targetIds.length} permission(s) to ${role.name}`
        );
      }
    } catch (e) {
      flashError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── Bulk: category ───────────────────────────────────────
  async function toggleCategoryGroup(list) {
    const missingPairs = [];
    const extraPairs = [];
    for (const perm of list) {
      for (const role of visibleRoles) {
        if (hasRolePermission(role.id, perm.id))
          extraPairs.push([role.id, perm.id]);
        else missingPairs.push([role.id, perm.id]);
      }
    }

    const wantGrant = missingPairs.length > 0;
    if (wantGrant && !canGrant) {
      flashError('You do not have permission to grant');
      return;
    }
    if (!wantGrant && !canRevoke) {
      flashError('You do not have permission to revoke');
      return;
    }

    setSaving(true);
    setErr('');
    try {
      if (wantGrant) {
        const byRole = new Map();
        for (const [roleId, permissionId] of missingPairs) {
          if (!byRole.has(roleId)) byRole.set(roleId, []);
          byRole.get(roleId).push(permissionId);
        }
        await Promise.all(
          [...byRole.entries()].map(([roleId, ids]) =>
            assignPermissionsToRole(roleId, ids)
          )
        );
        setRoleMap((prev) => {
          const next = new Map(prev);
          for (const [roleId, ids] of byRole) {
            const set = new Set(next.get(Number(roleId)) || []);
            for (const id of ids) set.add(id);
            next.set(Number(roleId), set);
          }
          return next;
        });
        flashSuccess(`Granted ${list.length} permission(s)`);
      } else if (extraPairs.length > 0) {
        const byRole = new Map();
        for (const [roleId, permissionId] of extraPairs) {
          if (!byRole.has(roleId)) byRole.set(roleId, []);
          byRole.get(roleId).push(permissionId);
        }
        await Promise.all(
          [...byRole.entries()].map(([roleId, ids]) =>
            removePermissionsFromRole(roleId, ids)
          )
        );
        setRoleMap((prev) => {
          const next = new Map(prev);
          for (const [roleId, ids] of byRole) {
            const set = new Set(next.get(Number(roleId)) || []);
            for (const id of ids) set.delete(id);
            next.set(Number(roleId), set);
          }
          return next;
        });
        flashSuccess(`Revoked ${list.length} permission(s)`);
      }
    } catch (e) {
      flashError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── Clear all for a role (revoke) ────────────────────────
  async function clearRoleRow(role) {
    if (!canRevoke) {
      flashError('You do not have permission to revoke');
      return;
    }
    if (!confirm(`Remove ALL permissions from ${role.name}?`)) return;
    setSaving(true);
    setErr('');
    try {
      await removeAllPermissionsFromRole(role.id);
      setRoleMap((prev) => {
        const next = new Map(prev);
        next.set(Number(role.id), new Set());
        return next;
      });
      flashSuccess(`Cleared all permissions for ${role.name}`);
    } catch (e) {
      flashError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── Row picker ────────────────────────────────────────────
  function toggleVisibleRole(roleId) {
    setVisibleRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  }
  function showAllRoles() {
    setVisibleRoleIds(new Set(roles.map((r) => Number(r.id))));
  }
  function hideAllRoles() {
    setVisibleRoleIds(new Set());
  }

  // ─── Render ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white/80 rounded-2xl ring-1 ring-slate-200/60 p-6">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <Icons.Loader2 className="w-4 h-4 animate-spin" />
          Loading roles and permissions…
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="max-w-md w-full p-8 bg-red-50 rounded-2xl ring-1 ring-red-200 shadow-sm text-center">
          <Icons.Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-bold mb-2 text-red-900">Access Denied</h2>
          <p className="text-sm text-red-700">
            You need one of{' '}
            <strong className="font-mono">
              ROLE_PERMISSION_ASSIGNMENT_READ
            </strong>
            ,{' '}
            <strong className="font-mono">
              ROLE_PERMISSION_ASSIGNMENT_CREATE
            </strong>
            ,{' '}
            <strong className="font-mono">
              ROLE_PERMISSION_ASSIGNMENT_UPDATE
            </strong>
            , <strong className="font-mono">ROLE_MANAGEMENT_READ</strong>, or{' '}
            <strong className="font-mono">PERMISSION_MANAGEMENT_READ</strong> to
            view this tab.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-slate-200/60 shadow-sm p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Icons.Grid3x3 className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Permission Matrix
            </h3>
            <span className="text-[11px] text-slate-500">
              {visibleRoles.length} roles × {columnPermissions.length}{' '}
              permissions
            </span>
            {!canWriteAny && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-medium ring-1 ring-amber-200">
                <Icons.Eye className="w-3 h-3" />
                Read-only
              </span>
            )}
            {canGrant && !canRevoke && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-medium ring-1 ring-emerald-200">
                Grant only
              </span>
            )}
            {!canGrant && canRevoke && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-[10px] font-medium ring-1 ring-orange-200">
                Revoke only
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-56">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search permissions…"
                className="w-full pl-9 pr-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row picker */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60">
          <span className="text-[11px] text-slate-500 mr-1">Roles:</span>
          <button
            onClick={showAllRoles}
            className="text-[11px] font-medium px-2 py-1 rounded-md bg-white ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Show all
          </button>
          <button
            onClick={hideAllRoles}
            className="text-[11px] font-medium px-2 py-1 rounded-md bg-white ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50 mr-1"
          >
            Hide all
          </button>
          {roles.map((r) => {
            const active = visibleRoleIds.has(Number(r.id));
            return (
              <button
                key={r.id}
                onClick={() => toggleVisibleRole(Number(r.id))}
                className={`text-[11px] font-medium px-2 py-1 rounded-md ring-1 transition-colors ${
                  active
                    ? 'bg-purple-50 text-purple-700 ring-purple-200'
                    : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {r.name}
              </button>
            );
          })}
        </div>

        {err && (
          <div className="p-2.5 bg-red-50 ring-1 ring-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <Icons.AlertCircle size={15} />
            {err}
          </div>
        )}
        {success && (
          <div className="p-2.5 bg-emerald-50 ring-1 ring-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
            <Icons.CheckCircle2 size={15} />
            {success}
          </div>
        )}
      </div>

      {/* Matrix */}
      {visibleRoles.length === 0 ? (
        <div className="bg-white/80 rounded-2xl ring-1 ring-slate-200/60 py-16 text-center text-slate-400">
          <Icons.LayoutGrid className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">
            Select at least one role row above.
          </p>
        </div>
      ) : columnPermissions.length === 0 ? (
        <div className="bg-white/80 rounded-2xl ring-1 ring-slate-200/60 py-16 text-center text-slate-400">
          <Icons.Key className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">No permissions match</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="border-collapse text-sm">
              <thead>
                {/* Category super-header row */}
                <tr className="bg-slate-100/70">
                  <th className="sticky left-0 z-20 bg-slate-100/70 px-4 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/70 min-w-[200px]">
                    {/* empty corner */}
                  </th>
                  {Object.entries(groupedPermissions).map(([code, list]) => {
                    const category = categories.find((c) => c.code === code);
                    const label = category?.name || code.replace(/_/g, ' ');

                    const total = list.length * visibleRoles.length;
                    const assigned = list.reduce(
                      (sum, p) =>
                        sum +
                        visibleRoles.filter((r) =>
                          hasRolePermission(r.id, p.id)
                        ).length,
                      0
                    );
                    const catAllSelected = total > 0 && assigned === total;
                    const catAllClear = assigned === 0;

                    let toggleHandler = null;
                    let toggleIcon = null;
                    let toggleTitle = '';

                    if (!catAllSelected && canGrant) {
                      toggleHandler = () => toggleCategoryGroup(list);
                      toggleIcon = <Icons.CheckSquare className="w-3 h-3" />;
                      toggleTitle = `Grant all ${label} for all visible roles`;
                    } else if (catAllSelected && canRevoke) {
                      toggleHandler = () => toggleCategoryGroup(list);
                      toggleIcon = <Icons.MinusSquare className="w-3 h-3" />;
                      toggleTitle = `Revoke all ${label} for all visible roles`;
                    }

                    return (
                      <th
                        key={`cat-${code}`}
                        colSpan={list.length}
                        className="px-2 py-2 text-center border-b border-slate-200/70 border-l-4 border-l-slate-300 border-r-2 border-r-slate-200"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Icons.Folder className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[11px] font-semibold text-slate-900">
                            {label}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full ring-1 ${
                              catAllSelected
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                : catAllClear
                                ? 'bg-slate-50 text-slate-500 ring-slate-200'
                                : 'bg-white text-slate-600 ring-slate-200'
                            }`}
                          >
                            {assigned}/{total}
                          </span>
                          {toggleHandler && (
                            <button
                              onClick={toggleHandler}
                              disabled={saving}
                              className="p-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-white disabled:opacity-50"
                              title={toggleTitle}
                            >
                              {toggleIcon}
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>

                {/* Permission header row */}
                <tr className="bg-slate-50/80">
                  <th className="sticky left-0 z-20 bg-slate-50/80 px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/70 min-w-[200px]">
                    Role
                  </th>
                  {columnPermissions.map((perm) => {
                    const allSelected = visibleRoles.every((r) =>
                      hasRolePermission(r.id, perm.id)
                    );
                    const boundary = columnBoundaries.get(Number(perm.id));

                    let toggleHandler = null;
                    let toggleIcon = null;
                    let toggleTitle = '';

                    if (!allSelected && canGrant) {
                      toggleHandler = () => toggleColumn(perm);
                      toggleIcon = <Icons.CheckSquare className="w-3 h-3" />;
                      toggleTitle = `Grant "${perm.name}" to all roles`;
                    } else if (allSelected && canRevoke) {
                      toggleHandler = () => toggleColumn(perm);
                      toggleIcon = <Icons.MinusSquare className="w-3 h-3" />;
                      toggleTitle = `Revoke "${perm.name}" from all roles`;
                    }

                    return (
                      <th
                        key={perm.id}
                        title={perm.name}
                        className={`px-1 py-2 text-center border-b border-slate-200/70 align-middle ${
                          boundary?.isFirst
                            ? 'border-l-4 border-l-slate-300'
                            : 'border-l border-slate-200/70'
                        } ${
                          boundary?.isLast
                            ? 'border-r-2 border-r-slate-200'
                            : ''
                        }`}
                        style={{ minWidth: 64 }}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold ring-1 ${getActionColor(
                              perm.action
                            )}`}
                          >
                            {perm.action || 'READ'}
                          </span>
                          {toggleHandler && (
                            <button
                              onClick={toggleHandler}
                              disabled={saving}
                              className="p-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                              title={toggleTitle}
                            >
                              {toggleIcon}
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {orderedRoles.map(({ role, isFirstInGroup }) => {
                  const current = roleMap.get(Number(role.id)) || new Set();
                  const targetIds = filteredPermissions.map((p) =>
                    Number(p.id)
                  );
                  const allSelected =
                    targetIds.length > 0 &&
                    targetIds.every((id) => current.has(id));

                  let rowToggle = null;
                  if (!allSelected && canGrant) {
                    rowToggle = {
                      onClick: () => toggleRow(role),
                      icon: <Icons.CheckSquare className="w-3.5 h-3.5" />,
                      title: `Grant all visible permissions to ${role.name}`,
                    };
                  } else if (allSelected && canRevoke) {
                    rowToggle = {
                      onClick: () => toggleRow(role),
                      icon: <Icons.MinusSquare className="w-3.5 h-3.5" />,
                      title: `Revoke all visible permissions from ${role.name}`,
                    };
                  }

                  return (
                    <tr
                      key={role.id}
                      className="hover:bg-indigo-50/30 transition-colors"
                    >
                      <td
                        className={`sticky left-0 z-10 bg-white px-4 py-2 border-b border-slate-100 ${
                          isFirstInGroup ? 'border-t-4 border-t-slate-300' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icons.Shield className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <p
                            className="text-xs font-semibold text-slate-900 truncate"
                            title={role.name}
                          >
                            {role.name}
                          </p>
                          <span className="ml-1 text-[10px] text-slate-500">
                            {current.size} assigned
                          </span>
                          {rowToggle && (
                            <button
                              onClick={rowToggle.onClick}
                              disabled={saving}
                              className="ml-auto p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                              title={rowToggle.title}
                            >
                              {rowToggle.icon}
                            </button>
                          )}
                          {canRevoke && (
                            <button
                              onClick={() => clearRoleRow(role)}
                              disabled={saving}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                              title={`Clear all permissions for ${role.name}`}
                            >
                              <Icons.Eraser className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      {columnPermissions.map((perm) => {
                        const checked = hasRolePermission(role.id, perm.id);
                        const boundary = columnBoundaries.get(Number(perm.id));
                        const cellEnabled = checked ? canRevoke : canGrant;
                        return (
                          <td
                            key={perm.id}
                            className={`px-1 py-2 text-center border-b border-slate-100 ${
                              boundary?.isFirst
                                ? 'border-l-4 border-l-slate-300'
                                : 'border-l border-slate-100'
                            } ${
                              boundary?.isLast
                                ? 'border-r-2 border-r-slate-200'
                                : ''
                            } ${
                              isFirstInGroup
                                ? 'border-t-4 border-t-slate-300'
                                : ''
                            }`}
                          >
                            <button
                              onClick={() => toggleCell(role.id, perm)}
                              disabled={saving || !cellEnabled}
                              className={`mx-auto w-6 h-6 rounded-md ring-1 flex items-center justify-center transition-colors disabled:opacity-50 ${
                                checked
                                  ? 'bg-indigo-600 ring-indigo-600 text-white hover:bg-indigo-700 disabled:hover:bg-indigo-600'
                                  : 'bg-white ring-slate-300 text-transparent hover:ring-indigo-400 hover:bg-indigo-50 disabled:hover:bg-white disabled:hover:ring-slate-300'
                              }`}
                              title={
                                !cellEnabled
                                  ? `${perm.name} · ${
                                      checked ? 'granted' : 'not granted'
                                    } (no permission)`
                                  : `${checked ? 'Revoke' : 'Grant'} ${
                                      perm.name
                                    } for ${role.name}`
                              }
                            >
                              <Icons.Check className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

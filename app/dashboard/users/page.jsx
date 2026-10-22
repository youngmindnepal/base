// app/dashboard/users/page.jsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePermissions } from '@/app/dashboard/PermissionHintProvider';

const API_URL = '/api';

const STATUS_STYLES = {
  ACTIVE: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Active',
  },
  INACTIVE: {
    bg: 'bg-slate-500/15',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    label: 'Inactive',
  },
  SUSPENDED: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    label: 'Suspended',
  },
};

function initialsFrom(user) {
  const f = user?.firstName?.[0] || '';
  const l = user?.lastName?.[0] || '';
  if (f || l) return (f + l).toUpperCase();
  return (user?.email?.[0] || '?').toUpperCase();
}

function fullName(user) {
  const n = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  return n || user?.email || '—';
}

export default function UsersPage() {
  const { data: session } = useSession();
  const { can, isSysAdmin } = usePermissions();

  // ── permission gates (real DB names) ────────────────────────
  const hasRead = can('USER_MANAGEMENT_READ');
  const hasCreate = can('USER_MANAGEMENT_CREATE');
  const hasUpdate = can('USER_MANAGEMENT_UPDATE');
  const hasDelete = can('USER_MANAGEMENT_DELETE');

  // ── data ────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── filters ─────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // ── after-save focus ────────────────────────────────────────
  const [highlightedUserId, setHighlightedUserId] = useState(null);

  // ── modals / feedback ───────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── permission overrides modal ──────────────────────────────
  const [permissionUser, setPermissionUser] = useState(null);

  // ── loaders ─────────────────────────────────────────────────
  const loadUsers = useCallback(
    async ({ search = '', status = 'all', roleId = 'all' } = {}) => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status !== 'all') params.append('status', status);
        if (roleId !== 'all') params.append('roleId', roleId);
        params.append('_t', String(Date.now()));

        const res = await fetch(`${API_URL}/users?${params.toString()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || `Failed to fetch users (${res.status})`
          );
        }
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/roles`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!hasRead) return;
    loadUsers({ search: searchTerm, status: statusFilter, roleId: roleFilter });
  }, [hasRead, searchTerm, statusFilter, roleFilter, loadUsers]);

  useEffect(() => {
    if (!hasRead) return;
    fetchRoles();
  }, [hasRead, fetchRoles]);

  // ── feedback ────────────────────────────────────────────────
  function flashSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  }
  function flashError(msg) {
    setError(msg);
    setTimeout(() => setError(''), 3000);
  }

  // ── CRUD handlers ───────────────────────────────────────────
  function handleCreate() {
    setEditingUser(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  }
  function handleEdit(user) {
    setEditingUser(user);
    setShowForm(true);
    setError('');
    setSuccess('');
  }

  async function handleFormSave(savedUser) {
    const savedId =
      savedUser?.id != null
        ? String(savedUser.id)
        : editingUser?.id != null
        ? String(editingUser.id)
        : null;

    flashSuccess(editingUser ? 'User updated' : 'User created');
    setShowForm(false);
    setEditingUser(null);

    if (savedId) setHighlightedUserId(savedId);

    await loadUsers({
      search: searchTerm,
      status: statusFilter,
      roleId: roleFilter,
    });
  }

  async function showAllUsers() {
    setHighlightedUserId(null);
    setSearchTerm('');
    setStatusFilter('all');
    setRoleFilter('all');
    await loadUsers({ search: '', status: 'all', roleId: 'all' });
  }

  function handleDeleteClick(user) {
    if (String(session?.user?.id) === String(user.id)) {
      flashError('You cannot delete your own account');
      return;
    }
    setUserToDelete(user);
    setShowDeleteModal(true);
  }

  async function handleConfirmDelete() {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/users/${userToDelete.id}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete user');
      }
      flashSuccess(`Deleted ${fullName(userToDelete)}`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      if (highlightedUserId === String(userToDelete.id)) {
        setHighlightedUserId(null);
      }
      await loadUsers({
        search: searchTerm,
        status: statusFilter,
        roleId: roleFilter,
      });
    } catch (err) {
      flashError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function handleManagePermissions(user) {
    setPermissionUser(user);
  }

  async function handlePermissionsSaved() {
    setPermissionUser(null);
    flashSuccess('Permissions updated');
    await loadUsers({
      search: searchTerm,
      status: statusFilter,
      roleId: roleFilter,
    });
  }

  // ── derived ─────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const q = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  const displayedUsers = useMemo(() => {
    if (!highlightedUserId) return filteredUsers;
    return filteredUsers.filter((u) => String(u.id) === highlightedUserId);
  }, [filteredUsers, highlightedUserId]);

  const roleNamesOf = (user) => {
    const names = (user.roleAssignments || [])
      .map((a) => a.role?.name)
      .filter(Boolean);
    return names.length ? names : ['No Role'];
  };

  const isCurrentUser = (id) => String(session?.user?.id) === String(id);

  // ── early returns ───────────────────────────────────────────
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Icons.Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!hasRead) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md p-8 bg-red-50 rounded-2xl ring-1 ring-red-200 shadow-sm">
          <Icons.Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2 text-red-900">Access Denied</h2>
          <p className="text-red-700 text-sm">
            You don't have permission to view users.
          </p>
          {isSysAdmin && (
            <p className="text-red-700 text-xs mt-2">
              (You are a System Administrator — if you still see this, the
              permission name `USER_MANAGEMENT_READ` was not resolved. Check
              `lib/policy.js`.)
            </p>
          )}
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard', icon: Icons.Home },
    { label: 'Users', href: '/dashboard/users', icon: Icons.Users },
  ];

  return (
    <div className="space-y-4 px-4 lg:px-6 pb-8">
      {/* Flash messages */}
      {success && (
        <div className="p-3 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2 shadow-sm">
          <Icons.CheckCircle size={16} />
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 ring-1 ring-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2 shadow-sm">
          <Icons.AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Sticky header */}
      <div className="sticky top-0 z-30 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 rounded-2xl overflow-hidden shadow-[0_1px_0_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
        <div className="absolute inset-0 bg-gradient-to-r from-white via-slate-50/80 to-white" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.06),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.04),transparent_55%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent" />

        <div className="relative">
          <nav
            className="flex items-center gap-1.5 mb-2"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && (
                  <Icons.ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                )}
                <Link
                  href={crumb.href}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    i === breadcrumbs.length - 1
                      ? 'text-indigo-600'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {crumb.icon && <crumb.icon className="w-3.5 h-3.5" />}
                  <span>{crumb.label}</span>
                </Link>
              </div>
            ))}
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Users Management
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-medium ring-1 ring-indigo-100">
                  <Icons.Users className="w-3 h-3" />
                  Total: {users.length}
                </span>
                {highlightedUserId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[11px] font-medium ring-1 ring-amber-100">
                    <Icons.Filter className="w-3 h-3" />
                    Showing updated user
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {hasCreate && (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all shadow-[0_4px_12px_-2px_rgba(99,102,241,0.5)] cursor-pointer"
                >
                  <Icons.Plus size={14} /> Add User
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-slate-200/60 shadow-[0_1px_0_rgba(15,23,42,0.03),0_8px_24px_-12px_rgba(15,23,42,0.08)] p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Post-save banner */}
      {highlightedUserId && (
        <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 ring-1 ring-amber-200 rounded-xl text-sm text-amber-800 shadow-sm">
          <div className="flex items-center gap-2">
            <Icons.Sparkles size={16} className="text-amber-600" />
            <span>
              Showing only the user that was just updated. Click{' '}
              <strong>Refresh</strong> to see all users.
            </span>
          </div>
          <button
            onClick={showAllUsers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-amber-800 text-xs font-medium rounded-lg ring-1 ring-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <Icons.RefreshCw size={13} /> Refresh
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-slate-200/60 shadow-[0_1px_0_rgba(15,23,42,0.03),0_8px_24px_-12px_rgba(15,23,42,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/70">
                <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="py-3 px-4 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Icons.Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                  </td>
                </tr>
              ) : displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Icons.Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                      {highlightedUserId
                        ? 'The updated user is no longer visible under the current filters.'
                        : 'No users found'}
                    </p>
                  </td>
                </tr>
              ) : (
                displayedUsers.map((user) => {
                  const status =
                    STATUS_STYLES[user.status] || STATUS_STYLES.ACTIVE;
                  const isCurrent = isCurrentUser(user.id);
                  const isHighlighted = highlightedUserId === String(user.id);
                  const roles_ = roleNamesOf(user);

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors ${
                        isHighlighted
                          ? 'bg-amber-50/60 ring-1 ring-inset ring-amber-200/60'
                          : isCurrent
                          ? 'bg-indigo-50/60'
                          : 'hover:bg-indigo-50/40'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold shadow-sm ${
                              isHighlighted
                                ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                                : isCurrent
                                ? 'bg-gradient-to-br from-indigo-600 to-violet-600'
                                : 'bg-gradient-to-br from-slate-500 to-slate-700'
                            }`}
                          >
                            {initialsFrom(user)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {fullName(user)}
                              {isHighlighted && (
                                <span className="ml-2 text-[11px] text-amber-700 font-normal">
                                  (Just updated)
                                </span>
                              )}
                              {isCurrent && !isHighlighted && (
                                <span className="ml-2 text-[11px] text-indigo-600 font-normal">
                                  (You)
                                </span>
                              )}
                            </p>
                            {user.mustChangePassword && (
                              <p className="text-[11px] text-amber-600 font-medium">
                                Password change required
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {user.phone || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {roles_.map((rn, i) => (
                            <span
                              key={i}
                              className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${
                                rn === 'No Role'
                                  ? 'bg-slate-50 text-slate-500 ring-slate-200'
                                  : 'bg-indigo-50 text-indigo-700 ring-indigo-100'
                              }`}
                            >
                              {rn}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${status.bg} ${status.text} ring-1 ring-inset ring-black/5`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                          />
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {hasUpdate && (
                            <button
                              onClick={() => handleManagePermissions(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors cursor-pointer"
                              title="Manage permission overrides"
                            >
                              <Icons.ShieldCheck size={15} />
                            </button>
                          )}
                          {hasUpdate && (
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Edit user"
                            >
                              <Icons.Edit2 size={15} />
                            </button>
                          )}
                          {hasDelete && !isCurrent && (
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete user"
                            >
                              <Icons.Trash2 size={15} />
                            </button>
                          )}
                          {isCurrent && hasDelete && (
                            <button
                              className="p-1.5 rounded-lg text-slate-200 cursor-not-allowed"
                              title="Cannot delete your own account"
                              disabled
                            >
                              <Icons.Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-200/70 text-xs text-slate-500">
          {highlightedUserId
            ? `Showing 1 of ${users.length} users (updated user only)`
            : `Showing ${displayedUsers.length} of ${users.length} users`}
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
            onClick={() => {
              setShowDeleteModal(false);
              setUserToDelete(null);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 ring-1 ring-slate-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 ring-1 ring-red-100">
                <Icons.AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Delete User
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-slate-50 rounded-xl ring-1 ring-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">
                    {initialsFrom(userToDelete)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">
                    {fullName(userToDelete)}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {userToDelete.email}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete this user? This will permanently
              remove their account and all associated data.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 ring-1 ring-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-[0_4px_12px_-2px_rgba(239,68,68,0.5)]"
              >
                {deleting ? (
                  <>
                    <Icons.Loader2 size={16} className="animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Icons.Trash2 size={16} />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User form modal */}
      {showForm && (
        <UserForm
          isOpen={showForm}
          user={editingUser}
          roles={roles}
          onClose={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
          onSave={handleFormSave}
        />
      )}

      {/* Permission overrides modal */}
      {permissionUser && (
        <PermissionOverridesModal
          user={permissionUser}
          onClose={() => setPermissionUser(null)}
          onSaved={handlePermissionsSaved}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Inline UserForm modal
// ────────────────────────────────────────────────────────────
function UserForm({ isOpen, onClose, onSave, user, roles }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    status: 'ACTIVE',
    roleId: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (user) {
      const firstRoleId = user.roleAssignments?.[0]?.roleId || '';
      setForm({
        email: user.email || '',
        password: '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        status: user.status || 'ACTIVE',
        roleId: firstRoleId ? String(firstRoleId) : '',
      });
    } else {
      setForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        status: 'ACTIVE',
        roleId: '',
      });
    }
    setErr('');
  }, [isOpen, user]);

  function update(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      const payload = {
        email: form.email,
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        phone: form.phone || null,
        address: form.address || null,
        status: form.status,
      };
      if (!isEdit) payload.password = form.password;
      if (form.roleId) payload.roleId = Number(form.roleId);

      const res = await fetch(isEdit ? `/api/users/${user.id}` : '/api/users', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Save failed');
      }
      const data = await res.json().catch(() => ({}));
      await onSave?.(data.user || data);
      onClose();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
        onClick={() => !saving && onClose()}
      />
      <form
        onSubmit={submit}
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 ring-1 ring-slate-200 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEdit ? 'Edit User' : 'Create User'}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEdit
                ? 'Update the user details below.'
                : 'Fill in the details to create a new user.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <Icons.X size={18} />
          </button>
        </div>

        {err && (
          <div className="mb-3 p-2.5 bg-red-50 ring-1 ring-red-200 rounded-lg text-sm text-red-700">
            {err}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Email" className="sm:col-span-2">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="input"
            />
          </Field>

          {!isEdit && (
            <Field label="Password" className="sm:col-span-2">
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="input"
              />
            </Field>
          )}

          <Field label="First name">
            <input
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Last name">
            <input
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className="input"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <input
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Role" className="sm:col-span-2">
            <select
              value={form.roleId}
              onChange={(e) => update('roleId', e.target.value)}
              className="input"
            >
              <option value="">— No role —</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="flex-1 px-4 py-2.5 ring-1 ring-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_12px_-2px_rgba(99,102,241,0.5)]"
          >
            {saving ? (
              <>
                <Icons.Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Icons.Check size={16} />
                {isEdit ? 'Save changes' : 'Create user'}
              </>
            )}
          </button>
        </div>

        <style jsx>{`
          .input {
            width: 100%;
            padding: 0.5rem 0.75rem;
            background: #fff;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            color: #0f172a;
            box-shadow: inset 0 0 0 1px rgb(226 232 240);
            outline: none;
            transition: box-shadow 0.15s;
          }
          .input:focus {
            box-shadow: inset 0 0 0 2px rgb(99 102 241);
          }
        `}</style>
      </form>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

// ────────────────────────────────────────────────────────────
// Permission overrides modal
// ────────────────────────────────────────────────────────────
function PermissionOverridesModal({ user, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [overrides, setOverrides] = useState([]);

  const effective = useMemo(() => {
    const map = new Map();
    for (const ra of user.roleAssignments || []) {
      for (const rp of ra.role?.permissions || []) {
        map.set(rp.permission?.name, 'ROLE');
      }
    }
    for (const o of overrides) {
      if (o.effect === 'ALLOW') map.set(o.permission?.name, 'ALLOW');
      else map.set(o.permission?.name, 'DENY');
    }
    return map;
  }, [user, overrides]);

  const [selectedPermissionId, setSelectedPermissionId] = useState('');
  const [selectedEffect, setSelectedEffect] = useState('ALLOW');
  const [selectedScopeType, setSelectedScopeType] = useState('GLOBAL');
  const [selectedScopeId, setSelectedScopeId] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErr('');
      try {
        const [pRes, oRes] = await Promise.all([
          fetch(`/api/permissions`, { cache: 'no-store' }),
          fetch(`/api/users/${user.id}/permissions`, { cache: 'no-store' }),
        ]);
        const pData = pRes.ok ? await pRes.json() : { permissions: [] };
        const oData = oRes.ok ? await oRes.json() : { assignments: [] };
        if (cancelled) return;
        setPermissions(pData.permissions || []);
        setOverrides(oData.assignments || []);
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Failed to load permissions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  async function addOverride() {
    if (!selectedPermissionId) {
      setErr('Select a permission');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      const body = {
        permissionId: Number(selectedPermissionId),
        effect: selectedEffect,
        scopeType: selectedScopeType,
        scopeId:
          selectedScopeType === 'GLOBAL'
            ? null
            : Number(selectedScopeId) || null,
      };
      if (selectedScopeType !== 'GLOBAL' && !body.scopeId) {
        throw new Error('scopeId is required for non-global scopes');
      }
      const res = await fetch(`/api/users/${user.id}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to add override');
      setOverrides((prev) => {
        const idx = prev.findIndex((o) => o.id === data.assignment?.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = data.assignment;
          return next;
        }
        return [...prev, data.assignment];
      });
      setSelectedPermissionId('');
      setSelectedScopeId('');
      setSelectedScopeType('GLOBAL');
      setSelectedEffect('ALLOW');
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeOverride(id) {
    setSaving(true);
    setErr('');
    try {
      const res = await fetch(`/api/users/${user.id}/permissions?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to remove override');
      }
      setOverrides((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
        onClick={() => !saving && onClose()}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 ring-1 ring-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Icons.ShieldCheck className="w-5 h-5 text-violet-600" />
              Permission Overrides
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {fullName(user)} · {user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <Icons.X size={18} />
          </button>
        </div>

        {err && (
          <div className="mb-3 p-2.5 bg-red-50 ring-1 ring-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <Icons.AlertCircle size={15} />
            {err}
          </div>
        )}

        {/* Inherited */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Icons.Key className="w-3.5 h-3.5 text-slate-400" />
            From role (inherited)
          </h4>
          <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 ring-1 ring-slate-200">
            {[...effective.entries()]
              .filter(([, src]) => src === 'ROLE')
              .map(([name]) => (
                <span
                  key={name}
                  className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-700 ring-1 ring-slate-200"
                >
                  {name}
                </span>
              ))}
            {[...effective.values()].filter((v) => v === 'ROLE').length ===
              0 && (
              <span className="text-xs text-slate-400">
                No role permissions
              </span>
            )}
          </div>
        </div>

        {/* Overrides list */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Icons.Shield className="w-3.5 h-3.5 text-slate-400" />
            User-specific overrides ({overrides.length})
          </h4>
          {overrides.length === 0 ? (
            <p className="text-xs text-slate-400 p-3 rounded-xl bg-slate-50 ring-1 ring-slate-200">
              No overrides yet. This user currently inherits exactly what the
              role grants.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {overrides.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg ring-1 ring-slate-200 bg-white"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ${
                        o.effect === 'ALLOW'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-red-50 text-red-700 ring-red-200'
                      }`}
                    >
                      {o.effect}
                    </span>
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {o.permission?.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {o.scopeType === 'GLOBAL'
                        ? 'Global'
                        : `${o.scopeType}: ${o.scopeId}`}
                    </span>
                  </div>
                  <button
                    onClick={() => removeOverride(o.id)}
                    disabled={saving}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="Remove override"
                  >
                    <Icons.Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add override */}
        <div className="p-3 rounded-xl bg-violet-50 ring-1 ring-violet-200">
          <h4 className="text-xs font-semibold text-violet-900 mb-2 flex items-center gap-1.5">
            <Icons.Plus className="w-3.5 h-3.5" />
            Add override
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedPermissionId}
              onChange={(e) => setSelectedPermissionId(e.target.value)}
              className="px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm"
            >
              <option value="">Select permission…</option>
              {permissions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={selectedEffect}
              onChange={(e) => setSelectedEffect(e.target.value)}
              className="px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm"
            >
              <option value="ALLOW">ALLOW</option>
              <option value="DENY">DENY</option>
            </select>
            <select
              value={selectedScopeType}
              onChange={(e) => setSelectedScopeType(e.target.value)}
              className="px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm"
            >
              <option value="GLOBAL">GLOBAL</option>
              <option value="BRANCH">BRANCH</option>
              <option value="DEPARTMENT">DEPARTMENT</option>
            </select>
            <input
              type="number"
              placeholder="Scope ID"
              value={selectedScopeId}
              onChange={(e) => setSelectedScopeId(e.target.value)}
              disabled={selectedScopeType === 'GLOBAL'}
              className="px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm disabled:opacity-50"
            />
          </div>
          <button
            onClick={addOverride}
            disabled={saving || loading}
            className="mt-2 w-full px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Icons.Loader2 size={15} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Icons.Plus size={15} /> Add override
              </>
            )}
          </button>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="px-4 py-2.5 ring-1 ring-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Close
          </button>
          <button
            onClick={onSaved}
            disabled={saving}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_12px_-2px_rgba(99,102,241,0.5)]"
          >
            <Icons.Check size={15} /> Done
          </button>
        </div>
      </div>
    </div>
  );
}

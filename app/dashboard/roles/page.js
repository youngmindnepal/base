// app/dashboard/roles/page.jsx
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  RefreshCw,
  X,
  Home,
  ChevronRight,
  Shield,
  ShieldAlert,
  Edit2,
  Trash2,
  Key,
  Lock,
  Check,
  LayoutGrid,
  List,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  Folder,
  FolderPlus,
  Sparkles,
} from 'lucide-react';
import AssignmentTab from '@/components/roles/AssignmentTab';
import RolesTab from '@/components/roles/RolesTab';
import { usePermissions } from '@/app/dashboard/PermissionHintProvider';

const API_URL = '/api';

const ACTION_COLORS = {
  CREATE: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  READ: 'bg-blue-50 text-blue-700 ring-blue-100',
  UPDATE: 'bg-amber-50 text-amber-700 ring-amber-100',
  DELETE: 'bg-red-50 text-red-700 ring-red-100',
  MANAGE: 'bg-purple-50 text-purple-700 ring-purple-100',
  IMPORT: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  EXPORT: 'bg-teal-50 text-teal-700 ring-teal-100',
};

const CATEGORY_ACCENTS = {
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

function Badge({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${className}`}
    >
      {children}
    </span>
  );
}

function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex gap-1 bg-white ring-1 ring-slate-200 p-1 rounded-lg shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
            activeTab === tab.value
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_4px_12px_-2px_rgba(99,102,241,0.5)]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
  );
}

// ────────────────────────────────────────────────
// Role form modal
// ────────────────────────────────────────────────
function RoleFormModal({ role, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: role?.name || '',
    description: role?.description || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/70 bg-slate-50/60">
            <h3 className="text-base font-semibold text-slate-900">
              {role ? 'Edit Role' : 'Create Role'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Role Name *
              </label>
              <input
                type="text"
                value={form.name}
                required
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Administrator"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                rows={2}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief description of this role"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-3 border-t border-slate-200/70 bg-slate-50/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white ring-1 ring-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold rounded-lg hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 cursor-pointer shadow-[0_4px_12px_-2px_rgba(99,102,241,0.5)] flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>{role ? 'Update Role' : 'Create Role'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Permission form modal
// ────────────────────────────────────────────────
function PermissionFormModal({ permission, categories, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: permission?.name || '',
    description: permission?.description || '',
    categoryId: permission?.categoryId?.toString() || '',
    module: permission?.module || '',
    action: permission?.action || 'READ',
  });
  const [saving, setSaving] = useState(false);

  const actions = [
    'CREATE',
    'READ',
    'UPDATE',
    'DELETE',
    'MANAGE',
    'IMPORT',
    'EXPORT',
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/70 bg-slate-50/60">
            <h3 className="text-base font-semibold text-slate-900">
              {permission ? 'Edit Permission' : 'Create Permission'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Permission Name *
              </label>
              <input
                type="text"
                value={form.name}
                required
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., CREATE_USER"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="What this permission allows"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Category *
                </label>
                <select
                  value={form.categoryId}
                  required
                  onChange={(e) => {
                    const cat = categories.find(
                      (c) => c.id === parseInt(e.target.value)
                    );
                    setForm({
                      ...form,
                      categoryId: e.target.value,
                      module: cat?.code || '',
                    });
                  }}
                  className="w-full px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Action *
                </label>
                <select
                  value={form.action}
                  onChange={(e) => setForm({ ...form, action: e.target.value })}
                  className="w-full px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Action Preview
              </label>
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => setForm({ ...form, action })}
                    className={`flex-1 min-w-[70px] px-3 py-2 rounded-lg text-xs font-medium ring-1 transition-all cursor-pointer ${
                      form.action === action
                        ? ACTION_COLORS[action]
                        : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-3 border-t border-slate-200/70 bg-slate-50/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white ring-1 ring-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold rounded-lg hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 cursor-pointer shadow-[0_4px_12px_-2px_rgba(99,102,241,0.5)] flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>{permission ? 'Update Permission' : 'Create Permission'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Category modal
// ────────────────────────────────────────────────
function CategoryModal({ category, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    code: category?.code || '',
    description: category?.description || '',
    icon: category?.icon || 'Folder',
    color: category?.color || 'blue',
    sortOrder: category?.sortOrder || 0,
  });
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [saving, setSaving] = useState(false);

  const iconOptions = [
    'Folder',
    'Settings',
    'Users',
    'Shield',
    'Key',
    'Building',
    'GraduationCap',
    'BookOpen',
    'ClipboardList',
    'Clock',
    'PenTool',
    'Monitor',
    'BarChart3',
    'Package',
    'Library',
    'Database',
    'Server',
  ];

  const colorOptions = [
    'blue',
    'purple',
    'violet',
    'amber',
    'emerald',
    'indigo',
    'teal',
    'orange',
    'rose',
    'cyan',
    'sky',
    'red',
    'gray',
    'slate',
  ];

  const crudActions = [
    { key: 'CREATE', label: 'Create' },
    { key: 'READ', label: 'Read' },
    { key: 'UPDATE', label: 'Update' },
    { key: 'DELETE', label: 'Delete' },
    { key: 'MANAGE', label: 'Manage' },
    { key: 'IMPORT', label: 'Import' },
    { key: 'EXPORT', label: 'Export' },
  ];

  function handleSelectAll() {
    const next = !selectAll;
    setSelectAll(next);
    const nextSelected = {};
    crudActions.forEach((a) => {
      nextSelected[a.key] = next;
    });
    setSelectedPermissions(nextSelected);
  }

  function handleTogglePermission(key) {
    const next = { ...selectedPermissions, [key]: !selectedPermissions[key] };
    setSelectedPermissions(next);
    setSelectAll(crudActions.every((a) => next[a.key]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedActions = Object.entries(selectedPermissions)
        .filter(([, v]) => v)
        .map(([k]) => k);
      await onSubmit({ ...form, permissions: selectedActions });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/70 bg-slate-50/60">
            <h3 className="text-base font-semibold text-slate-900">
              {category ? 'Edit Category' : 'Create Category'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., User Management"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  value={form.code}
                  required
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., USER_MANAGEMENT"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                rows={2}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Icon
                </label>
                <select
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm cursor-pointer"
                >
                  {iconOptions.map((icon) => (
                    <option key={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Color
                </label>
                <select
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-full px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm cursor-pointer"
                >
                  {colorOptions.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            {!category && (
              <div className="ring-1 ring-slate-200 rounded-xl p-4 bg-slate-50/60">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">
                      Permissions to Create
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Select which CRUD permissions to create for this category
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 cursor-pointer"
                  >
                    {selectAll ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {crudActions.map((action) => (
                    <label
                      key={action.key}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ring-1 ${
                        selectedPermissions[action.key]
                          ? 'bg-indigo-50 ring-indigo-200 text-indigo-800'
                          : 'bg-white ring-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedPermissions[action.key]}
                        onChange={() => handleTogglePermission(action.key)}
                        className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-xs font-medium">
                        {action.label}
                      </span>
                      {selectedPermissions[action.key] && (
                        <Check className="w-3 h-3 ml-auto text-indigo-600" />
                      )}
                    </label>
                  ))}
                </div>

                <div className="mt-2 text-[10px] text-slate-500">
                  {Object.values(selectedPermissions).filter(Boolean).length}{' '}
                  permission(s) selected
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-6 py-3 border-t border-slate-200/70 bg-slate-50/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white ring-1 ring-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-semibold rounded-lg hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 cursor-pointer shadow-[0_4px_12px_-2px_rgba(20,184,166,0.5)] flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>{category ? 'Update Category' : 'Create Category'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Delete modal
// ────────────────────────────────────────────────
function DeleteModal({
  deleteConfirm,
  deleteError,
  deleting,
  onClose,
  onConfirm,
}) {
  const typeLabels = {
    role: 'Role',
    permission: 'Permission',
    category: 'Category',
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/70 bg-slate-50/60">
            <h3 className="text-base font-semibold text-slate-900">
              {deleteError
                ? deleteError.title
                : `Delete ${typeLabels[deleteConfirm?.type] || ''}`}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6">
            {deleteError ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl ring-1 ring-red-200">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-red-800">
                    {deleteError.message}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-white ring-1 ring-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl ring-1 ring-red-200">
                  <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Confirm Deletion
                    </p>
                    <p className="text-xs text-red-700 mt-0.5">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Are you sure you want to delete{' '}
                  <strong className="text-slate-900">
                    {deleteConfirm?.name}
                  </strong>
                  ?
                </p>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/70">
                  <button
                    onClick={onClose}
                    disabled={deleting}
                    className="px-4 py-2 bg-white ring-1 ring-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-[0_4px_12px_-2px_rgba(239,68,68,0.5)]"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Deleting…
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────
export default function RolesPage() {
  const { can, isSysAdmin } = usePermissions();

  // ── Tab visibility (read gates per tab) ────────────────────
  const canReadRole = can('ROLE_MANAGEMENT_READ');
  const canReadPerm = can('PERMISSION_MANAGEMENT_READ');

  // ── Assignment tab visibility ──────────────────────────────
  // The Assignment tab shows for anyone holding any of the
  // assignment permissions (read, create, update) — but NOT
  // because of the management-read permissions alone.
  const canViewAssignment =
    can('ROLE_PERMISSION_ASSIGNMENT_READ') ||
    can('ROLE_PERMISSION_ASSIGNMENT_CREATE') ||
    can('ROLE_PERMISSION_ASSIGNMENT_UPDATE');

  // ── WRITE gates (strict per-resource) ──────────────────────
  const canCreateRole = can('ROLE_MANAGEMENT_CREATE');
  const canUpdateRole = can('ROLE_MANAGEMENT_UPDATE');
  const canDeleteRole = can('ROLE_MANAGEMENT_DELETE');

  const canCreatePerm = can('PERMISSION_MANAGEMENT_CREATE');
  const canUpdatePerm = can('PERMISSION_MANAGEMENT_UPDATE');
  const canDeletePerm = can('PERMISSION_MANAGEMENT_DELETE');

  const canCreateCategory = canCreatePerm;
  const canUpdateCategory = canUpdatePerm;
  const canDeleteCategory = canDeletePerm;

  const [activeTab, setActiveTab] = useState('roles');
  const [viewMode, setViewMode] = useState('card');
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingPermission, setEditingPermission] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formType, setFormType] = useState('role');
  const [lastUpdatedItem, setLastUpdatedItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showOnlyCategory, setShowOnlyCategory] = useState(null);

  const toastTimerRef = useRef(null);
  const didFetchRef = useRef(false);

  const showToast = useCallback((type, title, message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, title, message });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const fetchData = useCallback(
    async ({ showRefresh = false, clearFocus = true } = {}) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const [rolesRes, permsRes, catsRes] = await Promise.all([
          canReadRole
            ? fetch(`${API_URL}/roles`, { cache: 'no-store' })
            : Promise.resolve({ ok: false }),
          canReadPerm
            ? fetch(`${API_URL}/permissions`, { cache: 'no-store' })
            : Promise.resolve({ ok: false }),
          canReadPerm
            ? fetch(`${API_URL}/permission-categories`, { cache: 'no-store' })
            : Promise.resolve({ ok: false }),
        ]);
        if (rolesRes.ok) setRoles((await rolesRes.json()).roles || []);
        if (permsRes.ok)
          setPermissions((await permsRes.json()).permissions || []);
        if (catsRes.ok) setCategories((await catsRes.json()).categories || []);
        if (clearFocus) {
          setShowOnlyCategory(null);
          setLastUpdatedItem(null);
        }
      } catch {
        showToast('error', 'Error', 'Failed to load data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast, canReadRole, canReadPerm]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    if (canReadRole || canReadPerm) fetchData();
    else setLoading(false);
  }, []);

  const handleShowAll = useCallback(() => {
    setLastUpdatedItem(null);
    setShowOnlyCategory(null);
    fetchData({ showRefresh: true, clearFocus: false });
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    fetchData({ showRefresh: true });
  }, [fetchData]);

  const handleCreateRole = useCallback(() => {
    if (!canCreateRole) return;
    setEditingRole(null);
    setFormType('role');
    setShowForm(true);
  }, [canCreateRole]);

  const handleEditRole = useCallback(
    (role) => {
      if (!canUpdateRole) return;
      setEditingRole(role);
      setFormType('role');
      setShowForm(true);
    },
    [canUpdateRole]
  );

  const handleDeleteRole = useCallback(
    (role) => {
      if (!canDeleteRole) return;
      setDeleteConfirm({ ...role, type: 'role' });
    },
    [canDeleteRole]
  );

  const handleCreatePermission = useCallback(() => {
    if (!canCreatePerm) return;
    setEditingPermission(null);
    setFormType('permission');
    setShowForm(true);
  }, [canCreatePerm]);

  const handleEditPermission = useCallback(
    (perm) => {
      if (!canUpdatePerm) return;
      setEditingPermission(perm);
      setFormType('permission');
      setShowForm(true);
    },
    [canUpdatePerm]
  );

  const handleDeletePermission = useCallback(
    (perm) => {
      if (!canDeletePerm) return;
      setDeleteConfirm({ ...perm, type: 'permission' });
    },
    [canDeletePerm]
  );

  const handleCreateCategory = useCallback(() => {
    if (!canCreateCategory) return;
    setEditingCategory(null);
    setFormType('category');
    setShowForm(true);
  }, [canCreateCategory]);

  const handleEditCategory = useCallback(
    (cat) => {
      if (!canUpdateCategory) return;
      setEditingCategory(cat);
      setFormType('category');
      setShowForm(true);
    },
    [canUpdateCategory]
  );

  const handleDeleteCategory = useCallback(
    (cat) => {
      if (!canDeleteCategory) return;
      setDeleteConfirm({ ...cat, type: 'category' });
    },
    [canDeleteCategory]
  );

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingRole(null);
    setEditingPermission(null);
    setEditingCategory(null);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteConfirm(null);
    setDeleteError(null);
  }, []);

  // ─── SUBMIT handlers ──────────────────────────────────────────
  const handleRoleSubmit = useCallback(
    async (formData) => {
      if (!editingRole && !canCreateRole) return;
      if (editingRole && !canUpdateRole) return;
      const isEdit = !!editingRole;
      const url = isEdit
        ? `${API_URL}/roles/${editingRole.id}`
        : `${API_URL}/roles`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showToast(
          'success',
          'Success',
          isEdit ? 'Role updated' : 'Role created'
        );
        setShowForm(false);
        setEditingRole(null);
        setLastUpdatedItem({
          ...(data.role || { name: formData.name }),
          type: 'role',
          _action: isEdit ? 'updated' : 'created',
        });
        setShowOnlyCategory(null);
        await fetchData({ showRefresh: true, clearFocus: false });
      } else {
        showToast('error', 'Error', data.error || 'Failed to save role');
      }
    },
    [editingRole, fetchData, showToast, canCreateRole, canUpdateRole]
  );

  const handlePermissionSubmit = useCallback(
    async (formData) => {
      if (!editingPermission && !canCreatePerm) return;
      if (editingPermission && !canUpdatePerm) return;
      const isEdit = !!editingPermission;
      const url = isEdit
        ? `${API_URL}/permissions/${editingPermission.id}`
        : `${API_URL}/permissions`;
      const method = isEdit ? 'PATCH' : 'POST';
      const submitData = {
        ...formData,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(submitData),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showToast(
          'success',
          'Success',
          isEdit ? 'Permission updated' : 'Permission created'
        );
        setShowForm(false);
        setEditingPermission(null);
        setLastUpdatedItem({
          ...(data.permission || {}),
          type: 'permission',
          _action: isEdit ? 'updated' : 'created',
        });
        setShowOnlyCategory(
          data.permission?.module || data.permission?.category?.code || null
        );
        await fetchData({ showRefresh: true, clearFocus: false });
      } else {
        showToast('error', 'Error', data.error || 'Failed to save permission');
      }
    },
    [editingPermission, fetchData, showToast, canCreatePerm, canUpdatePerm]
  );

  const handleCategorySubmit = useCallback(
    async (formData) => {
      if (!editingCategory && !canCreateCategory) return;
      if (editingCategory && !canUpdateCategory) return;
      const isEdit = !!editingCategory;
      const url = isEdit
        ? `${API_URL}/permission-categories/${editingCategory.id}`
        : `${API_URL}/permission-categories`;
      const method = isEdit ? 'PATCH' : 'POST';
      const { permissions: selectedPermissions, ...categoryData } = formData;
      const submitData = {
        ...categoryData,
        ...(isEdit ? {} : { permissions: selectedPermissions || [] }),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(submitData),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showToast(
          'success',
          'Success',
          isEdit
            ? 'Category updated'
            : `Category created with ${
                selectedPermissions?.length || 0
              } permissions`
        );
        setShowForm(false);
        setEditingCategory(null);
        await fetchData({ showRefresh: true, clearFocus: false });
      } else {
        showToast('error', 'Error', data.error || 'Failed to save category');
      }
    },
    [
      editingCategory,
      fetchData,
      showToast,
      canCreateCategory,
      canUpdateCategory,
    ]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'role' && !canDeleteRole) return;
    if (deleteConfirm.type === 'permission' && !canDeletePerm) return;
    if (deleteConfirm.type === 'category' && !canDeleteCategory) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      let url = '';
      if (deleteConfirm.type === 'role')
        url = `${API_URL}/roles/${deleteConfirm.id}`;
      else if (deleteConfirm.type === 'permission')
        url = `${API_URL}/permissions/${deleteConfirm.id}`;
      else if (deleteConfirm.type === 'category')
        url = `${API_URL}/permission-categories/${deleteConfirm.id}`;

      const res = await fetch(url, { method: 'DELETE', cache: 'no-store' });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setDeleteConfirm(null);
        setDeleteError(null);
        if (
          lastUpdatedItem?.id === deleteConfirm.id &&
          lastUpdatedItem?.type === deleteConfirm.type
        ) {
          setLastUpdatedItem(null);
          setShowOnlyCategory(null);
        }
        showToast(
          'success',
          'Deleted',
          `${deleteConfirm.name} deleted successfully`
        );
        await fetchData({ showRefresh: true, clearFocus: false });
      } else {
        setDeleteError({
          title: 'Cannot Delete',
          message: data.error || 'This item has dependencies',
        });
      }
    } catch (error) {
      setDeleteError({
        title: 'Error',
        message: error.message || 'An unexpected error occurred',
      });
    } finally {
      setDeleting(false);
    }
  }, [
    deleteConfirm,
    fetchData,
    lastUpdatedItem,
    showToast,
    canDeleteRole,
    canDeletePerm,
    canDeleteCategory,
  ]);

  // ─── derived ─────────────────────────────────────────────────
  const filteredRoles = useMemo(
    () =>
      roles.filter(
        (r) => !search || r.name.toLowerCase().includes(search.toLowerCase())
      ),
    [roles, search]
  );

  const filteredPermissions = useMemo(
    () =>
      permissions.filter(
        (p) =>
          !search || (p.name || '').toLowerCase().includes(search.toLowerCase())
      ),
    [permissions, search]
  );

  const groupedPermissions = useMemo(() => {
    return filteredPermissions.reduce((acc, perm) => {
      const key = perm.category?.code || perm.module || 'OTHER';
      if (!acc[key]) acc[key] = [];
      acc[key].push(perm);
      return acc;
    }, {});
  }, [filteredPermissions]);

  const displayedGroupedPermissions = showOnlyCategory
    ? { [showOnlyCategory]: groupedPermissions[showOnlyCategory] || [] }
    : groupedPermissions;

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Roles & Permissions', href: '/dashboard/roles', icon: Shield },
  ];

  // ── tabs ─────────────────────────────────────────────────────
  const tabs = useMemo(() => {
    const list = [];
    if (canReadRole)
      list.push({ value: 'roles', label: 'Roles', icon: Shield });
    if (canReadPerm)
      list.push({ value: 'permissions', label: 'Permissions', icon: Key });
    if (canViewAssignment)
      list.push({ value: 'assignment', label: 'Assignment', icon: Lock });
    return list;
  }, [canReadRole, canReadPerm, canViewAssignment]);

  useEffect(() => {
    const values = [];
    if (canReadRole) values.push('roles');
    if (canReadPerm) values.push('permissions');
    if (canViewAssignment) values.push('assignment');
    if (values.length === 0) return;
    if (!values.includes(activeTab)) setActiveTab(values[0]);
  }, [canReadRole, canReadPerm, canViewAssignment, activeTab]);

  const isFocused = !!lastUpdatedItem || !!showOnlyCategory;

  // ─── hard deny ───────────────────────────────────────────────
  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md p-8 bg-red-50 rounded-2xl ring-1 ring-red-200 shadow-sm">
          <Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2 text-red-900">Access Denied</h2>
          <p className="text-red-700 text-sm">
            You don't have permission to view roles or permissions.
          </p>
          {isSysAdmin && (
            <p className="text-red-700 text-xs mt-2">
              (You are a System Administrator — if you see this, check the
              provider snapshot.)
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── render ──────────────────────────────────────────────────
  return (
    <div className="space-y-4 px-4 lg:px-6 pb-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-4 z-[100] max-w-sm px-4 py-3 rounded-xl shadow-lg ring-1 ${
              toast.type === 'success'
                ? 'bg-emerald-50 ring-emerald-200'
                : toast.type === 'error'
                ? 'bg-red-50 ring-red-200'
                : 'bg-blue-50 ring-blue-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <Info className="w-5 h-5 text-blue-600" />
              )}
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm block text-slate-900">
                  {toast.title}
                </span>
                <p className="text-xs text-slate-600 truncate">
                  {toast.message}
                </p>
              </div>
              <button onClick={() => setToast(null)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
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
                Roles &amp; Permissions
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[11px] font-medium ring-1 ring-purple-100">
                  <Shield className="w-3 h-3" />
                  {roles.length} Roles
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-medium ring-1 ring-indigo-100">
                  <Key className="w-3 h-3" />
                  {permissions.length} Permissions
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-[11px] font-medium ring-1 ring-teal-100">
                  <Folder className="w-3 h-3" />
                  {categories.length} Categories
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isFocused && (
                <button
                  onClick={handleShowAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg ring-1 ring-amber-200 hover:bg-amber-100 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Show All
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 text-xs font-medium rounded-lg ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
                />
              </button>
              {activeTab === 'roles' && canCreateRole && (
                <button
                  onClick={handleCreateRole}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs font-semibold rounded-lg hover:from-purple-700 hover:to-violet-700 cursor-pointer shadow-[0_4px_12px_-2px_rgba(147,51,234,0.5)]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Role
                </button>
              )}
              {activeTab === 'permissions' && (
                <>
                  {canCreateCategory && (
                    <button
                      onClick={handleCreateCategory}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-semibold rounded-lg hover:from-teal-700 hover:to-emerald-700 cursor-pointer shadow-[0_4px_12px_-2px_rgba(20,184,166,0.5)]"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      Add Category
                    </button>
                  )}
                  {canCreatePerm && (
                    <button
                      onClick={handleCreatePermission}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold rounded-lg hover:from-indigo-700 hover:to-violet-700 cursor-pointer shadow-[0_4px_12px_-2px_rgba(99,102,241,0.5)]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create Permission
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeTab === 'permissions' && (
              <div className="flex bg-white ring-1 ring-slate-200 rounded-lg p-0.5 shadow-sm">
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-1.5 rounded-md cursor-pointer ${
                    viewMode === 'card'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Focus banner */}
      {isFocused && (
        <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 ring-1 ring-amber-200 rounded-xl text-sm text-amber-800 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-600" />
            <span>
              {lastUpdatedItem?.type === 'role'
                ? `Showing the ${
                    lastUpdatedItem._action === 'updated'
                      ? 'updated'
                      : 'created'
                  } role.`
                : lastUpdatedItem?.type === 'permission'
                ? 'Showing the focused permission category.'
                : showOnlyCategory
                ? 'Showing a focused category.'
                : 'Showing the updated item.'}{' '}
              Click <strong>Show All</strong> to see everything.
            </span>
          </div>
          <button
            onClick={handleShowAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-amber-800 text-xs font-medium rounded-lg ring-1 ring-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} /> Show All
          </button>
        </div>
      )}

      {/* ROLES TAB */}
      {activeTab === 'roles' && canReadRole && (
        <RolesTab
          roles={filteredRoles}
          loading={loading}
          lastUpdatedItem={lastUpdatedItem}
          onEdit={handleEditRole}
          onDelete={handleDeleteRole}
          onCreate={handleCreateRole}
          onShowAll={handleShowAll}
          canEdit={canUpdateRole}
          canDelete={canDeleteRole}
          canCreate={canCreateRole}
        />
      )}

      {/* PERMISSIONS TAB — card view */}
      {activeTab === 'permissions' && viewMode === 'card' && canReadPerm && (
        <div className="space-y-5">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-slate-200/60 shadow-[0_1px_0_rgba(15,23,42,0.03),0_8px_24px_-12px_rgba(15,23,42,0.08)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                <Folder className="w-4 h-4 text-teal-500" />
                Permission Categories
                <span className="text-[10px] text-slate-400">
                  ({categories.length})
                </span>
              </h3>
              {canCreateCategory && (
                <button
                  onClick={handleCreateCategory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-medium rounded-lg hover:from-teal-700 hover:to-emerald-700 cursor-pointer shadow-sm"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  Add Category
                </button>
              )}
            </div>
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`group relative p-3 rounded-xl ring-1 transition-all hover:shadow-sm ${
                      CATEGORY_ACCENTS[cat.color] || 'ring-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-white/70 ring-1 ring-black/5 flex items-center justify-center flex-shrink-0">
                          <Folder className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">
                            {cat.name}
                          </p>
                          <p className="text-[9px] opacity-70 truncate">
                            {cat.code}
                          </p>
                        </div>
                      </div>
                      {(canUpdateCategory || canDeleteCategory) && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {canUpdateCategory && (
                            <button
                              onClick={() => handleEditCategory(cat)}
                              className="p-1 rounded text-slate-500 hover:bg-white/70 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          {canDeleteCategory && (
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-[10px] opacity-70 mt-1 line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 text-[9px] opacity-70">
                      <span>{cat._count?.permissions || 0} permissions</span>
                      <span>Order: {cat.sortOrder}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <Folder className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">No categories found</p>
              </div>
            )}
          </div>

          {loading ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-slate-200/60 p-6">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : Object.keys(displayedGroupedPermissions).length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-slate-200/60 flex flex-col items-center justify-center py-16 text-slate-400">
              <Key className="w-12 h-12 mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No permissions found
              </p>
            </div>
          ) : (
            Object.entries(displayedGroupedPermissions).map(
              ([categoryCode, perms]) => {
                const category = categories.find(
                  (c) => c.code === categoryCode
                );
                const label = category?.name || categoryCode.replace(/_/g, ' ');
                return (
                  <motion.div
                    key={categoryCode}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-slate-200/60 shadow-[0_1px_0_rgba(15,23,42,0.03),0_8px_24px_-12px_rgba(15,23,42,0.08)] overflow-hidden"
                  >
                    <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-200/70">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
                            <Folder className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">
                              {label}
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              {perms.length} permission
                              {perms.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {category &&
                          (canUpdateCategory || canDeleteCategory) && (
                            <div className="flex items-center gap-1">
                              {canUpdateCategory && (
                                <button
                                  onClick={() => handleEditCategory(category)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDeleteCategory && (
                                <button
                                  onClick={() => handleDeleteCategory(category)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                      {perms.map((perm) => {
                        const isHighlighted =
                          lastUpdatedItem?.id === perm.id &&
                          lastUpdatedItem?.type === 'permission';
                        return (
                          <div
                            key={perm.id}
                            className={`group relative p-3 rounded-xl ring-1 transition-all ${
                              isHighlighted
                                ? 'bg-amber-50/70 ring-amber-200'
                                : 'bg-white ring-slate-200 hover:ring-indigo-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <Badge
                                className={
                                  ACTION_COLORS[perm.action] ||
                                  'bg-slate-50 text-slate-600 ring-slate-200'
                                }
                              >
                                {perm.action}
                              </Badge>
                              {(canUpdatePerm || canDeletePerm) && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {canUpdatePerm && (
                                    <button
                                      onClick={() => handleEditPermission(perm)}
                                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                  {canDeletePerm && (
                                    <button
                                      onClick={() =>
                                        handleDeletePermission(perm)
                                      }
                                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <p className="text-xs font-medium text-slate-900 truncate">
                              {perm.name}
                            </p>
                            {perm.description && (
                              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                                {perm.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              }
            )
          )}
        </div>
      )}

      {/* PERMISSIONS TAB — list view */}
      {activeTab === 'permissions' && viewMode === 'list' && canReadPerm && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-slate-200/60 shadow-[0_1px_0_rgba(15,23,42,0.03),0_8px_24px_-12px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70">
                  {['Permission', 'Action', 'Category', 'Description', ''].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPermissions.map((perm) => (
                  <tr key={perm.id} className="hover:bg-indigo-50/40">
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">
                      {perm.name}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        className={
                          ACTION_COLORS[perm.action] ||
                          'bg-slate-50 text-slate-600 ring-slate-200'
                        }
                      >
                        {perm.action}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      {perm.category?.name || perm.module || '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-xs truncate">
                      {perm.description || '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {(canUpdatePerm || canDeletePerm) && (
                        <div className="flex items-center justify-end gap-1">
                          {canUpdatePerm && (
                            <button
                              onClick={() => handleEditPermission(perm)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDeletePerm && (
                            <button
                              onClick={() => handleDeletePermission(perm)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ASSIGNMENT TAB */}
      {activeTab === 'assignment' && canViewAssignment && (
        <div className="space-y-4">
          <AssignmentTab categories={categories} />
        </div>
      )}

      {/* Modals */}
      {showForm && formType === 'role' && (
        <RoleFormModal
          role={editingRole}
          onClose={handleCloseForm}
          onSubmit={handleRoleSubmit}
        />
      )}
      {showForm && formType === 'permission' && (
        <PermissionFormModal
          permission={editingPermission}
          categories={categories}
          onClose={handleCloseForm}
          onSubmit={handlePermissionSubmit}
        />
      )}
      {showForm && formType === 'category' && (
        <CategoryModal
          category={editingCategory}
          onClose={handleCloseForm}
          onSubmit={handleCategorySubmit}
        />
      )}
      {deleteConfirm && (
        <DeleteModal
          deleteConfirm={deleteConfirm}
          deleteError={deleteError}
          deleting={deleting}
          onClose={handleCloseDelete}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

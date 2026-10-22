// components/roles/PermissionsTab.js
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Key,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Settings,
  Plus,
  FolderPlus,
  Folder,
  FolderEdit,
  FolderX,
  ChevronDown,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';
import { moduleIcons, moduleColors, moduleLabels } from '@/lib/moduleConfig';

function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-white/10 text-blue-100 border border-white/20',
    success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30',
    danger: 'bg-red-500/20 text-red-300 border border-red-400/30',
    warning: 'bg-amber-500/20 text-amber-300 border border-amber-400/30',
    info: 'bg-blue-500/20 text-blue-300 border border-blue-400/30',
    purple: 'bg-purple-500/20 text-purple-300 border border-purple-400/30',
    indigo: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30',
    teal: 'bg-teal-500/20 text-teal-300 border border-teal-400/30',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-white/10 rounded ${className}`} />;
}

// ==================== PERMISSION CATEGORY MODAL ====================
function CategoryModal({ category, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    code: category?.code || '',
    description: category?.description || '',
    icon: category?.icon || 'Settings',
    color: category?.color || 'blue',
    sortOrder: category?.sortOrder || 0,
  });

  const iconOptions = [
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-slate-900 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/20 bg-white/5">
            <h3 className="text-base font-semibold text-white">
              {category ? 'Edit Category' : 'Create Category'}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-blue-200/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(form);
            }}
            className="p-6 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-blue-100 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="e.g., User Management"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-100 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  value={form.code}
                  required
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="e.g., USER_MANAGEMENT"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-100 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                rows={2}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Brief description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-blue-100 mb-1">
                  Icon
                </label>
                <select
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-xs text-white cursor-pointer"
                >
                  {iconOptions.map((icon) => (
                    <option
                      key={icon}
                      value={icon}
                      className="bg-slate-900 text-white"
                    >
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-100 mb-1">
                  Color
                </label>
                <select
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-xs text-white cursor-pointer"
                >
                  {colorOptions.map((color) => (
                    <option
                      key={color}
                      value={color}
                      className="bg-slate-900 text-white"
                    >
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-100 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/10 text-blue-100 text-xs rounded-lg hover:bg-white/20 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                {category ? 'Update' : 'Create'} Category
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==================== DELETE CATEGORY MODAL ====================
function DeleteCategoryModal({ category, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-slate-900 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/20 bg-white/5">
            <h3 className="text-base font-semibold text-white">
              Delete Category
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-blue-200/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-xl border border-red-400/30">
              <FolderX className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-200">
                  Confirm Deletion
                </p>
                <p className="text-xs text-red-300 mt-0.5">
                  This category will be deleted
                </p>
              </div>
            </div>
            <p className="text-sm text-blue-100/80">
              Are you sure you want to delete{' '}
              <strong className="text-white">{category?.name}</strong>?
            </p>
            {category?._count?.permissions > 0 && (
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-400/30">
                <p className="text-xs text-amber-300">
                  This category has {category._count.permissions} permission(s).
                  Deleting it will unassign those permissions from this
                  category.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={onClose}
                disabled={deleting}
                className="px-4 py-2 bg-white/10 text-blue-100 text-xs font-medium rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PERMISSIONS TAB ====================
export default function PermissionsTab({
  groupedPermissions,
  viewMode,
  setViewMode,
  loading,
  lastUpdatedItem,
  onEdit,
  onDelete,
  onCreate,
  getActionColor,
  categories = [],
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete,
}) {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [showCategories, setShowCategories] = useState(true);

  const handleCategorySubmit = async (formData) => {
    if (editingCategory) {
      await onCategoryUpdate?.(editingCategory.id, formData);
    } else {
      await onCategoryCreate?.(formData);
    }
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const handleCategoryDelete = async () => {
    setDeletingCategory(true);
    await onCategoryDelete?.(deleteCategory.id);
    setDeletingCategory(false);
    setDeleteCategory(null);
  };

  if (viewMode === 'card') {
    return (
      <div className="space-y-5">
        {/* View Toggle and Category Management */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 text-blue-100 text-xs font-medium rounded-lg border border-white/20 hover:bg-white/20 cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5" />
              Categories
              {showCategories ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Add Category
            </button>
          </div>
          <div className="flex bg-white/10 rounded-lg p-0.5 border border-white/20">
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200/50'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Categories List */}
        {showCategories && categories.length > 0 && (
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-4 shadow-2xl">
            <h3 className="text-xs font-semibold text-white mb-3">
              Permission Categories
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Folder className="w-3.5 h-3.5 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">
                        {cat.name}
                      </p>
                      <p className="text-[10px] text-blue-200/50">
                        {cat._count?.permissions || 0} permissions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setShowCategoryModal(true);
                      }}
                      className="p-1 rounded text-blue-300 hover:bg-blue-500/20 cursor-pointer"
                    >
                      <FolderEdit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setDeleteCategory(cat)}
                      className="p-1 rounded text-red-300 hover:bg-red-500/20 cursor-pointer"
                    >
                      <FolderX className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6">
            <Skeleton className="h-32 w-full" />
          </div>
        ) : Object.keys(groupedPermissions).length === 0 ? (
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 flex flex-col items-center justify-center py-16 text-blue-200/40">
            <Key className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium text-blue-200/50">
              No permissions found
            </p>
            <button
              onClick={onCreate}
              className="mt-3 text-blue-300 text-sm font-medium hover:underline cursor-pointer"
            >
              Create your first permission
            </button>
          </div>
        ) : (
          Object.entries(groupedPermissions).map(([module, perms]) => {
            const ModuleIcon = moduleIcons[module] || Settings;
            const colorClass =
              moduleColors[module] || 'border-white/20 bg-white/5';
            const label = moduleLabels[module] || module.replace(/_/g, ' ');
            return (
              <motion.div
                key={module}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden shadow-2xl"
              >
                <div className={`px-5 py-3 border-b ${colorClass}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/10 shadow-sm flex items-center justify-center">
                      <ModuleIcon className="w-4 h-4 text-blue-200" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-white">
                        {label}
                      </h3>
                      <p className="text-[10px] text-blue-200/50">
                        {perms.length} permission{perms.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {perms.map((perm) => (
                    <div
                      key={perm.id}
                      className={`group relative p-3 rounded-lg border transition-all hover:shadow-sm ${
                        lastUpdatedItem?.id === perm.id &&
                        lastUpdatedItem?.type === 'permission'
                          ? 'border-blue-400/30 bg-blue-500/20'
                          : 'border-white/20 hover:border-blue-400/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <Badge variant={getActionColor(perm.action)}>
                          {perm.action}
                        </Badge>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(perm)}
                            className="p-1 rounded text-blue-300 hover:bg-blue-500/20 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDelete(perm)}
                            className="p-1 rounded text-red-300 hover:bg-red-500/20 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-white truncate">
                        {perm.name}
                      </p>
                      {perm.description && (
                        <p className="text-[10px] text-blue-200/50 mt-0.5 line-clamp-2">
                          {perm.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })
        )}

        {/* Category Modals */}
        {showCategoryModal && (
          <CategoryModal
            category={editingCategory}
            onClose={() => {
              setShowCategoryModal(false);
              setEditingCategory(null);
            }}
            onSubmit={handleCategorySubmit}
          />
        )}
        {deleteCategory && (
          <DeleteCategoryModal
            category={deleteCategory}
            onClose={() => setDeleteCategory(null)}
            onConfirm={handleCategoryDelete}
            deleting={deletingCategory}
          />
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowCategoryModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Add Category
          </button>
        </div>
        <div className="flex bg-white/10 rounded-lg p-0.5 border border-white/20">
          <button
            onClick={() => setViewMode('card')}
            className={`p-1.5 rounded-md cursor-pointer ${
              viewMode === 'card'
                ? 'bg-blue-600 text-white'
                : 'text-blue-200/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md cursor-pointer ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-blue-200/50'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="bg-white/5">
                  {[
                    'Permission',
                    'Category',
                    'Module',
                    'Action',
                    'Description',
                    'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[11px] font-semibold text-blue-200/70 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {Object.values(groupedPermissions)
                  .flat()
                  .map((perm, i) => (
                    <motion.tr
                      key={perm.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`hover:bg-white/5 transition-colors ${
                        lastUpdatedItem?.id === perm.id &&
                        lastUpdatedItem?.type === 'permission'
                          ? 'bg-blue-500/10'
                          : ''
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Key className="w-4 h-4 text-blue-300" />
                          </div>
                          <p className="text-xs font-medium text-white">
                            {perm.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-blue-100/80">
                          {perm.category?.name || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-blue-100/80">
                          {moduleLabels[perm.module] ||
                            perm.module?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={getActionColor(perm.action)}>
                          {perm.action}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-blue-200/50 truncate max-w-[200px] block">
                          {perm.description || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEdit(perm)}
                            className="p-1.5 rounded-md text-blue-300 hover:bg-blue-500/20 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(perm)}
                            className="p-1.5 rounded-md text-red-300 hover:bg-red-500/20 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Modals */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSubmit={handleCategorySubmit}
        />
      )}
      {deleteCategory && (
        <DeleteCategoryModal
          category={deleteCategory}
          onClose={() => setDeleteCategory(null)}
          onConfirm={handleCategoryDelete}
          deleting={deletingCategory}
        />
      )}
    </div>
  );
}

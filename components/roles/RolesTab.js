// components/roles/RolesTab.js
'use client';

import { motion } from 'framer-motion';
import { Shield, ShieldCheck, Edit2, Trash2, RotateCcw } from 'lucide-react';

function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
  );
}

export default function RolesTab({
  roles,
  loading,
  lastUpdatedItem,
  onEdit,
  onDelete,
  onCreate,
  onShowAll,
  // permission flags — default to false so an un-updated caller is deny-by-default
  canEdit = false,
  canDelete = false,
  canCreate = false,
}) {
  const showOnlyRole =
    lastUpdatedItem?.type === 'role' && lastUpdatedItem?.id != null;

  const displayedRoles = showOnlyRole
    ? roles.filter((r) => r.id === lastUpdatedItem.id)
    : roles;

  const showActionsColumn = canEdit || canDelete;

  return (
    <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-[0_1px_0_rgba(15,23,42,0.03),0_8px_24px_-12px_rgba(15,23,42,0.08)] overflow-hidden">
      {showOnlyRole && (
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-800">
          <span>
            Showing the{' '}
            {lastUpdatedItem._action === 'updated' ? 'updated' : 'created'} role
            only.
          </span>
          <button
            onClick={onShowAll}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white ring-1 ring-amber-200 hover:bg-amber-100 rounded-md font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Show All
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : displayedRoles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Shield className="w-12 h-12 mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No roles found</p>
          {canCreate && (
            <button
              onClick={onCreate}
              className="mt-3 text-indigo-600 text-sm font-medium hover:underline cursor-pointer"
            >
              Create your first role
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[36%]">
                  Role
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[12%]">
                  Permissions
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[10%]">
                  Users
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[20%]">
                  Created
                </th>
                {showActionsColumn && (
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[12%]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRoles.map((role, i) => {
                const isHighlighted =
                  lastUpdatedItem?.id === role.id &&
                  lastUpdatedItem?.type === 'role';

                return (
                  <motion.tr
                    key={role.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`align-middle transition-colors ${
                      isHighlighted ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-5 py-3.5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 ring-1 ring-purple-200 flex items-center justify-center flex-shrink-0">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {role.name}
                            {isHighlighted && (
                              <span className="ml-2 text-[10px] font-medium text-amber-700">
                                (Just updated)
                              </span>
                            )}
                          </p>
                          {role.description && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 align-middle">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold ring-1 ring-indigo-100 tabular-nums">
                        {role.permissions?.length || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 align-middle">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold ring-1 ring-slate-200 tabular-nums">
                        {role._count?.users || role.users?.length || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 align-middle text-xs text-slate-500 whitespace-nowrap">
                      {new Date(role.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                      })}
                    </td>
                    {showActionsColumn && (
                      <td className="px-5 py-3.5 align-middle text-right">
                        {canEdit || canDelete ? (
                          <div className="inline-flex items-center gap-1">
                            {canEdit && (
                              <button
                                onClick={() => onEdit(role)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                title="Edit role"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => onDelete(role)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete role"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 select-none">
                            —
                          </span>
                        )}
                      </td>
                    )}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

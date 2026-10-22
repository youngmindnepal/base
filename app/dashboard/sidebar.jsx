// app/dashboard/Sidebar.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  UserPlus,
  Shield,
  Key,
  Settings,
  ChevronDown,
  ChevronLeft,
  X,
  LogOut,
} from 'lucide-react';

const ICONS = {
  LayoutDashboard,
  Users,
  UserCircle,
  UserPlus,
  Shield,
  Key,
  Settings,
};

function getIcon(name) {
  return ICONS[name] || LayoutDashboard;
}

const EXPANDED_WIDTH = 264;
const COLLAPSED_WIDTH = 76;

function initialsFrom(email = '') {
  const name = email.split('@')[0] || '';
  const parts = name.split(/[._-]/).filter(Boolean);
  const letters =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase() || '?';
}

/**
 * EXACT match only.
 * Used for leaf menu items (a leaf is a single page, not a section).
 * Prevents "/dashboard" from matching "/dashboard/users".
 */
function isExactPath(pathname, href) {
  if (!href) return false;
  return pathname === href;
}

/**
 * EXACT or DESCENDANT match.
 * Used for children of groups so a detail page like /users/123
 * still highlights its parent "All Users" item.
 */
function isSectionPath(pathname, href) {
  if (!href) return false;
  return pathname === href || pathname.startsWith(href + '/');
}

export default function Sidebar({
  menu,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  userEmail = '',
}) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState({});
  const [hovered, setHovered] = useState(null); // { label, top }
  const hoverTimeout = useRef(null);

  // Auto-expand groups whose children match the current path
  useEffect(() => {
    const next = {};
    for (const item of menu) {
      if (item.children?.some((c) => isSectionPath(pathname, c.href))) {
        next[item.label] = true;
      }
    }
    if (Object.keys(next).length > 0) {
      setOpenGroups((prev) => ({ ...prev, ...next }));
    }
  }, [pathname, menu]);

  function toggleGroup(label) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function scheduleClose() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHovered(null), 140);
  }

  function keepOpen() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
  }

  const hoveredItem = hovered
    ? menu.find((m) => m.label === hovered.label)
    : null;

  const isCollapsed = !!collapsed;

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop spacer */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ width: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="hidden md:block shrink-0"
      />

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className={`
          fixed md:fixed top-0 left-0 h-screen z-40
          flex flex-col overflow-hidden
          bg-white/80 backdrop-blur-xl
          shadow-[0_0_0_1px_rgba(15,23,42,0.03),0_20px_60px_-15px_rgba(15,23,42,0.15)]
          md:translate-x-0
          ${mobileOpen ? '' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Soft gradient sheen */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-400/20 via-violet-400/10 to-transparent blur-3xl" />
          <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full bg-gradient-to-tl from-fuchsia-400/10 via-pink-300/5 to-transparent blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative flex items-center h-16 px-4 shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            {!isCollapsed && (
              <motion.div
                key="brand"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2.5 min-w-0"
              >
                <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(99,102,241,0.5)]">
                  <span className="text-white text-sm font-bold">B</span>
                </div>
                <Link
                  href="/dashboard"
                  className="font-semibold text-slate-900 tracking-tight text-[15px]"
                >
                  Bridge
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {isCollapsed && (
            <div className="w-8 h-8 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(99,102,241,0.5)]">
              <span className="text-white text-sm font-bold">B</span>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden md:inline-flex ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Expand handle (visible when collapsed) */}
        {isCollapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="hidden md:flex mx-auto -mt-2 mb-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronLeft size={16} className="rotate-180" />
          </button>
        )}

        {/* Menu */}
        <div className="relative flex-1 overflow-y-auto overflow-x-hidden py-2 px-3 sidebar-scroll">
          {!isCollapsed && (
            <div className="px-3 pt-2 pb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Menu
            </div>
          )}

          {menu.map((item) => {
            const Icon = getIcon(item.iconName);
            const hasChildren = !!item.children?.length;

            // LEAF items are full pages → exact match only
            const isActiveLeaf =
              !hasChildren && isExactPath(pathname, item.href);

            // GROUP items are sections → active when any child matches
            const groupActive =
              hasChildren &&
              item.children.some((c) => isSectionPath(pathname, c.href));

            if (hasChildren) {
              const isOpen = openGroups[item.label] ?? groupActive;
              return (
                <div key={item.label} className="mb-0.5 relative">
                  <button
                    onClick={() => {
                      if (isCollapsed) return;
                      toggleGroup(item.label);
                    }}
                    onMouseEnter={(e) => {
                      if (!isCollapsed) return;
                      keepOpen();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHovered({ label: item.label, top: rect.top });
                    }}
                    onMouseLeave={() => {
                      if (!isCollapsed) return;
                      scheduleClose();
                    }}
                    className={`
                      group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                      transition-all duration-150
                      ${
                        groupActive
                          ? 'text-slate-900 font-medium bg-slate-100/70'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      size={18}
                      className={`shrink-0 transition-colors ${
                        groupActive
                          ? 'text-indigo-600'
                          : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                    />
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.span
                          key="label"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.16 }}
                          className="flex items-center gap-2 flex-1 overflow-hidden"
                        >
                          <span className="flex-1 text-left whitespace-nowrap">
                            {item.label}
                          </span>
                          <motion.span
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 300,
                              damping: 22,
                            }}
                            className="inline-flex text-slate-400"
                          >
                            <ChevronDown size={14} />
                          </motion.span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* Inline submenu */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && isOpen && (
                      <motion.div
                        key="children"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="ml-[22px] pl-3 mt-0.5 space-y-0.5 border-l border-slate-200/80">
                          {item.children.map((child) => {
                            const ChildIcon = getIcon(child.iconName);
                            // Children are sections → prefix matching is fine
                            const childActive = isSectionPath(
                              pathname,
                              child.href
                            );
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setMobileOpen(false)}
                                className={`
                                  group relative flex items-center gap-3 px-3 py-2 text-sm rounded-lg
                                  transition-all duration-150
                                  ${
                                    childActive
                                      ? 'text-slate-900 font-medium'
                                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                                  }
                                `}
                              >
                                {childActive && (
                                  <motion.span
                                    layoutId="activeChild"
                                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 -z-10"
                                    transition={{
                                      type: 'spring',
                                      stiffness: 400,
                                      damping: 34,
                                    }}
                                  />
                                )}
                                <ChildIcon
                                  size={15}
                                  className={`shrink-0 transition-colors ${
                                    childActive
                                      ? 'text-indigo-600'
                                      : 'text-slate-400 group-hover:text-slate-600'
                                  }`}
                                />
                                <span className="whitespace-nowrap">
                                  {child.label}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl mb-0.5
                  transition-all duration-150
                  ${
                    isActiveLeaf
                      ? 'text-slate-900 font-medium'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                {isActiveLeaf && (
                  <motion.span
                    layoutId="activeTop"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 -z-10 ring-1 ring-inset ring-indigo-500/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    isActiveLeaf
                      ? 'text-indigo-600'
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.16 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActiveLeaf && !isCollapsed && (
                  <motion.span
                    layoutId="activeDot"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer — user + sign out */}
        <div className="relative shrink-0 p-3">
          <div
            className={`
              rounded-2xl bg-white/70 backdrop-blur-sm p-2
              shadow-[0_1px_0_rgba(15,23,42,0.04),0_8px_24px_-8px_rgba(15,23,42,0.12)]
              ring-1 ring-slate-900/[0.04]
            `}
          >
            <div
              className={`flex items-center gap-3 px-1.5 py-1.5 ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white text-xs font-semibold flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(99,102,241,0.5)]">
                  {initialsFrom(userEmail)}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
              </div>
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    key="user-meta"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.16 }}
                    className="flex-1 min-w-0 overflow-hidden"
                  >
                    <div className="text-[11px] text-slate-500 whitespace-nowrap leading-tight">
                      Signed in
                    </div>
                    <div
                      className="text-[13px] font-medium text-slate-900 truncate leading-tight"
                      title={userEmail}
                    >
                      {userEmail || 'Unknown'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`
                mt-1 w-full flex items-center gap-3 px-3 py-2 text-sm rounded-xl
                text-slate-500 hover:text-red-600 hover:bg-red-50/80 transition-all duration-150
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'Sign out' : undefined}
            >
              <LogOut size={17} className="shrink-0" />
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.span
                    key="signout-label"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.16 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    Sign out
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Hover flyout (collapsed mode, desktop only) */}
      <AnimatePresence>
        {isCollapsed && hoveredItem && hovered && (
          <motion.div
            key={`flyout-${hoveredItem.label}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            onMouseEnter={keepOpen}
            onMouseLeave={scheduleClose}
            style={{
              position: 'fixed',
              top: hovered.top,
              left: COLLAPSED_WIDTH + 10,
            }}
            className="
              z-[60] min-w-[230px] rounded-2xl
              bg-white/95 backdrop-blur-xl
              shadow-[0_8px_32px_-8px_rgba(15,23,42,0.24)]
              ring-1 ring-slate-900/[0.05]
              p-2
            "
          >
            <div className="px-3 pt-1 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {hoveredItem.label}
            </div>
            <div className="space-y-0.5">
              {hoveredItem.children.map((child) => {
                const ChildIcon = getIcon(child.iconName);
                const childActive = isSectionPath(pathname, child.href);
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => {
                      setMobileOpen(false);
                      setHovered(null);
                    }}
                    className={`
                      group flex items-center gap-3 px-3 py-2 text-sm rounded-xl
                      transition-all duration-150
                      ${
                        childActive
                          ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-slate-900 font-medium'
                          : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                      }
                    `}
                  >
                    <ChildIcon
                      size={16}
                      className={`shrink-0 ${
                        childActive
                          ? 'text-indigo-600'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="whitespace-nowrap">{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

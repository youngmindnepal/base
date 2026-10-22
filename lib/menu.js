// lib/menu.js
export const MENU = [
  {
    label: 'Overview',
    href: '/dashboard',
    iconName: 'LayoutDashboard',
    permission: 'DASHBOARD_MANAGEMENT_READ',
  },
  {
    label: 'User Management',
    href: '/dashboard/users',
    iconName: 'UserCircle',
    permission: 'USER_MANAGEMENT_READ',
  },
  {
    label: 'Roles & Permissions',
    href: '/dashboard/roles',
    iconName: 'Shield',
    permissions: [
      'ROLE_MANAGEMENT_READ',
      'PERMISSION_MANAGEMENT_READ',
      'ROLE_PERMISSION_ASSIGNMENT_READ',
      'ROLE_PERMISSION_ASSIGNMENT_CREATE',
      'ROLE_PERMISSION_ASSIGNMENT_UPDATE',
    ],
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    iconName: 'Settings',
    permission: 'SETTINGS_MANAGEMENT_READ',
    adminOnly: true,
  },
];

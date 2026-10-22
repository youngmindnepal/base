// app/dashboard/LogoutButton.jsx
'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="border rounded px-3 py-1 hover:bg-gray-100"
    >
      Sign out
    </button>
  );
}

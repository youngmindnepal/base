// app/providers.jsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/context/ThemeConetxt';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="daylight">{children}</ThemeProvider>
    </SessionProvider>
  );
}

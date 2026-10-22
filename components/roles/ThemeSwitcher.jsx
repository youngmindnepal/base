'use client';

import { useTheme } from '@/context/ThemeConetxt';
import { Palette } from 'lucide-react';

export default function ThemeSwitcher() {
  const { themeKey, themes, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Palette className="w-4 h-4" />
      <select
        value={themeKey}
        onChange={(e) => setTheme(e.target.value)}
        className="rounded-lg px-2 py-1 text-xs bg-black/20 border border-white/20 outline-none"
      >
        {Object.entries(themes).map(([key, t]) => (
          <option key={key} value={key} className="text-black">
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

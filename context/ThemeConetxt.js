'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

const ThemeContext = createContext(null);

// ─── THEME DEFINITIONS ───────────────────────────────────────────────
export const themes = {
  midnight: {
    name: 'Midnight',
    // Page
    pageBg: 'bg-slate-950',
    pageText: 'text-slate-100',
    // Surfaces
    surface: 'bg-white/10',
    surfaceHover: 'hover:bg-white/15',
    surfaceBorder: 'border-white/20',
    surfaceSolid: 'bg-slate-900',
    // Header
    headerBg: 'bg-slate-900/80',
    headerBorder: 'border-white/20',
    headerText: 'text-white',
    headerSubtext: 'text-blue-200/70',
    // Accents
    accent: 'text-blue-300',
    accentMuted: 'text-blue-200/70',
    accentFaint: 'text-blue-200/40',
    accentGradient: 'from-blue-400 to-indigo-500',
    accentShadow: 'shadow-blue-500/30',
    // Inputs
    inputBg: 'bg-white/10',
    inputBorder: 'border-white/20',
    inputText: 'text-white',
    inputPlaceholder: 'placeholder-blue-200/50',
    inputIcon: 'text-blue-200/50',
    inputFocus: 'focus:ring-blue-400',
    // Buttons
    primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    primaryBtnRing: 'focus:ring-blue-400/20',
    secondaryBtn: 'text-blue-200/70 hover:text-blue-200 hover:bg-white/10',
    // Feedback
    successText: 'text-emerald-300',
    successBg: 'bg-emerald-500/10',
    successBorder: 'border-emerald-400/30',
    errorText: 'text-red-300',
    errorBg: 'bg-red-500/10',
    errorBorder: 'border-red-400/30',
    warningText: 'text-yellow-300',
    // Info panel
    infoBg: 'bg-blue-500/10',
    infoBorder: 'border-blue-400/20',
    infoTitle: 'text-blue-200',
    infoText: 'text-blue-200/60',
    // Strength bar
    strengthTrack: 'bg-white/10',
    strengthWeak: 'bg-red-500',
    strengthFair: 'bg-yellow-500',
    strengthGood: 'bg-blue-400',
    strengthStrong: 'bg-emerald-500',
    // Toast
    toastBg: '#1e293b',
    toastText: '#fff',
    toastBorder: 'rgba(255,255,255,0.1)',
  },

  daylight: {
    name: 'Daylight',
    pageBg: 'bg-slate-50',
    pageText: 'text-slate-900',
    surface: 'bg-white',
    surfaceHover: 'hover:bg-slate-50',
    surfaceBorder: 'border-slate-200',
    surfaceSolid: 'bg-white',
    headerBg: 'bg-white/90',
    headerBorder: 'border-slate-200',
    headerText: 'text-slate-900',
    headerSubtext: 'text-slate-500',
    accent: 'text-indigo-600',
    accentMuted: 'text-slate-600',
    accentFaint: 'text-slate-400',
    accentGradient: 'from-indigo-500 to-violet-500',
    accentShadow: 'shadow-indigo-500/20',
    inputBg: 'bg-white',
    inputBorder: 'border-slate-300',
    inputText: 'text-slate-900',
    inputPlaceholder: 'placeholder-slate-400',
    inputIcon: 'text-slate-400',
    inputFocus: 'focus:ring-indigo-500',
    primaryBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    primaryBtnRing: 'focus:ring-indigo-500/20',
    secondaryBtn: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    successText: 'text-emerald-700',
    successBg: 'bg-emerald-50',
    successBorder: 'border-emerald-200',
    errorText: 'text-red-600',
    errorBg: 'bg-red-50',
    errorBorder: 'border-red-200',
    warningText: 'text-amber-600',
    infoBg: 'bg-indigo-50',
    infoBorder: 'border-indigo-200',
    infoTitle: 'text-indigo-700',
    infoText: 'text-slate-600',
    strengthTrack: 'bg-slate-200',
    strengthWeak: 'bg-red-500',
    strengthFair: 'bg-amber-500',
    strengthGood: 'bg-blue-500',
    strengthStrong: 'bg-emerald-500',
    toastBg: '#1e293b',
    toastText: '#fff',
    toastBorder: 'rgba(255,255,255,0.1)',
  },

  emerald: {
    name: 'Emerald',
    pageBg: 'bg-emerald-950',
    pageText: 'text-emerald-50',
    surface: 'bg-emerald-900/20',
    surfaceHover: 'hover:bg-emerald-900/30',
    surfaceBorder: 'border-emerald-400/20',
    surfaceSolid: 'bg-emerald-950',
    headerBg: 'bg-emerald-950/80',
    headerBorder: 'border-emerald-400/20',
    headerText: 'text-emerald-50',
    headerSubtext: 'text-emerald-200/70',
    accent: 'text-emerald-300',
    accentMuted: 'text-emerald-200/70',
    accentFaint: 'text-emerald-200/40',
    accentGradient: 'from-emerald-400 to-teal-500',
    accentShadow: 'shadow-emerald-500/30',
    inputBg: 'bg-emerald-900/30',
    inputBorder: 'border-emerald-400/20',
    inputText: 'text-emerald-50',
    inputPlaceholder: 'placeholder-emerald-200/50',
    inputIcon: 'text-emerald-300/50',
    inputFocus: 'focus:ring-emerald-400',
    primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    primaryBtnRing: 'focus:ring-emerald-400/20',
    secondaryBtn:
      'text-emerald-200/70 hover:text-emerald-100 hover:bg-emerald-900/40',
    successText: 'text-emerald-300',
    successBg: 'bg-emerald-500/10',
    successBorder: 'border-emerald-400/30',
    errorText: 'text-red-300',
    errorBg: 'bg-red-500/10',
    errorBorder: 'border-red-400/30',
    warningText: 'text-yellow-300',
    infoBg: 'bg-emerald-500/10',
    infoBorder: 'border-emerald-400/20',
    infoTitle: 'text-emerald-200',
    infoText: 'text-emerald-200/60',
    strengthTrack: 'bg-emerald-900/40',
    strengthWeak: 'bg-red-500',
    strengthFair: 'bg-yellow-500',
    strengthGood: 'bg-blue-400',
    strengthStrong: 'bg-emerald-400',
    toastBg: '#064e3b',
    toastText: '#ecfdf5',
    toastBorder: 'rgba(16,185,129,0.2)',
  },

  rose: {
    name: 'Rose',
    pageBg: 'bg-rose-950',
    pageText: 'text-rose-50',
    surface: 'bg-rose-900/20',
    surfaceHover: 'hover:bg-rose-900/30',
    surfaceBorder: 'border-rose-400/20',
    surfaceSolid: 'bg-rose-950',
    headerBg: 'bg-rose-950/80',
    headerBorder: 'border-rose-400/20',
    headerText: 'text-rose-50',
    headerSubtext: 'text-rose-200/70',
    accent: 'text-rose-300',
    accentMuted: 'text-rose-200/70',
    accentFaint: 'text-rose-200/40',
    accentGradient: 'from-rose-400 to-pink-500',
    accentShadow: 'shadow-rose-500/30',
    inputBg: 'bg-rose-900/30',
    inputBorder: 'border-rose-400/20',
    inputText: 'text-rose-50',
    inputPlaceholder: 'placeholder-rose-200/50',
    inputIcon: 'text-rose-300/50',
    inputFocus: 'focus:ring-rose-400',
    primaryBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
    primaryBtnRing: 'focus:ring-rose-400/20',
    secondaryBtn: 'text-rose-200/70 hover:text-rose-100 hover:bg-rose-900/40',
    successText: 'text-emerald-300',
    successBg: 'bg-emerald-500/10',
    successBorder: 'border-emerald-400/30',
    errorText: 'text-red-300',
    errorBg: 'bg-red-500/10',
    errorBorder: 'border-red-400/30',
    warningText: 'text-yellow-300',
    infoBg: 'bg-rose-500/10',
    infoBorder: 'border-rose-400/20',
    infoTitle: 'text-rose-200',
    infoText: 'text-rose-200/60',
    strengthTrack: 'bg-rose-900/40',
    strengthWeak: 'bg-red-500',
    strengthFair: 'bg-yellow-500',
    strengthGood: 'bg-blue-400',
    strengthStrong: 'bg-emerald-400',
    toastBg: '#4c0519',
    toastText: '#fff1f2',
    toastBorder: 'rgba(244,63,94,0.2)',
  },
};

// ─── PROVIDER ────────────────────────────────────────────────────────
export function ThemeProvider({ children, defaultTheme = 'midnight' }) {
  const [themeKey, setThemeKey] = useState(defaultTheme);

  // Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved && themes[saved]) setThemeKey(saved);
  }, []);

  const setTheme = useCallback((key) => {
    if (!themes[key]) return;
    setThemeKey(key);
    localStorage.setItem('app-theme', key);
  }, []);

  const toggleTheme = useCallback(() => {
    const keys = Object.keys(themes);
    const next = keys[(keys.indexOf(themeKey) + 1) % keys.length];
    setTheme(next);
  }, [themeKey, setTheme]);

  const theme = themes[themeKey];

  return (
    <ThemeContext.Provider
      value={{ theme, themeKey, themes, setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

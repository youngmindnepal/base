// src/app/login/LoginForm.jsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  GraduationCap,
  AlertCircle,
  Loader2,
  Shield,
  Sparkles,
  XCircle,
} from 'lucide-react';

import { useTheme } from '@/context/ThemeConetxt';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  rememberMe: z.boolean().optional(),
});

export default function LoginForm() {
  const { theme: t } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data) => {
    setError('');
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result.error) {
        setError(result.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative overflow-hidden ${t.pageBg}`}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-300" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`backdrop-blur-xl ${t.surface} rounded-3xl shadow-2xl border ${t.surfaceBorder} overflow-hidden`}
        >
          <div className="relative p-8 sm:p-10">
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col items-center mb-8"
            >
              <div
                className={`p-3 bg-gradient-to-br ${t.accentGradient} rounded-2xl shadow-lg ${t.accentShadow} mb-4`}
              >
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
              <h1
                className={`text-3xl font-bold tracking-tight ${t.headerText}`}
              >
                CollegeERP
              </h1>
              <p
                className={`text-sm font-medium tracking-wide mt-1 ${t.headerSubtext}`}
              >
                Educational Institute Management
              </p>
            </motion.div>

            <div className="text-center mb-8">
              <h2 className={`text-2xl font-bold ${t.headerText}`}>
                Welcome back
              </h2>
              <p className={`mt-2 ${t.headerSubtext}`}>
                Sign in to your account to continue
              </p>
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className={`mb-6 p-4 ${t.errorBg} border ${t.errorBorder} rounded-2xl backdrop-blur-sm`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-red-400/30 rounded-full flex-shrink-0">
                      <AlertCircle className={`w-4 h-4 ${t.errorText}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${t.errorText}`}>
                        Login Failed
                      </p>
                      <p className={`text-sm mt-0.5 ${t.errorText}`}>{error}</p>
                    </div>
                    <button
                      onClick={() => setError('')}
                      className={`ml-auto ${t.errorText} hover:opacity-80 transition-opacity`}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  className={`text-sm font-medium flex items-center gap-2 ${t.pageText}`}
                  htmlFor="email"
                >
                  <Mail className={`w-4 h-4 ${t.accent}`} />
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={`w-full px-4 py-3.5 ${
                    t.inputBg
                  } border-2 rounded-2xl transition-all duration-200 ${
                    t.inputText
                  } ${t.inputPlaceholder} backdrop-blur-sm focus:outline-none ${
                    errors.email
                      ? `${t.errorBorder} focus:ring-2 ${t.inputFocus}`
                      : `${t.inputBorder} focus:ring-2 ${t.inputFocus}`
                  }`}
                  placeholder="you@institution.edu"
                  disabled={isLoading}
                />
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`text-xs ${t.errorText} flex items-center gap-1 mt-1`}
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    className={`text-sm font-medium flex items-center gap-2 ${t.pageText}`}
                    htmlFor="password"
                  >
                    <Lock className={`w-4 h-4 ${t.accent}`} />
                    Password
                  </label>
                  <button
                    type="button"
                    className={`text-xs font-medium transition-colors ${t.accent} hover:opacity-80`}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={`w-full px-4 py-3.5 pr-12 ${
                      t.inputBg
                    } border-2 rounded-2xl transition-all duration-200 ${
                      t.inputText
                    } ${
                      t.inputPlaceholder
                    } backdrop-blur-sm focus:outline-none ${
                      errors.password
                        ? `${t.errorBorder} focus:ring-2 ${t.inputFocus}`
                        : `${t.inputBorder} focus:ring-2 ${t.inputFocus}`
                    }`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${t.inputIcon} hover:opacity-100 opacity-70 transition-opacity p-1 rounded-full`}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`text-xs ${t.errorText} flex items-center gap-1 mt-1`}
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.password.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Remember */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                    className="w-4 h-4 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-400 focus:ring-offset-0 cursor-pointer"
                  />
                  <span
                    className={`text-sm transition-colors ${t.accentMuted} group-hover:opacity-100`}
                  >
                    Remember me
                  </span>
                </label>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="relative w-full overflow-hidden group"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${t.accentGradient} rounded-2xl shadow-lg ${t.accentShadow}`}
                />
                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <div className="relative py-3.5 px-4 flex items-center justify-center gap-2 text-white font-semibold">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <motion.span
                        initial={{ x: 0 }}
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        →
                      </motion.span>
                    </>
                  )}
                </div>
              </motion.button>
            </form>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`text-center text-xs mt-6 ${t.accentFaint}`}
        >
          © 2026 Evanshi Solution. All rights reserved. |
          <a href="#" className={`${t.accent} hover:opacity-80 ml-1`}>
            Privacy Policy
          </a>
          <span className="mx-1">•</span>
          <a href="#" className={`${t.accent} hover:opacity-80`}>
            Terms of Service
          </a>
        </motion.p>
      </div>

      <motion.div
        className="absolute top-20 left-20 hidden lg:block"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className={`p-3 ${t.surface} rounded-2xl backdrop-blur-sm border ${t.surfaceBorder}`}
        >
          <Shield className={`w-8 h-8 ${t.accentFaint}`} />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-20 right-20 hidden lg:block"
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className={`p-3 ${t.surface} rounded-2xl backdrop-blur-sm border ${t.surfaceBorder}`}
        >
          <Sparkles className={`w-8 h-8 ${t.accentFaint}`} />
        </div>
      </motion.div>
    </div>
  );
}

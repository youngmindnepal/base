'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Shield,
  Key,
  LogOut,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeConetxt';

export default function ChangePasswordPage() {
  const { theme: t } = useTheme();
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: '',
  });

  const validatePassword = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[a-z]/)) score++;
    if (password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^a-zA-Z0-9]/)) score++;

    let message = '',
      color = '';
    if (score <= 2) {
      message = 'Weak';
      color = t.strengthWeak;
    } else if (score <= 3) {
      message = 'Fair';
      color = t.strengthFair;
    } else if (score <= 4) {
      message = 'Good';
      color = t.strengthGood;
    } else {
      message = 'Strong';
      color = t.strengthStrong;
    }

    setPasswordStrength({ score, message, color });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'newPassword') validatePassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Failed to change password');

      toast.success('Password changed successfully! Redirecting to login...', {
        icon: '✅',
        duration: 3000,
      });

      await update({
        ...session,
        user: { ...session.user, mustChangePassword: false, firstLogin: false },
      });

      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(async () => {
        await signOut({ callbackUrl: '/login?message=password-changed' });
      }, 2000);
    } catch (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Change Password', href: '/dashboard/change-password' },
  ];

  // Input classes helper — keeps markup clean
  const inputClass = `w-full pl-10 pr-10 py-2.5 ${t.inputBg} border ${t.inputBorder} rounded-lg text-sm ${t.inputText} ${t.inputPlaceholder} focus:ring-2 ${t.inputFocus} focus:border-transparent outline-none transition-all`;

  return (
    <div
      className={`space-y-4 px-4 lg:px-6 min-h-screen transition-colors duration-300 ${t.pageBg} ${t.pageText}`}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: t.toastBg,
            color: t.toastText,
            border: `1px solid ${t.toastBorder}`,
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      {/* Header */}
      <div
        className={`sticky top-0 z-30 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 ${t.headerBg} backdrop-blur-xl border-b ${t.headerBorder}`}
      >
        <nav className="flex items-center gap-1.5 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-1.5">
              {index > 0 && <span className={`${t.accentFaint}`}>/</span>}
              {index === breadcrumbs.length - 1 ? (
                <span className={`${t.accent} text-xs font-medium`}>
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className={`${t.accentMuted} hover:${t.accent} text-xs font-medium transition-colors`}
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 bg-gradient-to-br ${t.accentGradient} rounded-xl shadow-lg ${t.accentShadow}`}
          >
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${t.headerText}`}>
              Change Password
            </h1>
            <p className={`text-xs ${t.headerSubtext}`}>
              Update your password to keep your account secure
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/dashboard"
        className={`inline-flex items-center gap-2 text-xs ${t.accentMuted} hover:${t.accent} transition-colors`}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`backdrop-blur-xl ${t.surface} rounded-2xl border ${t.surfaceBorder} shadow-2xl overflow-hidden transition-colors duration-300`}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Password */}
          <div>
            <label className={`block text-xs font-medium ${t.pageText} mb-1.5`}>
              Current Password <span className={`${t.errorText}`}>*</span>
            </label>
            <div className="relative">
              <div
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.inputIcon}`}
              >
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter current password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.inputIcon} hover:opacity-100 opacity-70 transition-opacity cursor-pointer`}
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className={`block text-xs font-medium ${t.pageText} mb-1.5`}>
              New Password <span className={`${t.errorText}`}>*</span>
            </label>
            <div className="relative">
              <div
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.inputIcon}`}
              >
                <Shield className="w-4 h-4" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter new password"
                required
                minLength={8}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.inputIcon} hover:opacity-100 opacity-70 transition-opacity cursor-pointer`}
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {formData.newPassword && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-1 h-1.5 ${t.strengthTrack} rounded-full overflow-hidden`}
                  >
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${t.accentMuted} min-w-[40px]`}
                  >
                    {passwordStrength.message}
                  </span>
                </div>
                <ul
                  className={`grid grid-cols-2 gap-1 text-xs ${t.accentFaint}`}
                >
                  {[
                    {
                      label: 'Min 8 characters',
                      met: formData.newPassword.length >= 8,
                    },
                    {
                      label: 'Uppercase & lowercase',
                      met:
                        /[a-z]/.test(formData.newPassword) &&
                        /[A-Z]/.test(formData.newPassword),
                    },
                    {
                      label: 'Contains number',
                      met: /[0-9]/.test(formData.newPassword),
                    },
                    {
                      label: 'Special character',
                      met: /[^a-zA-Z0-9]/.test(formData.newPassword),
                    },
                  ].map((req, index) => (
                    <li key={index} className="flex items-center gap-1.5">
                      {req.met ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3 h-3 opacity-30" />
                      )}
                      <span className={req.met ? t.successText : 'opacity-50'}>
                        {req.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className={`block text-xs font-medium ${t.pageText} mb-1.5`}>
              Confirm New Password <span className={`${t.errorText}`}>*</span>
            </label>
            <div className="relative">
              <div
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.inputIcon}`}
              >
                <CheckCircle className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClass}
                placeholder="Confirm new password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.inputIcon} hover:opacity-100 opacity-70 transition-opacity cursor-pointer`}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {formData.confirmPassword &&
              formData.newPassword !== formData.confirmPassword && (
                <p
                  className={`mt-1.5 text-xs ${t.errorText} flex items-center gap-1`}
                >
                  <AlertCircle className="w-3 h-3" /> Passwords do not match
                </p>
              )}
            {formData.confirmPassword &&
              formData.newPassword === formData.confirmPassword &&
              formData.newPassword.length >= 8 && (
                <p
                  className={`mt-1.5 text-xs ${t.successText} flex items-center gap-1`}
                >
                  <CheckCircle className="w-3 h-3" /> Passwords match
                </p>
              )}
          </div>

          {/* Security Tips */}
          <div className={`p-4 ${t.infoBg} rounded-xl border ${t.infoBorder}`}>
            <h3
              className={`text-xs font-semibold ${t.infoTitle} flex items-center gap-2 mb-2`}
            >
              <Shield className="w-4 h-4" /> Password Security Tips
            </h3>
            <ul className={`text-xs ${t.infoText} space-y-1`}>
              <li>• Use at least 8 characters</li>
              <li>• Include uppercase and lowercase letters</li>
              <li>• Add numbers and special characters</li>
              <li>• Avoid using common words or personal information</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2.5 px-4 ${t.primaryBtn} text-sm font-medium rounded-lg focus:ring-4 ${t.primaryBtnRing} transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Changing
                  Password...
                </>
              ) : (
                'Change Password'
              )}
            </button>
            <Link
              href="/dashboard"
              className={`px-6 py-2.5 ${t.secondaryBtn} rounded-lg transition-colors text-sm`}
            >
              Cancel
            </Link>
          </div>

          <p className={`text-xs ${t.accentFaint} text-center mt-4`}>
            <LogOut className="w-3 h-3 inline mr-1" />
            You will be logged out after successfully changing your password
          </p>
        </form>
      </motion.div>

      {/* Success Message */}
      {session?.user?.mustChangePassword === false && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 p-4 ${t.successBg} border ${t.successBorder} rounded-xl ${t.successText} flex items-center gap-2`}
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>Your password has been updated. You're all set!</span>
        </motion.div>
      )}
    </div>
  );
}

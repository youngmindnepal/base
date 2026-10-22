// context/ToastContext.js
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import * as Icons from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type, message, title = '') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, title }]);

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 6000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Container - Fixed at top right */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md w-full sm:w-auto pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(toast.id), 300);
    }, 6000);

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const toastStyles = {
    success: {
      borderLeft: 'border-l-emerald-500',
      background: 'from-emerald-50 to-white',
      iconBg: 'bg-emerald-500',
      titleColor: 'text-emerald-700',
      progressBg: 'bg-emerald-500',
      Icon: Icons.CheckCircle,
    },
    error: {
      borderLeft: 'border-l-red-500',
      background: 'from-red-50 to-white',
      iconBg: 'bg-red-500',
      titleColor: 'text-red-700',
      progressBg: 'bg-red-500',
      Icon: Icons.AlertCircle,
    },
    warning: {
      borderLeft: 'border-l-amber-500',
      background: 'from-amber-50 to-white',
      iconBg: 'bg-amber-500',
      titleColor: 'text-amber-700',
      progressBg: 'bg-amber-500',
      Icon: Icons.AlertTriangle,
    },
    info: {
      borderLeft: 'border-l-blue-500',
      background: 'from-blue-50 to-white',
      iconBg: 'bg-blue-500',
      titleColor: 'text-blue-700',
      progressBg: 'bg-blue-500',
      Icon: Icons.Info,
    },
  };

  const style = toastStyles[toast.type] || toastStyles.info;
  const ToastIcon = style.Icon;

  return (
    <div
      className={`pointer-events-auto transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-xl shadow-2xl border-l-4 ${style.borderLeft} bg-white p-4 sm:p-5`}
      >
        {/* Background gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${style.background}`}
        />

        <div className="relative flex items-start gap-3">
          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${style.iconBg}`}
          >
            <ToastIcon className="w-5 h-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-6">
            {toast.title && (
              <h4 className={`text-sm font-bold mb-1 ${style.titleColor}`}>
                {toast.title}
              </h4>
            )}
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words max-h-40 overflow-y-auto">
              {toast.message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(toast.id), 300);
            }}
            className="absolute top-1 right-1 p-1.5 rounded-lg hover:bg-gray-200/50 transition-colors"
          >
            <Icons.X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="relative mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${style.progressBg} transition-all duration-[6000ms] ease-linear`}
            style={{ width: isVisible ? '0%' : '100%' }}
          />
        </div>
      </div>
    </div>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

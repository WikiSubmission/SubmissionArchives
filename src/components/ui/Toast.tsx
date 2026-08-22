'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Info, X } from '@phosphor-icons/react';

type ToastType = 'success' | 'info';

type Toast = {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration: number = 2600) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, info }}>
      {children}
      {/* Floating Toast Viewport */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.94 }}
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 32,
              }}
              className="pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-ed-rule bg-ed-surface/95 dark:bg-[#121212]/95 px-4 py-2.5 text-xs font-medium text-ed-fg shadow-2xl backdrop-blur-2xl"
            >
              {toast.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" weight="fill" />
              ) : (
                <Info className="h-4 w-4 text-sky-500 shrink-0" weight="fill" />
              )}
              <span className="font-sans text-ed-fg">{toast.message}</span>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="ml-1 rounded-md p-0.5 text-ed-fg-muted transition-colors hover:text-ed-fg"
                aria-label="Dismiss notification"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

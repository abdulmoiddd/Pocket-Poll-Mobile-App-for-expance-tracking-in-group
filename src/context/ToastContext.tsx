import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastOptions, ToastContextValue } from '../types/toast';
import { InteractiveToast } from '../components/common/InteractiveToast';

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<ToastOptions | null>(null);

  const showToast = useCallback((options: ToastOptions) => {
    setCurrentToast({
      ...options,
      id: options.id || `toast_${Date.now()}`,
    });
  }, []);

  const hideToast = useCallback(() => {
    setCurrentToast(null);
  }, []);

  const toast = {
    success: useCallback(
      (title: string, message: string, options?: Partial<ToastOptions>) => {
        showToast({ ...options, type: 'success', title, message });
      },
      [showToast]
    ),
    warning: useCallback(
      (title: string, message: string, options?: Partial<ToastOptions>) => {
        showToast({ ...options, type: 'warning', title, message });
      },
      [showToast]
    ),
    danger: useCallback(
      (title: string, message: string, options?: Partial<ToastOptions>) => {
        showToast({ ...options, type: 'danger', title, message });
      },
      [showToast]
    ),
    error: useCallback(
      (title: string, message: string, options?: Partial<ToastOptions>) => {
        showToast({ ...options, type: 'danger', title, message });
      },
      [showToast]
    ),
    info: useCallback(
      (title: string, message: string, options?: Partial<ToastOptions>) => {
        showToast({ ...options, type: 'info', title, message });
      },
      [showToast]
    ),
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toast }}>
      {children}
      <InteractiveToast toast={currentToast} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

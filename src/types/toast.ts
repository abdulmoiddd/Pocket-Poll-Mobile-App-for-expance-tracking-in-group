export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export interface ToastOptions {
  id?: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number; // duration in ms, default 4000
  actionText?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

export interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  hideToast: (id?: string) => void;
  toast: {
    success: (title: string, message: string, options?: Partial<ToastOptions>) => void;
    warning: (title: string, message: string, options?: Partial<ToastOptions>) => void;
    danger: (title: string, message: string, options?: Partial<ToastOptions>) => void;
    error: (title: string, message: string, options?: Partial<ToastOptions>) => void;
    info: (title: string, message: string, options?: Partial<ToastOptions>) => void;
  };
}

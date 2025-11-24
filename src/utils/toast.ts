import { toast as sonnerToast } from 'sonner';

/**
 * Toast notification utility with Thai language support
 */
export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      duration: 3000,
      style: {
        background: '#10b981',
        color: '#ffffff',
        border: 'none',
      },
    });
  },

  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: 4000,
      style: {
        background: '#ef4444',
        color: '#ffffff',
        border: 'none',
      },
    });
  },

  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      duration: 3500,
      style: {
        background: '#f59e0b',
        color: '#ffffff',
        border: 'none',
      },
    });
  },

  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      duration: 3000,
      style: {
        background: '#3b82f6',
        color: '#ffffff',
        border: 'none',
      },
    });
  },

  loading: (message: string) => {
    return sonnerToast.loading(message, {
      style: {
        background: '#6366f1',
        color: '#ffffff',
        border: 'none',
      },
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      style: {
        background: '#ffffff',
        color: '#000000',
        border: '1px solid #e5e7eb',
      },
    });
  },

  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id);
  },
};

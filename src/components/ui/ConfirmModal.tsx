import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Dialog from './Dialog';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const variantStyles: Record<
  string,
  { icon: string; button: string; titleColor: string }
> = {
  danger: {
    icon: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    button: 'btn-destructive',
    titleColor: 'text-red-600 dark:text-red-400'
  },
  warning: {
    icon: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    titleColor: 'text-yellow-600 dark:text-yellow-400'
  },
  info: {
    icon: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    button: 'btn-primary',
    titleColor: 'text-blue-600 dark:text-blue-400'
  }
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  const styles = variantStyles[variant] ?? variantStyles.danger;

  return (
    <Dialog open={isOpen} onClose={onClose} title={title} maxHeight={false}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 p-3 rounded-full ${styles.icon}`}>
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 pt-0.5">{message}</p>
      </div>
      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="btn-secondary min-h-[44px]"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`${styles.button} flex items-center justify-center min-h-[44px]`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </Dialog>
  );
};

export default ConfirmModal;

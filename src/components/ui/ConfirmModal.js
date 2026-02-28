import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Dialog from './Dialog';

/**
 * Confirmation Modal – uses shared Dialog (template-style).
 * Clear, actionable confirmation for destructive actions.
 */
const ConfirmModal = ({
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
  const variantStyles = {
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

  const styles = variantStyles[variant];

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title={title} maxHeight={false}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 p-3 rounded-full ${styles.icon}`}>
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 pt-0.5">
          {message}
        </p>
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
          onClick={handleConfirm}
          disabled={isLoading}
          className={`${styles.button} flex items-center justify-center min-h-[44px]`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

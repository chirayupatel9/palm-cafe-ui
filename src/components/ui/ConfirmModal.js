import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Confirmation Modal Component
 * Provides clear, actionable confirmation dialogs for destructive actions
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  isLoading = false
}) => {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end lg:items-center justify-center z-50 p-0 lg:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-t-lg lg:rounded-lg shadow-xl max-w-md lg:max-w-md w-full h-[90vh] lg:h-auto flex flex-col animate-slideIn">
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start">
            <div className={`flex-shrink-0 p-3 rounded-full ${styles.icon}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className={`text-lg font-semibold ${styles.titleColor} mb-2`}>
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Actions */}
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
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

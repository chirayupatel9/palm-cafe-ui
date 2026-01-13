import React from 'react';

/**
 * Standardized Card Component
 * 
 * Features:
 * - Consistent padding (16px/24px)
 * - Optional header and footer
 * - Consistent spacing
 */
const Card = ({
  children,
  title,
  description,
  headerAction,
  footer,
  className = '',
  padding = 'md' // sm: 16px, md: 24px, lg: 32px
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${paddingClasses[padding]} ${className}`}>
      {(title || description || headerAction) && (
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="ml-4">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div>{children}</div>
      {footer && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

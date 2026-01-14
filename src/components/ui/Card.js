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
  padding = 'md', // sm: 16px, md: 24px, lg: 32px
  elevated = false // Use elevated card style
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const cardClass = elevated ? 'card-elevated' : 'card';
  
  return (
    <div className={`${cardClass} ${paddingClasses[padding]} ${className}`}>
      {(title || description || headerAction) && (
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-on-surface)' }}>
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
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
        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-outline)' }}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

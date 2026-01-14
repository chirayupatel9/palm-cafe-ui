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
  elevated = false, // Use elevated card style
  kpi = false // Use KPI card style for dashboards
}) => {
  const paddingClasses = {
    sm: 'p-5',
    md: 'p-7',
    lg: 'p-9'
  };
  
  let cardClass = 'card';
  if (kpi) {
    cardClass = 'card-kpi';
  } else if (elevated) {
    cardClass = 'card-elevated';
  }
  
  return (
    <div className={`${cardClass} ${paddingClasses[padding]} ${className}`}>
      {(title || description || headerAction) && (
        <div className="card-header flex items-start justify-between">
          <div className="flex-1">
            {title && (
              <h3 className="card-title">
                {title}
              </h3>
            )}
            {description && (
              <p className="card-description">
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
        <div className="mt-6 pt-6" style={{ borderTop: '2px solid var(--color-outline-variant)' }}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

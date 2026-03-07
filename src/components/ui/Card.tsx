import React from 'react';

export interface CardProps {
  children?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  elevated?: boolean;
  kpi?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  headerAction,
  footer,
  className = '',
  padding = 'md',
  elevated = false,
  kpi = false
}) => {
  const paddingClasses: Record<string, string> = {
    sm: 'card-sm',
    md: '',
    lg: 'card-lg'
  };
  let cardClass = 'card';
  if (kpi) cardClass = 'card-kpi';
  else if (elevated) cardClass = 'card-elevated';

  return (
    <div className={`${cardClass} ${paddingClasses[padding]} ${className}`}>
      {(title || description || headerAction) && (
        <div className="card-header flex items-start justify-between">
          <div className="flex-1">
            {title && <h3 className="card-title">{title}</h3>}
            {description && <p className="card-description">{description}</p>}
          </div>
          {headerAction && <div className="ml-4">{headerAction}</div>}
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

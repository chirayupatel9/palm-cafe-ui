import React from 'react';
import { Plus } from 'lucide-react';
import Button from './ui/Button';

/**
 * Consistent page header component
 * Provides: Title, Description, and Primary Action
 * 
 * Uses standardized spacing (24px bottom margin)
 */
const PageHeader = ({ 
  title, 
  description, 
  primaryAction, 
  primaryActionLabel,
  primaryActionIcon: PrimaryActionIcon = Plus,
  secondaryActions = [],
  children 
}) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        
        {/* Primary Action */}
        {primaryAction && primaryActionLabel && (
          <div className="flex items-center gap-3">
            {secondaryActions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant="secondary"
                icon={action.icon}
              >
                {action.label}
              </Button>
            ))}
            <Button
              onClick={primaryAction}
              variant="primary"
              icon={PrimaryActionIcon}
            >
              {primaryActionLabel}
            </Button>
          </div>
        )}
      </div>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
};

export default PageHeader;

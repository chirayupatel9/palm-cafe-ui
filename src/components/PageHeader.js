import React from 'react';
import { Plus } from 'lucide-react';

/**
 * Consistent page header component
 * Provides: Title, Description, and Primary Action
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
          <h2 className="text-2xl font-bold text-secondary-700 dark:text-gray-100">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-secondary-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        
        {/* Primary Action */}
        {primaryAction && primaryActionLabel && (
          <div className="flex items-center gap-2">
            {secondaryActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-secondary-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-accent-300 dark:border-gray-600 rounded-lg hover:bg-accent-50 dark:hover:bg-gray-700 transition-colors"
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                <span>{action.label}</span>
              </button>
            ))}
            <button
              onClick={primaryAction}
              className="flex items-center space-x-2 bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <PrimaryActionIcon className="h-4 w-4" />
              <span>{primaryActionLabel}</span>
            </button>
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default PageHeader;

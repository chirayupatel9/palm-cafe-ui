import React from 'react';
import { Lock, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Locked Feature Component
 * Displays a locked/disabled state for subscription-restricted features
 * Super Admins should never see this component
 */
const LockedFeature = ({ 
  featureName,
  requiredPlan = 'Pro',
  description,
  onUpgrade,
  showPreview = false,
  previewContent,
  className = ''
}) => {
  const { user } = useAuth();

  // Super Admins should never see locked states
  if (user?.role === 'superadmin') {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Preview content if provided */}
      {showPreview && previewContent && (
        <div className="opacity-60 pointer-events-none">
          {previewContent}
        </div>
      )}

      {/* Locked state overlay */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-4 flex justify-center">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Lock className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Available on {requiredPlan}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {description || `${featureName} is available on the ${requiredPlan} plan. Contact your administrator to upgrade.`}
          </p>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="inline-flex items-center px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to {requiredPlan}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Locked Button Component
 * Shows a disabled button with upgrade prompt
 */
export const LockedButton = ({ 
  children,
  requiredPlan = 'Pro',
  onUpgrade,
  className = ''
}) => {
  return (
    <div className="relative inline-block">
      <button
        disabled
        className={`btn-secondary opacity-60 cursor-not-allowed ${className}`}
        title={`Available on ${requiredPlan} plan`}
      >
        {children}
      </button>
      {onUpgrade && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          Upgrade to {requiredPlan} to unlock
        </div>
      )}
    </div>
  );
};

export default LockedFeature;

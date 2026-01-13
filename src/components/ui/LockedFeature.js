import React from 'react';
import { Lock, Crown } from 'lucide-react';

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
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Blurred overlay */}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="mb-4 flex justify-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <Lock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {featureName} is Locked
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {description || `This feature is available on the ${requiredPlan} plan. Upgrade to unlock this feature.`}
          </p>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="btn-primary flex items-center justify-center mx-auto"
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

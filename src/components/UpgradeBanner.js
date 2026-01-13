import React from 'react';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Upgrade Banner Component
 * 
 * Displays upgrade messaging for Pro-only features.
 * Hidden for Super Admins.
 */
const UpgradeBanner = ({ featureName, className = '' }) => {
  const { user } = useAuth();

  // Don't show for Super Admins
  if (user?.role === 'superadmin') {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
            Pro Feature
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
            {featureName || 'This feature'} is available on the Pro plan. Upgrade to unlock advanced capabilities.
          </p>
          <div className="flex items-center space-x-2 text-sm text-yellow-700 dark:text-yellow-300">
            <Lock className="h-4 w-4" />
            <span>Contact your administrator to upgrade</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Feature Lock Component
 * 
 * Shows a locked state for restricted features.
 */
export const FeatureLock = ({ featureName, children }) => {
  const { user } = useAuth();

  // Super Admins always see content
  if (user?.role === 'superadmin') {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Feature Locked
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {featureName || 'This feature'} requires a Pro subscription.
          </p>
          <UpgradeBanner featureName={featureName} className="max-w-md mx-auto" />
        </div>
      </div>
    </div>
  );
};

export default UpgradeBanner;

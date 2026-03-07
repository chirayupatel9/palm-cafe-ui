import React from 'react';
import { Lock, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UpgradeBannerProps {
  featureName?: string;
  className?: string;
}

export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({ featureName, className = '' }) => {
  const { user } = useAuth();

  if (user?.role === 'superadmin') {
    return null;
  }

  return (
    <div className={`bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Crown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {featureName || 'This feature'} is available on the Pro plan. Contact your administrator to upgrade.
          </p>
        </div>
      </div>
    </div>
  );
};

interface FeatureLockProps {
  featureName?: string;
  children: React.ReactNode;
}

export const FeatureLock: React.FC<FeatureLockProps> = ({ featureName, children }) => {
  const { user } = useAuth();

  if (user?.role === 'superadmin') {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6 max-w-md">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Available on Pro
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {featureName || 'This feature'} is available on the Pro plan. Contact your administrator to upgrade.
          </p>
          <UpgradeBanner featureName={featureName} className="max-w-md mx-auto" />
        </div>
      </div>
    </div>
  );
};

export default UpgradeBanner;

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ImpersonationBanner = () => {
  const { impersonation, exitImpersonation } = useAuth();

  if (!impersonation || !impersonation.isImpersonating) {
    return null;
  }

  const handleExit = async () => {
    await exitImpersonation();
    // Reload to ensure all components update
    window.location.reload();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold">
            You are impersonating <strong>{impersonation.cafeName || impersonation.cafeSlug}</strong>
          </span>
        </div>
        <button
          onClick={handleExit}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
        >
          <X className="h-4 w-4" />
          Exit Impersonation
        </button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;

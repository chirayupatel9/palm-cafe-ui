import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CafeOnboarding from './CafeOnboarding';
import CafeInfo from './CafeInfo';

interface OnboardingStatus {
  is_onboarded?: boolean;
  requires_onboarding?: boolean;
}

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading) return;
      if (user?.role === 'superadmin') {
        setOnboardingStatus({ is_onboarded: true, requires_onboarding: false });
        setLoading(false);
        return;
      }
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get('/onboarding/status');
        setOnboardingStatus(response.data);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setOnboardingStatus({ is_onboarded: true, requires_onboarding: false });
      } finally {
        setLoading(false);
      }
    };
    checkOnboardingStatus();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-accent-50 dark:bg-gray-900">
        <CafeInfo logoSize="h-16 w-16" nameSize="text-xl" className="mb-4" />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
        <p className="mt-4 text-secondary-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (user?.role === 'superadmin' || !user) {
    return <>{children}</>;
  }

  if (onboardingStatus?.requires_onboarding) {
    return <CafeOnboarding />;
  }

  return <>{children}</>;
};

export default OnboardingGuard;

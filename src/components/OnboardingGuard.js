import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CafeOnboarding from './CafeOnboarding';

/**
 * OnboardingGuard component
 * Checks if cafe has completed onboarding and redirects accordingly
 * Super Admins bypass this check
 */
const OnboardingGuard = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    // Wait for auth to load
    if (authLoading) {
      return;
    }

    // Super Admin bypasses onboarding
    if (user?.role === 'superadmin') {
      setOnboardingStatus({ is_onboarded: true, requires_onboarding: false });
      setLoading(false);
      return;
    }

    // Not authenticated, let ProtectedRoute handle it
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/onboarding/status');
      setOnboardingStatus(response.data);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // On error, allow through (might be network issue)
      setOnboardingStatus({ is_onboarded: true, requires_onboarding: false });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-accent-50 dark:bg-gray-900">
        <img 
          src="/images/palm-cafe-logo.png" 
          alt="Palm Cafe Logo" 
          className="h-16 w-16 mb-4"
        />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
        <p className="mt-4 text-secondary-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  // Super Admin or not authenticated - let through
  if (user?.role === 'superadmin' || !user) {
    return children;
  }

  // Check onboarding status
  if (onboardingStatus?.requires_onboarding) {
    // Show onboarding flow
    return <CafeOnboarding />;
  }

  // Onboarded, allow access
  return children;
};

export default OnboardingGuard;

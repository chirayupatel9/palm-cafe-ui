import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableModules, setAvailableModules] = useState([]);
  const [planFeatures, setPlanFeatures] = useState({});

  useEffect(() => {
    // Skip subscription fetch on customer routes
    if (window.location.pathname === '/customer' || window.location.pathname.startsWith('/customer/')) {
      setLoading(false);
      return;
    }

    if (user && user.cafe_id && user.role !== 'superadmin') {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      if (!user?.cafe_id) {
        setLoading(false);
        return;
      }

      // Use cafe-scoped endpoint for regular users
      const response = await axios.get('/subscription');
      const data = response.data;
      
      // Normalize plan to uppercase for consistency
      if (data.subscription && data.subscription.plan) {
        data.subscription.plan = data.subscription.plan.toUpperCase();
      }
      
      setSubscription(data.subscription);
      
      // Handle both old and new API response formats
      if (data.available_modules) {
        setAvailableModules(data.available_modules);
      }
      if (data.plan_features) {
        setPlanFeatures(data.plan_features);
      } else {
        // New format: features are returned directly, not plan_features
        // Initialize planFeatures as empty object to prevent errors
        setPlanFeatures({});
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Default to FREE plan if subscription fetch fails
      setSubscription({
        plan: 'FREE',
        status: 'active',
        enabledModules: null
      });
      setPlanFeatures({});
      setAvailableModules([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if a module is accessible
   * DEPRECATED: Use FeatureContext.hasFeature() instead
   */
  const hasModuleAccess = (module) => {
    // Super Admin always has access
    if (user?.role === 'superadmin') {
      return true;
    }

    // If no subscription, deny access
    if (!subscription) {
      return false;
    }

    // If subscription is not active, deny access
    if (subscription.status !== 'active') {
      return false;
    }

    // Check for per-cafe module override
    if (subscription.enabledModules && typeof subscription.enabledModules === 'object') {
      if (subscription.enabledModules.hasOwnProperty(module)) {
        return subscription.enabledModules[module] === true;
      }
    }

    // Check plan-based access (safely handle undefined planFeatures)
    if (!planFeatures || typeof planFeatures !== 'object') {
      // If planFeatures is not available, default to denying access
      // This prevents the error but should use FeatureContext instead
      return false;
    }

    const planFeaturesList = planFeatures[subscription.plan] || [];
    return planFeaturesList.includes(module);
  };

  /**
   * Get subscription plan
   */
  const getPlan = () => {
    return subscription?.plan || 'FREE';
  };

  /**
   * Get subscription status
   */
  const getStatus = () => {
    return subscription?.status || 'active';
  };

  /**
   * Check if subscription is active
   */
  const isActive = () => {
    return subscription?.status === 'active';
  };

  const value = {
    subscription,
    loading,
    availableModules,
    planFeatures,
    hasModuleAccess,
    getPlan,
    getStatus,
    isActive,
    refresh: fetchSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

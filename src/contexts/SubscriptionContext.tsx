import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export interface Subscription {
  plan?: string;
  status?: string;
  enabledModules?: Record<string, boolean> | null;
  [key: string]: unknown;
}

export interface SubscriptionContextValue {
  subscription: Subscription | null;
  loading: boolean;
  availableModules: string[];
  planFeatures: Record<string, string[]>;
  hasModuleAccess: (module: string) => boolean;
  getPlan: () => string;
  getStatus: () => string;
  isActive: () => boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export const useSubscription = (): SubscriptionContextValue => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [planFeatures, setPlanFeatures] = useState<Record<string, string[]>>({});

  const fetchSubscription = async () => {
    try {
      if (!user?.cafe_id) {
        setLoading(false);
        return;
      }
      const response = await axios.get('/subscription');
      const data = response.data as {
        subscription?: Subscription;
        available_modules?: string[];
        plan_features?: Record<string, string[]>;
      };
      if (data.subscription?.plan) {
        data.subscription.plan = data.subscription.plan.toUpperCase();
      }
      setSubscription(data.subscription ?? null);
      if (data.available_modules) setAvailableModules(data.available_modules);
      if (data.plan_features) setPlanFeatures(data.plan_features);
      else setPlanFeatures({});
    } catch (error) {
      console.error('Error fetching subscription:', error);
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

  useEffect(() => {
    if (
      window.location.pathname === '/customer' ||
      window.location.pathname.startsWith('/customer/') ||
      window.location.pathname.startsWith('/cafe/')
    ) {
      setLoading(false);
      return;
    }
    if (user?.cafe_id && user.role !== 'superadmin') {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const hasModuleAccess = (module: string): boolean => {
    if (user?.role === 'superadmin') return true;
    if (!subscription) return false;
    if (subscription.status !== 'active') return false;
    if (subscription.enabledModules && typeof subscription.enabledModules === 'object') {
      if (Object.prototype.hasOwnProperty.call(subscription.enabledModules, module)) {
        return subscription.enabledModules[module] === true;
      }
    }
    if (!planFeatures || typeof planFeatures !== 'object') return false;
    const planFeaturesList = subscription.plan ? planFeatures[subscription.plan] : [];
    return Array.isArray(planFeaturesList) && planFeaturesList.includes(module);
  };

  const getPlan = (): string => subscription?.plan ?? 'FREE';
  const getStatus = (): string => subscription?.status ?? 'active';
  const isActive = (): boolean => subscription?.status === 'active';

  const value: SubscriptionContextValue = {
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

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

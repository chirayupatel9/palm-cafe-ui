import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export interface FeatureContextValue {
  features: Record<string, boolean>;
  loading: boolean;
  plan: string;
  status: string;
  hasFeature: (featureKey: string) => boolean;
  getPlan: () => string;
  getStatus: () => string;
  isActive: () => boolean;
  refresh: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextValue | null>(null);

export const useFeatures = (): FeatureContextValue => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
};

interface FeatureProviderProps {
  children: ReactNode;
}

export const FeatureProvider: React.FC<FeatureProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState('FREE');
  const [status, setStatus] = useState('active');

  const fetchFeatures = async () => {
    try {
      if (!user?.cafe_id) {
        setLoading(false);
        return;
      }
      const response = await axios.get('/cafe/features');
      const data = response.data as { features?: Record<string, boolean>; plan?: string; status?: string };
      setFeatures(data.features ?? {});
      setPlan(data.plan ? data.plan.toUpperCase() : 'FREE');
      setStatus(data.status ?? 'active');
    } catch (error) {
      console.error('Error fetching features:', error);
      setFeatures({});
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
      fetchFeatures();
    } else if (user?.role === 'superadmin') {
      setFeatures({});
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  const hasFeature = (featureKey: string): boolean => {
    if (user?.role === 'superadmin') return true;
    if (status !== 'active') return false;
    return features[featureKey] === true;
  };

  const value: FeatureContextValue = {
    features,
    loading,
    plan,
    status,
    hasFeature,
    getPlan: () => plan,
    getStatus: () => status,
    isActive: () => status === 'active',
    refresh: fetchFeatures
  };

  return <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>;
};

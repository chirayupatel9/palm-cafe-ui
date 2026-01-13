import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const FeatureContext = createContext();

export const useFeatures = () => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
};

export const FeatureProvider = ({ children }) => {
  const { user } = useAuth();
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState('FREE');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    if (user && user.cafe_id && user.role !== 'superadmin') {
      fetchFeatures();
    } else if (user?.role === 'superadmin') {
      // Super Admin has all features
      setFeatures({});
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchFeatures = async () => {
    try {
      if (!user?.cafe_id) {
        setLoading(false);
        return;
      }

      const response = await axios.get('/cafe/features');
      const data = response.data;
      
      setFeatures(data.features || {});
      setPlan(data.plan || 'FREE');
      setStatus(data.status || 'active');
    } catch (error) {
      console.error('Error fetching features:', error);
      // Default to empty features on error
      setFeatures({});
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if a feature is accessible
   */
  const hasFeature = (featureKey) => {
    // Super Admin always has access
    if (user?.role === 'superadmin') {
      return true;
    }

    // If subscription is not active, deny access
    if (status !== 'active') {
      return false;
    }

    // Check feature access
    return features[featureKey] === true;
  };

  /**
   * Get subscription plan
   */
  const getPlan = () => {
    return plan;
  };

  /**
   * Get subscription status
   */
  const getStatus = () => {
    return status;
  };

  /**
   * Check if subscription is active
   */
  const isActive = () => {
    return status === 'active';
  };

  const value = {
    features,
    loading,
    plan,
    status,
    hasFeature,
    getPlan,
    getStatus,
    isActive,
    refresh: fetchFeatures
  };

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  );
};

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building, Settings, Save, ArrowLeft, CheckCircle, XCircle, 
  AlertCircle, Loader, CreditCard, Lock, Unlock, Crown, RotateCcw, UserCheck
} from 'lucide-react';

const SuperAdminCafeSettings = () => {
  const { cafeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cafe, setCafe] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo_url: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    is_active: true
  });
  const [subscription, setSubscription] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [featureDetails, setFeatureDetails] = useState(null);
  const [subscriptionFormData, setSubscriptionFormData] = useState({
    plan: 'FREE',
    status: 'active'
  });
  const [selectKey, setSelectKey] = useState(0); // Force re-render of select
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [togglingFeature, setTogglingFeature] = useState(null);
  const [resettingOnboarding, setResettingOnboarding] = useState(false);

  useEffect(() => {
    fetchCafe();
    fetchSubscription();
  }, [cafeId]);

  // Sync subscriptionFormData when subscription or cafe data changes
  useEffect(() => {
    if (subscription || cafe) {
      const planValue = (subscription?.plan || cafe?.subscription_plan || 'FREE').toUpperCase();
      const statusValue = subscription?.status || cafe?.subscription_status || 'active';
      
      // Only update if different to avoid unnecessary re-renders
      if (subscriptionFormData.plan !== planValue || subscriptionFormData.status !== statusValue) {
        console.log('Syncing subscriptionFormData from subscription/cafe:', {
          plan: planValue,
          status: statusValue,
          currentFormData: subscriptionFormData,
          subscription: subscription,
          cafe: cafe ? { subscription_plan: cafe.subscription_plan, subscription_status: cafe.subscription_status } : null
        });
        
        setSubscriptionFormData({
          plan: planValue,
          status: statusValue
        });
        
        // Force select to re-render
        setSelectKey(prev => prev + 1);
      }
    }
  }, [subscription?.plan, subscription?.status, cafe?.subscription_plan, cafe?.subscription_status]);

  // Sync form data when subscription or cafe changes (only when they actually change)
  useEffect(() => {
    const planFromSubscription = subscription?.plan?.toUpperCase();
    const planFromCafe = cafe?.subscription_plan?.toUpperCase();
    const planValue = planFromSubscription || planFromCafe;
    
    if (planValue && subscriptionFormData.plan !== planValue) {
      console.log('Syncing form data from subscription/cafe:', {
        from: subscriptionFormData.plan,
        to: planValue,
        subscriptionPlan: subscription?.plan,
        cafePlan: cafe?.subscription_plan
      });
      setSubscriptionFormData(prev => ({
        ...prev,
        plan: planValue,
        status: subscription?.status || cafe?.subscription_status || prev.status
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription?.plan, cafe?.subscription_plan, subscription?.status, cafe?.subscription_status]);

  const fetchCafe = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/superadmin/cafes/${cafeId}`);
      const cafeData = response.data;
      setCafe(cafeData);
      setFormData({
        name: cafeData.name || '',
        slug: cafeData.slug || '',
        description: cafeData.description || '',
        logo_url: cafeData.logo_url || '',
        address: cafeData.address || '',
        phone: cafeData.phone || '',
        email: cafeData.email || '',
        website: cafeData.website || '',
        is_active: cafeData.is_active !== undefined ? cafeData.is_active : true
      });
    } catch (error) {
      console.error('Error fetching cafe:', error);
      toast.error('Failed to load cafe details');
      navigate('/superadmin');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const [subscriptionResponse, featuresResponse] = await Promise.all([
        axios.get(`/superadmin/cafes/${cafeId}/subscription`),
        axios.get(`/superadmin/cafes/${cafeId}/features`)
      ]);
      
      const subscriptionData = subscriptionResponse.data;
      const featuresData = featuresResponse.data;
      
      setSubscription(subscriptionData.subscription);
      setAvailablePlans(subscriptionData.available_plans || ['FREE', 'PRO']);
      setFeatureDetails(featuresData);
      
      const planValue = (subscriptionData.subscription?.plan || 'FREE').toUpperCase();
      const statusValue = subscriptionData.subscription?.status || 'active';
      
      console.log('Setting subscription form data from fetch:', {
        plan: planValue,
        status: statusValue,
        subscriptionData: subscriptionData.subscription,
        fullResponse: subscriptionData
      });
      
      // Force update form data
      setSubscriptionFormData(prev => {
        const updated = {
          plan: planValue,
          status: statusValue
        };
        console.log('Updating subscriptionFormData from:', prev, 'to:', updated);
        return updated;
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Don't show error toast, subscription might not be set up yet
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await axios.put(`/superadmin/cafes/${cafeId}`, formData);
      toast.success('Cafe updated successfully');
      fetchCafe();
    } catch (error) {
      console.error('Error updating cafe:', error);
      toast.error(error.response?.data?.error || 'Failed to update cafe');
    } finally {
      setSaving(false);
    }
  };

  const handleSubscriptionSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSavingSubscription(true);
      
      // Ensure plan value is uppercase
      const planValue = subscriptionFormData.plan?.toUpperCase() || subscriptionFormData.plan;
      
      console.log('Submitting subscription update:', {
        cafeId,
        plan: planValue,
        status: subscriptionFormData.status,
        currentFormData: subscriptionFormData
      });
      
      const response = await axios.put(`/superadmin/cafes/${cafeId}/subscription`, {
        plan: planValue,
        status: subscriptionFormData.status
      });
      
      console.log('Subscription update response:', response.data);
      
      toast.success('Subscription updated successfully');
      
      // Immediately update local state from response
      if (response.data?.cafe) {
        const newPlan = (response.data.cafe.subscription_plan || 'FREE').toUpperCase();
        const newStatus = response.data.cafe.subscription_status || 'active';
        console.log('Updating from response.data.cafe:', { newPlan, newStatus });
        setSubscriptionFormData({
          plan: newPlan,
          status: newStatus
        });
        setCafe(prev => prev ? { ...prev, subscription_plan: newPlan, subscription_status: newStatus } : null);
      }
      
      if (response.data?.subscription) {
        const newPlan = (response.data.subscription.plan || 'FREE').toUpperCase();
        const newStatus = response.data.subscription.status || 'active';
        console.log('Updating from response.data.subscription:', { newPlan, newStatus });
        setSubscription(prev => prev ? { ...prev, plan: newPlan, status: newStatus } : { plan: newPlan, status: newStatus });
      }
      
      // Force select to re-render
      setSelectKey(prev => prev + 1);
      
      // Force refresh subscription data to ensure UI is in sync
      // Use a small delay to ensure database transaction is committed
      setTimeout(async () => {
        console.log('Refreshing subscription data...');
        await fetchSubscription();
        await fetchCafe();
        // Force select to re-render again after refresh
        setSelectKey(prev => prev + 1);
      }, 500);
      
    } catch (error) {
      console.error('Error updating subscription:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update subscription';
      toast.error(errorMessage);
    } finally {
      setSavingSubscription(false);
    }
  };

  const toggleFeature = async (featureKey, enabled) => {
    try {
      setTogglingFeature(featureKey);
      await axios.post(`/superadmin/cafes/${cafeId}/features/${featureKey}/toggle`, {
        enabled
      });
      toast.success(`Feature ${featureKey} ${enabled ? 'enabled' : 'disabled'}`);
      fetchSubscription();
    } catch (error) {
      console.error('Error toggling feature:', error);
      toast.error(error.response?.data?.error || 'Failed to toggle feature');
    } finally {
      setTogglingFeature(null);
    }
  };

  const removeFeatureOverride = async (featureKey) => {
    try {
      setTogglingFeature(featureKey);
      await axios.delete(`/superadmin/cafes/${cafeId}/features/${featureKey}`);
      toast.success(`Feature override removed, reverted to plan default`);
      fetchSubscription();
    } catch (error) {
      console.error('Error removing feature override:', error);
      toast.error(error.response?.data?.error || 'Failed to remove feature override');
    } finally {
      setTogglingFeature(null);
    }
  };

  const resetOnboarding = async () => {
    if (!window.confirm(`Are you sure you want to reset onboarding for "${cafe.name}"? This will require the cafe to complete onboarding again.`)) {
      return;
    }

    try {
      setResettingOnboarding(true);
      await axios.post(`/superadmin/cafes/${cafeId}/reset-onboarding`);
      toast.success('Onboarding reset successfully');
      fetchCafe();
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      toast.error(error.response?.data?.error || 'Failed to reset onboarding');
    } finally {
      setResettingOnboarding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-secondary-600 dark:text-gray-400">Cafe not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/superadmin')}
            className="p-2 rounded-lg hover:bg-accent-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-secondary-600 dark:text-gray-400" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-secondary-700 dark:text-gray-100 flex items-center">
              <Building className="h-6 w-6 mr-2" />
              {cafe.name} - Settings
            </h2>
            <p className="text-sm text-secondary-500 dark:text-gray-400 mt-1">
              Manage cafe configuration and details
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {cafe.is_active ? (
            <span className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Active
            </span>
          ) : (
            <span className="flex items-center text-red-600 text-sm">
              <XCircle className="h-4 w-4 mr-1" />
              Inactive
            </span>
          )}
          {cafe.is_onboarded !== undefined && (
            <span className={`flex items-center text-sm ${
              cafe.is_onboarded ? 'text-green-600' : 'text-orange-600'
            }`}>
              <UserCheck className="h-4 w-4 mr-1" />
              {cafe.is_onboarded ? 'Onboarded' : 'Not Onboarded'}
            </span>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              Cafe Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              required
              pattern="[a-z0-9-]+"
              disabled
              className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-secondary-500 dark:text-gray-400 mt-1">
              Slug cannot be changed after creation
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
            Logo URL
          </label>
          <input
            type="url"
            name="logo_url"
            value={formData.logo_url}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="flex items-center pt-4 border-t border-accent-200 dark:border-gray-700">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            checked={formData.is_active}
            onChange={handleInputChange}
            className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-accent-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 text-sm text-secondary-700 dark:text-gray-300">
            Active (cafe is operational)
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-accent-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate('/superadmin')}
            className="px-4 py-2 border border-accent-300 dark:border-gray-600 text-secondary-700 dark:text-gray-300 rounded-lg hover:bg-accent-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Onboarding Status Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-secondary-600 dark:text-gray-400" />
            <h3 className="text-xl font-bold text-secondary-700 dark:text-gray-100">
              Onboarding Status
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-accent-50 dark:bg-gray-700 rounded-lg">
          <div>
            <p className="text-sm font-medium text-secondary-700 dark:text-gray-300">
              Status: {cafe.is_onboarded ? (
                <span className="text-green-600">Completed</span>
              ) : (
                <span className="text-orange-600">Pending</span>
              )}
            </p>
            <p className="text-xs text-secondary-500 dark:text-gray-400 mt-1">
              {cafe.is_onboarded 
                ? 'This cafe has completed the onboarding process.'
                : 'This cafe needs to complete onboarding before accessing the full application.'}
            </p>
          </div>
          {cafe.is_onboarded && (
            <button
              onClick={resetOnboarding}
              disabled={resettingOnboarding}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resettingOnboarding ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset Onboarding</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Subscription Management Section */}
      {subscription && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <CreditCard className="h-5 w-5 text-secondary-600 dark:text-gray-400" />
            <h3 className="text-xl font-bold text-secondary-700 dark:text-gray-100">
              Subscription Management
            </h3>
          </div>

          <form onSubmit={handleSubscriptionSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Subscription Plan
                </label>
                <select
                  key={`plan-select-${selectKey}-${subscriptionFormData.plan || subscription?.plan || cafe?.subscription_plan || 'FREE'}`}
                  value={(subscriptionFormData.plan || subscription?.plan || cafe?.subscription_plan || 'FREE').toUpperCase()}
                  onChange={(e) => {
                    const newPlan = e.target.value.toUpperCase();
                    console.log('Plan changed in select:', newPlan, 'from', subscriptionFormData.plan);
                    setSubscriptionFormData(prev => {
                      const updated = { ...prev, plan: newPlan };
                      console.log('Updated subscriptionFormData:', updated);
                      return updated;
                    });
                  }}
                  className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  {availablePlans.map(plan => {
                    const planUpper = plan.toUpperCase();
                    return (
                      <option key={planUpper} value={planUpper}>{plan}</option>
                    );
                  })}
                </select>
                <div className="mt-1 text-xs text-secondary-500 dark:text-gray-400 space-y-0.5">
                  <p>Form state: <strong>{subscriptionFormData.plan || 'not set'}</strong></p>
                  <p>Subscription state: <strong>{subscription?.plan || 'not set'}</strong></p>
                  <p>Cafe data: <strong>{cafe?.subscription_plan || 'not set'}</strong></p>
                  <p>Select value: <strong>{(subscriptionFormData.plan || subscription?.plan || cafe?.subscription_plan || 'FREE').toUpperCase()}</strong></p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Subscription Status
                </label>
                <select
                  value={subscriptionFormData.status}
                  onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Feature Management */}
            {featureDetails && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-3">
                  Feature Management
                </label>
                <p className="text-xs text-secondary-500 dark:text-gray-400 mb-3">
                  Override plan defaults for specific features. Overrides take precedence over plan defaults.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {featureDetails.features?.map(feature => {
                    const hasOverride = feature.override !== null;
                    const isEnabled = feature.resolved.enabled;
                    const planDefault = subscriptionFormData.plan === 'PRO' 
                      ? feature.planDefaults.pro 
                      : feature.planDefaults.free;
                    
                    return (
                      <div
                        key={feature.key}
                        className={`p-4 border rounded-lg ${
                          hasOverride && isEnabled ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                          hasOverride && !isEnabled ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                          planDefault ? 'border-accent-300 dark:border-gray-600 bg-accent-50 dark:bg-gray-700' :
                          'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-semibold text-secondary-700 dark:text-gray-300">
                                {feature.name}
                              </span>
                              {planDefault && !hasOverride && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                              {hasOverride && (
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                  Override
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-secondary-500 dark:text-gray-400">
                              {feature.description}
                            </p>
                            <div className="mt-2 text-xs text-secondary-600 dark:text-gray-400">
                              <span>Plan Default: </span>
                              <span className={planDefault ? 'text-green-600' : 'text-gray-500'}>
                                {planDefault ? 'Enabled' : 'Disabled'}
                              </span>
                              {hasOverride && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>Current: </span>
                                  <span className={isEnabled ? 'text-green-600' : 'text-red-600'}>
                                    {isEnabled ? 'Enabled' : 'Disabled'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {hasOverride ? (
                            <button
                              type="button"
                              onClick={() => removeFeatureOverride(feature.key)}
                              disabled={togglingFeature === feature.key}
                              className="flex-1 px-3 py-1.5 text-xs rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                            >
                              {togglingFeature === feature.key ? '...' : 'Revert to Plan Default'}
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => toggleFeature(feature.key, true)}
                                disabled={togglingFeature === feature.key || isEnabled}
                                className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors disabled:opacity-50 ${
                                  isEnabled
                                    ? 'bg-green-600 text-white cursor-not-allowed'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                                }`}
                              >
                                <Unlock className="h-3 w-3 inline mr-1" />
                                Enable
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleFeature(feature.key, false)}
                                disabled={togglingFeature === feature.key || !isEnabled}
                                className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors disabled:opacity-50 ${
                                  !isEnabled
                                    ? 'bg-red-600 text-white cursor-not-allowed'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30'
                                }`}
                              >
                                <Lock className="h-3 w-3 inline mr-1" />
                                Disable
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-accent-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={savingSubscription}
                className="flex items-center space-x-2 px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingSubscription ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Subscription</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SuperAdminCafeSettings;

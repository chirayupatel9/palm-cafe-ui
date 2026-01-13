import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building, Settings, Save, ArrowLeft, CheckCircle, XCircle, 
  AlertCircle, Loader, CreditCard, Lock, Unlock, Crown
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
  const [availableModules, setAvailableModules] = useState([]);
  const [planFeatures, setPlanFeatures] = useState({});
  const [subscriptionFormData, setSubscriptionFormData] = useState({
    plan: 'FREE',
    status: 'active',
    enabled_modules: {}
  });
  const [savingSubscription, setSavingSubscription] = useState(false);

  useEffect(() => {
    fetchCafe();
    fetchSubscription();
  }, [cafeId]);

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
      const response = await axios.get(`/superadmin/cafes/${cafeId}/subscription`);
      const data = response.data;
      setSubscription(data.subscription);
      setAvailablePlans(data.available_plans);
      setAvailableModules(data.available_modules);
      setPlanFeatures(data.plan_features);
      
      setSubscriptionFormData({
        plan: data.subscription.plan || 'FREE',
        status: data.subscription.status || 'active',
        enabled_modules: data.subscription.enabledModules || {}
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
      await axios.put(`/superadmin/cafes/${cafeId}/subscription`, {
        plan: subscriptionFormData.plan,
        status: subscriptionFormData.status,
        enabled_modules: subscriptionFormData.enabled_modules
      });
      toast.success('Subscription updated successfully');
      fetchSubscription();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error(error.response?.data?.error || 'Failed to update subscription');
    } finally {
      setSavingSubscription(false);
    }
  };

  const toggleModule = async (module, enabled) => {
    try {
      await axios.post(`/superadmin/cafes/${cafeId}/subscription/modules/${module}/toggle`, {
        enabled
      });
      setSubscriptionFormData(prev => ({
        ...prev,
        enabled_modules: {
          ...prev.enabled_modules,
          [module]: enabled
        }
      }));
      toast.success(`Module ${module} ${enabled ? 'enabled' : 'disabled'}`);
      fetchSubscription();
    } catch (error) {
      console.error('Error toggling module:', error);
      toast.error(error.response?.data?.error || 'Failed to toggle module');
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
        <div className="flex items-center space-x-2">
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
                  value={subscriptionFormData.plan}
                  onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, plan: e.target.value }))}
                  className="w-full px-3 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  {availablePlans.map(plan => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}
                </select>
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

            {/* Plan Features Display */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-3">
                Features Available on {subscriptionFormData.plan} Plan
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {planFeatures[subscriptionFormData.plan]?.map(module => (
                  <div key={module} className="flex items-center space-x-2 p-2 bg-accent-50 dark:bg-gray-700 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-secondary-700 dark:text-gray-300 capitalize">
                      {module.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Module Overrides (Super Admin) */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-3">
                Module Overrides (Super Admin Control)
              </label>
              <p className="text-xs text-secondary-500 dark:text-gray-400 mb-3">
                Override plan defaults for specific modules. These settings take precedence over plan features.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableModules.map(module => {
                  const isEnabled = subscriptionFormData.enabled_modules[module] === true;
                  const isDisabled = subscriptionFormData.enabled_modules[module] === false;
                  const planHasIt = planFeatures[subscriptionFormData.plan]?.includes(module);
                  
                  return (
                    <div
                      key={module}
                      className={`p-3 border rounded-lg ${
                        isEnabled ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                        isDisabled ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                        planHasIt ? 'border-accent-300 dark:border-gray-600 bg-accent-50 dark:bg-gray-700' :
                        'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-secondary-700 dark:text-gray-300 capitalize">
                          {module.replace('_', ' ')}
                        </span>
                        {planHasIt && !isDisabled && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => toggleModule(module, true)}
                          className={`flex-1 px-2 py-1 text-xs rounded ${
                            isEnabled
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                          }`}
                        >
                          <Unlock className="h-3 w-3 inline mr-1" />
                          Enable
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleModule(module, false)}
                          className={`flex-1 px-2 py-1 text-xs rounded ${
                            isDisabled
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30'
                          }`}
                        >
                          <Lock className="h-3 w-3 inline mr-1" />
                          Disable
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building, Settings, Save, ArrowLeft, CheckCircle, XCircle, 
  AlertCircle, Loader 
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

  useEffect(() => {
    fetchCafe();
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
    </div>
  );
};

export default SuperAdminCafeSettings;

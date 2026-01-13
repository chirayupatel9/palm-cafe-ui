import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Building, X, Check, AlertCircle } from 'lucide-react';

const CafeManagement = () => {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCafe, setEditingCafe] = useState(null);
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    description: '',
    logo_url: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    is_active: true
  });

  useEffect(() => {
    fetchCafes();
  }, []);

  const fetchCafes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/superadmin/cafes');
      setCafes(response.data);
    } catch (error) {
      console.error('Error fetching cafes:', error);
      toast.error('Failed to fetch cafes');
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
      if (editingCafe) {
        // Update existing cafe
        await axios.put(`/superadmin/cafes/${editingCafe.id}`, formData);
        toast.success('Cafe updated successfully');
      } else {
        // Create new cafe
        await axios.post('/superadmin/cafes', formData);
        toast.success('Cafe created successfully');
      }
      
      setShowModal(false);
      setEditingCafe(null);
      setFormData({
        slug: '',
        name: '',
        description: '',
        logo_url: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        is_active: true
      });
      fetchCafes();
    } catch (error) {
      console.error('Error saving cafe:', error);
      toast.error(error.response?.data?.error || 'Failed to save cafe');
    }
  };

  const handleEdit = (cafe) => {
    setEditingCafe(cafe);
    setFormData({
      slug: cafe.slug || '',
      name: cafe.name || '',
      description: cafe.description || '',
      logo_url: cafe.logo_url || '',
      address: cafe.address || '',
      phone: cafe.phone || '',
      email: cafe.email || '',
      website: cafe.website || '',
      is_active: cafe.is_active !== undefined ? cafe.is_active : true
    });
    setShowModal(true);
  };

  const handleDelete = async (cafe) => {
    if (!window.confirm(`Are you sure you want to delete "${cafe.name}"? This will deactivate the cafe.`)) {
      return;
    }

    try {
      await axios.delete(`/superadmin/cafes/${cafe.id}`);
      toast.success('Cafe deleted successfully');
      fetchCafes();
    } catch (error) {
      console.error('Error deleting cafe:', error);
      toast.error(error.response?.data?.error || 'Failed to delete cafe');
    }
  };

  const handleNewCafe = () => {
    setEditingCafe(null);
    setFormData({
      slug: '',
      name: '',
      description: '',
      logo_url: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      is_active: true
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-section">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Cafes
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage all cafes in the system
          </p>
        </div>
        <button
          onClick={handleNewCafe}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>Add New Cafe</span>
        </button>
      </div>

      {/* Cafes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cafes.map((cafe) => (
          <div
            key={cafe.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 ${
              cafe.is_active 
                ? 'border-green-500' 
                : 'border-red-500 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Building className="h-8 w-8 text-secondary-600 dark:text-gray-400" />
                <div>
                  <h3 className="text-lg font-semibold text-secondary-700 dark:text-gray-100">
                    {cafe.name}
                  </h3>
                  <p className="text-sm text-secondary-500 dark:text-gray-400">
                    /{cafe.slug}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {cafe.is_active ? (
                  <span className="flex items-center text-green-600 text-xs">
                    <Check className="h-4 w-4 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center text-red-600 text-xs">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {cafe.description && (
              <p className="text-sm text-secondary-600 dark:text-gray-400 mb-4">
                {cafe.description}
              </p>
            )}

            <div className="space-y-2 mb-4">
              {cafe.address && (
                <p className="text-xs text-secondary-500 dark:text-gray-500">
                  📍 {cafe.address}
                </p>
              )}
              {cafe.phone && (
                <p className="text-xs text-secondary-500 dark:text-gray-500">
                  📞 {cafe.phone}
                </p>
              )}
              {cafe.email && (
                <p className="text-xs text-secondary-500 dark:text-gray-500">
                  ✉️ {cafe.email}
                </p>
              )}
              {cafe.website && (
                <p className="text-xs text-secondary-500 dark:text-gray-500">
                  🌐 {cafe.website}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleEdit(cafe)}
                className="flex-1 btn-secondary flex items-center justify-center"
              >
                <Edit className="h-4 w-4 mr-1.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(cafe)}
                className="flex-1 btn-destructive flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {cafes.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Building className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
          <p className="text-secondary-600 dark:text-gray-400">
            No cafes found. Create your first cafe to get started.
          </p>
        </div>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-accent-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-secondary-700 dark:text-gray-100">
                {editingCafe ? 'Edit Cafe' : 'Create New Cafe'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCafe(null);
                }}
                className="text-secondary-500 hover:text-secondary-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-1">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    pattern="[a-z0-9-]+"
                    placeholder="palmcafe"
                    className="input-field"
                    disabled={!!editingCafe}
                  />
                  <p className="text-xs text-secondary-500 dark:text-gray-400 mt-1">
                    Lowercase letters, numbers, and hyphens only. Used in URLs.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Palm Cafe"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Cafe description..."
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleInputChange}
                  placeholder="/images/logo.png"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 8900"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="info@cafe.com"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://cafe.com"
                    className="input-field"
                  />
                </div>
              </div>

              {editingCafe && (
                <div className="flex items-center">
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
              )}

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCafe(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingCafe ? 'Update Cafe' : 'Create Cafe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CafeManagement;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Building, X, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import { CardSkeleton, TableSkeleton } from './ui/Skeleton';
import EmptyState from './ui/EmptyState';
import ConfirmModal from './ui/ConfirmModal';
import { useFormChanges } from '../hooks/useUnsavedChanges';

const CafeManagement = () => {
  const navigate = useNavigate();
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialFormDataRef = useRef(null);
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
  
  // Track form changes for unsaved changes warning
  const hasUnsavedChanges = useFormChanges(
    initialFormDataRef.current || formData,
    formData
  );

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
    
    setIsSubmitting(true);
    try {
      // Create new cafe
      const response = await axios.post('/superadmin/cafes', formData);
      toast.success(`"${formData.name}" has been created successfully`);
      
      setShowModal(false);
      const resetData = {
        slug: '',
        name: '',
        description: '',
        logo_url: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        is_active: true
      };
      setFormData(resetData);
      initialFormDataRef.current = JSON.parse(JSON.stringify(resetData));
      fetchCafes();
      
      // Navigate to the newly created cafe's settings page
      if (response.data && response.data.id) {
        navigate(`/superadmin/cafes/${response.data.id}`);
      }
    } catch (error) {
      console.error('Error saving cafe:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save cafe. Please check your input and try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (cafe) => {
    // Navigate to the manage cafe page (same as overview)
    navigate(`/superadmin/cafes/${cafe.id}`);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`/superadmin/cafes/${deleteConfirm.id}`);
      toast.success(`"${deleteConfirm.name}" has been deleted successfully`);
      setDeleteConfirm(null);
      fetchCafes();
    } catch (error) {
      console.error('Error deleting cafe:', error);
      toast.error(error.response?.data?.error || 'Failed to delete cafe. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewCafe = () => {
    const newFormData = {
      slug: '',
      name: '',
      description: '',
      logo_url: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      is_active: true
    };
    setFormData(newFormData);
    initialFormDataRef.current = JSON.parse(JSON.stringify(newFormData)); // Deep copy
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="space-section">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} lines={4} />
          ))}
        </div>
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
      {cafes.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No cafes yet"
          description="Create your first cafe to start managing locations and settings."
          action={handleNewCafe}
          actionLabel="Create First Cafe"
        />
      ) : (
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
                onClick={() => setDeleteConfirm(cafe)}
                className="flex-1 btn-destructive flex items-center justify-center"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-accent-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-secondary-700 dark:text-gray-100">
                Create New Cafe
              </h3>
              <button
                onClick={() => {
                  if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                    return;
                  }
                  setShowModal(false);
                  initialFormDataRef.current = null;
                }}
                className="text-secondary-500 hover:text-secondary-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {hasUnsavedChanges && (
              <div className="mx-6 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">You have unsaved changes</p>
              </div>
            )}
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
                    placeholder="My Cafe"
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
                  Logo
                </label>
                <div className="flex items-center space-x-4">
                  {formData.logo_url && (
                    <img
                      src={formData.logo_url.startsWith('http') ? formData.logo_url : `http://localhost:5000${formData.logo_url}`}
                      alt="Cafe Logo"
                      className="w-16 h-16 object-contain border rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const formDataUpload = new FormData();
                          formDataUpload.append('logo', file);
                          // Upload logo first
                          axios.post('/cafe-settings/logo', formDataUpload, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          }).then(response => {
                            setFormData(prev => ({ ...prev, logo_url: response.data.logo_url }));
                            toast.success('Logo uploaded successfully');
                          }).catch(error => {
                            console.error('Error uploading logo:', error);
                            toast.error('Failed to upload logo');
                          });
                        }
                      }}
                      className="input-field"
                    />
                  </div>
                </div>
                <p className="text-xs text-secondary-500 dark:text-gray-400 mt-1">
                  Upload a logo image file (max 5MB)
                </p>
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

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                      return;
                    }
                    setShowModal(false);
                    initialFormDataRef.current = null;
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Cafe'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Cafe"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone and will permanently remove the cafe from the system.`}
        confirmLabel="Delete Cafe"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CafeManagement;

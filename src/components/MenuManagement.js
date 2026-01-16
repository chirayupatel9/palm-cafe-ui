import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Download, Upload, FolderOpen, RefreshCw, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useCurrency } from '../contexts/CurrencyContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { getImageUrl, getPlaceholderImage } from '../utils/imageUtils';
import { TableSkeleton, CardSkeleton } from './ui/Skeleton';
import { EmptyMenu } from './ui/EmptyState';
import ConfirmModal from './ui/ConfirmModal';

const MenuManagement = ({ menuItems, onUpdate, onAdd, onDelete }) => {
  const { formatCurrency } = useCurrency();
  const { isDarkMode } = useDarkMode();
  const { cafeSettings } = useCafeSettings();
  const [activeTab, setActiveTab] = useState('menu-items');
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    sort_order: '',
    image_url: '',
    featured_priority: ''
  });
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Category management state
  const [categoryEditingId, setCategoryEditingId] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    sort_order: ''
  });
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [autoGenerating, setAutoGenerating] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories/with-counts');
      setCategories(response.data);
      
      // Set default category for new items
      if (response.data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: response.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setCategoryLoading(false);
    }
  };

  // Helper function to ensure price is a number
  const ensureNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setSelectedImageFile(null); // Clear any selected file when editing
    setFormData({
      category_id: item.category_id || '',
      name: item.name,
      description: item.description,
      price: ensureNumber(item.price).toString(),
      sort_order: item.sort_order ? item.sort_order.toString() : '',
      image_url: item.image_url || '',
      featured_priority: item.featured_priority ? item.featured_priority.toString() : ''
    });
  };

  const handleSave = async () => {
    if (!formData.category_id || !formData.name.trim() || !formData.price) {
      toast.error('Fill in all required fields to continue');
      return;
    }

    const price = ensureNumber(formData.price);
    if (price <= 0) {
      toast.error('Enter a valid price amount');
      return;
    }

    try {
      if (editingId) {
        const updateData = {
          category_id: formData.category_id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: price,
          sort_order: parseInt(formData.sort_order) || 0,
          image_url: formData.image_url,
          featured_priority: formData.featured_priority && formData.featured_priority.trim() !== '' 
            ? parseInt(formData.featured_priority) 
            : null
        };
        await onUpdate(editingId, updateData);
        toast.success('Changes saved');
      } else {
        const addData = {
          category_id: formData.category_id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: price,
          sort_order: parseInt(formData.sort_order) || 0,
          image_url: formData.image_url,
          featured_priority: formData.featured_priority && formData.featured_priority.trim() !== '' 
            ? parseInt(formData.featured_priority) 
            : null
        };
        await onAdd(addData);
        toast.success('Menu item added');
      }
      
      // Auto-generate categories from menu items
      try {
        await axios.post('/categories/generate');
      } catch (error) {
        console.error('Error auto-generating categories:', error);
      }
      
      setEditingId(null);
      setShowAddForm(false);
      setFormData({ 
        category_id: categories.length > 0 ? categories[0].id : '',
        name: '', 
        description: '', 
        price: '',
        sort_order: '',
        image_url: '',
        featured_priority: ''
      });
    } catch (error) {
      console.error('Error saving menu item:', error);
      const errorMessage = error.response?.data?.error || 'We couldn\'t save your changes. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setSelectedImageFile(null);
    setFormData({ 
      category_id: categories.length > 0 ? categories[0].id : '',
      name: '', 
      description: '', 
      price: '',
      sort_order: '',
      image_url: '',
      featured_priority: ''
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    setIsDeleting(true);
    try {
      await onDelete(deleteConfirm.id);
      toast.success(`"${deleteConfirm.name}" has been deleted successfully`);
      setDeleteConfirm(null);
      
      // Auto-generate categories from menu items after deletion
      try {
        await axios.post('/categories/generate');
      } catch (error) {
        console.error('Error auto-generating categories:', error);
      }
    } catch (error) {
      toast.error('Failed to delete menu item. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setSelectedImageFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      setSelectedImageFile(null);
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      setSelectedImageFile(null);
      return;
    }

    setSelectedImageFile(file);
    event.target.value = ''; // Reset file input
  };

  const handleImageUpload = async () => {
    if (!selectedImageFile) {
      toast.error('Please select an image file first');
      return;
    }

    try {
      setImageUploading(true);
      const formData = new FormData();
      formData.append('image', selectedImageFile);

      // If editing an existing item, use item-specific endpoint
      if (editingId) {
        const response = await axios.post(`/menu/${editingId}/image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          setFormData(prev => ({ ...prev, image_url: response.data.image_url }));
          toast.success('Image uploaded successfully');
          setSelectedImageFile(null);
          // Refresh menu items to show updated image
          if (onUpdate) {
            // Trigger a refresh by calling onUpdate with current formData
            await onUpdate(editingId, { ...formData, image_url: response.data.image_url });
          }
        } else {
          toast.error('Failed to upload image');
        }
      } else {
        // For new items, use generic upload endpoint
        const response = await axios.post('/menu/upload-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          setFormData(prev => ({ ...prev, image_url: response.data.image_url }));
          toast.success('Image uploaded successfully');
          setSelectedImageFile(null);
        } else {
          toast.error('Failed to upload image');
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!editingId) {
      // For new items, just clear the form
      setFormData(prev => ({ ...prev, image_url: '' }));
      setSelectedImageFile(null);
      return;
    }

    try {
      setRemovingImage(true);
      const response = await axios.delete(`/menu/${editingId}/image`);

      if (response.data.success) {
        setFormData(prev => ({ ...prev, image_url: '' }));
        toast.success('Image removed successfully');
        // Refresh menu items to show updated state
        if (onUpdate) {
          await onUpdate(editingId, { ...formData, image_url: null });
        }
      } else {
        toast.error('Failed to remove image');
      }
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error(error.response?.data?.error || 'Failed to remove image');
    } finally {
      setRemovingImage(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/menu/export', { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cafeSettings.cafe_name || 'cafe'}-menu.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Menu exported successfully');
    } catch (error) {
      console.error('Error exporting menu:', error);
      toast.error('Failed to export menu');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/menu/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(response.data.message);
      
      // Auto-generate categories from imported menu items
      try {
        await axios.post('/categories/generate');
      } catch (error) {
        console.error('Error auto-generating categories:', error);
      }
      
      // Refresh the menu items
      window.location.reload();
    } catch (error) {
      console.error('Error importing menu:', error);
      toast.error('Failed to import menu');
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleZipImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast.error('Please select a ZIP file (.zip)');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/menu/import-zip', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Show detailed import results
      const { successCount, failureCount, imageStats, errors } = response.data;
      
      let message = `Import completed: ${successCount} items imported`;
      if (failureCount > 0) {
        message += `, ${failureCount} failed`;
      }
      if (imageStats) {
        message += `. Images: ${imageStats.attached} attached`;
        if (imageStats.missing > 0) {
          message += `, ${imageStats.missing} missing`;
        }
        if (imageStats.invalid > 0) {
          message += `, ${imageStats.invalid} invalid`;
        }
      }
      
      toast.success(message, { duration: 5000 });
      
      if (errors && errors.length > 0) {
        console.warn('Import errors:', errors);
        // Show errors in a toast or console
        errors.slice(0, 5).forEach(error => {
          toast.error(error, { duration: 3000 });
        });
        if (errors.length > 5) {
          toast.error(`... and ${errors.length - 5} more errors. Check console for details.`, { duration: 4000 });
        }
      }
      
      // Auto-generate categories from imported menu items
      try {
        await axios.post('/categories/generate');
      } catch (error) {
        console.error('Error auto-generating categories:', error);
      }
      
      // Refresh the menu items
      window.location.reload();
    } catch (error) {
      console.error('Error importing menu ZIP:', error);
      const errorMessage = error.response?.data?.error || 'Failed to import menu ZIP';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset file input
    }
  };

  // Category Management Functions
  const generateCategoriesFromMenu = async () => {
    try {
      setAutoGenerating(true);
      const response = await axios.post('/categories/generate');
      toast.success(response.data.message);
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error generating categories:', error);
      toast.error('Failed to generate categories from menu');
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleCategoryEdit = (category) => {
    setCategoryEditingId(category.id);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      sort_order: category.sort_order ? category.sort_order.toString() : ''
    });
  };

  const handleCategorySave = async () => {
    if (!categoryFormData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      if (categoryEditingId) {
        const response = await axios.put(`/categories/${categoryEditingId}`, {
          name: categoryFormData.name.trim(),
          description: categoryFormData.description.trim(),
          sort_order: parseInt(categoryFormData.sort_order) || 0,
          is_active: true
        });
        toast.success('Category updated successfully');
      } else {
        const response = await axios.post('/categories', {
          name: categoryFormData.name.trim(),
          description: categoryFormData.description.trim(),
          sort_order: parseInt(categoryFormData.sort_order) || 0
        });
        toast.success('Category created successfully');
      }
      
      setCategoryEditingId(null);
      setShowCategoryForm(false);
      setCategoryFormData({ name: '', description: '', sort_order: '' });
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const handleCategoryCancel = () => {
    setCategoryEditingId(null);
    setShowCategoryForm(false);
    setCategoryFormData({ name: '', description: '', sort_order: '' });
  };

  const handleCategoryDelete = async (id, name, itemCount) => {
    if (itemCount > 0) {
      toast.error(`Cannot delete category "${name}" - it has ${itemCount} menu items. Please move or delete the items first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await axios.delete(`/categories/${id}`);
        
        toast.success('Category deleted successfully');
        fetchCategories(); // Refresh the list
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Failed to delete category');
      }
    }
  };

  const handleCategoryInputChange = (field, value) => {
    setCategoryFormData(prev => ({ ...prev, [field]: value }));
  };

  // Filter menu items by category
  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category_id === selectedCategory);

  // Group menu items by category for display
  const groupedMenuItems = menuItems.reduce((groups, item) => {
    const categoryName = item.category_name || 'Uncategorized';
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(item);
    return groups;
  }, {});

  if (categoryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>
            Menu
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage menu items and categories
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('menu-items')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'menu-items'
                ? `border-secondary-500 ${isDarkMode ? 'text-secondary-400' : 'text-secondary-600'}`
                : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
            }`}
          >
            <div className="flex items-center">
              <FolderOpen className="h-4 w-4 mr-2" />
              Menu Items
            </div>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? `border-secondary-500 ${isDarkMode ? 'text-secondary-400' : 'text-secondary-600'}`
                : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
            }`}
          >
            <div className="flex items-center">
              <FolderOpen className="h-4 w-4 mr-2" />
              Categories
            </div>
          </button>
        </nav>
      </div>

      {/* Menu Items Tab */}
      {activeTab === 'menu-items' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center">
              {cafeSettings.logo_url ? (
                <img 
                  src={getImageUrl(cafeSettings.logo_url)} 
                  alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`} 
                  className="h-10 w-10 mr-3"
                />
              ) : (
                <div className="h-10 w-10 mr-3 bg-primary-600 rounded flex items-center justify-center text-white font-bold">
                  {cafeSettings.cafe_name ? cafeSettings.cafe_name.charAt(0).toUpperCase() : 'C'}
                </div>
              )}
              <div>
                <h3 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>Menu Items</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage your cafe's menu items</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <label className="btn-secondary flex items-center justify-center cursor-pointer text-sm" title="Import Excel file (without images)">
                <Upload className="h-4 w-4 mr-2" />
                Import Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              <label className="btn-secondary flex items-center justify-center cursor-pointer text-sm" title="Import ZIP file with Excel and images folder">
                <FolderOpen className="h-4 w-4 mr-2" />
                Import ZIP
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipImport}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              <button
                onClick={handleExport}
                disabled={loading}
                className="btn-secondary flex items-center justify-center text-sm"
                title="Export menu to Excel (includes image filenames)"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary flex items-center justify-center text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Item
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>Filter by Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field sm:max-w-xs"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add New Item Form */}
          {showAddForm && (
            <div className="card">
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>Add New Menu Item</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <select
                  value={formData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select Category *</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Item Name *"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="input-field"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Price *"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="input-field"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Sort Order"
                  value={formData.sort_order}
                  onChange={(e) => handleInputChange('sort_order', e.target.value)}
                  className="input-field"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Featured Priority"
                  value={formData.featured_priority}
                  onChange={(e) => handleInputChange('featured_priority', e.target.value)}
                  className="input-field"
                  title="Set priority to feature this item (higher = more prominent, leave empty to not feature)"
                />
              </div>
              {/* Image Upload Section */}
              <div className="mt-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>
                  Item Image
                </label>
                <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Upload an image for this menu item (max 5MB)
                </p>
                <div className="flex items-start space-x-4">
                  {(formData.image_url || selectedImageFile) && (
                    <div className="relative">
                      <img
                        src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : getImageUrl(formData.image_url)}
                        alt="Menu Item Preview"
                        className="w-24 h-24 object-cover border rounded-lg"
                      />
                      {selectedImageFile && (
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                          New
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <label className="btn-secondary flex items-center justify-center cursor-pointer text-sm flex-shrink-0">
                        <Upload className="h-4 w-4 mr-2" />
                        {formData.image_url || selectedImageFile ? 'Replace' : 'Select'} Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                          disabled={imageUploading || removingImage}
                        />
                      </label>
                      {selectedImageFile && (
                        <button
                          onClick={handleImageUpload}
                          disabled={imageUploading}
                          className="btn-primary flex items-center justify-center text-sm flex-shrink-0"
                        >
                          {imageUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </>
                          )}
                        </button>
                      )}
                      {(formData.image_url || selectedImageFile) && (
                        <button
                          onClick={handleRemoveImage}
                          disabled={removingImage || imageUploading}
                          className="btn-secondary flex items-center justify-center text-sm flex-shrink-0 text-red-600 hover:text-red-700"
                        >
                          {removingImage ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent mr-2"></div>
                              Removing...
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Remove
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {selectedImageFile && (
                      <p className="text-xs text-gray-500">
                        Selected: {selectedImageFile.name} ({(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                <button onClick={handleCancel} className="btn-secondary flex items-center justify-center">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  className="btn-primary flex items-center justify-center"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Menu Items by Category */}
          {Object.keys(groupedMenuItems).length === 0 ? (
            <EmptyMenu onAdd={() => setShowAddForm(true)} />
          ) : (
            Object.entries(groupedMenuItems).map(([categoryName, items], index) => {
              return (
                <div key={categoryName} className="card">
                  <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center`}>
                    <FolderOpen className={`h-5 w-5 mr-2 text-gray-600 dark:text-gray-400`} />
                    {categoryName} ({items.length} items)
                  </h3>
                
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-accent-200'}`}>
                    <thead style={{ backgroundColor: 'var(--surface-table)' }}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-secondary-600'}`}>
                          Image
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-secondary-600'}`}>
                          Category
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-secondary-600'}`}>
                          Item
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-secondary-600'}`}>
                          Description
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-secondary-600'}`}>
                          Price
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-secondary-600'}`}>
                          Sort Order
                        </th>
                        <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-secondary-600'}`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-accent-200'}`}>
                      {items.map((item) => (
                        <tr key={item.id} className={`h-14 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-accent-50'} transition-colors`}>
                          {editingId === item.id ? (
                            // Edit Mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  {formData.image_url && (
                                    <img
                                      src={getImageUrl(formData.image_url)}
                                      alt="Menu Item"
                                      className="w-12 h-12 object-cover rounded-lg border"
                                    />
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="text-xs"
                                    disabled={imageUploading}
                                  />
                                </div>
                                {imageUploading && (
                                  <div className="mt-1">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary-500"></div>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={formData.category_id}
                                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                                  className="input-field"
                                >
                                  {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                      {category.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={formData.name}
                                  onChange={(e) => handleInputChange('name', e.target.value)}
                                  className="input-field"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={formData.description}
                                  onChange={(e) => handleInputChange('description', e.target.value)}
                                  className="input-field"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={formData.price}
                                  onChange={(e) => handleInputChange('price', e.target.value)}
                                  className="input-field"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  min="0"
                                  value={formData.sort_order}
                                  onChange={(e) => handleInputChange('sort_order', e.target.value)}
                                  className="input-field"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Priority"
                                  value={formData.featured_priority}
                                  onChange={(e) => handleInputChange('featured_priority', e.target.value)}
                                  className="input-field"
                                  title="Set priority to feature this item (higher = more prominent)"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button onClick={handleSave} className="text-green-600 hover:text-green-900">
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button onClick={handleCancel} className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}>
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // View Mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <img
                                  src={item.image_url ? getImageUrl(item.image_url) : getPlaceholderImage(item.category_name, item.name)}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded-lg border"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {categories.find(cat => cat.id === item.category_id)?.name || 'Unknown'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-medium ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>{item.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-semibold ${isDarkMode ? 'text-secondary-400' : 'text-secondary-600'}`}>
                                  {formatCurrency(ensureNumber(item.price))}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.sort_order || 0}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {item.featured_priority !== null && item.featured_priority !== undefined 
                                    ? item.featured_priority 
                                    : '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm({ id: item.id, name: item.name })}
                                    className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}`}
                                    disabled={isDeleting}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className="border rounded-lg p-4 transition-surface hover-lift"
                      style={{ 
                        borderColor: 'var(--color-outline)',
                        backgroundColor: 'var(--surface-card)',
                        boxShadow: 'var(--elevation-1)'
                      }}
                    >
                      {editingId === item.id ? (
                        // Edit Mode Mobile
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            {formData.image_url && (
                              <img
                                src={getImageUrl(formData.image_url)}
                                alt="Menu Item"
                                className="w-12 h-12 object-cover rounded-lg border"
                              />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="text-xs"
                              disabled={imageUploading}
                            />
                          </div>
                          {imageUploading && (
                            <div className="mt-1">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary-500"></div>
                            </div>
                          )}
                          <select
                            value={formData.category_id}
                            onChange={(e) => handleInputChange('category_id', e.target.value)}
                            className="input-field"
                          >
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Item Name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="input-field"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            className="input-field"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Price"
                              value={formData.price}
                              onChange={(e) => handleInputChange('price', e.target.value)}
                              className="input-field"
                            />
                            <input
                              type="number"
                              min="0"
                              placeholder="Sort Order"
                              value={formData.sort_order}
                              onChange={(e) => handleInputChange('sort_order', e.target.value)}
                              className="input-field"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={handleSave} 
                              className="flex-1 btn-primary flex items-center justify-center"
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </>
                              )}
                            </button>
                            <button onClick={handleCancel} className="flex-1 btn-secondary flex items-center justify-center">
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode Mobile
                        <div>
                          <div className="flex items-start space-x-3 mb-3">
                            <img
                              src={item.image_url ? getImageUrl(item.image_url) : getPlaceholderImage(item.category_name, item.name)}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg border flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className={`font-medium ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>{item.name}</h4>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className={`p-2 rounded-full ${isDarkMode ? 'text-blue-400 hover:text-blue-300 bg-blue-900/30' : 'text-blue-600 hover:text-blue-900 bg-blue-50'}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm({ id: item.id, name: item.name })}
                                    className={`p-2 rounded-full ${isDarkMode ? 'text-red-400 hover:text-red-300 bg-red-900/30' : 'text-red-600 hover:text-red-900 bg-red-50'}`}
                                    disabled={isDeleting}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.description}</p>
                              <div className="flex justify-between items-center text-sm">
                                <span className={`font-semibold ${isDarkMode ? 'text-secondary-400' : 'text-secondary-600'}`}>
                                  {formatCurrency(ensureNumber(item.price))}
                                </span>
                                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sort: {item.sort_order || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center">
              {cafeSettings.logo_url ? (
                <img 
                  src={getImageUrl(cafeSettings.logo_url)} 
                  alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`} 
                  className="h-10 w-10 mr-3"
                />
              ) : (
                <div className="h-10 w-10 mr-3 bg-primary-600 rounded flex items-center justify-center text-white font-bold">
                  {cafeSettings.cafe_name ? cafeSettings.cafe_name.charAt(0).toUpperCase() : 'C'}
                </div>
              )}
              <div>
                <h3 className={`text-xl sm:text-2xl font-bold flex items-center ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>
                  <FolderOpen className="h-6 w-6 mr-2" />
                  Category Management
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Organize your menu with categories</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={generateCategoriesFromMenu}
                disabled={autoGenerating}
                className="btn-secondary flex items-center justify-center text-sm"
              >
                {autoGenerating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {autoGenerating ? 'Generating...' : 'Auto-Generate'}
              </button>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="btn-primary flex items-center justify-center text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Category
              </button>
            </div>
          </div>

          {/* Add New Category Form */}
          {showCategoryForm && (
            <div className="card">
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>Add New Category</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Category Name *"
                  value={categoryFormData.name}
                  onChange={(e) => handleCategoryInputChange('name', e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={categoryFormData.description}
                  onChange={(e) => handleCategoryInputChange('description', e.target.value)}
                  className="input-field"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Sort Order"
                  value={categoryFormData.sort_order}
                  onChange={(e) => handleCategoryInputChange('sort_order', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                <button onClick={handleCategoryCancel} className="btn-secondary flex items-center justify-center">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button onClick={handleCategorySave} className="btn-primary flex items-center justify-center">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="card">
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>Current Categories</h3>
            {categories.length === 0 ? (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {cafeSettings.logo_url ? (
                  <img 
                    src={getImageUrl(cafeSettings.logo_url)} 
                    alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`} 
                    className="h-16 w-16 mx-auto mb-4 opacity-50"
                  />
                ) : (
                  <div className="h-16 w-16 mx-auto mb-4 bg-primary-600 rounded flex items-center justify-center text-white font-bold opacity-50">
                    {cafeSettings.cafe_name ? cafeSettings.cafe_name.charAt(0).toUpperCase() : 'C'}
                  </div>
                )}
                <p>No categories found</p>
                <p className="text-sm">Add your first category to get started</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-accent-200'}`}>
                    <thead style={{ backgroundColor: 'var(--surface-table)' }}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-secondary-600'}`}>
                          Category
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-secondary-600'}`}>
                          Description
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-secondary-600'}`}>
                          Items
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-secondary-600'}`}>
                          Sort Order
                        </th>
                        <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-secondary-600'}`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-accent-200'}`}>
                      {categories.map((category, index) => {
                        return (
                        <tr key={category.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-accent-50'}>
                          {categoryEditingId === category.id ? (
                            // Edit Mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={categoryFormData.name}
                                  onChange={(e) => handleCategoryInputChange('name', e.target.value)}
                                  className="input-field"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={categoryFormData.description}
                                  onChange={(e) => handleCategoryInputChange('description', e.target.value)}
                                  className="input-field"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{category.item_count} items</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  min="0"
                                  value={categoryFormData.sort_order}
                                  onChange={(e) => handleCategoryInputChange('sort_order', e.target.value)}
                                  className="input-field"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button onClick={handleCategorySave} className="text-green-600 hover:text-green-900">
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button onClick={handleCategoryCancel} className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}>
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // View Mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <FolderOpen className="h-5 w-5 text-secondary-500 mr-3" />
                                  <div className={`text-sm font-medium ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>{category.name}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{category.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  category.item_count > 0 
                                    ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                                    : isDarkMode ? 'bg-accent-900/30 text-accent-300' : 'bg-accent-100 text-accent-800'
                                }`}>
                                  {category.item_count} items
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{category.sort_order}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleCategoryEdit(category)}
                                    className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCategoryDelete(category.id, category.name, category.item_count)}
                                    className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3">
                  {categories.map((category) => (
                    <div 
                      key={category.id} 
                      className="border rounded-lg p-4 transition-elevation hover-lift"
                      style={{ 
                        borderColor: 'var(--color-outline)',
                        backgroundColor: 'var(--surface-card)',
                        boxShadow: 'var(--elevation-1)'
                      }}
                    >
                      {categoryEditingId === category.id ? (
                        // Edit Mode Mobile
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Category Name"
                            value={categoryFormData.name}
                            onChange={(e) => handleCategoryInputChange('name', e.target.value)}
                            className="input-field"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={categoryFormData.description}
                            onChange={(e) => handleCategoryInputChange('description', e.target.value)}
                            className="input-field"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Sort Order"
                            value={categoryFormData.sort_order}
                            onChange={(e) => handleCategoryInputChange('sort_order', e.target.value)}
                            className="input-field"
                          />
                          <div className="flex space-x-2">
                            <button onClick={handleCategorySave} className="flex-1 btn-primary flex items-center justify-center">
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </button>
                            <button onClick={handleCategoryCancel} className="flex-1 btn-secondary flex items-center justify-center">
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode Mobile
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center">
                              <FolderOpen className="h-5 w-5 text-secondary-500 mr-3" />
                              <div>
                                <h4 className={`font-medium ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>{category.name}</h4>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{category.description}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleCategoryEdit(category)}
                                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300 bg-blue-900/30' : 'text-blue-600 hover:text-blue-900 bg-blue-50'}`}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleCategoryDelete(category.id, category.name, category.item_count)}
                                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-red-400 hover:text-red-300 bg-red-900/30' : 'text-red-600 hover:text-red-900 bg-red-50'}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              category.item_count > 0 
                                ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                                : isDarkMode ? 'bg-accent-900/30 text-accent-300' : 'bg-accent-100 text-accent-800'
                            }`}>
                              {category.item_count} items
                            </span>
                            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sort: {category.sort_order}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Item"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MenuManagement; 
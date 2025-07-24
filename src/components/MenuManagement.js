import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Download, Upload, FolderOpen, RefreshCw, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useCurrency } from '../contexts/CurrencyContext';
import { getCategoryColor, getCategoryColorByIndex } from '../utils/categoryColors';

const MenuManagement = ({ menuItems, onUpdate, onAdd, onDelete }) => {
  const { formatCurrency } = useCurrency();
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
    sort_order: ''
  });
  const [loading, setLoading] = useState(false);

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
    setFormData({
      category_id: item.category_id || '',
      name: item.name,
      description: item.description,
      price: ensureNumber(item.price).toString(),
      sort_order: item.sort_order ? item.sort_order.toString() : ''
    });
  };

  const handleSave = async () => {
    if (!formData.category_id || !formData.name.trim() || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    const price = ensureNumber(formData.price);
    if (price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      if (editingId) {
        await onUpdate(editingId, {
          category_id: formData.category_id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: price,
          sort_order: parseInt(formData.sort_order) || 0
        });
        toast.success('Menu item updated successfully');
      } else {
        await onAdd({
          category_id: formData.category_id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: price,
          sort_order: parseInt(formData.sort_order) || 0
        });
        toast.success('Menu item added successfully');
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
        sort_order: ''
      });
    } catch (error) {
      console.error('Error saving menu item:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save menu item';
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ 
      category_id: categories.length > 0 ? categories[0].id : '',
      name: '', 
      description: '', 
      price: '',
      sort_order: ''
    });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await onDelete(id);
        toast.success('Menu item deleted successfully');
        
        // Auto-generate categories from menu items after deletion
        try {
          await axios.post('/categories/generate');
        } catch (error) {
          console.error('Error auto-generating categories:', error);
        }
      } catch (error) {
        toast.error('Failed to delete menu item');
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/menu/export', { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'palm-cafe-menu.xlsx';
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-700 dark:text-secondary-300">
            Menu & Category Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your cafe's menu items and categories
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('menu-items')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'menu-items'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
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
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
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
              <img 
                src="/images/palm-cafe-logo.png" 
                alt="Palm Cafe Logo" 
                className="h-10 w-10 mr-3"
              />
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-secondary-700 dark:text-secondary-300">Menu Items</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your cafe's menu items</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <label className="btn-secondary flex items-center justify-center cursor-pointer text-sm">
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
              <button
                onClick={handleExport}
                disabled={loading}
                className="btn-secondary flex items-center justify-center text-sm"
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
              <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Filter by Category:</label>
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
              <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300 mb-4">Add New Menu Item</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                <button onClick={handleCancel} className="btn-secondary flex items-center justify-center">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-primary flex items-center justify-center">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Menu Items by Category */}
          {Object.keys(groupedMenuItems).length === 0 ? (
            <div className="card">
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <img 
                  src="/images/palm-cafe-logo.png" 
                  alt="Palm Cafe Logo" 
                  className="h-16 w-16 mx-auto mb-4 opacity-50"
                />
                <p>No menu items found</p>
                <p className="text-sm">Add your first menu item to get started</p>
              </div>
            </div>
          ) : (
            Object.entries(groupedMenuItems).map(([categoryName, items], index) => {
              const categoryColor = getCategoryColor(categoryName, index);
              return (
                <div key={categoryName} className="card">
                  <h3 className={`text-lg font-semibold ${categoryColor.text} mb-4 flex items-center`}>
                    <FolderOpen className={`h-5 w-5 mr-2 ${categoryColor.text}`} />
                    {categoryName} ({items.length} items)
                  </h3>
                
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-accent-200">
                    <thead className="bg-accent-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Sort Order
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-accent-200">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-accent-50">
                          {editingId === item.id ? (
                            // Edit Mode
                            <>
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
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button onClick={handleSave} className="text-green-600 hover:text-green-900">
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button onClick={handleCancel} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // View Mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300">{item.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-secondary-600">
                                  {formatCurrency(ensureNumber(item.price))}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500 dark:text-gray-400">{item.sort_order || 0}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id, item.name)}
                                    className="text-red-600 hover:text-red-900"
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
                    <div key={item.id} className="border border-accent-200 rounded-lg p-4 bg-white">
                      {editingId === item.id ? (
                        // Edit Mode Mobile
                        <div className="space-y-3">
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
                            <button onClick={handleSave} className="flex-1 btn-primary flex items-center justify-center">
                              <Save className="h-4 w-4 mr-2" />
                              Save
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
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-secondary-700 dark:text-secondary-300">{item.name}</h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-blue-600 hover:text-blue-900 bg-blue-50 rounded-full"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id, item.name)}
                                className="p-2 text-red-600 hover:text-red-900 bg-red-50 rounded-full"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-secondary-600">
                              {formatCurrency(ensureNumber(item.price))}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">Sort: {item.sort_order || 0}</span>
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
              <img 
                src="/images/palm-cafe-logo.png" 
                alt="Palm Cafe Logo" 
                className="h-10 w-10 mr-3"
              />
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-secondary-700 dark:text-secondary-300 flex items-center">
                  <FolderOpen className="h-6 w-6 mr-2" />
                  Category Management
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Organize your menu with categories</p>
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
              <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300 mb-4">Add New Category</h3>
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
            <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300 mb-4">Current Categories</h3>
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <img 
                  src="/images/palm-cafe-logo.png" 
                  alt="Palm Cafe Logo" 
                  className="h-16 w-16 mx-auto mb-4 opacity-50"
                />
                <p>No categories found</p>
                <p className="text-sm">Add your first category to get started</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-accent-200">
                    <thead className="bg-accent-50 dark:bg-accent-900/20">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                          Sort Order
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-accent-200 dark:divide-accent-700">
                      {categories.map((category, index) => {
                        const categoryColor = getCategoryColorByIndex(index);
                        return (
                        <tr key={category.id} className={`hover:${categoryColor.hover}`}>
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
                                <span className="text-sm text-gray-500 dark:text-gray-400">{category.item_count} items</span>
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
                                  <button onClick={handleCategorySave} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button onClick={handleCategoryCancel} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
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
                                  <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300">{category.name}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600 dark:text-gray-400">{category.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  category.item_count > 0 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                    : 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300'
                                }`}>
                                  {category.item_count} items
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500 dark:text-gray-400">{category.sort_order}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleCategoryEdit(category)}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCategoryDelete(category.id, category.name, category.item_count)}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
                    <div key={category.id} className="border border-accent-200 dark:border-accent-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
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
                                <h4 className="font-medium text-secondary-700 dark:text-secondary-300">{category.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleCategoryEdit(category)}
                                className="p-2 text-blue-600 hover:text-blue-900 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300 rounded-full transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleCategoryDelete(category.id, category.name, category.item_count)}
                                className="p-2 text-red-600 hover:text-red-900 bg-red-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 rounded-full transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              category.item_count > 0 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                : 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300'
                            }`}>
                              {category.item_count} items
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">Sort: {category.sort_order}</span>
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
    </div>
  );
};

export default MenuManagement; 
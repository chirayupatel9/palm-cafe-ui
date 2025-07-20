import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getCategoryColorByIndex } from '../utils/categoryColors';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sort_order: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories/with-counts');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
      sort_order: category.sort_order ? category.sort_order.toString() : ''
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      if (editingId) {
        const response = await axios.put(`/categories/${editingId}`, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          sort_order: parseInt(formData.sort_order) || 0,
          is_active: true
        });
        toast.success('Category updated successfully');
      } else {
        const response = await axios.post('/categories', {
          name: formData.name.trim(),
          description: formData.description.trim(),
          sort_order: parseInt(formData.sort_order) || 0
        });
        toast.success('Category created successfully');
      }
      
      setEditingId(null);
      setShowAddForm(false);
      setFormData({ name: '', description: '', sort_order: '' });
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ name: '', description: '', sort_order: '' });
  };

  const handleDelete = async (id, name, itemCount) => {
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <img 
          src="/images/palm-cafe-logo.png" 
          alt="Palm Cafe Logo" 
          className="h-12 w-12 mb-3"
        />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
        <p className="mt-3 text-sm text-secondary-600 dark:text-secondary-400">Loading categories...</p>
      </div>
    );
  }

  return (
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
            <h2 className="text-xl sm:text-2xl font-bold text-secondary-700 dark:text-secondary-300 flex items-center">
              <FolderOpen className="h-6 w-6 mr-2" />
              Category Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Organize your menu with categories</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center justify-center text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Category
        </button>
      </div>

      {/* Add New Category Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300 mb-4">Add New Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Category Name *"
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
                      {editingId === category.id ? (
                        // Edit Mode
                        <>
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
                            <span className="text-sm text-gray-500 dark:text-gray-400">{category.item_count} items</span>
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
                              <button onClick={handleSave} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
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
                                onClick={() => handleEdit(category)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(category.id, category.name, category.item_count)}
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
                  {editingId === category.id ? (
                    // Edit Mode Mobile
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Category Name"
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
                        min="0"
                        placeholder="Sort Order"
                        value={formData.sort_order}
                        onChange={(e) => handleInputChange('sort_order', e.target.value)}
                        className="input-field"
                      />
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
                            onClick={() => handleEdit(category)}
                            className="p-2 text-blue-600 hover:text-blue-900 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300 rounded-full transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id, category.name, category.item_count)}
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
  );
};

export default CategoryManagement; 
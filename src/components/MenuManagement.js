import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Download, Upload, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useCurrency } from '../contexts/CurrencyContext';
import { getCategoryColor } from '../utils/categoryColors';

const MenuManagement = ({ menuItems, onUpdate, onAdd, onDelete }) => {
  const { formatCurrency } = useCurrency();
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

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      setCategories(response.data);
      
      // Set default category for new items
      if (response.data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: response.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
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
      toast.error('Failed to save menu item');
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
            <h2 className="text-xl sm:text-2xl font-bold text-secondary-700 dark:text-secondary-300">Menu Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your cafe's menu items and categories</p>
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
  );
};

export default MenuManagement; 
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, AlertTriangle, TrendingUp, TrendingDown, Search, Filter, Download, Upload, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';

const InventoryManagement = () => {
  const { formatCurrency } = useCurrency();
  const { isAuthenticated, user, loading: authLoading, token } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    newCategory: '',
    quantity: '',
    unit: '',
    cost_per_unit: '',
    supplier: '',
    reorder_level: '',
    description: ''
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchInventory();
      fetchCategories();
    }
  }, [isAuthenticated, authLoading]);

  const fetchInventory = async () => {
    try {
      const response = await axios.get('/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('🔍 Fetching inventory categories...');
      console.log('🔑 Auth token:', token ? 'Present' : 'Missing');
      console.log('👤 User authenticated:', isAuthenticated);
      
      const response = await axios.get('/inventory/categories');
      console.log('✅ Categories response:', response.data);
      setCategories(response.data);
    } catch (error) {
      console.error('❌ Error fetching inventory categories:', error);
      console.error('📊 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      // If no inventory categories exist yet, start with empty array
      setCategories([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const categoryToUse = formData.category === 'new' ? formData.newCategory : formData.category;
    
    if (!formData.name || !categoryToUse || !formData.quantity || !formData.unit) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const submitData = {
        ...formData,
        category: categoryToUse
      };
      
      if (editingItem) {
        await axios.put(`/inventory/${editingItem.id}`, submitData);
        toast.success('Inventory item updated successfully');
      } else {
        await axios.post('/inventory', submitData);
        toast.success('Inventory item added successfully');
      }
      
      setShowAddForm(false);
      setEditingItem(null);
      resetForm();
      fetchInventory();
      fetchCategories(); // Refresh categories after adding/updating
    } catch (error) {
      console.error('Error saving inventory item:', error);
      toast.error('Failed to save inventory item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      newCategory: '',
      quantity: item.quantity,
      unit: item.unit,
      cost_per_unit: item.cost_per_unit,
      supplier: item.supplier || '',
      reorder_level: item.reorder_level,
      description: item.description || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    try {
      await axios.delete(`/inventory/${id}`);
      toast.success('Inventory item deleted successfully');
      fetchInventory();
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      toast.error('Failed to delete inventory item');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/inventory/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Inventory exported successfully');
    } catch (error) {
      console.error('Error exporting inventory:', error);
      toast.error('Failed to export inventory');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get('/inventory/template', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/inventory/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResults(response.data.results);
      
      if (response.data.results.successful > 0) {
        toast.success(`Import completed: ${response.data.results.successful} items processed successfully`);
        fetchInventory();
      }
      
      if (response.data.results.failed > 0) {
        toast.error(`${response.data.results.failed} items failed to import`);
      }
    } catch (error) {
      console.error('Error importing inventory:', error);
      toast.error('Failed to import inventory');
    } finally {
      setImporting(false);
      event.target.value = ''; // Reset file input
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      newCategory: '',
      quantity: '',
      unit: '',
      cost_per_unit: '',
      supplier: '',
      reorder_level: '',
      description: ''
    });
  };

  const getStockStatus = (quantity, reorderLevel) => {
    if (quantity <= 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle };
    if (quantity <= reorderLevel) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-50', icon: Package };
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getInventoryStats = () => {
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(item => item.quantity <= item.reorder_level).length;
    const outOfStockItems = inventory.filter(item => item.quantity <= 0).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.cost_per_unit || 0)), 0);

    return { totalItems, lowStockItems, outOfStockItems, totalValue };
  };

  const stats = getInventoryStats();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <img 
          src="/images/palm-cafe-logo.png" 
          alt="Palm Cafe Logo" 
          className="h-12 w-12 mb-3"
        />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
        <p className="mt-3 text-sm text-secondary-600">Loading inventory...</p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <img 
          src="/images/palm-cafe-logo.png" 
          alt="Palm Cafe Logo" 
          className="h-16 w-16 mb-4 opacity-50"
        />
        <h2 className="text-xl font-semibold text-secondary-700 dark:text-secondary-300 mb-2">Authentication Required</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
          You need to be logged in to access the inventory management system.
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          className="btn-primary"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src="/images/palm-cafe-logo.png" 
            alt="Palm Cafe Logo" 
            className="h-12 w-12 mr-4"
          />
          <div>
            <h1 className="text-2xl font-bold text-secondary-700 dark:text-secondary-300">Inventory Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Track and manage your stock levels</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadTemplate}
            className="btn-secondary flex items-center"
            title="Download Import Template"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Template
          </button>
          
          <label className={`btn-secondary flex items-center cursor-pointer ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {importing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {importing ? 'Importing...' : 'Import'}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
              disabled={importing}
            />
          </label>
          
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center"
            title="Export to Excel"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingItem(null);
              resetForm();
            }}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.outOfStockItems}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Results */}
      {importResults && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Import Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{importResults.total}</div>
              <div className="text-sm text-gray-600">Total Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{importResults.successful}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {importResults.total > 0 ? Math.round((importResults.successful / importResults.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
          
          {importResults.errors.length > 0 && (
            <div>
              <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
              <div className="max-h-40 overflow-y-auto">
                {importResults.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 mb-1">
                    Row {error.row}: {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button
            onClick={() => setImportResults(null)}
            className="mt-3 btn-secondary"
          >
            Close
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.name} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.name} ({category.item_count} items)
                    </option>
                  ))}
                  <option value="new">+ Add New Category</option>
                </select>
                {formData.category === 'new' && (
                  <input
                    type="text"
                    value={formData.newCategory}
                    onChange={(e) => setFormData({...formData, newCategory: e.target.value})}
                    className="input-field mt-2"
                    placeholder="Enter new category name"
                    required
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="input-field"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="">Select Unit</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="l">Liters (L)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="boxes">Boxes</option>
                  <option value="bottles">Bottles</option>
                  <option value="cans">Cans</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit</label>
                <input
                  type="number"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({...formData, cost_per_unit: e.target.value})}
                  className="input-field"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                <input
                  type="number"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
                  className="input-field"
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="input-field"
                  placeholder="Supplier name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="input-field"
                rows="3"
                placeholder="Additional notes about this item"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item.quantity, item.reorder_level);
                const StatusIcon = stockStatus.icon;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500">{item.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StatusIcon className={`h-4 w-4 mr-2 ${stockStatus.color}`} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.quantity} {item.unit}
                          </div>
                          {item.reorder_level && (
                            <div className="text-xs text-gray-500">
                              Reorder at: {item.reorder_level} {item.unit}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.cost_per_unit ? formatCurrency(item.cost_per_unit) : '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Total: {formatCurrency(item.quantity * (item.cost_per_unit || 0))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.supplier || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-secondary-600 hover:text-secondary-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredInventory.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No inventory items found</p>
            <p className="text-sm">Add your first inventory item to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManagement; 
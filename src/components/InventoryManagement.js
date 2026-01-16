import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, AlertTriangle, TrendingUp, TrendingDown, Search, Filter, Download, Upload, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useFeatures } from '../contexts/FeatureContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { getImageUrl } from '../utils/imageUtils';
import LockedFeature from './ui/LockedFeature';

const InventoryManagement = () => {
  const { formatCurrency } = useCurrency();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { isDarkMode } = useDarkMode();
  const { hasFeature, loading: featuresLoading } = useFeatures();
  const { cafeSettings } = useCafeSettings();
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
      const response = await axios.get('/inventory/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching inventory categories:', error);
      // If no inventory categories exist yet, start with empty array
      setCategories([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const categoryToUse = formData.category === 'new' ? formData.newCategory : formData.category;
    
    if (!formData.name || !categoryToUse || !formData.quantity || !formData.unit) {
      toast.error('Fill in all required fields to continue');
      return;
    }

    try {
      const submitData = {
        ...formData,
        category: categoryToUse
      };
      
      if (editingItem) {
        await axios.put(`/inventory/${editingItem.id}`, submitData);
        toast.success('Changes saved');
      } else {
        await axios.post('/inventory', submitData);
        toast.success('Item added');
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
    const item = inventory.find(i => i.id === id);
    if (!window.confirm(`This will permanently remove "${item?.name || 'this item'}" from your inventory. This action cannot be undone. Continue?`)) {
      return;
    }

    try {
      await axios.delete(`/inventory/${id}`);
      toast.success('Item removed');
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
    if (quantity <= 0) return { 
      status: 'out', 
      color: isDarkMode ? 'text-red-400' : 'text-red-600', 
      bg: isDarkMode ? 'bg-red-900' : 'bg-red-50', 
      icon: AlertTriangle 
    };
    if (quantity <= reorderLevel) return { 
      status: 'low', 
      color: isDarkMode ? 'text-orange-400' : 'text-orange-600', 
      bg: isDarkMode ? 'bg-orange-900' : 'bg-orange-50', 
      icon: AlertTriangle 
    };
    return { 
      status: 'good', 
      color: isDarkMode ? 'text-green-400' : 'text-green-600', 
      bg: isDarkMode ? 'bg-green-900' : 'bg-green-50', 
      icon: Package 
    };
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
          src={cafeSettings.logo_url ? getImageUrl(cafeSettings.logo_url) : '/images/palm-cafe-logo.png'} 
          alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`} 
          className="h-12 w-12 mb-3"
        />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
        <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-secondary-600'}`}>Loading inventory...</p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Checking authentication...</p>
      </div>
    );
  }

  // Feature flag check
  if (featuresLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  if (!hasFeature('inventory')) {
    return (
      <LockedFeature 
        featureName="Inventory Management" 
        requiredPlan="Pro"
        description="Track stock levels, manage suppliers, set reorder points, and export inventory data. Keep your cafe well-stocked with automated alerts."
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <img 
          src={cafeSettings.logo_url ? getImageUrl(cafeSettings.logo_url) : '/images/palm-cafe-logo.png'} 
          alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`} 
          className="h-16 w-16 mb-4 opacity-50"
        />
        <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-secondary-700'}`}>Authentication Required</h2>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center mb-4`}>
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
          {cafeSettings.logo_url ? (
            <img 
              src={getImageUrl(cafeSettings.logo_url)} 
              alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`} 
              className="h-12 w-12 mr-4"
            />
          ) : (
            <div className="h-12 w-12 mr-4 bg-primary-600 rounded flex items-center justify-center text-white font-bold">
              {cafeSettings.cafe_name ? cafeSettings.cafe_name.charAt(0).toUpperCase() : 'C'}
            </div>
          )}
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-secondary-700'}`}>Inventory Management</h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Track stock levels, set reorder points, and manage suppliers</p>
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
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
              <Package className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Items</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{stats.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-900' : 'bg-orange-100'}`}>
              <AlertTriangle className={`h-6 w-6 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Low Stock</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{stats.lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-red-900' : 'bg-red-100'}`}>
              <AlertTriangle className={`h-6 w-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Out of Stock</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{stats.outOfStockItems}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900' : 'bg-green-100'}`}>
              <TrendingUp className={`h-6 w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Value</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Results */}
      {importResults && (
        <div className="card">
          <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Import Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{importResults.total}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{importResults.successful}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Failed</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {importResults.total > 0 ? Math.round((importResults.successful / importResults.total) * 100) : 0}%
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Success Rate</div>
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
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent ${
                isDarkMode 
                  ? '' 
                  : ''
              }`}
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
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category *</label>
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
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quantity *</label>
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
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Unit *</label>
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
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Cost per Unit</label>
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
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Reorder Level</label>
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
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Supplier</label>
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
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
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
          <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            <thead style={{ backgroundColor: 'var(--surface-table)' }}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ 
                  color: 'var(--color-on-surface-variant)',
                  borderBottom: '2px solid var(--color-outline)'
                }}>Item</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ 
                  color: 'var(--color-on-surface-variant)',
                  borderBottom: '2px solid var(--color-outline)'
                }}>Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ 
                  color: 'var(--color-on-surface-variant)',
                  borderBottom: '2px solid var(--color-outline)'
                }}>Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ 
                  color: 'var(--color-on-surface-variant)',
                  borderBottom: '2px solid var(--color-outline)'
                }}>Cost</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ 
                  color: 'var(--color-on-surface-variant)',
                  borderBottom: '2px solid var(--color-outline)'
                }}>Supplier</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ 
                  color: 'var(--color-on-surface-variant)',
                  borderBottom: '2px solid var(--color-outline)'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'var(--surface-card)' }}>
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item.quantity, item.reorder_level);
                const StatusIcon = stockStatus.icon;
                
                return (
                  <tr 
                    key={item.id} 
                    className="transition-surface"
                    style={{ borderBottom: '1px solid var(--color-outline-variant)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-table)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-card)';
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{item.name}</div>
                        {item.description && (
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        'transition-surface'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StatusIcon className={`h-4 w-4 mr-2 ${stockStatus.color}`} />
                        <div>
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {item.quantity} {item.unit}
                          </div>
                          {item.reorder_level && (
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Reorder at: {item.reorder_level} {item.unit}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {item.cost_per_unit ? formatCurrency(item.cost_per_unit) : '-'}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Total: {formatCurrency(item.quantity * (item.cost_per_unit || 0))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{item.supplier || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className={`mr-3 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-secondary-600 hover:text-secondary-900'}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}`}
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
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Package className={`h-12 w-12 mx-auto mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className="text-gray-600 dark:text-gray-400">Inventory items will appear here once you add them. Track stock levels, set reorder points, and manage suppliers for each item.</p>
            <p className="text-sm">Add your first inventory item to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManagement; 
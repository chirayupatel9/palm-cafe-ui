import React, { useState, useEffect, useRef } from 'react';
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
import Select from './ui/Select';
import Dialog from './ui/Dialog';
import { GlassButton } from './ui/GlassButton';

const InventoryManagement: React.FC = () => {
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
  const importInputRef = useRef(null);

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
      toast.error('Locked feature. Upgrade your plan to access.', { duration: 4000 });
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
  };

  const handleCloseEditModal = () => {
    setEditingItem(null);
    resetForm();
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
    const lowStockItems = inventory.filter(item =>
      (item.reorder_level != null && Number(item.reorder_level) > 0) &&
      item.quantity <= Number(item.reorder_level)
    ).length;
    const outOfStockItems = inventory.filter(item => item.quantity <= 0).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.cost_per_unit || 0)), 0);

    return { totalItems, lowStockItems, outOfStockItems, totalValue };
  };

  const stats = getInventoryStats();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <img 
          src={cafeSettings.logo_url ? getImageUrl(cafeSettings.logo_url) : getImageUrl('/images/palm-cafe-logo.png')} 
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
          src={cafeSettings.logo_url ? getImageUrl(cafeSettings.logo_url) : getImageUrl('/images/palm-cafe-logo.png')} 
          alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`} 
          className="h-16 w-16 mb-4 opacity-50"
        />
        <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-secondary-700'}`}>Authentication Required</h2>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center mb-4`}>
          You need to be logged in to access the inventory management system.
        </p>
        <GlassButton
          onClick={() => window.location.href = '/login'}
          size="default"
          className="glass-button-primary"
        >
          Go to Login
        </GlassButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Package className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[var(--color-on-surface)] truncate">Inventory Management</h1>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Track stock levels, set reorder points, and manage suppliers</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <GlassButton
            onClick={handleDownloadTemplate}
            size="sm"
            className="glass-button-secondary"
            contentClassName="flex items-center gap-2"
            title="Download Import Template"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Template
          </GlassButton>
          
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
            disabled={importing}
          />
          <GlassButton
            onClick={() => importInputRef.current?.click()}
            size="sm"
            className="glass-button-secondary"
            contentClassName="flex items-center gap-2"
            title="Import from Excel"
            disabled={importing}
          >
            {importing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {importing ? 'Importing...' : 'Import'}
          </GlassButton>
          
          <GlassButton
            onClick={handleExport}
            size="sm"
            className="glass-button-secondary"
            contentClassName="flex items-center gap-2"
            title="Export to Excel"
          >
            <Download className="h-4 w-4" />
            Export
          </GlassButton>
          
          <GlassButton
            onClick={() => {
              setShowAddForm(true);
              setEditingItem(null);
              resetForm();
            }}
            size="sm"
            className="glass-button-primary"
            contentClassName="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </GlassButton>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center">
            <div className="p-2 rounded-lg">
              <Package className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">Total Items</p>
              <p className="text-2xl font-bold text-[var(--color-on-surface)]">{stats.totalItems}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center">
            <div className="p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6" style={{ color: 'var(--color-warning)' }} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">Low Stock</p>
              <p className="text-2xl font-bold text-[var(--color-on-surface)]">{stats.lowStockItems}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center">
            <div className="p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6" style={{ color: 'var(--color-error)' }} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">Out of Stock</p>
              <p className="text-2xl font-bold text-[var(--color-on-surface)]">{stats.outOfStockItems}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center">
            <div className="p-2 rounded-lg">
              <TrendingUp className="h-6 w-6" style={{ color: 'var(--color-success)' }} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">Total Value</p>
              <p className="text-2xl font-bold text-[var(--color-on-surface)]">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Results */}
      {importResults && (
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-lg font-semibold mb-3 text-[var(--color-on-surface)]">Import Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{importResults.total}</div>
              <div className="text-sm text-[var(--color-on-surface-variant)]">Total Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{importResults.successful}</div>
              <div className="text-sm text-[var(--color-on-surface-variant)]">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
              <div className="text-sm text-[var(--color-on-surface-variant)]">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-on-surface)]">
                {importResults.total > 0 ? Math.round((importResults.successful / importResults.total) * 100) : 0}%
              </div>
              <div className="text-sm text-[var(--color-on-surface-variant)]">Success Rate</div>
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
          
          <GlassButton
            onClick={() => setImportResults(null)}
            size="default"
            className="mt-3 glass-button-secondary"
          >
            Close
          </GlassButton>
        </div>
      )}

      {/* Search and Filter */}
      <div className="glass-card p-4 rounded-2xl w-full relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
          <div className="flex-1 min-w-0">
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none text-[var(--color-on-surface-variant)]" aria-hidden />
              <input
                type="text"
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-12 h-11 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)]"
              />
            </div>
          </div>
          <div className="w-full sm:w-48 shrink-0 [&_.select-trigger-glass-hover]:h-11 [&_.select-trigger-glass-hover]:rounded-xl">
            <Select
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map(c => ({ value: c.name, label: c.name }))
              ]}
              value={filterCategory}
              onChange={setFilterCategory}
              placeholder="All Categories"
              className="select-trigger-glass select-trigger-glass-hover w-full rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Add Form - only when adding, not when editing (edit uses modal) */}
      {showAddForm && !editingItem && (
        <div className="glass-card p-5 rounded-2xl">
          <h2 className="text-lg font-semibold mb-4 text-[var(--color-on-surface)]">
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
                <Select
                  options={[
                    { value: '', label: 'Select Category' },
                    ...categories.map(c => ({ value: c.name, label: `${c.name} (${c.item_count} items)` })),
                    { value: 'new', label: '+ Add New Category' }
                  ]}
                  value={formData.category}
                  onChange={(v) => setFormData({ ...formData, category: v })}
                  placeholder="Select Category"
                />
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
                <Select
                  options={[
                    { value: '', label: 'Select Unit' },
                    { value: 'kg', label: 'Kilograms (kg)' },
                    { value: 'g', label: 'Grams (g)' },
                    { value: 'l', label: 'Liters (L)' },
                    { value: 'ml', label: 'Milliliters (ml)' },
                    { value: 'pcs', label: 'Pieces (pcs)' },
                    { value: 'boxes', label: 'Boxes' },
                    { value: 'bottles', label: 'Bottles' },
                    { value: 'cans', label: 'Cans' }
                  ]}
                  value={formData.unit}
                  onChange={(v) => setFormData({ ...formData, unit: v })}
                  placeholder="Select Unit"
                />
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
                rows={3}
                placeholder="Additional notes about this item"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <GlassButton
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                  resetForm();
                }}
                size="default"
                className="glass-button-secondary"
              >
                Cancel
              </GlassButton>
              <GlassButton type="submit" size="default" className="glass-button-primary">
                {editingItem ? 'Update Item' : 'Add Item'}
              </GlassButton>
            </div>
          </form>
        </div>
      )}

      {/* Inventory Table */}
      <div className="glass-card overflow-hidden rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[var(--surface-table)]/60 text-[var(--color-on-surface)]">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Item</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Cost</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Supplier</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-outline)]/30">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item.quantity, item.reorder_level);
                const StatusIcon = stockStatus.icon;
                
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-[var(--surface-table)]/50 transition-colors ${editingItem?.id === item.id ? 'bg-[var(--surface-table)]/40' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-[var(--color-on-surface)]">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-[var(--color-on-surface-variant)]">{item.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-[var(--color-on-surface)]">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StatusIcon className={`h-4 w-4 mr-2 ${stockStatus.color}`} />
                        <div>
                          <div className="text-sm font-medium text-[var(--color-on-surface)]">
                            {item.quantity} {item.unit}
                          </div>
                          {item.reorder_level && (
                            <div className="text-xs text-[var(--color-on-surface-variant)]">
                              Reorder at: {item.reorder_level} {item.unit}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--color-on-surface)]">
                        {item.cost_per_unit ? formatCurrency(item.cost_per_unit) : '-'}
                      </div>
                      <div className="text-xs text-[var(--color-on-surface-variant)]">
                        Total: {formatCurrency(item.quantity * (item.cost_per_unit || 0))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--color-on-surface)]">{item.supplier || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1.5">
                        <GlassButton
                          onClick={() => handleEdit(item)}
                          size="icon"
                          className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </GlassButton>
                        <GlassButton
                          onClick={() => handleDelete(item.id)}
                          size="icon"
                          className="glass-button-destructive [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </GlassButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredInventory.length === 0 && (
          <div className="text-center py-8 text-[var(--color-on-surface-variant)]">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-60" />
            <p>Inventory items will appear here once you add them. Track stock levels, set reorder points, and manage suppliers for each item.</p>
            <p className="text-sm mt-1">Add your first inventory item to get started</p>
          </div>
        )}
      </div>

      {/* Edit Inventory Item Modal - same pattern as menu item edit */}
      <Dialog
        open={!!editingItem}
        onClose={handleCloseEditModal}
        title={editingItem ? `Edit: ${formData.name || 'Inventory Item'}` : 'Edit Inventory Item'}
        size="2xl"
      >
        {editingItem && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category *</label>
                <Select
                  options={[
                    { value: '', label: 'Select Category' },
                    ...categories.map(c => ({ value: c.name, label: `${c.name} (${c.item_count} items)` })),
                    { value: 'new', label: '+ Add New Category' }
                  ]}
                  value={formData.category}
                  onChange={(v) => setFormData({ ...formData, category: v })}
                  placeholder="Select Category"
                />
                {formData.category === 'new' && (
                  <input
                    type="text"
                    value={formData.newCategory}
                    onChange={(e) => setFormData({ ...formData, newCategory: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="input-field"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Unit *</label>
                <Select
                  options={[
                    { value: '', label: 'Select Unit' },
                    { value: 'kg', label: 'Kilograms (kg)' },
                    { value: 'g', label: 'Grams (g)' },
                    { value: 'l', label: 'Liters (L)' },
                    { value: 'ml', label: 'Milliliters (ml)' },
                    { value: 'pcs', label: 'Pieces (pcs)' },
                    { value: 'boxes', label: 'Boxes' },
                    { value: 'bottles', label: 'Bottles' },
                    { value: 'cans', label: 'Cans' }
                  ]}
                  value={formData.unit}
                  onChange={(v) => setFormData({ ...formData, unit: v })}
                  placeholder="Select Unit"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Cost per Unit</label>
                <input
                  type="number"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                  className="input-field"
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="input-field"
                  placeholder="Supplier name"
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Additional notes about this item"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--color-outline)]">
              <GlassButton type="button" onClick={handleCloseEditModal} size="default" className="glass-button-secondary">
                Cancel
              </GlassButton>
              <GlassButton type="submit" size="default" className="glass-button-primary">
                Save
              </GlassButton>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
};

export default InventoryManagement; 
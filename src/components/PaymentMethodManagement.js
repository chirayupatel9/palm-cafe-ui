import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowUp, ArrowDown, DollarSign, Globe, Flag, CreditCard, Calendar, Calculator, Percent } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';

const PaymentMethodManagement = () => {
  const [activeTab, setActiveTab] = useState('payment-methods');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    icon: '',
    display_order: 0,
    is_active: true
  });

  // Currency settings state
  const [currentCurrencySettings, setCurrentCurrencySettings] = useState(null);
  const [currencyHistory, setCurrencyHistory] = useState([]);
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [isEditingCurrency, setIsEditingCurrency] = useState(false);
  const [currencyFormData, setCurrencyFormData] = useState({
    currency_code: '',
    currency_symbol: '',
    currency_name: ''
  });
  const [currencyLoading, setCurrencyLoading] = useState(true);
  const [currencyError, setCurrencyError] = useState('');
  const { fetchCurrencySettings } = useCurrency();

  // Tax settings state
  const [currentTaxSettings, setCurrentTaxSettings] = useState(null);
  const [taxHistory, setTaxHistory] = useState([]);
  const [isEditingTax, setIsEditingTax] = useState(false);
  const [taxFormData, setTaxFormData] = useState({
    tax_rate: '',
    tax_name: '',
    show_tax_in_menu: true,
    include_tax: true
  });
  const [taxLoading, setTaxLoading] = useState(true);
  const [taxError, setTaxError] = useState('');

  useEffect(() => {
    fetchPaymentMethods();
    fetchCurrentCurrencySettings();
    fetchCurrencyHistory();
    fetchAvailableCurrencies();
    fetchCurrentTaxSettings();
    fetchTaxHistory();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/payment-methods');
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await axios.put(`/admin/payment-methods/${editingId}`, formData);
        toast.success('Payment method updated successfully');
      } else {
        await axios.post('/admin/payment-methods', formData);
        toast.success('Payment method created successfully');
      }
      
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error(error.response?.data?.error || 'Failed to save payment method');
    }
  };

  const handleEdit = (method) => {
    setEditingId(method.id);
    setFormData({
      name: method.name,
      code: method.code,
      description: method.description || '',
      icon: method.icon || '',
      display_order: method.display_order,
      is_active: method.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      await axios.delete(`/admin/payment-methods/${id}`);
      toast.success('Payment method deleted successfully');
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.patch(`/admin/payment-methods/${id}/toggle`);
      toast.success('Payment method status updated');
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error toggling payment method status:', error);
      toast.error('Failed to update payment method status');
    }
  };

  const handleReorder = async (id, direction) => {
    try {
      const currentIndex = paymentMethods.findIndex(m => m.id === id);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex < 0 || newIndex >= paymentMethods.length) {
        return;
      }

      const orderedIds = paymentMethods.map(m => m.id);
      [orderedIds[currentIndex], orderedIds[newIndex]] = [orderedIds[newIndex], orderedIds[currentIndex]];
      
      await axios.post('/admin/payment-methods/reorder', { orderedIds });
      toast.success('Payment methods reordered successfully');
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error reordering payment methods:', error);
      toast.error('Failed to reorder payment methods');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      icon: '',
      display_order: 0,
      is_active: true
    });
  };

  const cancelEdit = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  // Currency Settings Functions
  const fetchCurrentCurrencySettings = async () => {
    try {
      const response = await axios.get('/currency-settings');
      setCurrentCurrencySettings(response.data);
    } catch (error) {
      setCurrencyError('Failed to load currency settings');
      console.error('Error fetching currency settings:', error);
    } finally {
      setCurrencyLoading(false);
    }
  };

  const fetchCurrencyHistory = async () => {
    try {
      const response = await axios.get('/currency-settings/history');
      setCurrencyHistory(response.data);
    } catch (error) {
      console.error('Error fetching currency history:', error);
    }
  };

  const fetchAvailableCurrencies = async () => {
    try {
      const response = await axios.get('/currency-settings/available');
      setAvailableCurrencies(response.data);
    } catch (error) {
      console.error('Error fetching available currencies:', error);
    }
  };

  const handleCurrencyEdit = () => {
    setCurrencyFormData({
      currency_code: currentCurrencySettings.currency_code,
      currency_symbol: currentCurrencySettings.currency_symbol,
      currency_name: currentCurrencySettings.currency_name
    });
    setIsEditingCurrency(true);
  };

  const handleCurrencyCancel = () => {
    setIsEditingCurrency(false);
    setCurrencyFormData({ currency_code: '', currency_symbol: '', currency_name: '' });
  };

  const handleCurrencySubmit = async (e) => {
    e.preventDefault();
    
    if (!currencyFormData.currency_code || !currencyFormData.currency_symbol || !currencyFormData.currency_name) {
      setCurrencyError('Please fill in all fields');
      return;
    }

    try {
      setCurrencyLoading(true);
      const response = await axios.put('/currency-settings', {
        currency_code: currencyFormData.currency_code,
        currency_symbol: currencyFormData.currency_symbol,
        currency_name: currencyFormData.currency_name
      });
      
      setCurrentCurrencySettings(response.data);
      setIsEditingCurrency(false);
      setCurrencyFormData({ currency_code: '', currency_symbol: '', currency_name: '' });
      setCurrencyError('');
      fetchCurrencySettings(); // update context and UI everywhere
      fetchCurrencyHistory();
      toast.success('Currency settings updated successfully');
    } catch (error) {
      setCurrencyError('Failed to update currency settings');
      console.error('Error updating currency settings:', error);
      toast.error('Failed to update currency settings');
    } finally {
      setCurrencyLoading(false);
    }
  };

  const handleCurrencyInputChange = (e) => {
    const { name, value } = e.target;
    setCurrencyFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCurrencySelect = (currency) => {
    setCurrencyFormData({
      currency_code: currency.code,
      currency_symbol: currency.symbol,
      currency_name: currency.name
    });
  };

  // Tax Settings Functions
  const fetchCurrentTaxSettings = async () => {
    try {
      const response = await axios.get('/tax-settings');
      setCurrentTaxSettings(response.data);
    } catch (error) {
      setTaxError('Failed to load tax settings');
      console.error('Error fetching tax settings:', error);
    } finally {
      setTaxLoading(false);
    }
  };

  const fetchTaxHistory = async () => {
    try {
      const response = await axios.get('/tax-settings/history');
      setTaxHistory(response.data);
    } catch (error) {
      console.error('Error fetching tax history:', error);
    }
  };

  const handleTaxEdit = () => {
    setTaxFormData({
      tax_rate: currentTaxSettings.tax_rate.toString(),
      tax_name: currentTaxSettings.tax_name,
      show_tax_in_menu: currentTaxSettings.show_tax_in_menu,
      include_tax: currentTaxSettings.include_tax
    });
    setIsEditingTax(true);
  };

  const handleTaxCancel = () => {
    setIsEditingTax(false);
    setTaxFormData({ tax_rate: '', tax_name: '', show_tax_in_menu: true, include_tax: true });
  };

  const handleTaxSubmit = async (e) => {
    e.preventDefault();
    
    if (!taxFormData.tax_rate || !taxFormData.tax_name) {
      setTaxError('Please fill in all fields');
      return;
    }

    const taxRate = parseFloat(taxFormData.tax_rate);
    if (isNaN(taxRate) || taxRate < 0) {
      setTaxError('Tax rate must be a valid positive number');
      return;
    }

    try {
      setTaxLoading(true);
      const response = await axios.put('/tax-settings', {
        tax_rate: taxRate,
        tax_name: taxFormData.tax_name.trim(),
        show_tax_in_menu: taxFormData.show_tax_in_menu,
        include_tax: taxFormData.include_tax
      });
      
      setCurrentTaxSettings(response.data);
      setIsEditingTax(false);
      setTaxFormData({ tax_rate: '', tax_name: '', show_tax_in_menu: true, include_tax: true });
      setTaxError('');
      
      // Refresh history
      fetchTaxHistory();
      toast.success('Tax settings updated successfully');
    } catch (error) {
      setTaxError('Failed to update tax settings');
      console.error('Error updating tax settings:', error);
      toast.error('Failed to update tax settings');
    } finally {
      setTaxLoading(false);
    }
  };

  const handleTaxInputChange = (e) => {
    const { name, value } = e.target;
    setTaxFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
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
            Payment, Currency & Tax Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage payment methods, currency settings, and tax rates
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('payment-methods')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payment-methods'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Methods
            </div>
          </button>
          <button
            onClick={() => setActiveTab('currency-settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'currency-settings'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Currency Settings
            </div>
          </button>
          <button
            onClick={() => setActiveTab('tax-settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tax-settings'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Calculator className="h-4 w-4 mr-2" />
              Tax Settings
            </div>
          </button>
        </nav>
      </div>

      {/* Payment Methods Tab */}
      {activeTab === 'payment-methods' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-secondary-700 dark:text-secondary-300">
                Payment Methods
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Manage payment methods for customer orders
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </button>
          </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300">
              {editingId ? 'Edit Payment Method' : 'Add Payment Method'}
            </h3>
            <button
              onClick={cancelEdit}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  required
                  disabled={editingId} // Code cannot be changed after creation
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="💵"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                rows="3"
                placeholder="Brief description of the payment method"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-secondary-500 focus:ring-secondary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Methods List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paymentMethods.map((method, index) => (
                <tr key={method.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleReorder(method.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <span className="font-medium">{method.display_order}</span>
                      <button
                        onClick={() => handleReorder(method.id, 'down')}
                        disabled={index === paymentMethods.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{method.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-300">
                          {method.name}
                        </div>
                        {method.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {method.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                      {method.code}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        method.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {method.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(method.id)}
                        className={`px-2 py-1 text-xs rounded ${
                          method.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {method.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEdit(method)}
                        className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(method.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      )}

      {/* Currency Settings Tab */}
      {activeTab === 'currency-settings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-secondary-700 dark:text-secondary-300">
                Currency Settings
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Manage currency display and formatting
              </p>
            </div>
          </div>

          {/* Current Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300">
                Current Currency Settings
              </h4>
              {!isEditingCurrency && (
                <button
                  onClick={handleCurrencyEdit}
                  className="bg-secondary-500 text-white px-3 py-1 rounded-lg hover:bg-secondary-600 transition-colors flex items-center text-sm"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
              )}
            </div>

            {currencyError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{currencyError}</p>
              </div>
            )}

            {isEditingCurrency ? (
              <form onSubmit={handleCurrencySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Currency Code *
                    </label>
                    <input
                      type="text"
                      name="currency_code"
                      value={currencyFormData.currency_code}
                      onChange={handleCurrencyInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      required
                      placeholder="INR"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Currency Symbol *
                    </label>
                    <input
                      type="text"
                      name="currency_symbol"
                      value={currencyFormData.currency_symbol}
                      onChange={handleCurrencyInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      required
                      placeholder="₹"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Currency Name *
                    </label>
                    <input
                      type="text"
                      name="currency_name"
                      value={currencyFormData.currency_name}
                      onChange={handleCurrencyInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      required
                      placeholder="Indian Rupee"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="submit"
                    disabled={currencyLoading}
                    className="bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600 transition-colors disabled:opacity-50 flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {currencyLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCurrencyCancel}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-warm-50 to-warm-100 dark:from-warm-900/30 dark:to-warm-800/20 p-6 rounded-xl border border-warm-200 dark:border-warm-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-secondary-100 dark:bg-secondary-800/50 rounded-lg mr-3">
                      <Flag className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                    </div>
                    <h5 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wide">Currency Code</h5>
                  </div>
                  <p className="text-xl font-bold text-secondary-800 dark:text-secondary-200">
                    {currentCurrencySettings?.currency_code || 'Not set'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-warm-50 to-warm-100 dark:from-warm-900/30 dark:to-warm-800/20 p-6 rounded-xl border border-warm-200 dark:border-warm-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-secondary-100 dark:bg-secondary-800/50 rounded-lg mr-3">
                      <DollarSign className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                    </div>
                    <h5 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wide">Currency Symbol</h5>
                  </div>
                  <p className="text-xl font-bold text-secondary-800 dark:text-secondary-200">
                    {currentCurrencySettings?.currency_symbol || 'Not set'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-warm-50 to-warm-100 dark:from-warm-900/30 dark:to-warm-800/20 p-6 rounded-xl border border-warm-200 dark:border-warm-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-secondary-100 dark:bg-secondary-800/50 rounded-lg mr-3">
                      <Globe className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                    </div>
                    <h5 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wide">Currency Name</h5>
                  </div>
                  <p className="text-xl font-bold text-secondary-800 dark:text-secondary-200">
                    {currentCurrencySettings?.currency_name || 'Not set'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Currency History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Currency History
            </h4>
            
            {currencyHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No currency history available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Currency Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Currency Symbol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Currency Name
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currencyHistory.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {new Date(record.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            {record.currency_code}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {record.currency_symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {record.currency_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tax Settings Tab */}
      {activeTab === 'tax-settings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-secondary-700 dark:text-secondary-300">
                Tax Settings
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Manage tax rates and settings for your cafe
              </p>
            </div>
          </div>

          {taxError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {taxError}
            </div>
          )}

          {/* Current Tax Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
              <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300">Current Tax Settings</h3>
              {!isEditingTax && (
                <button
                  onClick={handleTaxEdit}
                  className="btn-primary flex items-center justify-center text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Settings
                </button>
              )}
            </div>

            {isEditingTax ? (
              <form onSubmit={handleTaxSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Tax Name
                  </label>
                  <input
                    type="text"
                    name="tax_name"
                    value={taxFormData.tax_name}
                    onChange={handleTaxInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="e.g., Sales Tax, VAT"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    name="tax_rate"
                    value={taxFormData.tax_rate}
                    onChange={handleTaxInputChange}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="e.g., 8.5"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show_tax_in_menu"
                    name="show_tax_in_menu"
                    checked={taxFormData.show_tax_in_menu}
                    onChange={(e) => setTaxFormData(prev => ({ ...prev, show_tax_in_menu: e.target.checked }))}
                    className="h-4 w-4 text-secondary-500 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="show_tax_in_menu" className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                    Show tax rate on customer ordering page
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="include_tax"
                    name="include_tax"
                    checked={taxFormData.include_tax}
                    onChange={(e) => setTaxFormData(prev => ({ ...prev, include_tax: e.target.checked }))}
                    className="h-4 w-4 text-secondary-500 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="include_tax" className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                    Include tax in order calculations
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="submit"
                    disabled={taxLoading}
                    className="btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {taxLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTaxCancel}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-warm-50 to-warm-100 dark:from-warm-900/30 dark:to-warm-800/20 p-6 rounded-xl border border-warm-200 dark:border-warm-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-secondary-100 dark:bg-secondary-800/50 rounded-lg mr-3">
                      <Calculator className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                    </div>
                    <h5 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wide">Tax Name</h5>
                  </div>
                  <p className="text-xl font-bold text-secondary-800 dark:text-secondary-200">
                    {currentTaxSettings?.tax_name || 'Not set'}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-warm-50 to-warm-100 dark:from-warm-900/30 dark:to-warm-800/20 p-6 rounded-xl border border-warm-200 dark:border-warm-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-secondary-100 dark:bg-secondary-800/50 rounded-lg mr-3">
                      <Percent className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                    </div>
                    <h5 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wide">Tax Rate</h5>
                  </div>
                  <p className="text-xl font-bold text-secondary-800 dark:text-secondary-200">
                    {currentTaxSettings?.tax_rate ? `${currentTaxSettings.tax_rate}%` : '0%'}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-warm-50 to-warm-100 dark:from-warm-900/30 dark:to-warm-800/20 p-6 rounded-xl border border-warm-200 dark:border-warm-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-secondary-100 dark:bg-secondary-800/50 rounded-lg mr-3">
                      <Calculator className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                    </div>
                    <h5 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wide">Customer Display</h5>
                  </div>
                  <p className="text-xl font-bold text-secondary-800 dark:text-secondary-200">
                    {currentTaxSettings?.show_tax_in_menu ? 'Tax Rate Visible' : 'Tax Rate Hidden'}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-warm-50 to-warm-100 dark:from-warm-900/30 dark:to-warm-800/20 p-6 rounded-xl border border-warm-200 dark:border-warm-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-secondary-100 dark:bg-secondary-800/50 rounded-lg mr-3">
                      <Calculator className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                    </div>
                    <h5 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wide">Tax Calculation</h5>
                  </div>
                  <p className="text-xl font-bold text-secondary-800 dark:text-secondary-200">
                    {currentTaxSettings?.include_tax ? 'Tax Included' : 'Tax Excluded'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tax History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Tax History
            </h4>
            
            {taxHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tax history available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tax Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tax Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tax Calculation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {taxHistory.map((setting) => (
                      <tr key={setting.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {new Date(setting.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {setting.tax_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {setting.tax_rate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            setting.include_tax 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {setting.include_tax ? 'Included' : 'Excluded'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            setting.is_active 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                              : 'bg-accent-100 dark:bg-accent-900/30 text-accent-800 dark:text-accent-300'
                          }`}>
                            {setting.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


export default PaymentMethodManagement; 
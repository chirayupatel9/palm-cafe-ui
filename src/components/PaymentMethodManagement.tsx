import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowUp, ArrowDown, DollarSign, Globe, Flag, CreditCard, Calendar, Calculator, Percent } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { GlassButton } from './ui/GlassButton';

const PaymentMethodManagement: React.FC = () => {
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
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('payment-methods')}
          className={`flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl font-semibold text-sm ${activeTab === 'payment-methods' ? 'glass-option-btn-selected' : 'glass-option-btn'}`}
        >
          <CreditCard className="h-4 w-4 shrink-0" />
          Payment Methods
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('currency-settings')}
          className={`flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl font-semibold text-sm ${activeTab === 'currency-settings' ? 'glass-option-btn-selected' : 'glass-option-btn'}`}
        >
          <DollarSign className="h-4 w-4 shrink-0" />
          Currency Settings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tax-settings')}
          className={`flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl font-semibold text-sm ${activeTab === 'tax-settings' ? 'glass-option-btn-selected' : 'glass-option-btn'}`}
        >
          <Calculator className="h-4 w-4 shrink-0" />
          Tax Settings
        </button>
      </div>

      {/* Payment Methods Tab */}
      {activeTab === 'payment-methods' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-on-surface)]">
                Payment Methods
              </h3>
              <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">
                Manage payment methods for customer orders
              </p>
            </div>
            <GlassButton
              type="button"
              onClick={() => setShowForm(true)}
              size="default"
              className="glass-button-primary shrink-0"
              contentClassName="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Payment Method
            </GlassButton>
          </div>

          {/* Form */}
          {showForm && (
            <div className="glass-card rounded-2xl overflow-hidden p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[var(--color-on-surface)] font-semibold">
                  {editingId ? 'Edit Payment Method' : 'Add Payment Method'}
                </h4>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="p-1.5 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--surface-table)]/60 hover:text-[var(--color-on-surface)]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Code *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                      className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] px-4 py-2.5 disabled:opacity-60"
                      required
                      disabled={!!editingId}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Icon</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5"
                      placeholder="💵"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Display Order</label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] px-4 py-2.5"
                      min={0}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 min-h-[80px]"
                    rows={3}
                    placeholder="Brief description of the payment method"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-[var(--color-outline)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-sm text-[var(--color-on-surface)]">Active</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-2">
                  <GlassButton type="button" onClick={cancelEdit} size="default" className="glass-button-secondary" contentClassName="inline-flex items-center gap-2">
                    Cancel
                  </GlassButton>
                  <GlassButton type="submit" size="default" className="glass-button-primary" contentClassName="inline-flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {editingId ? 'Update' : 'Create'}
                  </GlassButton>
                </div>
              </form>
            </div>
          )}

          {/* Payment Methods List */}
          <div className="glass-card overflow-hidden rounded-2xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-[var(--surface-table)]/60 text-[var(--color-on-surface)]">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Order</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Payment Method</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Code</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-outline)]/30">
                  {paymentMethods.map((method, index) => (
                    <tr key={method.id} className="hover:bg-[var(--surface-table)]/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleReorder(method.id, 'up')}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--surface-table)]/60 hover:text-[var(--color-on-surface)] disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-medium text-[var(--color-on-surface)] w-6 text-center tabular-nums">{method.display_order}</span>
                          <button
                            type="button"
                            onClick={() => handleReorder(method.id, 'down')}
                            disabled={index === paymentMethods.length - 1}
                            className="p-1.5 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--surface-table)]/60 hover:text-[var(--color-on-surface)] disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Move down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {method.icon && <span className="text-lg mr-2">{method.icon}</span>}
                          <div>
                            <div className="text-sm font-medium text-[var(--color-on-surface)]">{method.name}</div>
                            {method.description && (
                              <div className="text-sm text-[var(--color-on-surface-variant)]">{method.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--surface-table)]/80 text-[var(--color-on-surface)]">
                          {method.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            method.is_active
                              ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                              : 'bg-[var(--color-error)]/15 text-[var(--color-error)]'
                          }`}
                        >
                          {method.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(method.id)}
                            className={`text-xs font-medium px-2 py-1 rounded-lg ${
                              method.is_active
                                ? 'text-[var(--color-error)] hover:bg-[var(--color-error)]/10'
                                : 'text-[var(--color-success)] hover:bg-[var(--color-success)]/10'
                            }`}
                          >
                            {method.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(method)}
                            className="p-1.5 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--surface-table)]/60 hover:text-[var(--color-primary)] transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(method.id)}
                            className="p-1.5 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] transition-colors"
                            title="Delete"
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
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-on-surface)]">Currency Settings</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">Manage currency display and formatting</p>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[var(--color-on-surface)] font-semibold">Current Currency Settings</h4>
              {!isEditingCurrency && (
                <GlassButton type="button" onClick={handleCurrencyEdit} size="sm" className="glass-button-primary" contentClassName="inline-flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </GlassButton>
              )}
            </div>

            {currencyError && (
              <div className="p-3 rounded-xl border" style={{ backgroundColor: 'color-mix(in srgb, var(--color-error) 12%, transparent)', borderColor: 'var(--color-error)' }}>
                <p className="text-sm" style={{ color: 'var(--color-error)' }}>{currencyError}</p>
              </div>
            )}

            {isEditingCurrency ? (
              <form onSubmit={handleCurrencySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Currency Code *</label>
                    <input
                      type="text"
                      name="currency_code"
                      value={currencyFormData.currency_code}
                      onChange={handleCurrencyInputChange}
                      className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5"
                      required
                      placeholder="INR"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Currency Symbol *</label>
                    <input
                      type="text"
                      name="currency_symbol"
                      value={currencyFormData.currency_symbol}
                      onChange={handleCurrencyInputChange}
                      className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5"
                      required
                      placeholder="₹"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Currency Name *</label>
                    <input
                      type="text"
                      name="currency_name"
                      value={currencyFormData.currency_name}
                      onChange={handleCurrencyInputChange}
                      className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5"
                      required
                      placeholder="Indian Rupee"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <GlassButton type="submit" disabled={currencyLoading} size="default" className="glass-button-primary disabled:opacity-50" contentClassName="inline-flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {currencyLoading ? 'Saving...' : 'Save Changes'}
                  </GlassButton>
                  <GlassButton type="button" onClick={handleCurrencyCancel} size="default" className="glass-button-secondary" contentClassName="inline-flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </GlassButton>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-[var(--color-outline)]/30 bg-[var(--surface-table)]/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-[var(--color-primary-container)]">
                      <Flag className="h-4 w-4 text-[var(--color-primary)]" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-on-surface-variant)]">Currency Code</span>
                  </div>
                  <p className="text-lg font-semibold text-[var(--color-on-surface)]">{currentCurrencySettings?.currency_code || 'Not set'}</p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--color-outline)]/30 bg-[var(--surface-table)]/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-[var(--color-primary-container)]">
                      <DollarSign className="h-4 w-4 text-[var(--color-primary)]" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-on-surface-variant)]">Currency Symbol</span>
                  </div>
                  <p className="text-lg font-semibold text-[var(--color-on-surface)]">{currentCurrencySettings?.currency_symbol || 'Not set'}</p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--color-outline)]/30 bg-[var(--surface-table)]/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-[var(--color-primary-container)]">
                      <Globe className="h-4 w-4 text-[var(--color-primary)]" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-on-surface-variant)]">Currency Name</span>
                  </div>
                  <p className="text-lg font-semibold text-[var(--color-on-surface)]">{currentCurrencySettings?.currency_name || 'Not set'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl overflow-hidden p-5">
            <h4 className="text-[var(--color-on-surface)] font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[var(--color-on-surface-variant)]" />
              Currency History
            </h4>
            {currencyHistory.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-on-surface-variant)]">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No currency history available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-[var(--surface-table)]/60 text-[var(--color-on-surface)]">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Currency Code</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Currency Symbol</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Currency Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-outline)]/30">
                    {currencyHistory.map((record, index) => (
                      <tr key={index} className="hover:bg-[var(--surface-table)]/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-on-surface)]">{new Date(record.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><code className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[var(--surface-table)]/80 text-[var(--color-on-surface)]">{record.currency_code}</code></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-on-surface)]">{record.currency_symbol}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-on-surface)]">{record.currency_name}</td>
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
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-on-surface)]">Tax Settings</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">Manage tax rates and settings for your cafe</p>
          </div>

          {taxError && (
            <div className="p-3 rounded-xl border" style={{ backgroundColor: 'color-mix(in srgb, var(--color-error) 12%, transparent)', borderColor: 'var(--color-error)' }}>
              <p className="text-sm" style={{ color: 'var(--color-error)' }}>{taxError}</p>
            </div>
          )}

          <div className="glass-card rounded-2xl overflow-hidden p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <h4 className="text-[var(--color-on-surface)] font-semibold">Current Tax Settings</h4>
              {!isEditingTax && (
                <GlassButton type="button" onClick={handleTaxEdit} size="sm" className="glass-button-primary" contentClassName="inline-flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Settings
                </GlassButton>
              )}
            </div>

            {isEditingTax ? (
              <form onSubmit={handleTaxSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Tax Name</label>
                  <input
                    type="text"
                    name="tax_name"
                    value={taxFormData.tax_name}
                    onChange={handleTaxInputChange}
                    className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5"
                    placeholder="e.g., Sales Tax, VAT"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Tax Rate (%)</label>
                  <input
                    type="number"
                    name="tax_rate"
                    value={taxFormData.tax_rate}
                    onChange={handleTaxInputChange}
                    step="0.01"
                    min={0}
                    max={100}
                    className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5"
                    placeholder="e.g., 8.5"
                    required
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="show_tax_in_menu"
                    name="show_tax_in_menu"
                    checked={taxFormData.show_tax_in_menu}
                    onChange={(e) => setTaxFormData(prev => ({ ...prev, show_tax_in_menu: e.target.checked }))}
                    className="rounded border-[var(--color-outline)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-sm text-[var(--color-on-surface)]">Show tax rate on customer ordering page</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="include_tax"
                    name="include_tax"
                    checked={taxFormData.include_tax}
                    onChange={(e) => setTaxFormData(prev => ({ ...prev, include_tax: e.target.checked }))}
                    className="rounded border-[var(--color-outline)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-sm text-[var(--color-on-surface)]">Include tax in order calculations</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-2">
                  <GlassButton type="submit" disabled={taxLoading} size="default" className="glass-button-primary disabled:opacity-50" contentClassName="inline-flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {taxLoading ? 'Saving...' : 'Save Changes'}
                  </GlassButton>
                  <GlassButton type="button" onClick={handleTaxCancel} size="default" className="glass-button-secondary" contentClassName="inline-flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </GlassButton>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-[var(--color-outline)]/30 bg-[var(--surface-table)]/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-[var(--color-primary-container)]">
                      <Calculator className="h-4 w-4 text-[var(--color-primary)]" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-on-surface-variant)]">Tax Name</span>
                  </div>
                  <p className="text-lg font-semibold text-[var(--color-on-surface)]">{currentTaxSettings?.tax_name || 'Not set'}</p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--color-outline)]/30 bg-[var(--surface-table)]/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-[var(--color-primary-container)]">
                      <Percent className="h-4 w-4 text-[var(--color-primary)]" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-on-surface-variant)]">Tax Rate</span>
                  </div>
                  <p className="text-lg font-semibold text-[var(--color-on-surface)]">{currentTaxSettings?.tax_rate ? `${currentTaxSettings.tax_rate}%` : '0%'}</p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--color-outline)]/30 bg-[var(--surface-table)]/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-[var(--color-primary-container)]">
                      <Calculator className="h-4 w-4 text-[var(--color-primary)]" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-on-surface-variant)]">Customer Display</span>
                  </div>
                  <p className="text-lg font-semibold text-[var(--color-on-surface)]">{currentTaxSettings?.show_tax_in_menu ? 'Tax Rate Visible' : 'Tax Rate Hidden'}</p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--color-outline)]/30 bg-[var(--surface-table)]/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-[var(--color-primary-container)]">
                      <Calculator className="h-4 w-4 text-[var(--color-primary)]" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-on-surface-variant)]">Tax Calculation</span>
                  </div>
                  <p className="text-lg font-semibold text-[var(--color-on-surface)]">{currentTaxSettings?.include_tax ? 'Tax Included' : 'Tax Excluded'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl overflow-hidden p-5">
            <h4 className="text-[var(--color-on-surface)] font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[var(--color-on-surface-variant)]" />
              Tax History
            </h4>
            {taxHistory.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-on-surface-variant)]">
                <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tax history available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-[var(--surface-table)]/60 text-[var(--color-on-surface)]">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Tax Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Tax Rate</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Tax Calculation</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-outline)]/30">
                    {taxHistory.map((setting) => (
                      <tr key={setting.id} className="hover:bg-[var(--surface-table)]/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-on-surface)]">{new Date(setting.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-on-surface)]">{setting.tax_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-on-surface)]">{setting.tax_rate}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${setting.include_tax ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]' : 'bg-[var(--color-error)]/15 text-[var(--color-error)]'}`}>
                            {setting.include_tax ? 'Included' : 'Excluded'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${setting.is_active ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]' : 'bg-[var(--color-outline)]/30 text-[var(--color-on-surface-variant)]'}`}>
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
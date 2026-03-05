import React, { useState, useEffect } from 'react';
import { Download, Calendar, User, DollarSign, Percent, Heart, BarChart3, Plus, ShoppingCart, FileText } from 'lucide-react';
import Dialog from './ui/Dialog';
import { GlassButton } from './ui/GlassButton';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { getImageUrl } from '../utils/imageUtils';
import DailyReports from './DailyReports';

interface InvoiceHistoryProps {
  cart: any[];
  setCart: React.Dispatch<React.SetStateAction<any[]>>;
  setCurrentPage?: (page: string) => void;
}

const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({ cart, setCart, setCurrentPage }) => {
  const { formatCurrency, currencySettings } = useCurrency();
  const { cafeSettings } = useCafeSettings();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' or 'invoices'
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);

  // Pagination states
  const [displayedInvoices, setDisplayedInvoices] = useState<any[]>([]);
  const [itemsPerPage] = useState(10);
  const [currentPage, setCurrentPageLocal] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInvoices();
    fetchStatistics();
  }, []);

  // Update displayed invoices when invoices change
  useEffect(() => {
    // Filter invoices based on search query
    const filteredInvoices = invoices.filter(invoice => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      const invoiceNumber = getInvoiceNumber(invoice).toLowerCase();
      const orderNumber = (invoice.order_number || '').toLowerCase();
      const customerName = (invoice.customer_name || '').toLowerCase();
      const customerPhone = (invoice.customer_phone || '').toLowerCase();
      
      return invoiceNumber.includes(query) ||
             orderNumber.includes(query) ||
             customerName.includes(query) ||
             customerPhone.includes(query);
    });

    // Sort by created_at (newest first)
    const sortedInvoices = filteredInvoices.sort((a, b) => {
      const dateA = new Date((a.created_at as string | number) || 0);
      const dateB = new Date((b.created_at as string | number) || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Show first 10 items initially
    const initialDisplay = sortedInvoices.slice(0, itemsPerPage);
    setDisplayedInvoices(initialDisplay);
    setCurrentPageLocal(1);
    setHasMore(sortedInvoices.length > itemsPerPage);
  }, [invoices, itemsPerPage, searchQuery]);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoice history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const openInvoice = async (invoiceNumber) => {
    if (!invoiceNumber || String(invoiceNumber).toLowerCase() === 'unknown') {
      toast.error('Invalid invoice number');
      return;
    }
    
    try {
      const response = await axios.get(`/invoices/${invoiceNumber}/download`);
      
      // Create blob and open PDF in new tab
      const pdfBlob = new Blob([Uint8Array.from(atob(response.data.pdf), c => c.charCodeAt(0))], {
        type: 'application/pdf'
      });
      
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      // Clean up the URL object after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
      
      toast.success('Invoice opened in new tab');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to open invoice');
    }
  };

  const addInvoiceToCart = (invoice) => {
    try {
      // Fetch the order details to get the items
      axios.get(`/orders?order_number=${invoice.order_number}`).then(response => {
        const orders = response.data;
        
        // The API returns an array, so we need to get the first order
        if (!orders || orders.length === 0) {
          toast.error('Order not found');
          return;
        }
        
        const order = orders[0];
        
        // Ensure setCart is a function
        if (typeof setCart !== 'function') {
          console.error('setCart is not a function:', setCart);
          toast.error('Cart functionality not available');
          return;
        }
        
        // Ensure cart is initialized as an array
        if (!cart || !Array.isArray(cart)) {
          setCart([]);
          return;
        }

        const MAX_ITEM_QUANTITY = 10;
        // Add all items from the order to cart
        order.items.forEach(item => {
          const cartItem = {
            id: item.menu_item_id,
            name: item.name,
            price: item.price,
            quantity: Math.min(MAX_ITEM_QUANTITY, item.quantity)
          };
          
          // Check if item already exists in cart
          const existingItemIndex = cart.findIndex(c => c.id === item.menu_item_id);
          
          if (existingItemIndex !== -1) {
            // Update quantity of existing item (cap at max)
            const updatedCart = [...cart];
            updatedCart[existingItemIndex].quantity = Math.min(MAX_ITEM_QUANTITY, updatedCart[existingItemIndex].quantity + item.quantity);
            setCart(updatedCart);
          } else {
            // Add new item to cart
            setCart(prevCart => [...prevCart, cartItem]);
          }
        });
        
        toast.success(`Items from Invoice #${getInvoiceNumber(invoice)} added to cart!`);
        
        // Switch to order page to show the cart
        if (setCurrentPage) {
          setCurrentPage('order');
        }
      }).catch(error => {
        console.error('Error fetching order details:', error);
        toast.error('Failed to add items to cart');
      });
    } catch (error) {
      console.error('Error adding invoice to cart:', error);
      toast.error('Failed to add items to cart');
    }
  };

  const viewInvoiceDetails = async (invoice) => {
    try {
      if (!invoice.order_number) {
        toast.error('No order details available for this invoice');
        return;
      }
      
      const response = await axios.get(`/orders?order_number=${invoice.order_number}`);
      const orders = response.data;
      
      // The API returns an array, so we need to get the first order
      if (!orders || orders.length === 0) {
        toast.error('Order not found');
        return;
      }
      
      const order = orders[0];
      setSelectedInvoice({ ...invoice, orderDetails: order });
      setShowInvoiceDetails(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  // Helper function to get invoice number from different possible property names
  const getInvoiceNumber = (invoice) => {
    return invoice.invoice_number || invoice.invoiceNumber || invoice.id || 'Unknown';
  };

  const handleShowMore = () => {
    // Filter invoices based on search query
    const filteredInvoices = invoices.filter(invoice => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      const invoiceNumber = getInvoiceNumber(invoice).toLowerCase();
      const orderNumber = (invoice.order_number || '').toLowerCase();
      const customerName = (invoice.customer_name || '').toLowerCase();
      const customerPhone = (invoice.customer_phone || '').toLowerCase();
      
      return invoiceNumber.includes(query) ||
             orderNumber.includes(query) ||
             customerName.includes(query) ||
             customerPhone.includes(query);
    });

    // Sort by created_at (newest first)
    const sortedInvoices = filteredInvoices.sort((a, b) => {
      const dateA = new Date((a.created_at as string | number) || 0);
      const dateB = new Date((b.created_at as string | number) || 0);
      return dateB.getTime() - dateA.getTime();
    });

    const nextPage = currentPage + 1;
    const nextItems = sortedInvoices.slice(0, nextPage * itemsPerPage);
    
    setDisplayedInvoices(nextItems);
    setCurrentPageLocal(nextPage);
    setHasMore(nextItems.length < sortedInvoices.length);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        {cafeSettings.logo_url && (
          <img 
            src={getImageUrl(cafeSettings.logo_url)} 
            alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`} 
            className="h-12 w-12 mb-3"
          />
        )}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
        <p className="mt-3 text-sm text-[var(--color-on-surface-variant)]">Loading invoice history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-container)]">
            <FileText className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] truncate">Reports & Invoices</h1>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">View order history, download invoices, and access operational reports</p>
            <div className="text-sm text-[var(--color-on-surface-variant)] mt-2">
               {activeTab === 'invoices' ? (
                 searchQuery ? 
                   `Total Invoices: ${invoices.length} | Filtered: ${displayedInvoices.length} of ${invoices.filter(invoice => {
                     const query = searchQuery.toLowerCase();
                     const invoiceNumber = getInvoiceNumber(invoice).toLowerCase();
                     const orderNumber = (invoice.order_number || '').toLowerCase();
                     const customerName = (invoice.customer_name || '').toLowerCase();
                     const customerPhone = (invoice.customer_phone || '').toLowerCase();
                     return invoiceNumber.includes(query) || orderNumber.includes(query) || customerName.includes(query) || customerPhone.includes(query);
                   }).length}` :
                   `Total Invoices: ${invoices.length} | Showing: ${displayedInvoices.length} of ${invoices.length}`
               ) : 'Operational reports and item-level data'}
             </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl glass-card w-fit">
        <button
          onClick={() => { setActiveTab('reports'); setCurrentPageLocal(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'reports'
              ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
              : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--surface-table)]/50 hover:text-[var(--color-on-surface)]'
          }`}
        >
          <FileText className="h-4 w-4" />
          Operational Reports
        </button>
        <button
          onClick={() => { setActiveTab('invoices'); setCurrentPageLocal(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'invoices'
              ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
              : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--surface-table)]/50 hover:text-[var(--color-on-surface)]'
          }`}
        >
          <Download className="h-4 w-4" />
          Invoice History
        </button>
      </div>

                             {/* Conditional Content */}
         {activeTab === 'reports' ? (
           <DailyReports />
         ) : (
          <>
            {/* Search Bar */}
            <div className="glass-card p-4 rounded-2xl">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <svg className="h-5 w-5 text-[var(--color-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by invoice number, order number, customer name, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass-input w-full pl-12 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] py-2.5 text-base"
                  />
                </div>
                {searchQuery && (
                  <GlassButton onClick={() => setSearchQuery('')} size="default" className="glass-button-secondary" title="Clear search">
                    Clear
                  </GlassButton>
                )}
              </div>
              {searchQuery && (
                <div className="mt-3 text-sm text-[var(--color-on-surface-variant)]">
                  Searching for: <span className="font-medium text-[var(--color-primary)]">&quot;{searchQuery}&quot;</span>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            {invoices.length > 0 && statistics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
                {[
                  { label: 'Total Revenue', value: formatCurrency(statistics.totalRevenue), icon: <span className="text-sm font-bold text-[var(--color-primary)]">{currencySettings.currency_symbol}</span> },
                  { label: 'Total Orders', value: statistics.totalOrders, icon: <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-primary)]" /> },
                  { label: 'Unique Customers', value: statistics.uniqueCustomers, icon: <User className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-primary)]" /> },
                  { label: 'Total Tax Collected', value: formatCurrency(statistics.totalTax), icon: <Percent className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-success)]" /> },
                  { label: 'Total Tips', value: formatCurrency(statistics.totalTips), icon: <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-error)]" /> }
                ].map((stat, i) => (
                  <div key={i} className="glass-card p-5 rounded-2xl">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-[var(--color-primary-container)] flex-shrink-0">{stat.icon}</div>
                      <div className="ml-3 sm:ml-4">
                        <div className="text-xs sm:text-sm font-medium text-[var(--color-on-surface-variant)]">{stat.label}</div>
                        <div className="text-lg sm:text-2xl font-semibold text-[var(--color-on-surface)]">{stat.value}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Invoices List */}
            <div className="glass-card overflow-hidden rounded-2xl shadow-sm">
              {invoices.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-[var(--color-on-surface-variant)]">
                  {cafeSettings.logo_url && (
                    <img src={getImageUrl(cafeSettings.logo_url)} alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`} className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  )}
                  <h3 className="text-lg font-medium text-[var(--color-on-surface)] mb-2">No invoices yet</h3>
                  <p className="text-sm">Invoices are automatically created when orders are completed. Completed orders will appear here with their invoice details.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-[var(--surface-table)]/60 text-[var(--color-on-surface)]">
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Invoice #</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Order #</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Customer</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Date</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Payment</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Items</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Total</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider border-b border-[var(--color-outline)]/20">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-outline)]/30">
                        {displayedInvoices.map((invoice) => (
                          <tr key={getInvoiceNumber(invoice)} className="hover:bg-[var(--surface-table)]/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-[var(--color-on-surface)]">#{getInvoiceNumber(invoice)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-[var(--color-on-surface-variant)]">{invoice.order_number ? `#${invoice.order_number}` : 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <User className="h-4 w-4 text-[var(--color-on-surface-variant)] mr-2" />
                                <div>
                                  <div className="text-sm font-medium text-[var(--color-on-surface)]">{invoice.customer_name}</div>
                                  {invoice.customer_phone && <div className="text-sm text-[var(--color-on-surface-variant)]">{invoice.customer_phone}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-[var(--color-on-surface-variant)] mr-2" />
                                <div className="text-sm text-[var(--color-on-surface)]">{formatDate(invoice.invoice_date)}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-[var(--color-on-surface-variant)]">{invoice.payment_method || 'Cash'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-[var(--color-on-surface-variant)]">{invoice.items ? invoice.items.length : 0} items</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-[var(--color-on-surface)]">{formatCurrency(invoice.total_amount)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-1.5">
                                {invoice.order_number && (
                                  <>
                                    <GlassButton onClick={() => viewInvoiceDetails(invoice)} size="icon" className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9" title="View Details">
                                      <Plus className="h-4 w-4" />
                                    </GlassButton>
                                    <GlassButton onClick={() => addInvoiceToCart(invoice)} size="icon" className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9" title="Add to Cart">
                                      <ShoppingCart className="h-4 w-4" />
                                    </GlassButton>
                                  </>
                                )}
                                <GlassButton onClick={() => openInvoice(getInvoiceNumber(invoice))} size="icon" className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9" title="Download Invoice">
                                  <Download className="h-4 w-4" />
                                </GlassButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {hasMore && displayedInvoices.length > 0 && (
                      <div className="mt-6 pb-6 text-center">
                        <GlassButton onClick={handleShowMore} size="default" className="glass-button-secondary" contentClassName="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Show More ({currentPage * itemsPerPage} of {invoices.filter(invoice => {
                            if (!searchQuery.trim()) return true;
                            const query = searchQuery.toLowerCase();
                            const invoiceNumber = getInvoiceNumber(invoice).toLowerCase();
                            const orderNumber = (invoice.order_number || '').toLowerCase();
                            const customerName = (invoice.customer_name || '').toLowerCase();
                            const customerPhone = (invoice.customer_phone || '').toLowerCase();
                            return invoiceNumber.includes(query) || orderNumber.includes(query) || customerName.includes(query) || customerPhone.includes(query);
                          }).length})
                        </GlassButton>
                      </div>
                    )}
                  </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4 p-4">
                  {displayedInvoices.map((invoice) => (
                    <div key={getInvoiceNumber(invoice)} className="glass-card p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-medium text-[var(--color-on-surface)]">#{getInvoiceNumber(invoice)}</div>
                          <div className="text-sm text-[var(--color-on-surface-variant)]">{invoice.order_number ? `Order #${invoice.order_number}` : 'No order number'}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {invoice.order_number && (
                            <>
                              <GlassButton onClick={() => viewInvoiceDetails(invoice)} size="icon" className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9" title="View Details">
                                <Plus className="h-4 w-4" />
                              </GlassButton>
                              <GlassButton onClick={() => addInvoiceToCart(invoice)} size="icon" className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9" title="Add to Cart">
                                <ShoppingCart className="h-4 w-4" />
                              </GlassButton>
                            </>
                          )}
                          <GlassButton onClick={() => openInvoice(getInvoiceNumber(invoice))} size="icon" className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9" title="Download Invoice">
                            <Download className="h-4 w-4" />
                          </GlassButton>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <User className="h-4 w-4 text-[var(--color-on-surface-variant)] mr-2" />
                          <span className="text-[var(--color-on-surface)]">{invoice.customer_name}</span>
                          {invoice.customer_phone && <span className="text-[var(--color-on-surface-variant)] ml-2">({invoice.customer_phone})</span>}
                        </div>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 text-[var(--color-on-surface-variant)] mr-2" />
                          <span className="text-[var(--color-on-surface)]">{formatDate(invoice.invoice_date)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[var(--color-on-surface-variant)]">{invoice.items ? invoice.items.length : 0} items • {invoice.payment_method || 'Cash'}</span>
                          <span className="font-medium text-[var(--color-on-surface)]">{formatCurrency(invoice.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {hasMore && displayedInvoices.length > 0 && (
                    <div className="mt-6 text-center">
                      <GlassButton onClick={handleShowMore} size="default" className="glass-button-secondary" contentClassName="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Show More ({currentPage * itemsPerPage} of {invoices.filter(invoice => {
                          if (!searchQuery.trim()) return true;
                          const query = searchQuery.toLowerCase();
                          const invoiceNumber = getInvoiceNumber(invoice).toLowerCase();
                          const orderNumber = (invoice.order_number || '').toLowerCase();
                          const customerName = (invoice.customer_name || '').toLowerCase();
                          const customerPhone = (invoice.customer_phone || '').toLowerCase();
                          return invoiceNumber.includes(query) || orderNumber.includes(query) || customerName.includes(query) || customerPhone.includes(query);
                        }).length})
                      </GlassButton>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
                 </>
       )}

      {/* Invoice Details Modal - Template Dialog */}
      <Dialog
        open={!!(showInvoiceDetails && selectedInvoice)}
        onClose={() => setShowInvoiceDetails(false)}
        title={selectedInvoice ? `Invoice #${getInvoiceNumber(selectedInvoice)}` : 'Invoice'}
        size="2xl"
      >
        {showInvoiceDetails && selectedInvoice && (
            <>
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">Order #{selectedInvoice.order_number}</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-[var(--color-on-surface)]">Customer:</span>
                    <p className="text-[var(--color-on-surface-variant)]">{selectedInvoice.customer_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-[var(--color-on-surface)]">Date:</span>
                    <p className="text-[var(--color-on-surface-variant)]">{formatDate(selectedInvoice.invoice_date)}</p>
                  </div>
                </div>

                {selectedInvoice.orderDetails && (
                  <div>
                    <h4 className="font-medium text-[var(--color-on-surface)] mb-2">Order Items:</h4>
                    <div className="space-y-2">
                      {selectedInvoice.orderDetails.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-[var(--color-outline)]/30">
                          <div>
                            <p className="font-medium text-[var(--color-on-surface)]">{item.name}</p>
                            <p className="text-sm text-[var(--color-on-surface-variant)]">
                              Qty: {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                          <p className="font-medium text-[var(--color-on-surface)]">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[var(--color-outline)]/30">
                  <GlassButton onClick={() => setShowInvoiceDetails(false)} size="default" className="glass-button-secondary">
                    Close
                  </GlassButton>
                  {selectedInvoice.order_number && (
                    <GlassButton
                      onClick={() => { addInvoiceToCart(selectedInvoice); setShowInvoiceDetails(false); }}
                      size="default"
                      className="glass-button-primary"
                      contentClassName="flex items-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </GlassButton>
                  )}
                </div>
              </div>
            </>
        )}
      </Dialog>
    </div>
  );
};

export default InvoiceHistory; 
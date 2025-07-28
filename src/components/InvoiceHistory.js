import React, { useState, useEffect } from 'react';
import { Download, Calendar, User, DollarSign, Percent, Heart, BarChart3, Plus, ShoppingCart, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import DailyReports from './DailyReports';

const InvoiceHistory = ({ cart, setCart, setCurrentPage }) => {
  const { formatCurrency, currencySettings } = useCurrency();
  const [invoices, setInvoices] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'reports'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);

  // Pagination states
  const [displayedInvoices, setDisplayedInvoices] = useState([]);
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
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
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
    if (!invoiceNumber) {
      console.error('Invoice number is undefined');
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

        // Add all items from the order to cart
        order.items.forEach(item => {
          const cartItem = {
            id: item.menu_item_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          };
          
          // Check if item already exists in cart
          const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.menu_item_id);
          
          if (existingItemIndex !== -1) {
            // Update quantity of existing item
            const updatedCart = [...cart];
            updatedCart[existingItemIndex].quantity += item.quantity;
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
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
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
        <img 
          src="/images/palm-cafe-logo.png" 
          alt="Palm Cafe Logo" 
          className="h-12 w-12 mb-3"
        />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
        <p className="mt-3 text-sm text-secondary-600">Loading invoice history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div className="flex items-center">
          <img 
            src="/images/palm-cafe-logo.png" 
            alt="Palm Cafe Logo" 
            className="h-10 w-10 mr-3"
          />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-secondary-700 dark:text-secondary-300">Invoice History & Reports</h2>
                         <div className="text-sm text-gray-500 dark:text-gray-400">
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
               ) : 'Business insights and analytics'}
             </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-accent-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
                           onClick={() => {
                 setActiveTab('invoices');
                 setCurrentPageLocal(1); // Reset pagination when tab changes
               }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invoices'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Invoice History
            </div>
          </button>
          <button
                           onClick={() => {
                 setActiveTab('reports');
                 setCurrentPageLocal(1); // Reset pagination when tab changes
               }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Daily Reports
            </div>
          </button>
        </nav>
             </div>

              {/* Conditional Content */}
        {activeTab === 'invoices' ? (
          <>
                         {/* Search Bar */}
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
               <div className="flex items-center space-x-4">
                 <div className="flex-1 relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <svg
                       className="h-5 w-5 text-gray-400"
                       fill="none"
                       stroke="currentColor"
                       viewBox="0 0 24 24"
                     >
                       <path
                         strokeLinecap="round"
                         strokeLinejoin="round"
                         strokeWidth={2}
                         d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                       />
                     </svg>
                   </div>
                   <input
                     type="text"
                     placeholder="Search by invoice number, order number, customer name, or phone..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-12 pr-4 py-4 text-lg border-0 bg-gray-50 dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                   />
                 </div>
                 {searchQuery && (
                   <button
                     onClick={() => setSearchQuery('')}
                     className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl transition-all duration-200"
                     title="Clear search"
                   >
                     Clear
                   </button>
                 )}
               </div>
               {searchQuery && (
                 <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                   Searching for: <span className="font-medium text-secondary-600 dark:text-secondary-400">"{searchQuery}"</span>
                 </div>
               )}
             </div>

            {/* Summary Stats */}
           {invoices.length > 0 && statistics && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
               <div className="card">
                 <div className="flex items-center">
                   <div className="flex-shrink-0">
                     <div className="h-6 w-6 sm:h-8 sm:w-8 bg-secondary-500 rounded-full flex items-center justify-center">
                       <span className="text-white text-xs sm:text-sm font-bold">{currencySettings.currency_symbol}</span>
                     </div>
                   </div>
                   <div className="ml-3 sm:ml-4">
                     <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</div>
                     <div className="text-lg sm:text-2xl font-semibold text-secondary-700 dark:text-secondary-300">
                       {formatCurrency(statistics.totalRevenue)}
                     </div>
                   </div>
                 </div>
               </div>
               
               <div className="card">
                 <div className="flex items-center">
                   <div className="flex-shrink-0">
                     <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-secondary-500" />
                   </div>
                   <div className="ml-3 sm:ml-4">
                     <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</div>
                     <div className="text-lg sm:text-2xl font-semibold text-secondary-700 dark:text-secondary-300">
                       {statistics.totalOrders}
                     </div>
                   </div>
                 </div>
               </div>
               
               <div className="card">
                 <div className="flex items-center">
                   <div className="flex-shrink-0">
                     <User className="h-6 w-6 sm:h-8 sm:w-8 text-secondary-500" />
                   </div>
                   <div className="ml-3 sm:ml-4">
                     <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Unique Customers</div>
                     <div className="text-lg sm:text-2xl font-semibold text-secondary-700 dark:text-secondary-300">
                       {statistics.uniqueCustomers}
                     </div>
                   </div>
                 </div>
               </div>

               <div className="card">
                 <div className="flex items-center">
                   <div className="flex-shrink-0">
                     <Percent className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                   </div>
                   <div className="ml-3 sm:ml-4">
                     <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Tax Collected</div>
                     <div className="text-lg sm:text-2xl font-semibold text-secondary-700 dark:text-secondary-300">
                       {formatCurrency(statistics.totalTax)}
                     </div>
                   </div>
                 </div>
               </div>

               <div className="card">
                 <div className="flex items-center">
                   <div className="flex-shrink-0">
                     <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                   </div>
                   <div className="ml-3 sm:ml-4">
                     <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Tips</div>
                     <div className="text-lg sm:text-2xl font-semibold text-secondary-700 dark:text-secondary-300">
                       {formatCurrency(statistics.totalTips)}
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* Invoices List */}
           <div className="card">
            {invoices.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                <img 
                  src="/images/palm-cafe-logo.png" 
                  alt="Palm Cafe Logo" 
                  className="h-16 w-16 mx-auto mb-4 opacity-50"
                />
                <h3 className="text-lg font-medium text-secondary-700 dark:text-secondary-300 mb-2">No invoices yet</h3>
                <p className="text-sm">Generate your first invoice to see it here</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-accent-200">
                    <thead className="bg-accent-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Invoice #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Order #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-accent-200">
                      {displayedInvoices.map((invoice) => (
                        <tr key={getInvoiceNumber(invoice)} className="hover:bg-accent-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                              #{getInvoiceNumber(invoice)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-secondary-600 dark:text-secondary-400">
                              {invoice.order_number ? `#${invoice.order_number}` : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-secondary-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                                  {invoice.customer_name}
                                </div>
                                {invoice.customer_phone && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {invoice.customer_phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-secondary-400 mr-2" />
                              <div className="text-sm text-secondary-700 dark:text-secondary-300">
                                {formatDate(invoice.invoice_date)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-secondary-600 dark:text-secondary-400">
                              {invoice.payment_method || 'Cash'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-secondary-600 dark:text-secondary-400">
                              {invoice.items ? invoice.items.length : 0} items
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                              {formatCurrency(invoice.total_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {invoice.order_number && (
                                <>
                                  <button
                                    onClick={() => viewInvoiceDetails(invoice)}
                                    className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-300"
                                    title="View Details"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => addInvoiceToCart(invoice)}
                                    className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-300"
                                    title="Add to Cart"
                                  >
                                    <ShoppingCart className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => openInvoice(getInvoiceNumber(invoice))}
                                className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-300"
                                title="Download Invoice"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                                     {/* Show More Button for Desktop */}
                   {hasMore && displayedInvoices.length > 0 && (
                     <div className="mt-6 text-center">
                       <button
                         onClick={handleShowMore}
                         className="btn-secondary flex items-center mx-auto"
                       >
                         <Plus className="h-4 w-4 mr-2" />
                         Show More ({currentPage * itemsPerPage} of {invoices.filter(invoice => {
                           if (!searchQuery.trim()) return true;
                           const query = searchQuery.toLowerCase();
                           const invoiceNumber = getInvoiceNumber(invoice).toLowerCase();
                           const orderNumber = (invoice.order_number || '').toLowerCase();
                           const customerName = (invoice.customer_name || '').toLowerCase();
                           const customerPhone = (invoice.customer_phone || '').toLowerCase();
                           return invoiceNumber.includes(query) || orderNumber.includes(query) || customerName.includes(query) || customerPhone.includes(query);
                         }).length})
                       </button>
                     </div>
                   )}
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                  {displayedInvoices.map((invoice) => (
                    <div key={getInvoiceNumber(invoice)} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-accent-200 dark:border-gray-700 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-medium text-secondary-700 dark:text-secondary-300">
                            #{getInvoiceNumber(invoice)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {invoice.order_number ? `Order #${invoice.order_number}` : 'No order number'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {invoice.order_number && (
                            <>
                              <button
                                onClick={() => viewInvoiceDetails(invoice)}
                                className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-300"
                                title="View Details"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => addInvoiceToCart(invoice)}
                                className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-300"
                                title="Add to Cart"
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openInvoice(getInvoiceNumber(invoice))}
                            className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-300"
                            title="Download Invoice"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <User className="h-4 w-4 text-secondary-400 mr-2" />
                          <span className="text-secondary-700 dark:text-secondary-300">
                            {invoice.customer_name}
                          </span>
                          {invoice.customer_phone && (
                            <span className="text-gray-500 dark:text-gray-400 ml-2">
                              ({invoice.customer_phone})
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 text-secondary-400 mr-2" />
                          <span className="text-secondary-700 dark:text-secondary-300">
                            {formatDate(invoice.invoice_date)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            {invoice.items ? invoice.items.length : 0} items • {invoice.payment_method || 'Cash'}
                          </span>
                          <span className="font-medium text-secondary-700 dark:text-secondary-300">
                            {formatCurrency(invoice.total_amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Show More Button */}
                  {hasMore && displayedInvoices.length > 0 && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={handleShowMore}
                        className="btn-secondary flex items-center mx-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Show More ({currentPage * itemsPerPage} of {invoices.filter(invoice => {
                          if (!searchQuery.trim()) return true;
                          const query = searchQuery.toLowerCase();
                          const invoiceNumber = getInvoiceNumber(invoice).toLowerCase();
                          const orderNumber = (invoice.order_number || '').toLowerCase();
                          const customerName = (invoice.customer_name || '').toLowerCase();
                          const customerPhone = (invoice.customer_phone || '').toLowerCase();
                          return invoiceNumber.includes(query) || orderNumber.includes(query) || customerName.includes(query) || customerPhone.includes(query);
                        }).length})
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <DailyReports />
      )}

      {/* Invoice Details Modal */}
      {showInvoiceDetails && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300">
                    Invoice #{getInvoiceNumber(selectedInvoice)}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Order #{selectedInvoice.order_number}
                  </p>
                </div>
                <button
                  onClick={() => setShowInvoiceDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Customer:</span>
                    <p className="text-gray-600 dark:text-gray-400">{selectedInvoice.customer_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>
                    <p className="text-gray-600 dark:text-gray-400">{formatDate(selectedInvoice.invoice_date)}</p>
                  </div>
                </div>

                {selectedInvoice.orderDetails && (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Order Items:</h4>
                    <div className="space-y-2">
                      {selectedInvoice.orderDetails.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">{item.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Qty: {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                          <p className="font-medium text-secondary-700 dark:text-secondary-300">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowInvoiceDetails(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  {selectedInvoice.order_number && (
                    <button
                      onClick={() => {
                        addInvoiceToCart(selectedInvoice);
                        setShowInvoiceDetails(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 rounded-lg transition-colors flex items-center"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory; 
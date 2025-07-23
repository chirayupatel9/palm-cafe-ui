import React, { useState, useEffect } from 'react';
import { Download, Calendar, User, DollarSign, Percent, Heart, BarChart3 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import DailyReports from './DailyReports';

const InvoiceHistory = () => {
  const { formatCurrency, currencySettings } = useCurrency();
  const [invoices, setInvoices] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'reports'

  useEffect(() => {
    fetchInvoices();
    fetchStatistics();
  }, []);

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
              {activeTab === 'invoices' ? `Total Invoices: ${invoices.length}` : 'Business insights and analytics'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-accent-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('invoices')}
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
            onClick={() => setActiveTab('reports')}
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
                      {invoices.map((invoice) => (
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
                              {invoice.items_count || 0} items
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                              {formatCurrency(invoice.total_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openInvoice(getInvoiceNumber(invoice))}
                              className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-300"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                  {invoices.map((invoice) => (
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
                        <button
                          onClick={() => openInvoice(getInvoiceNumber(invoice))}
                          className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-300"
                        >
                          <Download className="h-5 w-5" />
                        </button>
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
                            {invoice.items_count || 0} items • {invoice.payment_method || 'Cash'}
                          </span>
                          <span className="font-medium text-secondary-700 dark:text-secondary-300">
                            {formatCurrency(invoice.total_amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Summary Stats */}
          {invoices.length > 0 && statistics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
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
        </>
      ) : (
        <DailyReports />
      )}
    </div>
  );
};

export default InvoiceHistory; 
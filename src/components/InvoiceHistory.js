import React, { useState, useEffect } from 'react';
import { Download, Calendar, User, DollarSign, Percent, Heart } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';

const InvoiceHistory = () => {
  const { formatCurrency, currencySettings } = useCurrency();
  const [invoices, setInvoices] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Debug logging
  console.log('InvoiceHistory - Currency Settings:', currencySettings);
  console.log('InvoiceHistory - formatCurrency function:', formatCurrency);

  useEffect(() => {
    fetchInvoices();
    fetchStatistics();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/invoices');
      console.log('Fetched invoices:', response.data);
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
      console.log('Opening invoice:', invoiceNumber);
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <h2 className="text-xl sm:text-2xl font-bold text-secondary-700 dark:text-secondary-300">Invoice History</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Invoices: {invoices.length}
            </div>
          </div>
        </div>
      </div>

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
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                      Date
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
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-secondary-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                              {invoice.customerName}
                            </div>
                            {invoice.customerPhone && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {invoice.customerPhone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-secondary-400 mr-2" />
                          <div className="text-sm text-secondary-700 dark:text-secondary-300">
                            {formatDate(invoice.date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-700 dark:text-secondary-300">
                          {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {invoice.items.map(item => item.name).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-semibold text-secondary-600">
                            {formatCurrency(invoice.total)}
                          </div>
                        </div>
                        {/* Show tax and tip breakdown */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {invoice.tax_amount > 0 && (
                            <div>Tax: {formatCurrency(invoice.tax_amount)}</div>
                          )}
                          {invoice.tip_amount > 0 && (
                            <div>Tip: {formatCurrency(invoice.tip_amount)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openInvoice(getInvoiceNumber(invoice))}
                          className="text-secondary-600 hover:text-secondary-900 flex items-center justify-end w-full"
                          title="Open Invoice"
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
            <div className="lg:hidden space-y-3">
              {invoices.map((invoice) => (
                <div key={getInvoiceNumber(invoice)} className="border border-accent-200 rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-secondary-500 mr-2" />
                      <div>
                        <h4 className="font-medium text-secondary-700 dark:text-secondary-300">#{getInvoiceNumber(invoice)}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(invoice.date)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openInvoice(getInvoiceNumber(invoice))}
                      className="p-2 text-secondary-600 hover:text-secondary-900 bg-secondary-50 rounded-full"
                      title="Open Invoice"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-secondary-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">{invoice.customerName}</p>
                        {invoice.customerPhone && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{invoice.customerPhone}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {invoice.items.map(item => item.name).join(', ')}
                      </p>
                    </div>
                    
                                          <div className="flex justify-between items-center pt-2 border-t border-accent-100">
                        <div className="flex items-center">
                          <span className="text-sm font-semibold text-secondary-600">
                            {formatCurrency(invoice.total)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {invoice.tax_amount > 0 && (
                            <span className="mr-2">Tax: {formatCurrency(invoice.tax_amount)}</span>
                          )}
                          {invoice.tip_amount > 0 && (
                            <span>Tip: {formatCurrency(invoice.tip_amount)}</span>
                          )}
                        </div>
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
    </div>
  );
};

export default InvoiceHistory; 
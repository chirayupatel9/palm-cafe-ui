import React, { useState, useEffect } from 'react';
import { ShoppingBag, FileText, TrendingUp } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';

const DailyReports = () => {
  const { formatCurrency, currencySettings } = useCurrency();
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyReports();
  }, []);

  const fetchDailyReports = async () => {
    try {
      setLoading(true);
      const topItemsResponse = await axios.get('/reports/top-items');
      setTopItems(topItemsResponse.data.topItems || []);
    } catch (error) {
      console.error('Error fetching daily reports:', error);
      toast.error('Failed to load daily reports');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
        <p className="mt-3 text-sm text-secondary-600">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <FileText className="h-8 w-8 text-secondary-600 mr-3" />
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-secondary-700 dark:text-secondary-300">
            Operational Reports
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Detailed item-level data and operational insights
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> For high-level business insights, revenue trends, and performance metrics, visit the <strong>Analytics</strong> dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Top Items Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Top 5 Most Ordered Items
          </h3>
          <p className="card-description">
            Item-level performance data for operational planning
          </p>
        </div>
        {topItems.length > 0 ? (
          <div className="space-y-3">
            {topItems.slice(0, 5).map((item, index) => (
              <div 
                key={item.id || index} 
                className="flex items-center justify-between p-3 rounded-lg transition-surface"
                style={{ backgroundColor: 'var(--surface-table)' }}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-secondary-600 dark:text-secondary-400">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.category || 'Uncategorized'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {item.total_orders} orders
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(item.total_revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No order data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReports; 
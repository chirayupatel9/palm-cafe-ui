import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Calendar, BarChart3 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';

const DailyReports = () => {
  const { formatCurrency, currencySettings } = useCurrency();
  const [dailyData, setDailyData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7'); // 7, 30, 90 days

  useEffect(() => {
    fetchDailyReports();
  }, [timeRange]);

  useEffect(() => {
    console.log('DailyData state changed:', dailyData);
    if (dailyData.length > 0) {
      console.log('Sample data item:', dailyData[0]);
      console.log('All earnings values:', dailyData.map(d => ({ date: d.date, earnings: d.earnings, orders: d.orders })));
    }
  }, [dailyData]);

  const fetchDailyReports = async () => {
    try {
      setLoading(true);
      const [dailyResponse, topItemsResponse] = await Promise.all([
        axios.get(`/reports/daily?days=${timeRange}`),
        axios.get('/reports/top-items')
      ]);

      console.log('Daily data received:', dailyResponse.data);
      console.log('Top items received:', topItemsResponse.data);
      console.log('Daily data array:', dailyResponse.data.dailyData);

      setDailyData(dailyResponse.data.dailyData || []);
      setTopItems(topItemsResponse.data.topItems || []);
      setTotalEarnings(dailyResponse.data.totalEarnings || 0);
      setTotalOrders(dailyResponse.data.totalOrders || 0);
    } catch (error) {
      console.error('Error fetching daily reports:', error);
      toast.error('Failed to load daily reports');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getMaxValue = (data, key) => {
    if (!data || data.length === 0) return 0;
    const values = data.map(item => {
      const value = key === 'earnings' ? parseFloat(item[key]) || 0 : parseInt(item[key]) || 0;
      return value;
    });
    console.log(`Max value for ${key}:`, Math.max(...values), 'Values:', values);
    return Math.max(...values);
  };

  const renderLineChart = (data, key, color) => {
    if (!data || data.length === 0) return null;
    
    const maxValue = getMaxValue(data, key);
    console.log(`Rendering line chart for ${key}, maxValue:`, maxValue);
    
    if (maxValue === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <p>No data available for this period</p>
        </div>
      );
    }

    // Calculate points for the line chart
    const points = data.map((item, index) => {
      const value = key === 'earnings' ? parseFloat(item[key]) || 0 : parseInt(item[key]) || 0;
      const heightPercentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
      const x = (index / (data.length - 1)) * 100; // X position (0-100%)
      const y = 100 - heightPercentage; // Y position (inverted for SVG)
      
      console.log(`Point ${index}: value=${value}, x=${x}%, y=${y}%`);
      
      return { x, y, value, date: item.date };
    });

    // Create SVG path for the line
    const pathData = points.map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `L ${point.x} ${point.y}`;
    }).join(' ');

    return (
      <div className="w-full h-48 relative">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Line chart */}
          <path
            d={pathData}
            stroke={color === 'bg-green-500' ? '#10b981' : '#3b82f6'}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill={color === 'bg-green-500' ? '#10b981' : '#3b82f6'}
              stroke="white"
              strokeWidth="2"
            />
          ))}
        </svg>
        
        {/* Date labels */}
        <div className="flex justify-between mt-2 px-2">
          {points.map((point, index) => (
            <div key={index} className="text-xs text-gray-500 transform -rotate-45 origin-left whitespace-nowrap">
              {formatDate(point.date)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Test line chart function
  const renderTestLineChart = (color) => {
    const testData = [
      { value: 20, label: 'Mon' },
      { value: 35, label: 'Tue' },
      { value: 15, label: 'Wed' },
      { value: 50, label: 'Thu' },
      { value: 30, label: 'Fri' },
      { value: 45, label: 'Sat' },
      { value: 25, label: 'Sun' }
    ];
    
    const maxValue = Math.max(...testData.map(d => d.value));
    
    // Calculate points for the line chart
    const points = testData.map((item, index) => {
      const heightPercentage = (item.value / maxValue) * 100;
      const x = (index / (testData.length - 1)) * 100;
      const y = 100 - heightPercentage;
      
      return { x, y, value: item.value, label: item.label };
    });

    // Create SVG path for the line
    const pathData = points.map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `L ${point.x} ${point.y}`;
    }).join(' ');

    return (
      <div className="w-full h-48 relative">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Line chart */}
          <path
            d={pathData}
            stroke={color === 'bg-green-500' ? '#10b981' : '#3b82f6'}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill={color === 'bg-green-500' ? '#10b981' : '#3b82f6'}
              stroke="white"
              strokeWidth="2"
            />
          ))}
        </svg>
        
        {/* Date labels */}
        <div className="flex justify-between mt-2 px-2">
          {points.map((point, index) => (
            <div key={index} className="text-xs text-gray-500 transform -rotate-45 origin-left whitespace-nowrap">
              {point.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
        <p className="mt-3 text-sm text-secondary-600">Loading daily reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div className="flex items-center">
          <BarChart3 className="h-8 w-8 text-secondary-600 mr-3" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-secondary-700 dark:text-secondary-300">
              Daily Reports
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Business insights and trends
            </p>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Time Range:
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-accent-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(totalEarnings)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-accent-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-accent-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalOrders > 0 ? formatCurrency(totalEarnings / totalOrders) : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-accent-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Days Tracked</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {dailyData.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Earnings Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-accent-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Daily Earnings Trend
          </h3>
          {dailyData.length > 0 ? (
            <div>
                             {/* Test line chart to verify rendering */}
               {renderTestLineChart('bg-green-500')}
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Lowest: {formatCurrency(Math.min(...dailyData.map(d => parseFloat(d.earnings) || 0)))}</span>
                  <span>Highest: {formatCurrency(Math.max(...dailyData.map(d => parseFloat(d.earnings) || 0)))}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No earnings data available</p>
            </div>
          )}
        </div>

        {/* Daily Orders Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-accent-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Daily Orders Trend
          </h3>
          {dailyData.length > 0 ? (
            <div>
                             {/* Test line chart to verify rendering */}
               {renderTestLineChart('bg-blue-500')}
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Lowest: {Math.min(...dailyData.map(d => parseInt(d.orders) || 0))} orders</span>
                  <span>Highest: {Math.max(...dailyData.map(d => parseInt(d.orders) || 0))} orders</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No order data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Items Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-accent-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Top 5 Most Ordered Items
        </h3>
        {topItems.length > 0 ? (
          <div className="space-y-3">
            {topItems.slice(0, 5).map((item, index) => (
              <div key={item.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
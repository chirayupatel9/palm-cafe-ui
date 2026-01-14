import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../contexts/FeatureContext';
import { 
  TrendingUp, BarChart3, Users, DollarSign, 
  ShoppingCart, Calendar, Loader, AlertCircle 
} from 'lucide-react';
import Card from './ui/Card';
import Skeleton, { CardSkeleton } from './ui/Skeleton';
import LockedFeature from './ui/LockedFeature';

// Simple Bar Chart Component (CSS-based)
const SimpleBarChart = ({ data, labelKey = 'date', valueKey = 'count', maxValue, height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-secondary-500 dark:text-gray-400">
        <p>No data available</p>
      </div>
    );
  }
  
  const max = maxValue || Math.max(...data.map(d => d[valueKey] || 0));
  
  return (
    <div className="space-y-2" style={{ height: `${height}px` }}>
      <div className="flex items-end justify-between h-full space-x-1">
        {data.map((item, index) => {
          const value = item[valueKey] || 0;
          const percentage = max > 0 ? (value / max) * 100 : 0;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center justify-end">
              <div
                className="w-full bg-secondary-500 hover:bg-secondary-600 transition-colors rounded-t"
                style={{ height: `${percentage}%`, minHeight: percentage > 0 ? '4px' : '0' }}
                title={`${item[labelKey]}: ${value}`}
              />
              {data.length <= 14 && (
                <span className="text-xs text-secondary-500 dark:text-gray-400 mt-1 transform -rotate-45 origin-left whitespace-nowrap">
                  {new Date(item[labelKey]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Simple Line Chart Component (CSS-based)
const SimpleLineChart = ({ data, labelKey = 'date', valueKey = 'amount', maxValue, height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-secondary-500 dark:text-gray-400">
        <p>No data available</p>
      </div>
    );
  }
  
  const max = maxValue || Math.max(...data.map(d => d[valueKey] || 0));
  const points = data.map((item, index) => {
    const value = item[valueKey] || 0;
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - percentage;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="relative" style={{ height: `${height}px` }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-secondary)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((item, index) => {
          const value = item[valueKey] || 0;
          const percentage = max > 0 ? (value / max) * 100 : 0;
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - percentage;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill="var(--color-secondary)"
              className="hover:r-3 transition-all"
            />
          );
        })}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-secondary-500 dark:text-gray-400">
        {data.length <= 7 && data.map((item, index) => (
          <span key={index} className="transform -rotate-45 origin-left">
            {new Date(item[labelKey]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>
    </div>
  );
};

// Metric Card Component - Using KPI card style for emphasis
const MetricCard = ({ title, value, subtitle, icon: Icon, trend, className = '' }) => {
  return (
    <Card kpi={true} className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-on-surface-variant)' }}>
            {title}
          </p>
          <p className="text-3xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`flex items-center mt-3 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`h-3 w-3 mr-1 ${trend < 0 ? 'transform rotate-180' : ''}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-lg" style={{ 
            backgroundColor: 'var(--color-primary-container)'
          }}>
            <Icon className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
          </div>
        )}
      </div>
    </Card>
  );
};

const CafeAnalytics = () => {
  const { user } = useAuth();
  const { hasFeature, loading: featuresLoading } = useFeatures();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [overviewRes, trendsRes, customersRes] = await Promise.all([
        axios.get('/analytics/overview'),
        axios.get(`/analytics/trends?days=${timeRange}`),
        axios.get('/analytics/customers')
      ]);
      
      setOverview(overviewRes.data);
      setTrends(trendsRes.data);
      setCustomers(customersRes.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      if (err.response?.status === 403) {
        if (err.response?.data?.code === 'FEATURE_ACCESS_DENIED') {
          setError('feature_denied');
        } else {
          setError('access_denied');
        }
      } else {
        setError('fetch_error');
        toast.error('We couldn\'t load analytics data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Access control check
  if (user && user.role !== 'admin' && user.role !== 'manager') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-secondary-600 dark:text-gray-400">Access denied. Admin or manager privileges required.</p>
        </div>
      </div>
    );
  }

  // Feature flag check
  if (featuresLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  if (!hasFeature('analytics')) {
    return (
      <LockedFeature 
        featureName="Analytics" 
        requiredPlan="Pro"
        description="Advanced insights and business intelligence to track performance, revenue trends, and customer behavior."
        showPreview={true}
        previewContent={
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-secondary-700 dark:text-gray-100 flex items-center mb-2">
                <BarChart3 className="h-6 w-6 mr-2" />
                Analytics
              </h2>
              <p className="text-sm text-secondary-500 dark:text-gray-400">
                Business insights and performance metrics
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="opacity-50">
                  <div className="h-20 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-table)' }} />
                </Card>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="opacity-50">
                <div className="h-64 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-table)' }} />
              </Card>
              <Card className="opacity-50">
                <div className="h-64 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-table)' }} />
              </Card>
            </div>
          </div>
        }
      />
    );
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-secondary-700 dark:text-gray-100 flex items-center mb-2">
            <BarChart3 className="h-6 w-6 mr-2" />
            Analytics
          </h2>
          <p className="text-sm text-secondary-500 dark:text-gray-400">
            Business insights and performance metrics
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton lines={5} />
          <CardSkeleton lines={5} />
        </div>
      </div>
    );
  }

  if (error === 'feature_denied' || error === 'access_denied') {
    return (
      <LockedFeature 
        featureName="Analytics" 
        requiredPlan="Pro"
        description="Advanced insights and business intelligence to track performance, revenue trends, and customer behavior."
      />
    );
  }

  if (error === 'fetch_error') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-secondary-600 dark:text-gray-400">Failed to load analytics data. Please try again.</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-700 dark:text-gray-100 flex items-center mb-2">
            <BarChart3 className="h-6 w-6 mr-2" />
            Analytics
          </h2>
          <p className="text-sm text-secondary-500 dark:text-gray-400">
            Business insights and performance metrics
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-secondary-600 dark:text-gray-400">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-3 py-1 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Orders"
          value={overview?.orders?.total || 0}
          subtitle={`${overview?.orders?.this_month || 0} this month`}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(overview?.revenue?.total || 0)}
          subtitle={`${formatCurrency(overview?.revenue?.this_month || 0)} this month`}
          icon={DollarSign}
        />
        <MetricCard
          title="Orders Today"
          value={overview?.orders?.today || 0}
          subtitle={formatCurrency(overview?.revenue?.today || 0)}
          icon={Calendar}
        />
        <MetricCard
          title="Total Customers"
          value={customers?.total || 0}
          subtitle={`${customers?.new_this_month || 0} new this month`}
          icon={Users}
        />
      </div>

      {/* Trends Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Trend */}
        <Card
          title="Orders Over Time"
          description={`Order volume for the last ${timeRange} days`}
        >
          {trends?.orders && trends.orders.length > 0 ? (
            <SimpleBarChart
              data={trends.orders}
              labelKey="date"
              valueKey="count"
              height={250}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-secondary-500 dark:text-gray-400">
              <p>No order data available for this period</p>
            </div>
          )}
        </Card>

        {/* Revenue Trend */}
        <Card
          title="Revenue Over Time"
          description={`Revenue for the last ${timeRange} days`}
        >
          {trends?.revenue && trends.revenue.length > 0 ? (
            <SimpleLineChart
              data={trends.revenue}
              labelKey="date"
              valueKey="amount"
              height={250}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-secondary-500 dark:text-gray-400">
              <p>No revenue data available for this period</p>
            </div>
          )}
        </Card>
      </div>

      {/* Customer Analytics */}
      <Card
        title="Customer Insights"
        description="Customer metrics and engagement"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 rounded-lg transition-surface" style={{ backgroundColor: 'var(--surface-table)' }}>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {customers?.total || 0}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
              Total Customers
            </p>
          </div>
          <div className="text-center p-4 rounded-lg transition-surface" style={{ backgroundColor: 'var(--surface-table)' }}>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {customers?.new_this_month || 0}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
              New This Month
            </p>
          </div>
          <div className="text-center p-4 rounded-lg transition-surface" style={{ backgroundColor: 'var(--surface-table)' }}>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {customers?.returning || 0}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
              Returning Customers
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CafeAnalytics;

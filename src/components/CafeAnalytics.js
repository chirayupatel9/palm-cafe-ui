import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../contexts/FeatureContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { 
  TrendingUp, BarChart3, Users, DollarSign, 
  ShoppingCart, Calendar, Loader, AlertCircle 
} from 'lucide-react';
import Card from './ui/Card';
import Skeleton, { CardSkeleton } from './ui/Skeleton';
import LockedFeature from './ui/LockedFeature';
import Select from './ui/Select';

// Theme primary (matches theme.css) for Highcharts
const CHART_PRIMARY = '#6F4E37';

// Highcharts bar (column) chart - theme colors, tooltips
const HighchartsBarChart = ({ data, labelKey = 'date', valueKey = 'count', height = 250 }) => {
  const options = useMemo(() => {
    if (!data || data.length === 0) return null;
    const categories = data.map(item => {
      const d = new Date(item[labelKey]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const seriesData = data.map(item => item[valueKey] || 0);
    return {
      chart: {
        type: 'column',
        height,
        backgroundColor: 'transparent',
        style: { fontFamily: 'inherit' }
      },
      title: { text: null },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories,
        crosshair: true,
        labels: { style: { color: '#6B7280' } },
        lineColor: '#E5E7EB',
        tickColor: '#E5E7EB'
      },
      yAxis: {
        title: { text: null },
        labels: { style: { color: '#6B7280' } },
        gridLineColor: '#E5E7EB',
        gridLineDashStyle: 'Dot',
        min: 0,
        allowDecimals: false
      },
      tooltip: {
        shared: true,
        backgroundColor: '#FFFCF7',
        borderColor: '#E5E7EB',
        style: { color: '#2C1810' }
      },
      plotOptions: {
        column: {
          borderRadius: 4,
          borderWidth: 0,
          color: CHART_PRIMARY,
          pointPadding: 0.15,
          groupPadding: 0.1
        }
      },
      series: [{
        name: 'Orders',
        data: seriesData
      }]
    };
  }, [data, labelKey, valueKey, height]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-xl text-secondary-500 dark:text-gray-400" style={{ backgroundColor: 'var(--color-surface-variant)' }}>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface-variant)' }}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};

// Highcharts line chart - theme colors, tooltips, area
const HighchartsLineChart = ({ data, labelKey = 'date', valueKey = 'amount', height = 250, valuePrefix = '' }) => {
  const options = useMemo(() => {
    if (!data || data.length === 0) return null;
    const categories = data.map(item => {
      const d = new Date(item[labelKey]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const seriesData = data.map(item => item[valueKey] || 0);
    return {
      chart: {
        type: 'areaspline',
        height,
        backgroundColor: 'transparent',
        style: { fontFamily: 'inherit' }
      },
      title: { text: null },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories,
        crosshair: true,
        labels: { style: { color: '#6B7280' } },
        lineColor: '#E5E7EB',
        tickColor: '#E5E7EB'
      },
      yAxis: {
        title: { text: null },
        labels: { style: { color: '#6B7280' } },
        gridLineColor: '#E5E7EB',
        gridLineDashStyle: 'Dot',
        min: 0
      },
      tooltip: {
        shared: true,
        valuePrefix,
        backgroundColor: '#FFFCF7',
        borderColor: '#E5E7EB',
        style: { color: '#2C1810' }
      },
      plotOptions: {
        areaspline: {
          fillOpacity: 0.2,
          lineWidth: 2.5,
          marker: { radius: 4, symbol: 'circle' }
        }
      },
      series: [{
        name: 'Revenue',
        data: seriesData,
        color: CHART_PRIMARY,
        fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, CHART_PRIMARY], [1, 'rgba(111, 78, 55, 0.08)']] }
      }]
    };
  }, [data, labelKey, valueKey, height, valuePrefix]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-xl text-secondary-500 dark:text-gray-400" style={{ backgroundColor: 'var(--color-surface-variant)' }}>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface-variant)' }}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};

// Metric Card Component - same card style as rest of dashboard
const MetricCard = ({ title, value, subtitle, icon: Icon, trend, className = '' }) => {
  return (
    <Card className={className}>
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
  const { formatCurrency, currencySettings } = useCurrency();
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

      // Cap days at 365 to match backend validation (#12)
      const safeDays = Math.min(timeRange, 365);

      const [overviewRes, trendsRes, customersRes] = await Promise.all([
        axios.get('/analytics/overview'),
        axios.get(`/analytics/trends?days=${safeDays}`),
        axios.get('/analytics/customers')
      ]);
      
      setOverview(overviewRes.data);
      setTrends(trendsRes.data);
      setCustomers(customersRes.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('feature_denied');
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

  if (error === 'feature_denied' || error === 'access_denied' || error === 'fetch_error') {
    return (
      <LockedFeature 
        featureName="Analytics" 
        requiredPlan="Pro"
        description="Advanced insights and business intelligence to track performance, revenue trends, and customer behavior."
      />
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
          <Select
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '14', label: 'Last 14 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '60', label: 'Last 60 days' },
              { value: '90', label: 'Last 90 days' }
            ]}
            value={String(timeRange)}
            onChange={(v) => setTimeRange(Math.min(parseInt(v, 10), 365))}
            className="text-sm"
            placeholder="Time range"
          />
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
            <HighchartsBarChart
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
            <HighchartsLineChart
              data={trends.revenue}
              labelKey="date"
              valueKey="amount"
              height={250}
              valuePrefix={currencySettings?.currency_symbol ?? ''}
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
          <div className="card text-center">
            <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {customers?.total || 0}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
              Total Customers
            </p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {customers?.new_this_month || 0}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
              New This Month
            </p>
          </div>
          <div className="card text-center">
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

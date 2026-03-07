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
import Skeleton from './ui/Skeleton';
import LockedFeature from './ui/LockedFeature';
import Select from './ui/Select';

// Theme primary (matches theme.css) for Highcharts
const CHART_PRIMARY = '#334b26';

interface HighchartsBarChartProps {
  data: any[];
  labelKey?: string;
  valueKey?: string;
  height?: number;
}

const HighchartsBarChart: React.FC<HighchartsBarChartProps> = ({ data, labelKey = 'date', valueKey = 'count', height = 250 }) => {
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
        labels: { style: { color: '#b3af9b' } },
        lineColor: '#b3af9b',
        tickColor: '#b3af9b'
      },
      yAxis: {
        title: { text: null },
        labels: { style: { color: '#b3af9b' } },
        gridLineColor: '#b3af9b',
        gridLineDashStyle: 'Dot',
        min: 0,
        allowDecimals: false
      },
      tooltip: {
        shared: true,
        backgroundColor: '#e1e5df',
        borderColor: '#b3af9b',
        style: { color: '#0b0f05' }
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
      <div className="flex items-center justify-center h-48 rounded-xl text-[var(--color-on-surface-variant)]" style={{ backgroundColor: 'var(--color-surface-variant)' }}>
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
interface HighchartsLineChartProps {
  data: any[];
  labelKey?: string;
  valueKey?: string;
  height?: number;
  valuePrefix?: string;
}

const HighchartsLineChart: React.FC<HighchartsLineChartProps> = ({ data, labelKey = 'date', valueKey = 'amount', height = 250, valuePrefix = '' }) => {
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
        labels: { style: { color: '#b3af9b' } },
        lineColor: '#b3af9b',
        tickColor: '#b3af9b'
      },
      yAxis: {
        title: { text: null },
        labels: { style: { color: '#b3af9b' } },
        gridLineColor: '#b3af9b',
        gridLineDashStyle: 'Dot',
        min: 0
      },
      tooltip: {
        shared: true,
        valuePrefix,
        backgroundColor: '#e1e5df',
        borderColor: '#b3af9b',
        style: { color: '#0b0f05' }
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
        fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, CHART_PRIMARY], [1, 'rgba(51, 75, 38, 0.08)']] }
      }]
    };
  }, [data, labelKey, valueKey, height, valuePrefix]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-xl text-[var(--color-on-surface-variant)]" style={{ backgroundColor: 'var(--color-surface-variant)' }}>
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

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  trend?: number;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon: Icon, trend, className = '' }) => {
  return (
    <div className={`glass-card p-5 rounded-2xl ${className}`}>
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
          <div className="p-3 rounded-lg">
            <Icon className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
          </div>
        )}
      </div>
    </div>
  );
};

const CafeAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { hasFeature, loading: featuresLoading } = useFeatures();
  const { formatCurrency, currencySettings } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [customers, setCustomers] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
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
          <p className="text-[var(--color-on-surface-variant)]">Access denied. Admin or manager privileges required.</p>
        </div>
      </div>
    );
  }

  // Feature flag check
  if (featuresLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
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
              <h2 className="text-2xl font-bold text-[var(--color-on-surface)] flex items-center mb-2">
                <BarChart3 className="h-6 w-6 mr-2" />
                Analytics
              </h2>
              <p className="text-sm text-[var(--color-on-surface-variant)]">
                Business insights and performance metrics
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass-card p-5 rounded-2xl opacity-50">
                  <div className="h-20 rounded animate-pulse bg-[var(--surface-table)]/50" />
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card overflow-hidden rounded-2xl opacity-50">
                <div className="bg-[var(--surface-table)]/60 backdrop-blur-sm px-5 py-4 h-14" />
                <div className="h-64 p-4 rounded animate-pulse bg-[var(--surface-table)]/30" />
              </div>
              <div className="glass-card overflow-hidden rounded-2xl opacity-50">
                <div className="bg-[var(--surface-table)]/60 backdrop-blur-sm px-5 py-4 h-14" />
                <div className="h-64 p-4 rounded animate-pulse bg-[var(--surface-table)]/30" />
              </div>
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
          <h2 className="text-2xl font-bold text-[var(--color-on-surface)] flex items-center mb-2">
            <BarChart3 className="h-6 w-6 mr-2" />
            Analytics
          </h2>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Business insights and performance metrics
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-5 rounded-2xl">
              <div className="space-y-4">
                <Skeleton variant="text" width="60%" height="24px" />
                <Skeleton variant="text" lines={2} />
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="bg-[var(--surface-table)]/60 backdrop-blur-sm px-5 py-4 border-b border-[var(--color-outline)]/20 h-20" />
            <div className="p-4 space-y-4">
              <Skeleton variant="text" lines={5} />
            </div>
          </div>
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="bg-[var(--surface-table)]/60 backdrop-blur-sm px-5 py-4 border-b border-[var(--color-outline)]/20 h-20" />
            <div className="p-4 space-y-4">
              <Skeleton variant="text" lines={5} />
            </div>
          </div>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <BarChart3 className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[var(--color-on-surface)] truncate">Analytics</h1>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Business insights and performance metrics</p>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-[var(--color-on-surface-variant)]">Time Range:</label>
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
            className="text-sm select-trigger-glass select-trigger-glass-hover"
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
        <div className="glass-card overflow-hidden rounded-2xl shadow-sm">
          <div className="bg-[var(--surface-table)]/60 backdrop-blur-sm px-5 py-4 border-b border-[var(--color-outline)]/20">
            <h3 className="text-[var(--color-on-surface)] font-semibold">Orders Over Time</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">Order volume for the last {timeRange} days</p>
          </div>
          <div className="p-4">
            {trends?.orders && trends.orders.length > 0 ? (
              <HighchartsBarChart
                data={trends.orders}
                labelKey="date"
                valueKey="count"
                height={250}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-[var(--color-on-surface-variant)]">
                <p>No order data available for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="glass-card overflow-hidden rounded-2xl shadow-sm">
          <div className="bg-[var(--surface-table)]/60 backdrop-blur-sm px-5 py-4 border-b border-[var(--color-outline)]/20">
            <h3 className="text-[var(--color-on-surface)] font-semibold">Revenue Over Time</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">Revenue for the last {timeRange} days</p>
          </div>
          <div className="p-4">
            {trends?.revenue && trends.revenue.length > 0 ? (
              <HighchartsLineChart
                data={trends.revenue}
                labelKey="date"
                valueKey="amount"
                height={250}
                valuePrefix={currencySettings?.currency_symbol ?? ''}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-[var(--color-on-surface-variant)]">
                <p>No revenue data available for this period</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Analytics */}
      <div className="glass-card overflow-hidden rounded-2xl shadow-sm">
        <div className="bg-[var(--surface-table)]/60 backdrop-blur-sm px-5 py-4 border-b border-[var(--color-outline)]/20">
          <h3 className="text-[var(--color-on-surface)] font-semibold">Customer Insights</h3>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">Customer metrics and engagement</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-5 rounded-xl text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {customers?.total || 0}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                Total Customers
              </p>
            </div>
            <div className="glass-card p-5 rounded-xl text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {customers?.new_this_month || 0}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                New This Month
              </p>
            </div>
            <div className="glass-card p-5 rounded-xl text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {customers?.returning || 0}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                Returning Customers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CafeAnalytics;

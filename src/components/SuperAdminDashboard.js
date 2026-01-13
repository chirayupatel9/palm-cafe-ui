import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Users, ShoppingCart, TrendingUp, Clock, 
  CheckCircle, XCircle, ArrowRight, Settings, BarChart3 
} from 'lucide-react';
import { CardSkeleton } from './ui/Skeleton';

const SuperAdminDashboard = () => {
  const [cafesOverview, setCafesOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [cafeMetrics, setCafeMetrics] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCafesOverview();
  }, []);

  useEffect(() => {
    if (selectedCafe) {
      fetchCafeMetrics(selectedCafe.id);
    }
  }, [selectedCafe]);

  const fetchCafesOverview = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/superadmin/cafes/metrics/overview');
      setCafesOverview(response.data);
    } catch (error) {
      console.error('Error fetching cafes overview:', error);
      toast.error('Failed to load cafes overview');
    } finally {
      setLoading(false);
    }
  };

  const fetchCafeMetrics = async (cafeId) => {
    try {
      const response = await axios.get(`/superadmin/cafes/${cafeId}/metrics`);
      setCafeMetrics(response.data);
    } catch (error) {
      console.error('Error fetching cafe metrics:', error);
      toast.error('Failed to load cafe metrics');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary-700 dark:text-gray-100">
          Overview
        </h2>
        <p className="text-sm text-secondary-600 dark:text-gray-400 mt-1">
          System-wide metrics and cafe performance
        </p>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 dark:text-gray-400">Total Cafes</p>
              <p className="text-2xl font-bold text-secondary-700 dark:text-gray-100">
                {cafesOverview.length}
              </p>
            </div>
            <Building className="h-8 w-8 text-secondary-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 dark:text-gray-400">Active Cafes</p>
              <p className="text-2xl font-bold text-green-600">
                {cafesOverview.filter(c => c.is_active).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-secondary-700 dark:text-gray-100">
                {cafesOverview.reduce((sum, c) => sum + (c.metrics?.orders?.total || 0), 0)}
              </p>
            </div>
            <ShoppingCart className="h-8 w-8 text-secondary-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  cafesOverview.reduce((sum, c) => sum + (c.metrics?.orders?.total_revenue || 0), 0)
                )}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cafes List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-accent-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-secondary-700 dark:text-gray-100">
              All Cafes
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {cafesOverview.map((cafe) => (
                <div
                  key={cafe.id}
                  onClick={() => setSelectedCafe(cafe)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedCafe?.id === cafe.id
                      ? 'border-secondary-500 bg-secondary-50 dark:bg-gray-700'
                      : 'border-accent-200 dark:border-gray-700 hover:border-secondary-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-secondary-700 dark:text-gray-100">
                          {cafe.name}
                        </h4>
                        {cafe.is_active ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-secondary-500 dark:text-gray-400">
                        /{cafe.slug}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-secondary-600 dark:text-gray-400">
                        <span>👥 {cafe.metrics?.users?.total || 0} users</span>
                        <span>🛒 {cafe.metrics?.orders?.total || 0} orders</span>
                        <span>💰 {formatCurrency(cafe.metrics?.orders?.total_revenue || 0)}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-secondary-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Cafe Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-accent-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-secondary-700 dark:text-gray-100">
              {selectedCafe ? `${selectedCafe.name} - Details` : 'Select a Cafe'}
            </h3>
          </div>
          <div className="p-6">
            {selectedCafe && cafeMetrics ? (
              <div className="space-y-6">
                {/* Users Section */}
                <div>
                  <h4 className="font-semibold text-secondary-700 dark:text-gray-100 mb-3 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Users
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-accent-50 dark:bg-gray-700 p-3 rounded">
                      <p className="text-sm text-secondary-600 dark:text-gray-400">Total Users</p>
                      <p className="text-xl font-bold text-secondary-700 dark:text-gray-100">
                        {cafeMetrics.metrics.users.total}
                      </p>
                    </div>
                    <div className="bg-accent-50 dark:bg-gray-700 p-3 rounded">
                      <p className="text-sm text-secondary-600 dark:text-gray-400">Active (30d)</p>
                      <p className="text-xl font-bold text-secondary-700 dark:text-gray-100">
                        {cafeMetrics.metrics.users.active_last_30_days}
                      </p>
                    </div>
                  </div>
                  {Object.keys(cafeMetrics.metrics.users.by_role || {}).length > 0 && (
                    <div className="mt-3 space-y-1">
                      {Object.entries(cafeMetrics.metrics.users.by_role).map(([role, count]) => (
                        <div key={role} className="flex justify-between text-sm">
                          <span className="text-secondary-600 dark:text-gray-400 capitalize">{role}:</span>
                          <span className="font-semibold text-secondary-700 dark:text-gray-100">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Orders Section */}
                <div>
                  <h4 className="font-semibold text-secondary-700 dark:text-gray-100 mb-3 flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Orders
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-accent-50 dark:bg-gray-700 p-3 rounded">
                      <p className="text-sm text-secondary-600 dark:text-gray-400">Total Orders</p>
                      <p className="text-xl font-bold text-secondary-700 dark:text-gray-100">
                        {cafeMetrics.metrics.orders.total}
                      </p>
                    </div>
                    <div className="bg-accent-50 dark:bg-gray-700 p-3 rounded">
                      <p className="text-sm text-secondary-600 dark:text-gray-400">Today</p>
                      <p className="text-xl font-bold text-secondary-700 dark:text-gray-100">
                        {cafeMetrics.metrics.orders.today}
                      </p>
                    </div>
                    <div className="bg-accent-50 dark:bg-gray-700 p-3 rounded">
                      <p className="text-sm text-secondary-600 dark:text-gray-400">This Month</p>
                      <p className="text-xl font-bold text-secondary-700 dark:text-gray-100">
                        {cafeMetrics.metrics.orders.this_month}
                      </p>
                    </div>
                    <div className="bg-accent-50 dark:bg-gray-700 p-3 rounded">
                      <p className="text-sm text-secondary-600 dark:text-gray-400">Revenue</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(cafeMetrics.metrics.orders.total_revenue)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customers Section */}
                <div>
                  <h4 className="font-semibold text-secondary-700 dark:text-gray-100 mb-3 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Customers
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-accent-50 dark:bg-gray-700 p-3 rounded">
                      <p className="text-sm text-secondary-600 dark:text-gray-400">Total</p>
                      <p className="text-xl font-bold text-secondary-700 dark:text-gray-100">
                        {cafeMetrics.metrics.customers.total}
                      </p>
                    </div>
                    <div className="bg-accent-50 dark:bg-gray-700 p-3 rounded">
                      <p className="text-sm text-secondary-600 dark:text-gray-400">Active</p>
                      <p className="text-xl font-bold text-secondary-700 dark:text-gray-100">
                        {cafeMetrics.metrics.customers.active}
                      </p>
                    </div>
                    <div className="bg-accent-50 dark:bg-gray-700 p-3 rounded">
                      <p className="text-sm text-secondary-600 dark:text-gray-400">New (Month)</p>
                      <p className="text-xl font-bold text-secondary-700 dark:text-gray-100">
                        {cafeMetrics.metrics.customers.new_this_month}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Activity Section */}
                <div>
                  <h4 className="font-semibold text-secondary-700 dark:text-gray-100 mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Activity
                  </h4>
                  <div className="bg-accent-50 dark:bg-gray-700 p-4 rounded space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-secondary-600 dark:text-gray-400">Last Order:</span>
                      <span className="text-sm font-semibold text-secondary-700 dark:text-gray-100">
                        {formatDate(cafeMetrics.metrics.activity.last_order)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-secondary-600 dark:text-gray-400">Last Login:</span>
                      <span className="text-sm font-semibold text-secondary-700 dark:text-gray-100">
                        {formatDate(cafeMetrics.metrics.activity.last_user_login)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t border-accent-200 dark:border-gray-700">
                  <button
                    onClick={() => navigate(`/superadmin/cafes/${selectedCafe.id}`)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Manage Cafe</span>
                  </button>
                  <button
                    onClick={() => navigate(`/superadmin/cafes/${selectedCafe.id}/users`)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-secondary-100 hover:bg-secondary-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-secondary-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    <span>View Users</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-secondary-500 dark:text-gray-400">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a cafe from the list to view detailed metrics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

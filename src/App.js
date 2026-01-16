import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Receipt, Settings, Plus, Menu, X, LogOut, User, Package, Utensils, Users, CreditCard, ShoppingCart, Building, BarChart3, TrendingUp, FileText } from 'lucide-react';
import axios from 'axios';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CafeSettingsProvider, useCafeSettings } from './contexts/CafeSettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { FeatureProvider, useFeatures } from './contexts/FeatureContext';
import OrderPage from './components/OrderPage';
import MenuManagement from './components/MenuManagement';

import InvoiceHistory from './components/InvoiceHistory';

import InventoryManagement from './components/InventoryManagement';
import KitchenOrders from './components/KitchenOrders';
import CustomerManagement from './components/CustomerManagement';
import PaymentMethodManagement from './components/PaymentMethodManagement';
import CafeSettings from './components/CafeSettings';
import CafeUserManagement from './components/CafeUserManagement';
import CafeAnalytics from './components/CafeAnalytics';
import CafeInfo from './components/CafeInfo';
import CustomerApp from './components/CustomerApp';
import LandingPage from './components/LandingPage';
import CafeNotFound from './components/CafeNotFound';
import DarkModeToggle from './components/DarkModeToggle';
import Login from './components/Login';
import AdminRegister from './components/AdminRegister';
import ChefRegister from './components/ChefRegister';
import ReceptionRegister from './components/ReceptionRegister';
import ChefApp from './components/ChefApp';
import ReceptionApp from './components/ReceptionApp';
import SuperadminApp from './components/SuperadminApp';
import ImpersonationBanner from './components/ImpersonationBanner';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import DashboardRedirect from './components/DashboardRedirect';
import OnboardingGuard from './components/OnboardingGuard';

// Configure axios base URL - use environment variable or fallback to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
axios.defaults.baseURL = `${API_BASE_URL}/api`;

// Component to update document title based on user's cafe
const TitleUpdater = () => {
  const { user } = useAuth();
  
  React.useEffect(() => {
    if (user) {
      if (user.cafe_name) {
        document.title = user.cafe_name;
      } else if (user.role === 'superadmin') {
        document.title = 'Super Admin Dashboard';
      } else {
        document.title = 'Cafe Management System';
      }
    } else {
      document.title = 'Palm Cafe Management System';
    }
  }, [user]);
  
  return null;
};

function MainApp() {
  const [currentPage, setCurrentPage] = useState('order');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const { user, logout, impersonation } = useAuth();
  const { cafeSettings, loading: cafeSettingsLoading } = useCafeSettings();
  const { hasModuleAccess, loading: subscriptionLoading, subscription, isActive, getStatus } = useSubscription();
  const { hasFeature, loading: featuresLoading, features, plan, status } = useFeatures();
  
  // Use FeatureContext for feature checks (preferred), fallback to SubscriptionContext for backward compatibility
  const checkFeatureAccess = (featureKey) => {
    // Always use hasFeature if available (from FeatureContext)
    if (typeof hasFeature === 'function') {
      const hasAccess = hasFeature(featureKey);
      return hasAccess;
    }
    // Fallback to old method
    return hasModuleAccess ? hasModuleAccess(featureKey) : false;
  };

  // Memoize fetchMenuItems to prevent unnecessary re-renders
  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await axios.get('/menu');
      setMenuItems(response.data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load menu items';
      const errorCode = error.response?.data?.code;
      
      // Show user-friendly error message
      if (error.response?.status === 403) {
        if (errorCode === 'SUBSCRIPTION_INACTIVE') {
          const status = error.response?.data?.subscription_status || 'inactive';
          toast.error(`Subscription is ${status}. Please activate your subscription in Super Admin settings.`, {
            duration: 5000
          });
        } else if (errorCode === 'FEATURE_ACCESS_DENIED') {
          toast.error(`Menu management is not available on your current plan (${error.response?.data?.current_plan || 'FREE'}).`, {
            duration: 5000
          });
        } else {
          toast.error('Access denied. Please check your subscription status.', {
            duration: 5000
          });
        }
      } else if (error.response?.status === 401) {
        toast.error('Please log in to view menu items.');
      } else {
        toast.error(errorMessage);
      }
      
      // Set empty array on error so UI can still render
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, [subscription, isActive]);

  // Fetch menu items when subscription is loaded and user is ready
  useEffect(() => {
    // Only fetch if all contexts are loaded and user is authenticated
    if (!subscriptionLoading && !cafeSettingsLoading && !featuresLoading && user) {
      fetchMenuItems();
    }
  }, [subscriptionLoading, cafeSettingsLoading, featuresLoading, user, subscription, fetchMenuItems]);

  const updateMenuItem = async (id, updatedItem) => {
    try {
      await axios.put(`/menu/${id}`, updatedItem);
      toast.success('Menu item updated successfully');
      // Force refresh menu items
      await fetchMenuItems();
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast.error(error.response?.data?.error || 'Failed to update menu item');
    }
  };

  const addMenuItem = async (newItem) => {
    try {
      await axios.post('/menu', newItem);
      toast.success('Menu item added successfully');
      // Force refresh menu items
      await fetchMenuItems();
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast.error(error.response?.data?.error || 'Failed to add menu item');
    }
  };

  const deleteMenuItem = async (id) => {
    try {
      await axios.delete(`/menu/${id}`);
      toast.success('Menu item deleted successfully');
      // Force refresh menu items
      await fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error(error.response?.data?.error || 'Failed to delete menu item');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false); // Close mobile menu when page changes
  };

  const handleLogout = () => {
    logout();
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'order':
        return <OrderPage menuItems={menuItems} cart={cart} setCart={setCart} />;
      case 'kitchen':
        return <KitchenOrders cart={cart} setCart={setCart} />;
      case 'menu':
        return (
          <MenuManagement
            menuItems={menuItems}
            onUpdate={updateMenuItem}
            onAdd={addMenuItem}
            onDelete={deleteMenuItem}
          />
        );
      case 'customers':
        return <CustomerManagement />;
      case 'cafe-settings':
        // Allow access if: user is admin OR admin_can_access_settings is enabled
        const canAccessSettings = user?.role === 'admin' || cafeSettings?.admin_can_access_settings;
        return canAccessSettings ? <CafeSettings /> : <div>Access denied</div>;
      // Legacy routes - redirect to appropriate new routes
      case 'history':
        return <InvoiceHistory cart={cart} setCart={setCart} setCurrentPage={setCurrentPage} />;
      case 'inventory':
        return <InventoryManagement />;
      case 'analytics':
        return <CafeAnalytics />;
      case 'users':
        return <CafeUserManagement />;
      case 'advanced-reports':
        return <InvoiceHistory cart={cart} setCart={setCart} setCurrentPage={setCurrentPage} />;
      case 'payment-methods':
        return <PaymentMethodManagement />;
      default:
        return <OrderPage menuItems={menuItems} />;
    }
  };

  // Reorganized navigation structure: Dashboard, Orders, Menu, Users, Settings
  // PRO features: Analytics, Inventory, Advanced Reports, User Management
  const navigationItems = [
    { id: 'order', label: 'Dashboard', icon: BarChart3, module: 'orders', primary: true, show: checkFeatureAccess('orders') },
    { id: 'kitchen', label: 'Orders', icon: Receipt, module: 'orders', show: cafeSettings?.show_kitchen_tab !== false && checkFeatureAccess('orders') },
    { id: 'menu', label: 'Menu', icon: Utensils, module: 'menu_management', show: cafeSettings?.admin_can_manage_menu !== false && checkFeatureAccess('menu_management') },
    { id: 'customers', label: 'Customers', icon: Users, module: 'customers', show: cafeSettings?.show_customers_tab !== false && checkFeatureAccess('customers') },
    // PRO Features
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, module: 'analytics', show: checkFeatureAccess('analytics') },
    { id: 'inventory', label: 'Inventory', icon: Package, module: 'inventory', show: checkFeatureAccess('inventory') },
    { id: 'users', label: 'User Management', icon: User, module: 'users', show: checkFeatureAccess('users') },
    { id: 'advanced-reports', label: 'Reports', icon: FileText, module: 'advanced_reports', show: checkFeatureAccess('advanced_reports') },
    { id: 'cafe-settings', label: 'Settings', icon: Settings, module: 'settings', show: (user?.role === 'admin' || cafeSettings?.admin_can_access_settings !== false) && checkFeatureAccess('settings') },
  ].filter(item => item.show !== false); // Filter out items that should be hidden

  if (loading || cafeSettingsLoading || subscriptionLoading || featuresLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center surface-page">
        <CafeInfo logoSize="h-16 w-16" nameSize="text-xl" className="mb-4" />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
        <p className="mt-4" style={{ color: 'var(--color-on-surface-variant)' }}>Loading {cafeSettings.cafe_name}...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen surface-page ${impersonation?.isImpersonating ? 'pt-16' : ''}`}>
      <Toaster position="top-right" />
    
    {/* Header - Distinct navigation surface */}
    <header className="surface-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <CafeInfo />
            {cart && cart.length > 0 && (
              <div className="ml-4 flex items-center space-x-1 text-sm" style={{ color: 'var(--on-surface-nav)' }}>
                <ShoppingCart className="h-4 w-4" />
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ 
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  boxShadow: 'var(--elevation-1)'
                }}>
                  {cart.length} items
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
              {/* User info */}
              <div className="hidden sm:flex items-center space-x-2 text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                <User className="h-4 w-4" />
                <span>{user?.username}</span>
              </div>
            
            {/* Dark mode toggle */}
            <DarkModeToggle />
            
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-md transition-colors"
              style={{ 
                color: 'var(--color-on-surface-variant)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-container)';
                e.currentTarget.style.color = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-on-surface-variant)';
              }}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md transition-colors"
              style={{ color: 'var(--color-on-surface-variant)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-container)';
                e.currentTarget.style.color = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-on-surface-variant)';
              }}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* Mobile Navigation Menu - Distinct surface */}
    {mobileMenuOpen && (
      <div className="lg:hidden surface-nav" style={{ 
        borderTop: '1px solid var(--color-outline)'
      }}>
        <div className="px-4 py-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  currentPage === item.id
                    ? ''
                    : ''
                }`}
                style={currentPage === item.id ? {
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  boxShadow: 'var(--elevation-1)'
                } : {
                  color: 'var(--color-on-surface-variant)'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== item.id) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-container)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-on-surface-variant)';
                  }
                }}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </button>
            );
          })}
          
        </div>
      </div>
    )}

    {/* Desktop Navigation - Distinct elevated surface */}
    <nav className="hidden lg:block surface-nav p-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`flex items-center px-5 py-1 text-sm font-medium ${
                  currentPage === item.id
                    ? 'nav-active'
                    : 'nav-inactive'
                }`}
                aria-current={currentPage === item.id ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>

    {/* Main Content - Container surface with distinct background */}
    <main className="surface-container max-w-7xl mx-auto my-8 sm:my-12 px-4 sm:px-6 lg:px-8">
      {renderPage()}
    </main>
      </div>
  );
}

function App() {
  // Title will be updated by AuthContext when user logs in
  // This is just a fallback for when no user is logged in
  React.useEffect(() => {
    // Only set default title if no user is logged in
    // AuthContext will update it when user logs in
    if (!localStorage.getItem('token')) {
      document.title = 'Palm Cafe Management System';
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <TitleUpdater />
        <DarkModeProvider>
          <CurrencyProvider>
            <CafeSettingsProvider>
              <ThemeProvider>
                <SubscriptionProvider>
                  <FeatureProvider>
                    <ImpersonationBanner />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin/register" element={
                    <ProtectedRoute>
                      <AdminRegister />
                    </ProtectedRoute>
                  } />
                  <Route path="/chef/register" element={
                    <ProtectedRoute>
                      <ChefRegister />
                    </ProtectedRoute>
                  } />
                  <Route path="/reception/register" element={
                    <ProtectedRoute>
                      <ReceptionRegister />
                    </ProtectedRoute>
                  } />
                  {/* Customer routes - slug-based */}
                  <Route path="/cafe/:slug" element={<CustomerApp />} />
                  <Route path="/cafe/:slug/menu" element={<CustomerApp />} />
                  <Route path="/cafe/:slug/order" element={<CustomerApp />} />
                  {/* Legacy customer route - redirect to default */}
                  <Route path="/customer" element={<Navigate to="/cafe/default" replace />} />
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <OnboardingGuard>
                        <RoleBasedRedirect>
                          <MainApp />
                        </RoleBasedRedirect>
                      </OnboardingGuard>
                    </ProtectedRoute>
                  } />
                  <Route path="/chef" element={
                    <ProtectedRoute>
                      <OnboardingGuard>
                        <RoleBasedRedirect>
                          <ChefApp />
                        </RoleBasedRedirect>
                      </OnboardingGuard>
                    </ProtectedRoute>
                  } />
                  <Route path="/reception" element={
                    <ProtectedRoute>
                      <OnboardingGuard>
                        <RoleBasedRedirect>
                          <ReceptionApp />
                        </RoleBasedRedirect>
                      </OnboardingGuard>
                    </ProtectedRoute>
                  } />
                  <Route path="/superadmin" element={
                    <ProtectedRoute>
                      <RoleBasedRedirect>
                        <SuperadminApp />
                      </RoleBasedRedirect>
                    </ProtectedRoute>
                  } />
                  <Route path="/superadmin/cafes" element={
                    <ProtectedRoute>
                      <RoleBasedRedirect>
                        <SuperadminApp />
                      </RoleBasedRedirect>
                    </ProtectedRoute>
                  } />
                  <Route path="/superadmin/cafes/:cafeId" element={
                    <ProtectedRoute>
                      <RoleBasedRedirect>
                        <SuperadminApp />
                      </RoleBasedRedirect>
                    </ProtectedRoute>
                  } />
                  <Route path="/superadmin/cafes/:cafeId/users" element={
                    <ProtectedRoute>
                      <RoleBasedRedirect>
                        <SuperadminApp />
                      </RoleBasedRedirect>
                    </ProtectedRoute>
                  } />
                  <Route path="/superadmin/users" element={
                    <ProtectedRoute>
                      <RoleBasedRedirect>
                        <SuperadminApp />
                      </RoleBasedRedirect>
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <OnboardingGuard>
                        <DashboardRedirect />
                      </OnboardingGuard>
                    </ProtectedRoute>
                  } />
                  <Route path="/onboarding" element={
                    <ProtectedRoute>
                      <OnboardingGuard>
                        <div />
                      </OnboardingGuard>
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                  </FeatureProvider>
                </SubscriptionProvider>
              </ThemeProvider>
            </CafeSettingsProvider>
          </CurrencyProvider>
        </DarkModeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 
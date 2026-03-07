import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import SwipeableToast from './components/ui/SwipeableToast';
import { Receipt, Settings, Menu, X, LogOut, User, Package, Utensils, Users, ShoppingCart, BarChart3, TrendingUp, FileText } from 'lucide-react';
import axios from 'axios';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CafeSettingsProvider, useCafeSettings } from './contexts/CafeSettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { FeatureProvider, useFeatures } from './contexts/FeatureContext';
import CafeInfo from './components/CafeInfo';
import DarkModeToggle from './components/DarkModeToggle';
import ImpersonationBanner from './components/ImpersonationBanner';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import DashboardRedirect from './components/DashboardRedirect';
import OnboardingGuard from './components/OnboardingGuard';
import { PillBase, type NavItem } from './components/ui/3d-adaptive-navigation-bar';
import { GlassButton } from './components/ui/GlassButton';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_PATH = '/api';
axios.defaults.baseURL = `${API_BASE_URL}${API_PATH}`;

const OrderPage = lazy(() => import('./components/OrderPage'));
const MenuManagement = lazy(() => import('./components/MenuManagement'));
const InvoiceHistory = lazy(() => import('./components/InvoiceHistory'));
const InventoryManagement = lazy(() => import('./components/InventoryManagement'));
const KitchenOrders = lazy(() => import('./components/KitchenOrders'));
const CustomerManagement = lazy(() => import('./components/CustomerManagement'));
const CafeSettings = lazy(() => import('./components/CafeSettings'));
const CafeUserManagement = lazy(() => import('./components/CafeUserManagement'));
const CafeAnalytics = lazy(() => import('./components/CafeAnalytics'));
const CustomerApp = lazy(() => import('./components/CustomerApp'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const Login = lazy(() => import('./components/Login'));
const AdminRegister = lazy(() => import('./components/AdminRegister'));
const ChefRegister = lazy(() => import('./components/ChefRegister'));
const ReceptionRegister = lazy(() => import('./components/ReceptionRegister'));
const ChefApp = lazy(() => import('./components/ChefApp'));
const ReceptionApp = lazy(() => import('./components/ReceptionApp'));
const SuperadminApp = lazy(() => import('./components/SuperadminApp'));
const StockCategoryListDemo = lazy(() => import('./components/StockCategoryListDemo'));

const navigationItems = [
  { id: 'order', label: 'Dashboard', icon: BarChart3, module: 'orders', primary: true },
  { id: 'kitchen', label: 'Orders', icon: Receipt, module: 'orders' },
  { id: 'menu', label: 'Menu', icon: Utensils, module: 'menu_management' },
  { id: 'customers', label: 'Customers', icon: Users, module: 'customers' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, module: 'analytics' },
  { id: 'inventory', label: 'Inventory', icon: Package, module: 'inventory' },
  { id: 'users', label: 'User Management', icon: User, module: 'users' },
  { id: 'advanced-reports', label: 'Reports', icon: FileText, module: 'advanced_reports' },
  { id: 'cafe-settings', label: 'Settings', icon: Settings, module: 'settings' }
];

const SectionLoader = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="w-full flex items-center justify-center py-8" style={{ color: 'var(--color-on-surface-variant)' }}>
    {message}
  </div>
);

const CustomerRedirect = () => {
  const { user } = useAuth();
  const slug = user?.cafe_slug ? user.cafe_slug : 'default';
  return <Navigate to={`/cafe/${slug}`} replace />;
};

const TitleUpdater = () => {
  const { user } = useAuth();
  React.useEffect(() => {
    if (user) {
      if (user.role === 'superadmin') {
        document.title = 'Super Admin Dashboard';
      } else if (user.cafe_name) {
        document.title = user.cafe_name;
      } else {
        document.title = 'Cafe Management System';
      }
    } else {
      document.title = 'Cafe Management System';
    }
  }, [user]);
  return null;
};

function MainApp() {
  const [currentPage, setCurrentPage] = useState('order');
  const [menuItems, setMenuItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cart, setCart] = useState<unknown[]>([]);
  const { user, logout, impersonation } = useAuth();
  const { cafeSettings, loading: cafeSettingsLoading } = useCafeSettings();
  const { hasModuleAccess, loading: subscriptionLoading } = useSubscription();
  const { hasFeature, loading: featuresLoading } = useFeatures();

  const checkFeatureAccess = useCallback((featureKey: string): boolean => {
    if (typeof hasFeature === 'function') {
      return hasFeature(featureKey);
    }
    return hasModuleAccess ? hasModuleAccess(featureKey) : false;
  }, [hasFeature, hasModuleAccess]);

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await axios.get('/admin/menu');
      setMenuItems(response.data || []);
    } catch (error: unknown) {
      console.error('Error fetching menu items:', error);
      const err = error as { response?: { data?: { error?: string; code?: string; subscription_status?: string }; status?: number }; message?: string };
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load menu items';
      const errorCode = err.response?.data?.code;
      if (err.response?.status === 403) {
        if (errorCode === 'SUBSCRIPTION_INACTIVE') {
          const status = err.response?.data?.subscription_status || 'inactive';
          toast.error(`Subscription is ${status}. Please activate your subscription in Super Admin settings.`, { duration: 5000 });
        } else if (errorCode === 'FEATURE_ACCESS_DENIED') {
          toast.error('Locked feature. Upgrade your plan to access.', { duration: 4000 });
        } else {
          toast.error('Access denied. Please check your subscription status.', { duration: 5000 });
        }
      } else if (err.response?.status === 401) {
        toast.error('Please log in to view menu items.');
      } else {
        toast.error(errorMessage);
      }
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!subscriptionLoading && !cafeSettingsLoading && !featuresLoading && user) {
      fetchMenuItems();
    }
  }, [subscriptionLoading, cafeSettingsLoading, featuresLoading, user, fetchMenuItems]);

  const updateMenuItem = async (id: string | number, updatedItem: unknown) => {
    try {
      await axios.put(`/menu/${String(id)}`, updatedItem);
      toast.success('Menu item updated successfully');
      await fetchMenuItems();
    } catch (error: unknown) {
      console.error('Error updating menu item:', error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to update menu item');
    }
  };

  const addMenuItem = async (newItem: unknown) => {
    try {
      await axios.post('/menu', newItem);
      toast.success('Menu item added successfully');
      await fetchMenuItems();
    } catch (error: unknown) {
      console.error('Error adding menu item:', error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to add menu item');
    }
  };

  const deleteMenuItem = async (id: string | number) => {
    try {
      await axios.delete(`/menu/${String(id)}`);
      toast.success('Menu item deleted successfully');
      await fetchMenuItems();
    } catch (error: unknown) {
      console.error('Error deleting menu item:', error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to delete menu item');
    }
  };

  const handlePageChange = useCallback((page: string) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const activePage = useMemo(() => {
    switch (currentPage) {
      case 'order':
        return <OrderPage menuItems={menuItems} cart={cart} setCart={setCart} />;
      case 'kitchen':
        return <KitchenOrders cart={cart} setCart={setCart} />;
      case 'menu':
        return <MenuManagement menuItems={menuItems} onUpdate={updateMenuItem} onAdd={addMenuItem} onDelete={deleteMenuItem} />;
      case 'customers':
        return <CustomerManagement />;
      case 'cafe-settings': {
        const canAccessSettings = user?.role === 'admin' || cafeSettings?.admin_can_access_settings;
        return canAccessSettings ? <CafeSettings /> : <div>Access denied</div>;
      }
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
      default:
        return <OrderPage menuItems={menuItems} cart={cart} setCart={setCart} />;
    }
  }, [currentPage, menuItems, cart, user?.role, cafeSettings?.admin_can_access_settings]);

  const pillNavItems: NavItem[] = useMemo(() => (
    navigationItems
      .filter((item) => checkFeatureAccess(item.module))
      .map((item) => ({ id: item.id, label: item.label }))
  ), [checkFeatureAccess]);

  if (loading || cafeSettingsLoading || subscriptionLoading || featuresLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center surface-page">
        <CafeInfo logoSize="h-16 w-16" nameSize="text-xl" className="mb-4" />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
        <p className="mt-4" style={{ color: 'var(--color-on-surface-variant)' }}>Loading {cafeSettings?.cafe_name}...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col surface-page ${impersonation?.isImpersonating ? 'pt-16' : ''}`}>
      <header className="surface-nav shrink-0" style={{ boxShadow: 'none', backgroundColor: 'var(--surface-page)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <CafeInfo />
              {cart && cart.length > 0 && (
                <div className="ml-4 flex items-center space-x-1 text-sm" style={{ color: 'var(--on-surface-nav)' }}>
                  <ShoppingCart className="h-4 w-4" />
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', boxShadow: 'var(--elevation-1)' }}>
                    {cart.length} items
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-2 text-xs uppercase tracking-wide glass-card px-3 py-1.5 rounded-full border border-[var(--color-outline-variant)]" style={{ color: 'var(--color-on-surface-variant)' }}>
                <User className="h-4 w-4" />
                <span>{String(user?.username || '').toUpperCase()}</span>
              </div>
              <DarkModeToggle />
              <GlassButton onClick={handleLogout} size="icon" className="glass-button-secondary [&_.glass-button]:!bg-transparent [&_.glass-button]:!border-transparent [&_.glass-button]:text-[var(--color-on-surface-variant)] [&_.glass-button:hover]:!bg-[var(--color-primary-container)] [&_.glass-button:hover]:!text-[var(--color-primary)]" title="Logout">
                <LogOut className="h-5 w-5" />
              </GlassButton>
              <GlassButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)} size="icon" className="lg:hidden glass-button-secondary [&_.glass-button]:!bg-transparent [&_.glass-button]:!border-transparent [&_.glass-button]:text-[var(--color-on-surface-variant)]" aria-label="Toggle menu">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </GlassButton>
            </div>
          </div>
        </div>
      </header>
      {mobileMenuOpen && (
        <div className="lg:hidden surface-nav" style={{ borderTop: '1px solid var(--color-outline)', boxShadow: 'none', backgroundColor: 'var(--surface-page)' }}>
          <div className="px-4 py-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <GlassButton
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  size="default"
                  className={`w-full ${isActive ? 'glass-button-primary' : 'glass-button-secondary'}`}
                  contentClassName="flex items-center justify-center gap-3"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </GlassButton>
              );
            })}
          </div>
        </div>
      )}
      <nav className="hidden lg:block surface-nav p-2 shrink-0" style={{ boxShadow: 'none', backgroundColor: 'var(--surface-page)' }}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center">
          <PillBase
            items={pillNavItems}
            activeId={currentPage}
            onSelect={handlePageChange}
            alwaysExpanded
          />
        </div>
      </nav>
      <main className="surface-container flex-1 max-w-7xl mx-auto my-8 sm:my-12 px-4 sm:px-6 lg:px-8 w-full">
        <Suspense fallback={<SectionLoader />}>
          {activePage}
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  React.useEffect(() => {
    if (!localStorage.getItem('token')) {
      document.title = 'Cafe Management System';
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
                    <Toaster
                      position="bottom-center"
                      reverseOrder={false}
                      gutter={12}
                      containerClassName="palm-toast-container"
                      toastOptions={{
                        className: 'palm-toast',
                        duration: 3200,
                        style: { padding: 0, margin: 0, background: 'transparent', boxShadow: 'none', border: 'none', maxWidth: 380 }
                      }}
                    >
                      {(t) => <SwipeableToast toast={t as any} position="bottom-center" />}
                    </Toaster>
                    <ImpersonationBanner />
                    <Suspense fallback={<SectionLoader message="Loading page..." />}>
                      <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/demo/stock-categories" element={<StockCategoryListDemo />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/admin/register" element={<ProtectedRoute><AdminRegister /></ProtectedRoute>} />
                        <Route path="/chef/register" element={<ProtectedRoute><ChefRegister /></ProtectedRoute>} />
                        <Route path="/reception/register" element={<ProtectedRoute><ReceptionRegister /></ProtectedRoute>} />
                        <Route path="/cafe/:slug" element={<CustomerApp />} />
                        <Route path="/cafe/:slug/menu" element={<CustomerApp />} />
                        <Route path="/cafe/:slug/order" element={<CustomerApp />} />
                        <Route path="/customer" element={<CustomerRedirect />} />
                        <Route path="/admin" element={<ProtectedRoute><OnboardingGuard><RoleBasedRedirect><MainApp /></RoleBasedRedirect></OnboardingGuard></ProtectedRoute>} />
                        <Route path="/chef" element={<ProtectedRoute><OnboardingGuard><RoleBasedRedirect><ChefApp /></RoleBasedRedirect></OnboardingGuard></ProtectedRoute>} />
                        <Route path="/reception" element={<ProtectedRoute><OnboardingGuard><RoleBasedRedirect><ReceptionApp /></RoleBasedRedirect></OnboardingGuard></ProtectedRoute>} />
                        <Route path="/superadmin" element={<ProtectedRoute><RoleBasedRedirect><SuperadminApp /></RoleBasedRedirect></ProtectedRoute>} />
                        <Route path="/superadmin/cafes" element={<ProtectedRoute><RoleBasedRedirect><SuperadminApp /></RoleBasedRedirect></ProtectedRoute>} />
                        <Route path="/superadmin/cafes/:cafeId" element={<ProtectedRoute><RoleBasedRedirect><SuperadminApp /></RoleBasedRedirect></ProtectedRoute>} />
                        <Route path="/superadmin/cafes/:cafeId/users" element={<ProtectedRoute><RoleBasedRedirect><SuperadminApp /></RoleBasedRedirect></ProtectedRoute>} />
                        <Route path="/superadmin/users" element={<ProtectedRoute><RoleBasedRedirect><SuperadminApp /></RoleBasedRedirect></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute><OnboardingGuard><DashboardRedirect /></OnboardingGuard></ProtectedRoute>} />
                        <Route path="/onboarding" element={<ProtectedRoute><OnboardingGuard><div /></OnboardingGuard></ProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
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

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Receipt, Settings, Plus, Menu, X, LogOut, User, Package, Utensils, Users, CreditCard, ShoppingCart, Building } from 'lucide-react';
import axios from 'axios';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CafeSettingsProvider, useCafeSettings } from './contexts/CafeSettingsContext';
import { ColorSchemeProvider } from './contexts/ColorSchemeContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import OrderPage from './components/OrderPage';
import MenuManagement from './components/MenuManagement';

import InvoiceHistory from './components/InvoiceHistory';

import InventoryManagement from './components/InventoryManagement';
import KitchenOrders from './components/KitchenOrders';
import CustomerManagement from './components/CustomerManagement';
import PaymentMethodManagement from './components/PaymentMethodManagement';
import CafeSettings from './components/CafeSettings';
import CafeInfo from './components/CafeInfo';
import CustomerApp from './components/CustomerApp';
import LandingPage from './components/LandingPage';
import DarkModeToggle from './components/DarkModeToggle';
import Login from './components/Login';
import AdminRegister from './components/AdminRegister';
import ChefRegister from './components/ChefRegister';
import ReceptionRegister from './components/ReceptionRegister';
import ChefApp from './components/ChefApp';
import ReceptionApp from './components/ReceptionApp';
import SuperadminApp from './components/SuperadminApp';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import DashboardRedirect from './components/DashboardRedirect';

// Configure axios base URL - use environment variable or fallback to HTTPS API
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
  const { user, logout } = useAuth();
  const { cafeSettings, loading: cafeSettingsLoading } = useCafeSettings();
  const { hasModuleAccess, loading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    fetchMenuItems();
  }, []);



  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/menu');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMenuItem = async (id, updatedItem) => {
    try {
      await axios.put(`/menu/${id}`, updatedItem);
      fetchMenuItems();
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  };

  const addMenuItem = async (newItem) => {
    try {
      await axios.post('/menu', newItem);
      fetchMenuItems();
    } catch (error) {
      console.error('Error adding menu item:', error);
    }
  };

  const deleteMenuItem = async (id) => {
    try {
      await axios.delete(`/menu/${id}`);
      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
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
      case 'menu':
        return (
          <MenuManagement
            menuItems={menuItems}
            onUpdate={updateMenuItem}
            onAdd={addMenuItem}
            onDelete={deleteMenuItem}
          />
        );

      case 'history':
        return <InvoiceHistory cart={cart} setCart={setCart} setCurrentPage={setCurrentPage} />;

      case 'inventory':
        return <InventoryManagement />;
      case 'kitchen':
        return <KitchenOrders cart={cart} setCart={setCart} />;
      case 'customers':
        return <CustomerManagement />;
      case 'payment-methods':
        return <PaymentMethodManagement />;
      case 'cafe-settings':
        return cafeSettings?.admin_can_access_settings ? <CafeSettings /> : <div>Access denied</div>;
      default:
        return <OrderPage menuItems={menuItems} />;
    }
  };

  const navigationItems = [
    { id: 'order', label: 'New Order', icon: Plus, module: 'orders' },
    ...(cafeSettings?.show_kitchen_tab && hasModuleAccess('orders') ? [{ id: 'kitchen', label: 'Kitchen Orders', icon: Utensils, module: 'orders' }] : []),
    ...(cafeSettings?.show_customers_tab && hasModuleAccess('customers') ? [{ id: 'customers', label: 'Customers', icon: Users, module: 'customers' }] : []),
    ...(cafeSettings?.show_payment_methods_tab && hasModuleAccess('payment_methods') ? [{ id: 'payment-methods', label: 'Payment, Currency & Tax', icon: CreditCard, module: 'payment_methods' }] : []),
    ...(cafeSettings?.admin_can_access_settings && hasModuleAccess('settings') ? [{ id: 'cafe-settings', label: 'Cafe Settings', icon: Building, module: 'settings' }] : []),
    ...(cafeSettings?.admin_can_manage_menu && hasModuleAccess('menu_management') ? [{ id: 'menu', label: 'Menu Management', icon: Settings, module: 'menu_management' }] : []),
    ...(cafeSettings?.admin_can_manage_inventory && hasModuleAccess('inventory') ? [{ id: 'inventory', label: 'Inventory', icon: Package, module: 'inventory' }] : []),
    ...(cafeSettings?.admin_can_view_reports && hasModuleAccess('advanced_reports') ? [{ id: 'history', label: 'Invoice History', icon: Receipt, module: 'advanced_reports' }] : []),
  ];

  if (loading || cafeSettingsLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-accent-50 dark:bg-gray-900">
        <CafeInfo logoSize="h-16 w-16" nameSize="text-xl" className="mb-4" />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
        <p className="mt-4 text-secondary-600 dark:text-gray-400">Loading {cafeSettings.cafe_name}...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50 dark:bg-gray-900">
      <Toaster position="top-right" />
    
    {/* Header */}
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-accent-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <CafeInfo />
            {cart && cart.length > 0 && (
              <div className="ml-4 flex items-center space-x-1 text-sm text-secondary-600 dark:text-gray-400">
                <ShoppingCart className="h-4 w-4" />
                <span className="bg-secondary-100 text-secondary-800 px-2 py-1 rounded-full text-xs font-medium">
                  {cart.length} items
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
              {/* User info */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-secondary-600 dark:text-gray-400">
                <User className="h-4 w-4" />
                <span>{user?.username}</span>
              </div>
              
              {/* Customer Interface Link */}
              <a
                href="/customer"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center space-x-1 text-sm text-secondary-600 hover:text-secondary-700 dark:text-gray-400 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-accent-100"
                title="Open Customer Interface"
              >
                <span>👥</span>
                <span>Customer View</span>
              </a>

              {/* Chef Interface Link */}
              <a
                href="/chef"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center space-x-1 text-sm text-secondary-600 hover:text-secondary-700 dark:text-gray-400 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-accent-100"
                title="Open Chef Interface"
              >
                <span>👨‍🍳</span>
                <span>Chef View</span>
              </a>

              {/* Admin Registration Link */}
              <a
                href="/admin/register"
                className="hidden sm:flex items-center space-x-1 text-sm text-secondary-600 hover:text-secondary-700 dark:text-gray-400 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-accent-100"
                title="Register New Admin"
              >
                <span>👑</span>
                <span>Add Admin</span>
              </a>

              {/* Chef Registration Link */}
              <a
                href="/chef/register"
                className="hidden sm:flex items-center space-x-1 text-sm text-secondary-600 hover:text-secondary-700 dark:text-gray-400 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-accent-100"
                title="Register New Chef"
              >
                <span>👨‍🍳</span>
                <span>Add Chef</span>
              </a>

              {/* Reception Registration Link */}
              <a
                href="/reception/register"
                className="hidden sm:flex items-center space-x-1 text-sm text-secondary-600 hover:text-secondary-700 dark:text-gray-400 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-accent-100"
                title="Register New Reception"
              >
                <span>📞</span>
                <span>Add Reception</span>
              </a>
            
            {/* Dark mode toggle */}
            <DarkModeToggle />
            
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-secondary-600 hover:text-secondary-700 hover:bg-accent-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-secondary-600 hover:text-secondary-700 hover:bg-accent-100"
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

    {/* Mobile Navigation Menu */}
    {mobileMenuOpen && (
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-accent-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 py-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-secondary-500 text-white'
                    : 'text-secondary-600 hover:bg-accent-100'
                }`}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </button>
            );
          })}
          
          {/* Additional mobile menu items */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <a
              href="/customer"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center px-3 py-3 text-sm font-medium text-secondary-600 hover:bg-accent-100 rounded-lg transition-colors"
            >
              <span className="mr-3">👥</span>
              Customer View
            </a>
            <a
              href="/chef"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center px-3 py-3 text-sm font-medium text-secondary-600 hover:bg-accent-100 rounded-lg transition-colors"
            >
              <span className="mr-3">👨‍🍳</span>
              Chef View
            </a>
            <a
              href="/admin/register"
              className="w-full flex items-center px-3 py-3 text-sm font-medium text-secondary-600 hover:bg-accent-100 rounded-lg transition-colors"
            >
              <span className="mr-3">👑</span>
              Add Admin
            </a>
            <a
              href="/chef/register"
              className="w-full flex items-center px-3 py-3 text-sm font-medium text-secondary-600 hover:bg-accent-100 rounded-lg transition-colors"
            >
              <span className="mr-3">👨‍🍳</span>
              Add Chef
            </a>
            <a
              href="/reception/register"
              className="w-full flex items-center px-3 py-3 text-sm font-medium text-secondary-600 hover:bg-accent-100 rounded-lg transition-colors"
            >
              <span className="mr-3">📞</span>
              Add Reception
            </a>
          </div>
        </div>
      </div>
    )}

    {/* Desktop Navigation */}
    <nav className="hidden lg:block bg-white dark:bg-gray-800 shadow-sm border-b border-accent-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  currentPage === item.id
                    ? 'nav-active'
                    : 'nav-inactive'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>

    {/* Main Content */}
    <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
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
              <SubscriptionProvider>
                <ColorSchemeProvider>
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
                  <Route path="/customer" element={<CustomerApp />} />
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <RoleBasedRedirect>
                        <MainApp />
                      </RoleBasedRedirect>
                    </ProtectedRoute>
                  } />
                  <Route path="/chef" element={
                    <ProtectedRoute>
                      <RoleBasedRedirect>
                        <ChefApp />
                      </RoleBasedRedirect>
                    </ProtectedRoute>
                  } />
                  <Route path="/reception" element={
                    <ProtectedRoute>
                      <RoleBasedRedirect>
                        <ReceptionApp />
                      </RoleBasedRedirect>
                    </ProtectedRoute>
                  } />
                  <Route path="/superadmin" element={
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
                      <DashboardRedirect />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </ColorSchemeProvider>
              </SubscriptionProvider>
            </CafeSettingsProvider>
          </CurrencyProvider>
        </DarkModeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 
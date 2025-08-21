import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { 
  Receipt, Settings, Plus, Menu, X, LogOut, User, Package, Utensils, 
  Users, CreditCard, ShoppingCart, Building, Shield, Crown 
} from 'lucide-react';
import axios from 'axios';
import OrderPage from './OrderPage';
import MenuManagement from './MenuManagement';
import InvoiceHistory from './InvoiceHistory';
import InventoryManagement from './InventoryManagement';
import KitchenOrders from './KitchenOrders';
import CustomerManagement from './CustomerManagement';
import PaymentMethodManagement from './PaymentMethodManagement';
import CafeSettings from './CafeSettings';
import CafeInfo from './CafeInfo';
import DarkModeToggle from './DarkModeToggle';
import AdminRegister from './AdminRegister';
import ChefRegister from './ChefRegister';
import ReceptionRegister from './ReceptionRegister';
import SuperadminRegister from './SuperadminRegister';

const SuperadminApp = () => {
  const [currentPage, setCurrentPage] = useState('order');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const { user, logout } = useAuth();
  const { cafeSettings, loading: cafeSettingsLoading } = useCafeSettings();
  const navigate = useNavigate();

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
    setMobileMenuOpen(false);
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
        return <CafeSettings />;
      case 'user-management':
        return <UserManagement />;
      default:
        return <OrderPage menuItems={menuItems} />;
    }
  };

  // User Management component for superadmin
  const UserManagement = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-secondary-700 dark:text-gray-100 mb-6">
            User Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-accent-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-secondary-700 dark:text-gray-100 mb-2">
                Register New Admin
              </h3>
              <p className="text-secondary-600 dark:text-gray-400 mb-4">
                Create new admin users with controlled permissions
              </p>
              <button
                onClick={() => setCurrentPage('register-admin')}
                className="w-full bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Admin
              </button>
            </div>
            <div className="bg-accent-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-secondary-700 dark:text-gray-100 mb-2">
                Register New Chef
              </h3>
              <p className="text-secondary-600 dark:text-gray-400 mb-4">
                Create new chef users for kitchen operations
              </p>
              <button
                onClick={() => setCurrentPage('register-chef')}
                className="w-full bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Chef
              </button>
            </div>
            <div className="bg-accent-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-secondary-700 dark:text-gray-100 mb-2">
                Register New Reception
              </h3>
              <p className="text-secondary-600 dark:text-gray-400 mb-4">
                Create new reception users for customer service
              </p>
              <button
                onClick={() => setCurrentPage('register-reception')}
                className="w-full bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Reception
              </button>
            </div>
            <div className="bg-accent-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-secondary-700 dark:text-gray-100 mb-2">
                Register New Superadmin
              </h3>
              <p className="text-secondary-600 dark:text-gray-400 mb-4">
                Create new superadmin users (only for superadmins)
              </p>
              <button
                onClick={() => setCurrentPage('register-superadmin')}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Superadmin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const navigationItems = [
    { id: 'order', label: 'New Order', icon: Plus },
    { id: 'kitchen', label: 'Kitchen Orders', icon: Utensils },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'payment-methods', label: 'Payment, Currency & Tax', icon: CreditCard },
    { id: 'cafe-settings', label: 'Cafe Settings', icon: Building },
    { id: 'menu', label: 'Menu Management', icon: Settings },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'history', label: 'Invoice History', icon: Receipt },
    { id: 'user-management', label: 'User Management', icon: Shield },
  ];

  if (loading || cafeSettingsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-accent-50 dark:bg-gray-900">
        <CafeInfo logoSize="h-16 w-16" nameSize="text-xl" className="mb-4" />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
        <p className="mt-4 text-secondary-600 dark:text-gray-400">Loading {cafeSettings.cafe_name}...</p>
      </div>
    );
  }

  // Handle registration pages
  if (currentPage === 'register-admin') {
    return <AdminRegister onBack={() => setCurrentPage('user-management')} />;
  }
  if (currentPage === 'register-chef') {
    return <ChefRegister onBack={() => setCurrentPage('user-management')} />;
  }
  if (currentPage === 'register-reception') {
    return <ReceptionRegister onBack={() => setCurrentPage('user-management')} />;
  }
  if (currentPage === 'register-superadmin') {
    return <SuperadminRegister onBack={() => setCurrentPage('user-management')} />;
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
                <Crown className="h-4 w-4" />
                <span>{user?.username} (Superadmin)</span>
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
};

export default SuperadminApp; 
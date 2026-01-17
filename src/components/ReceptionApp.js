import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { LogOut, User, ShoppingCart, Settings, Receipt, Plus, Users, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import OrderPage from './OrderPage';
import KitchenOrders from './KitchenOrders';
import CustomerManagement from './CustomerManagement';
import InvoiceHistory from './InvoiceHistory';
import DarkModeToggle from './DarkModeToggle';
import CafeInfo from './CafeInfo';

const ReceptionApp = () => {
  const { user, logout } = useAuth();
  const { cafeSettings } = useCafeSettings();
  const [currentPage, setCurrentPage] = useState('order');
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch menu items function
  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await axios.get('/menu');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  }, []);

  // Fetch menu items on component mount
  React.useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleLogout = () => {
    logout();
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'order':
        return <OrderPage menuItems={menuItems} cart={cart} setCart={setCart} />;
      case 'kitchen':
        return <KitchenOrders cart={cart} setCart={setCart} />;
      case 'customers':
        return <CustomerManagement />;
      case 'history':
        return <InvoiceHistory cart={cart} setCart={setCart} />;
      default:
        return <OrderPage menuItems={menuItems} cart={cart} setCart={setCart} />;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-accent-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-accent-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <CafeInfo />
              <span className="ml-3 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                Reception
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Cart indicator */}
              {cart && cart.length > 0 && (
                <div className="flex items-center space-x-1 text-sm text-secondary-600 dark:text-gray-400">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="bg-secondary-100 text-secondary-800 px-2 py-1 rounded-full text-xs font-medium">
                    {cart.length} items
                  </span>
                </div>
              )}
              
              {/* User info */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-secondary-600 dark:text-gray-400">
                <User className="h-4 w-4" />
                <span>{user?.username}</span>
              </div>
              
              {/* Dark mode toggle */}
              <DarkModeToggle />
              
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-secondary-600 hover:text-secondary-700 hover:bg-accent-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-secondary-600 hover:text-secondary-700 hover:bg-accent-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
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
            {cafeSettings?.reception_can_create_orders && (
              <button
                onClick={() => {
                  setCurrentPage('order');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                  currentPage === 'order'
                    ? 'bg-secondary-600 text-white font-semibold shadow-sm'
                    : 'text-secondary-600 dark:text-gray-300 hover:bg-accent-100 dark:hover:bg-gray-700'
                }`}
              >
                <Plus className="h-4 w-4 mr-3" />
                New Order
              </button>
            )}
            {cafeSettings?.reception_show_kitchen_tab && (
              <button
                onClick={() => {
                  setCurrentPage('kitchen');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                  currentPage === 'kitchen'
                    ? 'bg-secondary-600 text-white font-semibold shadow-sm'
                    : 'text-secondary-600 dark:text-gray-300 hover:bg-accent-100 dark:hover:bg-gray-700'
                }`}
              >
                <Settings className="h-4 w-4 mr-3" />
                Kitchen Orders
              </button>
            )}
            {cafeSettings?.reception_can_view_customers && (
              <button
                onClick={() => {
                  setCurrentPage('customers');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                  currentPage === 'customers'
                    ? 'bg-secondary-600 text-white font-semibold shadow-sm'
                    : 'text-secondary-600 dark:text-gray-300 hover:bg-accent-100 dark:hover:bg-gray-700'
                }`}
              >
                <Users className="h-4 w-4 mr-3" />
                Customers
              </button>
            )}
            {cafeSettings?.reception_show_history_tab && (
              <button
                onClick={() => {
                  setCurrentPage('history');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                  currentPage === 'history'
                    ? 'bg-secondary-600 text-white font-semibold shadow-sm'
                    : 'text-secondary-600 dark:text-gray-300 hover:bg-accent-100 dark:hover:bg-gray-700'
                }`}
              >
                <Receipt className="h-4 w-4 mr-3" />
                Order History
              </button>
            )}
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white dark:bg-gray-800 shadow-sm border-b border-accent-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {cafeSettings?.reception_can_create_orders && (
              <button
                onClick={() => setCurrentPage('order')}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  currentPage === 'order'
                    ? 'nav-active'
                    : 'nav-inactive'
                }`}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </button>
            )}
            {cafeSettings?.reception_show_kitchen_tab && (
              <button
                onClick={() => setCurrentPage('kitchen')}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  currentPage === 'kitchen'
                    ? 'nav-active'
                    : 'nav-inactive'
                }`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Kitchen Orders
              </button>
            )}
            {cafeSettings?.reception_can_view_customers && (
              <button
                onClick={() => setCurrentPage('customers')}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  currentPage === 'customers'
                    ? 'nav-active'
                    : 'nav-inactive'
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                Customers
              </button>
            )}
            {cafeSettings?.reception_show_history_tab && (
              <button
                onClick={() => setCurrentPage('history')}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  currentPage === 'history'
                    ? 'nav-active'
                    : 'nav-inactive'
                }`}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Order History
              </button>
            )}
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

export default ReceptionApp; 
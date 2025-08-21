import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { LogOut, User, ShoppingCart, Settings, Receipt, Plus, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import OrderPage from './OrderPage';
import KitchenOrders from './KitchenOrders';
import CustomerManagement from './CustomerManagement';
import InvoiceHistory from './InvoiceHistory';
import DarkModeToggle from './DarkModeToggle';

const ReceptionApp = () => {
  const { user, logout } = useAuth();
  const { cafeSettings } = useCafeSettings();
  const [currentPage, setCurrentPage] = useState('order');
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

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
              <img 
                src={cafeSettings.logo_url} 
                alt={`${cafeSettings.cafe_name} Logo`} 
                className="h-10 w-10 mr-3"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-secondary-700 dark:text-gray-100">
                  {cafeSettings.cafe_name} - Reception
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reception Dashboard
                </p>
              </div>
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
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Reception
                </span>
              </div>
              
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
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-accent-200 dark:border-gray-700">
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
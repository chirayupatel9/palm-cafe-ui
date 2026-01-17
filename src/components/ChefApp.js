import React, { useState } from 'react';
import { Utensils, LogOut, User, ShoppingCart, Settings, Package, Receipt, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import KitchenOrders from './KitchenOrders';
import MenuManagement from './MenuManagement';
import InventoryManagement from './InventoryManagement';
import InvoiceHistory from './InvoiceHistory';
import DarkModeToggle from './DarkModeToggle';
import CafeInfo from './CafeInfo';

const ChefApp = () => {
  const { user, logout } = useAuth();
  const { cafeSettings } = useCafeSettings();
  const [currentPage, setCurrentPage] = useState('kitchen');
  const [cart, setCart] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'kitchen':
        return <KitchenOrders cart={cart} setCart={setCart} />;
      case 'menu':
        return <MenuManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'history':
        return <InvoiceHistory cart={cart} setCart={setCart} />;
      default:
        return <KitchenOrders cart={cart} setCart={setCart} />;
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
              <span className="ml-3 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-xs font-medium">
                Chef
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
            {cafeSettings?.chef_show_kitchen_tab && (
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
                <Utensils className="h-4 w-4 mr-3" />
                Kitchen Orders
              </button>
            )}
            {cafeSettings?.chef_show_menu_tab && (
              <button
                onClick={() => {
                  setCurrentPage('menu');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                  currentPage === 'menu'
                    ? 'bg-secondary-600 text-white font-semibold shadow-sm'
                    : 'text-secondary-600 dark:text-gray-300 hover:bg-accent-100 dark:hover:bg-gray-700'
                }`}
              >
                <Settings className="h-4 w-4 mr-3" />
                Menu Management
              </button>
            )}
            {cafeSettings?.chef_show_inventory_tab && (
              <button
                onClick={() => {
                  setCurrentPage('inventory');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                  currentPage === 'inventory'
                    ? 'bg-secondary-600 text-white font-semibold shadow-sm'
                    : 'text-secondary-600 dark:text-gray-300 hover:bg-accent-100 dark:hover:bg-gray-700'
                }`}
              >
                <Package className="h-4 w-4 mr-3" />
                Inventory
              </button>
            )}
            {cafeSettings?.chef_show_history_tab && (
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
            {cafeSettings?.chef_show_kitchen_tab && (
              <button
                onClick={() => setCurrentPage('kitchen')}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  currentPage === 'kitchen'
                    ? 'nav-active'
                    : 'nav-inactive'
                }`}
              >
                <Utensils className="h-4 w-4 mr-2" />
                Kitchen Orders
              </button>
            )}
            {cafeSettings?.chef_show_menu_tab && (
              <button
                onClick={() => setCurrentPage('menu')}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  currentPage === 'menu'
                    ? 'nav-active'
                    : 'nav-inactive'
                }`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Menu Management
              </button>
            )}
            {cafeSettings?.chef_show_inventory_tab && (
              <button
                onClick={() => setCurrentPage('inventory')}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  currentPage === 'inventory'
                    ? 'nav-active'
                    : 'nav-inactive'
                }`}
              >
                <Package className="h-4 w-4 mr-2" />
                Inventory
              </button>
            )}
            {cafeSettings?.chef_show_history_tab && (
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

export default ChefApp; 
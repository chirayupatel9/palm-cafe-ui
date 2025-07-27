import React, { useState } from 'react';
import { Utensils, LogOut, User, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import KitchenOrders from './KitchenOrders';
import DarkModeToggle from './DarkModeToggle';

const ChefApp = () => {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('kitchen');
  const [cart, setCart] = useState([]);

  const handleLogout = () => {
    logout();
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'kitchen':
        return <KitchenOrders cart={cart} setCart={setCart} />;
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
              <img 
                src="/images/palm-cafe-logo.png" 
                alt="Palm Cafe Logo" 
                className="h-10 w-10 mr-3"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-secondary-700 dark:text-gray-100">
                  Palm Cafe - Kitchen
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Chef Dashboard
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
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                  Chef
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
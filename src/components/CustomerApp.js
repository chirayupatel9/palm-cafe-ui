import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import CustomerLogin from './CustomerLogin';
import CustomerMenu from './CustomerMenu';
import { LogOut, User, ShoppingCart, History } from 'lucide-react';

const CustomerApp = () => {
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('menu');
  const [showCart, setShowCart] = useState(false);

  const handleLogin = (customerData) => {
    setCustomer(customerData);
  };

  const handleLogout = () => {
    setCustomer(null);
    setCart([]);
    setActiveTab('menu');
  };

  if (!customer) {
    return (
      <div>
        <Toaster position="top-right" />
        <CustomerLogin onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />
      
      {/* Customer Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-accent-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/images/palm-cafe-logo.png" 
                alt="Palm Cafe Logo" 
                className="h-10 w-10 mr-3"
              />
              <h1 className="text-xl sm:text-2xl font-bold text-secondary-700 dark:text-gray-100">Palm Cafe</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Cart Button */}
              <button
                onClick={() => setShowCart(true)}
                className="relative p-3 bg-secondary-500 text-white rounded-full hover:bg-secondary-600 transition-colors"
                title="View Cart"
              >
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>

              {/* Order History Button */}
              <button
                onClick={() => setActiveTab('history')}
                className="relative p-3 bg-accent-500 text-white rounded-full hover:bg-accent-600 transition-colors"
                title="View Order History"
              >
                <History className="h-6 w-6" />
              </button>

              {/* Customer Info */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-secondary-600 dark:text-gray-400">
                <User className="h-4 w-4" />
                <span>{customer.name}</span>
                {customer.loyalty_points > 0 && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                    {customer.loyalty_points} pts
                  </span>
                )}
              </div>
              
              {/* Back to Home Button */}
              <a
                href="/"
                className="p-2 rounded-md text-secondary-600 hover:text-secondary-700 hover:bg-accent-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                title="Back to Home"
              >
                <span className="text-lg">🏠</span>
              </a>
              
              {/* Logout Button */}
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

      {/* Customer Menu */}
      <CustomerMenu 
        customer={customer} 
        cart={cart}
        setCart={setCart}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showCart={showCart}
        setShowCart={setShowCart}
      />
    </div>
  );
};

export default CustomerApp; 
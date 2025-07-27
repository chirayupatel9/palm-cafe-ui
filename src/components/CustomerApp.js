import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import CustomerLogin from './CustomerLogin';
import CustomerMenu from './CustomerMenu';
import { LogOut, User, ShoppingCart, History, LogIn, X } from 'lucide-react';

const CustomerApp = () => {
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('menu');
  const [showCart, setShowCart] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogin = (customerData) => {
    setCustomer(customerData);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setCustomer(null);
    setCart([]);
    setActiveTab('menu');
  };

  const handleAddToCart = (item) => {
    if (!customer) {
      setShowLoginModal(true);
      return;
    }
    // If customer is logged in, add to cart normally
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  const handlePlaceOrder = () => {
    if (!customer) {
      setShowLoginModal(true);
      return;
    }
    // If customer is logged in, proceed with order
    // This will be handled by CustomerMenu component
  };

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
                onClick={() => {
                  if (!customer) {
                    setShowLoginModal(true);
                    return;
                  }
                  setShowCart(true);
                }}
                className="relative p-3 bg-secondary-500 text-white rounded-full hover:bg-secondary-600 transition-colors"
                title={customer ? "View Cart" : "Login to view cart"}
              >
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>

              {/* Order History Button - Only show if logged in */}
              {customer && (
                <button
                  onClick={() => setActiveTab('history')}
                  className="relative p-3 bg-accent-500 text-white rounded-full hover:bg-accent-600 transition-colors"
                  title="View Order History"
                >
                  <History className="h-6 w-6" />
                </button>
              )}

              {/* Customer Info or Login Button */}
              {customer ? (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-secondary-600 dark:text-gray-400">
                  <User className="h-4 w-4" />
                  <span>{customer.name}</span>
                  {customer.loyalty_points > 0 && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                      {customer.loyalty_points} pts
                    </span>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}
              
              {/* Back to Home Button */}
              <button
                onClick={() => {
                  setActiveTab('menu');
                  setShowCart(false);
                  setShowLoginModal(false);
                }}
                className="p-2 rounded-md text-secondary-600 hover:text-secondary-700 hover:bg-accent-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                title="Back to Menu"
              >
                <span className="text-lg">🏠</span>
              </button>
              
              {/* Logout Button - Only show if logged in */}
              {customer && (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-secondary-600 hover:text-secondary-700 hover:bg-accent-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}
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
        onAddToCart={handleAddToCart}
        onPlaceOrder={handlePlaceOrder}
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
      />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-material-5 max-w-md w-full mx-4 transform transition-all duration-300 animate-slideIn hover-lift">
            {/* Modal Header */}
            <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center shadow-lg">
                  <img 
                    src="/images/palm-cafe-logo.png" 
                    alt="Palm Cafe Logo" 
                    className="w-10 h-10"
                  />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Welcome to Palm Cafe
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
                Enter your phone number to continue
              </p>
              
              {/* Close Button */}
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <CustomerLogin onLogin={handleLogin} />
              
              {/* Continue Browsing Option */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm transition-colors flex items-center justify-center"
                >
                  <span className="mr-2">←</span>
                  Continue browsing without login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerApp; 
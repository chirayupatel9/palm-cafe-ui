import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import CustomerLogin from './CustomerLogin';
import CustomerMenu from './CustomerMenu';
import { LogOut, User, ShoppingCart, History, LogIn, X } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { getImageUrl } from '../utils/imageUtils';

const CustomerApp = () => {
  const { isDarkMode } = useDarkMode();
  const { cafeSettings } = useCafeSettings();
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

  const handleCustomerUpdate = (updatedCustomer) => {
    setCustomer(updatedCustomer);
  };

  const handleAddToCart = (item) => {
    // Allow adding to cart without login
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-accent-50'}`}>
      <Toaster position="top-right" />

      {/* Customer Menu - Contains its own header */}
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
        onCustomerUpdate={handleCustomerUpdate}
        onLogout={handleLogout}
      />

             {/* Login Modal */}
       {showLoginModal && (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
           <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-material-5 max-w-md w-full mx-4 transform transition-all duration-300 animate-slideIn hover-lift`}>
             {/* Modal Header */}
             <div className={`relative p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
               <div className="flex items-center justify-center mb-4">
                 {cafeSettings.logo_url && (
                   <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center shadow-lg">
                     <img 
                       src={getImageUrl(cafeSettings.logo_url)} 
                       alt={`${cafeSettings.cafe_name} Logo`} 
                       className="w-10 h-10"
                     />
                   </div>
                 )}
               </div>
               <h2 className={`text-2xl font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                 Welcome to {cafeSettings.cafe_name}
               </h2>
               <p className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                 Enter your phone number to continue
               </p>
               
               {/* Close Button */}
               <button
                 onClick={() => setShowLoginModal(false)}
                 className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                   isDarkMode 
                     ? 'hover:bg-gray-700 text-gray-400' 
                     : 'hover:bg-gray-100 text-gray-500'
                 }`}
               >
                 <X className="h-5 w-5" />
               </button>
             </div>

             {/* Modal Body */}
             <div className="p-6">
               <CustomerLogin onLogin={handleLogin} />
               
               {/* Continue Browsing Option */}
               <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                 <button
                   onClick={() => setShowLoginModal(false)}
                   className={`w-full text-sm transition-colors flex items-center justify-center ${
                     isDarkMode 
                       ? 'text-gray-400 hover:text-gray-200' 
                       : 'text-gray-500 hover:text-gray-700'
                   }`}
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
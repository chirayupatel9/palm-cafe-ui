import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import CustomerLogin from './CustomerLogin';
import CustomerMenu from './CustomerMenu';
import CafeNotFound from './CafeNotFound';
import { LogOut, User, ShoppingCart, History, LogIn, X } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { getImageUrl } from '../utils/imageUtils';
import axios from 'axios';

const STORAGE_PREFIX = 'palm-cafe';
const STORAGE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

const getCustomerStorageKey = (s) => (s ? `${STORAGE_PREFIX}-customer-${s}` : null);
const getCartStorageKey = (s) => (s ? `${STORAGE_PREFIX}-cart-${s}` : null);

const getStoredWithExpiry = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.savedAt !== 'number') {
      localStorage.removeItem(key);
      return null;
    }
    if (Date.now() - parsed.savedAt > STORAGE_MAX_AGE_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch (e) {
    return null;
  }
};

const CustomerApp = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const [cafeBranding, setCafeBranding] = useState({
    logo_url: null,
    cafe_name: null
  });
  const [cafeValid, setCafeValid] = useState(null); // null = loading, true = valid, false = invalid
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('menu');
  const [showCart, setShowCart] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Validate slug and fetch cafe branding
  useEffect(() => {
    const validateAndFetch = async () => {
      if (!slug) {
        setCafeValid(false);
        return;
      }

      try {
        const response = await axios.get(`/menu/branding?cafeSlug=${slug}`);
        if (response.data && response.data.cafe_name) {
          setCafeBranding({
            logo_url: response.data.logo_url || null,
            cafe_name: response.data.cafe_name || null
          });
          setCafeValid(true);
        } else {
          setCafeValid(false);
        }
      } catch (error) {
        console.error('Error validating cafe slug:', error);
        setCafeValid(false);
      }
    };
    validateAndFetch();
  }, [slug]);

  // Restore customer and cart from localStorage when cafe is valid (e.g. after refresh); skip if older than 10 min
  useEffect(() => {
    if (!slug || cafeValid !== true) return;
    const customerKey = getCustomerStorageKey(slug);
    const cartKey = getCartStorageKey(slug);
    try {
      if (customerKey) {
        const data = getStoredWithExpiry(customerKey);
        if (data) setCustomer(data);
      }
      if (cartKey) {
        const data = getStoredWithExpiry(cartKey);
        if (data && Array.isArray(data)) setCart(data);
      }
    } catch (e) {
      console.error('Failed to restore customer/cart from storage', e);
    }
  }, [slug, cafeValid]);

  // Persist customer to localStorage when it changes (only write; clear on logout in handleLogout)
  useEffect(() => {
    if (!slug || cafeValid !== true || !customer) return;
    const key = getCustomerStorageKey(slug);
    if (key) localStorage.setItem(key, JSON.stringify({ data: customer, savedAt: Date.now() }));
  }, [slug, cafeValid, customer]);

  // Persist cart to localStorage when it changes (only write; clear on logout in handleLogout)
  useEffect(() => {
    if (!slug || cafeValid !== true || !cart || cart.length === 0) return;
    const key = getCartStorageKey(slug);
    if (key) localStorage.setItem(key, JSON.stringify({ data: cart, savedAt: Date.now() }));
  }, [slug, cafeValid, cart]);

  const handleLogin = (customerData) => {
    setCustomer(customerData);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setCustomer(null);
    setCart([]);
    setActiveTab('menu');
    if (slug) {
      const customerKey = getCustomerStorageKey(slug);
      const cartKey = getCartStorageKey(slug);
      if (customerKey) localStorage.removeItem(customerKey);
      if (cartKey) localStorage.removeItem(cartKey);
    }
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

  // Show loading state while validating
  if (cafeValid === null) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-accent-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading cafe...</p>
        </div>
      </div>
    );
  }

  // Show not found if slug is invalid
  if (cafeValid === false) {
    return <CafeNotFound slug={slug} />;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-accent-50'}`}>
      <Toaster position="top-right" />

      {/* Customer Menu - Contains its own header */}
      <CustomerMenu
        cafeSlug={slug} 
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

             {/* Login Modal - Full screen on mobile */}
       {showLoginModal && (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end lg:items-center justify-center z-50 p-0 lg:p-4 animate-fadeIn backdrop-blur-sm">
           <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-t-2xl lg:rounded-2xl shadow-material-5 max-w-md lg:max-w-md w-full lg:mx-4 h-[90vh] lg:h-auto flex flex-col transform transition-all duration-300 animate-slideIn hover-lift`}>
             {/* Modal Header */}
             <div className={`relative p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
               <div className="flex items-center justify-center mb-4">
                 {cafeBranding.logo_url && (
                   <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center shadow-lg">
                     <img 
                       src={getImageUrl(cafeBranding.logo_url)} 
                       alt={`${cafeBranding.cafe_name || 'Cafe'} Logo`} 
                       className="w-10 h-10"
                     />
                   </div>
                 )}
               </div>
               <h2 className={`text-2xl font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                 Welcome{cafeBranding.cafe_name ? ` to ${cafeBranding.cafe_name}` : ''}
               </h2>
               <p className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                 Enter your phone number to continue
               </p>
               
               {/* Close Button */}
               <button
                 onClick={() => setShowLoginModal(false)}
                 className={`absolute top-4 right-4 p-2 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                   isDarkMode 
                     ? 'hover:bg-gray-700 text-gray-400' 
                     : 'hover:bg-gray-100 text-gray-500'
                 }`}
                 aria-label="Close"
               >
                 <X className="h-5 w-5" />
               </button>
             </div>

             {/* Modal Body */}
             <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
               <CustomerLogin onLogin={handleLogin} />
               
               {/* Continue Browsing Option */}
               <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                 <button
                   onClick={() => setShowLoginModal(false)}
                   className={`w-full text-sm transition-colors flex items-center justify-center min-h-[44px] ${
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
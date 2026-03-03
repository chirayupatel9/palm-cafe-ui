import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import CustomerLogin from './CustomerLogin';
import CustomerMenu from './CustomerMenu';
import CafeNotFound from './CafeNotFound';
import LoginDialog from './ui/Dialog';
import { useDarkMode } from '../contexts/DarkModeContext';
import { getImageUrl } from '../utils/imageUtils';
import axios from 'axios';

const STORAGE_PREFIX = 'palm-cafe';
const STORAGE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

const getCustomerStorageKey = (s) => (s ? `${STORAGE_PREFIX}-customer-${s}` : null);
const getCartStorageKey = (s) => (s ? `${STORAGE_PREFIX}-cart-${s}` : null);

const SWIPE_THRESHOLD = 60;

const SwipeableToastBar = ({ t, position }) => {
  const touchStartX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    if (endX - touchStartX.current > SWIPE_THRESHOLD) {
      toast.dismiss(t.id);
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      <ToastBar toast={t} position={position} />
    </div>
  );
};

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
  const [loginIntent, setLoginIntent] = useState(null); // 'orders' = open profile orders after login
  const [openProfileOrdersAfterLogin, setOpenProfileOrdersAfterLogin] = useState(false);

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
    if (loginIntent === 'orders') {
      setLoginIntent(null);
      setActiveTab('menu');
      setOpenProfileOrdersAfterLogin(true);
    } else {
      setShowCart(true);
    }
  };

  const openLoginForOrders = () => {
    setLoginIntent('orders');
    setShowLoginModal(true);
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

  const MAX_ITEM_QUANTITY = 10;

  const handleAddToCart = (item) => {
    const currentQty = cart.find(cartItem => cartItem.id === item.id)?.quantity ?? 0;
    if (currentQty >= MAX_ITEM_QUANTITY) {
      toast.error(`Maximum ${MAX_ITEM_QUANTITY} of the same item allowed`);
      return;
    }
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: Math.min(MAX_ITEM_QUANTITY, cartItem.quantity + 1) }
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
      <Toaster
        position="top-right"
        containerStyle={{ top: 80, right: 16, left: 'auto', bottom: 'auto' }}
        toastOptions={{ duration: 4000 }}
        children={(t) => (
          <SwipeableToastBar
            t={t}
            position={t.position || 'top-right'}
          />
        )}
      />

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
        onOpenLoginForOrders={openLoginForOrders}
        onCustomerUpdate={handleCustomerUpdate}
        onLogout={handleLogout}
        openProfileOrdersAfterLogin={openProfileOrdersAfterLogin}
        onClearOpenProfileOrdersAfterLogin={() => setOpenProfileOrdersAfterLogin(false)}
      />

      {/* Login Modal - Template Dialog */}
      <LoginDialog
        open={showLoginModal}
        onClose={() => { setShowLoginModal(false); setLoginIntent(null); }}
        title={(() => {
          const name = (cafeBranding.cafe_name || '').trim();
          const isPlaceholder = !name || /^default\s*cafe$/i.test(name);
          return isPlaceholder ? 'Welcome' : `Welcome to ${cafeBranding.cafe_name}`;
        })()}
      >
        {showLoginModal && (
          <>
            {cafeBranding.logo_url && (
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden bg-[#E9E4DA]">
                  <img
                    src={getImageUrl(cafeBranding.logo_url)}
                    alt=""
                    className="w-9 h-9 object-contain"
                  />
                </div>
              </div>
            )}
            <p className="text-[#6F6A63] text-sm text-center mb-4">Enter your phone number to continue</p>
            <CustomerLogin cafeSlug={slug} onLogin={handleLogin} />
            <div className="mt-6 pt-4 border-t border-[#E9E4DA]">
              <button
                onClick={() => { setShowLoginModal(false); setLoginIntent(null); }}
                className="w-full text-sm text-[#6F6A63] hover:text-[#2A2A2A] transition-colors flex items-center justify-center min-h-[44px] py-2"
              >
                <span className="mr-2">←</span>
                Continue browsing without login
              </button>
            </div>
          </>
        )}
      </LoginDialog>
    </div>
  );
};

export default CustomerApp; 
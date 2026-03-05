import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import CustomerLogin, { CustomerLoginCustomer } from './CustomerLogin';
import CustomerMenu from './CustomerMenu';
import CafeNotFound from './CafeNotFound';
import LoginDialog from './ui/Dialog';
import { useDarkMode } from '../contexts/DarkModeContext';
import { getImageUrl } from '../utils/imageUtils';
import axios from 'axios';

const STORAGE_PREFIX = 'palm-cafe';
const STORAGE_MAX_AGE_MS = 10 * 60 * 1000;

const getCustomerStorageKey = (s: string | undefined): string | null =>
  s ? `${STORAGE_PREFIX}-customer-${s}` : null;
const getCartStorageKey = (s: string | undefined): string | null =>
  s ? `${STORAGE_PREFIX}-cart-${s}` : null;

function getStoredWithExpiry<T>(key: string | null): T | null {
  if (!key) return null;
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
    return parsed.data as T;
  } catch {
    return null;
  }
}

interface CartItem {
  id: number;
  quantity: number;
  [key: string]: any;
}

interface CafeBranding {
  logo_url: string | null;
  cafe_name: string | null;
}

const CustomerApp: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isDarkMode } = useDarkMode();
  const [cafeBranding, setCafeBranding] = useState<CafeBranding>({
    logo_url: null,
    cafe_name: null
  });
  const [cafeValid, setCafeValid] = useState<boolean | null>(null);
  const [customer, setCustomer] = useState<CustomerLoginCustomer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState('menu');
  const [showCart, setShowCart] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginIntent, setLoginIntent] = useState<string | null>(null);
  const [openProfileOrdersAfterLogin, setOpenProfileOrdersAfterLogin] = useState(false);

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

  useEffect(() => {
    if (!slug || cafeValid !== true) return;
    const customerKey = getCustomerStorageKey(slug);
    const cartKey = getCartStorageKey(slug);
    try {
      if (customerKey) {
        const data = getStoredWithExpiry<CustomerLoginCustomer>(customerKey);
        if (data) setCustomer(data);
      }
      if (cartKey) {
        const data = getStoredWithExpiry<CartItem[]>(cartKey);
        if (data && Array.isArray(data)) setCart(data);
      }
    } catch (e) {
      console.error('Failed to restore customer/cart from storage', e);
    }
  }, [slug, cafeValid]);

  useEffect(() => {
    if (!slug || cafeValid !== true || !customer) return;
    const key = getCustomerStorageKey(slug);
    if (key) localStorage.setItem(key, JSON.stringify({ data: customer, savedAt: Date.now() }));
  }, [slug, cafeValid, customer]);

  useEffect(() => {
    if (!slug || cafeValid !== true || !cart || cart.length === 0) return;
    const key = getCartStorageKey(slug);
    if (key) localStorage.setItem(key, JSON.stringify({ data: cart, savedAt: Date.now() }));
  }, [slug, cafeValid, cart]);

  const handleLogin = (customerData: CustomerLoginCustomer) => {
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

  const handleCustomerUpdate = (updatedCustomer: CustomerLoginCustomer) => {
    setCustomer(updatedCustomer);
  };

  const MAX_ITEM_QUANTITY = 10;

  const handleAddToCart = (item: CartItem) => {
    const currentQty = cart.find((cartItem) => cartItem.id === item.id)?.quantity ?? 0;
    if (currentQty >= MAX_ITEM_QUANTITY) {
      toast.error(`Maximum ${MAX_ITEM_QUANTITY} of the same item allowed`);
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: Math.min(MAX_ITEM_QUANTITY, cartItem.quantity + 1) }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const handlePlaceOrder = () => {
    if (!customer) {
      setShowLoginModal(true);
      return;
    }
  };

  if (cafeValid === null) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-accent-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Loading cafe...</p>
        </div>
      </div>
    );
  }

  if (cafeValid === false) {
    return <CafeNotFound slug={slug} />;
  }

  const dialogTitle = (() => {
    const name = (cafeBranding.cafe_name || '').trim();
    const isPlaceholder = !name || /^default\s*cafe$/i.test(name);
    return isPlaceholder ? 'Welcome' : `Welcome to ${cafeBranding.cafe_name}`;
  })();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-accent-50'}`}>
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

      <LoginDialog
        open={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setLoginIntent(null);
        }}
        size="lg"
        title={dialogTitle}
      >
        {showLoginModal && (
          <>
            {cafeBranding.logo_url && (
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden bg-[#b3af9b]">
                  <img
                    src={getImageUrl(cafeBranding.logo_url) ?? ''}
                    alt=""
                    className="w-9 h-9 object-contain"
                  />
                </div>
              </div>
            )}
            <p className="text-[#b3af9b] text-sm text-center mb-4">Enter your phone number to continue</p>
            <CustomerLogin cafeSlug={slug} onLogin={handleLogin} />
            <div className="mt-6 pt-4 border-t border-[#b3af9b]">
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginIntent(null);
                }}
                className="w-full text-sm text-[#b3af9b] hover:text-[#0b0f05] transition-colors flex items-center justify-center min-h-[44px] py-2"
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

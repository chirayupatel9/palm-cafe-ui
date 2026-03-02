import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, X, Search, User, Phone, Mail, MapPin, CheckCircle, ChevronLeft, ChevronRight, ChevronDown, Utensils, Star, LogOut, Edit3, Save, Menu, ShoppingBag } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import CustomerOrderHistory from './CustomerOrderHistory';
import CustomerProfile from './CustomerProfile';
import { getImageUrl, getPlaceholderImage } from '../utils/imageUtils';
import { normalizeBannersFromBranding } from '../utils/bannerUtils';
import PromoBannerSection from './PromoBannerSection';
import Sheet from './ui/Sheet';
import Dialog from './ui/Dialog';
import ScrollExpandMedia from './ui/ScrollExpandMedia';
import { GlassButton } from './ui/GlassButton';

const CustomerMenu = ({
  cafeSlug,
  customer,
  cart,
  setCart,
  activeTab,
  setActiveTab,
  showCart,
  setShowCart,
  onAddToCart,
  onPlaceOrder,
  showLoginModal,
  setShowLoginModal,
  onOpenLoginForOrders,
  onCustomerUpdate,
  onLogout,
  openProfileOrdersAfterLogin,
  onClearOpenProfileOrdersAfterLogin
}) => {
  const { formatCurrency } = useCurrency();
  const { cafeSettings } = useCafeSettings();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tipAmount, setTipAmount] = useState(0);
  const [tipPercentage, setTipPercentage] = useState(0);
  const [orderLoading, setOrderLoading] = useState(false);
  const [groupedMenuItems, setGroupedMenuItems] = useState({});
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [showTaxInMenu, setShowTaxInMenu] = useState(true);
  const [orderStatus, setOrderStatus] = useState(null);
  const [recentOrder, setRecentOrder] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [maxRedeemablePoints, setMaxRedeemablePoints] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMenuItems, setFilteredMenuItems] = useState({});
  const [pickupOption, setPickupOption] = useState('pickup');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false); // Hamburger menu state
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileOpenSection, setProfileOpenSection] = useState(null); // 'orders' = open profile on My Orders section
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [categoryCarouselIndex, setCategoryCarouselIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3); // Responsive items per view (default to 3 for mobile)
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const categoryScrollRef = useRef(null);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const categoryCarouselRef = useRef(null);

  // After login via "Login / My Orders", open profile on orders section (defer so state has propagated)
  useEffect(() => {
    if (!openProfileOrdersAfterLogin || !customer) return;
    const id = setTimeout(() => {
      setActiveTab('menu');
      setShowProfile(true);
      setProfileOpenSection('orders');
      onClearOpenProfileOrdersAfterLogin?.();
    }, 0);
    return () => clearTimeout(id);
  }, [openProfileOrdersAfterLogin, customer, onClearOpenProfileOrdersAfterLogin]);

  // Calculate items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setItemsPerView(4); // Desktop: 4 items
      } else if (width >= 640) {
        setItemsPerView(3); // Tablet: 3 items
      } else {
        setItemsPerView(3); // Mobile: 3 items (increased from 2)
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Edit profile state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    name: '',
    email: '',
    address: '',
    date_of_birth: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Most ordered items and cafe info state
  const [mostOrderedItems, setMostOrderedItems] = useState([]);
  const [loadingMostOrdered, setLoadingMostOrdered] = useState(false);
  const [cafeBranding, setCafeBranding] = useState({ hero_image_url: null, promo_banner_image_url: null, logo_url: null });
  const [loadingBranding, setLoadingBranding] = useState(true);
  const [brandingError, setBrandingError] = useState(false);

  // Helper function to ensure price is a number
  const ensureNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Fetch menu items, tax settings, and payment methods
  useEffect(() => {
    fetchMenuItems();
    fetchTaxSettings();
    fetchPaymentMethods();
    fetchMostOrderedItems();
    fetchCafeBranding();
  }, []);

  // Generate autocomplete suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const suggestions = [];
    const seen = new Set();

    // Get all menu items
    Object.values(groupedMenuItems).flat().forEach(item => {
      const nameMatch = item.name.toLowerCase().includes(query);
      const categoryMatch = item.category_name && item.category_name.toLowerCase().includes(query);

      if ((nameMatch || categoryMatch) && !seen.has(item.name)) {
        seen.add(item.name);
        suggestions.push({
          name: item.name,
          category: item.category_name,
          item: item
        });
      }
    });

    // Sort by relevance (exact matches first, then by name)
    suggestions.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(query);
      const bStarts = b.name.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    });

    setAutocompleteSuggestions(suggestions.slice(0, 5)); // Limit to 5 suggestions
    setShowAutocomplete(suggestions.length > 0);
  }, [searchQuery, groupedMenuItems]);

  // Filter menu items based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMenuItems(groupedMenuItems);
      setSelectedCategory('All');
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = {};

    Object.entries(groupedMenuItems).forEach(([categoryName, items]) => {
      const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        item.category_name.toLowerCase().includes(query)
      );

      if (filteredItems.length > 0) {
        filtered[categoryName] = filteredItems;
      }
    });

    setFilteredMenuItems(filtered);
    setSelectedCategory('All'); // Reset category filter when searching
  }, [searchQuery, groupedMenuItems]);

  // Header scroll state (DIR: bg when scrolled)
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus search input when expanded
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  // Close category menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryMenuOpen && !event.target.closest('.category-menu-container')) {
        setCategoryMenuOpen(false);
      }
    };

    if (categoryMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [categoryMenuOpen]);

  // Scroll-triggered animations (template-style): add .in-view when section enters viewport
  useEffect(() => {
    const els = document.querySelectorAll('[data-scroll-animate]');
    if (els.length === 0) return () => {};
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
        });
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.1 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab, selectedCategory, Object.keys(groupedMenuItems).length]);

  // Handle keyboard navigation for autocomplete
  const handleSearchKeyDown = (e) => {
    if (!showAutocomplete || autocompleteSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < autocompleteSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const suggestion = autocompleteSuggestions[selectedSuggestionIndex];
      setSearchQuery(suggestion.name);
      setShowAutocomplete(false);
      setSelectedSuggestionIndex(-1);
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowAutocomplete(false);
    setSelectedSuggestionIndex(-1);
    searchInputRef.current?.focus();
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const slugParam = cafeSlug ? `?cafeSlug=${cafeSlug}` : '';
      const response = await axios.get(`/menu${slugParam}`);
      setMenuItems(response.data);

      // Group menu items by category
      const grouped = response.data.reduce((groups, item) => {
        const categoryName = item.category_name || 'Uncategorized';
        if (!groups[categoryName]) {
          groups[categoryName] = [];
        }
        groups[categoryName].push(item);
        return groups;
      }, {});
      setGroupedMenuItems(grouped);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tax settings
  const fetchTaxSettings = async () => {
    try {
      const slugParam = cafeSlug ? `?cafeSlug=${cafeSlug}` : '';
      const response = await axios.get(`/tax-settings/menu${slugParam}`);
      const settings = response.data;
      setShowTaxInMenu(settings.show_tax_in_menu);
      setTaxRate(settings.tax_rate || 0);
    } catch (error) {
      console.error('Error fetching tax settings:', error);
      setShowTaxInMenu(false);
      setTaxRate(0);
    }
  };

  // Calculate tax amount when cart changes
  useEffect(() => {
    const subtotal = getSubtotal();
    const calculatedTax = (subtotal * taxRate) / 100;
    setTaxAmount(calculatedTax);
  }, [cart, taxRate]);

  // Calculate max redeemable points when cart changes
  useEffect(() => {
    if (customer?.loyalty_points && cart.length > 0) {
      const subtotal = getSubtotal();
      const maxPoints = Math.min(customer.loyalty_points, Math.floor(subtotal * 10)); // Can't redeem more than order value
      setMaxRedeemablePoints(maxPoints);

      // Reset points to redeem if it exceeds max
      if (pointsToRedeem > maxPoints) {
        setPointsToRedeem(maxPoints);
      }
    } else {
      setMaxRedeemablePoints(0);
      setPointsToRedeem(0);
    }
  }, [cart, customer?.loyalty_points, pointsToRedeem]);

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      const slugParam = cafeSlug ? `?cafeSlug=${cafeSlug}` : '';
      const response = await axios.get(`/payment-methods${slugParam}`);
      setPaymentMethods(response.data);

      // Set default payment method to first available one
      if (response.data.length > 0) {
        setPaymentMethod(response.data[0].code);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      // Fallback to default payment methods
      setPaymentMethods([
        { code: 'cash', name: 'Cash', icon: '₹' },
        { code: 'upi', name: 'UPI', icon: '📱' }
      ]);
    }
  };

  // Fetch featured items
  const fetchMostOrderedItems = async () => {
    try {
      setLoadingMostOrdered(true);
      const slugParam = cafeSlug ? `&cafeSlug=${cafeSlug}` : '?cafeSlug=default';
      const response = await axios.get(`/menu/featured?limit=6${slugParam}`);
      if (response.data && response.data.items) {
        setMostOrderedItems(response.data.items);
      }
    } catch (error) {
      console.error('Error fetching featured items:', error);
      // Gracefully handle error - section will be hidden if no items
      setMostOrderedItems([]);
    } finally {
      setLoadingMostOrdered(false);
    }
  };

  // Fetch cafe branding (hero image, promo banner(s), logo, and basic cafe info)
  const fetchCafeBranding = async () => {
    setLoadingBranding(true);
    setBrandingError(false);
    try {
      const slugParam = cafeSlug ? `?cafeSlug=${cafeSlug}` : '';
      const response = await axios.get(`/menu/branding${slugParam}`);
      if (response.data) {
        setCafeBranding({
          hero_image_url: response.data.hero_image_url || null,
          promo_banner_image_url: response.data.promo_banner_image_url || null,
          logo_url: response.data.logo_url || null,
          cafe_name: response.data.cafe_name || null,
          address: response.data.address || null,
          phone: response.data.phone || null,
          email: response.data.email || null,
          banners: response.data.banners || null
        });
      }
    } catch (error) {
      console.error('Error fetching cafe branding:', error);
      setBrandingError(true);
      setCafeBranding({
        hero_image_url: null,
        promo_banner_image_url: null,
        logo_url: null,
        cafe_name: null,
        address: null,
        phone: null,
        email: null,
        banners: null
      });
    } finally {
      setLoadingBranding(false);
    }
  };

  const promoBanners = useMemo(() => normalizeBannersFromBranding(cafeBranding), [cafeBranding]);

  // Calculate subtotal
  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (ensureNumber(item.price) * item.quantity), 0);
  };

  // Calculate total with tax, tip, and points redemption
  const getTotal = () => {
    const subtotal = getSubtotal();
    const pointsDiscount = pointsToRedeem * 0.1; // 1 point = 0.1 INR
    return subtotal + taxAmount + tipAmount - pointsDiscount;
  };

  // Add item to cart
  const addToCart = (item) => {
    if (onAddToCart) {
      onAddToCart(item);
    } else {
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
    }
    toast.success(`${item.name} added to cart`);
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    toast.success('Item removed from cart');
  };

  // Update item quantity
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getCartQuantity = (itemId) => {
    const item = cart.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  };

  // Handle tip percentage change
  const handleTipPercentageChange = (percentage) => {
    setTipPercentage(percentage);
    const subtotal = getSubtotal();
    const newTipAmount = (subtotal * percentage) / 100;
    setTipAmount(newTipAmount);
  };

  // Handle custom tip amount
  const handleTipAmountChange = (amount) => {
    const newAmount = ensureNumber(amount);
    setTipAmount(newAmount);

    const subtotal = getSubtotal();
    if (subtotal > 0) {
      const newPercentage = (newAmount / subtotal) * 100;
      setTipPercentage(newPercentage);
    } else {
      setTipPercentage(0);
    }
  };

  // Handle points redemption
  const handlePointsRedemption = (points) => {
    const newPoints = Math.min(Math.max(0, points), maxRedeemablePoints);
    setPointsToRedeem(newPoints);
  };

  // Place order
  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error('Please add items to cart first');
      return;
    }

    if (!customer || !customer.name) {
      if (onPlaceOrder) {
        onPlaceOrder();
      } else {
        toast.error('Customer information is required. Please contact support.');
      }
      return;
    }

    setOrderLoading(true);

    try {
      const validPhone = (customer.phone && String(customer.phone).trim() !== '' && String(customer.phone) !== 'undefined') ? customer.phone : null;
      const orderData = {
        customerName: customer.name,
        ...(validPhone !== null && { customerPhone: validPhone }),
        customerEmail: (customer.email && String(customer.email) !== 'undefined') ? customer.email : '',
        tableNumber: tableNumber,
        paymentMethod: paymentMethod,
        pickupOption: pickupOption,
        ...(cafeSlug && { cafeSlug }),
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: ensureNumber(item.price),
          quantity: item.quantity,
          total: ensureNumber(item.price) * item.quantity
        })),
        tipAmount: tipAmount,
        pointsRedeemed: pointsToRedeem,
        date: new Date().toISOString()
      };

      const response = await axios.post('/customer/orders', orderData);

      // Set recent order and status
      const orderNumber = response.data.orderNumber;
      setRecentOrder({
        orderNumber,
        items: cart,
        total: getTotal(),
        status: 'pending',
        timestamp: new Date()
      });
      setOrderStatus('pending');

      // Update customer points after successful order
      if (customer.phone) {
        try {
          const loginPayload = { phone: customer.phone };
          if (cafeSlug) loginPayload.cafeSlug = cafeSlug;
          const customerResponse = await axios.post('/customer/login', loginPayload);
          if (customerResponse.data) {
            // Update the customer data with new points
            const updatedCustomer = {
              ...customer,
              loyalty_points: customerResponse.data.loyalty_points
            };
            // Update customer data in parent component
            if (onCustomerUpdate) {
              onCustomerUpdate(updatedCustomer);
            }
          }
        } catch (error) {
          console.error('Error updating customer points:', error);
        }
      }

      // Clear cart and form
      setCart([]);
      setShowCart(false);
      setTipAmount(0);
      setTipPercentage(0);
      setPointsToRedeem(0);
      setPickupOption('pickup');

      const successMessage = orderNumber
        ? `Order placed successfully! Order #${orderNumber}`
        : 'Order placed successfully!';
      toast.success(successMessage);
    } catch (error) {
      const data = error.response?.data;
      const msg = (data && typeof data.error === 'string') ? data.error : (error.message || 'Failed to place order');
      console.error('Error placing order:', msg, 'Response:', data);
      toast.error(msg);
    } finally {
      setOrderLoading(false);
    }
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setTipAmount(0);
    setTipPercentage(0);
    setPickupOption('pickup');
    setTableNumber('');
    toast.success('Cart cleared');
  };

  // Check order status
  const checkOrderStatus = async (orderNumber) => {
    const phone = customer?.phone;
    if (!phone || String(phone).trim() === '' || String(phone) === 'undefined') {
      return;
    }
    try {
      const params = new URLSearchParams({ customer_phone: phone });
      if (cafeSlug) params.set('cafeSlug', cafeSlug);
      const response = await axios.get(`/customer/orders?${params.toString()}`);
      const order = response.data.find(o => o.order_number === orderNumber);
      if (order) {
        setOrderStatus(order.status);
        if (recentOrder) {
          setRecentOrder(prev => ({ ...prev, status: order.status }));
        }
      }
    } catch (error) {
      console.error('Error checking order status:', error);
    }
  };

  // Check order status periodically only when tab is visible (reduces unnecessary backend load)
  const POLL_INTERVAL_MS = 30000; // 30 seconds
  const INITIAL_POLL_DELAY_MS = 5000; // Wait 5s before first poll after placing order
  useEffect(() => {
    if (!recentOrder || orderStatus !== 'pending') return;

    let intervalId = null;
    let initialTimeoutId = null;

    const runPoll = () => {
      if (document.visibilityState === 'visible') {
        checkOrderStatus(recentOrder.orderNumber);
      }
    };

    initialTimeoutId = setTimeout(() => {
      runPoll();
      intervalId = setInterval(runPoll, POLL_INTERVAL_MS);
    }, INITIAL_POLL_DELAY_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runPoll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeoutId);
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [recentOrder, orderStatus]);

  // Profile editing functions
  const openEditProfile = () => {
    if (customer) {
      setEditProfileData({
        name: customer.name || '',
        email: customer.email || '',
        address: customer.address || '',
        date_of_birth: customer.date_of_birth || ''
      });
      setShowEditProfile(true);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!customer) return;

    setProfileLoading(true);
    try {
      const response = await axios.put('/customer/profile', {
        id: customer.id,
        ...editProfileData
      });

      // Update customer data in parent component
      if (onCustomerUpdate) {
        onCustomerUpdate(response.data);
      }

      toast.success('Profile updated successfully!');
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileInputChange = (field, value) => {
    setEditProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Compute all gallery items from menu items with images
  const allGalleryItems = useMemo(() => {
    if (!groupedMenuItems || Object.keys(groupedMenuItems).length === 0) {
      return [];
    }

    // Get all menu items with images
    const allItemsWithImages = Object.values(groupedMenuItems)
      .flat()
      .filter(item => item.image_url);

    return allItemsWithImages;
  }, [groupedMenuItems]);

  // Gallery items to display (6 initially, all when expanded)
  const galleryItems = useMemo(() => {
    if (galleryExpanded) {
      return allGalleryItems;
    }

    // Shuffle and take up to 6 random items
    const shuffled = [...allGalleryItems].sort(() => Math.random() - 0.5);
    const items = shuffled.slice(0, 6);

    // If we don't have 6 items with images, fill with placeholders
    while (items.length < 6 && allGalleryItems.length < 6) {
      const categories = Object.keys(groupedMenuItems);
      if (categories.length === 0) break;
      const randomCategory = categories[
        Math.floor(Math.random() * categories.length)
      ];
      items.push({
        image_url: null,
        category_name: randomCategory,
        name: 'Menu Item'
      });
    }

    return items;
  }, [allGalleryItems, galleryExpanded, groupedMenuItems]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F4F0]">
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-[#C68E3C] rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
            <Utensils className="h-10 w-10 text-white animate-pulse" />
          </div>
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#C68E3C]/20 border-t-[#C68E3C]"></div>
          </div>
          <p className="mt-6 text-xl font-medium text-[#2A2A2A]">Loading menu...</p>
        </div>
      </div>
    );
  }

  const getCategorySlug = (name) => (name || '').replace(/\s+/g, '-');

  const scrollToCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    const slug = getCategorySlug(categoryName);
    const el = document.getElementById(slug ? `category-${slug}` : 'menu-items-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollCarousel = (direction) => {
    if (categoryCarouselRef.current) {
      categoryCarouselRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div
      className="relative w-full flex flex-col min-h-screen bg-[#F6F4F0] overflow-x-hidden grain-overlay"
    >
      {/* DIR-style fixed header */}
      {activeTab === 'menu' && (
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            isScrolled ? 'bg-black/10 backdrop-blur-md' : 'bg-transparent'
          }`}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 sm:h-20">
            <div className="flex items-center relative category-menu-container">
              <GlassButton
                size="icon"
                onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                className={`lg:hidden ${!isScrolled ? 'glass-button-on-dark' : ''}`}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </GlassButton>
              {categoryMenuOpen && (
                <div className="lg:hidden absolute top-full left-0 mt-2 w-64 bg-[#F6F4F0] rounded-xl shadow-xl border border-[#2A2A2A]/10 overflow-hidden z-50">
                  <div ref={categoryScrollRef} className="max-h-[60vh] overflow-y-auto p-2">
                    <button onClick={() => { setSelectedCategory('All'); setCategoryMenuOpen(false); document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="w-full text-left px-4 py-3.5 text-base font-medium rounded-xl hover:bg-white transition-colors min-h-[44px]">All</button>
                    {Object.keys(groupedMenuItems).map((cat) => (
                      <button key={cat} onClick={() => { setSelectedCategory(cat); setCategoryMenuOpen(false); scrollToCategory(cat); }} className="w-full text-left px-4 py-3.5 text-base font-medium rounded-xl hover:bg-white transition-colors min-h-[44px]">{cat}</button>
                    ))}
                    <div className="border-t border-[#2A2A2A]/10 my-4" />
                    <button onClick={() => { if (customer) { setShowProfile(true); setProfileOpenSection('orders'); } else onOpenLoginForOrders?.(); setCategoryMenuOpen(false); }} className="w-full text-left px-4 py-3.5 text-base font-medium rounded-xl hover:bg-white transition-colors min-h-[44px] flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-[#6F6A63]" />
                      My Orders
                    </button>
                  </div>
                </div>
              )}
              <nav className="hidden lg:flex items-center gap-1">
                <GlassButton
                  size="sm"
                  onClick={() => {
                    const el = document.getElementById('categories-section') || document.getElementById('menu-items-section') || document.getElementById('menu-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  contentClassName="font-mono text-xs uppercase tracking-[0.15em]"
                  className={!isScrolled ? 'glass-button-on-dark' : ''}
                >
                  Menu
                </GlassButton>
                <GlassButton
                  size="sm"
                  onClick={() => {
                    setCategoryMenuOpen(false);
                    if (customer) { setShowProfile(true); setProfileOpenSection('orders'); } else onOpenLoginForOrders?.();
                  }}
                  contentClassName="font-mono text-xs uppercase tracking-[0.15em]"
                  className={!isScrolled ? 'glass-button-on-dark' : ''}
                >
                  Order History
                </GlassButton>
              </nav>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2">
              <GlassButton
                size="sm"
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                contentClassName={'font-bold text-xl sm:text-2xl tracking-tight ' + (isScrolled ? 'text-[#2A2A2A]' : 'text-white')}
                className={!isScrolled ? 'glass-button-on-dark [&_.glass-button]:!bg-transparent [&_.glass-button]:!border-transparent [&_.glass-button]:!shadow-none' : ''}
              >
                {cafeBranding.cafe_name || 'Brew & Bloom'}
              </GlassButton>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <GlassButton
                size="sm"
                onClick={() => {
                  setCategoryMenuOpen(false);
                  if (customer) {
                    setShowProfile(true);
                    setProfileOpenSection('orders');
                  } else {
                    setShowLoginModal(true);
                  }
                }}
                contentClassName="font-mono text-xs uppercase tracking-[0.15em] items-center justify-center"
                className={`hidden sm:inline-block ${!isScrolled ? 'glass-button-on-dark' : ''}`}
                aria-label={customer ? 'My Orders' : 'Login'}
              >
                {customer ? 'My Orders' : 'Login'}
              </GlassButton>
              {customer && (
                <GlassButton
                  size="icon"
                  onClick={() => { setCategoryMenuOpen(false); setProfileOpenSection(null); setShowProfile(true); }}
                  className={!isScrolled ? 'glass-button-on-dark' : ''}
                  aria-label="Profile"
                >
                  <User className="h-5 w-5" />
                </GlassButton>
              )}
              <div className="relative">
                <GlassButton
                  size="icon"
                  onClick={() => { setCategoryMenuOpen(false); setShowCart(true); }}
                  className={!isScrolled ? 'glass-button-on-dark' : ''}
                  aria-label="Cart"
                >
                  <ShoppingBag className="h-5 w-5" />
                </GlassButton>
                {cart.length > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-bold text-white bg-[#C68E3C] rounded-full shadow-md ${isScrolled ? 'border-2 border-white' : 'border-2 border-[#2A2A2A]'}`}>
                    {cart.reduce((t, i) => t + i.quantity, 0)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="min-h-screen w-full overflow-x-hidden">
        <div id="menu-section" className="w-full max-w-full pb-12 sm:pb-16 bg-[#F6F4F0]">
          {activeTab === 'menu' ? (
            <div>
              {cafeSettings.show_menu_images && (
                <ScrollExpandMedia
                  mediaType="image"
                  mediaSrc={
                    cafeBranding.hero_image_url
                      ? getImageUrl(cafeBranding.hero_image_url)
                      : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80'
                  }
                  bgImageSrc={
                    cafeBranding.promo_banner_image_url
                      ? getImageUrl(cafeBranding.promo_banner_image_url)
                      : cafeBranding.hero_image_url
                        ? getImageUrl(cafeBranding.hero_image_url)
                        : 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1920&q=80'
                  }
                  title={cafeBranding.cafe_name || 'Welcome to our cafe'}
                  date={cafeBranding.address || ''}
                  scrollToExpand="Scroll to expand menu"
                  textBlend
                >
                  <div className="max-w-3xl mx-auto text-center space-y-4 mb-10">
                    {/* {cafeBranding.cafe_name && (
                      // <h2 className="text-3xl sm:text-4xl font-bold text-[#2A2A2A]">
                      //   {cafeBranding.cafe_name}
                      // </h2>
                    )} */}
                    {cafeSettings.description && (
                      <p className="text-base sm:text-lg text-[#6F6A63]">
                        {cafeSettings.description}
                      </p>
                    )}
                  </div>

                  {/* Search and categories appear after full expansion */}
                  <div className="max-w-3xl mx-auto">
                    <div className="relative max-w-xl mx-auto mb-10">
                      <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6F6A63] group-focus-within:text-[#C68E3C] transition-colors" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search menu items, categories..."
                          value={searchQuery}
                          onChange={(e) => { setSearchQuery(e.target.value); setSelectedSuggestionIndex(-1); }}
                          onKeyDown={handleSearchKeyDown}
                          onFocus={() => { if (autocompleteSuggestions.length > 0) setShowAutocomplete(true); }}
                          onBlur={(e) => {
                            if (!e.relatedTarget?.closest('.autocomplete-suggestion') && !e.relatedTarget?.closest('.search-clear-btn')) {
                              setTimeout(() => setShowAutocomplete(false), 200);
                            }
                          }}
                          className="glass-input w-full pl-14 pr-12 py-4 text-base rounded-2xl text-[#2A2A2A] placeholder:text-[#B0AAA0] transition-all duration-300"
                        />
                        {searchQuery && (
                          <div className="search-clear-btn absolute right-4 top-1/2 -translate-y-1/2">
                            <GlassButton
                              size="icon"
                              type="button"
                              onClick={() => { setSearchQuery(''); setShowAutocomplete(false); setSelectedSuggestionIndex(-1); }}
                              aria-label="Clear search"
                            >
                              <X className="h-4 w-4 text-[#8A8478]" />
                            </GlassButton>
                          </div>
                        )}
                      </div>
                      {showAutocomplete && autocompleteSuggestions.length > 0 && (
                        <div
                          ref={autocompleteRef}
                          className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl overflow-hidden z-50 border border-[#E0DED8]"
                        >
                          {autocompleteSuggestions.map((suggestion, index) => (
                            <button
                              key={`${suggestion.name}-${index}`}
                              type="button"
                              onClick={() => handleSuggestionClick(suggestion)}
                              onMouseDown={(e) => e.preventDefault()}
                              className={
                                'autocomplete-suggestion w-full px-5 py-4 text-left flex items-center justify-between hover:bg-[#F6F4F0] transition-colors ' +
                                (selectedSuggestionIndex === index ? 'bg-[#F6F4F0]' : '')
                              }
                            >
                              <span className="font-medium text-[#2A2A2A]">{suggestion.name}</span>
                              {suggestion.category && (
                                <span className="font-mono text-xs uppercase tracking-wider text-[#6F6A63] bg-[#E9E4DA] px-2 py-1 rounded">
                                  {suggestion.category}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {showAutocomplete && searchQuery && autocompleteSuggestions.length === 0 && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl p-6 text-center z-50 border border-[#E0DED8]">
                          <p className="text-[#6F6A63]">No results found</p>
                        </div>
                      )}
                    </div>

                    {!searchQuery.trim() && Object.keys(groupedMenuItems).length > 0 && (
                      <div className="flex flex-wrap justify-center gap-3">
                        <GlassButton
                          size="sm"
                          onClick={() => {
                            setSelectedCategory('All');
                            document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          contentClassName="font-mono text-xs sm:text-sm uppercase tracking-widest"
                          className={selectedCategory === 'All' ? 'glass-button-selected' : ''}
                          aria-label="Show all categories"
                        >
                          All
                        </GlassButton>
                        {Object.keys(groupedMenuItems).map((categoryName) => (
                          <GlassButton
                            key={categoryName}
                            size="sm"
                            onClick={() => scrollToCategory(categoryName)}
                            contentClassName={'font-mono text-xs sm:text-sm uppercase tracking-widest truncate max-w-[180px]'}
                            className={selectedCategory === categoryName ? 'glass-button-selected' : ''}
                            aria-label={`Filter by ${categoryName}`}
                            title={categoryName}
                          >
                            {categoryName}
                          </GlassButton>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollExpandMedia>
              )}

              {/* Legacy hero kept out for now; search and categories are shown after scroll expansion above */}

              {/* Categories Showcase Section - DIR "Our Categories" carousel + scroll animate */}
              {!searchQuery.trim() && selectedCategory === 'All' && Object.keys(groupedMenuItems).length > 0 && (
                <section id="categories-section" data-scroll-animate className="py-16 sm:py-24 bg-[#F6F4F0] relative overflow-hidden scroll-mt-24">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-[#C68E3C]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C68E3C]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex items-end justify-between mb-12">
                      <div className="scroll-animate-left">
                        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#C68E3C] mb-3 block">
                          Browse
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2A2A2A] tracking-tight">
                          Our Categories
                        </h2>
                      </div>
                      <div className="scroll-animate-left hidden sm:flex items-center gap-3">
                        <GlassButton size="icon" type="button" onClick={() => scrollCarousel('left')} aria-label="Scroll left">
                          <ChevronLeft className="h-5 w-5" />
                        </GlassButton>
                        <GlassButton size="icon" type="button" onClick={() => scrollCarousel('right')} aria-label="Scroll right">
                          <ChevronRight className="h-5 w-5" />
                        </GlassButton>
                      </div>
                    </div>

                    {/* Carousel - horizontal scroll DIR style + stagger */}
                    <div
                      ref={categoryCarouselRef}
                      className="flex gap-5 sm:gap-6 overflow-x-auto pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 scrollbar-hide"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      onTouchStart={(e) => {
                        if (!categoryCarouselRef.current) categoryCarouselRef.current = {};
                        categoryCarouselRef.current.touchStartX = e.touches[0].clientX;
                      }}
                      onTouchEnd={(e) => {
                        if (!categoryCarouselRef.current?.touchStartX) return;
                        const touchEndX = e.changedTouches[0].clientX;
                        const diff = categoryCarouselRef.current.touchStartX - touchEndX;
                        if (Math.abs(diff) > 50) {
                          const categories = Object.keys(groupedMenuItems);
                          const totalSlides = Math.ceil(categories.length / itemsPerView);
                          const maxIndex = Math.max(0, totalSlides - 1);
                          if (diff > 0) {
                            setCategoryCarouselIndex(prev => (prev < maxIndex ? prev + 1 : 0));
                          } else {
                            setCategoryCarouselIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
                          }
                        }
                        if (categoryCarouselRef.current) categoryCarouselRef.current.touchStartX = null;
                      }}
                    >
                      {Object.keys(groupedMenuItems).map((categoryName, carouselIndex) => {
                        const categoryItems = groupedMenuItems[categoryName];
                        const itemsWithImages = categoryItems.filter(item => item.image_url);
                        const categoryImage = itemsWithImages.length > 0
                          ? getImageUrl(itemsWithImages[0].image_url)
                          : getPlaceholderImage(categoryName);
                        const itemCount = categoryItems.length;
                        const staggerClass = carouselIndex < 10 ? `scroll-stagger-${carouselIndex + 1}` : '';

                        return (
                          <button
                            key={categoryName}
                            onClick={() => scrollToCategory(categoryName)}
                            className={`scroll-animate-scale flex-shrink-0 group text-center min-w-[128px] ${staggerClass}`}
                            aria-label={`View ${categoryName} category`}
                          >
                            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden mb-5 shadow-lg group-hover:shadow-2xl transition-all duration-500 mx-auto">
                              <img
                                src={categoryImage}
                                alt={categoryName}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                                <span className="text-white font-mono text-xs uppercase tracking-widest bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                  View
                                </span>
                              </div>
                            </div>
                            <p className="font-medium text-sm sm:text-base text-[#2A2A2A] group-hover:text-[#C68E3C] transition-colors duration-300">
                              {categoryName}
                            </p>
                            <p className="font-mono text-xs text-[#6F6A63] mt-1">
                              {itemCount} items
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-center gap-2 mt-6 sm:hidden">
                      {Object.keys(groupedMenuItems).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#2A2A2A]/20" />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {Object.keys(groupedMenuItems).length === 0 ? (
                <div className="text-center py-16 bg-[#F6F4F0]">
                  {cafeBranding.logo_url && (
                    <img
                      src={getImageUrl(cafeBranding.logo_url)}
                      alt={`${cafeBranding.cafe_name || 'Cafe'} Logo`}
                      className="h-24 w-24 mx-auto mb-6 opacity-50"
                    />
                  )}
                  <h3 className="text-xl font-semibold mb-2 text-[#2A2A2A]">No menu items available</h3>
                  <p className="text-base text-[#6F6A63]">Add items in Menu Management to get started</p>
                </div>
              ) : searchQuery.trim() && Object.keys(filteredMenuItems).length === 0 ? (
                <div className="text-center py-16 max-w-6xl mx-auto bg-[#F6F4F0]">
                  <Search className="h-16 w-16 mx-auto mb-4 text-[#6F6A63]" />
                  <h3 className="text-xl font-semibold mb-2 text-[#2A2A2A]">No results found</h3>
                  <p className="text-base text-[#6F6A63] mb-4">
                    We couldn&apos;t find any items matching &quot;{searchQuery}&quot;
                  </p>
                  <GlassButton
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setShowAutocomplete(false);
                      setSelectedSuggestionIndex(-1);
                    }}
                    className="glass-button-primary"
                  >
                    Clear search
                  </GlassButton>
                </div>
              ) : (
                <div id="menu-items-section" className="w-full space-y-0 scroll-mt-40">
                  {/* Back to categories - when viewing a single category */}
                  {!searchQuery.trim() && selectedCategory !== 'All' && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mb-6">
                      <button
                        onClick={() => {
                          setSelectedCategory('All');
                          requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                              document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            });
                          });
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-[#2A2A2A] bg-[#E9E4DA] border border-[#2A2A2A]/10 hover:bg-[#C68E3C] hover:text-white hover:border-[#C68E3C] transition-colors duration-200 min-h-[44px]"
                        aria-label="Back to all categories"
                      >
                        <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                        <span>Back to categories</span>
                      </button>
                    </div>
                  )}

                  {searchQuery.trim() && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-[#2A2A2A]">
                          Search Results for &quot;{searchQuery}&quot;
                        </h3>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setShowAutocomplete(false);
                            setSelectedSuggestionIndex(-1);
                          }}
                          className="text-sm text-[#C68E3C] hover:text-[#2A2A2A] transition-colors"
                        >
                          Clear search
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Category Sections - DIR layout: number badge + title + card grid */}
                  <div key={`menu-list-${selectedCategory}`} className="contents">
                  {Object.entries(searchQuery.trim() ? filteredMenuItems : groupedMenuItems)
                    .filter(([categoryName]) => selectedCategory === 'All' || categoryName === selectedCategory)
                    .map(([categoryName, items], index) => {
                      const categoryNumber = String(index + 1).padStart(2, '0');
                      const slug = getCategorySlug(categoryName);
                      return (
                        <section
                          key={categoryName}
                          id={slug ? `category-${slug}` : undefined}
                          data-scroll-animate
                          className="py-16 sm:py-24 bg-[#F6F4F0] relative scroll-mt-24"
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#C68E3C]/[0.02] to-transparent pointer-events-none" />
                          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                            <div className="mb-12 sm:mb-16">
                              <div className="scroll-animate-left flex items-baseline gap-4 mb-4">
                                <span className="font-mono text-sm text-[#C68E3C] bg-[#C68E3C]/10 px-3 py-1 rounded-full">
                                  {categoryNumber}
                                </span>
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2A2A2A] tracking-tight">
                                  {categoryName}
                                </h2>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                              {items.map((item, itemIndex) => {
                                const itemImage = item.image_url
                                  ? getImageUrl(item.image_url)
                                  : getPlaceholderImage(item.category_name, item.name);
                                const quantity = getCartQuantity(item.id);
                                const staggerClass = itemIndex < 10 ? `scroll-stagger-${itemIndex + 1}` : '';

                                return (
                                  <div
                                    key={item.id}
                                    className={`scroll-animate-scale group overflow-hidden border-0 bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-2 ${staggerClass}`}
                                  >
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                      <img
                                        src={itemImage}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                                        <span className="font-mono text-sm font-medium text-[#C68E3C]">
                                          {formatCurrency(ensureNumber(item.price))}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="p-5 sm:p-6">
                                      <h3 className="font-semibold text-lg sm:text-xl text-[#2A2A2A] mb-2 group-hover:text-[#C68E3C] transition-colors duration-300">
                                        {item.name}
                                      </h3>
                                      <p className="text-sm text-[#6F6A63] mb-5 line-clamp-2 leading-relaxed">
                                        {item.description || 'Delicious choice from our menu.'}
                                      </p>
                                      {quantity === 0 ? (
                                        <GlassButton
                                          size="default"
                                          onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                          contentClassName="w-full flex items-center justify-center gap-2 !py-5"
                                          className="w-full glass-button-primary"
                                          aria-label={`Add ${item.name} to cart`}
                                        >
                                          <ShoppingBag className="h-4 w-4" />
                                          Add to cart
                                        </GlassButton>
                                      ) : (
                                        <div className="flex items-center justify-between bg-[#F6F4F0] rounded-xl p-2">
                                          <GlassButton
                                            size="icon"
                                            type="button"
                                            onClick={() => updateQuantity(item.id, quantity - 1)}
                                            aria-label="Decrease quantity"
                                          >
                                            <Minus className="h-4 w-4" />
                                          </GlassButton>
                                          <span className="font-mono text-lg font-medium text-[#2A2A2A]">{quantity}</span>
                                          <GlassButton
                                            size="icon"
                                            type="button"
                                            onClick={() => updateQuantity(item.id, quantity + 1)}
                                            aria-label="Increase quantity"
                                          >
                                            <Plus className="h-4 w-4" />
                                          </GlassButton>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </section>
                      );
                    })}
                  </div>

                  {/* Promo Banner - DIR placement after category sections */}
                  <PromoBannerSection
                    banners={promoBanners}
                    loading={loadingBranding}
                    error={brandingError}
                  />

                  {/* Special Proposals - DIR style (#E9E4DA bg, Featured pill, Popular badge) + scroll animate */}
                  {(loadingMostOrdered || mostOrderedItems.length > 0) && (
                    <section data-scroll-animate className="py-20 sm:py-28 bg-[#E9E4DA] relative overflow-hidden">
                      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C68E3C]/10 rounded-full blur-3xl -translate-y-1/2" />
                      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#C68E3C]/5 rounded-full blur-3xl translate-y-1/2" />
                      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #2A2A2A 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                        <div className="text-center mb-14 sm:mb-20">
                          <div className="scroll-animate-in inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6 shadow-sm">
                            <Star className="h-4 w-4 text-[#C68E3C] fill-[#C68E3C]" />
                            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#6F6A63]">
                              Featured
                            </span>
                          </div>
                          <h2 className="scroll-animate-in scroll-stagger-1 text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2A2A2A] mb-5 tracking-tight">
                            Special Proposals
                          </h2>
                          <p className="text-[#6F6A63] max-w-lg mx-auto text-lg leading-relaxed">
                            Our most popular items, handpicked for first-timers and regulars alike.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                          {loadingMostOrdered ? (
                            [1, 2, 3].map((i) => (
                              <div key={`special-skeleton-${i}`} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                                <div className="aspect-[16/10] bg-[#E9E4DA]" />
                                <div className="p-5 sm:p-6">
                                  <div className="h-5 bg-[#E9E4DA] rounded w-3/4 mb-2" />
                                  <div className="h-4 bg-[#E9E4DA]/60 rounded w-full mb-4" />
                                  <div className="h-12 bg-[#E9E4DA] rounded-xl w-1/2" />
                                </div>
                              </div>
                            ))
                          ) : mostOrderedItems.map((item, specialIndex) => {
                            const specialImage = item.image_url
                              ? getImageUrl(item.image_url)
                              : getPlaceholderImage(item.category_name, item.name);
                            const quantity = getCartQuantity(item.id);
                            const staggerClass = specialIndex < 10 ? `scroll-stagger-${specialIndex + 1}` : '';

                            return (
                              <div
                                key={`special-${item.id}`}
                                className={`scroll-animate-scale group overflow-hidden border-0 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-3 ${staggerClass}`}
                              >
                                <div className="relative aspect-[16/10] overflow-hidden">
                                  <img
                                    src={specialImage}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                                    <span className="font-mono text-sm font-semibold text-[#C68E3C]">
                                      {formatCurrency(ensureNumber(item.price))}
                                    </span>
                                  </div>
                                  <div className="absolute top-4 left-4 bg-[#C68E3C] text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                    <Star className="h-3 w-3 fill-white" />
                                    <span className="font-mono text-xs uppercase tracking-wider">Popular</span>
                                  </div>
                                </div>
                                <div className="p-5 sm:p-6">
                                  <h3 className="font-semibold text-xl text-[#2A2A2A] mb-2 group-hover:text-[#C68E3C] transition-colors duration-300">
                                    {item.name}
                                  </h3>
                                  <p className="text-sm text-[#6F6A63] mb-5 line-clamp-2 leading-relaxed">
                                    {item.description || 'A customer favorite.'}
                                  </p>
                                  {quantity === 0 ? (
                                    <GlassButton
                                      size="default"
                                      onClick={() => addToCart(item)}
                                      contentClassName="w-full flex items-center justify-center gap-2 !py-5"
                                      className="w-full glass-button-primary"
                                      aria-label={`Add ${item.name} to cart`}
                                    >
                                      <ShoppingBag className="h-4 w-4" />
                                      Add to cart
                                    </GlassButton>
                                  ) : (
                                    <div className="flex items-center justify-between bg-[#F6F4F0] rounded-xl p-2">
                                      <GlassButton
                                        size="icon"
                                        type="button"
                                        onClick={() => updateQuantity(item.id, quantity - 1)}
                                        aria-label="Decrease quantity"
                                      >
                                        <Minus className="h-4 w-4" />
                                      </GlassButton>
                                      <span className="font-mono text-lg font-medium text-[#2A2A2A]">{quantity}</span>
                                      <GlassButton
                                        size="icon"
                                        type="button"
                                        onClick={() => updateQuantity(item.id, quantity + 1)}
                                        aria-label="Increase quantity"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </GlassButton>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="text-center mt-14">
                          <GlassButton
                            size="lg"
                            onClick={() => document.getElementById('menu-items-section')?.scrollIntoView({ behavior: 'smooth' })}
                            contentClassName="flex items-center justify-center gap-2"
                          >
                            <span>View All Products</span>
                            <ChevronDown className="h-5 w-5" />
                          </GlassButton>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Footer - DIR style (#F6F4F0, #2A2A2A, #C68E3C) + scroll animate */}
                  <footer data-scroll-animate className="py-20 sm:py-28 bg-[#F6F4F0] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#C68E3C]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="scroll-animate-in space-y-5">
                          <div className="mb-6">
                            <h3 className="text-2xl sm:text-3xl font-bold text-[#2A2A2A] mb-1">
                              {cafeBranding.cafe_name || 'Café'}
                            </h3>
                            <p className="font-serif italic text-[#6F6A63] text-lg">Café</p>
                          </div>
                          <p className="text-[#6F6A63] text-sm leading-relaxed mb-4">
                            Have questions or want to make a reservation? We&apos;d love to hear from you.
                          </p>
                          {cafeBranding && (
                            <div className="space-y-4">
                              {cafeBranding.address && (
                                <div className="flex items-start gap-4 group">
                                  <div className="w-10 h-10 rounded-full bg-[#E9E4DA] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C68E3C] group-hover:text-white transition-colors duration-300">
                                    <MapPin className="h-4 w-4 text-[#6F6A63] group-hover:text-white transition-colors" />
                                  </div>
                                  <span className="text-[#2A2A2A] pt-2">{cafeBranding.address}</span>
                                </div>
                              )}
                              {cafeBranding.phone && (
                                <a href={`tel:${cafeBranding.phone}`} className="flex items-center gap-4 group">
                                  <div className="w-10 h-10 rounded-full bg-[#E9E4DA] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C68E3C] transition-colors duration-300">
                                    <Phone className="h-4 w-4 text-[#6F6A63] group-hover:text-white transition-colors" />
                                  </div>
                                  <span className="text-[#2A2A2A] group-hover:text-[#C68E3C] transition-colors">{cafeBranding.phone}</span>
                                </a>
                              )}
                              {cafeBranding.email && (
                                <a href={`mailto:${cafeBranding.email}`} className="flex items-center gap-4 group">
                                  <div className="w-10 h-10 rounded-full bg-[#E9E4DA] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C68E3C] transition-colors duration-300">
                                    <Mail className="h-4 w-4 text-[#6F6A63] group-hover:text-white transition-colors" />
                                  </div>
                                  <span className="text-[#2A2A2A] group-hover:text-[#C68E3C] transition-colors">{cafeBranding.email}</span>
                                </a>
                              )}
                              {cafeSettings.website && (
                                <a href={cafeSettings.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                                  <div className="w-10 h-10 rounded-full bg-[#E9E4DA] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C68E3C] transition-colors duration-300">
                                    <MapPin className="h-4 w-4 text-[#6F6A63] group-hover:text-white transition-colors" />
                                  </div>
                                  <span className="text-[#2A2A2A] group-hover:text-[#C68E3C] transition-colors">Website</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-[#C68E3C]/10 flex items-center justify-center">
                              <Star className="h-4 w-4 text-[#C68E3C]" />
                            </div>
                            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[#6F6A63]">Gallery</h4>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {galleryItems.map((item, idx) => {
                              const imageUrl = item.image_url ? getImageUrl(item.image_url) : getPlaceholderImage(item.category_name, item.name);
                              return (
                                <div key={`gallery-${idx}-${item.id || idx}`} className="aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group">
                                  <img src={imageUrl} alt={item.name || `Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                              );
                            })}
                          </div>
                          {allGalleryItems.length > 6 && (
                            <button
                              onClick={() => setGalleryExpanded(!galleryExpanded)}
                              className="mt-5 text-sm text-[#C68E3C] hover:text-[#2A2A2A] transition-colors font-medium min-h-[44px]"
                            >
                              {galleryExpanded ? 'Show Less' : `View All ${allGalleryItems.length} Photos`}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-16 pt-8 border-t border-[#2A2A2A]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-[#6F6A63]">
                          © {new Date().getFullYear()} {cafeBranding.cafe_name || 'Café'}. Crafted with care.
                        </p>
                        <button
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="text-[#6F6A63] hover:text-[#2A2A2A] hover:bg-[#E9E4DA] min-h-[44px] px-4 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-2"
                        >
                          <span>Back to top</span>
                          <ChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                        </button>
                      </div>
                    </div>
                  </footer>
                </div>
              )}
            </div>
          ) : (
            /* Order History Tab */
            <CustomerOrderHistory
              customerPhone={customer?.phone}
              cafeSlug={cafeSlug}
              setActiveTab={setActiveTab}
              cart={cart}
              setCart={setCart}
            />
          )}
        </div>
      </main>

      {/* Floating Cart Bar - mobile only, DIR style */}
      {activeTab === 'menu' && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white border-t border-[#2A2A2A]/10 shadow-lg lg:hidden">
          <button
            onClick={() => setShowCart(true)}
            className="w-full flex items-center justify-between bg-[#2A2A2A] text-white rounded-xl px-4 py-3 min-h-[44px]"
            aria-label="View cart"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#C68E3C] rounded-full text-xs flex items-center justify-center font-medium">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              </div>
              <span className="text-sm font-medium">
                {cart.reduce((total, item) => total + item.quantity, 0)} items
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-medium">{formatCurrency(getSubtotal())}</span>
              <ChevronRight className="h-5 w-5" />
            </div>
          </button>
        </div>
      )}

      {/* Cart - Template Sheet (right-side drawer) */}
      <Sheet open={showCart} onClose={() => setShowCart(false)} title="Your Order">
        <div className="flex flex-col gap-6">
                {/* 1. Cart Items */}
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-6 rounded-lg bg-accent-50 p-12 text-center shadow-sm">
                    <div className="text-secondary-600">
                      <ShoppingCart className="h-24 w-24" />
                    </div>
                    <h3 className="text-2xl font-bold text-secondary-700">Your cart is empty</h3>
                    <p className="max-w-sm text-secondary-600">Looks like you haven&apos;t added anything to your order yet. Let&apos;s fix that!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div>
                      <h2 className="text-lg font-bold text-secondary-700 mb-3">Items</h2>
                      <div className="flex flex-col gap-3">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 rounded-lg bg-accent-50 p-3 shadow-sm border border-accent-200">
                            <div
                              className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-14 flex-shrink-0"
                              style={{
                                backgroundImage: `url('${item.image_url
                                  ? getImageUrl(item.image_url)
                                  : getPlaceholderImage(item.category_name, item.name)
                                  }')`
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-secondary-700 truncate">{item.name}</p>
                              <p className="text-xs text-secondary-600">{formatCurrency(item.price)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <GlassButton
                                size="icon"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="!min-w-[36px] !min-h-[36px] [&_.glass-button]:!h-9 [&_.glass-button]:!w-9 [&_.glass-button-text]:!h-9 [&_.glass-button-text]:!w-9"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-4 w-4" />
                              </GlassButton>
                              <span className="w-8 text-center text-sm font-medium text-secondary-700">{item.quantity}</span>
                              <GlassButton
                                size="icon"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="!min-w-[36px] !min-h-[36px] [&_.glass-button]:!h-9 [&_.glass-button]:!w-9 [&_.glass-button-text]:!h-9 [&_.glass-button-text]:!w-9"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-4 w-4" />
                              </GlassButton>
                            </div>
                            <p className="text-sm font-semibold text-secondary-700 w-16 text-right">{formatCurrency(item.price * item.quantity)}</p>
                            <GlassButton
                              size="icon"
                              onClick={() => removeFromCart(item.id)}
                              className="[&_.glass-button]:!bg-transparent [&_.glass-button]:!border-transparent [&_.glass-button]:!shadow-none [&_.glass-button:hover]:!bg-red-50 [&_.glass-button]:text-secondary-600 [&_.glass-button:hover]:!text-red-500"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </GlassButton>
                          </div>
                        ))}
                      </div>
                    </div>

                {/* 2. Order Summary */}
                    <div className="rounded-xl bg-accent-50 p-4 shadow-sm border border-accent-200">
                      <h3 className="font-bold text-secondary-700 mb-3 text-sm">Order Summary</h3>

                      <div className="flex flex-col gap-3 border-b border-accent-200 pb-4">
                        <div className="flex justify-between">
                          <p className="text-secondary-600">Subtotal</p>
                          <p className="font-medium text-secondary-700">{formatCurrency(getSubtotal())}</p>
                        </div>
                        {showTaxInMenu && taxAmount > 0 && (
                          <div className="flex justify-between">
                            <p className="text-secondary-600">Taxes ({taxRate}%)</p>
                            <p className="font-medium text-secondary-700">{formatCurrency(taxAmount)}</p>
                          </div>
                        )}
                        {tipAmount > 0 && (
                          <div className="flex justify-between">
                            <p className="text-secondary-600">Tip</p>
                            <p className="font-medium text-secondary-700">{formatCurrency(tipAmount)}</p>
                          </div>
                        )}
                        {pointsToRedeem > 0 && (
                          <div className="flex justify-between text-green-600">
                            <p>Points Redeemed ({pointsToRedeem} pts)</p>
                            <p className="font-medium">-{formatCurrency(pointsToRedeem * 0.1)}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <p className="text-lg font-bold text-secondary-700">Total</p>
                        <p className="text-xl font-extrabold text-secondary-700">{formatCurrency(getTotal())}</p>
                      </div>
                    </div>

                    {/* 3. Login or Customer & checkout options */}
                    <>
                    {!customer ? (
                        <div className="p-6 bg-secondary-50 border border-secondary-200 rounded-lg">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-secondary-700 mb-2">
                              Login Required
                            </h3>
                            <p className="text-secondary-600 mb-4 text-sm">
                              Please login to place your order
                            </p>
                            <button
                              onClick={() => {
                                setShowCart(false);
                                setShowLoginModal(true);
                              }}
                              className="w-full bg-secondary-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-secondary-600 transition-colors"
                            >
                              Login & Continue
                            </button>
                          </div>
                        </div>
                      ) : (
                        <React.Fragment>
                          {/* Customer Information */}
                          <div className="p-4 bg-secondary-50 border border-secondary-200 rounded-lg">
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <h3 className="font-bold text-secondary-700 flex items-center text-base shrink-0">
                                <User className="h-4 w-4 mr-2 text-secondary-600" />
                                Customer Info
                              </h3>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={openEditProfile}
                                  className="flex items-center justify-center gap-1 px-3 py-1.5 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors text-xs whitespace-nowrap"
                                >
                                  <Edit3 className="h-3 w-3 shrink-0" />
                                  <span>Edit Profile</span>
                                </button>
                                {onLogout && (
                                  <button
                                    type="button"
                                    onClick={onLogout}
                                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs whitespace-nowrap"
                                  >
                                    <LogOut className="h-3 w-3 shrink-0" />
                                    <span>Logout</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-secondary-600">Name:</span>
                                <span className="font-semibold text-secondary-700">{customer.name}</span>
                              </div>
                              {customer.phone && (
                                <div className="flex justify-between">
                                  <span className="text-secondary-600">Phone:</span>
                                  <span className="font-semibold text-secondary-700">{customer.phone}</span>
                                </div>
                              )}
                              {customer.loyalty_points > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-secondary-600">Points:</span>
                                  <span className="flex items-center text-yellow-600 font-semibold">
                                    <Star className="h-3 w-3 mr-1" />
                                    {customer.loyalty_points}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment Method */}
                          <div>
                            <h3 className="font-bold text-secondary-700 mb-3 text-sm">Payment Method</h3>
                            <div className="grid grid-cols-2 gap-2">
                              {paymentMethods.map((method) => (
                                <button
                                  key={method.code}
                                  type="button"
                                  onClick={() => setPaymentMethod(method.code)}
                                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-colors ${paymentMethod === method.code
                                    ? 'bg-secondary-500 text-white border-secondary-500'
                                    : 'bg-white text-secondary-700 border-accent-200 hover:border-secondary-500'
                                    }`}
                                >
                                  <span className="mr-2">{method.icon}</span>
                                  <span className="font-semibold text-sm">{method.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Pickup Option */}
                          <div className="min-w-0">
                            <h3 className="font-bold text-secondary-700 mb-3 text-sm">Dining Preference</h3>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { value: 'pickup', label: 'Pick up', icon: '🥡' },
                                { value: 'dine-in', label: 'Dine in', icon: '🍽️' }
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => setPickupOption(option.value)}
                                  className={`p-3 rounded-lg border-2 transition-colors min-w-0 ${pickupOption === option.value
                                    ? 'bg-secondary-500 text-white border-secondary-500'
                                    : 'bg-white text-secondary-700 border-accent-200 hover:border-secondary-500'
                                    }`}
                                >
                                  <div className="flex items-center justify-center gap-1.5 overflow-hidden">
                                    <span className="text-lg shrink-0">{option.icon}</span>
                                    <span className="font-semibold text-sm truncate">{option.label}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Table Number for Dine-in */}
                          {pickupOption === 'dine-in' && (
                            <div>
                              <label className="block font-bold text-secondary-700 mb-2 text-sm">Table Number</label>
                              <input
                                type="text"
                                placeholder="Enter table number (optional)"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="w-full p-3 border-2 border-accent-200 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white text-secondary-700 transition-colors"
                              />
                            </div>
                          )}

                          {/* Points Redemption */}
                          {customer?.loyalty_points > 0 && (
                            <div>
                              <h3 className="font-bold text-secondary-700 mb-3 text-sm flex items-center">
                                <Star className="h-4 w-4 mr-2 text-yellow-600" />
                                Redeem Points
                              </h3>
                              <div className="bg-yellow-50 rounded-lg p-4 mb-3 border border-yellow-200">
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-secondary-700">{customer.loyalty_points}</div>
                                    <div className="text-secondary-600">Available</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-secondary-700">{maxRedeemablePoints}</div>
                                    <div className="text-secondary-600">Max Redeemable</div>
                                  </div>
                                </div>
                                <div className="text-center mt-2 text-xs text-secondary-600">
                                  1 point = {formatCurrency(0.10)}
                                </div>
                              </div>
                              <input
                                type="number"
                                value={pointsToRedeem}
                                onChange={(e) => handlePointsRedemption(parseInt(e.target.value) || 0)}
                                min="0"
                                max={maxRedeemablePoints}
                                className="w-full p-3 border-2 border-accent-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-secondary-700 transition-colors"
                                placeholder="Enter points"
                              />
                            </div>
                          )}

                          {/* Tip Selection */}
                          <div className="min-w-0">
                            <h3 className="font-bold text-secondary-700 mb-3 text-sm">Add Tip</h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {[0, 10, 15, 18, 20, 25].map((percentage) => (
                                <button
                                  key={percentage}
                                  type="button"
                                  onClick={() => handleTipPercentageChange(percentage)}
                                  className={`py-2 px-3 text-xs rounded-lg border-2 transition-colors font-semibold shrink-0 ${tipPercentage === percentage
                                    ? 'bg-secondary-500 text-white border-secondary-500'
                                    : 'bg-white text-secondary-700 border-accent-200 hover:border-secondary-500'
                                    }`}
                                >
                                  {percentage === 0 ? 'No Tip' : `${percentage}%`}
                                </button>
                              ))}
                            </div>
                            <input
                              type="number"
                              value={tipAmount.toFixed(2)}
                              onChange={(e) => handleTipAmountChange(e.target.value)}
                              className="w-full p-3 border-2 border-accent-200 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white text-secondary-700 transition-colors"
                              placeholder="Custom tip"
                            />
                          </div>
                        </React.Fragment>
                      )}
                    </>

                    <div className="flex flex-col gap-3 pt-2">
                      <GlassButton
                        type="button"
                        onClick={placeOrder}
                        disabled={orderLoading || !customer}
                        size="default"
                        contentClassName="w-full flex items-center justify-center gap-2"
                        className="w-full glass-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {orderLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            <span>Placing Order...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5" />
                            <span>Proceed to Checkout</span>
                          </>
                        )}
                      </GlassButton>

                      <GlassButton
                        size="sm"
                        onClick={clearCart}
                        contentClassName="w-full flex items-center justify-center"
                      >
                        Clear Cart
                      </GlassButton>
                    </div>
                  </div>
                )}
        </div>
      </Sheet>

      {/* Floating Cart Summary Bar - Mobile Only */}
      {cart.length > 0 && (
        <footer className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-accent-200 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <p className="text-secondary-600 text-sm font-medium">
                  {cart.reduce((total, item) => total + item.quantity, 0)} items
                </p>
                <p className="text-secondary-700 text-lg font-bold">
                  {formatCurrency(getSubtotal())}
                </p>
              </div>
              <button
                onClick={() => setShowCart(true)}
                className="flex items-center justify-center gap-2 rounded-lg bg-secondary-500 min-h-[44px] h-12 px-6 hover:bg-secondary-600 transition-colors"
                aria-label="View cart"
              >
                <ShoppingCart className="h-5 w-5 text-white" />
                <span className="text-white text-base font-bold">View Cart</span>
              </button>
            </div>
          </div>
        </footer>
      )}


      {/* Edit Profile - Template Dialog */}
      <Dialog
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Edit Profile"
      >
        {showEditProfile && (
            <div className="pt-0">
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editProfileData.name}
                    onChange={(e) => handleProfileInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-accent-200 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors bg-white text-secondary-700"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editProfileData.email}
                    onChange={(e) => handleProfileInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-accent-200 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors bg-white text-secondary-700"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={editProfileData.address}
                    onChange={(e) => handleProfileInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-accent-200 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors bg-white text-secondary-700 resize-none"
                    placeholder="Enter your address"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editProfileData.date_of_birth}
                    onChange={(e) => handleProfileInputChange('date_of_birth', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-accent-200 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors bg-white text-secondary-700"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <GlassButton
                    type="button"
                    onClick={() => setShowEditProfile(false)}
                    size="default"
                    contentClassName="flex-1 flex items-center justify-center"
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    disabled={profileLoading}
                    size="default"
                    contentClassName="flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    className="glass-button-primary"
                  >
                    {profileLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </GlassButton>
                </div>
              </form>
            </div>
        )}
      </Dialog>

      {/* Customer Profile - Template Dialog (centered modal) */}
      <Dialog
        open={!!(showProfile && customer)}
        onClose={() => { setShowProfile(false); setProfileOpenSection(null); }}
        title={profileOpenSection === 'orders' ? 'My Orders' : 'Profile'}
        size="4xl"
      >
        {showProfile && customer && (
          <CustomerProfile
            customer={customer}
            onCustomerUpdate={onCustomerUpdate}
            onLogout={() => {
              setShowProfile(false);
              setProfileOpenSection(null);
              onLogout();
            }}
            onClose={() => { setShowProfile(false); setProfileOpenSection(null); }}
            initialSection={profileOpenSection}
            setActiveTab={(tab) => {
              setShowProfile(false);
              setProfileOpenSection(null);
              setActiveTab(tab);
            }}
            cart={cart}
            setCart={setCart}
            embedded
          />
        )}
      </Dialog>
    </div>
  );
};

export default CustomerMenu;

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, X, Search, User, Phone, Mail, MapPin, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, Gift, Star, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Utensils, Coffee, Pizza, Sandwich, Salad, Cake, Wine, Heart, Sparkles, TrendingUp, Award, Zap, LogOut, Edit3, Save, Calendar, Menu, ShoppingBag } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import CustomerOrderHistory from './CustomerOrderHistory';
import CustomerProfile from './CustomerProfile';
import CafeInfo from './CafeInfo';
import { getImageUrl, getPlaceholderImage, getCategoryBackground } from '../utils/imageUtils';

const CustomerMenu = ({
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
  onCustomerUpdate,
  onLogout
}) => {
  const { formatCurrency } = useCurrency();
  const { cafeSettings } = useCafeSettings();
  const { isDarkMode } = useDarkMode();
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
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [categoryCarouselIndex, setCategoryCarouselIndex] = useState(0);
  const categoryScrollRef = useRef(null);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const categoryCarouselRef = useRef(null);

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
  const [cafePublicInfo, setCafePublicInfo] = useState(null);
  const [loadingMostOrdered, setLoadingMostOrdered] = useState(false);

  // Helper function to ensure price is a number
  const ensureNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Get category icon based on category name
  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('burger') || name.includes('sandwich')) return <Sandwich className="h-6 w-6" />;
    if (name.includes('pizza')) return <Pizza className="h-6 w-6" />;
    if (name.includes('salad') || name.includes('vegetable')) return <Salad className="h-6 w-6" />;
    if (name.includes('dessert') || name.includes('cake')) return <Cake className="h-6 w-6" />;
    if (name.includes('coffee') || name.includes('tea') || name.includes('drink')) return <Wine className="h-6 w-6" />;
    return <Utensils className="h-6 w-6" />;
  };

  // Fetch menu items, tax settings, and payment methods
  useEffect(() => {
    fetchMenuItems();
    fetchTaxSettings();
    fetchPaymentMethods();
    fetchMostOrderedItems();
    fetchCafePublicInfo();
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

  // Focus search input when expanded
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

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
      const response = await axios.get('/menu');
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
      const response = await axios.get('/tax-settings/menu');
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
      const response = await axios.get('/payment-methods');
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
      const response = await axios.get('/menu/featured?limit=6');
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

  // Fetch cafe public info
  const fetchCafePublicInfo = async () => {
    try {
      const response = await axios.get('/menu/public-info');
      if (response.data) {
        setCafePublicInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching cafe public info:', error);
      // Gracefully handle error - fields will be hidden if missing
      setCafePublicInfo(null);
    }
  };

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
      const orderData = {
        customerName: customer.name,
        customerPhone: customer.phone || '',
        customerEmail: customer.email || '',
        tableNumber: tableNumber,
        paymentMethod: paymentMethod,
        pickupOption: pickupOption,
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
          const customerResponse = await axios.post('/customer/login', { phone: customer.phone });
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
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
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
    try {
      const response = await axios.get(`/customer/orders?customer_phone=${customer?.phone}`);
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

  // Check order status periodically if there's a recent order
  useEffect(() => {
    if (recentOrder && orderStatus === 'pending') {
      const interval = setInterval(() => {
        checkOrderStatus(recentOrder.orderNumber);
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
            <Utensils className="h-10 w-10 text-white animate-pulse" />
          </div>
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
          </div>
          <p className="mt-6 text-xl font-medium text-text-light dark:text-text-dark">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full flex flex-col min-h-screen bg-white/80"

    >
      {/* Sticky Header / Top App Bar */}
      <div>

        <header className="max-w-full mx-auto bg-white rounded-t-xl dark:bg-gray-800 shadow-sm sticky top-0 z-20 w-full">

        </header>
        {/* Mobile Category Scroller */}
      </div>
      {activeTab === 'menu' && (
        <div className="lg:hidden sticky top-16 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-accent-200 dark:border-gray-700">
          <div
            ref={categoryScrollRef}
            className="flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              onClick={() => setSelectedCategory('All')}
              className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full pl-5 pr-5 cursor-pointer transition-colors ${selectedCategory === 'All'
                ? 'bg-secondary-500 text-white'
                : 'bg-accent-100 dark:bg-gray-700 text-secondary-700 dark:text-gray-200'
                }`}
            >
              <p className={`text-sm ${selectedCategory === 'All' ? 'font-bold' : 'font-medium'}`}>
                All
              </p>
            </button>
            {Object.keys(groupedMenuItems).map((categoryName) => (
              <button
                key={categoryName}
                onClick={() => setSelectedCategory(categoryName)}
                className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full pl-5 pr-5 cursor-pointer transition-colors ${selectedCategory === categoryName
                  ? 'bg-secondary-500 text-white'
                  : 'bg-accent-100 dark:bg-gray-700 text-secondary-700 dark:text-gray-200'
                  }`}
              >
                <p className={`text-sm ${selectedCategory === categoryName ? 'font-bold' : 'font-medium'}`}>
                  {categoryName}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="min-h-screen">
        <div className="w-full pt-8 pb-12 sm:pt-12 sm:pb-16 bg-white">
          {activeTab === 'menu' ? (
            <div>
              {/* Hero Section with Background Image */}
              <div className="relative w-full -mt-8 sm:-mt-12 mb-16">
                <div
                  className="relative h-[400px] sm:h-[500px] bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
                  }}
                >
                  {/* Header Overlay - Fixed at top */}
                  <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex items-center justify-between h-16 pointer-events-auto">
                        {/* Logo and Title */}
                        <div className="flex items-center gap-3">
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                          <button
                            onClick={() => setActiveTab('menu')}
                            className={`text-sm font-medium transition-colors text-white ${activeTab === 'menu'
                              ? 'font-semibold'
                              : 'hover:text-orange-300'
                              }`}
                          >
                            <CafeInfo nameSize="text-2xl" />
                          </button>
                          {customer && (
                            <button
                              onClick={() => setActiveTab('history')}
                              className={`text-sm font-medium transition-colors text-white ${activeTab === 'history'
                                ? 'font-semibold'
                                : 'hover:text-orange-300'
                                }`}
                            >
                              My Orders
                            </button>
                          )}
                        </nav>

                        {/* Right Side Icons */}
                        <div className="flex items-center gap-3">
                          {/* Cart */}
                          <button
                            onClick={() => setShowCart(true)}
                            className="relative w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                          >
                            <ShoppingBag className="h-5 w-5" />
                            {cart.length > 0 && (
                              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                                {cart.reduce((total, item) => total + item.quantity, 0)}
                              </span>
                            )}
                          </button>

                          {/* User Profile - Only show when logged in */}
                          {customer && (
                            <button
                              onClick={() => setShowProfile(true)}
                              className="flex items-center justify-center h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                              title={customer.name}
                            >
                              <User className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold mb-4 text-white">
                      Discover Our menu
                    </h1>
                    <p className="text-white/80 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed mb-8">
                      Quaerat debitis, vel, sapiente dicta sequi labore porro pariatur harum expedita.
                    </p>
                    <div className="flex flex-col items-center gap-4 w-full">
                      {/* Search Bar Container */}
                      <div className="relative w-full max-w-2xl">
                        {!searchExpanded ? (
                          /* Search Button - Initial State */
                          <button
                            onClick={() => setSearchExpanded(true)}
                            className="w-full px-6 py-4 bg-white/95 hover:bg-white text-gray-700 font-medium rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 group"
                          >
                            <Search className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                            <span className="text-gray-500 group-hover:text-gray-700">Search menu...</span>
                          </button>
                        ) : (
                          /* Expanded Search Bar */
                          <div className="relative w-full animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="relative">
                              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                              <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search menu items, categories..."
                                value={searchQuery}
                                onChange={(e) => {
                                  setSearchQuery(e.target.value);
                                  setSelectedSuggestionIndex(-1);
                                }}
                                onKeyDown={handleSearchKeyDown}
                                onFocus={() => {
                                  if (autocompleteSuggestions.length > 0) {
                                    setShowAutocomplete(true);
                                  }
                                }}
                                onBlur={(e) => {
                                  // Don't close if clicking on autocomplete or clear button
                                  if (
                                    !e.relatedTarget?.closest('.autocomplete-suggestion') &&
                                    !e.relatedTarget?.closest('.search-clear-btn') &&
                                    !searchQuery
                                  ) {
                                    setTimeout(() => {
                                      setSearchExpanded(false);
                                      setShowAutocomplete(false);
                                    }, 200);
                                  }
                                }}
                                className="w-full pl-14 pr-14 py-4 rounded-full bg-white dark:bg-gray-800 border-2 border-orange-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 shadow-2xl transition-all text-base"
                                autoFocus
                              />
                              {searchQuery && (
                                <button
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setSearchQuery('');
                                    setShowAutocomplete(false);
                                    setSelectedSuggestionIndex(-1);
                                    setSearchExpanded(false);
                                  }}
                                  className="search-clear-btn absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              )}

                              {/* Autocomplete Suggestions */}
                              {showAutocomplete && autocompleteSuggestions.length > 0 && (
                                <div
                                  ref={autocompleteRef}
                                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 max-h-80 overflow-y-auto"
                                >
                                  {autocompleteSuggestions.map((suggestion, index) => (
                                    <button
                                      key={`${suggestion.name}-${index}`}
                                      type="button"
                                      onClick={() => handleSuggestionClick(suggestion)}
                                      onMouseDown={(e) => e.preventDefault()}
                                      className={`autocomplete-suggestion w-full px-5 py-3 text-left hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${selectedSuggestionIndex === index
                                          ? 'bg-orange-50 dark:bg-gray-700'
                                          : ''
                                        }`}
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {suggestion.name}
                                        </div>
                                        {suggestion.category && (
                                          <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {suggestion.category}
                                          </div>
                                        )}
                                      </div>
                                      <Search className="h-4 w-4 text-gray-400" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Side Icons */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 hidden sm:flex">

                    
                  </div>
                </div>
              </div>

              {/* Categories Showcase Section - Circular Carousel */}
              {!searchQuery.trim() && Object.keys(groupedMenuItems).length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                  <div className="text-center mb-10">
                    <div className="flex items-center justify-center mb-3">
                      <div className="h-px w-12 bg-orange-500 mr-3"></div>
                      <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Explore</span>
                      <div className="h-px w-12 bg-orange-500 ml-3"></div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-3">
                      Our Categories
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                      Discover our delicious selection organized by category
                    </p>
                  </div>

                  {/* Categories Carousel */}
                  <div className="relative">
                    {/* Navigation Arrows */}
                    {Object.keys(groupedMenuItems).length > 4 && (
                      <>
                        <button
                          onClick={() => {
                            const categories = Object.keys(groupedMenuItems);
                            const maxIndex = Math.max(0, categories.length - 4);
                            setCategoryCarouselIndex(prev => prev > 0 ? prev - 1 : maxIndex);
                          }}
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300 group"
                          aria-label="Previous categories"
                        >
                          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300 group-hover:text-white" />
                        </button>
                        <button
                          onClick={() => {
                            const categories = Object.keys(groupedMenuItems);
                            const maxIndex = Math.max(0, categories.length - 4);
                            setCategoryCarouselIndex(prev => prev < maxIndex ? prev + 1 : 0);
                          }}
                          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300 group"
                          aria-label="Next categories"
                        >
                          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300 group-hover:text-white" />
                        </button>
                      </>
                    )}

                    {/* Carousel Container */}
                    <div 
                      ref={categoryCarouselRef}
                      className="overflow-hidden"
                      onTouchStart={(e) => {
                        if (!categoryCarouselRef.current) {
                          categoryCarouselRef.current = {};
                        }
                        categoryCarouselRef.current.touchStartX = e.touches[0].clientX;
                      }}
                      onTouchEnd={(e) => {
                        if (!categoryCarouselRef.current?.touchStartX) return;
                        const touchEndX = e.changedTouches[0].clientX;
                        const diff = categoryCarouselRef.current.touchStartX - touchEndX;
                        const threshold = 50;
                        
                        if (Math.abs(diff) > threshold) {
                          const categories = Object.keys(groupedMenuItems);
                          const itemsPerView = 4; // Show 4 items on large screens
                          const maxIndex = Math.max(0, categories.length - itemsPerView);
                          
                          if (diff > 0) {
                            // Swipe left - next
                            setCategoryCarouselIndex(prev => {
                              if (categories.length <= itemsPerView) return 0;
                              return prev < maxIndex ? prev + 1 : 0;
                            });
                          } else {
                            // Swipe right - previous
                            setCategoryCarouselIndex(prev => {
                              if (categories.length <= itemsPerView) return 0;
                              return prev > 0 ? prev - 1 : maxIndex;
                            });
                          }
                        }
                        if (categoryCarouselRef.current) {
                          categoryCarouselRef.current.touchStartX = null;
                        }
                      }}
                    >
                      <div 
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{
                          transform: `translateX(-${categoryCarouselIndex * (100 / Math.min(4, Object.keys(groupedMenuItems).length))}%)`
                        }}
                      >
                        {Object.keys(groupedMenuItems).map((categoryName, index) => {
                          // Temporary category images - using food-related Unsplash images
                          const categoryImages = [
                            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop',
                            'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=400&fit=crop',
                            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
                            'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=400&fit=crop',
                            'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=400&h=400&fit=crop',
                            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
                            'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop',
                          ];
                          const categoryImage = categoryImages[index % categoryImages.length];
                          const itemCount = groupedMenuItems[categoryName].length;

                          return (
                            <div
                              key={categoryName}
                              className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/4 px-2 sm:px-3 flex justify-center"
                            >
                              <button
                                onClick={() => {
                                  setSelectedCategory(categoryName);
                                  document.getElementById('menu-items-section')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="group relative w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 overflow-hidden rounded-full bg-white dark:bg-gray-800 transition-all duration-300"
                              >
                                {/* Circular Category Image */}
                                <div className="relative w-full h-full overflow-hidden rounded-full">
                                  <img
                                    src={categoryImage}
                                    alt={categoryName}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                  {/* Overlay gradient */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent rounded-full"></div>
                                </div>

                                {/* Category Info - Bottom */}
                                <div className="absolute bottom-0 left-0 right-0 pb-3 sm:pb-4 text-center">
                                  <h3 className="text-sm sm:text-base font-bold text-white mb-0.5 group-hover:text-orange-300 transition-colors drop-shadow-lg">
                                    {categoryName}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-white/90 drop-shadow-md">
                                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                  </p>
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Carousel Dots Indicator */}
                    {(() => {
                      const categories = Object.keys(groupedMenuItems);
                      const itemsPerView = 4; // Show 4 items on large screens
                      const totalSlides = Math.max(1, categories.length - itemsPerView + 1);
                      
                      if (categories.length <= itemsPerView) {
                        // If we have 4 or fewer categories, no dots needed
                        return null;
                      }
                      
                      return (
                        <div className="flex justify-center gap-2 mt-6">
                          {Array.from({ length: totalSlides }).map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCategoryCarouselIndex(index)}
                              className={`h-2 rounded-full transition-all duration-300 ${
                                categoryCarouselIndex === index
                                  ? 'w-8 bg-orange-500'
                                  : 'w-2 bg-gray-300 dark:bg-gray-600'
                              }`}
                              aria-label={`Go to slide ${index + 1}`}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {Object.keys(groupedMenuItems).length === 0 ? (
                <div className="text-center py-12">
                  <img
                    src="/images/palm-cafe-logo.png"
                    alt="Palm Cafe Logo"
                    className="h-24 w-24 mx-auto mb-6 opacity-50"
                  />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">No menu items available</h3>
                  <p className="text-base text-gray-500 dark:text-gray-400">Add items in Menu Management to get started</p>
                </div>
              ) : searchQuery.trim() && Object.keys(filteredMenuItems).length === 0 ? (
                <div className="text-center py-12 max-w-6xl mx-auto">
                  <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">No results found</h3>
                  <p className="text-base text-gray-500 dark:text-gray-400 mb-4">
                    We couldn't find any items matching "{searchQuery}"
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowAutocomplete(false);
                      setSelectedSuggestionIndex(-1);
                    }}
                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-full transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div id="menu-items-section" className="w-full space-y-5">
                  {/* Search Results Header */}
                  {searchQuery.trim() && (
                    <div className="max-w-6xl mx-auto px-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Search Results for "{searchQuery}"
                        </h3>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setShowAutocomplete(false);
                            setSelectedSuggestionIndex(-1);
                          }}
                          className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
                        >
                          Clear search
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Individual Category Sections - Show first */}
                  {Object.entries(searchQuery.trim() ? filteredMenuItems : groupedMenuItems)
                    .filter(([categoryName]) => selectedCategory === 'All' || categoryName === selectedCategory)
                    .map(([categoryName, items], index) => {
                      const categoryNumber = String(index + 1).padStart(2, '0');
                      return (
                        <div key={categoryName} className="max-w-6xl mx-auto space-y-8space-y-5">
                          {/* Divider before category (except first one) */}
                          {((selectedCategory === 'All' && index > 0) || (selectedCategory !== 'All' && index > 0)) && (
                            <div className="border-t border-dashed border-gray-300 dark:border-gray-600 mb-12"></div>
                          )}

                          {/* Category Header */}
                          <div className="text-center mb-10">
                            <div className="flex items-center justify-center mb-3">
                              <div className="h-px w-12 bg-orange-500 mr-3"></div>
                              <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">{categoryNumber}</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-3">
                              {categoryName}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                              {/* Porro eveniet, autem ipsam corrupti consectetur cum. Repudiandae dignissimos fugiat sit nam. */}
                              {/* {categoryDescription} */}
                            </p>
                          </div>

                          {/* Menu Items Grid - Horizontal Layout */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                            {items.map((item, itemIndex) => {
                              // Placeholder images from Unsplash for items without images
                              const placeholderImages = [
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
                                'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop',
                                'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
                                'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&h=200&fit=crop',
                                'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=200&h=200&fit=crop',
                                'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=200&h=200&fit=crop',
                              ];
                              const itemImage = item.image_url
                                ? getImageUrl(item.image_url)
                                : placeholderImages[itemIndex % placeholderImages.length];

                              return (
                                <div
                                  key={item.id}
                                  className="group flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md hover:bg-orange-100 transition-shadow mask-hover"

                                >
                                  {/* Menu Item Thumbnail */}
                                  <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                                    <img
                                      src={itemImage}
                                      alt={item.name}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                  </div>

                                  {/* Item Details */}
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                      {item.name}
                                    </h5>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-2">
                                      {item.description || 'Consectetur adipisicing elit. Soluta, impedit, saepe.'}
                                    </p>
                                  </div>

                                  {/* Price and Add to Cart */}
                                  <div className="flex flex-col items-end gap-2">
                                    <span className="text-base sm:text-lg font-bold text-orange-500 whitespace-nowrap">
                                      {formatCurrency(ensureNumber(item.price))}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(item);
                                      }}
                                      className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95"
                                      aria-label={`Add ${item.name} to cart`}
                                    >
                                      <ShoppingBag className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                  {/* All Dishes Section - Show at the end when "All" is selected and not searching */}
                  {selectedCategory === 'All' && !searchQuery.trim() && (
                    <div id="all-dishes-section" className="max-w-6xl mx-auto space-y-8">
                      {/* Divider */}
                      <div className="border-t border-dashed border-gray-300 dark:border-gray-600 mb-12"></div>

                      {/* Category Header */}
                      <div className="text-center mb-10">
                        <div className="flex items-center justify-center mb-3">
                          <div className="h-px w-12 bg-orange-500 mr-3"></div>
                          <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Complete Selection</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-3">
                          All Dishes
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                          Browse our complete menu selection with all available dishes.
                        </p>
                      </div>

                      {/* All Menu Items Grid - Horizontal Layout */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                        {Object.values(groupedMenuItems).flat().map((item, index) => {
                          // Placeholder images from Unsplash for items without images
                          const placeholderImages = [
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
                            'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop',
                            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
                            'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&h=200&fit=crop',
                            'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=200&h=200&fit=crop',
                            'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=200&h=200&fit=crop',
                          ];
                          const itemImage = item.image_url
                            ? getImageUrl(item.image_url)
                            : placeholderImages[index % placeholderImages.length];

                          return (
                            <div
                              key={`all-${item.id}`}
                              className="group flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
                            >
                              {/* Menu Item Thumbnail */}
                              <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                                <img
                                  src={itemImage}
                                  alt={item.name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>

                              {/* Item Details */}
                              <div className="flex-1 min-w-0">
                                <h5 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                  {item.name}
                                </h5>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-2">
                                  {item.description || 'Consectetur adipisicing elit. Soluta, impedit, saepe.'}
                                </p>
                              </div>

                              {/* Price and Add to Cart */}
                              <div className="flex flex-col items-end gap-2">
                                <span className="text-base sm:text-lg font-bold text-orange-500 whitespace-nowrap">
                                  {formatCurrency(ensureNumber(item.price))}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item);
                                  }}
                                  className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95"
                                  aria-label={`Add ${item.name} to cart`}
                                >
                                  <ShoppingBag className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Promotional Banner - Pay for one Get two */}
                  <div className="relative w-full -mt-8 sm:-mt-12 mb-16">
                    <div
                      className="relative max-w-full mx-auto h-[500px] sm:h-[600px] bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
                      }}
                    >
                    </div>
                  </div>

                  {/* Special Proposals Section */}
                  {mostOrderedItems.length > 0 && (
                    <div className="mt-16">
                      <div className="text-center mb-10">
                        <div className="flex items-center justify-center mb-3">
                          <div className="h-px w-12 bg-orange-500 mr-3"></div>
                          <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Featured</span>
                          <div className="h-px w-12 bg-orange-500 ml-3"></div>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-3">
                          Special Proposals
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                          Our most popular items, loved by our customers
                        </p>
                      </div>

                      {/* Special Items Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mostOrderedItems.map((item, index) => {
                          // Placeholder images from Unsplash for special items
                          const specialPlaceholders = [
                            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
                            'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=300&fit=crop',
                            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
                          ];
                          const specialImage = item.image_url
                            ? getImageUrl(item.image_url)
                            : specialPlaceholders[index % specialPlaceholders.length];

                          return (
                            <div
                              key={`special-${item.id}`}
                              className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                            >
                              {/* Item Image */}
                              <div className="relative h-48 sm:h-56 overflow-hidden">
                                <img
                                  src={specialImage}
                                  alt={item.name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              </div>

                              {/* Item Details */}
                              <div className="p-5">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                  {item.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4 line-clamp-2">
                                  {item.description || 'A customer favorite'}
                                </p>

                                {/* Price and Add to Cart */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold text-orange-500">
                                      {formatCurrency(ensureNumber(item.price))}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95"
                                    aria-label={`Add ${item.name} to cart`}
                                  >
                                    <ShoppingBag className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* View All Products Button */}
                      <div className="text-center mt-10">
                        <button
                          onClick={() => document.getElementById('all-dishes-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className="inline-flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors"
                        >
                          All Products
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer Section */}
                  <div className="mt-20 pt-16 border-t max-w-6xl mx-auto space-y-8 border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">


                      {/* Contact Info Column */}
                      <div>
                        <h3 className="text-xl font-serif font-bold text-orange-500 mb-4">Contact Info</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                          Have questions or want to make a reservation? We'd love to hear from you. Reach out to us for any inquiries.
                        </p>
                        {cafePublicInfo && (
                          <div className="space-y-3 text-sm">
                            {cafePublicInfo.name && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{cafePublicInfo.name}</span>
                              </div>
                            )}
                            {cafePublicInfo.address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                                <span className="text-gray-600 dark:text-gray-400">{cafePublicInfo.address}</span>
                              </div>
                            )}
                            {cafePublicInfo.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                <a href={`tel:${cafePublicInfo.phone}`} className="text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors">
                                  {cafePublicInfo.phone}
                                </a>
                              </div>
                            )}
                            {cafePublicInfo.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                <a href={`mailto:${cafePublicInfo.email}`} className="text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors">
                                  {cafePublicInfo.email}
                                </a>
                              </div>
                            )}
                            {cafePublicInfo.website && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                <a href={cafePublicInfo.website} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors">
                                  {cafePublicInfo.website}
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Gallery Column */}
                      <div>
                        <h3 className="text-xl font-serif font-bold text-orange-500 mb-4">Gallery</h3>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {[
                            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop',
                            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&h=100&fit=crop',
                            'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=100&h=100&fit=crop',
                            'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=100&h=100&fit=crop',
                            'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=100&h=100&fit=crop',
                            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop',
                          ].map((url, idx) => (
                            <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                              <img
                                src={url}
                                alt={`Gallery ${idx + 1}`}
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          ))}
                        </div>
                        <button className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1 transition-colors">
                          See More
                          <span className="text-lg">→</span>
                        </button>
                      </div>
                    </div>

                    {/* Back to Top */}
                    <div className="text-center mt-12">
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors"
                      >
                        Back to top ↑
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Order History Tab */
            <CustomerOrderHistory
              customerPhone={customer?.phone}
              setActiveTab={setActiveTab}
              cart={cart}
              setCart={setCart}
            />
          )}
        </div>
      </main>

      {/* Cart Modal */}
      {
        showCart && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
              {/* Cart Header */}
              <div className="flex w-full items-center justify-between border-b border-accent-200 dark:border-gray-700 bg-accent-50 dark:bg-gray-900 px-6 py-4">
                <div class="flex items-center gap-4">
                  <ShoppingCart className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
                  <h2 className="text-2xl font-bold tracking-tight text-secondary-700 dark:text-gray-100">Your Order</h2>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-secondary-600 dark:text-gray-300 hover:bg-accent-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Cart Content - Two Column Layout */}
              <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 p-6 max-h-[calc(90vh-180px)] overflow-y-auto">
                {/* Left Column: Cart Items */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-6 rounded-lg bg-accent-50 dark:bg-gray-900 p-12 text-center shadow-sm">
                      <div className="text-secondary-600 dark:text-secondary-400">
                        <ShoppingCart className="h-24 w-24" />
                      </div>
                      <h3 className="text-2xl font-bold text-secondary-700 dark:text-gray-100">Your cart is empty</h3>
                      <p className="max-w-sm text-secondary-600 dark:text-gray-400">Looks like you haven't added anything to your order yet. Let's fix that!</p>
                    </div>
                  ) : (
                    <>
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 rounded-lg bg-accent-50 dark:bg-gray-900 p-4 shadow-sm border border-accent-200 dark:border-gray-700">
                          <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-16"
                            style={{
                              backgroundImage: `url('${item.image_url
                                ? getImageUrl(item.image_url)
                                : getPlaceholderImage(item.category_name, item.name)
                                }')`
                            }}
                          />
                          <div className="flex flex-1 flex-col justify-center">
                            <p className="text-base font-bold text-secondary-700 dark:text-gray-100">{item.name}</p>
                            <p className="text-sm text-secondary-600 dark:text-gray-400">{formatCurrency(item.price)}</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 dark:bg-gray-700 transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-900 cursor-pointer"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <input
                                className="w-8 border-none bg-transparent p-0 text-center text-base font-medium focus:outline-0 focus:ring-0 text-secondary-700 dark:text-gray-100"
                                type="number"
                                value={item.quantity}
                                readOnly
                              />
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 dark:bg-gray-700 transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-900 cursor-pointer"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="w-16 text-right font-semibold text-secondary-700 dark:text-gray-100">{formatCurrency(item.price * item.quantity)}</p>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-secondary-600 dark:text-gray-400 transition-colors hover:text-red-500"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Right Column: Order Summary */}
                {cart.length > 0 && (
                  <div className="lg:col-span-1 flex flex-col max-h-full">
                    <div className="flex flex-col gap-6 rounded-xl bg-accent-50 dark:bg-gray-900 p-6 shadow-sm border border-accent-200 dark:border-gray-700 flex-1 overflow-y-auto">
                      <h2 className="text-2xl font-bold tracking-tight text-secondary-700 dark:text-gray-100">Order Summary</h2>

                      <div className="flex flex-col gap-3 border-b border-accent-200 dark:border-gray-700 pb-4">
                        <div className="flex justify-between">
                          <p className="text-secondary-600 dark:text-gray-400">Subtotal</p>
                          <p className="font-medium text-secondary-700 dark:text-gray-100">{formatCurrency(getSubtotal())}</p>
                        </div>
                        {showTaxInMenu && taxAmount > 0 && (
                          <div className="flex justify-between">
                            <p className="text-secondary-600 dark:text-gray-400">Taxes ({taxRate}%)</p>
                            <p className="font-medium text-secondary-700 dark:text-gray-100">{formatCurrency(taxAmount)}</p>
                          </div>
                        )}
                        {tipAmount > 0 && (
                          <div className="flex justify-between">
                            <p className="text-secondary-600 dark:text-gray-400">Tip</p>
                            <p className="font-medium text-secondary-700 dark:text-gray-100">{formatCurrency(tipAmount)}</p>
                          </div>
                        )}
                        {pointsToRedeem > 0 && (
                          <div className="flex justify-between text-green-600 dark:text-green-400">
                            <p>Points Redeemed ({pointsToRedeem} pts)</p>
                            <p className="font-medium">-{formatCurrency(pointsToRedeem * 0.1)}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <p className="text-lg font-bold text-secondary-700 dark:text-gray-100">Total</p>
                        <p className="text-xl font-extrabold text-secondary-700 dark:text-gray-100">{formatCurrency(getTotal())}</p>
                      </div>

                      {/* Login Required Message */}
                      {!customer && (
                        <div className="p-6 bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800 rounded-lg">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-secondary-700 dark:text-gray-100 mb-2">
                              Login Required
                            </h3>
                            <p className="text-secondary-600 dark:text-gray-400 mb-4 text-sm">
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
                      )}

                      {/* Customer sections only show when logged in */}
                      {customer && (
                        <div className="flex flex-col gap-4">
                          {/* Customer Information */}
                          <div className="p-4 bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800 rounded-lg">
                            <div className="flex flex-col gap-2 mb-3">
                              <div className="flex items-center justify-between">
                                <h3 className="font-bold text-secondary-700 dark:text-gray-100 flex items-center text-base">
                                  <User className="h-4 w-4 mr-2 text-secondary-600 dark:text-secondary-400" />
                                  Customer Info
                                </h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={openEditProfile}
                                  className="flex items-center justify-center gap-1 px-3 py-1.5 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors text-xs flex-1"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  <span>Edit Profile</span>
                                </button>
                                {onLogout && (
                                  <button
                                    onClick={onLogout}
                                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs flex-1"
                                  >
                                    <LogOut className="h-3 w-3" />
                                    <span>Logout</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-secondary-600 dark:text-gray-400">Name:</span>
                                <span className="font-semibold text-secondary-700 dark:text-gray-100">{customer.name}</span>
                              </div>
                              {customer.phone && (
                                <div className="flex justify-between">
                                  <span className="text-secondary-600 dark:text-gray-400">Phone:</span>
                                  <span className="font-semibold text-secondary-700 dark:text-gray-100">{customer.phone}</span>
                                </div>
                              )}
                              {customer.loyalty_points > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-secondary-600 dark:text-gray-400">Points:</span>
                                  <span className="flex items-center text-yellow-600 dark:text-yellow-400 font-semibold">
                                    <Star className="h-3 w-3 mr-1" />
                                    {customer.loyalty_points}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment Method */}
                          <div>
                            <h3 className="font-bold text-secondary-700 dark:text-gray-100 mb-3 text-sm">Payment Method</h3>
                            <div className="grid grid-cols-2 gap-2">
                              {paymentMethods.map((method) => (
                                <button
                                  key={method.code}
                                  type="button"
                                  onClick={() => setPaymentMethod(method.code)}
                                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-colors ${paymentMethod === method.code
                                    ? 'bg-secondary-500 text-white border-secondary-500'
                                    : 'bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100 border-accent-200 dark:border-gray-700 hover:border-secondary-500'
                                    }`}
                                >
                                  <span className="mr-2">{method.icon}</span>
                                  <span className="font-semibold text-sm">{method.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Pickup Option */}
                          <div>
                            <h3 className="font-bold text-secondary-700 dark:text-gray-100 mb-3 text-sm">Dining Preference</h3>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { value: 'pickup', label: 'Pickup', icon: '🥡' },
                                { value: 'dine-in', label: 'Dine-in', icon: '🍽️' }
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => setPickupOption(option.value)}
                                  className={`p-3 rounded-lg border-2 transition-colors ${pickupOption === option.value
                                    ? 'bg-secondary-500 text-white border-secondary-500'
                                    : 'bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100 border-accent-200 dark:border-gray-700 hover:border-secondary-500'
                                    }`}
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-lg">{option.icon}</span>
                                    <span className="font-semibold text-sm">{option.label}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Table Number for Dine-in */}
                          {pickupOption === 'dine-in' && (
                            <div>
                              <label className="block font-bold text-secondary-700 dark:text-gray-100 mb-2 text-sm">Table Number</label>
                              <input
                                type="text"
                                placeholder="Enter table number (optional)"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="w-full p-3 border-2 border-accent-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100 transition-colors"
                              />
                            </div>
                          )}

                          {/* Points Redemption */}
                          {customer?.loyalty_points > 0 && (
                            <div>
                              <h3 className="font-bold text-secondary-700 dark:text-gray-100 mb-3 text-sm flex items-center">
                                <Star className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                                Redeem Points
                              </h3>
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-3 border border-yellow-200 dark:border-yellow-800">
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-secondary-700 dark:text-gray-100">{customer.loyalty_points}</div>
                                    <div className="text-secondary-600 dark:text-gray-400">Available</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-secondary-700 dark:text-gray-100">{maxRedeemablePoints}</div>
                                    <div className="text-secondary-600 dark:text-gray-400">Max Redeemable</div>
                                  </div>
                                </div>
                                <div className="text-center mt-2 text-xs text-secondary-600 dark:text-gray-400">
                                  1 point = {formatCurrency(0.10)}
                                </div>
                              </div>
                              <input
                                type="number"
                                value={pointsToRedeem}
                                onChange={(e) => handlePointsRedemption(parseInt(e.target.value) || 0)}
                                min="0"
                                max={maxRedeemablePoints}
                                className="w-full p-3 border-2 border-accent-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100 transition-colors"
                                placeholder="Enter points"
                              />
                            </div>
                          )}

                          {/* Tip Selection */}
                          <div>
                            <h3 className="font-bold text-secondary-700 dark:text-gray-100 mb-3 text-sm">Add Tip</h3>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {[0, 10, 15, 18, 20, 25].map((percentage) => (
                                <button
                                  key={percentage}
                                  onClick={() => handleTipPercentageChange(percentage)}
                                  className={`py-2 px-3 text-xs rounded-lg border-2 transition-colors font-semibold ${tipPercentage === percentage
                                    ? 'bg-secondary-500 text-white border-secondary-500'
                                    : 'bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100 border-accent-200 dark:border-gray-700 hover:border-secondary-500'
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
                              className="w-full p-3 border-2 border-accent-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100 transition-colors"
                              placeholder="Custom tip"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Sticky at bottom */}
                    <div className="flex flex-col gap-3 p-4 bg-accent-50 dark:bg-gray-900 border-t border-accent-200 dark:border-gray-700 rounded-b-xl">
                      <button
                        onClick={placeOrder}
                        disabled={orderLoading || !customer}
                        className="w-full rounded-lg bg-secondary-500 py-3 text-base font-bold text-white transition-opacity hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {orderLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>Placing Order...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5" />
                            <span>Proceed to Checkout</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={clearCart}
                        className="w-full rounded-lg bg-white dark:bg-gray-800 border-2 border-accent-200 dark:border-gray-700 py-2.5 text-sm font-semibold text-secondary-700 dark:text-gray-100 hover:border-secondary-500 transition-colors"
                      >
                        Clear Cart
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Floating Cart Summary Bar - Mobile Only */}
      {cart.length > 0 && (
        <footer className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-800 border-t border-accent-200 dark:border-gray-700 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <p className="text-secondary-600 dark:text-gray-400 text-sm font-medium">
                  {cart.reduce((total, item) => total + item.quantity, 0)} items
                </p>
                <p className="text-secondary-700 dark:text-gray-100 text-lg font-bold">
                  {formatCurrency(getSubtotal())}
                </p>
              </div>
              <button
                onClick={() => setShowCart(true)}
                className="flex items-center justify-center gap-2 rounded-lg bg-secondary-500 h-12 px-6 hover:bg-secondary-600 transition-colors"
              >
                <ShoppingCart className="h-5 w-5 text-white" />
                <span className="text-white text-base font-bold">View Cart</span>
              </button>
            </div>
          </div>
        </footer>
      )}


      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between border-b border-accent-200 dark:border-gray-700 bg-accent-50 dark:bg-gray-900 px-6 py-4">
              <div className="flex items-center gap-4">
                <Edit3 className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
                <h2 className="text-2xl font-bold tracking-tight text-secondary-700 dark:text-gray-100">Edit Profile</h2>
              </div>
              <button
                onClick={() => setShowEditProfile(false)}
                className="text-secondary-600 dark:text-gray-300 hover:bg-accent-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-100 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editProfileData.name}
                    onChange={(e) => handleProfileInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-accent-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-100 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editProfileData.email}
                    onChange={(e) => handleProfileInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-accent-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-100 mb-2">
                    Address
                  </label>
                  <textarea
                    value={editProfileData.address}
                    onChange={(e) => handleProfileInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-accent-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100 resize-none"
                    placeholder="Enter your address"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-100 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editProfileData.date_of_birth}
                    onChange={(e) => handleProfileInputChange('date_of_birth', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-accent-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditProfile(false)}
                    className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-accent-200 dark:border-gray-700 text-secondary-700 dark:text-gray-100 rounded-lg font-medium hover:border-secondary-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex-1 px-4 py-3 bg-secondary-500 text-white rounded-lg font-medium hover:bg-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {profileLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Profile - Full Page View */}
      {showProfile && customer && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: 'var(--color-background)' }}>
          <CustomerProfile
            customer={customer}
            onCustomerUpdate={onCustomerUpdate}
            onLogout={() => {
              setShowProfile(false);
              onLogout();
            }}
            onClose={() => setShowProfile(false)}
          />
        </div>
      )}
    </div >
  );
};

export default CustomerMenu;
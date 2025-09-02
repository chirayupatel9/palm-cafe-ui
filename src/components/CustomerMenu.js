import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, X, Search, User, Phone, Mail, MapPin, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, Gift, Star, ChevronDown, ChevronUp, Utensils, Coffee, Pizza, Sandwich, Salad, Cake, Wine } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import CustomerOrderHistory from './CustomerOrderHistory';
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
  onCustomerUpdate
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
  }, []);

  // Filter menu items based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMenuItems(groupedMenuItems);
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
  }, [searchQuery, groupedMenuItems]);

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
      
      // Only fetch tax rate if we need to show it
      if (settings.show_tax_in_menu) {
        const taxResponse = await axios.get('/tax-settings');
        const taxSettings = taxResponse.data;
        setTaxRate(taxSettings.tax_rate || 0);
      } else {
        setTaxRate(0);
      }
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
          const customerResponse = await axios.get(`/customer/login/${customer.phone}`);
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

     if (loading) {
     return (
               <div className="min-h-screen flex flex-col items-center justify-center bg-accent-50 dark:bg-gray-900 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50"></div>
          </div>
          <div className="relative z-10 flex flex-col items-center">
           <img 
             src="/images/palm-cafe-logo.png" 
             alt="Palm Cafe Logo" 
             className="h-16 w-16 mb-4"
           />
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
           <p className="mt-4 text-secondary-600 dark:text-gray-400">Loading menu...</p>
         </div>
       </div>
     );
   }

  return (
    <div className="min-h-screen bg-white">
             {/* Header Section */}
       <header className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex items-center justify-between h-16">
             <div className="flex items-center space-x-4">
               <img 
                 src="/images/palm-cafe-logo.png" 
                 alt="Palm Cafe" 
                 className="h-12 w-12"
               />
               <h1 className="text-2xl font-bold text-gray-900">
                 {cafeSettings?.cafe_name || 'Palm Cafe'}
               </h1>
             </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCart(true)}
                className="relative bg-gray-900 text-white p-3 rounded-full hover:bg-gray-800 transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 {/* Hero Section */}
         <div className="text-center mb-16">
           <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-600">
             <div className="absolute inset-0 bg-black/20"></div>
             <div className="relative z-10 px-8 py-16">
               <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                 Fresh & Delicious
               </h1>
               <p className="text-lg text-amber-100 mb-6 max-w-2xl mx-auto">
                 Explore our carefully crafted menu featuring the finest ingredients
               </p>
               {taxRate > 0 && (
                 <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                   <span className="text-white text-sm font-medium">
                     Tax: {taxRate}%
                   </span>
                 </div>
               )}
             </div>
           </div>
         </div>



                 {/* Order Status Display - Only show on menu tab */}
         {activeTab === 'menu' && recentOrder && (
           <div 
             className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border-secondary-500 cursor-pointer hover:shadow-lg transition-all duration-200 relative overflow-hidden"
             onClick={() => {
               setActiveTab('history');
               // Scroll to top when switching tabs
               window.scrollTo({ top: 0, behavior: 'smooth' });
             }}
           >
             {/* Background decoration */}
             <div className="absolute top-2 right-2 opacity-10">
               <div className="w-12 h-12 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full"></div>
             </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300">
                  Order #{recentOrder.orderNumber}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Placed on {recentOrder.timestamp.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  orderStatus === 'preparing' ? 'bg-blue-100 text-blue-800' :
                  orderStatus === 'ready' ? 'bg-green-100 text-green-800' :
                  orderStatus === 'completed' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {orderStatus?.charAt(0).toUpperCase() + orderStatus?.slice(1) || 'Pending'}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total: {formatCurrency(recentOrder.total)}
                </p>
                <div className="flex items-center justify-end mt-1">
                  <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                    <Star className="h-3 w-3 mr-1" />
                    <span>+{Math.floor(recentOrder.total / 10)} pts</span>
                  </div>
                </div>
              </div>
            </div>
            {orderStatus === 'ready' && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-green-700 text-sm font-medium">
                    Your order is ready! Please collect it from the counter.
                  </p>
                </div>
              </div>
            )}
            <div className="mt-3 flex justify-between items-center">
              <div className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                Click to view order details →
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the card click
                  setRecentOrder(null);
                  setOrderStatus(null);
                }}
                className="text-sm text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300"
              >
                Start New Order
              </button>
            </div>
          </div>
        )}

                {/* Content based on active tab */}
        {activeTab === 'menu' ? (
          <>
                         {/* Search Box */}
             <div className="mb-12">
               <div className="relative max-w-2xl mx-auto">
                 <div className="relative">
                   <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                   <input
                     type="text"
                     placeholder="Search for food, drinks, or categories..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-lg shadow-lg"
                   />
                   {searchQuery && (
                     <button
                       onClick={() => setSearchQuery('')}
                       className="absolute right-4 top-1/2 transform -translate-y-1/2"
                     >
                       <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                     </button>
                   )}
                 </div>
                 {searchQuery && (
                   <div className="text-center mt-4">
                     <p className="text-lg text-gray-600 font-medium">
                       {Object.values(filteredMenuItems).flat().length} items found
                     </p>
                   </div>
                 )}
               </div>
             </div>

                                     {/* Popular Categories */}
             <div className="mb-16">
               <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                 Browse by Category
               </h2>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
                 {Object.keys(groupedMenuItems).slice(0, 7).map((categoryName) => (
                   <div key={categoryName} className="text-center group cursor-pointer">
                     <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-2xl flex items-center justify-center group-hover:from-orange-100 group-hover:to-red-100 dark:group-hover:from-orange-900/20 dark:group-hover:to-red-900/20 transition-all duration-200 shadow-sm group-hover:shadow-md">
                       {getCategoryIcon(categoryName)}
                     </div>
                     <h3 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                       {categoryName}
                     </h3>
                     <p className="text-xs text-gray-500">
                       {groupedMenuItems[categoryName].length} items
                     </p>
                   </div>
                 ))}
               </div>
             </div>

                         {/* Featured Deals */}
             <div className="mb-12">
               <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                 Today's Specials
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {/* Deal 1 */}
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold mb-2">BBQ & Cheesy Burger</h3>
                      <div className="text-2xl font-bold mb-4">₹199</div>
                      <button className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                        Order Now
                      </button>
                    </div>
                                         <div className="absolute top-4 right-4 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                       <Sandwich className="h-8 w-8 text-white" />
                     </div>
                  </div>

                                 {/* Deal 2 */}
                 <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-2xl p-6 text-white relative overflow-hidden">
                   <div className="relative z-10">
                     <h3 className="text-xl font-bold mb-2">PASTA Yummy Yummy</h3>
                     <div className="text-3xl font-bold mb-4">₹299 Only</div>
                     <button className="bg-white text-yellow-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                       Order Now
                     </button>
                   </div>
                                        <div className="absolute top-4 right-4 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                       <Utensils className="h-8 w-8 text-white" />
                     </div>
                 </div>

                                 {/* Deal 3 */}
                 <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white relative overflow-hidden">
                   <div className="relative z-10">
                     <h3 className="text-xl font-bold mb-2">CHEESY PIZZA!</h3>
                     <div className="text-3xl font-bold mb-4">₹399 Only</div>
                     <button className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                       Order Now
                     </button>
                   </div>
                   <div className="absolute top-4 right-4 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                     <Pizza className="h-8 w-8 text-white" />
                   </div>
                 </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-8">
              {Object.keys(filteredMenuItems).length === 0 && searchQuery ? (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No items found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Try searching for something else or browse all categories
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                Object.entries(filteredMenuItems).map(([categoryName, items], index) => {
                  return (
                    <div key={categoryName} className="mb-12">
                                             <div className="flex items-center mb-6">
                         <div className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 p-3 rounded-full mr-4">
                           {getCategoryIcon(categoryName)}
                         </div>
                         <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                           {categoryName}
                         </h3>
                       </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="group w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left border border-gray-100 dark:border-gray-700"
                          >
                            <div className="relative">
                              {cafeSettings?.show_menu_images && item.image_url ? (
                                <div className="w-full h-48 overflow-hidden">
                                  <img
                                    src={getImageUrl(item.image_url)}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                </div>
                                                             ) : (
                                 <div className={`w-full h-48 bg-gradient-to-br ${getCategoryBackground(categoryName)} dark:from-gray-800 dark:to-gray-700 flex items-center justify-center`}>
                                   <div className="text-center">
                                     <div className="w-20 h-20 mx-auto mb-3 text-gray-600 dark:text-gray-400">
                                       {getCategoryIcon(categoryName)}
                                     </div>
                                     <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                       {categoryName}
                                     </div>
                                   </div>
                                 </div>
                               )}
                              
                              {/* Add to cart overlay */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                <div className="bg-white dark:bg-gray-800 rounded-full p-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                  <Plus className="h-6 w-6 text-orange-500" />
                                </div>
                              </div>
                            </div>
                            
                                                         <div className="p-5">
                               <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 transition-colors mb-2 line-clamp-1">
                                 {item.name}
                               </h4>
                               
                               {item.description && (
                                 <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                                   {item.description}
                                 </p>
                               )}
                               
                               <div className="flex items-center justify-between">
                                 <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                   {formatCurrency(item.price)}
                                 </span>
                                 <div className="text-orange-500 dark:text-orange-400 font-medium text-sm">
                                   Add to cart
                                 </div>
                               </div>
                             </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

                                      {/* How to Order Section */}
              <div className="mt-16 mb-12 relative">
                {/* Natural background */}
                <div className="absolute inset-0 opacity-5">
                  <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50"></div>
                </div>
                <div className="relative z-10">
                 <div className="text-center mb-12">
                   <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                     How To Order?
                   </h2>
                   <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                     Follow these simple steps to place your order and enjoy delicious food
                   </p>
                 </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="h-10 w-10 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Step-01: Choose Your Product
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Browse our menu and select your favorite dishes
                  </p>
                </div>

                {/* Step 2 */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Utensils className="h-10 w-10 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Step-02: Make Your Order
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Add items to cart and proceed to checkout
                  </p>
                </div>

                {/* Step 3 */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Step-03: Food Is On The Way
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your order will be prepared and ready for pickup
                  </p>
                </div>
              </div>
            </div>
          </div>
          </>
                 ) : (
           /* Order History Tab */
           <CustomerOrderHistory 
             customerPhone={customer?.phone} 
             setActiveTab={setActiveTab}
             cart={cart}
             setCart={setCart}
           />
         )}
       </main>

                           {/* Floating Cart Button */}
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-full shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-110 z-40"
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
          </div>
        </button>

       {/* Cart Modal */}
       {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto relative">
                         {/* Background decoration */}
             <div className="absolute top-4 right-4 opacity-10">
               <div className="w-16 h-16 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full"></div>
             </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Your Order
                  </h2>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

                             {/* Cart Items - Show for all users */}
                               {cart.length === 0 ? (
                                     <div className="text-center py-8 text-gray-500 dark:text-gray-400 relative">
                     {/* Background decoration */}
                     <div className="absolute inset-0 opacity-5">
                       <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg"></div>
                     </div>
                     <div className="relative z-10">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
                      <p>Your cart is empty</p>
                      <p className="text-sm">Add items from the menu</p>
                    </div>
                  </div>
               ) : (
                 <div className="space-y-3 mb-6">
                   {cart.map((item) => (
                     <div key={item.id} className="flex items-center justify-between p-3 bg-accent-50 dark:bg-gray-700 rounded-lg border border-accent-200 dark:border-gray-600">
                                               <div className="flex items-center space-x-3 flex-1">
                          {cafeSettings?.show_menu_images && item.image_url ? (
                            <img
                              src={getImageUrl(item.image_url)}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border flex items-center justify-center">
                              <Utensils className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1">
                           <h4 className="font-medium text-secondary-700 dark:text-secondary-300">{item.name}</h4>
                           <p className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(item.price)} each</p>
                         </div>
                       </div>
                       <div className="flex items-center space-x-2">
                         <button
                           onClick={() => updateQuantity(item.id, item.quantity - 1)}
                           className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                         >
                           <Minus className="h-4 w-4" />
                         </button>
                         <span className="w-8 text-center font-medium text-gray-900 dark:text-gray-100">{item.quantity}</span>
                         <button
                           onClick={() => updateQuantity(item.id, item.quantity + 1)}
                           className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                         >
                           <Plus className="h-4 w-4" />
                         </button>
                         <button
                           onClick={() => removeFromCart(item.id)}
                           className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                         >
                           <Trash2 className="h-4 w-4" />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}

               {/* Order Summary - Show for all users */}
               {cart.length > 0 && (
                 <div className="border-t border-accent-200 dark:border-gray-600 pt-4 mb-6">
                   <div className="space-y-2">
                     <div className="flex justify-between text-gray-700 dark:text-gray-300">
                       <span>Subtotal:</span>
                       <span>{formatCurrency(getSubtotal())}</span>
                     </div>
                     {showTaxInMenu && taxAmount > 0 && (
                       <div className="flex justify-between text-gray-700 dark:text-gray-300">
                         <span>Tax ({taxRate}%):</span>
                         <span>{formatCurrency(taxAmount)}</span>
                       </div>
                     )}
                     {tipAmount > 0 && (
                       <div className="flex justify-between text-gray-700 dark:text-gray-300">
                         <span>Tip:</span>
                         <span>{formatCurrency(tipAmount)}</span>
                       </div>
                     )}
                     {pointsToRedeem > 0 && (
                       <div className="flex justify-between text-green-600 dark:text-green-400">
                         <span>Points Redeemed ({pointsToRedeem} pts):</span>
                         <span>-{formatCurrency(pointsToRedeem * 0.1)}</span>
                       </div>
                     )}
                     <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-gray-100">
                       <span>Total:</span>
                       <span>{formatCurrency(getTotal())}</span>
                     </div>
                   </div>
                 </div>
               )}

               {/* Login Required Message - Show when not logged in and cart has items */}
               {!customer && cart.length > 0 && (
                 <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                   <div className="text-center">
                     <h3 className="text-lg font-medium text-yellow-800 mb-2">
                       Login Required to Place Order
                     </h3>
                     <p className="text-sm text-yellow-700 mb-4">
                       Please login to place your order and earn loyalty points.
                     </p>
                     <button
                       onClick={() => {
                         setShowCart(false);
                         setShowLoginModal(true);
                       }}
                       className="bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600 transition-colors"
                     >
                       Login Now
                     </button>
                   </div>
                 </div>
               )}

               {/* Customer Information and Order Options - Only show when logged in */}
               {customer && (
                <>
                  {/* Customer Information */}
                  <div className="mb-6">
                    <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3">Customer Information</h3>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                            {customer?.name || 'Not provided'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                            {customer?.phone || 'Not provided'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                            {customer?.email || 'Not provided'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {customer && customer.loyalty_points > 0 && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mt-3">
                        <div className="flex items-center text-sm text-green-700 dark:text-green-300">
                          <Star className="h-4 w-4 mr-2" />
                          <span>Welcome back! {customer.loyalty_points} loyalty points available</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Cart Content - Only show when logged in */}
              {customer && (
                <>
                  {/* Payment Method */}
                  <div className="mb-6">
                    <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3">Payment Method</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.code}
                          type="button"
                          onClick={() => setPaymentMethod(method.code)}
                          className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                            paymentMethod === method.code
                              ? 'bg-secondary-500 text-white border-secondary-500'
                              : 'bg-white dark:bg-gray-700 text-secondary-700 dark:text-gray-200 border-accent-300 dark:border-gray-600 hover:bg-accent-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span className="mr-2">{method.icon}</span>
                          <span className="font-medium">{method.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Split Payment Option - Hidden for customers */}

                  {/* Pickup Option */}
                  <div className="mb-6">
                    <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3">Pickup Option</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPickupOption('pickup')}
                        className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                          pickupOption === 'pickup'
                            ? 'bg-secondary-500 text-white border-secondary-500'
                            : 'bg-white dark:bg-gray-700 text-secondary-700 dark:text-gray-200 border-accent-300 dark:border-gray-600 hover:bg-accent-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="mr-2 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                        <span className="font-medium">Pickup</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickupOption('dine-in')}
                        className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                          pickupOption === 'dine-in'
                            ? 'bg-secondary-500 text-white border-secondary-500'
                            : 'bg-white dark:bg-gray-700 text-secondary-700 dark:text-gray-200 border-accent-300 dark:border-gray-600 hover:bg-accent-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="mr-2 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                        <span className="font-medium">Dine-in</span>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {pickupOption === 'pickup' 
                        ? 'Your order will be ready for pickup at the counter' 
                        : 'Your order will be served at your table'}
                    </p>
                  </div>

                  {/* Table Number */}
                  {pickupOption === 'dine-in' && (
                    <div className="mb-6">
                      <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3">Table Information</h3>
                      <input
                        type="text"
                        placeholder="Table Number/Character (optional)"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Enter your table number or character to help us serve your order correctly
                      </p>
                    </div>
                  )}

                  {/* Points Redemption */}
                  {cart.length > 0 && customer?.loyalty_points > 0 && (
                    <div className="mb-6">
                      <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3 flex items-center">
                        <Star className="h-4 w-4 mr-2 text-yellow-500" />
                        Redeem Points
                        <span className="ml-2 text-sm text-gray-500">
                          (1 point = ₹0.10)
                        </span>
                      </h3>
                      
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Available Points:</span>
                          <span className="font-medium text-yellow-700 dark:text-yellow-300">
                            {customer.loyalty_points}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-gray-600 dark:text-gray-400">Max Redeemable:</span>
                          <span className="font-medium text-yellow-700 dark:text-yellow-300">
                            {maxRedeemablePoints} points
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Points to redeem:</span>
                        <input
                          type="number"
                          value={pointsToRedeem}
                          onChange={(e) => handlePointsRedemption(parseInt(e.target.value) || 0)}
                          min="0"
                          max={maxRedeemablePoints}
                          className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="0"
                        />
                      </div>
                      
                      {pointsToRedeem > 0 && (
                        <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                          You'll save: ₹{(pointsToRedeem * 0.1).toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tip Selection */}
                  {cart.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3">Tip</h3>
                      
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[0, 10, 15, 18, 20, 25].map((percentage) => (
                          <button
                            key={percentage}
                            onClick={() => handleTipPercentageChange(percentage)}
                            className={`py-2 px-3 text-sm rounded-lg border transition-colors ${
                              tipPercentage === percentage
                                ? 'bg-secondary-500 text-white border-secondary-500'
                                : 'bg-white dark:bg-gray-700 text-secondary-700 dark:text-gray-200 border-accent-300 dark:border-gray-600 hover:bg-accent-50 dark:hover:bg-gray-600'
                            }`}
                          >
                            {percentage === 0 ? 'No Tip' : `${percentage}%`}
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Custom:</span>
                        <input
                          type="number"
                          value={tipAmount.toFixed(2)}
                          onChange={(e) => handleTipAmountChange(e.target.value)}
                          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  

                                     {/* Action Buttons */}
                   {cart.length > 0 && (
                     <div className="space-y-3">
                       {customer ? (
                         <>
                           <button
                             onClick={placeOrder}
                             disabled={orderLoading}
                             className="w-full bg-secondary-500 text-white py-3 px-4 rounded-lg hover:bg-secondary-600 transition-colors disabled:opacity-50"
                           >
                             {orderLoading ? 'Placing Order...' : 'Place Order'}
                           </button>
                           
                           <button
                             onClick={clearCart}
                             className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                           >
                             Clear Cart
                           </button>
                         </>
                       ) : (
                         <>
                           <button
                             onClick={() => {
                               setShowCart(false);
                               setShowLoginModal(true);
                             }}
                             className="w-full bg-secondary-500 text-white py-3 px-4 rounded-lg hover:bg-secondary-600 transition-colors"
                           >
                             Login to Place Order
                           </button>
                           
                           <button
                             onClick={clearCart}
                             className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                           >
                             Clear Cart
                           </button>
                         </>
                       )}
                     </div>
                   )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMenu; 
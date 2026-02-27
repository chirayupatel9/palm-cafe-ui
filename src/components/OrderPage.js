import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Minus, Trash2, Receipt, ShoppingCart, FolderOpen, Star, ShoppingBag } from 'lucide-react';
import Dialog from './ui/Dialog';
import Sheet from './ui/Sheet';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUtils';

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

const OrderPage = ({ menuItems, cart: externalCart, setCart: setExternalCart }) => {
  const { formatCurrency } = useCurrency();
  const { cafeSettings } = useCafeSettings();
  const { isDarkMode } = useDarkMode();
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [taxInfo, setTaxInfo] = useState({ taxRate: 0, taxName: 'Tax', taxAmount: 0 });
  const [tipAmount, setTipAmount] = useState(0);
  const [tipPercentage, setTipPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [groupedMenuItems, setGroupedMenuItems] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [maxRedeemablePoints, setMaxRedeemablePoints] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [pickupOption, setPickupOption] = useState('pickup');
  const [splitPayment, setSplitPayment] = useState(false);
  const [splitPaymentMethod, setSplitPaymentMethod] = useState('upi');
  const [splitAmount, setSplitAmount] = useState(0);
  const [extraCharge, setExtraCharge] = useState(0);
  const [extraChargeNote, setExtraChargeNote] = useState('');
  const [extraChargeEnabled, setExtraChargeEnabled] = useState(false);
  const [showInvoicePrompt, setShowInvoicePrompt] = useState(false);

  // Debounced phone number to reduce API calls
  const debouncedPhone = useDebounce(customerPhone, 500);

  // Use external cart if provided, otherwise use internal cart
  const currentCart = externalCart || cart;
  const setCurrentCart = setExternalCart || setCart;

  // Show cart automatically if external cart has items
  useEffect(() => {
    if (externalCart && externalCart.length > 0) {
      setShowCart(true);
    }
  }, [externalCart]);

  // Helper function to ensure price is a number
  const ensureNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Group menu items by category and fetch payment methods
  useEffect(() => {
    const grouped = menuItems.reduce((groups, item) => {
      const categoryName = item.category_name || 'Uncategorized';
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(item);
      return groups;
    }, {});
    setGroupedMenuItems(grouped);
    
    // Fetch payment methods
    fetchPaymentMethods();
  }, [menuItems]);

  // Calculate subtotal
  const getSubtotal = useCallback(() => {
    return currentCart.reduce((total, item) => total + (ensureNumber(item.price) * item.quantity), 0);
  }, [currentCart]);

  // Calculate total with tax, tip, and points redemption
  const getTotal = () => {
    const subtotal = getSubtotal();
    const pointsDiscount = pointsToRedeem * 0.1; // 1 point = 0.1 INR
    return subtotal + taxInfo.taxAmount + tipAmount - pointsDiscount + extraCharge;
  };

  // Fetch tax settings and calculate tax
  const calculateTax = async (subtotal) => {
    try {
      const response = await axios.post('/calculate-tax', { subtotal });
      setTaxInfo(response.data);
    } catch (error) {
      console.error('Error calculating tax:', error);
      setTaxInfo({ taxRate: 0, taxName: 'Tax', taxAmount: 0 });
    }
  };

  // Update tax calculation when cart changes
  useEffect(() => {
    const subtotal = getSubtotal();
    if (subtotal > 0) {
      calculateTax(subtotal);
    } else {
      setTaxInfo({ taxRate: 0, taxName: 'Tax', taxAmount: 0 });
    }
  }, [currentCart, getSubtotal]);

  // Calculate max redeemable points when cart or customer changes
  useEffect(() => {
    if (customerInfo?.loyalty_points && currentCart.length > 0) {
      const subtotal = getSubtotal();
      const maxPoints = Math.min(customerInfo.loyalty_points, Math.floor(subtotal * 10)); // Can't redeem more than order value
      setMaxRedeemablePoints(maxPoints);
      
      // Reset points to redeem if it exceeds max
      if (pointsToRedeem > maxPoints) {
        setPointsToRedeem(maxPoints);
      }
    } else {
      setMaxRedeemablePoints(0);
      setPointsToRedeem(0);
    }
  }, [currentCart, customerInfo?.loyalty_points, pointsToRedeem, getSubtotal]);

  // Search customer when debounced phone number changes
  useEffect(() => {
    if (debouncedPhone && debouncedPhone.length >= 5) {
      searchCustomer(debouncedPhone);
    } else if (debouncedPhone.length === 0) {
      setCustomerInfo(null);
    }
  }, [debouncedPhone]);

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
        { code: 'cash', name: 'Cash', icon: '💵' },
        { code: 'upi', name: 'UPI', icon: '📱' }
      ]);
    }
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

  const searchCustomer = async (phone) => {
    if (!phone || phone.length < 5) {
      setCustomerInfo(null);
      return;
    }

    try {
      const response = await axios.post('/customer/login', { phone });
      if (response.data) {
        const customer = response.data;
        setCustomerInfo(customer);
        setCustomerName(customer.name);
        toast.success(`Welcome back, ${customer.name}! You have ${customer.loyalty_points} loyalty points.`);
      } else {
        setCustomerInfo(null);
      }
    } catch (error) {
      // Only log unexpected errors, not 404s (customer not found)
      if (error.response?.status !== 404) {
        console.error('Unexpected error searching customer:', error);
      }
      setCustomerInfo(null);
    }
  };

  const addToCart = (item) => {
    setCurrentCart(prevCart => {
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
    toast.success(`${item.name} added to cart`);
  };

  const removeFromCart = (itemId) => {
    setCurrentCart(prevCart => prevCart.filter(item => item.id !== itemId));
    toast.success('Item removed from cart');
  };

  const getCartQuantity = (itemId) => {
    const item = currentCart.find((i) => i.id === itemId);
    return item ? item.quantity : 0;
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCurrentCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Start checkout: validate and show invoice prompt
  const startCheckout = () => {
    if (currentCart.length === 0) {
      toast.error('Add items to your cart before placing an order');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Enter a customer name to continue');
      return;
    }
    if (splitPayment && user?.role !== 'admin') {
      toast.error('Split payment is only available for administrators');
      return;
    }
    if (splitPayment && splitAmount <= 0) {
      toast.error('Please enter the split payment amount');
      return;
    }
    if (splitPayment && splitAmount >= getTotal()) {
      toast.error('Split amount cannot be greater than or equal to total amount');
      return;
    }
    setShowInvoicePrompt(true);
  };

  // Complete order (with or without generating/showing invoice)
  const completeOrder = async (wantInvoice) => {
    setShowInvoicePrompt(false);
    setLoading(true);

    try {
      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        tableNumber: tableNumber.trim(),
        paymentMethod: paymentMethod,
        pickupOption: pickupOption,
        items: currentCart.map(item => ({
          id: item.id,
          name: item.name,
          price: ensureNumber(item.price),
          quantity: item.quantity,
          total: ensureNumber(item.price) * item.quantity
        })),
        tipAmount: tipAmount,
        pointsRedeemed: pointsToRedeem,
        date: new Date().toISOString(),
        splitPayment: splitPayment,
        splitPaymentMethod: splitPaymentMethod,
        splitAmount: splitAmount,
        extraCharge: extraCharge,
        extraChargeNote: extraChargeNote,
        wantInvoice: wantInvoice
      };

      const response = await axios.post('/invoices', orderData);

      if (wantInvoice && response.data.invoiceNumber) {
        const pdfResponse = await axios.get(`/invoices/${response.data.invoiceNumber}/download`);
        const pdfBlob = new Blob([Uint8Array.from(atob(pdfResponse.data.pdf), c => c.charCodeAt(0))], {
          type: 'application/pdf'
        });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      }

      setCurrentCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setTableNumber('');
      setCustomerInfo(null);
      setTipAmount(0);
      setTipPercentage(0);
      setPointsToRedeem(0);
      setPickupOption('pickup');
      setSplitPayment(false);
      setSplitAmount(0);
      setExtraCharge(0);
      setExtraChargeNote('');
      toast.success(`Order #${response.data.orderNumber} completed`);
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('We couldn\'t complete the order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = () => {
    setCurrentCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerInfo(null);
    setTipAmount(0);
    setTipPercentage(0);
    setPointsToRedeem(0);
    setPickupOption('pickup');
    setSplitPayment(false);
    setSplitAmount(0);
    setExtraCharge(0);
    setExtraChargeNote('');
    setExtraChargeEnabled(false);
    toast.success('Cart cleared');
  };

  const subtotal = getSubtotal();
  const total = getTotal();

  return (
    <div className={`min-h-screen lg:grid lg:grid-cols-3 lg:gap-8 pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto ${isDarkMode ? 'bg-gray-900' : 'bg-[#F6F4F0]'}`}>
      {/* Invoice prompt - Template Dialog */}
      <Dialog open={showInvoicePrompt} onClose={() => setShowInvoicePrompt(false)} title="Complete order" maxHeight={false}>
        <p className="text-sm text-[#6F6A63] mb-6">Do you want to see the invoice?</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => completeOrder(false)}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-[#2A2A2A]/20 hover:bg-[#F6F4F0] disabled:opacity-50 text-[#2A2A2A]"
          >
            No
          </button>
          <button
            type="button"
            onClick={() => completeOrder(true)}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-[#2A2A2A] hover:bg-[#C68E3C] text-white font-medium disabled:opacity-50"
          >
            Yes, show invoice
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowInvoicePrompt(false)}
          disabled={loading}
          className="mt-4 w-full text-sm text-[#6F6A63] hover:text-[#2A2A2A]"
        >
          Cancel
        </button>
      </Dialog>

      {/* Menu Items - customerMenu-inspired layout */}
      <div className="lg:col-span-2 mb-6 lg:mb-0">
        <div className="mb-8 sm:mb-12">
          <span className={`font-mono text-xs uppercase tracking-[0.2em] mb-2 block ${isDarkMode ? 'text-amber-400' : 'text-[#C68E3C]'}`}>Dashboard</span>
          <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${isDarkMode ? 'text-gray-100' : 'text-[#2A2A2A]'}`}>Create new orders</h2>
          <p className={`max-w-xl text-base sm:text-lg mt-2 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-[#6F6A63]'}`}>
            Manage your cafe operations. Add items to the cart and complete the order.
          </p>
        </div>

        {Object.keys(groupedMenuItems).length === 0 ? (
          <div className={`text-center py-16 rounded-2xl border ${isDarkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/60 border-[#E9E4DA]'}`}>
            {cafeSettings.logo_url && (
              <img
                src={getImageUrl(cafeSettings.logo_url)}
                alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`}
                className="h-24 w-24 mx-auto mb-6 opacity-50"
              />
            )}
            <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-[#2A2A2A]'}`}>No menu items available</h3>
            <p className={isDarkMode ? 'text-gray-400' : 'text-[#6F6A63]'}>Add items in Menu Management to get started</p>
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-16">
            {Object.entries(groupedMenuItems).map(([categoryName, items], catIndex) => {
              const categoryNumber = String(catIndex + 1).padStart(2, '0');
              return (
                <section
                  key={categoryName}
                  id={`category-${categoryName.replace(/\s+/g, '-')}`}
                  className="relative"
                >
                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-baseline gap-4 mb-2">
                      <span className={`font-mono text-sm px-3 py-1 rounded-full ${isDarkMode ? 'text-amber-400 bg-amber-400/10' : 'text-[#C68E3C] bg-[#C68E3C]/10'}`}>
                        {categoryNumber}
                      </span>
                      <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDarkMode ? 'text-gray-100' : 'text-[#2A2A2A]'}`}>
                        {categoryName}
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {items.map((item) => {
                      const quantity = getCartQuantity(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`group rounded-2xl border-0 shadow-sm hover:shadow-2xl transition-all duration-300 ease-out overflow-hidden hover:-translate-y-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                        >
                          <div className={`relative aspect-[4/3] overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-[#E9E4DA]'}`}>
                            {cafeSettings?.show_menu_images && item.image_url ? (
                              <img
                                src={getImageUrl(item.image_url)}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FolderOpen className={`h-12 w-12 ${isDarkMode ? 'text-amber-500/40' : 'text-[#C68E3C]/40'}`} />
                              </div>
                            )}
                            <div className={`absolute top-3 right-3 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md ${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'}`}>
                              <span className={`font-mono text-sm font-medium ${isDarkMode ? 'text-amber-400' : 'text-[#C68E3C]'}`}>
                                {formatCurrency(ensureNumber(item.price))}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 sm:p-5">
                            <h4 className={`font-semibold text-lg mb-2 group-hover:text-[#C68E3C] transition-colors ${isDarkMode ? 'text-gray-100' : 'text-[#2A2A2A]'}`}>
                              {item.name}
                            </h4>
                            <p className={`text-sm mb-4 line-clamp-2 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-[#6F6A63]'}`}>
                              {item.description || '—'}
                            </p>
                            {quantity === 0 ? (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2A2A2A] hover:bg-[#C68E3C] text-white font-medium transition-colors duration-300"
                              >
                                <ShoppingBag className="h-4 w-4" />
                                Add to cart
                              </button>
                            ) : (
                              <div className={`flex items-center justify-between rounded-xl p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-[#F6F4F0]'}`}>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, quantity - 1); }}
                                  className={`h-10 w-10 rounded-full shadow-sm flex items-center justify-center transition-all hover:scale-105 ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-[#E9E4DA]'}`}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className={`h-4 w-4 ${isDarkMode ? 'text-gray-200' : 'text-[#2A2A2A]'}`} />
                                </button>
                                <span className={`font-mono text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-[#2A2A2A]'}`}>{quantity}</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, quantity + 1); }}
                                  className={`h-10 w-10 rounded-full shadow-sm flex items-center justify-center transition-all hover:scale-105 ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-[#E9E4DA]'}`}
                                  aria-label="Increase quantity"
                                >
                                  <Plus className={`h-4 w-4 ${isDarkMode ? 'text-gray-200' : 'text-[#2A2A2A]'}`} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart - Mobile Floating Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowCart(!showCart)}
          className="bg-[#2A2A2A] hover:bg-[#C68E3C] text-white p-4 rounded-full shadow-lg transition-colors duration-300 dark:bg-gray-700 dark:hover:bg-amber-600"
          aria-label="Open cart"
        >
          <ShoppingCart className="h-6 w-6" />
          {currentCart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#C68E3C] dark:bg-amber-500 text-white text-xs font-medium rounded-full h-6 w-6 flex items-center justify-center">
              {currentCart.length}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Cart - Template Sheet (same as customer menu) */}
      {showCart && (
        <div className="lg:hidden">
          <Sheet open={showCart} onClose={() => setShowCart(false)} title={`Cart (${currentCart.length})`}>
              {/* Customer Info */}
              <div className="space-form">
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input-field"
                />
                <input
                  type="tel"
                  placeholder="Phone Number (optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Table Number/Character (optional)"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="input-field"
                />
                {customerInfo && (
                  <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center text-sm text-green-700 dark:text-green-300">
                      <Star className="h-4 w-4 mr-1" />
                      <span>Welcome back! {customerInfo.loyalty_points} loyalty points available</span>
                    </div>
                  </div>
                )}

                {/* Points Redemption */}
                {currentCart.length > 0 && customerInfo?.loyalty_points > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-500" />
                      Redeem Points
                      <span className="ml-2 text-sm text-gray-500">
                        (1 point = {formatCurrency(0.10)})
                      </span>
                    </label>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Available Points:</span>
                        <span className="font-medium text-yellow-700 dark:text-yellow-300">
                          {customerInfo.loyalty_points}
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">Points to redeem:</span>
                      <input
                        type="number"
                        value={pointsToRedeem}
                        onChange={(e) => handlePointsRedemption(parseInt(e.target.value) || 0)}
                        min="0"
                        max={maxRedeemablePoints}
                        className="flex-1 input-field"
                        placeholder="0"
                      />
                    </div>
                    
                    {pointsToRedeem > 0 && (
                      <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                        Customer will save: ₹{(pointsToRedeem * 0.1).toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Payment Method */}
                <div className="mb-2">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.code}
                        type="button"
                        onClick={() => setPaymentMethod(method.code)}
                        className={`h-10 flex items-center justify-center rounded-lg border transition-colors text-sm font-medium ${
                          paymentMethod === method.code
                            ? 'bg-secondary-600 text-white border-secondary-600'
                            : 'btn-secondary'
                        }`}
                      >
                        <span className="mr-2">{method.icon}</span>
                        <span>{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Split Payment Option - Admin Only */}
                {currentCart.length > 0 && user?.role === 'admin' && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-secondary-700 dark:text-secondary-300">Split Payment</h3>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={splitPayment}
                          onChange={(e) => {
                            setSplitPayment(e.target.checked);
                            if (!e.target.checked) {
                              setSplitAmount(0);
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Enable split payment</span>
                      </label>
                    </div>
                    
                    {splitPayment && (
                      <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Split Payment Method
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {paymentMethods.filter(method => method.code !== paymentMethod).map((method) => (
                              <button
                                key={method.code}
                                type="button"
                                onClick={() => setSplitPaymentMethod(method.code)}
                                className={`h-10 flex items-center justify-center rounded-lg border transition-colors text-sm font-medium ${
                                  splitPaymentMethod === method.code
                                    ? 'bg-secondary-600 text-white border-secondary-600'
                                    : 'btn-secondary'
                                }`}
                              >
                                <span className="mr-2">{method.icon}</span>
                                <span>{method.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Amount paid via {paymentMethods.find(m => m.code === splitPaymentMethod)?.name || 'split method'}
                          </label>
                          <input
                            type="number"
                            value={splitAmount}
                            onChange={(e) => setSplitAmount(parseFloat(e.target.value) || 0)}
                            min="0"
                            max={getTotal() - 0.01}
                            step="0.01"
                            className="input-field"
                            placeholder="Enter amount"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Remaining amount: {formatCurrency(getTotal() - splitAmount)} via {paymentMethods.find(m => m.code === paymentMethod)?.name || 'primary method'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}



                {/* Pickup Option */}
                <div className="mb-2">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Pickup Option
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPickupOption('pickup')}
                      className={`h-10 flex items-center justify-center rounded-lg border transition-colors text-sm font-medium ${
                        pickupOption === 'pickup'
                          ? 'bg-secondary-600 text-white border-secondary-600'
                          : 'btn-secondary'
                      }`}
                    >
                      <span className="mr-2">🏪</span>
                      <span>Pickup</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickupOption('dine-in')}
                      className={`h-10 flex items-center justify-center rounded-lg border transition-colors text-sm font-medium ${
                        pickupOption === 'dine-in'
                          ? 'bg-secondary-600 text-white border-secondary-600'
                          : 'btn-secondary'
                      }`}
                    >
                      <span className="mr-2">🍽️</span>
                      <span>Dine-in</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {pickupOption === 'pickup' 
                      ? 'Order will be ready for pickup at the counter' 
                      : 'Order will be served at the table'}
                  </p>
                </div>
              </div>

              {/* UPI QR Code Display */}
              {paymentMethod === 'upi' && (
                <div className="mb-4 p-4 bg-white border border-accent-200 rounded-lg">
                  <div className="text-center">
                    <div className="bg-[#6F4E37] text-white p-3 rounded-t-lg -mt-4 -mx-4 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2">
                        <span className="text-[#6F4E37] font-bold text-sm">पे</span>
                      </div>
                      <span className="font-semibold">PhonePe</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">Scan & Pay with any UPI App</p>
                    
                    <img 
                      src="/images/upi-qr-code.png" 
                      alt="UPI QR Code" 
                      className="w-40 h-40 mx-auto mb-4"
                    />
                    
                    <div className="text-sm text-gray-600 mb-2">UPI ID: Q966641592@ybl</div>
                    
                    <div className="flex justify-center items-center space-x-4 mb-3">
                      <div className="text-center">
                        <div className="text-base font-bold text-gray-700">BHIM</div>
                        <div className="text-xs text-gray-500">BHARAT INTERFACE</div>
                        <div className="text-xs text-gray-500">FOR MONEY</div>
                      </div>
                      <div className="w-px h-6 bg-gray-300"></div>
                      <div className="text-center">
                        <div className="text-base font-bold text-gray-700">UPI</div>
                        <div className="text-xs text-gray-500">UNIFIED PAYMENTS</div>
                        <div className="text-xs text-gray-500">INTERFACE</div>
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium text-gray-700">{cafeSettings?.cafe_name || 'Cafe'}</div>
                    
                    <div className="h-2 -mx-4 -mb-4 rounded-b-lg" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                  </div>
                </div>
              )}

              {/* Cart Items */}
              {currentCart.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
                  <p className="font-medium mb-1">Your cart is empty</p>
                  <p className="text-sm">Select items from the menu to add them to your order</p>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {currentCart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-accent-50 dark:bg-gray-700 rounded-lg border border-accent-200 dark:border-gray-600">
                      <div className="flex items-center space-x-3 flex-1">
                        {/* Cart Item Image */}
                        {cafeSettings?.show_menu_images && item.image_url && (
                          <div className="w-12 h-12 overflow-hidden rounded-lg flex-shrink-0">
                            <img
                              src={getImageUrl(item.image_url)}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm" style={{ color: 'var(--color-on-surface)' }}>{item.name}</h4>
                          <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>{formatCurrency(ensureNumber(item.price))} each</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 rounded-full border transition-interactive btn-press"
                          style={{ 
                            backgroundColor: 'var(--surface-card)',
                            borderColor: 'var(--color-outline)',
                            color: 'var(--color-on-surface-variant)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
                            e.currentTarget.style.color = 'var(--color-on-surface)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-card)';
                            e.currentTarget.style.color = 'var(--color-on-surface-variant)';
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium text-sm" style={{ color: 'var(--color-on-surface)' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 rounded-full border transition-interactive btn-press"
                          style={{ 
                            backgroundColor: 'var(--surface-card)',
                            borderColor: 'var(--color-outline)',
                            color: 'var(--color-on-surface-variant)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
                            e.currentTarget.style.color = 'var(--color-on-surface)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-card)';
                            e.currentTarget.style.color = 'var(--color-on-surface-variant)';
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 rounded-full border transition-interactive btn-press"
                          style={{ 
                            backgroundColor: 'var(--surface-card)',
                            borderColor: 'var(--color-error)',
                            color: 'var(--color-error)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-error)';
                            e.currentTarget.style.color = 'var(--color-on-error)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-card)';
                            e.currentTarget.style.color = 'var(--color-error)';
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tip Selection */}
              {currentCart.length > 0 && (
                <div className="border-t border-accent-200 pt-4 mb-4">
                  <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3">Tip</h3>
                  
                  {/* Quick tip buttons */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[0, 10, 15, 18, 20, 25].map((percentage) => (
                      <button
                        key={percentage}
                        onClick={() => handleTipPercentageChange(percentage)}
                        className={`h-10 text-sm rounded-lg border transition-colors font-medium ${
                          tipPercentage === percentage
                            ? 'bg-secondary-600 text-white border-secondary-600'
                            : 'btn-secondary'
                        }`}
                      >
                        {percentage === 0 ? 'No Tip' : `${percentage}%`}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom tip amount */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Custom:</span>
                    <input
                      type="number"
                      value={tipAmount.toFixed(2)}
                      onChange={(e) => handleTipAmountChange(e.target.value)}
                      step="0.01"
                      min="0"
                      className="flex-1 input-field"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Totals */}
              {currentCart.length > 0 && (
                <div className="border-t border-accent-200 pt-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {taxInfo.taxAmount > 0 && (
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>{taxInfo.taxName} ({taxInfo.taxRate}%):</span>
                      <span>{formatCurrency(taxInfo.taxAmount)}</span>
                    </div>
                  )}
                  
                  {tipAmount > 0 && (
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Tip:</span>
                      <span>{formatCurrency(tipAmount)}</span>
                    </div>
                  )}
                  
                  {pointsToRedeem > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Points Redeemed ({pointsToRedeem} pts):</span>
                      <span>-{formatCurrency(pointsToRedeem * 0.1)}</span>
                    </div>
                  )}

                  {extraCharge > 0 && (
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Extra Charge:</span>
                      <span>{formatCurrency(extraCharge)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-lg font-semibold border-t border-accent-200 pt-2">
                    <span className="text-secondary-700 dark:text-secondary-300">Total:</span>
                    <span className="text-secondary-600 dark:text-secondary-400">{formatCurrency(total)}</span>
                  </div>
                </div>
              )}

              {/* Generate Invoice Button */}
              <button
                onClick={() => {
                  startCheckout();
                  setShowCart(false);
                }}
                disabled={currentCart.length === 0 || loading}
                className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Receipt className="h-4 w-4 mr-2" />
                {loading ? 'Completing...' : 'Complete order'}
              </button>
          </Sheet>
        </div>
      )}

      {/* Desktop Cart - customerMenu-inspired */}
      <div className="hidden lg:block lg:col-span-1">
        <div className={`rounded-2xl shadow-xl sticky top-6 overflow-hidden border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E9E4DA]'}`}>
          <div className={`px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-[#E9E4DA]'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {cafeSettings.logo_url && (
                  <img
                    src={getImageUrl(cafeSettings.logo_url)}
                    alt=""
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                )}
                <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDarkMode ? 'text-gray-100' : 'text-[#2A2A2A]'}`}>
                  <ShoppingCart className={`h-5 w-5 ${isDarkMode ? 'text-amber-400' : 'text-[#C68E3C]'}`} />
                  Cart
                </h2>
              </div>
              {currentCart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className={`text-sm transition-colors hover:text-red-600 ${isDarkMode ? 'text-gray-400' : 'text-[#6F6A63]'}`}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="px-5 sm:px-6 py-4 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
            {/* Customer Info */}
            <input
              type="text"
              placeholder="Customer Name *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-field"
            />
            <input
              type="tel"
              placeholder="Phone Number (optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Table Number/Character (optional)"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="input-field"
            />
            {customerInfo && (
              <div className="mb-2 p-2 bg-[#C68E3C]/10 border border-[#C68E3C]/30 rounded-xl">
                <div className="flex items-center text-sm text-[#2A2A2A]">
                  <Star className="h-4 w-4 mr-1 text-[#C68E3C]" />
                  <span>Welcome back! {customerInfo.loyalty_points} loyalty points available</span>
                </div>
              </div>
            )}

            {/* Points Redemption */}
            {currentCart.length > 0 && customerInfo?.loyalty_points > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#2A2A2A] mb-2 flex items-center">
                  <Star className="h-4 w-4 mr-2 text-[#C68E3C]" />
                  Redeem Points
                  <span className="ml-2 text-sm text-[#6F6A63]">(1 point = {formatCurrency(0.10)})</span>
                </label>
                <div className="bg-[#C68E3C]/5 border border-[#C68E3C]/20 rounded-xl p-3 mb-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#6F6A63]">Available:</span>
                    <span className="font-medium text-[#2A2A2A]">{customerInfo.loyalty_points} pts</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-[#6F6A63]">Max:</span>
                    <span className="font-medium text-[#2A2A2A]">{maxRedeemablePoints} pts</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-[#6F6A63]">Points:</span>
                  <input
                    type="number"
                    value={pointsToRedeem}
                    onChange={(e) => handlePointsRedemption(parseInt(e.target.value) || 0)}
                    min="0"
                    max={maxRedeemablePoints}
                    className="flex-1 input-field"
                    placeholder="0"
                  />
                </div>
                
                {pointsToRedeem > 0 && (
                  <div className="mt-2 text-sm text-green-600">Save: ₹{(pointsToRedeem * 0.1).toFixed(2)}</div>
                )}
              </div>
            )}

            {/* Payment Method */}
            <div className="mb-4">
              <h3 className="font-medium text-[#2A2A2A] mb-3">Payment Method</h3>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.code}
                    type="button"
                    onClick={() => setPaymentMethod(method.code)}
                    className={`h-10 flex items-center justify-center rounded-xl border transition-colors text-sm font-medium ${
                      paymentMethod === method.code
                        ? 'bg-[#2A2A2A] text-white border-[#2A2A2A] hover:bg-[#C68E3C] hover:border-[#C68E3C]'
                        : 'border-[#2A2A2A]/20 text-[#2A2A2A] hover:bg-[#F6F4F0]'
                    }`}
                  >
                    <span className="mr-2">{method.icon}</span>
                    <span>{method.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Split Payment Option */}
            {currentCart.length > 0 && user?.role === 'admin' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-[#2A2A2A]">Split Payment</h3>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={splitPayment}
                      onChange={(e) => {
                        setSplitPayment(e.target.checked);
                        if (!e.target.checked) {
                          setSplitAmount(0);
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-[#6F6A63]">Enable split payment</span>
                  </label>
                </div>
                {splitPayment && (
                  <div className="space-y-3 p-4 bg-[#F6F4F0] border border-[#E9E4DA] rounded-xl mt-2">
                    <div>
                      <label className="block text-sm font-medium text-[#2A2A2A] mb-2">Split Payment Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentMethods.filter(method => method.code !== paymentMethod).map((method) => (
                          <button
                            key={method.code}
                            type="button"
                            onClick={() => setSplitPaymentMethod(method.code)}
                            className={`h-10 flex items-center justify-center rounded-xl border transition-colors text-sm font-medium ${
                              splitPaymentMethod === method.code
                                ? 'bg-[#2A2A2A] text-white border-[#2A2A2A] hover:bg-[#C68E3C]'
                                : 'border-[#2A2A2A]/20 text-[#2A2A2A] hover:bg-white'
                            }`}
                          >
                            <span className="mr-2">{method.icon}</span>
                            <span>{method.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2A2A2A] mb-2">
                        Amount paid via {paymentMethods.find(m => m.code === splitPaymentMethod)?.name || 'split method'}
                      </label>
                      <input
                        type="number"
                        value={splitAmount}
                        onChange={(e) => setSplitAmount(parseFloat(e.target.value) || 0)}
                        min="0"
                        max={getTotal() - 0.01}
                        step="0.01"
                        className="input-field"
                        placeholder="Enter amount"
                      />
                      <p className="text-xs text-[#6F6A63] mt-1">
                        Remaining: {formatCurrency(getTotal() - splitAmount)} via {paymentMethods.find(m => m.code === paymentMethod)?.name || 'primary'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pickup Option */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#2A2A2A] mb-2">Pickup Option</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPickupOption('pickup')}
                  className={`h-10 flex items-center justify-center rounded-xl border transition-colors text-sm font-medium ${
                    pickupOption === 'pickup'
                      ? 'bg-[#2A2A2A] text-white border-[#2A2A2A] hover:bg-[#C68E3C]'
                      : 'border-[#2A2A2A]/20 text-[#2A2A2A] hover:bg-[#F6F4F0]'
                  }`}
                >
                  <span className="mr-2">🏪</span>
                  <span>Pickup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPickupOption('dine-in')}
                  className={`h-10 flex items-center justify-center rounded-xl border transition-colors text-sm font-medium ${
                    pickupOption === 'dine-in'
                      ? 'bg-[#2A2A2A] text-white border-[#2A2A2A] hover:bg-[#C68E3C]'
                      : 'border-[#2A2A2A]/20 text-[#2A2A2A] hover:bg-[#F6F4F0]'
                  }`}
                >
                  <span className="mr-2">🍽️</span>
                  <span>Dine-in</span>
                </button>
              </div>
              <p className="text-xs text-[#6F6A63] mt-1">
                {pickupOption === 'pickup'
                  ? 'Order will be ready for pickup at the counter'
                  : 'Order will be served at the table'}
              </p>
            </div>

            {/* UPI QR Code Display */}
            {paymentMethod === 'upi' && (
              <div className="mb-4 p-4 bg-[#F6F4F0] border border-[#E9E4DA] rounded-xl">
                <div className="text-center">
                  <div className="p-3 rounded-t-lg -mt-4 -mx-4 mb-4 flex items-center" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}>
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2">
                      <span className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>पे</span>
                    </div>
                    <span className="font-semibold">PhonePe</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">Scan & Pay with any UPI App</p>
                  
                  <img 
                    src="/images/upi-qr-code.png" 
                    alt="UPI QR Code" 
                    className="w-48 h-48 mx-auto mb-4"
                  />
                  
                  <div className="text-sm text-gray-600 mb-2">UPI ID: Q966641592@ybl</div>
                  
                  <div className="flex justify-center items-center space-x-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-700">BHIM</div>
                      <div className="text-xs text-gray-500">BHARAT INTERFACE</div>
                      <div className="text-xs text-gray-500">FOR MONEY</div>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-700">UPI</div>
                      <div className="text-xs text-gray-500">UNIFIED PAYMENTS</div>
                      <div className="text-xs text-gray-500">INTERFACE</div>
                    </div>
                  </div>
                  
                  <div className="text-sm font-medium text-gray-700">{cafeSettings?.cafe_name || 'Cafe'}</div>
                  
                  <div className="h-2 -mx-4 -mb-4 rounded-b-lg" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className={`px-5 sm:px-6 pb-4 border-t pt-4 ${isDarkMode ? 'border-gray-700' : 'border-[#E9E4DA]'}`}>
          {currentCart.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-[#6F6A63]'}`}>
              <ShoppingCart className={`h-12 w-12 mx-auto mb-2 ${isDarkMode ? 'text-amber-500/40' : 'text-[#C68E3C]/40'}`} />
              <p className={`font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-[#2A2A2A]'}`}>Your cart is empty</p>
              <p className="text-sm">Select items from the menu to add them to your order</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {currentCart.map((item) => (
                <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-[#F6F4F0] border-[#E9E4DA]'}`}>
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Cart Item Image */}
                    {cafeSettings?.show_menu_images && item.image_url && (
                      <div className="w-12 h-12 overflow-hidden rounded-lg flex-shrink-0">
                        <img
                          src={getImageUrl(item.image_url)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-[#2A2A2A]'}`}>{item.name}</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6F6A63]'}`}>{formatCurrency(ensureNumber(item.price))} each</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-600' : 'text-[#6F6A63] hover:text-[#2A2A2A] hover:bg-white'}`}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className={`w-8 text-center font-medium ${isDarkMode ? 'text-gray-100' : 'text-[#2A2A2A]'}`}>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-600' : 'text-[#6F6A63] hover:text-[#2A2A2A] hover:bg-white'}`}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 rounded-lg text-red-600 hover:text-red-500 hover:bg-white/80 dark:hover:bg-gray-600 ml-1 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tip Selection */}
          {currentCart.length > 0 && (
            <div className={`border-t pt-4 mb-4 ${isDarkMode ? 'border-gray-700' : 'border-[#E9E4DA]'}`}>
              <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-[#2A2A2A]'}`}>Tip</h3>
              
              {/* Quick tip buttons */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[0, 10, 15, 18, 20, 25].map((percentage) => (
                  <button
                    key={percentage}
                    type="button"
                    onClick={() => handleTipPercentageChange(percentage)}
                    className={`py-2 px-3 text-sm rounded-xl border transition-colors ${
                      tipPercentage === percentage
                        ? 'bg-[#2A2A2A] text-white border-[#2A2A2A] hover:bg-[#C68E3C]'
                        : 'border-[#2A2A2A]/20 text-[#2A2A2A] hover:bg-[#F6F4F0]'
                    }`}
                  >
                    {percentage === 0 ? 'No Tip' : `${percentage}%`}
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-[#6F6A63]">Custom:</span>
                <input
                  type="number"
                  value={tipAmount.toFixed(2)}
                  onChange={(e) => handleTipAmountChange(e.target.value)}
                  step="0.01"
                  min="0"
                  className="flex-1 input-field"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {/* Extra Charge */}
          {currentCart.length > 0 && (
            <div className="border-t border-[#E9E4DA] pt-4 mb-4">
              <h3 className="font-medium text-[#2A2A2A] mb-3">Extra Charge</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={extraChargeEnabled}
                  onChange={(e) => {
                    setExtraChargeEnabled(e.target.checked);
                    if (!e.target.checked) {
                      setExtraCharge(0);
                      setExtraChargeNote('');
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm text-[#6F6A63]">Add extra charge</span>
              </div>
              {extraChargeEnabled && (
                <div className="space-y-3 p-4 bg-[#F6F4F0] border border-[#E9E4DA] rounded-xl mt-2">
                  <div>
                    <label className="block text-sm font-medium text-[#2A2A2A] mb-2">Extra Charge Amount</label>
                    <input
                      type="number"
                      value={extraCharge}
                      onChange={(e) => setExtraCharge(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full p-3 border border-[#E9E4DA] rounded-xl focus:ring-2 focus:ring-[#C68E3C]/30 focus:border-[#C68E3C]"
                      placeholder="Enter extra charge amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2A2A2A] mb-2">Extra Charge Note (optional)</label>
                    <input
                      type="text"
                      value={extraChargeNote}
                      onChange={(e) => setExtraChargeNote(e.target.value)}
                      className="w-full p-3 border border-[#E9E4DA] rounded-xl focus:ring-2 focus:ring-[#C68E3C]/30 focus:border-[#C68E3C]"
                      placeholder="e.g., Service fee, Delivery charge"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Totals */}
          {currentCart.length > 0 && (
            <div className="border-t border-[#E9E4DA] pt-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm text-[#6F6A63]">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {taxInfo.taxAmount > 0 && (
                <div className="flex justify-between text-sm text-[#6F6A63]">
                  <span>{taxInfo.taxName} ({taxInfo.taxRate}%):</span>
                  <span>{formatCurrency(taxInfo.taxAmount)}</span>
                </div>
              )}
              {tipAmount > 0 && (
                <div className="flex justify-between text-sm text-[#6F6A63]">
                  <span>Tip:</span>
                  <span>{formatCurrency(tipAmount)}</span>
                </div>
              )}
              {pointsToRedeem > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Points Redeemed ({pointsToRedeem} pts):</span>
                  <span>-{formatCurrency(pointsToRedeem * 0.1)}</span>
                </div>
              )}
              {extraCharge > 0 && (
                <div className="flex justify-between text-sm text-[#6F6A63]">
                  <span>Extra Charge:</span>
                  <span>{formatCurrency(extraCharge)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-semibold border-t border-[#E9E4DA] pt-2">
                <span className="text-[#2A2A2A]">Total:</span>
                <span className="text-[#C68E3C]">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          {/* Complete order button */}
          <button
            type="button"
            onClick={startCheckout}
            disabled={currentCart.length === 0 || loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#2A2A2A] hover:bg-[#C68E3C] dark:bg-gray-700 dark:hover:bg-amber-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Receipt className="h-4 w-4" />
            {loading ? 'Completing...' : 'Complete order'}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage; 
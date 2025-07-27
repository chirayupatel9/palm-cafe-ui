import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Minus, Trash2, Receipt, ShoppingCart, FolderOpen, X, Star } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { getCategoryColor } from '../utils/categoryColors';
import { useAuth } from '../contexts/AuthContext';

const OrderPage = ({ menuItems, cart: externalCart, setCart: setExternalCart }) => {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
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
      const response = await axios.get(`/customer/login/${phone}`);
      if (response.data) {
        const customer = response.data;
        setCustomerInfo(customer);
        setCustomerName(customer.name);
        toast.success(`Welcome back, ${customer.name}! You have ${customer.loyalty_points} loyalty points.`);
      } else {
        setCustomerInfo(null);
      }
    } catch (error) {
      console.error('Error searching customer:', error);
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

  // Generate invoice
  const generateInvoice = async () => {
    if (currentCart.length === 0) {
      toast.error('Please add items to cart first');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    // Only allow split payment for admins
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

    setLoading(true);

    try {
      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
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
        extraChargeNote: extraChargeNote
      };

      const response = await axios.post('/invoices', orderData);
      
      // Download the PDF
      const pdfResponse = await axios.get(`/invoices/${response.data.orderNumber}/download`);
      
      // Create blob and open PDF in new tab
      const pdfBlob = new Blob([Uint8Array.from(atob(pdfResponse.data.pdf), c => c.charCodeAt(0))], {
        type: 'application/pdf'
      });
      
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      // Clean up the URL object after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);

      // Clear cart and form
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
      
      toast.success(`Invoice generated successfully! Order #${response.data.orderNumber}`);
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
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
    <div className="lg:grid lg:grid-cols-3 lg:gap-6">
      {/* Menu Items */}
      <div className="lg:col-span-2 mb-6 lg:mb-0">
        <div className="card">
          <div className="flex items-center justify-center mb-8">
            <img 
              src="/images/palm-cafe-logo.png" 
              alt="Palm Cafe Logo" 
              className="h-20 w-20 mr-6"
            />
            <div className="text-center">
              <h2 className="text-3xl font-bold text-secondary-700 dark:text-secondary-300 mb-2">Menu Items</h2>
              <p className="text-base text-gray-600 dark:text-gray-400">Click on any item to add it to your cart</p>
            </div>
          </div>
          
          {Object.keys(groupedMenuItems).length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <img 
                src="/images/palm-cafe-logo.png" 
                alt="Palm Cafe Logo" 
                className="h-24 w-24 mx-auto mb-6 opacity-50"
              />
              <h3 className="text-xl font-semibold mb-2">No menu items available</h3>
              <p className="text-base">Add items in Menu Management to get started</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {Object.entries(groupedMenuItems).map(([categoryName, items], index) => {
                const categoryColor = getCategoryColor(categoryName, index);
                return (
                <div key={categoryName} className={`border ${categoryColor.border} rounded-xl p-4 sm:p-6 ${categoryColor.bg} shadow-sm`}>
                  <h3 className={`text-xl font-bold ${categoryColor.text} mb-4 sm:mb-6 flex items-center`}>
                    <FolderOpen className={`h-6 w-6 mr-3 ${categoryColor.text}`} />
                    {categoryName}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`group relative border ${categoryColor.border} rounded-xl p-4 sm:p-5 hover:shadow-lg transition-all duration-300 cursor-pointer ${categoryColor.bg} hover:${categoryColor.hover} hover:scale-105 transform`}
                        onClick={() => addToCart(item)}
                      >
                        {/* Add to cart indicator */}
                        <div className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md ${categoryColor.border}`}>
                          <Plus className={`h-4 w-4 ${categoryColor.text}`} />
                        </div>
                        
                        <div className="flex justify-between items-start mb-3">
                          <h4 className={`font-semibold ${categoryColor.text} text-sm sm:text-base leading-tight`}>
                            {item.name}
                          </h4>
                          <span className={`text-lg sm:text-xl font-bold ${categoryColor.text} ml-2`}>
                            {formatCurrency(ensureNumber(item.price))}
                          </span>
                        </div>
                        
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {item.description}
                        </p>
                        
                        {/* Hover effect overlay */}
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* Cart - Mobile Floating Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowCart(!showCart)}
          className="bg-secondary-500 text-white p-4 rounded-full shadow-lg hover:bg-secondary-600 transition-colors"
        >
          <ShoppingCart className="h-6 w-6" />
          {currentCart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {currentCart.length}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Cart Overlay */}
      {showCart && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-[80vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <img 
                    src="/images/palm-cafe-logo.png" 
                    alt="Palm Cafe Logo" 
                    className="h-8 w-8 mr-2"
                  />
                  <h2 className="text-xl font-semibold text-secondary-700">
                    Cart ({currentCart.length})
                  </h2>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Customer Info */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input-field mb-2"
                />
                <input
                  type="tel"
                  placeholder="Phone Number (optional)"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    searchCustomer(e.target.value);
                  }}
                  className="input-field mb-2"
                />
                {customerInfo && (
                  <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center text-sm text-green-700">
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
                        (1 point = ₹0.10)
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
                        className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                          paymentMethod === method.code
                            ? 'bg-secondary-500 text-white border-secondary-500'
                            : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                        }`}
                      >
                        <span className="mr-2">{method.icon}</span>
                        <span className="text-sm font-medium">{method.name}</span>
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
                                className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                                  splitPaymentMethod === method.code
                                    ? 'bg-secondary-500 text-white border-secondary-500'
                                    : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                                }`}
                              >
                                <span className="mr-2">{method.icon}</span>
                                <span className="font-medium">{method.name}</span>
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
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                            placeholder="Enter amount"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Remaining amount: ₹{(getTotal() - splitAmount).toFixed(2)} via {paymentMethods.find(m => m.code === paymentMethod)?.name || 'primary method'}
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
                      className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                        pickupOption === 'pickup'
                          ? 'bg-secondary-500 text-white border-secondary-500'
                          : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                      }`}
                    >
                      <span className="mr-2">🏪</span>
                      <span className="text-sm font-medium">Pickup</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickupOption('dine-in')}
                      className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                        pickupOption === 'dine-in'
                          ? 'bg-secondary-500 text-white border-secondary-500'
                          : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                      }`}
                    >
                      <span className="mr-2">🍽️</span>
                      <span className="text-sm font-medium">Dine-in</span>
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
                    <div className="bg-purple-600 text-white p-3 rounded-t-lg -mt-4 -mx-4 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2">
                        <span className="text-purple-600 font-bold text-sm">पे</span>
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
                    
                    <div className="text-sm font-medium text-gray-700">The Palm Cafe</div>
                    
                    <div className="bg-purple-600 h-2 -mx-4 -mb-4 rounded-b-lg"></div>
                  </div>
                </div>
              )}

              {/* Cart Items */}
              {currentCart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Your cart is empty</p>
                  <p className="text-sm">Add items from the menu</p>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {currentCart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-accent-50 rounded-lg border border-accent-200">
                      <div className="flex-1">
                        <h4 className="font-medium text-secondary-700 text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-600">{formatCurrency(ensureNumber(item.price))} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 text-gray-500 hover:text-gray-700 bg-white rounded-full border"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 text-gray-500 hover:text-gray-700 bg-white rounded-full border"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-red-500 hover:text-red-700 bg-white rounded-full border"
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
                        className={`py-2 px-3 text-sm rounded-lg border transition-colors ${
                          tipPercentage === percentage
                            ? 'bg-secondary-500 text-white border-secondary-500'
                            : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                        }`}
                      >
                        {percentage === 0 ? 'No Tip' : `${percentage}%`}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom tip amount */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Custom:</span>
                    <input
                      type="number"
                      value={tipAmount.toFixed(2)}
                      onChange={(e) => handleTipAmountChange(e.target.value)}
                      step="0.01"
                      min="0"
                      className="flex-1 px-3 py-2 border border-accent-300 rounded-lg text-sm focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
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
                  generateInvoice();
                  setShowCart(false);
                }}
                disabled={currentCart.length === 0 || loading}
                className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed py-3"
              >
                <Receipt className="h-4 w-4 mr-2" />
                {loading ? 'Generating...' : 'Generate & Open Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Cart */}
      <div className="hidden lg:block lg:col-span-1">
        <div className="card sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <img 
                src="/images/palm-cafe-logo.png" 
                alt="Palm Cafe Logo" 
                className="h-8 w-8 mr-2"
              />
              <h2 className="text-xl font-semibold text-secondary-700 dark:text-secondary-300">Cart</h2>
            </div>
            {currentCart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Clear
              </button>
            )}
          </div>

          {/* Customer Info */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Customer Name *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-field mb-2"
            />
            <input
              type="tel"
              placeholder="Phone Number (optional)"
              value={customerPhone}
              onChange={(e) => {
                setCustomerPhone(e.target.value);
                searchCustomer(e.target.value);
              }}
              className="input-field mb-2"
            />
            {customerInfo && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-sm text-green-700">
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
                    (1 point = ₹0.10)
                  </span>
                </label>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Available:</span>
                    <span className="font-medium text-yellow-700 dark:text-yellow-300">
                      {customerInfo.loyalty_points} pts
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-400">Max:</span>
                    <span className="font-medium text-yellow-700 dark:text-yellow-300">
                      {maxRedeemablePoints} pts
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Points:</span>
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
                    Save: ₹{(pointsToRedeem * 0.1).toFixed(2)}
                  </div>
                )}
              </div>
            )}
            
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
                        : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                    }`}
                  >
                    <span className="mr-2">{method.icon}</span>
                    <span className="font-medium">{method.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Split Payment Option */}
            {currentCart.length > 0 && user?.role === 'admin' && (
              <div className="mb-6">
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
                            className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                              splitPaymentMethod === method.code
                                ? 'bg-secondary-500 text-white border-secondary-500'
                                : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                            }`}
                          >
                            <span className="mr-2">{method.icon}</span>
                            <span className="font-medium">{method.name}</span>
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
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                        placeholder="Enter amount"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Remaining amount: ₹{(getTotal() - splitAmount).toFixed(2)} via {paymentMethods.find(m => m.code === paymentMethod)?.name || 'primary method'}
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
                  className={`flex items-center justify-center p-2 rounded-lg border transition-colors text-xs ${
                    pickupOption === 'pickup'
                      ? 'bg-secondary-500 text-white border-secondary-500'
                      : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                  }`}
                >
                  <span className="mr-1">🏪</span>
                  <span className="font-medium">Pickup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPickupOption('dine-in')}
                  className={`flex items-center justify-center p-2 rounded-lg border transition-colors text-xs ${
                    pickupOption === 'dine-in'
                      ? 'bg-secondary-500 text-white border-secondary-500'
                      : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                  }`}
                >
                  <span className="mr-1">🍽️</span>
                  <span className="font-medium">Dine-in</span>
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {pickupOption === 'pickup' 
                  ? 'Order will be ready for pickup at the counter' 
                  : 'Order will be served at the table'}
              </p>
            </div>

            {/* UPI QR Code Display */}
            {paymentMethod === 'upi' && (
              <div className="mb-4 p-4 bg-white border border-accent-200 rounded-lg">
                <div className="text-center">
                  <div className="bg-purple-600 text-white p-3 rounded-t-lg -mt-4 -mx-4 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2">
                      <span className="text-purple-600 font-bold text-sm">पे</span>
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
                  
                  <div className="text-sm font-medium text-gray-700">The Palm Cafe</div>
                  
                  <div className="bg-purple-600 h-2 -mx-4 -mb-4 rounded-b-lg"></div>
                </div>
              </div>
            )}
          </div>

          {/* Cart Items */}
          {currentCart.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
              <p>Your cart is empty</p>
              <p className="text-sm">Add items from the menu</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {currentCart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-accent-50 rounded-lg border border-accent-200">
                  <div className="flex-1">
                    <h4 className="font-medium text-secondary-700 dark:text-secondary-300">{item.name}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(ensureNumber(item.price))} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-red-500 hover:text-red-700 ml-2"
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
                    className={`py-2 px-3 text-sm rounded-lg border transition-colors ${
                      tipPercentage === percentage
                        ? 'bg-secondary-500 text-white border-secondary-500'
                        : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                    }`}
                  >
                    {percentage === 0 ? 'No Tip' : `${percentage}%`}
                  </button>
                ))}
              </div>
              
              {/* Custom tip amount */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Custom:</span>
                <input
                  type="number"
                  value={tipAmount.toFixed(2)}
                  onChange={(e) => handleTipAmountChange(e.target.value)}
                  step="0.01"
                  min="0"
                  className="flex-1 px-3 py-2 border border-accent-300 rounded-lg text-sm focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {/* Extra Charge */}
          {currentCart.length > 0 && (
            <div className="border-t border-accent-200 pt-4 mb-4">
              <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3">Extra Charge</h3>
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
                <span className="text-sm text-gray-600 dark:text-gray-400">Add extra charge</span>
              </div>
              {extraChargeEnabled && (
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Extra Charge Amount
                    </label>
                    <input
                      type="number"
                      value={extraCharge}
                      onChange={(e) => setExtraCharge(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      placeholder="Enter extra charge amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Extra Charge Note (optional)
                    </label>
                    <input
                      type="text"
                      value={extraChargeNote}
                      onChange={(e) => setExtraChargeNote(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      placeholder="e.g., Service fee, Delivery charge"
                    />
                  </div>
                </div>
              )}
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
            onClick={generateInvoice}
            disabled={currentCart.length === 0 || loading}
            className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Receipt className="h-4 w-4 mr-2" />
            {loading ? 'Generating...' : 'Generate & Open Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderPage; 
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Minus, Trash2, Receipt, ShoppingCart, FolderOpen, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { getCategoryColor } from '../utils/categoryColors';

const OrderPage = ({ menuItems }) => {
  const { formatCurrency } = useCurrency();
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [taxInfo, setTaxInfo] = useState({ taxRate: 0, taxName: 'Tax', taxAmount: 0 });
  const [tipAmount, setTipAmount] = useState(0);
  const [tipPercentage, setTipPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [groupedMenuItems, setGroupedMenuItems] = useState({});
  const [showCart, setShowCart] = useState(false);

  // Helper function to ensure price is a number
  const ensureNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Group menu items by category
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
  }, [menuItems]);

  // Calculate subtotal
  const getSubtotal = useCallback(() => {
    return cart.reduce((total, item) => total + (ensureNumber(item.price) * item.quantity), 0);
  }, [cart]);

  // Calculate total with tax and tip
  const getTotal = () => {
    const subtotal = getSubtotal();
    return subtotal + taxInfo.taxAmount + tipAmount;
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
  }, [cart, getSubtotal]);

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

  const addToCart = (item) => {
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
    toast.success(`${item.name} added to cart`);
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    toast.success('Item removed from cart');
  };

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

  const generateInvoice = async () => {
    if (cart.length === 0) {
      toast.error('Please add items to cart first');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: ensureNumber(item.price),
          quantity: item.quantity,
          total: ensureNumber(item.price) * item.quantity
        })),
        tipAmount: tipAmount,
        date: new Date().toISOString()
      };

      const response = await axios.post('/invoices', orderData);
      
      // Create blob and open PDF in new tab
      const pdfBlob = new Blob([Uint8Array.from(atob(response.data.pdf), c => c.charCodeAt(0))], {
        type: 'application/pdf'
      });
      
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      // Clean up the URL object after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);

      // Clear cart and form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setTipAmount(0);
      setTipPercentage(0);
      
      toast.success('Invoice generated and opened!');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setTipAmount(0);
    setTipPercentage(0);
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
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {cart.length}
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
                    Cart ({cart.length})
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
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Cart Items */}
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Your cart is empty</p>
                  <p className="text-sm">Add items from the menu</p>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {cart.map((item) => (
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
              {cart.length > 0 && (
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
              {cart.length > 0 && (
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
                disabled={cart.length === 0 || loading}
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
            {cart.length > 0 && (
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
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Cart Items */}
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
              <p>Your cart is empty</p>
              <p className="text-sm">Add items from the menu</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {cart.map((item) => (
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
          {cart.length > 0 && (
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
          {cart.length > 0 && (
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
              
              <div className="flex justify-between items-center text-lg font-semibold border-t border-accent-200 pt-2">
                <span className="text-secondary-700 dark:text-secondary-300">Total:</span>
                <span className="text-secondary-600 dark:text-secondary-400">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          {/* Generate Invoice Button */}
          <button
            onClick={generateInvoice}
            disabled={cart.length === 0 || loading}
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
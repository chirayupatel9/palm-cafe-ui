import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Minus, Trash2, Receipt, ShoppingCart, FolderOpen, Star, ShoppingBag, BarChart3, Search } from 'lucide-react';
import Dialog from './ui/Dialog';
import Sheet from './ui/Sheet';
import { GlassButton } from './ui/GlassButton';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUtils';

interface OrderPageProps {
  menuItems: any[];
  cart?: any[];
  setCart?: React.Dispatch<React.SetStateAction<any[]>>;
}

// Custom debounce hook
const useDebounce = (value: string, delay: number) => {
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

const OrderPage: React.FC<OrderPageProps> = ({ menuItems, cart: externalCart, setCart: setExternalCart }) => {
  const { formatCurrency } = useCurrency();
  const { cafeSettings } = useCafeSettings();
  const { isDarkMode } = useDarkMode();
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerLookup, setCustomerLookup] = useState(''); // single field: phone or email for lookup
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

  // Debounced phone or email for customer lookup (single field)
  const debouncedLookup = useDebounce(customerLookup, 500);

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

  // Search customer when debounced lookup (phone or email) changes
  const searchCustomer = useCallback(async (query: string) => {
    const val = (query || '').trim();
    const hasEmail = val.includes('@') && val.length >= 5;
    const hasPhone = !hasEmail && val.length >= 4;
    if (!hasPhone && !hasEmail) {
      setCustomerInfo(null);
      return;
    }

    try {
      const cafeSlug = (user?.cafe_slug as string) || 'default';
      const response = await axios.post('/customer/lookup', { query: val, cafeSlug });
      const data = response.data;
      if (data && (data.id != null || data.name != null)) {
        const customer = data as { name?: string; phone?: string; email?: string; loyalty_points?: number };
        setCustomerInfo(customer);
        const name = (customer.name && String(customer.name).trim()) || '';
        setCustomerName(name);
        if (customer.phone) setCustomerPhone(customer.phone);
        if (customer.email) setCustomerEmail(customer.email);
        setCustomerLookup(customer.email || customer.phone || val);
        toast.success(`Welcome back, ${customer.name}! You have ${customer.loyalty_points} loyalty points.`);
      } else {
        setCustomerInfo(null);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Unexpected error searching customer:', error);
      }
      setCustomerInfo(null);
    }
  }, [user?.cafe_slug]);

  useEffect(() => {
    const val = (debouncedLookup || '').trim();
    const hasEmail = val.includes('@') && val.length >= 5;
    const hasPhone = !hasEmail && val.length >= 4;
    if (hasPhone || hasEmail) {
      searchCustomer(val);
    } else if (val.length === 0) {
      setCustomerInfo(null);
    }
  }, [debouncedLookup, searchCustomer]);

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

  const MAX_ITEM_QUANTITY = 10;

  const addToCart = (item) => {
    const currentQty = getCartQuantity(item.id);
    if (currentQty >= MAX_ITEM_QUANTITY) {
      toast.error(`Maximum ${MAX_ITEM_QUANTITY} of the same item allowed`);
      return;
    }
    setCurrentCart(prevCart => {
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
    const capped = Math.min(newQuantity, MAX_ITEM_QUANTITY);
    setCurrentCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity: capped } : item
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
        customerEmail: customerEmail.trim(),
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
  const normalizedMenuQuery = (menuSearchQuery || '').trim().toLowerCase();
  const visibleGroupedMenuItems = normalizedMenuQuery
    ? Object.fromEntries(
        Object.entries(groupedMenuItems)
          .map(([categoryName, items]) => {
            const filtered = (items as any[]).filter((item: any) => {
              const name = (item?.name || '').toString().toLowerCase();
              const description = (item?.description || '').toString().toLowerCase();
              return name.includes(normalizedMenuQuery) || description.includes(normalizedMenuQuery);
            });
            return [categoryName, filtered];
          })
          .filter(([, items]) => (items as any[]).length > 0)
      )
    : groupedMenuItems;

  return (
    <>
      {/* Invoice prompt - Template Dialog */}
      <Dialog open={showInvoicePrompt} onClose={() => setShowInvoicePrompt(false)} title="Complete order" maxHeight={false}>
        <p className="text-sm text-body-muted mb-6">Do you want to see the invoice?</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => completeOrder(false)}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border btn-secondary disabled:opacity-50"
          >
            No
          </button>
          <button
            type="button"
            onClick={() => completeOrder(true)}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-primary hover:opacity-90 text-on-primary font-medium disabled:opacity-50"
          >
            Yes, show invoice
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowInvoicePrompt(false)}
          disabled={loading}
          className="mt-4 w-full text-sm text-body-muted hover:text-on-surface"
        >
          Cancel
        </button>
      </Dialog>

      {/* Menu Items - full width; cart opens in right-side sheet */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <BarChart3 className="h-6 w-6 text-[var(--color-primary)]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[var(--color-on-surface)] truncate">Create new orders</h1>
              <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Manage your cafe operations. Add items to the cart and complete the order.</p>
            </div>
          </div>
        </div>

        {/* Menu search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search menu items..."
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              className="glass-input input-field pl-12 pr-10 w-full min-h-[44px] rounded-full"
              aria-label="Search menu items"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-on-surface-variant" />
            </div>
            {menuSearchQuery && (
              <button
                type="button"
                onClick={() => setMenuSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-on-surface"
                aria-label="Clear menu search"
              >
                <svg className="h-5 w-5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {normalizedMenuQuery && (
            <div className="text-sm text-on-surface-variant">
              Showing results for &quot;{menuSearchQuery.trim()}&quot;
            </div>
          )}
        </div>

        {Object.keys(groupedMenuItems).length === 0 ? (
          <div className="text-center py-16">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl mx-auto mb-4">
              <FolderOpen className="h-8 w-8 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[var(--color-on-surface)]">No menu items available</h3>
            <p className="text-[var(--color-on-surface-variant)]">Add items in Menu Management to get started</p>
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-16">
            {Object.keys(visibleGroupedMenuItems).length === 0 ? (
              <div className="text-center py-16">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl mx-auto mb-4">
                  <Search className="h-8 w-8 text-[var(--color-primary)] opacity-70" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[var(--color-on-surface)]">No matching items</h3>
                <p className="text-[var(--color-on-surface-variant)]">Try a different search term.</p>
              </div>
            ) : Object.entries(visibleGroupedMenuItems).map(([categoryName, items]) => {
              return (
                <section
                  key={categoryName}
                  id={`category-${categoryName.replace(/\s+/g, '-')}`}
                  className="relative"
                >
                  <div className="mb-6 sm:mb-8">
                    <div className="mb-2">
                      <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                        {categoryName}
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {(items as any[]).map((item: any) => {
                      const quantity = getCartQuantity(item.id);
                      return (
                        <div
                          key={item.id}
                          className="group overflow-hidden transition-colors hover:bg-[var(--color-outline-variant)]"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden flex-shrink-0 bg-[var(--surface-table)]">
                            {cafeSettings?.show_menu_images && item.image_url ? (
                              <img
                                src={getImageUrl(item.image_url)}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FolderOpen className="h-12 w-12 text-primary opacity-40" />
                              </div>
                            )}
                            <div className="absolute top-3 right-3 menu-price-badge">
                              <span className="font-mono text-sm font-medium menu-price-badge-text">
                                {formatCurrency(ensureNumber(item.price))}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 sm:p-5">
                            <h4 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors text-on-surface">
                              {item.name}
                            </h4>
                            <p className="text-sm mb-4 line-clamp-2 leading-relaxed text-body-muted">
                              {item.description || '—'}
                            </p>
                            {quantity === 0 ? (
                              <GlassButton
                                type="button"
                                onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                size="default"
                                className="w-full glass-button-primary [&_.glass-button]:w-full [&_.glass-button]:min-w-0 [&_.glass-button-text]:w-full [&_.glass-button-text]:min-w-0"
                                contentClassName="w-full flex items-center justify-center gap-2 text-sm sm:text-base"
                                aria-label={`Add ${item.name} to cart`}
                              >
                                <ShoppingBag className="h-4 w-4 shrink-0" />
                                Add to cart
                              </GlassButton>
                            ) : (
                              <div className="flex items-center justify-between rounded-xl p-2 bg-[var(--surface-table)]">
                                <GlassButton
                                  type="button"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, quantity - 1); }}
                                  aria-label="Decrease quantity"
                                  className="glass-button-secondary [&_.glass-button]:!text-[var(--color-on-surface)]"
                                  contentClassName="text-[var(--color-on-surface)]"
                                >
                                  <Minus className="h-4 w-4" />
                                </GlassButton>
                                <span className="font-mono text-lg font-medium text-on-surface">{quantity}</span>
                                <GlassButton
                                  type="button"
                                  size="icon"
                                  disabled={quantity >= MAX_ITEM_QUANTITY}
                                  onClick={(e) => { e.stopPropagation(); quantity < MAX_ITEM_QUANTITY && updateQuantity(item.id, quantity + 1); }}
                                  aria-label="Increase quantity"
                                  className="glass-button-secondary disabled:opacity-50 disabled:pointer-events-none [&_.glass-button]:!text-[var(--color-on-surface)]"
                                  contentClassName="text-[var(--color-on-surface)]"
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
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart - FAB opens right-side sheet on all screen sizes */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowCart(true)}
          className="flex items-center gap-2 rounded-full px-4 py-3 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-h-[56px] min-w-[56px] focus:ring-4 focus:ring-primary/30"
          style={{ backgroundColor: 'var(--color-primary)' }}
          aria-label="Open cart"
        >
          <ShoppingCart className="h-6 w-6 flex-shrink-0" />
          {currentCart.length > 0 ? (
            <>
              <span className="hidden sm:inline font-medium">Cart</span>
              <span className="bg-on-primary text-primary text-xs font-semibold rounded-full h-6 min-w-[24px] flex items-center justify-center px-1.5">
                {currentCart.length}
              </span>
            </>
          ) : (
            <span className="hidden sm:inline font-medium">Cart</span>
          )}
        </button>
      </div>

      {/* Cart - Right-side sheet (mobile + desktop) */}
      {showCart && (
        <Sheet open={showCart} onClose={() => setShowCart(false)} title={currentCart.length > 0 ? `Cart (${currentCart.length})` : 'Cart'}>
              {/* Customer Info */}
              <div className="space-form mb-4">
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Phone or Email (optional – lookup customer)"
                  value={customerLookup}
                  onChange={(e) => setCustomerLookup(e.target.value)}
                  className="input-field"
                  autoComplete="tel email"
                />
                {customerInfo && (
                  <div className="mb-2 p-2 bg-[var(--color-primary-container)] border border-[var(--color-outline)] rounded-lg">
                    <div className="flex items-center text-sm text-success">
                      <Star className="h-4 w-4 mr-1" />
                      <span>Welcome back! {customerInfo.loyalty_points} loyalty points available</span>
                    </div>
                  </div>
                )}

                {/* Points Redemption */}
                {currentCart.length > 0 && customerInfo?.loyalty_points > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-on-surface mb-2 flex items-center">
                      <Star className="h-4 w-4 mr-2 text-warning" />
                      Redeem Points
                      <span className="ml-2 text-sm text-body-muted">
                        (1 point = {formatCurrency(0.10)})
                      </span>
                    </label>
                    
                    <div className="bg-[var(--color-primary-container)] border border-[var(--color-outline)] rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-body-muted">Available Points:</span>
                        <span className="font-medium text-on-primary-container">
                          {customerInfo.loyalty_points}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-body-muted">Max Redeemable:</span>
                        <span className="font-medium text-on-primary-container">
                          {maxRedeemablePoints} points
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-body-muted">Points to redeem:</span>
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
                      <div className="mt-2 text-sm text-success">
                        Customer will save: ₹{(pointsToRedeem * 0.1).toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Payment Method */}
                <div className="mb-2">
                  <label className="block text-sm font-medium text-on-surface mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.code}
                        type="button"
                        onClick={() => setPaymentMethod(method.code)}
                        className={`flex items-center justify-center gap-2 min-h-[48px] rounded-xl font-semibold text-sm ${paymentMethod === method.code ? 'glass-option-btn-selected' : 'glass-option-btn'}`}
                      >
                        <span className="shrink-0">{method.icon}</span>
                        <span>{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Split Payment Option - Admin Only */}
                {currentCart.length > 0 && user?.role === 'admin' && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-on-surface">Split Payment</h3>
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
                        <span className="text-sm text-body-muted">Enable split payment</span>
                      </label>
                    </div>
                    
                    {splitPayment && (
                      <div className="space-y-3 p-4 bg-[var(--surface-table)] rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-on-surface mb-2">
                            Split Payment Method
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {paymentMethods.filter(method => method.code !== paymentMethod).map((method) => (
                              <button
                                key={method.code}
                                type="button"
                                onClick={() => setSplitPaymentMethod(method.code)}
                                className={`flex items-center justify-center gap-2 min-h-[48px] rounded-xl font-semibold text-sm ${splitPaymentMethod === method.code ? 'glass-option-btn-selected' : 'glass-option-btn'}`}
                              >
                                <span className="shrink-0">{method.icon}</span>
                                <span>{method.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-on-surface mb-2">
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
                          <p className="text-xs text-body-muted mt-1">
                            Remaining amount: {formatCurrency(getTotal() - splitAmount)} via {paymentMethods.find(m => m.code === paymentMethod)?.name || 'primary method'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}



                {/* Pickup Option */}
                <div className="mb-2">
                  <label className="block text-sm font-medium text-on-surface mb-2">
                    Pickup Option
                  </label>
                  <div className="grid grid-cols-2 gap-2 items-stretch">
                    <button
                      type="button"
                      onClick={() => setPickupOption('pickup')}
                      className={`w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl font-semibold text-sm ${pickupOption === 'pickup' ? 'glass-option-btn-selected' : 'glass-option-btn'}`}
                    >
                      <span>🏪</span>
                      <span>Pickup</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickupOption('dine-in')}
                      className={`w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl font-semibold text-sm ${pickupOption === 'dine-in' ? 'glass-option-btn-selected' : 'glass-option-btn'}`}
                    >
                      <span>🍽️</span>
                      <span>Dine-in</span>
                    </button>
                  </div>
                  <p className="text-xs text-body-muted mt-1">
                    {pickupOption === 'pickup' 
                      ? 'Order will be ready for pickup at the counter' 
                      : 'Order will be served at the table'}
                  </p>
                  {pickupOption === 'dine-in' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-on-surface mb-2">
                        Table Number/Character (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5 or A"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="input-field"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* UPI QR Code Display */}
              {paymentMethod === 'upi' && (
                <div className="card">
                  <div className="text-center">
                    <div className="bg-primary text-on-primary p-3 rounded-t-lg -mt-4 -mx-4 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-on-primary rounded-full flex items-center justify-center mr-2">
                        <span className="text-primary font-bold text-sm">पे</span>
                      </div>
                      <span className="font-semibold">PhonePe</span>
                    </div>
                    
                    <p className="text-sm text-body-muted mb-4">Scan & Pay with any UPI App</p>
                    
                    <img 
                      src="/images/upi-qr-code.png" 
                      alt="UPI QR Code" 
                      className="w-40 h-40 mx-auto mb-4"
                    />
                    
                    <div className="text-sm text-body-muted mb-2">UPI ID: Q966641592@ybl</div>
                    
                    <div className="flex justify-center items-center space-x-4 mb-3">
                      <div className="text-center">
                        <div className="text-base font-bold text-on-surface">BHIM</div>
                        <div className="text-xs text-body-muted">BHARAT INTERFACE</div>
                        <div className="text-xs text-body-muted">FOR MONEY</div>
                      </div>
                      <div className="w-px h-6 bg-[var(--color-outline)]"></div>
                      <div className="text-center">
                        <div className="text-base font-bold text-on-surface">UPI</div>
                        <div className="text-xs text-body-muted">UNIFIED PAYMENTS</div>
                        <div className="text-xs text-body-muted">INTERFACE</div>
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium text-on-surface">{cafeSettings?.cafe_name || 'Cafe'}</div>
                    
                    <div className="h-2 -mx-4 -mb-4 rounded-b-lg" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                  </div>
                </div>
              )}

              {/* Cart Items */}
              {currentCart.length === 0 ? (
                <div className="text-center py-8 text-body-muted">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-60" style={{ color: 'var(--color-on-surface-variant)' }} />
                  <p className="font-medium mb-1 text-on-surface">Your cart is empty</p>
                  <p className="text-sm">Select items from the menu to add them to your order</p>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {currentCart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-[var(--surface-table)] rounded-lg border border-[var(--color-outline)]">
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
                          onClick={() => item.quantity < MAX_ITEM_QUANTITY && updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= MAX_ITEM_QUANTITY}
                          className="p-2 rounded-full border transition-interactive btn-press disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="border-t border-[var(--color-outline)] pt-4 mb-4">
                  <h3 className="font-medium text-on-surface mb-3">Tip</h3>
                  
                  {/* Quick tip buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[0, 10, 15, 18, 20, 25].map((percentage) => (
                      <button
                        key={percentage}
                        onClick={() => handleTipPercentageChange(percentage)}
                        className={`py-2.5 px-4 rounded-xl font-semibold text-sm shrink-0 min-h-[44px] ${tipPercentage === percentage ? 'glass-option-btn-selected' : 'glass-option-btn'}`}
                      >
                        {percentage === 0 ? 'No Tip' : `${percentage}%`}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom tip amount */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-body-muted">Custom:</span>
                    <input
                      type="number"
                      value={tipAmount.toFixed(2)}
                      onChange={(e) => handleTipAmountChange(e.target.value)}
                      step="0.01"
                      min="0"
                      className="flex-1 glass-input rounded-xl px-4 py-2.5 text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] border border-white/40 dark:border-white/20 bg-white/30 dark:bg-white/10 backdrop-blur-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Totals */}
              {currentCart.length > 0 && (
                <div className="border-t border-[var(--color-outline)] pt-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm text-body-muted">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {taxInfo.taxAmount > 0 && (
                    <div className="flex justify-between text-sm text-body-muted">
                      <span>{taxInfo.taxName} ({taxInfo.taxRate}%):</span>
                      <span>{formatCurrency(taxInfo.taxAmount)}</span>
                    </div>
                  )}
                  
                  {tipAmount > 0 && (
                    <div className="flex justify-between text-sm text-body-muted">
                      <span>Tip:</span>
                      <span>{formatCurrency(tipAmount)}</span>
                    </div>
                  )}
                  
                  {pointsToRedeem > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Points Redeemed ({pointsToRedeem} pts):</span>
                      <span>-{formatCurrency(pointsToRedeem * 0.1)}</span>
                    </div>
                  )}

                  {extraCharge > 0 && (
                    <div className="flex justify-between text-sm text-body-muted">
                      <span>Extra Charge:</span>
                      <span>{formatCurrency(extraCharge)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-lg font-semibold border-t border-[var(--color-outline)] pt-2">
                    <span className="text-on-surface">Total:</span>
                    <span className="text-on-surface">{formatCurrency(total)}</span>
                  </div>
                </div>
              )}

              {/* Complete order */}
              <GlassButton
                type="button"
                onClick={() => {
                  startCheckout();
                  setShowCart(false);
                }}
                disabled={currentCart.length === 0 || loading}
                size="default"
                className="w-full glass-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                contentClassName="w-full flex items-center justify-center gap-2"
              >
                <Receipt className="h-4 w-4 shrink-0" />
                <span>{loading ? 'Completing...' : 'Complete order'}</span>
              </GlassButton>
          </Sheet>
      )}
    </>
  );
};

export default OrderPage; 
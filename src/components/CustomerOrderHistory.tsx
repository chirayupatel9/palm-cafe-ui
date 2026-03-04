import React, { useState, useEffect } from 'react';
import { Clock, Package, CheckCircle, XCircle, Receipt, Star, Plus, Download } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';

interface OrderItem {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CustomerOrder {
  id: number;
  order_number: number;
  status: string;
  created_at: string;
  final_amount: number;
  items: OrderItem[];
  customer_name?: string;
  customer_phone?: string;
  payment_method?: string;
  tax_amount?: number;
  tip_amount?: number;
  points_redeemed?: number;
}

interface CustomerInfo {
  name?: string;
  loyalty_points?: number;
  [key: string]: unknown;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  [key: string]: unknown;
}

interface CustomerOrderHistoryProps {
  customerPhone?: string | null;
  cafeSlug?: string;
  setActiveTab?: (tab: string) => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

const CustomerOrderHistory: React.FC<CustomerOrderHistoryProps> = ({
  customerPhone,
  cafeSlug,
  setActiveTab,
  cart,
  setCart
}) => {
  const { formatCurrency } = useCurrency();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [downloadingInvoices, setDownloadingInvoices] = useState<Set<number>>(new Set());
  const [ordersWithInvoices, setOrdersWithInvoices] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    if (!customerPhone) {
      setLoading(false);
      setOrders([]);
      return;
    }
    fetchOrderHistory();
    fetchCustomerInfo();
  }, [customerPhone, cafeSlug]);

  useEffect(() => {
    if (orders.length > 0) {
      checkInvoicesAvailability();
    }
  }, [orders]);

  const fetchOrderHistory = async () => {
    const phone =
      customerPhone && String(customerPhone).trim() !== '' && String(customerPhone) !== 'undefined'
        ? customerPhone
        : null;
    if (!phone) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams({ customer_phone: phone });
      if (cafeSlug) params.set('cafeSlug', cafeSlug);
      const response = await axios.get(`/customer/orders?${params.toString()}`);
      const data = response.data;
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast.error('Failed to load order history');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerInfo = async () => {
    try {
      const payload: { phone: string; cafeSlug?: string } = { phone: customerPhone! };
      if (cafeSlug) payload.cafeSlug = cafeSlug;
      const response = await axios.post('/customer/lookup', payload);
      if (response.data) {
        setCustomerInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching customer info:', error);
    }
  };

  const checkInvoicesAvailability = async () => {
    try {
      const allInvoicesResponse = await axios.get('/invoices');
      const allInvoices = allInvoicesResponse.data as { order_number: number }[];
      const availableInvoices = new Set<number>();
      orders.forEach((order) => {
        const hasInvoice = allInvoices.some((inv) => inv.order_number === order.order_number);
        const canHaveInvoice = ['completed', 'ready', 'cancelled'].includes(order.status);
        if (hasInvoice || canHaveInvoice) {
          availableInvoices.add(order.order_number);
        }
      });
      setOrdersWithInvoices(availableInvoices);
    } catch (error) {
      console.error('Error checking invoices availability:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'preparing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-on-surface-variant" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-on-surface-variant" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculatePointsEarned = (orderAmount: number) => Math.floor(orderAmount / 10);

  const downloadInvoice = async (orderNumber: number) => {
    try {
      setDownloadingInvoices((prev) => new Set(prev).add(orderNumber));
      let invoiceNumber: string | null = null;
      try {
        const invoiceResponse = await axios.get(`/invoices/order/${orderNumber}`);
        const invoice = invoiceResponse.data;
        invoiceNumber = invoice?.invoice_number ?? null;
      } catch {
        // try alternative below
      }
      if (!invoiceNumber) {
        try {
          const allInvoicesResponse = await axios.get('/invoices');
          const allInvoices = allInvoicesResponse.data as { order_number: number; invoice_number?: string }[];
          const matchingInvoice = allInvoices.find((inv) => inv.order_number === orderNumber);
          invoiceNumber = matchingInvoice?.invoice_number ?? null;
        } catch {
          // ignore
        }
      }
      if (!invoiceNumber) {
        const order = orders.find((o) => o.order_number === orderNumber);
        if (order && ['completed', 'ready', 'cancelled'].includes(order.status)) {
          try {
            toast.loading('Generating invoice...');
            const generateResponse = await axios.post('/invoices', {
              order_number: orderNumber,
              customer_name: order.customer_name || customerInfo?.name,
              customer_phone: order.customer_phone || customerPhone,
              payment_method: order.payment_method,
              items: order.items,
              total_amount: order.final_amount,
              tax_amount: order.tax_amount || 0,
              tip_amount: order.tip_amount || 0,
              points_redeemed: order.points_redeemed || 0,
              date: new Date().toISOString()
            });
            if (generateResponse.data?.invoiceNumber) {
              invoiceNumber = generateResponse.data.invoiceNumber;
              toast.dismiss();
              toast.success('Invoice generated successfully!');
            } else {
              toast.dismiss();
              toast.error('Failed to generate invoice. Please contact support.');
              return;
            }
          } catch (generateError) {
            toast.dismiss();
            console.error('Error generating invoice:', generateError);
            toast.error('Failed to generate invoice. Please contact support.');
            return;
          }
        } else {
          toast.error('No invoice found for this order. Invoices are generated when orders are completed.');
          return;
        }
      }
      const response = await axios.get(`/invoices/${invoiceNumber}/download`);
      const pdfBlob = new Blob(
        [Uint8Array.from(atob(response.data.pdf), (c) => c.charCodeAt(0))],
        { type: 'application/pdf' }
      );
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      toast.success('Invoice downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      if (error.response?.status === 404) {
        toast.error('No invoice found for this order');
      } else {
        toast.error('Failed to download invoice');
      }
    } finally {
      setDownloadingInvoices((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderNumber);
        return newSet;
      });
    }
  };

  const MAX_ITEM_QUANTITY = 10;

  const addOrderToCart = (order: CustomerOrder) => {
    try {
      order.items.forEach((item) => {
        const cartItem: CartItem = {
          id: item.menu_item_id,
          name: item.name,
          price: item.price,
          quantity: Math.min(MAX_ITEM_QUANTITY, item.quantity)
        };
        const existingItemIndex = cart.findIndex((c) => c.id === item.menu_item_id);
        if (existingItemIndex !== -1) {
          const updatedCart = [...cart];
          updatedCart[existingItemIndex].quantity = Math.min(
            MAX_ITEM_QUANTITY,
            updatedCart[existingItemIndex].quantity + item.quantity
          );
          setCart(updatedCart);
        } else {
          setCart((prevCart) => [...prevCart, cartItem]);
        }
      });
      toast.success(`Items from Order #${order.order_number} added to cart!`);
      setActiveTab?.('menu');
    } catch (error) {
      console.error('Error adding order to cart:', error);
      toast.error('Failed to add order to cart');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
        <span className="ml-2 text-on-surface-variant">Loading order history...</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Receipt className="h-12 w-12 text-on-surface-variant mx-auto mb-4" />
        <h3 className="text-lg font-medium text-on-surface mb-2">No Orders Yet</h3>
        <p className="text-on-surface-variant">Start ordering to see your order history here.</p>
      </div>
    );
  }

  const filteredOrders =
    filterStatus === 'All' ? orders : orders.filter((o) => o.status === filterStatus.toLowerCase());

  return (
    <div className="container mx-auto flex flex-1 flex-col px-4 py-8 sm:py-12 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-4xl font-black tracking-tighter text-text-light dark:text-text-dark">
          My Orders
        </h1>
        <p className="mt-2 text-base text-text-light/60 dark:text-text-dark/60">
          View your past orders and easily re-order your favorites.
        </p>
      </div>

      {customerInfo && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Star className="h-5 w-5 text-text-light/60 dark:text-text-dark/60" />
            <div>
              <h3 className="text-base font-semibold text-text-light dark:text-text-dark">Loyalty Points</h3>
              <p className="text-sm text-text-light/70 dark:text-text-dark/70">
                Total points earned from all orders
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-text-light dark:text-text-dark">
              {customerInfo.loyalty_points ?? 0}
            </div>
            <div className="text-sm text-text-light/70 dark:text-text-dark/70">points</div>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
        {['All', 'Completed', 'Preparing', 'Pending', 'Cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`flex h-9 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-4 transition-colors ${
              filterStatus === status
                ? 'font-semibold text-text-light dark:text-text-dark'
                : 'text-text-light/70 dark:text-text-dark/70 hover:text-text-light dark:hover:text-text-dark'
            }`}
          >
            <p className="text-sm">{status}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="flex flex-col sm:flex-row items-stretch justify-between gap-4 py-4 border-b border-[#E0E0E0] last:border-b-0"
          >
            <div className="flex flex-[2_2_0px] flex-col gap-4 justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                    {formatDate(order.created_at)} - #{order.order_number}
                  </p>
                  {ordersWithInvoices.has(order.order_number) && (
                    <Receipt className="h-4 w-4 text-green-500" aria-label="Invoice available" />
                  )}
                </div>
                <p className="text-base font-bold text-text-light dark:text-text-dark">
                  {order.items &&
                    order.items
                      .slice(0, 3)
                      .map((item) => `${item.quantity}x ${item.name}`)
                      .join(', ')}
                  {order.items && order.items.length > 3 && '...'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-text-light/60 dark:text-text-dark/60">Status:</p>
                  <span className="text-sm font-medium text-text-light dark:text-text-dark">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <p className="text-lg font-bold text-text-light dark:text-text-dark mt-2">
                  {formatCurrency(order.final_amount)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addOrderToCart(order)}
                  className="flex w-fit cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-9 px-4 text-sm font-medium text-text-light dark:text-text-dark hover:bg-black/5 transition-colors"
                  title="Re-order"
                >
                  <Plus className="h-4 w-4" />
                  <span className="truncate">Re-order</span>
                </button>
                <button
                  onClick={() => downloadInvoice(order.order_number)}
                  disabled={
                    downloadingInvoices.has(order.order_number) ||
                    !['completed', 'ready', 'cancelled'].includes(order.status)
                  }
                  className={`flex w-fit cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-9 px-4 text-sm font-medium transition-colors ${
                    downloadingInvoices.has(order.order_number)
                      ? 'text-text-light/50 dark:text-text-dark/50 cursor-not-allowed'
                      : ordersWithInvoices.has(order.order_number) ||
                          ['completed', 'ready', 'cancelled'].includes(order.status)
                        ? 'text-primary hover:bg-black/5'
                        : 'text-text-light/50 dark:text-text-dark/50 cursor-not-allowed'
                  }`}
                  title={
                    downloadingInvoices.has(order.order_number)
                      ? 'Downloading...'
                      : ordersWithInvoices.has(order.order_number)
                        ? 'Download Invoice'
                        : ['completed', 'ready', 'cancelled'].includes(order.status)
                          ? 'Generate Invoice'
                          : 'No invoice for pending orders'
                  }
                >
                  {downloadingInvoices.has(order.order_number) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span className="truncate">Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span className="truncate">Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length > 0 && (
        <div className="flex items-center justify-between py-4 border-b border-[#E0E0E0]">
          <div className="flex items-center space-x-3">
            <Star className="h-5 w-5 text-text-light/60 dark:text-text-dark/60" />
            <div>
              <h3 className="font-semibold text-text-light dark:text-text-dark">Current Points Balance</h3>
              <p className="text-sm text-text-light/70 dark:text-text-dark/70">Available for redemption</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-text-light dark:text-text-dark">
              {customerInfo?.loyalty_points ?? 0}
            </div>
            <div className="text-sm text-text-light/70 dark:text-text-dark/70">points available</div>
          </div>
        </div>
      )}

      {orders.length > 0 && (
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <Star className="h-5 w-5 text-text-light/60 dark:text-text-dark/60" />
            <div>
              <h3 className="font-medium text-text-light dark:text-text-dark">Total Points Earned</h3>
              <p className="text-sm text-text-light/70 dark:text-text-dark/70">
                From {orders.length} order{orders.length !== 1 ? 's' : ''} (including redeemed)
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-text-light dark:text-text-dark">
              {orders.reduce((total, order) => total + calculatePointsEarned(order.final_amount), 0)}
            </div>
            <div className="text-sm text-text-light/70 dark:text-text-dark/70">points earned</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderHistory;

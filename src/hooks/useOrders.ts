import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import useWebSocket from './useWebSocket';

export interface Order {
  id: number;
  status?: string;
  [key: string]: any;
}

export interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  lastFetchTime: Date | null;
  isConnected: boolean;
  fetchOrders: () => Promise<void>;
  updateOrderInCache: (orderId: number, updates: Partial<Order>) => void;
  addOrderToCache: (newOrder: Order) => void;
  removeOrderFromCache: (orderId: number) => void;
  sendMessage: (message: unknown) => void;
}

const useOrders = (
  autoRefresh = true,
  refreshInterval = 30000,
  enableWebSocket = false
): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const wsUrl = (() => {
    if (!enableWebSocket) return null;
    const token = localStorage.getItem('token');
    const base =
      (process.env.REACT_APP_WS_URL ||
        (process.env.REACT_APP_API_URL?.replace(/^http/, 'ws')) ||
        'ws://localhost:5000') + '/ws/orders';
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  })();

  const { sendMessage, isConnected } = useWebSocket(wsUrl, {
    onMessage: (data: unknown) => {
      const d = data as { type?: string; order?: Order; orderId?: number };
      switch (d.type) {
        case 'order_created':
          if (d.order) addOrderToCache(d.order);
          toast.success('New order received!');
          break;
        case 'order_updated':
          if (d.order) updateOrderInCache(d.order.id, d.order);
          break;
        case 'order_deleted':
          if (d.orderId != null) removeOrderFromCache(d.orderId);
          break;
        default:
          break;
      }
    },
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('WebSocket error:', error);
      }
    }
  });

  const updateOrderInCache = useCallback((orderId: number, updates: Partial<Order>) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === orderId ? { ...order, ...updates } : order))
    );
  }, []);

  const addOrderToCache = useCallback((newOrder: Order) => {
    setOrders((prevOrders) => {
      if (prevOrders.some((order) => order.id === newOrder.id)) return prevOrders;
      return [newOrder, ...prevOrders];
    });
  }, []);

  const removeOrderFromCache = useCallback((orderId: number) => {
    setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
  }, []);

  const fetchOrders = useCallback(
    async (forceRefresh = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      try {
        setLoading(true);
        const headers: Record<string, string> = {};
        if (lastModified && !forceRefresh) {
          headers['If-Modified-Since'] = lastModified;
        }
        const response = await axios.get<Order[]>('/orders', {
          headers,
          signal: abortControllerRef.current.signal
        });
        if (response.status === 304) return;
        const responseLastModified = response.headers['last-modified'];
        if (responseLastModified) {
          setLastModified(responseLastModified);
        }
        const newOrders = (response.data as Order[]).filter(
          (newOrder) =>
            newOrder.status === 'pending' &&
            !orders.some((oldOrder) => oldOrder.id === newOrder.id)
        );
        if (newOrders.length > 0) {
          toast.success(`${newOrders.length} new order(s) received!`);
        }
        setOrders(response.data);
        setLastFetchTime(new Date());
      } catch (error) {
        const err = error as { name?: string; response?: { status?: number } };
        if (err.name === 'AbortError') return;
        if (err.response?.status === 304) return;
        console.error('Error fetching orders:', error);
        if (!abortControllerRef.current?.signal.aborted) {
          toast.error('Failed to load orders');
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [orders, lastModified]
  );

  const refreshOrders = useCallback(async () => {
    await fetchOrders(true);
  }, [fetchOrders]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchOrders(false);
      }, refreshInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchOrders]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    orders,
    loading,
    lastFetchTime,
    isConnected,
    fetchOrders: refreshOrders,
    updateOrderInCache,
    addOrderToCache,
    removeOrderFromCache,
    sendMessage
  };
};

export default useOrders;

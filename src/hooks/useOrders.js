import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import useWebSocket from './useWebSocket';

const useOrders = (autoRefresh = true, refreshInterval = 30000, enableWebSocket = false) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [lastModified, setLastModified] = useState(null);
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // WebSocket connection for real-time updates
  const { sendMessage, isConnected } = useWebSocket(
    enableWebSocket ? `ws://localhost:5000/ws/orders` : null,
    {
      onMessage: (data) => {
        console.log('WebSocket order update received:', data);
        handleWebSocketMessage(data);
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
      }
    }
  );

  // Update a specific order in the cache
  const updateOrderInCache = useCallback((orderId, updates) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      )
    );
  }, []);

  // Add a new order to the cache
  const addOrderToCache = useCallback((newOrder) => {
    setOrders(prevOrders => {
      // Check if order already exists
      if (prevOrders.some(order => order.id === newOrder.id)) {
        return prevOrders;
      }
      return [newOrder, ...prevOrders];
    });
  }, []);

  // Remove an order from the cache
  const removeOrderFromCache = useCallback((orderId) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'order_created':
        addOrderToCache(data.order);
        toast.success('New order received!');
        break;
      case 'order_updated':
        updateOrderInCache(data.order.id, data.order);
        break;
      case 'order_deleted':
        removeOrderFromCache(data.orderId);
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, [addOrderToCache, updateOrderInCache, removeOrderFromCache]);

  // Fetch orders with conditional updates
  const fetchOrders = useCallback(async (forceRefresh = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      
      // Add conditional headers for caching
      const headers = {};
      if (lastModified && !forceRefresh) {
        headers['If-Modified-Since'] = lastModified;
      }

      const response = await axios.get('/orders', {
        headers,
        signal: abortControllerRef.current.signal
      });

      // Check if we got a 304 (Not Modified) response
      if (response.status === 304) {
        console.log('Orders not modified, using cached data');
        return;
      }

      // Update last modified time
      const responseLastModified = response.headers['last-modified'];
      if (responseLastModified) {
        setLastModified(responseLastModified);
      }

      // Check for new pending orders
      const newOrders = response.data.filter(newOrder => 
        newOrder.status === 'pending' && 
        !orders.some(oldOrder => oldOrder.id === newOrder.id)
      );
      
      if (newOrders.length > 0) {
        toast.success(`${newOrders.length} new order(s) received!`);
      }
      
      setOrders(response.data);
      setLastFetchTime(new Date());
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      if (error.response?.status === 304) {
        console.log('Orders not modified, using cached data');
        return;
      }
      
      console.error('Error fetching orders:', error);
      if (!abortControllerRef.current?.signal.aborted) {
        toast.error('Failed to load orders');
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [orders, lastModified]);

  // Force refresh orders (bypass cache)
  const refreshOrders = useCallback(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchOrders(false); // Don't force refresh for auto-refresh
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchOrders]);

  // Cleanup on unmount
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

import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const useWebSocket = (url, options = {}) => {
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = options.maxReconnectAttempts || 5;
  const reconnectInterval = options.reconnectInterval || 3000;
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    // Don't connect if no URL provided
    if (!url) {
      return;
    }

    // Don't connect if already connected or connecting
    if (ws.current?.readyState === WebSocket.OPEN || isConnectingRef.current) {
      return;
    }

    // Don't connect if URL is invalid
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      console.warn('Invalid WebSocket URL:', url);
      return;
    }

    try {
      isConnectingRef.current = true;
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        isConnectingRef.current = false;
        reconnectAttempts.current = 0;
        if (options.onOpen) {
          options.onOpen();
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (options.onMessage) {
            options.onMessage(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        isConnectingRef.current = false;
        if (options.onClose) {
          options.onClose(event);
        }

        // Attempt to reconnect if not a normal closure and URL is still valid
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts && url) {
          reconnectAttempts.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (url) {
              connect();
            }
          }, reconnectInterval);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.warn('WebSocket: Max reconnection attempts reached');
        }
      };

      ws.current.onerror = (error) => {
        isConnectingRef.current = false;
        // Only log errors in development to reduce noise
        if (process.env.NODE_ENV === 'development') {
          console.error('WebSocket error:', error);
        }
        if (options.onError) {
          options.onError(error);
        }
      };

    } catch (error) {
      isConnectingRef.current = false;
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating WebSocket connection:', error);
      }
    }
  }, [url, options, maxReconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Component unmounting');
      ws.current = null;
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    // Only connect if URL is provided
    if (url) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [url, connect, disconnect]);

  return {
    sendMessage,
    connect,
    disconnect,
    isConnected: ws.current?.readyState === WebSocket.OPEN
  };
};

export default useWebSocket;

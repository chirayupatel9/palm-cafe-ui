import { useEffect, useRef, useCallback } from 'react';

export interface UseWebSocketOptions {
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: () => void;
  onMessage?: (data: unknown) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
}

export interface UseWebSocketReturn {
  sendMessage: (message: unknown) => void;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
}

const useWebSocket = (url: string | null, options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
  const reconnectInterval = options.reconnectInterval ?? 3000;
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    if (!url) return;
    if (ws.current?.readyState === WebSocket.OPEN || isConnectingRef.current) return;
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
        options.onOpen?.();
      };
      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string);
          options.onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      ws.current.onclose = (event: CloseEvent) => {
        isConnectingRef.current = false;
        options.onClose?.(event);
        if (event.code === 4001 || event.code === 1008) {
          console.warn('WebSocket: Token invalid or unauthorised (code', event.code, '). Redirecting to login.');
          window.location.href = '/login';
          return;
        }
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts && url) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (url) connect();
          }, reconnectInterval);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.warn('WebSocket: Max reconnection attempts reached');
        }
      };
      ws.current.onerror = (error: Event) => {
        isConnectingRef.current = false;
        if (process.env.NODE_ENV === 'development') {
          console.error('WebSocket error:', error);
        }
        options.onError?.(error);
      };
    } catch (error) {
      isConnectingRef.current = false;
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating WebSocket connection:', error);
      }
    }
  }, [url, options.onOpen, options.onMessage, options.onClose, options.onError, maxReconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (ws.current) {
      ws.current.close(1000, 'Component unmounting');
      ws.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    if (url) connect();
    return () => disconnect();
  }, [url, connect, disconnect]);

  return {
    sendMessage,
    connect,
    disconnect,
    isConnected: ws.current?.readyState === WebSocket.OPEN
  };
};

export default useWebSocket;

import { useState, useCallback, useRef, useEffect } from 'react';

export interface WebSocketRow {
  type: 'row' | 'progress' | 'completed' | 'error' | 'connected' | 'pong';
  datasetId?: string;
  rowIndex?: number;
  cleanedRow?: Record<string, any>;
  confidence?: number;
  progress?: number;
  processedRows?: number;
  totalRows?: number;
  failedRows?: number;
  message?: string;
  error?: string;
  timestamp?: number;
}

export interface UseDatasetWebSocketOptions {
  datasetId: string;
  tenantId?: string;
  onRowReceived?: (row: WebSocketRow) => void;
  onProgressUpdate?: (progress: number, processed: number, total: number, failed: number) => void;
  onCompleted?: (stats: { processed: number; failed: number; total: number }) => void;
  onError?: (error: string) => void;
  autoConnect?: boolean;
}

export const useDatasetWebSocket = (options: UseDatasetWebSocketOptions) => {
  const {
    datasetId,
    tenantId = 'default-tenant',
    onRowReceived,
    onProgressUpdate,
    onCompleted,
    onError,
    autoConnect = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketRow | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    if (isConnecting) {
      console.log('Connection already in progress');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const path = `/ws/dataset/${datasetId}?tenantId=${encodeURIComponent(tenantId)}`;
      const wsUrl = `${protocol}//${host}${path}`;

      console.log('Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        reconnectAttempts.current = 0;

        // Send initial ping to verify connection
        const initialMsg: WebSocketRow = {
          type: 'ping',
          datasetId,
          timestamp: Date.now()
        };
        ws.send(JSON.stringify(initialMsg));

        // Set up periodic ping to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', datasetId, timestamp: Date.now() }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketRow = JSON.parse(event.data);
          setLastMessage(message);

          console.log('WebSocket message received:', message.type, message);

          switch (message.type) {
            case 'row':
              onRowReceived?.(message);
              break;
            case 'progress':
              onProgressUpdate?.(
                message.progress || 0,
                message.processedRows || 0,
                message.totalRows || 0,
                message.failedRows || 0
              );
              break;
            case 'completed':
              onCompleted?.({
                processed: message.processedRows || 0,
                failed: message.failedRows || 0,
                total: message.totalRows || 0
              });
              break;
            case 'error':
              onError?.(message.error || 'Unknown error');
              break;
            case 'pong':
              console.debug('Received pong');
              break;
            default:
              console.debug('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          onError?.(`Failed to parse message: ${error}`);
        }
      };

      ws.onerror = (event) => {
        const errorMsg = 'WebSocket error occurred';
        console.error(errorMsg, event);
        setConnectionError(errorMsg);
        onError?.(errorMsg);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsConnecting(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Reconnecting in ${backoffMs}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, backoffMs);
        } else {
          const errorMsg = `Failed to connect after ${maxReconnectAttempts} attempts`;
          setConnectionError(errorMsg);
          onError?.(errorMsg);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error establishing WebSocket:', errorMsg);
      setConnectionError(errorMsg);
      setIsConnecting(false);
      onError?.(errorMsg);
    }
  }, [datasetId, tenantId, onRowReceived, onProgressUpdate, onCompleted, onError, isConnecting]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket');

    // Clear timers
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttempts.current = 0;
  }, []);

  const send = useCallback((message: WebSocketRow) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, datasetId]); // Removed connect from deps to avoid infinite loop

  return {
    isConnected,
    isConnecting,
    connectionError,
    lastMessage,
    connect,
    disconnect,
    send
  };
};

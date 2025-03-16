
import { useRef, useCallback, useEffect } from 'react';
import { WebSocketMessage, PingMessage } from '@/types/ws';
import { toast } from '@/components/ui/use-toast';

interface UseWebSocketProps {
  url: string;
  onMessage: (data: WebSocketMessage) => void;
  onOpen?: (event: Event) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
  pingInterval?: number;
  autoConnect?: boolean;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onError,
  onClose,
  pingInterval = 30000,
  autoConnect = true,
}: UseWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearPingInterval();
    
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [clearPingInterval]);

  const connect = useCallback(() => {
    disconnect();
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      
      ws.onopen = (event) => {
        console.log('WebSocket connection established:', url);
        
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              const pingMessage: PingMessage = { 
                type: "ping", 
                timestamp: Date.now() 
              };
              ws.send(JSON.stringify(pingMessage));
              console.log('Ping sent');
            } catch (pingError) {
              console.error('Error sending ping:', pingError);
            }
          } else {
            clearPingInterval();
          }
        }, pingInterval);
        
        if (onOpen) onOpen(event);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'pong') {
            console.log('Received pong response at:', new Date().toISOString());
            return;
          }
          
          onMessage(data);
        } catch (parseError) {
          console.error('Error parsing WebSocket message:', parseError, 'Raw data:', event.data);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error details:', error);
        console.error('WebSocket connection URL:', url);
        console.error('WebSocket state:', ws.readyState);
        
        if (onError) onError(error);
        else {
          toast({
            title: "Connection Error",
            description: "Failed to establish WebSocket connection",
            variant: "destructive",
          });
        }
      };
      
      ws.onclose = (closeEvent) => {
        console.log('WebSocket connection closed:', closeEvent.code, closeEvent.reason, 'For URL:', url);
        clearPingInterval();
        
        if (onClose) onClose(closeEvent);
      };
      
      return ws;
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      clearPingInterval();
      
      if (onError) onError(error as Event);
      
      return null;
    }
  }, [url, onMessage, onOpen, onError, onClose, pingInterval, disconnect, clearPingInterval]);

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [url, autoConnect, connect, disconnect]);

  return {
    send,
    connect,
    disconnect,
    wsRef,
  };
}

// src/hooks/useWebSocket.js
import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Custom hook to manage WebSocket connections
 * This connects to your FastAPI backend and listens for real-time updates
 */
export const useWebSocket = (url) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    // Create WebSocket connection
    const websocket = new WebSocket(url);
    wsRef.current = websocket;

    // When connection opens
    websocket.onopen = () => {
      console.log('WebSocket connected to:', url);
      setIsConnected(true);
    };

    // When we receive a message from the server
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
        setMessages(prev => [...prev, data]);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    // If there's an error
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    // When connection closes
    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    // Cleanup: close connection when component unmounts
    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [url]);

  // Function to send messages to the server
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  return { messages, sendMessage, isConnected };
};
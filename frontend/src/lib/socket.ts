'use client';

import { create } from 'zustand';

// Default to localhost during development
// In production, this would be your backend URL
const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8080';

// Define a custom type for our WebSocket wrapper
export interface CustomWebSocket extends WebSocket {
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
  disconnect: () => void;
  io: {
    on: (event: string, callback: (data: any) => void) => void;
  };
}

// Create event handlers storage
interface EventHandlers {
  [event: string]: Array<(data: any) => void>;
}

// Create a singleton WebSocket instance
let socket: CustomWebSocket | null = null;
const eventHandlers: EventHandlers = {};

export const initializeSocket = (): CustomWebSocket => {
  if (!socket) {
    console.log(`Connecting to WebSocket server at ${SOCKET_URL}/ws`);
    
    // Create native WebSocket connection
    const ws = new WebSocket(`${SOCKET_URL.replace(/^http/, 'ws')}/ws`);
    
    // Add custom methods to make it compatible with Socket.IO interface
    const customWs = ws as CustomWebSocket;
    
    customWs.emit = (event: string, data: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        // For our simple implementation, just send the data as a JSON string
        ws.send(JSON.stringify(data));
      } else {
        console.error('WebSocket is not connected. Cannot send message.');
      }
    };
    
    customWs.on = (event: string, callback: (data: any) => void) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(callback);
    };
    
    customWs.off = (event: string) => {
      delete eventHandlers[event];
    };
    
    customWs.disconnect = () => {
      ws.close();
    };
    
    // Add io property to match Socket.IO interface
    customWs.io = {
      on: (event: string, callback: (data: any) => void) => {
        if (event === 'error') {
          ws.onerror = (error) => callback(error);
        } else if (event === 'reconnect_attempt') {
          // We can't really implement this for native WebSockets
          console.log('reconnect_attempt not implemented for native WebSockets');
        } else if (event === 'reconnect') {
          // We can't really implement this for native WebSockets
          console.log('reconnect not implemented for native WebSockets');
        } else if (event === 'reconnect_failed') {
          // We can't really implement this for native WebSockets
          console.log('reconnect_failed not implemented for native WebSockets');
        }
      }
    };
    
    // Standard WebSocket event listeners
    ws.onopen = () => {
      console.log('WebSocket connected successfully');
      if (eventHandlers['connect']) {
        eventHandlers['connect'].forEach(cb => cb({}));
      }
      useChatStore.getState().setConnected(true);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      useChatStore.getState().setConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (eventHandlers['connect_error']) {
        eventHandlers['connect_error'].forEach(cb => cb(error));
      }
    };
    
    ws.onmessage = (event) => {
      try {
        // Check if message is "Both connected"
        if (event.data === "Both connected") {
          console.log('Both users are now connected');
          useChatStore.getState().setWaitingForOther(false);
          return;
        }
        
        // For other messages, treat them as chat messages from the other user
        const sender = useChatStore.getState().userType === 'doctor' ? 'patient' : 'doctor';
        useChatStore.getState().addMessage({ text: event.data, sender });
        
        // Trigger any message event handlers
        if (eventHandlers['message']) {
          eventHandlers['message'].forEach(cb => cb({ 
            text: event.data, 
            sender 
          }));
        }
      } catch (e) {
        console.error('Error processing WebSocket message:', e);
      }
    };
    
    socket = customWs;
  }
  
  return socket;
};

// Store to manage socket state and messages
interface ChatMessage {
  text: string;
  sender: 'doctor' | 'patient';
  timestamp: Date;
}

interface ChatState {
  connected: boolean;
  messages: ChatMessage[];
  waitingForOther: boolean;
  splatStatus: 'unavailable' | 'processing' | 'done';
  userType: 'doctor' | 'patient';
  addMessage: (message: Omit<ChatMessage, 'timestamp'>) => void;
  setConnected: (status: boolean) => void;
  setWaitingForOther: (status: boolean) => void;
  setSplatStatus: (status: 'unavailable' | 'processing' | 'done') => void;
  setUserType: (type: 'doctor' | 'patient') => void;
}

export const useChatStore = create<ChatState>((set) => ({
  connected: false,
  messages: [],
  waitingForOther: true,
  splatStatus: 'unavailable',
  userType: 'patient', // default value
  addMessage: (message: Omit<ChatMessage, 'timestamp'>) => 
    set((state: ChatState) => ({ 
      messages: [...state.messages, { ...message, timestamp: new Date() }] 
    })),
  setConnected: (status: boolean) => 
    set(() => ({ connected: status })),
  setWaitingForOther: (status: boolean) => 
    set(() => ({ waitingForOther: status })),
  setSplatStatus: (status: 'unavailable' | 'processing' | 'done') => 
    set(() => ({ splatStatus: status })),
  setUserType: (type: 'doctor' | 'patient') => 
    set(() => ({ userType: type }))
}));

export const getSocket = (): CustomWebSocket => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
}; 
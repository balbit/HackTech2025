import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';

// Default to localhost during development
// In production, this would be your backend URL
const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8080';

// Create a singleton socket instance
let socket: Socket;

export const initializeSocket = (): Socket => {
  if (!socket) {
    console.log(`Connecting to Socket.IO server at ${SOCKET_URL}`);
    
    socket = io(SOCKET_URL, {
      reconnectionAttempts: 10,        // Increase reconnection attempts
      reconnectionDelay: 2000,         // Longer delay between reconnection attempts
      reconnectionDelayMax: 10000,     // Max delay between reconnection attempts
      timeout: 20000,                  // Longer connection timeout
      autoConnect: true,
      transports: ['websocket', 'polling'],  // Try WebSocket first, then polling
      path: '/ws/socket.io',           // Path to Socket.IO endpoint on server
      forceNew: true,                  // Force a new connection
    });
    
    // Add event listeners for connection status
    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    socket.on('connection_established', (data) => {
      console.log('Server acknowledged connection:', data);
    });
    
    socket.io.on("error", (error) => {
      console.error('Socket.IO manager error:', error);
    });
    
    socket.io.on("reconnect_attempt", (attempt) => {
      console.log(`Socket.IO reconnection attempt ${attempt}`);
    });
    
    socket.io.on("reconnect", (attempt) => {
      console.log(`Socket.IO reconnected after ${attempt} attempts`);
    });
    
    socket.io.on("reconnect_failed", () => {
      console.error('Socket.IO reconnection failed after all attempts');
    });
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
  addMessage: (message: Omit<ChatMessage, 'timestamp'>) => void;
  setConnected: (status: boolean) => void;
  setWaitingForOther: (status: boolean) => void;
  setSplatStatus: (status: 'unavailable' | 'processing' | 'done') => void;
}

export const useChatStore = create<ChatState>((set) => ({
  connected: false,
  messages: [],
  waitingForOther: true,
  splatStatus: 'unavailable',
  addMessage: (message: Omit<ChatMessage, 'timestamp'>) => 
    set((state: ChatState) => ({ 
      messages: [...state.messages, { ...message, timestamp: new Date() }] 
    })),
  setConnected: (status: boolean) => 
    set(() => ({ connected: status })),
  setWaitingForOther: (status: boolean) => 
    set(() => ({ waitingForOther: status })),
  setSplatStatus: (status: 'unavailable' | 'processing' | 'done') => 
    set(() => ({ splatStatus: status }))
}));

export const getSocket = (): Socket => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
}; 
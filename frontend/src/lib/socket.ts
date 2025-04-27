import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';

// Default to localhost during development
// In production, this would be your backend URL
const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Create a singleton socket instance
let socket: Socket;

export const initializeSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
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
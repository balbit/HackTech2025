'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import ChatInterface from '@/components/ChatInterface';
import ThreeJSViewer from '@/components/ThreeJSViewer';
import { getSocket } from '@/lib/socket';
import { useChatStore } from '@/lib/socket';

// Constants for bandwidth calculation
const VIDEO_CALL_BANDWIDTH_RATE = 1.5; // 1.5 MB per minute for HD video
const TEXT_MESSAGE_SIZE = 1; // 1 KB per message
const BANDWIDTH_UPDATE_INTERVAL = 3000; // Update bandwidth display every 3 seconds

export default function PatientPage() {
  const [tab, setTab] = useState<'chat' | 'model'>('chat');
  const { splatStatus } = useChatStore();
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  
  // Bandwidth tracking states
  const [actualBandwidth, setActualBandwidth] = useState<number>(0); // in KB
  const [videoBandwidth, setVideoBandwidth] = useState<number>(0); // in KB
  const [sessionStartTime] = useState<number>(Date.now());
  
  // Use refs to avoid unnecessary re-renders during updates
  const actualBandwidthRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Memoized handlers to avoid recreating functions on each render
  const handleImageUpload = useCallback((imageSize: number) => {
    actualBandwidthRef.current += imageSize;
  }, []);
  
  const handleMessageSent = useCallback(() => {
    actualBandwidthRef.current += TEXT_MESSAGE_SIZE;
  }, []);
  
  // Set model URL when status becomes 'done'
  useEffect(() => {
    if (splatStatus === 'done') {
      // Generate a unique timestamp to avoid caching issues
      const timestamp = Date.now();
      setModelUrl(`/api/get-splat?t=${timestamp}`);
      
      // Switch to model tab automatically when it's ready on mobile
      if (window.innerWidth < 768) {
        setTab('model');
      }
    } else {
      setModelUrl(null);
    }
  }, [splatStatus]);
  
  // Combined bandwidth tracking effect
  useEffect(() => {
    // Initialize socket connection when component mounts
    const socket = getSocket();
    
    // Set up interval to update bandwidth calculations less frequently
    const bandwidthInterval = setInterval(() => {
      const now = Date.now();
      const timeDiffSeconds = (now - lastUpdateTimeRef.current) / 1000;
      lastUpdateTimeRef.current = now;
      
      // Calculate video bandwidth increment
      const videoIncrementKB = (VIDEO_CALL_BANDWIDTH_RATE * 1024 * timeDiffSeconds) / 60;
      
      // Update the video bandwidth state
      setVideoBandwidth(prev => prev + videoIncrementKB);
      
      // Update the actual bandwidth state from ref
      setActualBandwidth(actualBandwidthRef.current);
      
    }, BANDWIDTH_UPDATE_INTERVAL);
    
    return () => {
      socket.disconnect();
      clearInterval(bandwidthInterval);
    };
  }, []);
  
  // Format the bandwidth for display
  const formatBandwidth = (kilobytes: number): string => {
    if (kilobytes < 1024) {
      return `${kilobytes.toFixed(1)} KB`;
    } else if (kilobytes < 1024 * 1024) {
      return `${(kilobytes / 1024).toFixed(2)} MB`;
    } else {
      return `${(kilobytes / (1024 * 1024)).toFixed(2)} GB`;
    }
  };
  
  // Calculate session duration in minutes
  const getSessionDuration = (): number => {
    return (Date.now() - sessionStartTime) / (1000 * 60);
  };
  
  // Function to render the 3D model section - memoized to prevent rerenders
  const renderModelSection = useCallback(() => (
    <div className="flex-1 flex flex-col bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: "350px" }}>
      {modelUrl ? (
        <>
          <div className="flex-1">
            <ThreeJSViewer modelUrl={modelUrl} />
          </div>
          <div className="p-2 bg-gray-200 text-xs text-gray-600 flex justify-between items-center">
            <span>Drag to rotate • Scroll to zoom</span>
            <Link 
              href="/view-model" 
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              View Fullscreen
            </Link>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <p className="text-gray-500 mb-2">
              {splatStatus === 'processing' ? 'Processing 3D model...' : 'No 3D model available yet'}
            </p>
            {splatStatus === 'processing' && (
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            )}
          </div>
        </div>
      )}
    </div>
  ), [modelUrl, splatStatus]);
  
  // Function to render the bandwidth stats - memoized to prevent rerenders
  const renderBandwidthStats = useCallback(() => (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Bandwidth Usage</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-blue-50 p-2 rounded">
          <p className="text-blue-700 font-medium">This Session</p>
          <p className="text-blue-800 text-lg font-bold">{formatBandwidth(actualBandwidth)}</p>
          <p className="text-blue-600 text-xs">Session time: {getSessionDuration().toFixed(1)} min</p>
        </div>
        <div className="bg-red-50 p-2 rounded">
          <p className="text-red-700 font-medium">Equivalent Video Call</p>
          <p className="text-red-800 text-lg font-bold">{formatBandwidth(videoBandwidth)}</p>
          <p className="text-red-600 text-xs">You saved: {formatBandwidth(Math.max(0, videoBandwidth - actualBandwidth))}</p>
        </div>
      </div>
    </div>
  ), [actualBandwidth, videoBandwidth]);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-blue-600 text-2xl font-bold">
            TeleHealth
          </Link>
          <div className="bg-sky-100 text-sky-800 px-4 py-1 rounded-full text-sm font-medium">
            Patient View
          </div>
        </div>
      </header>
      
      {/* Bandwidth statistics display */}
      <div className="max-w-6xl mx-auto w-full px-4 pt-3">
        {renderBandwidthStats()}
      </div>
      
      {/* Mobile Tabs */}
      <div className="md:hidden flex border-b bg-white">
        <button
          onClick={() => setTab('chat')}
          className={`flex-1 py-3 text-center font-medium ${
            tab === 'chat'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setTab('model')}
          className={`flex-1 py-3 text-center font-medium ${
            tab === 'model'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          } ${splatStatus === 'done' ? 'text-green-600' : ''}`}
        >
          3D Model {splatStatus === 'done' && '✓'}
        </button>
      </div>
      
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 pt-3">
        {/* Mobile View */}
        <div className="block md:hidden h-[calc(100vh-200px)]">
          {tab === 'chat' ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
              <ChatInterface 
                userType="patient" 
                onMessageSent={handleMessageSent}
                onImageUpload={handleImageUpload}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-4 flex flex-col h-full">
              <h2 className="text-xl font-semibold mb-4">Your 3D Model</h2>
              {renderModelSection()}
            </div>
          )}
        </div>
        
        {/* Desktop View */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          <div className="md:col-span-2 bg-white rounded-lg shadow-md overflow-hidden h-[70vh]">
            <ChatInterface 
              userType="patient" 
              onMessageSent={handleMessageSent}
              onImageUpload={handleImageUpload}
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Your 3D Model</h2>
            {renderModelSection()}
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t mt-auto p-4 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} TeleHealth. All rights reserved.</p>
      </footer>
    </div>
  );
} 
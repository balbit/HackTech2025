'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import ChatInterface from '@/components/ChatInterface';
import ThreeJSViewer from '@/components/ThreeJSViewer';
import { getSocket } from '@/lib/socket';
import { useChatStore } from '@/lib/socket';

export default function DoctorPage() {
  const { splatStatus } = useChatStore();
  const [modelUrl, setModelUrl] = useState<string | null>(null);

  // Memoized effect to handle socket connection
  useEffect(() => {
    // Initialize socket connection when component mounts
    const socket = getSocket();
    
    // Clean up function to disconnect socket
    return () => {
      socket.disconnect();
    };
  }, []);

  // Memoized effect to update model URL
  useEffect(() => {
    if (splatStatus === 'done') {
      // Generate a unique timestamp to avoid caching issues
      const timestamp = Date.now();
      setModelUrl(`/api/get-splat?t=${timestamp}`);
    } else {
      setModelUrl(null);
    }
  }, [splatStatus]);
  
  // Memoized model section to prevent re-renders
  const renderModelSection = useCallback(() => {
    if (modelUrl) {
      return (
        <>
          <div className="flex-1">
            <ThreeJSViewer modelUrl={modelUrl} />
          </div>
          <div className="p-2 bg-gray-200 text-xs text-gray-600 flex justify-between">
            <span>Drag to rotate • Scroll to zoom</span>
            <a href={modelUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Original</a>
          </div>
        </>
      );
    } else {
      return (
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
      );
    }
  }, [modelUrl, splatStatus]);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-blue-600 text-2xl font-bold">
            TeleHealth
          </Link>
          <div className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-medium">
            Doctor View
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          <div className="md:col-span-2 bg-white rounded-lg shadow-md overflow-hidden h-[70vh]">
            <ChatInterface userType="doctor" />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Patient 3D Model</h2>
            <div className="flex-1 flex flex-col bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: "350px" }}>
              {renderModelSection()}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t mt-auto p-4 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} TeleHealth. All rights reserved.</p>
      </footer>
    </div>
  );
} 
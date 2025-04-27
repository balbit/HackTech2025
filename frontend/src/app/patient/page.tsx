'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import ChatInterface from '@/components/ChatInterface';
import ThreeJSViewer from '@/components/ThreeJSViewer';
import { initializeSocket } from '@/lib/socket';
import { useChatStore } from '@/lib/socket';

export default function PatientPage() {
  const [tab, setTab] = useState<'chat' | 'model'>('chat');
  const { splatStatus } = useChatStore();
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Initialize socket connection when component mounts
    const socket = initializeSocket();
    
    return () => {
      // Clean up socket connection when component unmounts
      socket.disconnect();
    };
  }, []);
  
  // Set model URL when status becomes 'done'
  useEffect(() => {
    if (splatStatus === 'done') {
      setModelUrl(`/api/get-splat?t=${Date.now()}`);
      // Switch to model tab automatically when it's ready on mobile
      if (window.innerWidth < 768) {
        setTab('model');
      }
    } else {
      setModelUrl(null);
    }
  }, [splatStatus]);
  
  // Function to render the 3D model section
  const renderModelSection = () => (
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
  );
  
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
      
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        {/* Mobile View */}
        <div className="block md:hidden h-[calc(100vh-160px)]">
          {tab === 'chat' ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
              <ChatInterface userType="patient" />
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
            <ChatInterface userType="patient" />
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
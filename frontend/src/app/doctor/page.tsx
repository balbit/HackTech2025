'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import ChatInterface from '@/components/ChatInterface';
import { initializeSocket } from '@/lib/socket';

export default function DoctorPage() {
  useEffect(() => {
    // Initialize socket connection when component mounts
    const socket = initializeSocket();
    
    return () => {
      // Clean up socket connection when component unmounts
      socket.disconnect();
    };
  }, []);
  
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
          
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Patient 3D Model</h2>
            <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg">
              <p className="text-gray-500">3D model will appear here when available</p>
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
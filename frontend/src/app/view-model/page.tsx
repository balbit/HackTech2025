'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ThreeJSViewer from '@/components/ThreeJSViewer';

export default function ViewModelPage() {
  const searchParams = useSearchParams();
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Generate URL with a cache-busting parameter to ensure fresh content
    const timestamp = Date.now();
    const url = `/api/get-splat?t=${timestamp}`;
    setModelUrl(url);

    // Check if the 3D model is available
    fetch('/api/get-splat')
      .then(async response => {
        if (!response.ok) {
          if (response.status === 404) {
            setError('3D model not available. Please try again later.');
          } else {
            setError('Error loading 3D model. Please try again later.');
          }
          setModelUrl(null);
        }
      })
      .catch(() => {
        setError('Error connecting to server. Please try again later.');
        setModelUrl(null);
      });
  }, []);

  // Detect if device is iOS for AR QuickLook support
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-blue-600 text-2xl font-bold">
            TeleHealth
          </Link>
          <div className="flex space-x-2">
            {isIOS && modelUrl && (
              <a
                href={modelUrl}
                className="px-4 py-2 bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200"
              >
                View in AR
              </a>
            )}
            <Link 
              href="/patient" 
              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
            >
              Back to Chat
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {error ? (
            <div className="bg-red-50 p-4 rounded-lg text-red-800 text-center">
              {error}
            </div>
          ) : !modelUrl ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-pulse">Loading model...</div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg shadow-md overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
              <ThreeJSViewer modelUrl={modelUrl} />
            </div>
          )}
          
          <div className="mt-4 bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-medium text-blue-800 mb-2">3D Model Viewer Controls</h2>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• Click and drag to rotate the model</li>
              <li>• Scroll to zoom in and out</li>
              <li>• Right-click and drag to pan</li>
              {isIOS && (
                <li>• Use the "View in AR" button to see the model in your environment</li>
              )}
            </ul>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-auto p-4 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} TeleHealth. All rights reserved.</p>
      </footer>
    </div>
  );
} 
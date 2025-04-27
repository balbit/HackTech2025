'use client';

import { useEffect } from 'react';
import { USDZLoader } from 'three-usdz-loader';

export default function TestLoaderPage() {
  useEffect(() => {
    try {
      // Try to instantiate the loader
      console.log('Attempting to create USDZLoader');
      const loader = new USDZLoader('/external/');
      console.log('USDZLoader created successfully:', loader);
    } catch (error) {
      console.error('Error creating USDZLoader:', error);
    }
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Testing USDZLoader</h1>
      <p>Check the console to see if the loader was initialized correctly.</p>
    </div>
  );
} 
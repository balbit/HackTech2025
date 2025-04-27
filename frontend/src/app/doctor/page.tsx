'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import ChatInterface from '@/components/ChatInterface';
import ThreeJSViewer, { ThreeJSViewerRef } from '@/components/ThreeJSViewer';
import { getSocket } from '@/lib/socket';
import { useChatStore } from '@/lib/socket';

// Interface for VLLM analysis response
interface AnalysisResponse {
  analysis: string;
  suggestedConditions?: string[];
  confidence?: number;
}

export default function DoctorPage() {
  const { splatStatus } = useChatStore();
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const threeJSViewerRef = useRef<ThreeJSViewerRef | null>(null);

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
  
  // Function to capture a screenshot of the current 3D view
  const captureModelView = useCallback(() => {
    console.log('Capturing model view, ref status:', !!threeJSViewerRef.current);
    
    if (!threeJSViewerRef.current) {
      toast.error('3D model not ready for capture');
      return;
    }
    
    try {
      const screenshot = threeJSViewerRef.current.captureScreenshot();
      
      if (screenshot) {
        setCapturedImage(screenshot);
        toast.success('View captured successfully!');
      } else {
        toast.error('Failed to capture model view');
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast.error('Error accessing 3D viewer');
    }
  }, []);
  
  // Function to analyze the captured image with a VLLM
  const analyzeImage = useCallback(async () => {
    if (!capturedImage) {
      toast.error('Please capture a view of the model first');
      return;
    }
    
    setIsAnalyzing(true);
    toast.loading('Analyzing model...');
    
    try {
      // Create a prompt for the VLLM
      const prompt = "Analyze this 3D medical model and describe what you see. Identify any potential abnormalities and suggest possible conditions to investigate.";
      
      // Call the VLLM API
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: capturedImage,
          prompt: prompt
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }
      
      const result = await response.json();
      setAnalysisResult(result);
      toast.dismiss();
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.dismiss();
      toast.error('Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  }, [capturedImage]);
  
  // Function to clear the current analysis
  const clearAnalysis = useCallback(() => {
    setCapturedImage(null);
    setAnalysisResult(null);
  }, []);
  
  // Memoized model section to prevent re-renders
  const renderModelSection = useCallback(() => {
    if (modelUrl) {
      return (
        <>
          <div className="flex-1">
            <ThreeJSViewer ref={threeJSViewerRef} modelUrl={modelUrl} />
          </div>
          <div className="p-2 bg-gray-200 text-xs text-gray-600 flex justify-between">
            <span>Drag to rotate • Scroll to zoom</span>
            
            <div className="flex gap-2">
              <button
                onClick={captureModelView}
                className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Capture View
              </button>
              <a 
                href={modelUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline"
              >
                View Original
              </a>
            </div>
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
  }, [modelUrl, splatStatus, captureModelView]);
  
  // Render the analysis panel
  const renderAnalysisPanel = useCallback(() => {
    if (!capturedImage) {
      return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
          <p>Capture a view of the 3D model to analyze it with AI</p>
        </div>
      );
    }
    
    return (
      <div className="mt-4 bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">Captured View</h3>
          <div className="bg-gray-50 rounded p-2 mb-3">
            <img 
              src={capturedImage} 
              alt="Captured model view" 
              className="w-full rounded"
              style={{ maxHeight: '200px', objectFit: 'contain' }}
            />
          </div>
          
          {!analysisResult ? (
            <button
              onClick={analyzeImage}
              disabled={isAnalyzing}
              className="w-full py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
            </button>
          ) : (
            <div className="bg-indigo-50 p-3 rounded-md">
              <h4 className="font-medium text-indigo-800 mb-2">AI Analysis</h4>
              <p className="text-sm text-gray-700 mb-3">{analysisResult.analysis}</p>
              
              {analysisResult.suggestedConditions && (
                <div className="mb-3">
                  <h5 className="text-xs font-medium text-indigo-700 mb-1">Possible Conditions:</h5>
                  <ul className="text-xs text-gray-700 list-disc pl-4">
                    {analysisResult.suggestedConditions.map((condition, index) => (
                      <li key={index}>{condition}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={clearAnalysis}
                  className="text-xs py-1 px-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Clear Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [capturedImage, analysisResult, isAnalyzing, analyzeImage, clearAnalysis]);
  
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
          
          <div className="flex flex-col space-y-4">
            <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
              <h2 className="text-xl font-semibold mb-4">Patient 3D Model</h2>
              <div className="flex-1 flex flex-col bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: "350px" }}>
                {renderModelSection()}
              </div>
            </div>
            
            {renderAnalysisPanel()}
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t mt-auto p-4 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} TeleHealth. All rights reserved.</p>
      </footer>
    </div>
  );
} 
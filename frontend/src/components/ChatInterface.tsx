'use client';

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import ChatMessage from './ChatMessage';
import TalkingAvatar from './TalkingAvatar';
import ThreeJSViewer from './ThreeJSViewer';
import { useChatStore, getSocket, CustomWebSocket } from '@/lib/socket';

// Add type declaration for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatInterfaceProps {
  userType: 'doctor' | 'patient';
  onMessageSent?: () => void;
  onImageUpload?: (sizeInKB: number) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  userType, 
  onMessageSent,
  onImageUpload 
}) => {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [lastReceivedMessage, setLastReceivedMessage] = useState<string>('');
  const [lastSpeaker, setLastSpeaker] = useState<'doctor' | 'patient' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const { 
    messages, 
    addMessage, 
    waitingForOther, 
    setWaitingForOther,
    splatStatus,
    setSplatStatus,
    setUserType
  } = useChatStore();
  const socketRef = useRef<CustomWebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);

  // Connect to socket and set up event listeners
  useEffect(() => {
    // Set user type in the store
    setUserType(userType);
    
    const socket = getSocket();
    socketRef.current = socket;

    // Listen for new messages
    socket.on('message', (data) => {
      const otherUserType = userType === 'doctor' ? 'patient' : 'doctor';
      
      // Only process messages that weren't sent by this user
      if (data.sender !== userType) {
        setLastReceivedMessage(data.text);
        setLastSpeaker(otherUserType);
      }
    });

    // Poll for splat status
    const checkSplatInterval = setInterval(() => {
      // Skip polling if we already have a model loaded
      if (modelUrl) {
        return;
      }
      
      fetch('/api/get-splat', {
        // Add cache control headers to prevent caching responses
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
        .then(async response => {
          // Check the content type to determine if we got the actual file or JSON
          const contentType = response.headers.get('content-type');
          
          if (response.ok && contentType && contentType.includes('model/vnd.usdz+zip')) {
            // We received the actual USDZ file - the model is ready
            setSplatStatus('done');
            if (splatStatus !== 'done') {
              toast.success('3D model is now available');
            }
            return null;
          } else if (response.status === 404) {
            // Splat not available
            if (splatStatus !== 'unavailable') {
              setSplatStatus('unavailable');
            }
            return null;
          } else {
            // It's JSON data with status information
            try {
              return await response.json();
            } catch (e) {
              console.error('Error parsing response:', e);
              return null;
            }
          }
        })
        .then(data => {
          if (data && data.status && data.status !== splatStatus) {
            setSplatStatus(data.status);
            if (data.status === 'done') {
              toast.success('3D model is now available');
            }
          }
        })
        .catch(error => console.error('Error checking splat status:', error));
    }, 5000); // Check less frequently - every 5 seconds

    return () => {
      clearInterval(checkSplatInterval);
    };
  }, [userType, setUserType, addMessage, setWaitingForOther, setSplatStatus, splatStatus, modelUrl]);

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Set model URL when status becomes 'done'
  useEffect(() => {
    if (splatStatus === 'done') {
      // Generate a unique timestamp to avoid caching issues
      const timestamp = Date.now();
      setModelUrl(`/api/get-splat?t=${timestamp}`);
    } else {
      setModelUrl(null);
    }
  }, [splatStatus]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          setIsListening(true);
          toast.success('Listening...');
        };
        
        recognition.onresult = (event: any) => {
          let interimText = '';
          let finalText = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalText += transcript + ' ';
            } else {
              interimText += transcript;
            }
          }
          
          if (finalText) {
            setMessage((prev: string) => prev + finalText);
            setInterimTranscript('');
          } else {
            setInterimTranscript(interimText);
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          if (event.error === 'not-allowed') {
            toast.error('Microphone access denied. Please allow microphone access.');
          } else {
            toast.error('Speech recognition error: ' + event.error);
          }
        };
        
        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
        };
        
        recognitionRef.current = recognition;
      } else {
        console.warn('Speech recognition not supported in this browser');
      }
    }
    
    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (socketRef.current) {
      // With our native WebSocket, we just send the message text directly
      socketRef.current.send(message);
      
      // Add message to our local state
      addMessage({ text: message, sender: userType });
      setMessage('');
      
      // Set last speaker to self
      setLastSpeaker(userType);
    }

    if (onMessageSent) {
      onMessageSent();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages(prevImages => [...prevImages, ...newImages]);
      toast.success(`${newImages.length} image(s) selected`);
    }
  };

  const handleUploadImages = async () => {
    if (images.length === 0) {
      toast.error('Please select images first');
      return;
    }

    // Calculate total image size in KB for bandwidth tracking
    const totalSizeInKB = images.reduce((total, img) => total + Math.round(img.size / 1024), 0);

    const formData = new FormData();
    images.forEach(img => formData.append('images', img));

    try {
      toast.loading('Uploading images...');
      const response = await fetch('/api/splat', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Images uploaded successfully');
        setImages([]);
        setSplatStatus('processing');
        
        // Track bandwidth usage if callback provided
        if (onImageUpload && userType === 'patient') {
          onImageUpload(totalSizeInKB);
        }
        
        // Inform the other user that images have been uploaded
        if (socketRef.current) {
          const uploadMessage = "I've uploaded images for 3D modeling";
          socketRef.current.send(uploadMessage);
          
          // Add message to local state
          addMessage({ 
            text: uploadMessage, 
            sender: userType 
          });
          
          // Set last speaker to self
          setLastSpeaker(userType);
          
          // Track message bandwidth if callback provided
          if (onMessageSent && userType === 'patient') {
            onMessageSent();
          }
        }
      } else {
        toast.error('Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Error uploading images');
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Determine the avatar user type (opposite of current user)
  const avatarUserType = userType === 'doctor' ? 'patient' : 'doctor';
  
  // Only show the avatar and messages from the other user
  const showAvatar = lastSpeaker !== null && lastSpeaker !== userType;
  const avatarMessage = showAvatar ? lastReceivedMessage : '';

  // Add a function to handle viewing the 3D model
  const viewModel = () => {
    // For patient, redirect to the full-screen viewer page
    window.location.href = '/view-model';
  };
  
  // Detect if the device is iOS for AR QuickLook support
  const isIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iPhone|iPad|iPod/.test(navigator.userAgent);
  };
  
  // Open model in AR QuickLook on iOS
  const viewInAR = () => {
    const timestamp = Date.now();
    const url = `/api/get-splat?t=${timestamp}`;
    window.location.href = url;
  };

  return (
    <div className="flex flex-col h-full p-4">
      {waitingForOther ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl text-gray-500">
            Waiting for {userType === 'doctor' ? 'patient' : 'doctor'} to join...
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Chat with {userType === 'doctor' ? 'Patient' : 'Doctor'}
            </h2>
            <div className="flex items-center gap-2">
              <div className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                {splatStatus === 'unavailable' && 'No 3D model available'}
                {splatStatus === 'processing' && 'Processing 3D model...'}
                {splatStatus === 'done' && '3D model ready'}
              </div>
              {splatStatus === 'done' && (
                <>
                  <button 
                    onClick={viewModel}
                    className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200"
                  >
                    View 3D Model
                  </button>
                  {isIOS() && (
                    <button 
                      onClick={viewInAR}
                      className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full hover:bg-purple-200"
                    >
                      View in AR
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Talking Avatar */}
          <div className="mb-4 bg-gray-50 rounded-lg p-4">
            <div className="flex flex-col items-center">
              {showAvatar ? (
                <>
                  <p className="text-sm text-gray-500 mb-2">
                    {lastSpeaker === 'doctor' ? 'Doctor' : 'Patient'} is speaking
                  </p>
                  <TalkingAvatar
                    message={avatarMessage}
                    userType={avatarUserType}
                  />
                </>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No active speaker</p>
                  <p className="text-xs mt-2">Messages will be read aloud when received</p>
                </div>
              )}
            </div>
          </div>

          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto mb-4 pr-2"
            style={{ minHeight: '250px' }}
          >
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                text={msg.text}
                sender={msg.sender}
                timestamp={msg.timestamp}
                userType={userType}
              />
            ))}
          </div>

          {userType === 'patient' && (
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="btn-secondary py-1"
                >
                  Select Images
                </button>
                <button
                  type="button"
                  onClick={handleUploadImages}
                  className="btn-primary py-1"
                  disabled={images.length === 0}
                >
                  Upload for 3D Model
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                multiple
                className="hidden"
              />
              {images.length > 0 && (
                <p className="text-sm text-gray-600">
                  {images.length} image(s) selected
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            {/* Show interim transcript */}
            {interimTranscript && (
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 text-sm italic">
                {interimTranscript}
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white mic-recording' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                title={isListening ? 'Stop recording' : 'Start recording'}
              >
                {/* Microphone icon */}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!message.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInterface; 
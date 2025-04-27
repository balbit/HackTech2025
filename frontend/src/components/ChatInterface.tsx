import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import ChatMessage from './ChatMessage';
import TalkingAvatar from './TalkingAvatar';
import { useChatStore, getSocket } from '@/lib/socket';

interface ChatInterfaceProps {
  userType: 'doctor' | 'patient';
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userType }) => {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [lastReceivedMessage, setLastReceivedMessage] = useState<string>('');
  const [lastSpeaker, setLastSpeaker] = useState<'doctor' | 'patient' | null>(null);
  const { 
    messages, 
    addMessage, 
    waitingForOther, 
    setWaitingForOther,
    splatStatus,
    setSplatStatus
  } = useChatStore();
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Connect to socket and set up event listeners
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // Join as doctor or patient
    socket.emit('join', { userType });

    // Listen for the other user joining
    socket.on('userJoined', ({ type }) => {
      if (
        (userType === 'doctor' && type === 'patient') ||
        (userType === 'patient' && type === 'doctor')
      ) {
        setWaitingForOther(false);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} has joined the session`);
      }
    });

    // Listen for new messages
    socket.on('message', (data) => {
      const sender = data.sender === userType ? userType : userType === 'doctor' ? 'patient' : 'doctor';
      addMessage({ text: data.text, sender });
      
      // Only set lastReceivedMessage if it's from the other user
      if (sender !== userType) {
        setLastReceivedMessage(data.text);
        setLastSpeaker(sender);
      }
    });

    // Listen for splat status updates
    socket.on('splatUpdate', (status) => {
      setSplatStatus(status);
      if (status === 'done') {
        toast.success('3D model is now available');
      } else if (status === 'processing') {
        toast.loading('Processing 3D model...');
      }
    });

    // Poll for splat status
    const checkSplatInterval = setInterval(() => {
      fetch('/api/get-splat')
        .then(response => response.json())
        .then(data => {
          if (data.status !== splatStatus) {
            setSplatStatus(data.status);
            if (data.status === 'done') {
              toast.success('3D model is now available');
            }
          }
        })
        .catch(error => console.error('Error checking splat status:', error));
    }, 10000); // Every 10 seconds

    return () => {
      socket.off('userJoined');
      socket.off('message');
      socket.off('splatUpdate');
      clearInterval(checkSplatInterval);
    };
  }, [userType, addMessage, setWaitingForOther, setSplatStatus, splatStatus]);

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (socketRef.current) {
      socketRef.current.emit('sendMessage', { text: message, userType });
      addMessage({ text: message, sender: userType });
      setMessage('');
      
      // Set last speaker to self
      setLastSpeaker(userType);
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
        
        // Inform the other user that images have been uploaded
        if (socketRef.current) {
          const uploadMessage = "I've uploaded images for 3D modeling";
          socketRef.current.emit('sendMessage', { 
            text: uploadMessage, 
            userType 
          });
          addMessage({ 
            text: uploadMessage, 
            sender: userType 
          });
          
          // Set last speaker to self
          setLastSpeaker(userType);
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
            <div className="text-sm bg-gray-100 px-3 py-1 rounded-full">
              {splatStatus === 'unavailable' && 'No 3D model available'}
              {splatStatus === 'processing' && 'Processing 3D model...'}
              {splatStatus === 'done' && '3D model ready'}
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

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={!message.trim()}
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatInterface; 
import React, { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import idleAnimation from '../assets/animations/idle-avatar.json';
import talkingAnimation from '../assets/animations/talking-avatar.json';
import { speakMessage } from '../lib/speechUtils';

interface TalkingAvatarProps {
  message?: string;
  userType: 'doctor' | 'patient';
}

const TalkingAvatar: React.FC<TalkingAvatarProps> = ({ message, userType }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const lastMessageRef = useRef<string>('');

  useEffect(() => {
    // Only process new messages and avoid duplicates
    if (message && message !== lastMessageRef.current) {
      lastMessageRef.current = message;
      
      if (isSpeechEnabled) {
        setIsPlaying(true);
        
        // Use our utility function to speak the message
        speakMessage(
          message,
          userType,
          () => setIsTalking(true),
          () => {
            setIsTalking(false);
            setIsPlaying(false);
          }
        );
        
        // Backup timeout in case the speech events don't fire
        const timeout = setTimeout(() => {
          setIsTalking(false);
          setIsPlaying(false);
        }, message.length * 90); // Rough estimate based on message length
        
        return () => clearTimeout(timeout);
      } else {
        // If speech is disabled but we got a new message, just animate briefly
        setIsTalking(true);
        const timeout = setTimeout(() => {
          setIsTalking(false);
        }, 2000); // Animate for 2 seconds
        return () => clearTimeout(timeout);
      }
    }
  }, [message, isSpeechEnabled, userType]);
  
  const toggleSpeech = () => {
    setIsSpeechEnabled(!isSpeechEnabled);
    
    // If we're turning off speech, stop any ongoing speech
    if (isSpeechEnabled && typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      setIsTalking(false);
    }
  };
  
  return (
    <div className="avatar-container flex flex-col items-center">
      <div className="w-32 h-32">
        {/* Show talking animation when message is being spoken, otherwise show idle */}
        <Lottie
          animationData={isTalking ? talkingAnimation : idleAnimation}
          loop={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <button 
        onClick={toggleSpeech}
        className={`text-xs mt-2 px-2 py-1 rounded-full ${
          isSpeechEnabled 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {isSpeechEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
      </button>
    </div>
  );
};

export default TalkingAvatar; 
import React from 'react';

interface ChatMessageProps {
  text: string;
  sender: 'doctor' | 'patient';
  timestamp: Date;
  userType: 'doctor' | 'patient';
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  text,
  sender,
  timestamp,
  userType,
}) => {
  const isOwnMessage = sender === userType;
  
  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`px-4 py-2 rounded-lg max-w-[70%] break-words ${
          isOwnMessage
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        <p>{text}</p>
        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage; 
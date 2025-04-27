'use client';

/**
 * Utility functions for speech synthesis
 */

// Function to get the best voice for a particular user type
export const getVoiceForUserType = (userType: 'doctor' | 'patient'): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined') return null;
  
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  
  // Try to find voices that sound appropriate for each role
  if (userType === 'doctor') {
    // Prefer a professional sounding voice for doctor
    // First try to find a male voice in English
    const maleVoice = voices.find(
      voice => voice.lang.includes('en') && voice.name.toLowerCase().includes('male')
    );
    
    if (maleVoice) return maleVoice;
    
    // Otherwise, just find any English voice
    const englishVoice = voices.find(voice => voice.lang.includes('en'));
    if (englishVoice) return englishVoice;
  } else {
    // For patient, try to find a different voice than doctor
    // First try to find a female voice in English
    const femaleVoice = voices.find(
      voice => voice.lang.includes('en') && 
        (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'))
    );
    
    if (femaleVoice) return femaleVoice;
    
    // Otherwise, just find any English voice that's different from index 0
    const englishVoices = voices.filter(voice => voice.lang.includes('en'));
    if (englishVoices.length > 1) return englishVoices[1];
    if (englishVoices.length > 0) return englishVoices[0];
  }
  
  // Fall back to the first available voice
  return voices[0];
};

// Function to speak a message with the appropriate voice
export const speakMessage = (
  message: string, 
  userType: 'doctor' | 'patient',
  onStart?: () => void,
  onEnd?: () => void
): void => {
  if (typeof window === 'undefined') return;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(message);
  const voice = getVoiceForUserType(userType);
  
  if (voice) {
    utterance.voice = voice;
  }
  
  // Adjust rate slightly based on user type
  utterance.rate = userType === 'doctor' ? 0.9 : 1.1;
  
  // Set event handlers
  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  
  // Speak the message
  window.speechSynthesis.speak(utterance);
}; 
/**
 * Voice Recognition and Synthesis
 * 
 * This module provides speech-to-text (STT) and text-to-speech (TTS) functionality
 * using the browser's built-in Web Speech API. No external services or API keys required.
 * 
 * Features:
 * - Speech Recognition: Convert spoken words to text
 * - Speech Synthesis: Convert text to spoken audio
 * - Cross-browser support (Chrome, Edge, Safari)
 * 
 * Note: Speech recognition requires user permission and may not be available
 * in all browsers. The functions handle unsupported browsers gracefully.
 */
let recognition: SpeechRecognition | null = null;
let synthesis: SpeechSynthesis | null = null;

/**
 * Initialize Speech Recognition
 * 
 * Sets up the browser's speech recognition API. Returns null if not supported.
 * 
 * @returns SpeechRecognition instance or null if not supported
 */
export function initSpeechRecognition(): SpeechRecognition | null {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    window.SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('Speech Recognition not supported');
    return null;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  return recognition;
}

/**
 * Start Listening for Speech
 * 
 * Begins listening for speech input and converts it to text. When speech is detected,
 * the onResult callback is called with the transcribed text.
 * 
 * @param onResult - Callback function called with transcribed text
 * @param onError - Optional callback for error handling
 */
export function startListening(
  onResult: (text: string) => void,
  onError?: (error: string) => void
): void {
  if (!recognition) {
    recognition = initSpeechRecognition();
  }

  if (!recognition) {
    onError?.('Speech recognition not supported');
    return;
  }

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event) => {
    onError?.(event.error || 'Speech recognition error');
  };

  recognition.start();
}

/**
 * Stop Listening for Speech
 * 
 * Stops the current speech recognition session if one is active.
 */
export function stopListening(): void {
  if (recognition) {
    recognition.stop();
  }
}

/**
 * Speak Text (Text-to-Speech)
 * 
 * Converts text to speech and plays it through the browser's speech synthesis.
 * Useful for reading content aloud or providing audio feedback.
 * 
 * @param text - The text to speak
 * @param onEnd - Optional callback called when speech finishes
 */
export function speak(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech Synthesis not supported');
    return;
  }

  synthesis = window.speechSynthesis;

  // Cancel any ongoing speech
  synthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  if (onEnd) {
    utterance.onend = onEnd;
  }

  synthesis.speak(utterance);
}

/**
 * Stop Speaking
 * 
 * Cancels any ongoing speech synthesis, stopping the audio immediately.
 */
export function stopSpeaking(): void {
  if (synthesis) {
    synthesis.cancel();
  }
}

/**
 * Check if Voice Features are Supported
 * 
 * Checks if both speech recognition and speech synthesis are available
 * in the current browser. Returns false if either is not supported.
 * 
 * @returns true if both features are supported, false otherwise
 */
export function isVoiceSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window.SpeechRecognition || (window as any).webkitSpeechRecognition) &&
    window.speechSynthesis
  );
}


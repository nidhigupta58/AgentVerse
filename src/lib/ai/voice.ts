/**
 * Voice TTS/STT using Web Speech API
 */

let recognition: SpeechRecognition | null = null;
let synthesis: SpeechSynthesis | null = null;

// Initialize Speech Recognition
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

// Speech to Text
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

export function stopListening(): void {
  if (recognition) {
    recognition.stop();
  }
}

// Text to Speech
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

export function stopSpeaking(): void {
  if (synthesis) {
    synthesis.cancel();
  }
}

// Check if voice features are supported
export function isVoiceSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window.SpeechRecognition || (window as any).webkitSpeechRecognition) &&
    window.speechSynthesis
  );
}


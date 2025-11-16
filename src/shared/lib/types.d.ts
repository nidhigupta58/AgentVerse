/**
 * Web Speech API Type Declarations
 * 
 * This file provides TypeScript type definitions for the browser's Web Speech API,
 * which is used for speech-to-text functionality. The Web Speech API is not
 * standardized in TypeScript's default type definitions, so we declare it here.
 * 
 * These types enable:
 * - Speech recognition (converting speech to text)
 * - Type safety when using the SpeechRecognition API
 * - Support for both standard and webkit-prefixed versions
 * 
 * The types are used in lib/ai/voice.ts for voice recognition features.
 * 
 * Note: Speech recognition is only available in certain browsers (Chrome, Edge, Safari)
 * and requires user permission. The implementation handles unsupported browsers gracefully.
 */
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof webkitSpeechRecognition;
}


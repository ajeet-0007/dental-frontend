import { useState, useEffect, useCallback, useRef } from 'react';

interface UseVoiceSearchOptions {
  lang?: string;
  continuous?: boolean;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseVoiceSearchReturn {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceSearch(options: UseVoiceSearchOptions = {}): UseVoiceSearchReturn {
  const { 
    lang = 'en-US',
    continuous = false,
    onResult,
    onError 
  } = options;

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    console.log('[VoiceSearch] Initializing, SpeechRecognition available:', !!SpeechRecognition);
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = lang;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        console.log('[VoiceSearch] Started listening');
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        console.log('[VoiceSearch] Result received:', event.results);
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            const trimmed = finalTranscript.trim();
            console.log('[VoiceSearch] Final transcript:', trimmed);
            setTranscript(trimmed);
            if (onResultRef.current) {
              onResultRef.current(trimmed);
            }
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('[VoiceSearch] Error:', event.error);
        let errorMessage = 'Voice recognition error';
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'network':
            errorMessage = 'Network error. Check your connection.';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found.';
            break;
          case 'language-not-supported':
            errorMessage = 'Language not supported.';
            break;
          default:
            errorMessage = event.error;
        }
        
        setError(errorMessage);
        setIsListening(false);
        if (onErrorRef.current) {
          onErrorRef.current(errorMessage);
        }
      };

      recognitionRef.current.onend = () => {
        console.log('[VoiceSearch] Ended');
        setIsListening(false);
      };

      recognitionRef.current.onaudiostart = () => {
        console.log('[VoiceSearch] Audio started');
      };

      recognitionRef.current.onaudioend = () => {
        console.log('[VoiceSearch] Audio ended');
      };
    } else {
      console.log('[VoiceSearch] Not supported in this browser');
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [lang, continuous]);

  const startListening = useCallback(() => {
    console.log('[VoiceSearch] startListening called, isSupported:', isSupported);
    
    if (!isSupported || !recognitionRef.current) {
      const msg = 'Voice search not supported';
      console.error('[VoiceSearch]', msg);
      setError(msg);
      return;
    }

    setTranscript('');
    setError(null);

    try {
      console.log('[VoiceSearch] Starting recognition...');
      recognitionRef.current.start();
    } catch (e: any) {
      console.error('[VoiceSearch] Failed to start:', e);
      setError('Failed to start voice recognition: ' + e.message);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    console.log('[VoiceSearch] stopListening called');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e: any) {
        console.error('[VoiceSearch] Failed to stop:', e);
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}

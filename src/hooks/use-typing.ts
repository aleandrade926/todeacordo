import { useState, useEffect, useCallback } from "react";

interface TypingState {
  typedText: string;
  currentIndex: number;
  errors: Record<string, number>;
  isStarted: boolean;
  isCompleted: boolean;
  startTime: number | null;
  wpm: number;
  accuracy: number;
  timeElapsed: number;
}

export function useTyping(targetText: string) {
  const [state, setState] = useState<TypingState>({
    typedText: "",
    currentIndex: 0,
    errors: {},
    isStarted: false,
    isCompleted: false,
    startTime: null,
    wpm: 0,
    accuracy: 100,
    timeElapsed: 0
  });

  // Calculate metrics
  useEffect(() => {
    if (!state.startTime || !state.isStarted) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - state.startTime!) / 1000);
      const minutes = elapsed / 60;
      
      // Calculate WPM (words = characters / 5)
      const words = state.typedText.length / 5;
      const wpm = minutes > 0 ? Math.round(words / minutes) : 0;
      
      // Calculate accuracy
      let correct = 0;
      for (let i = 0; i < state.typedText.length; i++) {
        if (state.typedText[i] === targetText[i]) {
          correct++;
        }
      }
      const accuracy = state.typedText.length > 0 
        ? Math.round((correct / state.typedText.length) * 100) 
        : 100;

      setState(prev => ({
        ...prev,
        timeElapsed: elapsed,
        wpm,
        accuracy
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.startTime, state.isStarted, state.typedText.length, targetText]);

  const startTyping = useCallback(() => {
    setState(prev => ({
      ...prev,
      isStarted: true,
      startTime: Date.now()
    }));
  }, []);

  const resetTyping = useCallback(() => {
    setState({
      typedText: "",
      currentIndex: 0,
      errors: {},
      isStarted: false,
      isCompleted: false,
      startTime: null,
      wpm: 0,
      accuracy: 100,
      timeElapsed: 0
    });
  }, []);

  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (state.isCompleted) return;
    
    // Don't handle special keys except backspace
    if (event.key.length > 1 && event.key !== 'Backspace') {
      event.preventDefault();
      return;
    }
    
    if (!state.isStarted) {
      startTyping();
    }

    if (event.key === 'Backspace') {
      setState(prev => {
        const newTypedText = prev.typedText.slice(0, -1);
        return {
          ...prev,
          typedText: newTypedText,
          currentIndex: Math.max(0, prev.currentIndex - 1)
        };
      });
      return;
    }

    const targetChar = targetText[state.currentIndex];
    const typedChar = event.key;
    
    setState(prev => {
      const newTypedText = prev.typedText + typedChar;
      const newIndex = prev.currentIndex + 1;
      
      // Track errors
      const newErrors = { ...prev.errors };
      if (typedChar !== targetChar) {
        newErrors[targetChar] = (newErrors[targetChar] || 0) + 1;
      }
      
      // Check if completed
      const isCompleted = newIndex >= targetText.length;
      
      return {
        ...prev,
        typedText: newTypedText,
        currentIndex: newIndex,
        errors: newErrors,
        isCompleted
      };
    });
    
    event.preventDefault();
  }, [state.isCompleted, state.isStarted, state.currentIndex, targetText, startTyping]);

  return {
    ...state,
    startTyping,
    resetTyping,
    handleKeyPress
  };
}

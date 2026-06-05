import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import VirtualKeyboard from "./virtual-keyboard";
import { useTyping } from "@/hooks/use-typing";
import { cn } from "@/lib/utils";

interface TypingTrainerProps {
  lessonText: string;
  onComplete: (results: { wpm: number; accuracy: number; errors: Record<string, number> }) => void;
  showKeyboard?: boolean;
}

export default function TypingTrainer({ lessonText, onComplete, showKeyboard = true }: TypingTrainerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    typedText,
    currentIndex,
    errors,
    isStarted,
    isCompleted,
    wpm,
    accuracy,
    timeElapsed,
    startTyping,
    resetTyping,
    handleKeyPress
  } = useTyping(lessonText);

  useEffect(() => {
    if (isCompleted) {
      onComplete({ wpm, accuracy, errors });
    }
  }, [isCompleted, wpm, accuracy, errors, onComplete]);

  const renderText = () => {
    return lessonText.split('').map((char, index) => {
      let className = '';
      
      if (index < typedText.length) {
        className = typedText[index] === char ? 'typing-char-correct' : 'typing-char-error';
      } else if (index === currentIndex && isStarted) {
        className = 'typing-char-current';
      }

      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentChar = currentIndex < lessonText.length ? lessonText[currentIndex] : '';

  return (
    <div className="space-y-6">
      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="text-center p-4 bg-blue-50">
            <p className="text-2xl font-bold text-primary" data-testid="live-wpm">{wpm}</p>
            <p className="text-sm text-slate-600">PPM</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center p-4 bg-green-50">
            <p className="text-2xl font-bold text-green-600" data-testid="live-accuracy">{accuracy}</p>
            <p className="text-sm text-slate-600">% Precisão</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center p-4 bg-orange-50">
            <p className="text-2xl font-bold text-orange-500" data-testid="live-time">
              {formatTime(timeElapsed)}
            </p>
            <p className="text-sm text-slate-600">Tempo</p>
          </CardContent>
        </Card>
      </div>

      {/* Typing Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900">Texto de Referência:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            className="bg-white border border-slate-200 rounded-lg p-4 text-lg leading-relaxed font-mono min-h-24"
            data-testid="reference-text"
          >
            {renderText()}
          </div>

          <div>
            <label className="block font-medium text-slate-900 mb-2">Sua Digitação:</label>
            <Textarea
              ref={textareaRef}
              value={typedText}
              onChange={() => {}} // Controlled by our typing hook
              onKeyDown={handleKeyPress}
              className="w-full h-32 text-lg leading-relaxed font-mono resize-none"
              placeholder={isStarted ? "" : "Comece a digitar aqui..."}
              disabled={isCompleted}
              data-testid="typing-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Virtual Keyboard */}
      {showKeyboard && (
        <VirtualKeyboard currentKey={currentChar} />
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div className="space-x-3">
          {!isStarted && !isCompleted && (
            <Button 
              onClick={startTyping}
              className="bg-primary text-white hover:bg-blue-600"
              data-testid="button-start"
            >
              <i className="fas fa-play mr-2"></i>Iniciar
            </Button>
          )}
          
          <Button 
            onClick={resetTyping}
            variant="outline"
            data-testid="button-reset"
          >
            <i className="fas fa-redo mr-2"></i>Recomeçar
          </Button>
        </div>
        
        {isCompleted && (
          <div className="flex items-center space-x-2 text-green-600">
            <i className="fas fa-check-circle"></i>
            <span className="font-medium">Exercício Concluído!</span>
          </div>
        )}
      </div>
    </div>
  );
}

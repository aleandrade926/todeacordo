export interface TypingMetrics {
  wpm: number;
  accuracy: number;
  errors: Record<string, number>;
  timeElapsed: number;
  charactersTyped: number;
}

export class TypingEngine {
  private targetText: string;
  private typedText: string = "";
  private startTime: number | null = null;
  private errors: Record<string, number> = {};
  private isActive: boolean = false;

  constructor(targetText: string) {
    this.targetText = targetText;
  }

  start() {
    this.isActive = true;
    this.startTime = Date.now();
  }

  stop() {
    this.isActive = false;
  }

  reset() {
    this.typedText = "";
    this.startTime = null;
    this.errors = {};
    this.isActive = false;
  }

  processKeyInput(key: string): boolean {
    if (!this.isActive) return false;
    
    if (!this.startTime) {
      this.startTime = Date.now();
    }

    if (key === 'Backspace') {
      this.typedText = this.typedText.slice(0, -1);
      return true;
    }

    if (this.typedText.length >= this.targetText.length) {
      return false; // Already completed
    }

    const currentIndex = this.typedText.length;
    const expectedChar = this.targetText[currentIndex];
    
    this.typedText += key;

    // Track errors
    if (key !== expectedChar) {
      this.errors[expectedChar] = (this.errors[expectedChar] || 0) + 1;
    }

    return true;
  }

  getMetrics(): TypingMetrics {
    const timeElapsed = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    const minutes = timeElapsed / 60;
    
    // Calculate WPM (standard: 5 characters = 1 word)
    const words = this.typedText.length / 5;
    const wpm = minutes > 0 ? Math.round(words / minutes) : 0;
    
    // Calculate accuracy
    let correctChars = 0;
    for (let i = 0; i < this.typedText.length; i++) {
      if (this.typedText[i] === this.targetText[i]) {
        correctChars++;
      }
    }
    
    const accuracy = this.typedText.length > 0 
      ? Math.round((correctChars / this.typedText.length) * 100) 
      : 100;

    return {
      wpm,
      accuracy,
      errors: { ...this.errors },
      timeElapsed: Math.floor(timeElapsed),
      charactersTyped: this.typedText.length
    };
  }

  getCurrentIndex(): number {
    return this.typedText.length;
  }

  getTypedText(): string {
    return this.typedText;
  }

  isCompleted(): boolean {
    return this.typedText.length >= this.targetText.length;
  }

  getProgress(): number {
    return (this.typedText.length / this.targetText.length) * 100;
  }
}

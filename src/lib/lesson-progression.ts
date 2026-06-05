import type { User, UserProgress, TypingSession } from "@shared/schema";

export interface LessonStatus {
  isUnlocked: boolean;
  isCompleted: boolean;
  canAccess: boolean;
  requiredWpm?: number;
  requiredAccuracy?: number;
  blockingReason?: string;
}

/**
 * Determine if a lesson should be unlocked based on user progress
 */
export function getLessonStatus(
  day: number,
  user: User | null,
  progress: UserProgress[],
  sessions: TypingSession[]
): LessonStatus {
  if (!user) {
    return {
      isUnlocked: false,
      isCompleted: false,
      canAccess: false,
      blockingReason: "Usuário não autenticado"
    };
  }

  const lessonProgress = progress.find(p => p.day === day);
  const isCompleted = lessonProgress?.completed || false;

  // Day 1 is always unlocked
  if (day === 1) {
    return {
      isUnlocked: true,
      isCompleted,
      canAccess: true
    };
  }

  // Check if previous lesson is completed
  const previousDay = day - 1;
  const previousProgress = progress.find(p => p.day === previousDay);
  const previousCompleted = previousProgress?.completed || false;

  if (!previousCompleted) {
    return {
      isUnlocked: false,
      isCompleted,
      canAccess: false,
      blockingReason: `Complete a lição ${previousDay} primeiro`
    };
  }

  // Week 2 requirements (Days 8-14): Average 30+ WPM and 85%+ accuracy
  if (day >= 8 && day <= 14) {
    const week1Sessions = sessions.filter(s => s.lessonId && s.lessonId.includes('lesson-') && 
      parseInt(s.lessonId.split('-')[1]) <= 7);
    
    if (week1Sessions.length < 3) {
      return {
        isUnlocked: false,
        isCompleted,
        canAccess: false,
        blockingReason: "Complete pelo menos 3 lições da Semana 1"
      };
    }

    const avgWpm = week1Sessions.reduce((sum, s) => sum + s.wpm, 0) / week1Sessions.length;
    const avgAccuracy = week1Sessions.reduce((sum, s) => sum + s.accuracy, 0) / week1Sessions.length;

    if (avgWpm < 30 || avgAccuracy < 85) {
      return {
        isUnlocked: false,
        isCompleted,
        canAccess: false,
        requiredWpm: 30,
        requiredAccuracy: 85,
        blockingReason: `Necessário: média de 30 PPM e 85% de precisão na Semana 1 (atual: ${Math.round(avgWpm)} PPM, ${Math.round(avgAccuracy)}%)`
      };
    }
  }

  // Week 3 requirements (Days 15-21): Average 50+ WPM and 90%+ accuracy
  if (day >= 15 && day <= 21) {
    const week2Sessions = sessions.filter(s => s.lessonId && s.lessonId.includes('lesson-') && 
      parseInt(s.lessonId.split('-')[1]) >= 8 && parseInt(s.lessonId.split('-')[1]) <= 14);
    
    if (week2Sessions.length < 5) {
      return {
        isUnlocked: false,
        isCompleted,
        canAccess: false,
        blockingReason: "Complete pelo menos 5 lições da Semana 2"
      };
    }

    const avgWpm = week2Sessions.reduce((sum, s) => sum + s.wpm, 0) / week2Sessions.length;
    const avgAccuracy = week2Sessions.reduce((sum, s) => sum + s.accuracy, 0) / week2Sessions.length;

    if (avgWpm < 50 || avgAccuracy < 90) {
      return {
        isUnlocked: false,
        isCompleted,
        canAccess: false,
        requiredWpm: 50,
        requiredAccuracy: 90,
        blockingReason: `Necessário: média de 50 PPM e 90% de precisão na Semana 2 (atual: ${Math.round(avgWpm)} PPM, ${Math.round(avgAccuracy)}%)`
      };
    }
  }

  // Week 4 requirements (Days 22-30): Average 60+ WPM and 92%+ accuracy
  if (day >= 22 && day <= 30) {
    const week3Sessions = sessions.filter(s => s.lessonId && s.lessonId.includes('lesson-') && 
      parseInt(s.lessonId.split('-')[1]) >= 15 && parseInt(s.lessonId.split('-')[1]) <= 21);
    
    if (week3Sessions.length < 5) {
      return {
        isUnlocked: false,
        isCompleted,
        canAccess: false,
        blockingReason: "Complete pelo menos 5 lições da Semana 3"
      };
    }

    const avgWpm = week3Sessions.reduce((sum, s) => sum + s.wpm, 0) / week3Sessions.length;
    const avgAccuracy = week3Sessions.reduce((sum, s) => sum + s.accuracy, 0) / week3Sessions.length;

    if (avgWpm < 60 || avgAccuracy < 92) {
      return {
        isUnlocked: false,
        isCompleted,
        canAccess: false,
        requiredWpm: 60,
        requiredAccuracy: 92,
        blockingReason: `Necessário: média de 60 PPM e 92% de precisão na Semana 3 (atual: ${Math.round(avgWpm)} PPM, ${Math.round(avgAccuracy)}%)`
      };
    }
  }

  // If all requirements are met, lesson is unlocked
  return {
    isUnlocked: true,
    isCompleted,
    canAccess: true
  };
}

/**
 * Get the current week based on user progress
 */
export function getCurrentWeek(progress: UserProgress[]): number {
  const completedDays = progress.filter(p => p.completed).length;
  
  if (completedDays === 0) return 1;
  if (completedDays <= 7) return 1;
  if (completedDays <= 14) return 2;
  if (completedDays <= 21) return 3;
  return 4;
}

/**
 * Get recommended next lesson for the user
 */
export function getRecommendedLesson(progress: UserProgress[]): number {
  const completedDays = progress.filter(p => p.completed).map(p => p.day).sort((a, b) => a - b);
  
  if (completedDays.length === 0) return 1;
  
  // Find the first gap in completed lessons
  for (let day = 1; day <= 30; day++) {
    if (!completedDays.includes(day)) {
      return day;
    }
  }
  
  // All lessons completed
  return 30;
}

/**
 * Calculate week progress percentage
 */
export function getWeekProgress(week: number, progress: UserProgress[]): number {
  const weekStart = (week - 1) * 7 + 1;
  const weekEnd = week * 7;
  
  const weekDays: number[] = [];
  for (let day = weekStart; day <= weekEnd; day++) {
    weekDays.push(day);
  }
  
  const completedInWeek = progress.filter(p => 
    weekDays.includes(p.day) && p.completed
  ).length;
  
  return Math.round((completedInWeek / 7) * 100);
}
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useProgress } from "@/hooks/use-progress";
import { getLessonStatus, getCurrentWeek, getRecommendedLesson, getWeekProgress } from "@/lib/lesson-progression";
import { Lock, Play, CheckCircle, Trophy, Target, Clock, BookOpen } from "lucide-react";
import TypingTrainer from "@/components/typing-trainer";
import type { Lesson } from "@shared/schema";

export default function Training() {
  const [, setLocation] = useLocation();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const { user, progress, sessions, isLoading } = useProgress();

  // Fetch lessons from API
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ['/api/lessons'],
    retry: false
  });

  const currentWeek = getCurrentWeek(progress);
  const recommendedLesson = getRecommendedLesson(progress);

  const weeklyLessons = {
    1: lessons.filter(l => l.week === 1),
    2: lessons.filter(l => l.week === 2),
    3: lessons.filter(l => l.week === 3),
    4: lessons.filter(l => l.week === 4)
  };

  const getStatusColor = (status: any) => {
    if (status.isCompleted) return "bg-green-100 text-green-800 border-green-200";
    if (status.canAccess) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  const getStatusIcon = (status: any) => {
    if (status.isCompleted) return <CheckCircle className="h-4 w-4" />;
    if (status.canAccess) return <Play className="h-4 w-4" />;
    return <Lock className="h-4 w-4" />;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-orange-100 text-orange-800";
      case "elite": return "bg-purple-100 text-purple-800";
      case "master": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (selectedLesson) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Lição {selectedLesson.day}: {selectedLesson.title}
            </h1>
            <p className="text-slate-600">{selectedLesson.description}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setSelectedLesson(null)}
            data-testid="button-back-to-lessons"
          >
            ← Voltar às Lições
          </Button>
        </div>

        <TypingTrainer 
          lessonText={selectedLesson.content}
          lessonId={selectedLesson.id}
          targetWpm={selectedLesson.targetWpm}
          onComplete={() => {
            // Return to lessons after completion
            setSelectedLesson(null);
          }}
        />
      </div>
    );
  }

  if (isLoading || lessonsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando lições...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          Jornada do Mestre das Teclas
        </h1>
        <p className="text-slate-600">
          Programe de 30 dias para dominar a digitação profissional
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(week => {
          const weekProgress = getWeekProgress(week, progress);
          const isCurrentWeek = week === currentWeek;
          const isCompleted = weekProgress === 100;
          
          return (
            <Card key={week} className={`${isCurrentWeek ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Semana {week}</span>
                  {isCompleted && <Trophy className="h-4 w-4 text-yellow-500" />}
                </div>
                <Progress value={weekProgress} className="mb-2" />
                <p className="text-xs text-slate-600">{weekProgress}% completo</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recommended Lesson */}
      {recommendedLesson <= 30 && (
        <Card className="bg-gradient-to-r from-primary/10 to-blue/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Próxima Lição Recomendada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const lesson = lessons.find(l => l.day === recommendedLesson);
              if (!lesson) return null;
              
              const status = getLessonStatus(lesson.day, user, progress, sessions);
              
              return (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Dia {lesson.day}: {lesson.title}</h3>
                    <p className="text-sm text-slate-600">{lesson.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getDifficultyColor(lesson.difficulty)}>
                        {lesson.difficulty}
                      </Badge>
                      <span className="text-sm text-slate-500">Meta: {lesson.targetWpm} PPM</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => status.canAccess ? setSelectedLesson(lesson) : null}
                    disabled={!status.canAccess}
                    className="min-w-[120px]"
                    data-testid={`button-start-lesson-${lesson.day}`}
                  >
                    {getStatusIcon(status)}
                    <span className="ml-2">
                      {status.isCompleted ? 'Revisar' : status.canAccess ? 'Iniciar' : 'Bloqueado'}
                    </span>
                  </Button>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Weekly Tabs */}
      <Tabs value={currentWeek.toString()} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          {[1, 2, 3, 4].map(week => (
            <TabsTrigger 
              key={week} 
              value={week.toString()}
              className="flex items-center gap-2"
              data-testid={`tab-week-${week}`}
            >
              <span>Semana {week}</span>
              {getWeekProgress(week, progress) === 100 && (
                <Trophy className="h-3 w-3 text-yellow-500" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {[1, 2, 3, 4].map(week => (
          <TabsContent key={week} value={week.toString()}>
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">
                  Semana {week}: {getWeekTitle(week)}
                </h2>
                <p className="text-slate-600">{getWeekDescription(week)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weeklyLessons[week as keyof typeof weeklyLessons]?.map(lesson => {
                  const status = getLessonStatus(lesson.day, user, progress, sessions);
                  
                  return (
                    <Card 
                      key={lesson.id} 
                      className={`transition-all hover:shadow-lg ${getStatusColor(status)}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base mb-1">
                              Dia {lesson.day}: {lesson.title}
                            </CardTitle>
                            <p className="text-sm opacity-80">{lesson.description}</p>
                          </div>
                          <div className="ml-2">
                            {getStatusIcon(status)}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <Badge className={getDifficultyColor(lesson.difficulty)}>
                              {lesson.difficulty}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {lesson.targetWpm} PPM
                            </span>
                          </div>
                          
                          <div className="text-xs text-slate-600">
                            <div className="flex items-center gap-1 mb-1">
                              <BookOpen className="h-3 w-3" />
                              {lesson.category}
                            </div>
                            {lesson.instructions && (
                              <p className="line-clamp-2">{lesson.instructions}</p>
                            )}
                          </div>
                          
                          {!status.canAccess && status.blockingReason && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                              {status.blockingReason}
                            </div>
                          )}
                          
                          <Button
                            onClick={() => status.canAccess ? setSelectedLesson(lesson) : null}
                            disabled={!status.canAccess}
                            size="sm"
                            className="w-full"
                            variant={status.isCompleted ? "outline" : "default"}
                            data-testid={`button-lesson-${lesson.day}`}
                          >
                            {status.isCompleted ? 'Revisar Lição' : status.canAccess ? 'Iniciar Lição' : 'Bloqueado'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function getWeekTitle(week: number): string {
  switch (week) {
    case 1: return "Fundamentos e Fileira Guia";
    case 2: return "Domínio Completo do Teclado";
    case 3: return "Velocidade e Resistência";
    case 4: return "Nível Elite e Especialização";
    default: return "Semana " + week;
  }
}

function getWeekDescription(week: number): string {
  switch (week) {
    case 1: return "Aprenda a posição correta das mãos e domine a fileira guia (ASDF JKLÇ)";
    case 2: return "Expanda para todas as fileiras e domine pontuação e símbolos";
    case 3: return "Desenvolva velocidade, resistência e precisão para textos longos";
    case 4: return "Alcance o nível elite com técnicas avançadas e especialização";
    default: return "";
  }
}
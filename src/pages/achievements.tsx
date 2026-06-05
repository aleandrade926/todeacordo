import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AchievementBadge from "@/components/achievement-badge";
import { useProgress } from "@/hooks/use-progress";
import type { Achievement, UserAchievement } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function Achievements() {
  const { user } = useProgress();

  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements'],
    retry: false
  });

  const { data: userAchievements = [], isLoading: userAchievementsLoading } = useQuery<UserAchievement[]>({
    queryKey: ['/api/users', user.id, 'achievements'],
    retry: false
  });

  const isLoading = achievementsLoading || userAchievementsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-slate-600 mt-2">Carregando conquistas...</p>
        </div>
      </div>
    );
  }

  const unlockedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));
  
  const getAchievementProgress = (achievement: Achievement) => {
    const isUnlocked = unlockedAchievementIds.has(achievement.id);
    if (isUnlocked) return 100;

    switch (achievement.category) {
      case 'speed':
        return Math.min((user.currentWpm / achievement.requirement) * 100, 100);
      case 'accuracy':
        return Math.min((user.accuracy / achievement.requirement) * 100, 100);
      case 'streak':
        return Math.min((user.streak / achievement.requirement) * 100, 100);
      default:
        return 0;
    }
  };

  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categoryIcons: Record<string, string> = {
    speed: "fas fa-tachometer-alt",
    accuracy: "fas fa-bullseye", 
    streak: "fas fa-fire",
    milestone: "fas fa-trophy"
  };

  const categoryColors: Record<string, string> = {
    speed: "text-blue-600",
    accuracy: "text-green-600",
    streak: "text-orange-600", 
    milestone: "text-purple-600"
  };

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Conquistas</h1>
        <p className="text-slate-600">
          Acompanhe seu progresso e desbloqueie novas conquistas
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progresso Geral</span>
            <Badge variant="secondary">{unlockedCount}/{totalCount}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={(unlockedCount / totalCount) * 100} className="h-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{unlockedCount}</p>
                <p className="text-sm text-slate-600">Desbloqueadas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-400">{totalCount - unlockedCount}</p>
                <p className="text-sm text-slate-600">Restantes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{user.totalXp}</p>
                <p className="text-sm text-slate-600">XP Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round((unlockedCount / totalCount) * 100)}%
                </p>
                <p className="text-sm text-slate-600">Completude</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements by Category */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" data-testid="tab-all-achievements">
            Todas
          </TabsTrigger>
          <TabsTrigger value="speed" data-testid="tab-speed-achievements">
            Velocidade
          </TabsTrigger>
          <TabsTrigger value="accuracy" data-testid="tab-accuracy-achievements">
            Precisão
          </TabsTrigger>
          <TabsTrigger value="streak" data-testid="tab-streak-achievements">
            Sequência
          </TabsTrigger>
          <TabsTrigger value="milestone" data-testid="tab-milestone-achievements">
            Marcos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => {
              const isUnlocked = unlockedAchievementIds.has(achievement.id);
              const progress = getAchievementProgress(achievement);
              const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);

              return (
                <Card
                  key={achievement.id}
                  className={cn(
                    "transition-all duration-200 hover:shadow-lg",
                    isUnlocked ? "ring-2 ring-green-200" : ""
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        isUnlocked ? "bg-green-100" : "bg-slate-100"
                      )}>
                        <i className={cn(
                          achievement.icon,
                          "text-lg",
                          isUnlocked ? "text-green-600" : "text-slate-400"
                        )}></i>
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-semibold mb-1",
                          isUnlocked ? "text-slate-900" : "text-slate-500"
                        )} data-testid={`achievement-${achievement.name.toLowerCase().replace(/\s+/g, '-')}`}>
                          {achievement.name}
                        </h3>
                        <p className={cn(
                          "text-sm mb-3",
                          isUnlocked ? "text-slate-600" : "text-slate-400"
                        )}>
                          {achievement.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <Badge className={categoryColors[achievement.category]}>
                              {achievement.category}
                            </Badge>
                            <span className="text-slate-500">+{achievement.xpReward} XP</span>
                          </div>
                          
                          {!isUnlocked && (
                            <div className="space-y-1">
                              <Progress value={progress} className="h-2" />
                              <p className="text-xs text-slate-500">
                                Progresso: {Math.round(progress)}%
                              </p>
                            </div>
                          )}
                          
                          {isUnlocked && userAchievement && (
                            <p className="text-xs text-green-600">
                              ✓ Desbloqueado em {userAchievement.unlockedAt.toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
          <TabsContent key={category} value={category}>
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <i className={`${categoryIcons[category]} ${categoryColors[category]} text-2xl`}></i>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 capitalize mb-1">
                        {category === 'speed' && 'Velocidade'}
                        {category === 'accuracy' && 'Precisão'}
                        {category === 'streak' && 'Sequência'}
                        {category === 'milestone' && 'Marcos'}
                      </h3>
                      <p className="text-slate-600">
                        {categoryAchievements.filter(a => unlockedAchievementIds.has(a.id)).length} de {categoryAchievements.length} desbloqueadas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryAchievements.map((achievement) => {
                  const isUnlocked = unlockedAchievementIds.has(achievement.id);
                  const progress = getAchievementProgress(achievement);
                  const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);

                  return (
                    <AchievementBadge
                      key={achievement.id}
                      name={achievement.name}
                      description={achievement.description}
                      icon={achievement.icon}
                      category={achievement.category}
                      unlocked={isUnlocked}
                      unlockedAt={userAchievement?.unlockedAt}
                    />
                  );
                })}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Tips for Unlocking */}
      <Card>
        <CardHeader>
          <CardTitle>
            <i className="fas fa-lightbulb mr-2 text-yellow-500"></i>
            Dicas para Desbloquear
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900">Conquistas de Velocidade</h4>
              <p className="text-sm text-slate-600">
                Pratique diariamente focando na precisão. A velocidade vem naturalmente com a prática consistente.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900">Conquistas de Precisão</h4>
              <p className="text-sm text-slate-600">
                Diminua a velocidade e foque em não cometer erros. É melhor digitar devagar e corretamente.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900">Conquistas de Sequência</h4>
              <p className="text-sm text-slate-600">
                Dedique pelo menos 15 minutos por dia ao treino para manter sua sequência ativa.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900">Conquistas de Marco</h4>
              <p className="text-sm text-slate-600">
                Complete as lições na ordem e mantenha uma boa performance para desbloquear marcos importantes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProgress } from "@/hooks/use-progress";
import type { User } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { user } = useProgress();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

  const { data: leaderboard = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/leaderboard'],
    queryParams: { timeframe },
    retry: false
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-slate-600 mt-2">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  const getUserLevel = (user: User) => {
    if (user.level < 2) return "Iniciante";
    if (user.level < 4) return "Intermediário";
    return "Avançado";
  };

  const getUserRank = (userId: string) => {
    const index = leaderboard.findIndex(u => u.id === userId);
    return index !== -1 ? index + 1 : null;
  };

  const currentUserRank = getUserRank(user.id);

  const topThree = leaderboard.slice(0, 3);
  const restOfUsers = leaderboard.slice(3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ranking de Digitadores</h1>
        <p className="text-slate-600">
          Veja como você se compara com outros digitadores
        </p>
      </div>

      {/* Your Position */}
      {currentUserRank && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">#{currentUserRank}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Sua Posição</h3>
                  <p className="text-slate-600">{user.username}</p>
                  <Badge className="mt-1">{getUserLevel(user)}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{user.bestWpm}</p>
                <p className="text-slate-600">PPM</p>
                <p className="text-sm text-slate-500">{user.accuracy}% precisão</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ranking Global</CardTitle>
            <Select value={timeframe} onValueChange={(value: 'week' | 'month' | 'all') => setTimeframe(value)}>
              <SelectTrigger className="w-40" data-testid="select-timeframe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="all">Todos os Tempos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="wpm" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wpm" data-testid="tab-wpm-ranking">Velocidade (PPM)</TabsTrigger>
          <TabsTrigger value="accuracy" data-testid="tab-accuracy-ranking">Precisão</TabsTrigger>
          <TabsTrigger value="streak" data-testid="tab-streak-ranking">Sequência</TabsTrigger>
        </TabsList>

        <TabsContent value="wpm">
          <div className="space-y-6">
            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topThree.map((player, index) => {
                const isCurrentUser = player.id === user.id;
                const medals = ['🥇', '🥈', '🥉'];
                const colors = [
                  'from-yellow-50 to-yellow-100 border-yellow-200',
                  'from-slate-50 to-slate-100 border-slate-200', 
                  'from-orange-50 to-orange-100 border-orange-200'
                ];

                return (
                  <Card
                    key={player.id}
                    className={cn(
                      "transition-all duration-200 hover:shadow-lg",
                      `bg-gradient-to-r ${colors[index]}`,
                      isCurrentUser && "ring-2 ring-primary"
                    )}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-2">{medals[index]}</div>
                      <div className="w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold">
                          {player.username.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">
                        {player.username} {isCurrentUser && "(Você)"}
                      </h3>
                      <Badge className="mb-3">{getUserLevel(player)}</Badge>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-primary">{player.bestWpm} PPM</p>
                        <p className="text-sm text-slate-600">{player.accuracy}% precisão</p>
                        <p className="text-xs text-slate-500">Nível {player.level}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Rest of the rankings */}
            <Card>
              <CardHeader>
                <CardTitle>Classificação Completa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {restOfUsers.map((player, index) => {
                    const position = index + 4; // Since this starts after top 3
                    const isCurrentUser = player.id === user.id;

                    return (
                      <div
                        key={player.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg transition-colors",
                          isCurrentUser 
                            ? "bg-blue-50 border-2 border-primary" 
                            : "bg-slate-50 border border-slate-200 hover:bg-slate-100"
                        )}
                        data-testid={`ranking-position-${position}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-300 text-slate-700 rounded-full flex items-center justify-center font-bold">
                            {position}
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {player.username.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {player.username} {isCurrentUser && "(Você)"}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {getUserLevel(player)}
                                </Badge>
                                <span className="text-xs text-slate-500">
                                  Sequência: {player.streak} dias
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{player.bestWpm} PPM</p>
                          <p className="text-sm text-slate-600">{player.accuracy}% precisão</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accuracy">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {leaderboard
                  .sort((a, b) => b.accuracy - a.accuracy)
                  .map((player, index) => {
                    const isCurrentUser = player.id === user.id;
                    return (
                      <div
                        key={player.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg",
                          isCurrentUser 
                            ? "bg-green-50 border-2 border-green-200" 
                            : "bg-slate-50 border border-slate-200"
                        )}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            index === 0 ? "bg-yellow-500 text-white" :
                            index === 1 ? "bg-slate-400 text-white" :
                            index === 2 ? "bg-orange-600 text-white" :
                            "bg-slate-300 text-slate-700"
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {player.username} {isCurrentUser && "(Você)"}
                            </p>
                            <p className="text-sm text-slate-600">{player.bestWpm} PPM</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{player.accuracy}%</p>
                          <p className="text-sm text-slate-500">precisão</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streak">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {leaderboard
                  .sort((a, b) => b.streak - a.streak)
                  .map((player, index) => {
                    const isCurrentUser = player.id === user.id;
                    return (
                      <div
                        key={player.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg",
                          isCurrentUser 
                            ? "bg-orange-50 border-2 border-orange-200" 
                            : "bg-slate-50 border border-slate-200"
                        )}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            index === 0 ? "bg-yellow-500 text-white" :
                            index === 1 ? "bg-slate-400 text-white" :
                            index === 2 ? "bg-orange-600 text-white" :
                            "bg-slate-300 text-slate-700"
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {player.username} {isCurrentUser && "(Você)"}
                            </p>
                            <p className="text-sm text-slate-600">{player.bestWpm} PPM</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center space-x-2">
                          <i className="fas fa-fire text-orange-500"></i>
                          <div>
                            <p className="font-bold text-orange-600">{player.streak}</p>
                            <p className="text-sm text-slate-500">dias</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-users text-blue-600 text-xl"></i>
            </div>
            <p className="text-2xl font-bold text-slate-900">{leaderboard.length}</p>
            <p className="text-slate-600">Digitadores Ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-chart-line text-green-600 text-xl"></i>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, u) => sum + u.bestWpm, 0) / leaderboard.length) : 0}
            </p>
            <p className="text-slate-600">PPM Médio</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-trophy text-orange-600 text-xl"></i>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {leaderboard.length > 0 ? Math.max(...leaderboard.map(u => u.bestWpm)) : 0}
            </p>
            <p className="text-slate-600">Recorde Atual</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useProgress } from "@/hooks/use-progress";
import ProgressCard from "@/components/progress-card";
import JourneyCalendar from "@/components/journey-calendar";
import AchievementBadge from "@/components/achievement-badge";
import ErrorAnalysis from "@/components/error-analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export default function Dashboard() {
  const { user, completedDays, sessions, isLoading } = useProgress();
  const [, setLocation] = useLocation();

  const { data: leaderboard = [] } = useQuery<User[]>({
    queryKey: ['/api/leaderboard'],
    retry: false
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-slate-600 mt-2">Carregando seu progresso...</p>
        </div>
      </div>
    );
  }

  const handleStartTraining = () => {
    setLocation('/training');
  };

  const latestSession = sessions[0];
  const recentErrors = latestSession?.errorsData || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo de volta!</h2>
        <p className="text-slate-600">Continue sua jornada para dominar as teclas</p>
      </div>

      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProgressCard
          title="Velocidade Atual"
          value={user.currentWpm}
          unit="PPM (Palavras/min)"
          target={80}
          icon="fas fa-tachometer-alt"
          color="text-primary"
          bgColor="bg-blue-50"
        />
        <ProgressCard
          title="Precisão"
          value={user.accuracy}
          unit="% de acertos"
          target={98}
          icon="fas fa-bullseye"
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <ProgressCard
          title="Nível Atual"
          value={user.level}
          unit="Intermediário"
          target={5}
          icon="fas fa-medal"
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <ProgressCard
          title="Sequência"
          value={user.streak}
          unit="dias seguidos"
          target={30}
          icon="fas fa-fire"
          color="text-orange-500"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Journey Calendar */}
        <JourneyCalendar
          currentDay={user.currentDay}
          completedDays={completedDays}
          onDayClick={handleStartTraining}
        />

        {/* Achievements & Quick Actions */}
        <div className="space-y-6">
          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">Conquistas Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AchievementBadge
                name="Mestre da Fileira Guia"
                description="Completou o treino básico"
                icon="fas fa-trophy"
                category="milestone"
                unlocked={completedDays.includes(1)}
                unlockedAt={completedDays.includes(1) ? new Date() : undefined}
              />
              <AchievementBadge
                name="40 PPM Atingido!"
                description="Parabéns pelo progresso"
                icon="fas fa-medal"
                category="speed"
                unlocked={user.currentWpm >= 40}
                unlockedAt={user.currentWpm >= 40 ? new Date() : undefined}
              />
              <AchievementBadge
                name="Semana 1 Completa"
                description="7 dias de treino consecutivos"
                icon="fas fa-star"
                category="milestone"
                unlocked={completedDays.filter(day => day <= 7).length === 7}
                unlockedAt={completedDays.filter(day => day <= 7).length === 7 ? new Date() : undefined}
              />
            </CardContent>
          </Card>

          {/* Mini Challenge */}
          <Card className="bg-gradient-to-r from-primary to-blue-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Desafio do Dia</h3>
              <p className="text-blue-100 text-sm mb-4">
                Digite "A prática leva à perfeição" 5 vezes em menos de 30 segundos
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-200">Recompensa</p>
                  <p className="font-bold">+100 XP</p>
                </div>
                <Button
                  onClick={() => setLocation('/training')}
                  className="bg-white text-primary hover:bg-gray-100"
                  data-testid="button-accept-challenge"
                >
                  Aceitar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">Progresso Semanal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Meta Semanal</span>
                  <span className="font-medium">{completedDays.length}/7 dias</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(completedDays.length / 7) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tempo Total</span>
                  <span className="font-medium">
                    {Math.floor(user.totalTimeMinutes / 60)}h {user.totalTimeMinutes % 60}min
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">XP Total</span>
                  <span className="font-medium">{user.totalXp.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Analysis */}
      {Object.keys(recentErrors).length > 0 && (
        <ErrorAnalysis errors={recentErrors} />
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900">Ranking Semanal</CardTitle>
            <select className="text-sm border border-slate-300 rounded-lg px-3 py-1">
              <option>Esta Semana</option>
              <option>Este Mês</option>
              <option>Geral</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.id === user.id
                    ? "bg-blue-50 border-2 border-primary"
                    : index === 0
                    ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200"
                    : "bg-slate-50 border border-slate-200"
                }`}
                data-testid={`leaderboard-${index + 1}`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? "bg-yellow-500 text-white"
                        : index === 1
                        ? "bg-slate-400 text-white"
                        : index === 2
                        ? "bg-orange-600 text-white"
                        : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    {index === 0 ? <i className="fas fa-crown"></i> : index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {player.username} {player.id === user.id && "(Você)"}
                    </p>
                    <p className="text-xs text-slate-600">
                      {player.level < 2 ? "Iniciante" : 
                       player.level < 4 ? "Intermediário" : "Avançado"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{player.bestWpm} PPM</p>
                  <p className="text-xs text-slate-600">{player.accuracy}% precisão</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

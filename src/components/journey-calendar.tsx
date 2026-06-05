import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JourneyCalendarProps {
  currentDay: number;
  completedDays: number[];
  onDayClick: (day: number) => void;
}

export default function JourneyCalendar({ currentDay, completedDays, onDayClick }: JourneyCalendarProps) {
  const renderDay = (day: number) => {
    const isCompleted = completedDays.includes(day);
    const isCurrent = day === currentDay;
    const isFuture = day > currentDay;

    return (
      <button
        key={day}
        onClick={() => onDayClick(day)}
        disabled={isFuture}
        className={cn(
          "w-10 h-10 rounded-lg text-sm font-medium transition-colors",
          isCompleted && "bg-green-500 text-white hover:bg-green-600",
          isCurrent && "bg-primary text-white ring-2 ring-primary ring-offset-2",
          isFuture && "bg-slate-100 text-slate-400 cursor-not-allowed",
          !isCompleted && !isCurrent && !isFuture && "bg-white border border-slate-300 hover:bg-slate-50"
        )}
        data-testid={`calendar-day-${day}`}
      >
        {isCompleted ? <i className="fas fa-check text-xs"></i> : day}
      </button>
    );
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Jornada de 30 Dias
          </CardTitle>
          <span className="text-sm text-slate-500">Dia {currentDay} de 30</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {/* Headers */}
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-slate-500 p-2">
              {day}
            </div>
          ))}
          
          {/* Days */}
          {Array.from({ length: 30 }, (_, index) => renderDay(index + 1))}
        </div>

        {/* Current Lesson Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            Lição de Hoje - Dia {currentDay}
          </h4>
          <p className="text-sm text-blue-700 mb-3">
            {currentDay <= 2 && "Domine a fileira guia (ASDF JKLÇ)"}
            {currentDay >= 3 && currentDay <= 4 && "Pratique palavras e frases simples"}
            {currentDay >= 5 && currentDay <= 7 && "Textos com números e símbolos"}
            {currentDay > 7 && "Continue aperfeiçoando sua velocidade"}
          </p>
          <Button 
            onClick={() => onDayClick(currentDay)}
            className="bg-primary text-white hover:bg-blue-600"
            data-testid="button-start-training"
          >
            Iniciar Treino <i className="fas fa-arrow-right ml-2"></i>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

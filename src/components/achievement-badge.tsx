import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked?: boolean;
  unlockedAt?: Date;
}

export default function AchievementBadge({ 
  name, 
  description, 
  icon, 
  category, 
  unlocked = false,
  unlockedAt 
}: AchievementBadgeProps) {
  const getCategoryColors = (category: string) => {
    switch (category) {
      case 'speed':
        return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' };
      case 'accuracy':
        return { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' };
      case 'streak':
        return { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600' };
      case 'milestone':
        return { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600' };
      default:
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-600' };
    }
  };

  const colors = getCategoryColors(category);

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      unlocked ? `${colors.bg} ${colors.border}` : "bg-slate-50 border-slate-200 opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            unlocked ? colors.bg : "bg-slate-200"
          )}>
            <i className={cn(
              icon,
              "text-sm",
              unlocked ? colors.icon : "text-slate-400"
            )}></i>
          </div>
          <div className="flex-1">
            <p className={cn(
              "font-medium text-sm",
              unlocked ? "text-slate-900" : "text-slate-500"
            )} data-testid={`achievement-${name.toLowerCase().replace(/\s+/g, '-')}`}>
              {name}
            </p>
            <p className={cn(
              "text-xs",
              unlocked ? "text-slate-600" : "text-slate-400"
            )}>
              {description}
            </p>
            {unlocked && unlockedAt && (
              <p className="text-xs text-slate-500 mt-1">
                Desbloqueado em {unlockedAt.toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

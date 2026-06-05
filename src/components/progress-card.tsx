import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressCardProps {
  title: string;
  value: number;
  unit: string;
  target: number;
  icon: string;
  color: string;
  bgColor: string;
}

export default function ProgressCard({ 
  title, 
  value, 
  unit, 
  target, 
  icon, 
  color, 
  bgColor 
}: ProgressCardProps) {
  const percentage = (value / target) * 100;

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className={`text-3xl font-bold ${color}`} data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
            <p className="text-xs text-slate-500">{unit}</p>
          </div>
          <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
            <i className={`${icon} ${color} text-xl`}></i>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-slate-500 mt-1">Meta: {target} {unit.split(' ')[0]}</p>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ErrorAnalysisProps {
  errors: Record<string, number>;
  className?: string;
}

export default function ErrorAnalysis({ errors, className }: ErrorAnalysisProps) {
  const sortedErrors = Object.entries(errors)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5 errors

  const maxErrors = sortedErrors.length > 0 ? sortedErrors[0][1] : 1;

  const getImprovementTip = (char: string, errorCount: number) => {
    const tips: Record<string, string> = {
      'r': 'Pratique palavras com "R": carro, torre, erro, ferro',
      '$': 'Símbolos especiais: Use o dedo mindinho direito para "$"',
      ',': 'Vírgula: Use o dedo médio direito (dedo do K)',
      '.': 'Ponto: Use o dedo anelar direito (dedo do L)',
      'ç': 'Ç: Use o dedo mindinho direito, é a última tecla da fileira guia'
    };

    return tips[char.toLowerCase()] || `Pratique mais a tecla "${char.toUpperCase()}" - dedique 2 minutos extras hoje`;
  };

  if (sortedErrors.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-slate-900">Análise de Erros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-check-circle text-green-500 text-4xl mb-4"></i>
            <p className="text-slate-600">Excelente! Nenhum erro registrado nesta sessão.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-slate-900">Análise de Erros - Última Sessão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Error Chart */}
          <div>
            <h4 className="font-medium text-slate-700 mb-3">Teclas com Mais Erros</h4>
            <div className="space-y-3">
              {sortedErrors.map(([char, count], index) => (
                <div key={char} className="flex items-center justify-between">
                  <span 
                    className="text-sm font-mono bg-slate-100 px-2 py-1 rounded"
                    data-testid={`error-char-${char}`}
                  >
                    {char === ' ' ? 'ESPAÇO' : char.toUpperCase()}
                  </span>
                  <div className="flex-1 mx-3">
                    <Progress 
                      value={(count / maxErrors) * 100} 
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm text-slate-600" data-testid={`error-count-${char}`}>
                    {count} erro{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Improvement Tips */}
          <div>
            <h4 className="font-medium text-slate-700 mb-3">Dicas para Melhoria</h4>
            <div className="space-y-3">
              {sortedErrors.slice(0, 3).map(([char, count], index) => {
                const colors = [
                  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' },
                  { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-600' },
                  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-600' }
                ];
                const color = colors[index] || colors[0];
                
                return (
                  <div 
                    key={char} 
                    className={`${color.bg} ${color.border} border rounded-lg p-3`}
                  >
                    <p className={`text-sm ${color.text}`}>
                      <i className={`fas fa-lightbulb ${color.icon} mr-2`}></i>
                      {getImprovementTip(char, count)}
                    </p>
                  </div>
                );
              })}
              
              {sortedErrors.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800">
                    <i className="fas fa-clock text-purple-600 mr-2"></i>
                    Pratique por 5 minutos extras hoje focando nessas teclas
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { trackGrowthEvent } from '../growth/growthLogger';

export default function DemoPage() {
  const [step, setStep] = useState<'input' | 'processing' | 'result'>('input');
  const [transcript] = useState(
    `[João] Então ficou acordado que a gente entrega o layout na semana que vem, né?\n[Maria] Sim, mas depende do time de marketing me passar a logo nova.\n[João] Beleza, se eles passarem, a gente entrega. E o pagamento?\n[Maria] Pode ser 50% agora e o restante depois, ou a gente acerta tudo no final, vemos depois.`
  );

  const handleGenerate = () => {
    setStep('processing');
    trackGrowthEvent('demo_cta_clicked', { stage: 'processing' });
    setTimeout(() => {
      setStep('result');
      trackGrowthEvent('demo_opened', { stage: 'completed' });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl w-full">
        {/* Progresso */}
        <div className="flex justify-between items-center mb-8 px-4">
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            ToDeAcordo Demo
          </span>
          <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">
            Fluxo de 60 Segundos
          </span>
        </div>

        {/* Card Principal */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden min-h-[480px] flex flex-col md:flex-row">
          
          {/* Lado Esquerdo: Input / Transcrição */}
          <div className="flex-1 p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
            <div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-bold uppercase tracking-wider mb-4 inline-block">
                Transcrição Confusa de Reunião
              </span>
              <h2 className="text-2xl font-bold mb-4 text-slate-100">O que a IA escuta:</h2>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line bg-slate-950 p-4 rounded-xl font-mono text-xs border border-slate-900/50">
                {transcript}
              </p>
            </div>

            {step === 'input' && (
              <button 
                onClick={handleGenerate}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95 text-center text-sm"
              >
                🪄 Gerar Entendimento com IA
              </button>
            )}

            {step === 'processing' && (
              <div className="mt-6 flex items-center justify-center gap-3 py-4 text-indigo-400 text-sm font-semibold">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processando Ambiguidade...
              </div>
            )}

            {step === 'result' && (
              <div className="mt-6 text-xs text-slate-500 text-center font-mono">
                Análise concluída em 1.8s.
              </div>
            )}
          </div>

          {/* Lado Direito: Resultados / Ação */}
          <div className="flex-1 p-8 md:p-12 bg-slate-900/50 flex flex-col justify-center">
            {step === 'input' && (
              <div className="text-center py-12">
                <span className="text-4xl">🔮</span>
                <h3 className="text-lg font-bold text-slate-300 mt-4 mb-2">Pronto para Mapear</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">Clique no botão para alinhar prazos, identificar riscos operacionais e obter o aceite da contraparte.</p>
              </div>
            )}

            {step === 'processing' && (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                <div className="h-4 bg-slate-800 rounded"></div>
                <div className="h-4 bg-slate-800 rounded w-5/6"></div>
              </div>
            )}

            {step === 'result' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <span className="text-[10px] bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded font-bold uppercase mb-2 inline-block">
                    🚨 2 Riscos Operacionais Detectados
                  </span>
                  <ul className="text-xs text-slate-400 space-y-2">
                    <li>• <b>Prazo Vago</b>: "semana que vem" sem data fixa estipulada.</li>
                    <li>• <b>Pagamento Indefinido</b>: "vemos depois" deixa brecha de inadimplência.</li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                  <span className="text-indigo-400 font-bold block mb-1">Entendimento Gerado:</span>
                  <p className="text-slate-300">1. Layout v1 entregue condicionado ao recebimento do logotipo.</p>
                  <p className="text-slate-300 mt-1">2. Responsável: João Silva.</p>
                </div>

                {/* Unicorn CTA de 3 Créditos */}
                <div className="bg-gradient-to-br from-indigo-900 to-purple-950 p-6 rounded-2xl border border-indigo-800/40 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl">🦄</div>
                  <h4 className="font-bold text-sm text-white mb-1">Evite mal-entendidos nas suas reuniões</h4>
                  <p className="text-indigo-200 text-[11px] mb-4">Ganhando 3 créditos de entendimento operacional na sua conta agora.</p>
                  <a 
                    href="/?ref=demo-flow&utm_source=todeacordo&utm_medium=demo_flow&utm_campaign=shared_consensus"
                    className="w-full bg-white hover:bg-slate-100 text-indigo-950 font-bold py-2.5 rounded-lg transition-transform active:scale-95 text-center text-xs block"
                  >
                    Resgatar meus 3 Créditos
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="text-center mt-6">
          <a href="/" className="text-xs text-slate-500 hover:text-slate-400 underline">
            Voltar para o site principal
          </a>
        </div>
      </div>
    </div>
  );
}

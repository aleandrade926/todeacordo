import { useState } from 'react';

export default function PublicRoaster() {
  const [text, setText] = useState('');
  const [roasted, setRoasted] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleRoast = () => {
    if (!text) return;
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setRoasted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-20 px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white mb-4 text-center">O Roast da sua Reunião</h1>
        <p className="text-lg text-slate-400 mb-12 text-center max-w-2xl mx-auto">Cole o resumo da sua última call e veja o que a nossa IA acha das suas promessas vazias.</p>

        {!roasted ? (
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
            <textarea 
              value={text} 
              onChange={e => setText(e.target.value)} 
              placeholder="Ex: Alinhamos que vamos entregar a primeira versão semana que vem. O design fica pro João dar uma olhada depois."
              className="w-full h-48 bg-slate-900 border border-slate-600 rounded-xl p-4 text-white focus:border-indigo-500 outline-none mb-6 resize-none"
            />
            <button onClick={handleRoast} disabled={analyzing} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50">
              {analyzing ? '🔥 Achando os buracos no escopo...' : '🔥 Fazer o Roast'}
            </button>
          </div>
        ) : (
          <div className="bg-slate-800 p-8 rounded-3xl border border-red-500 shadow-xl shadow-red-900/20">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-5xl">🚨</span>
              <div>
                <h3 className="text-2xl font-bold text-white">Score de Clareza: 22/100</h3>
                <p className="text-red-400">Um desastre esperando para acontecer.</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="bg-red-900/20 border border-red-800/50 p-4 rounded-xl">
                <p className="text-red-300 font-bold mb-1">Risco Detectado: Prazos Falsos</p>
                <p className="text-slate-400 text-sm">"Semana que vem" não é um prazo. É terça? É sexta às 18h?</p>
              </div>
              <div className="bg-red-900/20 border border-red-800/50 p-4 rounded-xl">
                <p className="text-red-300 font-bold mb-1">Risco Detectado: Responsabilidade Vaga</p>
                <p className="text-slate-400 text-sm">"Pro João dar uma olhada". O João sabe disso? Ele vai revisar ou aprovar?</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-8 text-center">
              <p className="text-white font-bold mb-4">Pare de fechar acordos assim.</p>
              <a href="/waitlist" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-colors inline-block">
                Instalar Extensão (Beta)
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

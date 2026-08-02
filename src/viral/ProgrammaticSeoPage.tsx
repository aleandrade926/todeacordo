import { useCases } from '../data/useCases';

export default function ProgrammaticSeoPage() {
  const slug = window.location.pathname.split('/').pop();
  const useCase = useCases.find(uc => uc.slug === slug) || useCases[0];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase mb-6 border border-indigo-500/30">
            {useCase.persona}
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            {useCase.title}
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            {useCase.pain}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href={`/demo/${useCase.slug}`} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-xl shadow-xl shadow-indigo-600/20 transition-transform active:scale-95 text-lg">
              Ver Demo: {useCase.cta}
            </a>
            <a href="/waitlist" className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg">
              Entrar no Beta Grátis
            </a>
          </div>
        </div>
      </section>

      {/* Before / After Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Before */}
          <div className="bg-red-50 p-8 rounded-3xl border border-red-100">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">✕</span>
              <h3 className="text-2xl font-bold text-red-900">Como é hoje (O Risco)</h3>
            </div>
            <div className="font-mono text-sm bg-white p-6 rounded-xl border border-red-100 whitespace-pre-wrap text-slate-600 leading-relaxed shadow-sm">
              {useCase.beforeTranscript}
            </div>
            <p className="mt-4 text-red-700 font-medium text-sm">
              Resultado: Semanas depois, o cliente exige algo que não estava no escopo, gerando retrabalho ou prejuízo.
            </p>
          </div>

          {/* After */}
          <div className="bg-green-50 p-8 rounded-3xl border border-green-100">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">✓</span>
              <h3 className="text-2xl font-bold text-green-900">Com ToDeAcordo</h3>
            </div>
            <div className="font-mono text-sm bg-white p-6 rounded-xl border border-green-200 shadow-lg shadow-green-100/50 whitespace-pre-wrap text-slate-800 leading-relaxed border-l-4 border-l-green-500">
              {useCase.afterConsensus}
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-bold">🟢 Validado pelo Cliente</span>
            </div>
            <p className="mt-4 text-green-800 font-medium text-sm">
              Resultado: As duas partes confirmam o entendimento na mesma hora. Sem margem para interpretações.
            </p>
          </div>
        </div>
      </section>
      
      {/* Feature Vote */}
      <section className="bg-slate-50 py-20 px-6 border-t border-slate-200">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Ajude a moldar o futuro</h3>
          <p className="text-slate-500 mb-6 text-sm">Qual recurso é mais crítico para o seu dia a dia?</p>
          {/* FeatureVote import here if connected */}
        </div>
      </section>
    </div>
  );
}

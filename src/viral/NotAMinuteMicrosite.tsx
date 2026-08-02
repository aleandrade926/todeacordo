export default function NotAMinuteMicrosite() {
  return (
    <div className="min-h-screen bg-[#111827] text-slate-200 py-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-block bg-red-500/20 text-red-400 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase mb-6 border border-red-500/30">
          Manifesto
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8">
          Ata de reunião morreu.
        </h1>
        <p className="text-xl text-slate-400 mb-16 max-w-2xl mx-auto leading-relaxed">
          Ninguém lê. Ninguém responde. E quando o escopo estoura, ela não te defende.
        </p>

        <div className="grid md:grid-cols-2 gap-8 text-left mb-16">
          <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700">
            <h3 className="text-2xl font-bold text-slate-400 mb-6 flex items-center gap-2"><span className="text-slate-500">❌</span> A Era da Ata</h3>
            <ul className="space-y-4 text-slate-400">
              <li className="flex items-start gap-3"><span>→</span> Registra o passado ("Fulano disse X").</li>
              <li className="flex items-start gap-3"><span>→</span> É um e-mail longo e morto.</li>
              <li className="flex items-start gap-3"><span>→</span> Aceite presumido (Se não reclamar, aceitou).</li>
            </ul>
          </div>
          <div className="bg-indigo-900/20 p-8 rounded-3xl border border-indigo-500/30">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><span className="text-indigo-400">✅</span> A Era do ToDeAcordo</h3>
            <ul className="space-y-4 text-indigo-200">
              <li className="flex items-start gap-3"><span>→</span> Foca no futuro ("Fulano fará X até o dia Y").</li>
              <li className="flex items-start gap-3"><span>→</span> É um link seguro de validação.</li>
              <li className="flex items-start gap-3"><span>→</span> Aceite explícito (Com Rubrica e Hash).</li>
            </ul>
          </div>
        </div>

        <a href="/waitlist" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-10 rounded-xl transition-transform active:scale-95 text-lg inline-block">
          Junte-se à Revolução (Beta)
        </a>
      </div>
    </div>
  );
}

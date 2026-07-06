export default function CompetitorPositioning() {
  const competitor = window.location.pathname.split('/').pop()?.replace(/-/g, ' ');
  
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-block bg-slate-200 text-slate-700 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase mb-6">
          ToDeAcordo vs {competitor}
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-8 capitalize">
          Por que o ToDeAcordo é diferente do {competitor}?
        </h1>
        <p className="text-xl text-slate-500 mb-16 max-w-2xl mx-auto leading-relaxed">
          Ferramentas de transcrição ajudam você a <strong className="text-slate-800">lembrar</strong> o que foi dito. O ToDeAcordo ajuda você a <strong className="text-slate-800">validar</strong> o que foi combinado.
        </p>

        <div className="grid md:grid-cols-2 gap-8 text-left mb-16">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-400 mb-6 capitalize">{competitor} (Transcrição)</h3>
            <ul className="space-y-4 text-slate-500">
              <li className="flex items-start gap-3"><span>🎙️</span> Foca em gravar áudio/vídeo.</li>
              <li className="flex items-start gap-3"><span>📝</span> Gera um bloco de texto gigante.</li>
              <li className="flex items-start gap-3"><span>🤖</span> O bot entra na sala (Assusta o cliente).</li>
              <li className="flex items-start gap-3"><span>🤷‍♂️</span> O cliente não assina nem concorda com nada.</li>
            </ul>
          </div>
          <div className="bg-indigo-600 p-8 rounded-3xl border border-indigo-500 shadow-xl text-white">
            <h3 className="text-2xl font-bold mb-6">ToDeAcordo (Consensus Closing)</h3>
            <ul className="space-y-4 text-indigo-100">
              <li className="flex items-start gap-3"><span>🤫</span> Sem áudio. Lê legendas. Invisível.</li>
              <li className="flex items-start gap-3"><span>🎯</span> Gera só obrigações, riscos e prazos.</li>
              <li className="flex items-start gap-3"><span>🔗</span> Cria um link validável.</li>
              <li className="flex items-start gap-3"><span>✍️</span> O cliente clica, assina e sela o escopo.</li>
            </ul>
          </div>
        </div>

        <a href="/waitlist" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-xl transition-transform active:scale-95 text-lg inline-block">
          Testar ToDeAcordo (Beta)
        </a>
      </div>
    </div>
  );
}

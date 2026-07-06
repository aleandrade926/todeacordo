export default function BeforeAfterLab() {
  const examples = [
    {
      bad: "Depois vemos isso.",
      good: "Responsável: não identificado. Prazo: não definido. Risco: Alto."
    },
    {
      bad: "Fica combinado então que vocês entregam semana que vem.",
      good: "Obrigação: Entregar [O Quê?]. Prazo: Semana que vem (Dia X). Risco: Escopo aberto."
    },
    {
      bad: "Dá pra fazer sim.",
      good: "Obrigação assumida verbalmente, mas não formalizada no escopo de faturamento."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 text-center">O Laboratório do Mal-Entendido</h1>
        <p className="text-lg text-slate-500 mb-16 text-center max-w-2xl mx-auto">Veja como a nossa IA traduz frases perigosas em trilhas de auditoria claras.</p>

        <div className="grid gap-8">
          {examples.map((ex, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 bg-red-50 p-6 rounded-2xl w-full">
                <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">O que você ouve</div>
                <div className="text-xl text-slate-800 font-medium italic">"{ex.bad}"</div>
              </div>
              <div className="text-4xl text-slate-300">→</div>
              <div className="flex-1 bg-indigo-50 p-6 rounded-2xl w-full border border-indigo-100">
                <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">O que o ToDeAcordo lê</div>
                <div className="text-slate-800 font-medium">{ex.good}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a href="/waitlist" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-xl transition-transform active:scale-95 text-lg inline-block">
            Quero testar nas minhas reuniões
          </a>
        </div>
      </div>
    </div>
  );
}

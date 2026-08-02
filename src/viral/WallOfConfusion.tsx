export default function WallOfConfusion() {
  const cards = [
    { text: "Depois a gente vê como fica essa parte.", risk: "Escopo aberto de alta periculosidade." },
    { text: "Acho que dá pra fazer.", risk: "Dá pra fazer não significa que está no orçamento atual." },
    { text: "Fica combinado então.", risk: "O que ficou combinado? Zero detalhamento." },
    { text: "Semana que vem eu te dou um toque.", risk: "Efeito 'Ghosting' potencializado." }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] py-20 px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black text-slate-900 mb-4 text-center tracking-tight">O Mural da Confusão</h1>
        <p className="text-lg text-slate-500 mb-16 text-center max-w-2xl mx-auto">As frases mais perigosas faladas diariamente em reuniões corporativas.</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {cards.map((c, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 transform transition hover:-translate-y-1">
              <p className="text-xl font-medium text-slate-800 italic mb-6">"{c.text}"</p>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Risco Detectado</p>
                <p className="text-sm text-slate-600">{c.risk}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-indigo-600 p-12 rounded-3xl shadow-xl text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ouviu algo pior hoje?</h2>
          <p className="text-indigo-200 mb-8">Envie a pérola que você ouviu na última call e ajude nossa IA a detectar os piores mal-entendidos.</p>
          <form onSubmit={e => { e.preventDefault(); alert('Enviado!'); }} className="max-w-md mx-auto flex flex-col gap-4">
            <input required placeholder="Digite a frase aqui..." className="w-full bg-indigo-700/50 border border-indigo-400 rounded-xl p-4 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white" />
            <button type="submit" className="bg-white text-indigo-900 font-bold py-4 rounded-xl shadow hover:bg-slate-50 transition-colors">
              Adicionar ao Mural
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

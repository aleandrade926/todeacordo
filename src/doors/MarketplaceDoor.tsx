import { OpportunityLogger } from './opportunityDoors';

export default function MarketplaceDoor() {
  const templates = [
    { name: 'Reunião com Cliente', desc: 'Extração de pendências pós-call.' },
    { name: 'Proposta Comercial', desc: 'Acordo verbal em escopo firme.' },
    { name: 'Obra & Reforma', desc: 'Evitar o "eu pedi da cor azul".' },
    { name: 'Diagnóstico Tributário', desc: 'Combinados financeiros.' },
    { name: 'Alinhamento de Equipe', desc: 'Responsáveis por demandas internas.' }
  ];

  const handleUse = (name: string) => {
    OpportunityLogger.logOpportunity({
      type: 'integration', // Usando tag genérica para contagem
      name: `Template Request: ${name}`,
      email: 'user@template.com'
    });
    alert('Redirecionando para demonstração simulada... (Feature Capture logado)');
    window.location.href = `/demo/${name.toLowerCase().replace(/ /g, '-')}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 py-20 px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 text-center">Templates de Entendimento</h1>
        <p className="text-lg text-slate-500 mb-12 text-center">Comece não do zero, mas do contexto certo para o seu negócio.</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-2">{tpl.name}</h3>
              <p className="text-slate-500 text-sm mb-6 h-10">{tpl.desc}</p>
              <button onClick={() => handleUse(tpl.name)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg transition-colors">
                Usar este template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

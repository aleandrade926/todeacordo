import { useState } from 'react';
import { OpportunityLogger } from './opportunityDoors';

export default function ApiDoor() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    OpportunityLogger.logOpportunity({
      type: 'api',
      name: 'B2B API Request',
      email: 'api@company.com',
      volume: '1000+'
    });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 py-20 px-6 font-sans">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-block bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase mb-6 border border-blue-500/30">
          Para Desenvolvedores & Produto
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6">Integre a Máquina de Entendimentos</h1>
        <p className="text-xl text-slate-400 mb-12">Quer gerar relatórios de consenso direto do seu CRM, app de telemedicina ou plataforma educacional via API REST?</p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl text-left max-w-xl mx-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Seu E-mail Corporativo</label>
                <input required type="email" placeholder="nome@suaempresa.com" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Volume Mensal (Estimativa de Calls)</label>
                <select className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none">
                  <option>Até 100 reuniões/mês</option>
                  <option>100 a 1.000 reuniões/mês</option>
                  <option>Mais de 1.000 reuniões/mês</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Qual é o Caso de Uso?</label>
                <input required type="text" placeholder="Ex: CRM Imobiliário" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-6 transition-colors">
                Solicitar Acesso Antecipado à API
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-blue-900/30 border border-blue-500/50 p-8 rounded-3xl text-center">
            <span className="text-4xl mb-4 block">✅</span>
            <h3 className="text-2xl font-bold text-white mb-2">Pedido na fila!</h3>
            <p className="text-blue-200">A documentação da API REST será enviada em breve para o seu e-mail.</p>
          </div>
        )}
      </div>
    </div>
  );
}

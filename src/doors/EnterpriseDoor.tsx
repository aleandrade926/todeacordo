import { useState } from 'react';
import { OpportunityLogger } from './opportunityDoors';

export default function EnterpriseDoor() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    OpportunityLogger.logOpportunity({
      type: 'enterprise',
      name: 'Enterprise Request',
      email: 'corp@enterprise.com'
    });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6 font-sans">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-6">Proteja a operação de toda a empresa.</h1>
          <p className="text-xl text-slate-600 mb-8">Gestão unificada de times, painel de auditoria, restrição de acesso e métricas globais de mal-entendidos evitados.</p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-slate-700 font-medium"><span className="text-indigo-600">✓</span> Single Sign-On (SSO / SAML)</li>
            <li className="flex items-center gap-3 text-slate-700 font-medium"><span className="text-indigo-600">✓</span> Retenção customizada de dados</li>
            <li className="flex items-center gap-3 text-slate-700 font-medium"><span className="text-indigo-600">✓</span> Integração nativa com Salesforce</li>
            <li className="flex items-center gap-3 text-slate-700 font-medium"><span className="text-indigo-600">✓</span> Suporte dedicado</li>
          </ul>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Fale com Vendas</h3>
            <div className="space-y-4">
              <input required type="text" placeholder="Nome" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500" />
              <input required type="email" placeholder="E-mail Corporativo" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500" />
              <input required type="text" placeholder="Empresa" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500" />
              <select className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500">
                <option>10 a 50 usuários</option>
                <option>51 a 200 usuários</option>
                <option>Mais de 200 usuários</option>
              </select>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl mt-4 transition-colors">
                Agendar Reunião
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-3xl text-center">
            <h3 className="text-2xl font-bold text-indigo-900 mb-2">Mensagem Recebida</h3>
            <p className="text-indigo-700">Um executivo de contas entrará em contato em breve.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { OpportunityLogger } from './opportunityDoors';

export default function PartnerDoor() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    OpportunityLogger.logOpportunity({
      type: 'partner',
      name: 'Partner Request',
      email: 'partner@indica.com'
    });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-indigo-50 py-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-black text-indigo-900 mb-6">Programa de Embaixadores</h1>
        <p className="text-xl text-indigo-700 mb-12">Indique o ToDeAcordo para clientes que viveem de reunião e gere receita recorrente.</p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-100 max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Inscreva-se</h3>
            <div className="space-y-4">
              <input required type="text" placeholder="Nome" className="w-full bg-indigo-50 border border-indigo-200 rounded-lg p-3 outline-none focus:border-indigo-500" />
              <input required type="email" placeholder="E-mail" className="w-full bg-indigo-50 border border-indigo-200 rounded-lg p-3 outline-none focus:border-indigo-500" />
              <input type="text" placeholder="LinkedIn ou Site (Opcional)" className="w-full bg-indigo-50 border border-indigo-200 rounded-lg p-3 outline-none focus:border-indigo-500" />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl mt-4 transition-colors">
                Quero ser Parceiro Oficial
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-green-200 max-w-lg mx-auto">
            <h3 className="text-2xl font-bold text-green-600 mb-2">Inscrição Recebida!</h3>
            <p className="text-slate-600">Avisaremos assim que liberarmos o seu painel de afiliado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

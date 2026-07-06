import { useState } from 'react';
import { OpportunityLogger } from './opportunityDoors';

export default function WhiteLabelDoor() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    OpportunityLogger.logOpportunity({
      type: 'white_label',
      name: 'White Label Request',
      email: 'wl@agency.com'
    });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white py-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-black mb-6">Sua Marca. Nosso Motor.</h1>
        <p className="text-xl text-slate-400 mb-12">Ofereça prevenção de mal-entendidos para os seus clientes, com o seu logo, suas cores e no seu domínio.</p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl max-w-lg mx-auto">
            <h3 className="text-xl font-bold mb-6">Lista de Espera: White Label</h3>
            <div className="space-y-4">
              <input required type="text" placeholder="Nome da Franquia/Agência" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 outline-none focus:border-indigo-500" />
              <input required type="email" placeholder="E-mail" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 outline-none focus:border-indigo-500" />
              <select className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 outline-none focus:border-indigo-500">
                <option>Escritório de Advocacia</option>
                <option>Agência de Marketing</option>
                <option>Consultoria</option>
                <option>Outros</option>
              </select>
              <button type="submit" className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl mt-4 transition-transform active:scale-95">
                Entrar na Fila de Prioridade
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-slate-800 p-8 rounded-3xl border border-green-500 max-w-lg mx-auto">
            <h3 className="text-2xl font-bold text-green-400 mb-2">Interesse Registrado</h3>
            <p className="text-slate-300">Nossa equipe entrará em contato quando o programa for lançado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

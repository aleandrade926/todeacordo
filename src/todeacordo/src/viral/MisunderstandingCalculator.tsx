import { useState } from 'react';

export default function MisunderstandingCalculator() {
  const [contractValue, setContractValue] = useState(10000);
  const [reworkHours, setReworkHours] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(150);

  const totalMonthlyCost = (reworkHours * hourlyRate) + (contractValue * 0.05); // Assume 5% risk of churn/discount

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 py-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-white tracking-tight mb-6">Quanto custa um mal-entendido?</h1>
          <p className="text-xl text-slate-400">Calcule o prejuízo invisível das reuniões sem validação.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-700">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Valor médio do contrato (R$)</label>
                <input type="number" value={contractValue} onChange={e => setContractValue(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Horas de retrabalho no mês</label>
                <input type="number" value={reworkHours} onChange={e => setReworkHours(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Valor da sua hora (R$)</label>
                <input type="number" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-10 rounded-3xl shadow-2xl border border-indigo-500 relative overflow-hidden text-white text-center flex flex-col justify-center min-h-[400px]">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl">💸</div>
            <h3 className="text-xl font-medium text-indigo-200 mb-2 relative z-10">Prejuízo Mensal Estimado</h3>
            <div className="text-6xl font-black tracking-tight mb-4 relative z-10 text-white">
              R$ {totalMonthlyCost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
            </div>
            <p className="text-indigo-200 mb-10 relative z-10">Esse é o custo de "achar que ficou claro".</p>
            
            <a href="/waitlist" className="bg-white hover:bg-indigo-50 text-indigo-900 font-bold py-4 px-8 rounded-xl transition-transform active:scale-95 shadow-lg relative z-10 text-lg">
              Estancar o Prejuízo no Beta
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

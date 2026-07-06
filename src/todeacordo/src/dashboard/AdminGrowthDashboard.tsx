import { useEffect, useState } from 'react';

export default function AdminGrowthDashboard() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('tda_growth_events') || '[]');
    setEvents(data);
  }, []);

  const totalEvents = events.length;
  const validationsOpened = events.filter(e => e.event_name === 'validation_link_opened').length;
  const aceites = events.filter(e => e.event_name === 'accepted_with_signature').length;
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Growth OS</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm font-medium mb-1">Total de Eventos</p>
          <p className="text-4xl font-bold text-white">{totalEvents}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm font-medium mb-1">Links de Validação Abertos</p>
          <p className="text-4xl font-bold text-indigo-400">{validationsOpened}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm font-medium mb-1">Aceites Registrados</p>
          <p className="text-4xl font-bold text-green-400">{aceites}</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <h2 className="font-bold text-white">Últimos Eventos</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/50 text-slate-400">
            <tr>
              <th className="px-6 py-3 font-medium">Evento</th>
              <th className="px-6 py-3 font-medium">Data</th>
              <th className="px-6 py-3 font-medium">Origem / Referer</th>
              <th className="px-6 py-3 font-medium">UTM Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {events.slice().reverse().slice(0, 50).map((e: any) => (
              <tr key={e.id} className="hover:bg-slate-700/20">
                <td className="px-6 py-3 font-mono text-indigo-300">{e.event_name}</td>
                <td className="px-6 py-3 text-slate-400">{new Date(e.timestamp).toLocaleString()}</td>
                <td className="px-6 py-3">{e.attribution_ref || '-'}</td>
                <td className="px-6 py-3">{e.utm_source || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { getWaitlist, type WaitlistLead } from '../storage/usageStorage';

export default function AdminBetaPage() {
  const [leads, setLeads] = useState<WaitlistLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWaitlist().then(data => {
      setLeads(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8">Carregando métricas...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Dashboard Growth (Sprint Canhão)</h1>
      
      <div className="grid grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Waitlist</h3>
          <p className="text-4xl font-bold text-indigo-600">{leads.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Potencial ($29,90/mês)</h3>
          <p className="text-4xl font-bold text-green-600">R$ {(leads.length * 29.9).toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Paywalls Mais Acionados</h3>
          <p className="text-xl font-bold text-slate-800">1. PDF Oficial<br/>2. WhatsApp</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-4">Leads Capturados (Intenção de Compra)</h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500 uppercase">
            <tr>
              <th className="px-6 py-4 font-medium">Nome</th>
              <th className="px-6 py-4 font-medium">E-mail</th>
              <th className="px-6 py-4 font-medium">WhatsApp</th>
              <th className="px-6 py-4 font-medium">Perfil</th>
              <th className="px-6 py-4 font-medium">Recurso Bloqueado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map(lead => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium">{lead.name}</td>
                <td className="px-6 py-4 text-sm">{lead.email}</td>
                <td className="px-6 py-4 text-sm">{lead.whatsapp || '-'}</td>
                <td className="px-6 py-4 text-sm"><span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">{lead.role}</span></td>
                <td className="px-6 py-4 text-sm"><span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">{lead.attempted_feature || 'manual'}</span></td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhum lead capturado ainda. Espalhe o link!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

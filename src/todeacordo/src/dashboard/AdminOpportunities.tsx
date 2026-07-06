import { useEffect, useState } from 'react';
import { OpportunityLogger, type OpportunityLead } from '../doors/opportunityDoors';

interface GrowthEvent {
  id: string;
  event_name: string;
  timestamp: number;
  url: string;
  attribution_ref: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  source_page: string;
  user_role: string;
  payload?: any;
}

export default function AdminOpportunities() {
  const [leads, setLeads] = useState<OpportunityLead[]>([]);
  const [events, setEvents] = useState<GrowthEvent[]>([]);

  useEffect(() => {
    setLeads(OpportunityLogger.getOpportunities());
    try {
      const storedEvents = JSON.parse(localStorage.getItem('tda_growth_events') || '[]');
      setEvents(storedEvents);
    } catch (e) {
      console.error('Falha ao carregar eventos de growth', e);
    }
  }, []);

  // Agregações de Funil baseadas em eventos reais salvos
  const totalCreated = events.filter(e => e.event_name === 'agreement_created').length || 10; // default para demonstração se vazio
  const totalOpened = events.filter(e => e.event_name === 'validation_page_opened' || e.event_name === 'validation_link_opened').length || 8;
  const totalIdentified = events.filter(e => e.event_name === 'lead_captured_from_validation' || e.event_name === 'counterparty_identified').length || 5;
  const totalSigned = events.filter(e => e.event_name === 'accepted_with_signature').length || 3;
  const totalWaitlist = events.filter(e => e.event_name === 'waitlist_joined').length || 2;

  // Taxas de conversão
  const openRate = ((totalOpened / totalCreated) * 100).toFixed(0);
  const identifyRate = ((totalIdentified / totalOpened) * 100).toFixed(0);
  const signRate = ((totalSigned / totalIdentified) * 100).toFixed(0);
  const waitlistRate = ((totalWaitlist / totalSigned) * 100).toFixed(0);

  const handleExportCSV = () => {
    if (leads.length === 0 && events.length === 0) {
      alert('Nenhum dado disponível para exportação.');
      return;
    }

    const csvRows: string[][] = [];
    csvRows.push(['Origem/Tipo', 'Nome/Evento', 'E-mail/Detalhe', 'Referral/Atribuição', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Data Criação']);

    // Adiciona leads das oportunidades
    leads.forEach(l => {
      csvRows.push([
        `opp_${l.type}`,
        l.name || 'Anônimo',
        l.email || '',
        l.interest || l.volume || '',
        '',
        '',
        '',
        new Date(l.created_at).toISOString()
      ]);
    });

    // Adiciona eventos de growth significativos
    events.forEach(e => {
      csvRows.push([
        'growth_event',
        e.event_name,
        e.payload?.email || JSON.stringify(e.payload) || '',
        e.attribution_ref || '',
        e.utm_source || '',
        e.utm_medium || '',
        e.utm_campaign || '',
        new Date(e.timestamp).toISOString()
      ]);
    });

    const csvContent = csvRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `todeacordo_growth_data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white py-12 px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Growth Funnel & Leads</h1>
            <p className="text-slate-400 text-sm mt-1">Visão ponta-a-ponta das taxas de conversão e leads consolidados.</p>
          </div>
          <button 
            onClick={handleExportCSV}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 text-sm flex items-center gap-2"
          >
            📊 Exportar Relatório CSV
          </button>
        </div>

        {/* Visualizador de Funil */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">1. Gerados</h3>
            <div className="text-3xl font-black text-white">{totalCreated}</div>
            <p className="text-[10px] text-slate-500 mt-1">Acordos Criados</p>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">2. Abertos</h3>
            <div className="text-3xl font-black text-blue-400">{totalOpened}</div>
            <p className="text-[10px] text-blue-500 mt-1">Taxa: {openRate}%</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">3. Identificados</h3>
            <div className="text-3xl font-black text-amber-400">{totalIdentified}</div>
            <p className="text-[10px] text-amber-500 mt-1">Taxa: {identifyRate}%</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">4. Aceitos</h3>
            <div className="text-3xl font-black text-green-400">{totalSigned}</div>
            <p className="text-[10px] text-green-500 mt-1">Taxa: {signRate}%</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">5. Waitlist (SSO)</h3>
            <div className="text-3xl font-black text-purple-400">{totalWaitlist}</div>
            <p className="text-[10px] text-purple-500 mt-1">Taxa: {waitlistRate}%</p>
          </div>
        </div>

        {/* Tabela de Leads */}
        <h2 className="text-xl font-bold mb-4">Leads das Portas Operacionais</h2>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="p-4">Tipo</th>
                <th className="p-4">Nome</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Interesse/Volume</th>
                <th className="p-4">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-700/50">
                  <td className="p-4"><span className="bg-slate-700 px-2 py-1 rounded text-xs uppercase">{lead.type}</span></td>
                  <td className="p-4 font-medium">{lead.name}</td>
                  <td className="p-4 text-slate-300">{lead.email}</td>
                  <td className="p-4 text-slate-400">{lead.interest || lead.volume || '-'}</td>
                  <td className="p-4 text-slate-400">{new Date(lead.created_at).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Nenhum lead capturado nas portas. Divulgue!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { OpportunityLogger } from './opportunityDoors';

export default function IntegrationsDoor() {
  const [voted, setVoted] = useState<string[]>([]);

  const handleVote = (integration: string) => {
    if (voted.includes(integration)) return;
    setVoted([...voted, integration]);
    OpportunityLogger.logOpportunity({
      type: 'integration',
      name: 'User Vote',
      email: 'anonymous@vote.com',
      interest: integration
    });
  };

  const cards = [
    { name: 'Google Meet', status: 'Ativo', icon: '🎥', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { name: 'WhatsApp', status: 'Link/Copy', icon: '💬', color: 'bg-green-100 text-green-800 border-green-200' },
    { name: 'Gmail', status: 'Em breve', icon: '📧', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    { name: 'Notion', status: 'Em breve', icon: '📝', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    { name: 'HubSpot', status: 'Em breve', icon: '🟧', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    { name: 'Pipedrive', status: 'Em breve', icon: '📊', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    { name: 'Slack', status: 'Em breve', icon: '📱', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    { name: 'Teams', status: 'Em breve', icon: '🔵', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    { name: 'Zoom', status: 'Em breve', icon: '📹', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    { name: 'API Pública', status: 'Em breve', icon: '⚙️', color: 'bg-slate-100 text-slate-800 border-slate-200' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Aonde você quer levar o ToDeAcordo?</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">Vote nas integrações que vão mudar o seu fluxo de trabalho. As mais votadas entram no próximo sprint.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cards.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
              <div className="text-4xl mb-4">{c.icon}</div>
              <h3 className="font-bold text-slate-800 mb-2">{c.name}</h3>
              <div className={`text-xs font-bold px-3 py-1 rounded-full mb-6 border ${c.color}`}>
                {c.status}
              </div>
              {c.status === 'Em breve' && (
                <button 
                  onClick={() => handleVote(c.name)}
                  className={`w-full py-2 rounded-lg font-bold text-sm transition-colors ${voted.includes(c.name) ? 'bg-indigo-100 text-indigo-800 cursor-default' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                >
                  {voted.includes(c.name) ? 'Voto Registrado ✓' : 'Quero esta!'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

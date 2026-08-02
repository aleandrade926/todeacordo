import { useEffect, useState } from 'react';
import { getConsensusForMeeting } from '../storage/consensusStorage';
import type { ConsensusObject } from '../types';

export default function ShareCardPage() {
  const [consensus, setConsensus] = useState<ConsensusObject | null>(null);

  useEffect(() => {
    const id = window.location.pathname.split('/').pop();
    if (id && !id.startsWith('demo')) {
      getConsensusForMeeting(id).then(data => {
        if (data) setConsensus(data);
      });
    }
  }, []);

  if (!consensus) return <div className="p-10 text-center text-slate-500">Card Preview (OG Image Render)</div>;

  return (
    <div className="w-[1200px] h-[630px] bg-slate-900 flex items-center justify-center p-12 text-white font-sans">
      <div className="w-full h-full bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative BG */}
        <div className="absolute top-0 right-0 p-32 opacity-5 pointer-events-none text-9xl">✨</div>
        
        <div>
          <div className="flex items-center gap-4 mb-8">
            <span className="bg-indigo-600 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase">Entendimento Gerado</span>
            {consensus.traffic_light === 'green' && <span className="bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-sm font-bold">🟢 Pronto para assinar</span>}
            {consensus.traffic_light === 'yellow' && <span className="bg-yellow-500/20 text-yellow-400 px-4 py-1.5 rounded-full text-sm font-bold">🟡 Atenção Necessária</span>}
          </div>
          
          <h1 className="text-6xl font-extrabold tracking-tight mb-6 leading-tight">{consensus.title || 'Reunião de Alinhamento'}</h1>
          <p className="text-2xl text-slate-400 mb-12 max-w-4xl line-clamp-2">{consensus.summary}</p>

          <div className="flex gap-8">
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700 min-w-[200px]">
              <div className="text-4xl font-bold text-indigo-400 mb-2">{consensus.agreements?.length || 0}</div>
              <div className="text-slate-400 font-medium uppercase tracking-widest text-sm">Decisões</div>
            </div>
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700 min-w-[200px]">
              <div className="text-4xl font-bold text-amber-400 mb-2">{consensus.obligations?.length || 0}</div>
              <div className="text-slate-400 font-medium uppercase tracking-widest text-sm">Obrigações</div>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-slate-700 pt-8 mt-12">
          <div>
            <p className="text-slate-500 text-lg">Participantes</p>
            <p className="text-xl font-medium mt-1">{consensus.participants?.join(', ') || 'Equipe'}</p>
          </div>
          <div className="text-right flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl">🤝</div>
            <div>
              <p className="text-xl font-bold text-white">ToDeAcordo</p>
              <p className="text-slate-400">Reuniões sem mal-entendido.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

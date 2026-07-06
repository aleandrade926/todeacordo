import { useState } from 'react';
import { trackGrowthEvent } from '../growth/growthLogger';

interface FeatureVoteProps {
  source: 'landing' | 'paywall' | 'validation' | 'demo' | 'extension';
  onVoteSubmitted?: () => void;
}

export const FeatureVote = ({ source, onVoteSubmitted }: FeatureVoteProps) => {
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const features = [
    { id: 'pdf_corporativo', label: 'PDF profissional com minha logo' },
    { id: 'link_validacao', label: 'Link de validação' },
    { id: 'rubrica_hash', label: 'Rubrica de confirmação (Assinatura Visual)' },
    { id: 'whatsapp_pronto', label: 'Disparo via WhatsApp' },
    { id: 'historico', label: 'Histórico na nuvem infinito' },
    { id: 'evidencias', label: 'Evidências por frase (Transcrição linkada)' },
    { id: 'equipe', label: 'Acesso para equipe' },
    { id: 'templates', label: 'Templates por profissão' },
    { id: 'integracao_agenda', label: 'Integração com Agenda' },
    { id: 'integracao_crm', label: 'Integração com CRM' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    
    trackGrowthEvent('feature_vote_submitted', { source, feature_id: selected });
    setSubmitted(true);
    if (onVoteSubmitted) onVoteSubmitted();
  };

  if (submitted) {
    return (
      <div className="bg-green-50 text-green-800 p-4 rounded-lg text-sm text-center font-medium">
        Voto computado! Isso nos ajuda a decidir o que construir primeiro.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-bold text-slate-800 mb-2">
        O que faria você pagar pelo ToDeAcordo?
      </label>
      <select 
        required 
        value={selected} 
        onChange={e => setSelected(e.target.value)} 
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
      >
        <option value="" disabled>Escolha o recurso mais importante...</option>
        {features.map(f => (
          <option key={f.id} value={f.id}>{f.label}</option>
        ))}
      </select>
      <button 
        type="submit" 
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg shadow mt-2 transition-transform active:scale-95"
      >
        Votar neste recurso
      </button>
    </form>
  );
};

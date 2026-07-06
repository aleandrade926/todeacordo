import { useState } from 'react';
import { addLeadToWaitlist } from '../storage/usageStorage';
import { useUsage } from '../hooks/useUsage';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  attemptedFeature: string;
  sourceMeetingId?: string;
}

export const PaywallModal = ({ isOpen, onClose, attemptedFeature, sourceMeetingId }: PaywallModalProps) => {
  const { count, limit, transcriptCount, transcriptLimit } = useUsage();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    role: '',
    desired_feature: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isUnderLimit = count < limit && transcriptCount < transcriptLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await addLeadToWaitlist({
      ...formData,
      attempted_feature: attemptedFeature,
      source_meeting_id: sourceMeetingId
    });
    setLoading(false);
    setSubmitted(true);
    
    // Auto fecha depois de 3 segundos
    setTimeout(() => {
      onClose();
      setSubmitted(false); // Reseta o estado para a próxima vez
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header Premium */}
        <div className="bg-slate-900 px-6 py-6 text-center relative shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          
          <div className="mx-auto bg-gradient-to-tr from-amber-400 to-amber-200 w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3">
            <svg className="w-6 h-6 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">ToDeAcordo Pro</h2>
          
          <div className="text-indigo-200 text-xs font-semibold mb-2 bg-indigo-900/50 py-1.5 px-3 rounded-full inline-block">
            📊 Seu Uso: {count}/{limit} Entendimentos | {transcriptCount}/{transcriptLimit} Transcrições
          </div>

          {isUnderLimit ? (
            <p className="text-slate-300 text-sm px-4">
              Você está na versão Freemium e ainda possui cotas disponíveis! Se quiser, pode apoiar o desenvolvimento ou continuar grátis.
            </p>
          ) : (
            <p className="text-slate-300 text-sm px-4">
              Você atingiu a cota de uso do plano gratuito. Faça uma contribuição para continuar utilizando de forma ilimitada!
            </p>
          )}
        </div>

        {/* Body Formulário / PIX */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Sessão PIX Sonia */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-150 rounded-2xl p-4 shadow-sm text-center">
            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block mb-1">💸 APOIE O DESENVOLVIMENTO (ILIMITADO POR 30 DIAS)</span>
            <p className="text-slate-700 text-xs mb-3 leading-relaxed">
              Pague qualquer valor ou a assinatura de <strong>R$ 29,90</strong> para liberar 30 dias de uso ilimitado e ajudar a manter a ferramenta independente.
            </p>
            
            <div className="bg-white border border-slate-200 rounded-xl py-3 px-4 mb-3">
              <div className="text-xs text-slate-400 font-medium mb-1">Chave Pix (Telefone)</div>
              <div className="text-base font-black text-indigo-900 select-all font-mono">11 993725876</div>
              <div className="text-[10px] text-slate-400 mt-1">Nome do Favorecido: Sonia</div>
            </div>
            
            <p className="text-[10px] text-indigo-600 font-medium">
              💡 Dica: Envie o comprovante no WhatsApp do Alexandre ou Sonia para liberação!
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Você está na lista de fundadores!</h3>
              <p className="text-xs text-slate-500">Registramos seu interesse e sua vaga por R$ 29,90/mês vitalício.</p>
            </div>
          ) : (
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 text-center">Garantir Preço Promocional de Lançamento (Opcional)</h4>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-650 mb-0.5">Qual recurso você mais precisa?</label>
                  <select required value={formData.desired_feature || ''} onChange={e => setFormData({...formData, desired_feature: e.target.value})} className="w-full border border-slate-250 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="" disabled>Escolha o que mais faz falta...</option>
                    <option value="pdf_corporativo">PDF corporativo com minha logo</option>
                    <option value="rubrica_hash">Rubrica digital e Hash do documento</option>
                    <option value="historico_cloud">Histórico infinito na nuvem</option>
                    <option value="remover_marca">Remover a marca ToDeAcordo</option>
                    <option value="whatsapp_auto">Disparo automático via WhatsApp</option>
                    <option value="templates">Templates (Agência/Consultoria etc)</option>
                    <option value="equipe">Acesso para minha equipe</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-650 mb-0.5">Nome</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nome" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-650 mb-0.5">WhatsApp</label>
                    <input required type="tel" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="(11) 99999-9999" />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg shadow-md mt-2 transition-transform active:scale-95 disabled:bg-slate-400 text-xs"
                >
                  {loading ? 'Reservando...' : 'Quero Entrar na Lista (Garantir R$ 29,90/mês)'}
                </button>
              </form>
            </div>
          )}

          {isUnderLimit && (
            <button 
              onClick={onClose}
              className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-lg text-sm transition-all transform active:scale-95"
            >
              Continuar usando grátis
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

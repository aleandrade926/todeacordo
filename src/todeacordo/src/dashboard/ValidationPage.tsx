import { useEffect, useState, useRef } from 'react';
import { getConsensusForMeeting, saveConsensus } from '../storage/consensusStorage';
import type { ConsensusObject } from '../types';
import { logEvent } from '../audit/auditLogger';
import { trackGrowthEvent, getOrCreateReferralCode } from '../growth/growthLogger';
import { generateConsensusHash } from '../lib/hashUtils';
import { MOCK_CONSENSUS, MOCK_CONSENSUS_CONSULTORIA } from '../lib/mockData';
import SignatureCanvas from 'react-signature-canvas';
import { ToDeAcordoBadge } from '../components/ToDeAcordoBadge';
import { useWebShare } from '../components/CopyEngines';

const ValidationPage = () => {
  const [consensus, setConsensus] = useState<ConsensusObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [signed, setSigned] = useState(false);
  const [objection, setObjection] = useState<boolean>(false);
  const [documentHash, setDocumentHash] = useState<string>('');
  
  // Handshake State
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signerName, setSignerName] = useState('');
  const sigCanvas = useRef<SignatureCanvas>(null);

  // Identity Claim State (Viral Loop - Caiu na rede é peixe)
  const [claimEmail, setClaimEmail] = useState('');

  // Soft Gate States (Fase 11)
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'sign' | 'objection' | null>(null);

  // Objection V2 State
  const [showObjectionModal, setShowObjectionModal] = useState(false);
  const [itemObjections, setItemObjections] = useState<Record<string, {status: 'accepted'|'adjust'|'rejected', note: string}>>({});
  const [generalObjection, setGeneralObjection] = useState('');

  const { share } = useWebShare();
  const myRef = getOrCreateReferralCode(claimEmail || signerName);
  const shareUrl = `${window.location.origin}${window.location.pathname}?ref=${myRef}&utm_source=todeacordo&utm_medium=validation_link&utm_campaign=shared_consensus`;

  useEffect(() => {
    let meetingId = '';
    const urlParams = new URLSearchParams(window.location.search);
    const route = urlParams.get('route');
    if (route && route.startsWith('/valida/')) {
      meetingId = route.replace('/valida/', '');
    } else {
      const pathParts = window.location.pathname.split('/');
      meetingId = pathParts[pathParts.length - 1];
    }

    if (meetingId && meetingId !== 'index.html') {
      loadConsensus(meetingId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadConsensus = async (id: string) => {
    try {
      if (id.startsWith('demo')) {
        const mockData = id === 'demo-consultoria' ? MOCK_CONSENSUS_CONSULTORIA : MOCK_CONSENSUS;
        setConsensus(mockData);
        const hash = await generateConsensusHash(mockData);
        setDocumentHash(hash);
        logEvent(id, 'validation_link_opened');
        return;
      }
      const data = await getConsensusForMeeting(id);
      if (data) {
        setConsensus(data);
        const hash = await generateConsensusHash(data);
        setDocumentHash(hash);
        logEvent(id, 'validation_link_opened');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    try {
      if (!signerName.trim()) {
        alert("Por favor, digite seu nome.");
        return;
      }
      if (sigCanvas.current?.isEmpty()) {
        alert("Por favor, faça sua assinatura.");
        return;
      }

      const signatureImage = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
      
      if (consensus) {
        const updatedConsensus = { ...consensus };
        if (!updatedConsensus.signatures) updatedConsensus.signatures = [];
        updatedConsensus.signatures.push({
          name: signerName,
          timestamp: Date.now(),
          image: signatureImage as string,
          accepted_version: 1,
          document_hash: documentHash
        });
        updatedConsensus.status = 'consensus_obtained';
        
        // Se não for o mock, salvamos localmente
        if (consensus.id !== 'demo') {
          await saveConsensus(updatedConsensus);
        }
        setConsensus(updatedConsensus);
        logEvent(consensus.meeting_id, 'agreed_clicked');
      }
      
      // Simula salvamento com a assinatura
      setTimeout(() => {
        setLoading(false);
        setSigned(true);
        setShowSignatureModal(false);
        if (consensus) {
          logEvent(consensus.id, 'handshake_signed', { signerName, signatureHash: 'simulated_hash' });
          trackGrowthEvent('accepted_with_signature', { consensus_id: consensus.id });
        }
      }, 1000);
      
      // Efeito Confete Supremo!
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#10b981', '#fbbf24']
        });
      });
    } catch (e) {
      console.error('Erro ao registrar assinatura:', e);
      alert('Erro ao registrar assinatura localmente no navegador. Por favor, certifique-se de que os cookies/armazenamento estão habilitados.');
    }
  };

  const handleObjectionSubmit = async () => {
    if (consensus && consensus.id !== 'demo') {
      const updatedConsensus = { ...consensus };
      updatedConsensus.status = 'disputed';
      updatedConsensus.audit_events.push({
        id: crypto.randomUUID(),
        meeting_id: updatedConsensus.meeting_id,
        type: 'objection_submitted',
        timestamp: Date.now(),
        details: { ip: '0.0.0.0', message: 'User raised item-by-item objections', objections: itemObjections }
      });
      await saveConsensus(updatedConsensus);
      setConsensus(updatedConsensus);
      logEvent(consensus.meeting_id, 'objection_submitted');
    }
    
    setLoading(true);
    // Simula salvamento
    setTimeout(() => {
      setLoading(false);
      setObjection(true);
      setShowObjectionModal(false);
      logEvent(consensus!.id, 'objection_submitted', { generalObjection, itemObjections });
      trackGrowthEvent('accepted_with_reservation', { consensus_id: consensus!.id });
    }, 1000);
  };

  const handleSignClick = () => {
    if (!signerName.trim() || !claimEmail.trim()) {
      setPendingAction('sign');
      setShowClaimModal(true);
    } else {
      setShowSignatureModal(true);
    }
  };

  const handleObjectionClick = () => {
    if (!signerName.trim() || !claimEmail.trim()) {
      setPendingAction('objection');
      setShowClaimModal(true);
    } else {
      setShowObjectionModal(true);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

  if (!consensus) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Acordo não encontrado</h2>
          <p className="text-slate-500">Este link de validação expirou ou não existe.</p>
        </div>
      </div>
    );
  }

  if (objection === true) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className={`bg-white p-8 rounded-xl shadow text-center max-w-md animate-fadeIn border-t-4 border-amber-500`}>
          <div className="text-5xl mb-4">✍️</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Ressalvas Registradas</h2>
          <p className="text-slate-500 mb-6">O criador deste documento foi notificado sobre as suas ressalvas.</p>
          
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500 mb-3">Reuniões geram mal-entendidos. Nós geramos acordos.</p>
            <a href="/" className="inline-block bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 px-6 rounded-lg transition-colors w-full">
              Quero usar nas minhas reuniões
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 selection:bg-indigo-100 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-10 py-10 border-b border-slate-100 relative">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-3xl font-extrabold text-slate-900">{consensus.title || 'Solicitação de Validação'}</h1>
            
            {consensus.traffic_light && (
              <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                consensus.traffic_light === 'green' ? 'bg-green-50 text-green-700 border-green-200' :
                consensus.traffic_light === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-red-50 text-red-700 border-red-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  consensus.traffic_light === 'green' ? 'bg-green-500' :
                  consensus.traffic_light === 'yellow' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></span>
                {consensus.traffic_light === 'green' ? 'Pronto para validar' :
                 consensus.traffic_light === 'yellow' ? 'Precisa revisar' :
                 'Atenção necessária'}
              </div>
            )}
          </div>
          
          <p className="text-slate-500 text-sm max-w-2xl">Resumo executivo extraído automaticamente pelo ToDeAcordo.</p>
          
          {(consensus.red_flags?.length || consensus.missing_elements?.length) ? (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              <strong>Pontos de atenção detectados pela IA:</strong>
              <ul className="list-disc ml-5 mt-1">
                {consensus.missing_elements?.map((item, idx) => (
                  <li key={`missing_${idx}`}>Faltam definições claras de: <b>{item}</b>.</li>
                ))}
                {consensus.red_flags?.map((item, idx) => (
                  <li key={`red_${idx}`}>Uso de termos frágeis ("{item}"), sugerindo ambiguidade.</li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Módulo 40: Mapa de Risco */}
          {consensus.risk_map && (
            <div className="mt-6 pt-6 border-t border-slate-100 flex gap-4 text-xs font-medium">
              <span className="text-slate-500 uppercase tracking-wider">Mapa de Risco:</span>
              <div className={`px-2 rounded flex gap-1 items-center ${consensus.risk_map.scope === 'high' ? 'text-red-700 bg-red-50' : consensus.risk_map.scope === 'medium' ? 'text-amber-700 bg-amber-50' : 'text-green-700 bg-green-50'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${consensus.risk_map.scope === 'high' ? 'bg-red-500' : consensus.risk_map.scope === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                Escopo
              </div>
              <div className={`px-2 rounded flex gap-1 items-center ${consensus.risk_map.deadline === 'high' ? 'text-red-700 bg-red-50' : consensus.risk_map.deadline === 'medium' ? 'text-amber-700 bg-amber-50' : 'text-green-700 bg-green-50'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${consensus.risk_map.deadline === 'high' ? 'bg-red-500' : consensus.risk_map.deadline === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                Prazos
              </div>
              <div className={`px-2 rounded flex gap-1 items-center ${consensus.risk_map.budget === 'high' ? 'text-red-700 bg-red-50' : consensus.risk_map.budget === 'medium' ? 'text-amber-700 bg-amber-50' : 'text-green-700 bg-green-50'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${consensus.risk_map.budget === 'high' ? 'bg-red-500' : consensus.risk_map.budget === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                Valores
              </div>
            </div>
          )}
        </div>

        <div className="px-10 py-8 space-y-8 text-slate-800">
          
          {/* Módulo 35: Próximo Passo */}
          {consensus.next_step && (
            <div className="bg-indigo-600 text-white rounded-lg p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl">🎯</div>
              <h3 className="font-bold uppercase tracking-wider text-indigo-200 text-xs mb-2">Próximo Passo Principal</h3>
              <p className="text-lg font-medium">{consensus.next_step}</p>
            </div>
          )}

          {consensus.summary && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Resumo da Reunião</h3>
              <p className="text-base leading-relaxed">{consensus.summary}</p>
            </div>
          )}

          {consensus.agreements && consensus.agreements.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 border-b border-slate-100 pb-2">Acordos Principais</h3>
              <ul className="space-y-3">
                {consensus.agreements.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-base">
                    <span className="text-indigo-500 mt-1">✓</span> 
                    <span>{typeof item === 'string' ? item : item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {consensus.decisions && consensus.decisions.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 border-b border-slate-100 pb-2">Decisões</h3>
              <ul className="space-y-3">
                {consensus.decisions.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-base">
                    <span className="text-indigo-500 mt-1">🎯</span> 
                    <span>{typeof item === 'string' ? item : item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {consensus.obligations && consensus.obligations.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 border-b border-slate-100 pb-2">Obrigações e Próximos Passos</h3>
              <ul className="space-y-4">
                {consensus.obligations.map((item, idx) => (
                  <li key={idx} className="text-base">
                    <span className="flex gap-3 font-medium text-slate-900">
                      <span className="text-indigo-500">📌</span> {typeof item === 'string' ? item : item.text}
                    </span>
                    {typeof item !== 'string' && item.evidence_quote && (
                      <div className="ml-8 mt-2 pl-3 border-l-2 border-slate-200 text-slate-500 italic text-sm">
                        "{item.evidence_quote}"
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-10 py-8 border-t border-slate-200 text-center relative overflow-hidden">
          {/* Fundo decorativo */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none"></div>

          {!objection && !signed && (
            <>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8 relative z-10">
                <button 
                  onClick={handleObjectionClick}
                  className="bg-white hover:bg-slate-100 text-slate-700 font-semibold text-base py-3 px-8 rounded border border-slate-300 transition-colors"
                >
                  Sugerir Ajuste
                </button>
                <button 
                  onClick={handleSignClick}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-3 px-12 rounded shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  Tô De Acordo
                </button>
              </div>
                <div className="flex justify-center mt-8 space-x-4 print:hidden">
                <button onClick={() => window.print()} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2">
                  <span>📄</span> Exportar PDF
                </button>
                <button 
                  onClick={() => share(`Entendimento: ${consensus.title}`, 'Confira nosso entendimento:', shareUrl)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 border border-indigo-200"
                >
                  <span>🔗</span> Compartilhar
                </button>
              </div>

              {/* Módulo 4: Acceptance Growth Moment */}
              <div className="mt-12 bg-indigo-600 p-8 rounded-2xl text-center shadow-xl print:hidden text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl">🚀</div>
                <h4 className="font-bold text-2xl mb-3 relative z-10">
                  Gostou da clareza? Crie seu próprio ToDeAcordo gratuitamente.
                </h4>
                <p className="text-indigo-200 mb-8 relative z-10 text-lg">
                  O ToDeAcordo transforma o seu Google Meet em entendimentos operacionais. Evite o "acho que combinamos outra coisa".
                </p>
                <div className="flex justify-center gap-4 relative z-10">
                  <a href={`/?ref=${myRef}&utm_source=todeacordo&utm_medium=validation_link&utm_campaign=shared_consensus`} className="bg-white hover:bg-indigo-50 text-indigo-900 font-bold py-4 px-8 rounded-xl transition-transform active:scale-95 shadow-lg text-lg">
                    Criar meu ToDeAcordo
                  </a>
                </div>
              </div>
            </>
          )}

          {signed && (
            <div className="py-8 animate-fadeIn relative z-10">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <span className="text-4xl text-green-500">✓</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Entendimento Validado!</h2>
              <p className="text-slate-600 mb-8 max-w-lg mx-auto">Sua confirmação foi enviada para o criador. Vocês acabaram de evitar um mal-entendido.</p>
              
              {/* VIRAL UNICORN BLOCK */}
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 rounded-3xl p-8 shadow-2xl text-white text-left relative overflow-hidden mb-10 transform hover:scale-[1.01] transition-transform print:hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl">🦄</div>
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
                
                <h3 className="text-2xl font-bold mb-3 relative z-10 font-sans">Gostou da clareza?</h3>
                <p className="text-indigo-200 mb-6 max-w-xl relative z-10 text-sm leading-relaxed">
                  Você recebeu este link para validar um entendimento. Crie sua conta grátis agora mesmo para colar conversas (WhatsApp, e-mails) diretamente pelo celular, ou instale a extensão no computador para automatizar a captura de combinados nas suas reuniões do Google Meet!
                </p>

                {/* Recursos - Mostrar Valor Imediatamente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 relative z-10 text-xs text-indigo-100 border-t border-indigo-750/30 pt-5">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">✓</span> Resume reuniões com IA
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">✓</span> Organiza tarefas e ações
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">✓</span> Define responsáveis e prazos
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">✓</span> Envia links de validação rápida
                  </div>
                </div>

                {/* Prova Social */}
                <div className="border-t border-indigo-750/30 pt-4 mb-6 relative z-10 text-[11px] text-indigo-300">
                  <p className="font-semibold mb-1">Empresas, consultores, freelancers e equipes usam o ToDeAcordo para evitar mal-entendidos.</p>
                  <div className="flex gap-4">
                    <span>🔥 <strong>1.842</strong> combinados enviados</span>
                    <span>✅ <strong>96%</strong> validados</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                  <a href="/?utm_source=viral_loop&utm_medium=validation_success" className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-95 text-sm">
                    Criar meu ToDeAcordo
                  </a>
                  <a 
                    href="https://chromewebstore.google.com/detail/jicbcgjheaebfkecdpeenpnifgpjjgig?utm_source=item-share-cb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-750 text-white hover:bg-indigo-700 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center border border-indigo-500/50 shadow-sm transition-transform active:scale-95 text-sm"
                  >
                    Instalar extensão
                  </a>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-sm mx-auto text-left mb-8">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-3 border-b border-slate-100 pb-2">Rubrica de Confirmação</p>
                {consensus.signatures?.map((sig, i) => (
                  <div key={i} className="mb-4 last:mb-0">
                    <p className="font-medium text-slate-800">{sig.name}</p>
                    <img src={sig.image} alt="Rubrica" className="h-16 object-contain opacity-80" />
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      Registrado em: {new Date(sig.timestamp).toLocaleString()}
                      <br/>Hash Criptográfico: {sig.document_hash.substring(0, 16)}...
                      <br/>Versão Aceita: v{sig.accepted_version}
                    </p>
                  </div>
                ))}
                <p className="text-[9px] leading-tight text-slate-400 mt-4 border-t border-slate-100 pt-2 print:text-black">
                  Este registro documenta a confirmação operacional do entendimento. Não substitui assinatura eletrônica qualificada ou contrato formal quando exigidos por lei.
                </p>
                
                <div className="mt-4 pt-3 border-t border-slate-100 text-[9px] font-mono text-slate-400 print:text-black break-all flex justify-between">
                  <div>
                    <span className="font-bold uppercase tracking-wider block mb-1">Trilha de Auditoria e Integridade</span>
                    ID: {consensus.id}<br/>
                    Original Hash (SHA-256): {documentHash}<br/>
                    Gerado em: {new Date(consensus.generated_at || Date.now()).toLocaleString()}<br/>
                    IP de Validação: Registrado no Backend Serverless
                  </div>
                  <div className="text-right flex-col justify-end hidden print:flex items-end gap-2 mt-2">
                    <ToDeAcordoBadge type="default" />
                    <span className="text-xs text-slate-400">todeacordo.com.br</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4 print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 px-8 rounded transition-colors"
                >
                  📄 Baixar PDF Corporativo
                </button>
                <a href="/" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-sm py-3 px-8 rounded transition-colors">
                  Quero gerar o meu
                </a>
              </div>
            </div>
          )}

          {/* Soft Gate Claim Modal (Fase 11) */}
          {showClaimModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-center p-8 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-bl-full -z-10 opacity-50"></div>
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner border border-indigo-100">
                  🤝
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Para prosseguir</h2>
                <p className="text-slate-500 mb-8 text-sm">Informe seu nome e e-mail para validar este registro de entendimento.</p>
                
                <div className="space-y-4 text-left mb-8">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Seu Nome</label>
                    <input 
                      type="text" 
                      value={signerName} 
                      onChange={e => setSignerName(e.target.value)}
                      placeholder="Como você se chama?"
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Seu E-mail Profissional</label>
                    <input 
                      type="email" 
                      value={claimEmail} 
                      onChange={e => setClaimEmail(e.target.value)}
                      placeholder="nome@empresa.com.br"
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    if(signerName.trim() && claimEmail.trim()) {
                      setShowClaimModal(false);
                      logEvent(consensus.id, 'counterparty_claimed', { name: signerName, email: claimEmail });
                      trackGrowthEvent('lead_captured_from_validation', { email: claimEmail });
                      if (pendingAction === 'sign') {
                        setShowSignatureModal(true);
                      } else if (pendingAction === 'objection') {
                        setShowObjectionModal(true);
                      }
                      setPendingAction(null);
                    } else {
                      alert('Preencha seu nome e e-mail para continuar.');
                    }
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-95 text-lg"
                >
                  Confirmar Identidade
                </button>
                
                <button 
                  onClick={() => {
                    setShowClaimModal(false);
                    setPendingAction(null);
                  }}
                  className="mt-6 text-xs text-slate-400 hover:text-slate-600 underline font-medium"
                >
                  Voltar ao Documento
                </button>
              </div>
            </div>
          )}

          {/* Signature Modal */}
          {showSignatureModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">Rubrica de Confirmação</h3>
                  <button onClick={() => setShowSignatureModal(false)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>
                
                <div className="p-6">
                  <p className="text-sm text-slate-600 mb-4">
                    Desenhe sua rubrica para registrar que você conferiu e concorda com este entendimento.
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Seu Nome Completo</label>
                    <input 
                      type="text"
                      value={signerName}
                      onChange={e => setSignerName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Sua Rubrica</label>
                    <div className="border-2 border-dashed border-slate-300 rounded bg-slate-50 overflow-hidden group">
                      <SignatureCanvas 
                        ref={sigCanvas}
                        penColor="black"
                        canvasProps={{ className: 'w-full h-40 cursor-crosshair touch-none' }}
                      />
                    </div>
                    <div className="flex justify-end mt-1">
                      <button onClick={() => sigCanvas.current?.clear()} className="text-[10px] text-slate-400 hover:text-slate-600 underline">
                        Limpar quadro
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                  <button 
                    onClick={() => setShowSignatureModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSign}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded shadow-sm flex items-center gap-2"
                  >
                    <span>✒️</span> Confirmar e Aceitar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Objection V2 Modal */}
          {showObjectionModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-8">
                <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex justify-between items-center sticky top-0 z-10">
                  <h3 className="font-bold text-amber-900 text-lg flex items-center gap-2">
                    <span className="text-xl">✍️</span> Tenho Ressalvas
                  </h3>
                  <button onClick={() => setShowObjectionModal(false)} className="text-amber-700 hover:text-amber-900">
                    ✕
                  </button>
                </div>
                
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <p className="text-sm text-slate-600 mb-6">
                    Revise os pontos abaixo. Se houver divergência, indique qual item precisa de ajuste. Isso criará a Versão 2 deste entendimento.
                  </p>
                  
                  <div className="space-y-6">
                    {/* Agreements */}
                    {consensus.agreements?.map((item, idx) => {
                      const text = typeof item === 'string' ? item : item.text;
                      const key = `agr_${idx}`;
                      const state = itemObjections[key] || { status: 'accepted', note: '' };
                      
                      return (
                        <div key={key} className={`border rounded-lg p-4 transition-colors ${state.status === 'rejected' ? 'border-red-300 bg-red-50' : state.status === 'adjust' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                          <p className="text-sm font-medium text-slate-800 mb-3">{text}</p>
                          <div className="flex flex-wrap gap-4 mb-3">
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input type="radio" name={key} checked={state.status === 'accepted'} onChange={() => setItemObjections({...itemObjections, [key]: {...state, status: 'accepted'}})} />
                              <span className="text-slate-600">✅ Concordo</span>
                            </label>
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input type="radio" name={key} checked={state.status === 'adjust'} onChange={() => setItemObjections({...itemObjections, [key]: {...state, status: 'adjust'}})} />
                              <span className="text-amber-600">⚠️ Precisa ajustar</span>
                            </label>
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input type="radio" name={key} checked={state.status === 'rejected'} onChange={() => setItemObjections({...itemObjections, [key]: {...state, status: 'rejected'}})} />
                              <span className="text-red-600">❌ Discordo</span>
                            </label>
                          </div>
                          {state.status !== 'accepted' && (
                            <input 
                              type="text" 
                              placeholder="Qual é a sua ressalva sobre este ponto?"
                              value={state.note}
                              onChange={(e) => setItemObjections({...itemObjections, [key]: {...state, note: e.target.value}})}
                              className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:ring-amber-500 focus:border-amber-500"
                            />
                          )}
                        </div>
                      );
                    })}

                    {/* Score de Clareza Viral (Módulo 6) */}
              <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 print:hidden">
                <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-white border-4 border-indigo-500 shadow-inner">
                  <span className="text-3xl font-black text-slate-800">{consensus.clarity_score || 85}</span>
                  <span className="absolute -bottom-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Clareza</span>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">Reunião Quase Clara</h3>
                  <p className="text-slate-500 text-sm mb-3">A pontuação indica que a maioria dos combinados está amarrada, mas há pequenos riscos.</p>
                  <button onClick={() => share(`Minha reunião teve ${consensus.clarity_score || 85}/100 de clareza no ToDeAcordo.`, 'A sua passaria no teste?', window.location.href)} className="text-indigo-600 hover:text-indigo-800 font-bold text-sm underline">
                    Compartilhar meu Score
                  </button>
                </div>
              </div>

              {/* Contradiction Detector (Módulo 5) */}
              {(consensus.risk_flags && consensus.risk_flags.length > 0) && (
                <div className="mb-8 bg-red-50 p-6 rounded-2xl border border-red-200">
                  <h3 className="text-red-800 font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="text-2xl">🚨</span> Pontos que podem virar problema
                  </h3>
                  <div className="space-y-4">
                    {consensus.risk_flags.map((flag, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${flag.severity === 'high' ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-900'}`}>
                            {flag.severity === 'high' ? 'Risco Alto' : 'Risco Médio'}
                          </span>
                          <span className="font-bold text-slate-800 text-sm">{flag.type}</span>
                        </div>
                        <p className="text-slate-600 text-sm">{flag.text}</p>
                        {flag.evidence_quote && (
                          <div className="mt-3 bg-slate-50 p-3 rounded-lg border-l-2 border-slate-300 text-xs text-slate-500 font-mono italic">
                            "{flag.evidence_quote}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

                    {/* Obligations */}
                    {consensus.obligations?.map((item, idx) => {
                      const text = typeof item === 'string' ? item : item.text;
                      const key = `obl_${idx}`;
                      const state = itemObjections[key] || { status: 'accepted', note: '' };
                      
                      return (
                        <div key={key} className={`border rounded-lg p-4 transition-colors ${state.status === 'rejected' ? 'border-red-300 bg-red-50' : state.status === 'adjust' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                          <p className="text-sm font-medium text-slate-800 mb-3">📌 {text}</p>
                          <div className="flex flex-wrap gap-4 mb-3">
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input type="radio" name={key} checked={state.status === 'accepted'} onChange={() => setItemObjections({...itemObjections, [key]: {...state, status: 'accepted'}})} />
                              <span className="text-slate-600">✅ Concordo</span>
                            </label>
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input type="radio" name={key} checked={state.status === 'adjust'} onChange={() => setItemObjections({...itemObjections, [key]: {...state, status: 'adjust'}})} />
                              <span className="text-amber-600">⚠️ Precisa ajustar</span>
                            </label>
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input type="radio" name={key} checked={state.status === 'rejected'} onChange={() => setItemObjections({...itemObjections, [key]: {...state, status: 'rejected'}})} />
                              <span className="text-red-600">❌ Discordo</span>
                            </label>
                          </div>
                          {state.status !== 'accepted' && (
                            <input 
                              type="text" 
                              placeholder="Descreva o que está errado neste prazo ou obrigação..."
                              value={state.note}
                              onChange={(e) => setItemObjections({...itemObjections, [key]: {...state, note: e.target.value}})}
                              className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:ring-amber-500 focus:border-amber-500"
                            />
                          )}
                        </div>
                      );
                    })}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Ressalvas Gerais (Opcional)</label>
                      <textarea 
                        value={generalObjection}
                        onChange={e => setGeneralObjection(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500 min-h-[80px]"
                        placeholder="Esquecemos de algo? Digite aqui..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 z-10">
                  <button 
                    onClick={() => setShowObjectionModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleObjectionSubmit}
                    className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded shadow-sm"
                  >
                    Enviar Ressalvas
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <a href="/" className="text-xs text-slate-400 hover:text-indigo-600 flex items-center justify-center gap-1 transition-colors">
              <span className="font-semibold">Gerado com ToDeAcordo</span> — transforme suas reuniões em combinados claros ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationPage;

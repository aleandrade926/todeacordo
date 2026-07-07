import { useEffect, useState, useRef } from 'react';
import { getConsensusForMeeting, saveConsensus } from '../storage/consensusStorage';
import type { ConsensusObject, TranscriptSegment } from '../types';
import { getTranscriptForMeeting } from '../storage/transcriptStorage';
import { generateConsensusFromTranscript } from '../ai/consensusExtractor';
import { getMeeting } from '../storage/meetingStorage';
// Detect if running inside Chrome Extension or on web
const isExtensionContext = () => window.location.protocol === 'chrome-extension:';
const getValidationUrl = (meetingId: string) => {
  if (isExtensionContext()) {
    return `index.html?route=/valida/${meetingId}`;
  }
  return `/app?route=/valida/${meetingId}`;
};
const getHomeUrl = () => isExtensionContext() ? 'index.html' : '/app';

export const MeetingDetailsPage = () => {
  const [consensus, setConsensus] = useState<ConsensusObject | null>(null);
  const [meeting, setMeeting] = useState<any>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transcricao' | 'chat' | 'acordos' | 'notas'>('transcricao');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState<string>('');
  const autoGenerateRef = useRef(false);

  useEffect(() => {
    let meetingId = '';
    const urlParams = new URLSearchParams(window.location.search);
    const route = urlParams.get('route');
    if (route && route.startsWith('/meeting/')) {
        meetingId = route.replace('/meeting/', '').split('&')[0]; // strip any extra params
    } else {
        const pathParts = window.location.pathname.split('/');
        meetingId = pathParts[pathParts.length - 1];
    }

    if (meetingId) {
      setCurrentMeetingId(meetingId);
      const shouldAutoGenerate = urlParams.get('autoGenerate') === 'true';
      loadData(meetingId).then((hasRealConsensus) => {
          if ((!hasRealConsensus || shouldAutoGenerate) && shouldAutoGenerate && !autoGenerateRef.current) {
              autoGenerateRef.current = true;
              handleAutoGenerate(meetingId);
          }
      });
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async (id: string): Promise<boolean> => {
    try {
      const mData = await getMeeting(id);
      if (mData) setMeeting(mData);

      const cData = await getConsensusForMeeting(id);
      if (cData) setConsensus(cData);
      
      const tData = await getTranscriptForMeeting(id);
      if (tData && tData.length > 0) {
        setTranscript(tData);
      } else if (cData?.transcript_segments && cData.transcript_segments.length > 0) {
        setTranscript(cData.transcript_segments);
      }

      // Consider consensus "real" only if it has actual decisions or obligations
      const hasContent = (cData?.decisions?.length ?? 0) > 0 || (cData?.obligations?.length ?? 0) > 0;
      return hasContent;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerate = async (mId: string) => {
      const id = mId || currentMeetingId;
      if (!id) { console.error('Meeting ID missing for generation'); return; }
      setIsGenerating(true);
      setActiveTab('acordos');
      try {
          const tData = await getTranscriptForMeeting(id);
          if (!tData || tData.length === 0) {
              console.log('Nenhum transcrito encontrado para gerar consenso.');
              setIsGenerating(false);
              return;
          }
          
          const result = await generateConsensusFromTranscript({
              meetingId: id,
              sourcePlatform: 'google-meet',
              participants: [],
              segments: tData
          });

          const finalResult = { ...result, meeting_id: id, id: result.id || id } as ConsensusObject;

          await saveConsensus(finalResult);
          setConsensus(finalResult);
      } catch (e) {
          console.error('Erro na geraÃ§Ã£o automÃ¡tica', e);
      } finally {
          setIsGenerating(false);
      }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando reuniÃ£o...</div>;
  if (isGenerating) return <div className="flex h-screen items-center justify-center font-bold text-indigo-600">Gerando consolidado da reuniÃ£o (ToDeAcordo AI)...</div>;
  if (!meeting && !consensus && transcript.length === 0) return <div className="p-8 text-center">ReuniÃ£o nÃ£o encontrada.</div>;

  const validationUrl = getValidationUrl(consensus?.meeting_id || meeting?.id || currentMeetingId);
  const homeUrl = getHomeUrl();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center font-black text-slate-900 shadow-sm">T</div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">ToDeAcordo</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">

          <a href={homeUrl} className="flex items-center gap-3 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg font-medium text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2m0 0V7a2 2 0 00-2-2m0 0h-2.5a2 2 0 00-1 .333M9 5h0m0 0H7a2 2 0 00-2 2v6a2 2 0 002 2m0 0h2m0 0h2.5a2 2 0 001-.333M9 5a2 2 0 002-2m0 0V3"></path></svg>
            Minhas ReuniÃµes
          </a>
        </nav>
        <div className="p-4 border-t border-slate-200">
          {/* Upgrade info hidden for MVP */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <a href={homeUrl} className="text-slate-500 hover:text-slate-900">Minhas ReuniÃµes</a>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900">{meeting?.title || consensus?.meeting_id || meeting?.id || 'ReuniÃ£o Importante'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors" onClick={() => {
              window.open(validationUrl, '_blank');
            }}>
              Gerar Link de ValidaÃ§Ã£o
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-200 px-6 shrink-0">
          <div className="flex items-center gap-6">
            {[
              { id: 'transcricao', label: 'TranscriÃ§Ã£o' },
              { id: 'acordos', label: 'Acordos & Entendimentos' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 text-sm font-bold border-b-2 transition-colors outline-none ${activeTab === tab.id ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto bg-slate-50 flex">
          <div className="flex-1 p-8">
            <div className="max-w-3xl mx-auto">
              
              {activeTab === 'chat' && (
                <div className="text-center mt-20 flex flex-col justify-center items-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">ReuniÃ£o muito curta para IA</h2>
                  <p className="text-slate-500 mb-8 max-w-md">
                    Os recursos de IA estÃ£o disponÃ­veis para reuniÃµes com mais de 2 minutos. Continue a reuniÃ£o ou veja a transcriÃ§Ã£o enquanto isso.
                  </p>
                  <button onClick={() => setActiveTab('transcricao')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors">
                    Ver transcriÃ§Ã£o â†’
                  </button>
                </div>
              )}

              {activeTab === 'transcricao' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">TranscriÃ§Ã£o Completa</h2>
                  {transcript.length > 0 ? (
                    <div className="space-y-6">
                      {transcript.map((seg, i: number) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-500">
                            {((seg.speaker && seg.speaker !== 'undefined' && seg.speaker !== 'Unknown') ? seg.speaker : 'Desconhecido').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-bold text-slate-900">{(seg.speaker && seg.speaker !== 'undefined' && seg.speaker !== 'Unknown') ? seg.speaker : 'Desconhecido'}</span>
                              <span className="text-xs text-slate-400">{new Date(seg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-slate-700 leading-relaxed">{seg.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                      <div className="text-center py-12 text-slate-500">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 13H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14-7h.01M7 7a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </div>
                        <p>TranscriÃ§Ã£o ainda nÃ£o disponÃ­vel.</p>
                      </div>
                  )}
                </div>
              )}

              {activeTab === 'acordos' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-slate-900">Acordos Consolidados</h2>
                    <a href={validationUrl} target="_blank" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                      Compartilhar â†’
                    </a>
                  </div>
                  {(() => {
                    const hasContent = (consensus?.decisions?.length ?? 0) > 0 || (consensus?.obligations?.length ?? 0) > 0;
                    if (!hasContent) {
                      return (
                        <div className="text-center py-12">
                          <p className="text-slate-500 mb-6">
                            {consensus ? 'A IA gerou um registro vazio. Clique abaixo para tentar novamente com a transcriÃ§Ã£o salva.' : 'Nenhum entendimento ou acordo foi gerado para esta conversa.'}
                          </p>
                          <button
                            onClick={() => handleAutoGenerate(currentMeetingId || meeting?.id)}
                            className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-3 px-8 rounded-xl transition-all shadow-md active:scale-95 text-sm flex items-center gap-2 mx-auto"
                          >
                            <span>ðŸ§ </span> Gerar Entendimento com IA
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">DecisÃµes</h3>
                          <ul className="space-y-2">
                            {consensus?.decisions?.map((d: any, i: number) => (
                              <li key={i} className="flex gap-3 bg-slate-50 p-4 rounded-xl text-slate-700">
                                <span className="text-amber-500">âœ“</span> {typeof d === 'string' ? d : d.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">PrÃ³ximos Passos (ObrigaÃ§Ãµes)</h3>
                          <ul className="space-y-2">
                            {consensus?.obligations?.map((o: any, i: number) => (
                              <li key={i} className="flex gap-3 bg-slate-50 p-4 rounded-xl text-slate-700">
                                <span className="text-indigo-500">â†’</span>
                                <div>
                                  <span className="font-bold">{(typeof o !== 'string' && o.owner) ? `${o.owner}: ` : ''}</span>{typeof o === 'string' ? o : o.text}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 bg-white border-l border-slate-200 p-6 shrink-0 overflow-y-auto hidden lg:block">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm">
                  {consensus?.participants?.[0]?.charAt(0).toUpperCase() || 'V'}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Gravado por vocÃª</div>
                  <div className="text-xs text-slate-500">{new Date(consensus?.created_at || Date.now()).toLocaleDateString('pt-BR')} â€¢ 1 min</div>
                </div>
                <div className="ml-auto bg-slate-100 p-1.5 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg mt-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 1112 2.944a11.933 11.933 0 018.618 3.04m-5.228 5.228a9 9 0 1112.224-12.224m-5.228 5.228l5.228-5.228"></path></svg>
                ReuniÃ£o privada
              </div>
            </div>
            
            <div className="space-y-1">
              <button className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-3 transition-colors" onClick={() => {
                window.open(validationUrl, '_blank');
              }}>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 15.938 10.777 17.94 13.394 17.94c1.694 0 3.179-.779 4.169-2m0 0a9.958 9.958 0 001.541-9.99m-2.182 10.727a9.009 9.009 0 01-4.546.893c-1.524 0-2.976-.356-4.243-1m0 0H2.708m0 0h.027"></path></svg>
                Compartilhe esta reuniÃ£o
              </button>
            </div>
            
            <div className="absolute bottom-6 right-6">
              <button className="w-12 h-12 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-indigo-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



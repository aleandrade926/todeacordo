import { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import type { TranscriptSegment, ConsensusObject, MeetingSession, LiveCaptionDraft } from '../types';
import { generateConsensusFromTranscript } from '../ai/consensusExtractor';
import { saveMeeting, getActiveMeeting } from '../storage/meetingStorage';
import { saveTranscriptSegment, getTranscriptForMeeting } from '../storage/transcriptStorage';
import { saveConsensus, getConsensusForMeeting } from '../storage/consensusStorage';
import { logEvent } from '../audit/auditLogger';
import { getUsage, incrementUsage } from '../storage/usageStorage';


interface ProbeResult {
  visibleTextNodesCount: number;
  ariaLiveCount: number;
  roleStatusLogCount: number;
  possibleCaptionContainersCount: number;
  lastRawText: string;
  candidateSelector: string;
  isVisible: boolean;
  className: string;
  tagName: string;
}

interface TelemetryData {
  activeTabUrl: string;
  contentScriptConnected: boolean;
  meetingState: string;
  captionsEnabled: boolean;
  mutationObserverActive: boolean;
  observedRoot: string;
  lastMutationAt: number;
  // Telemetria refatorada
  activeDraftText: string;
  activeDraftSpeaker: string;
  activeDraftUpdatedAt: number;
  committedSegmentsCount: number;
  draftUpdateCount: number;
  lastCommitReason: string;
  lastDiscardReason: string;
  lastCleanedText: string;
  // Rolling Segment
  lastCommittedText: string;
  lastCommittedId: string;
  lastSegmentUpdatedId: string;
  updateReason: string;
  isExpansionOfCommitted: boolean;
  novelSuffix: string;
  segmentUpdatedCount: number;

  emittedHashesCount: number;
  systemTextFilteredCount: number;
  lastSystemTextFiltered: string;
  currentCaptureAllowed: boolean;
  captureBlockedReason: string;
}

const SidePanel = () => {
  const [meetingState, setMeetingState] = useState<'INACTIVE' | 'LOBBY' | 'ACTIVE' | 'UNKNOWN'>('UNKNOWN');
  const [captionsEnabled, setCaptionsEnabled] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [liveDraft, setLiveDraft] = useState<LiveCaptionDraft | null>(null);
  // Debug & Probe
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);
  const [probeError, setProbeError] = useState<string>('');
  
  // Paywall State
  const [usage, setUsage] = useState({ count: 0, limit: 3 });

  const openPaywall = (feature: string) => {
    const url = `https://todeacordo.com.br/app?showPaywall=true&feature=${encodeURIComponent(feature)}`;
    chrome.tabs.create({ url });
  };
  
  const [activeMeeting, setActiveMeeting] = useState<MeetingSession | null>(null);
  const [consensus, setConsensus] = useState<Partial<ConsensusObject> | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string>('');
  
  const [isEditingConsensus, setIsEditingConsensus] = useState<boolean>(false);
  const [editedConsensus, setEditedConsensus] = useState<Partial<ConsensusObject> | null>(null);
  
  const endOfListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    endOfListRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [segments]);

  // Atualiza telemetria a cada 1.5s
  useEffect(() => {
    if (!debugMode) return;
    
    const updateTelemetry = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STATUS' }, (response: any) => {
            if (chrome.runtime.lastError) {
              setTelemetry(prev => ({
                ...(prev || {
                  activeTabUrl: '',
                  contentScriptConnected: false,
                  meetingState: 'UNKNOWN',
                  captionsEnabled: false,
                  mutationObserverActive: false,
                  observedRoot: '',
                  lastMutationAt: 0,
                  activeDraftText: '',
                  activeDraftSpeaker: '',
                  activeDraftUpdatedAt: 0,
                  committedSegmentsCount: 0,
                  draftUpdateCount: 0,
                  lastCommitReason: '',
                  lastDiscardReason: '',
                  lastCleanedText: '',
                  lastSpeakerCleaned: '',
                  lastCommittedText: '',
                  lastCommittedId: '',
                  lastSegmentUpdatedId: '',
                  updateReason: '',
                  isExpansionOfCommitted: false,
                  novelSuffix: '',
                  segmentUpdatedCount: 0,
                  emittedHashesCount: 0,
                  systemTextFilteredCount: 0,
                  lastSystemTextFiltered: '',
                  currentCaptureAllowed: false,
                  captureBlockedReason: 'Sem Conexão'
                }),
                contentScriptConnected: false
              }));
              return;
            }
            if (response) {
              setTelemetry(response);
            }
          });
        }
      });
    };

    updateTelemetry();
    const interval = setInterval(updateTelemetry, 1500);
    return () => clearInterval(interval);
  }, [debugMode]);


  useEffect(() => {
    const loadMeeting = async () => {
      const meeting = await getActiveMeeting();
      if (meeting) {
        if (meeting.status === 'active') {
          setActiveMeeting(meeting);
          
          if (meeting.transcript_segment_ids.length > 0) {
            const allSegments = await getTranscriptForMeeting(meeting.id);
            setSegments(allSegments);
          }

          if (meeting.consensus_object_id) {
            const consObj = await getConsensusForMeeting(meeting.id);
            if (consObj) setConsensus(consObj);
          }
        }
      }
      
      const usageData = await getUsage();
      setUsage(usageData);
      await logEvent(meeting?.id || 'manual', 'sidepanel_restored');
    };
    loadMeeting();
    const ensureMeeting = async (state: string, contentScriptMeetingId?: string) => {
      let meeting = await getActiveMeeting();
      
      // If we have an active meeting but its ID is different from what the content script reports,
      // it means it's a stuck meeting from a previous session. We must end it.
      if (meeting && contentScriptMeetingId && meeting.id !== contentScriptMeetingId) {
          meeting.status = 'ended';
          meeting.ended_at = Date.now();
          meeting.is_active = false;
          await saveMeeting(meeting);
          meeting = undefined;
          
          // Limpar a interface imediatamente se a reunião antiga encerrou
          setActiveMeeting(null);
          setSegments([]);
          setConsensus(null);
      }

      if (state !== 'ACTIVE') return;

      if (!meeting) {
        // Create new meeting
        const newId = contentScriptMeetingId || crypto.randomUUID();
        meeting = {
          id: newId,
          platform: 'google-meet',
          source_platform: 'google-meet',
          title: 'Reunião do Google Meet',
          started_at: Date.now(),
          status: 'active',
          is_active: true,
          participants: [],
          transcript_segment_ids: [],
          created_at: Date.now(),
          updated_at: Date.now(),
        };
        await saveMeeting(meeting);
        setActiveMeeting(meeting);
        setSegments([]); // Clear old UI segments!
        setConsensus(null);
        await logEvent(meeting.id, 'sidepanel_opened');
        await logEvent(meeting.id, 'meeting_detected');
      } else {
        setActiveMeeting(meeting);
      }
    };

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STATUS' }, (response: any) => {
          if (chrome.runtime.lastError) return;
          if (response) {
            setMeetingState(response.meetingState);
            setCaptionsEnabled(response.captionsEnabled);
            setIsCapturing(response.mutationObserverActive);
            ensureMeeting(response.meetingState, response.meetingId);
          }
        });
      }
    });

    const listener = (message: any) => {
      if (message.type === 'MEET_STATUS_UPDATE') {
        setMeetingState(message.state);
        setCaptionsEnabled(message.captionsEnabled);
        setIsCapturing(message.isCapturing);
        ensureMeeting(message.state, message.meetingId);

        if (message.state === 'UNKNOWN' || message.state === 'INACTIVE') {
          getActiveMeeting().then(async (meeting) => {
             if (meeting && meeting.status === 'active') {
               meeting.status = 'ended';
               meeting.ended_at = Date.now();
               meeting.is_active = false;
               await saveMeeting(meeting);
               await logEvent(meeting.id, 'meeting_ended');
               setActiveMeeting(null);
               setSegments([]);
               setConsensus(null);
             }
          });
        }
      } else if (message.type === 'CAPTURE_AUTO_STOPPED') {
        setIsCapturing(false);
        console.log(`[ToDeAcordo][SidePanel] Captura interrompida automaticamente: ${message.reason}`);
        getActiveMeeting().then(m => m && logEvent(m.id, 'capture_stopped'));
      } else if (message.type === 'caption_draft_updated') {
        setLiveDraft(message.draft);
      } else if (message.type === 'transcript_segment_committed') {
        const seg = message.segment;
        setLiveDraft(null);
        
        setSegments((prev) => {
          const isDuplicate = prev.some(s => 
            s.id === seg.id || 
            (seg.normalized_hash && s.normalized_hash === seg.normalized_hash)
          );
          if (isDuplicate) return prev;
          
          getActiveMeeting().then(async (meeting) => {
            if (meeting) {
              seg.meeting_id = meeting.id;
              await saveTranscriptSegment(seg);
              if (!meeting.transcript_segment_ids.includes(seg.id)) {
                meeting.transcript_segment_ids.push(seg.id);
                meeting.updated_at = Date.now();
                await saveMeeting(meeting);
              }
              await logEvent(meeting.id, 'transcript_segment_captured');
            }
          });

          return [...prev, seg];
        });
      } else if (message.type === 'transcript_segment_updated') {
        const seg = message.segment;
        
        setSegments((prev) => {
          const index = prev.findIndex(s => s.id === seg.id);
          if (index === -1) return prev;
          
          const newSegments = [...prev];
          newSegments[index] = seg;
          
          getActiveMeeting().then(async (meeting) => {
            if (meeting) {
              await saveTranscriptSegment(seg);
              meeting.updated_at = Date.now();
              await saveMeeting(meeting);
            }
          });

          return newSegments;
        });
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleCaptureScreenshot = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.windowId) {
        chrome.tabs.captureVisibleTab(activeTab.windowId, { format: 'jpeg', quality: 80 }, (dataUrl) => {
          if (chrome.runtime.lastError) {
            console.error('Erro ao capturar tela:', chrome.runtime.lastError);
            alert('Não foi possível capturar a tela.');
            return;
          }
          if (dataUrl && consensus) {
            const updated = { ...consensus, attachments: [...(consensus.attachments || []), dataUrl] };
            setConsensus(updated as ConsensusObject);
            if (activeMeeting) {
              saveConsensus(updated as ConsensusObject).catch(console.error);
            }
          }
        });
      }
    });
  };

  const handleRunProbe = () => {
    setProbeError('');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'RUN_PROBE' }, (response: any) => {
          if (chrome.runtime.lastError) {
            setProbeError('Não foi possível comunicar.');
            return;
          }
          if (response?.status === 'OK') {
            setProbeResult(response.result);
          }
        });
      }
    });
  };

  const handleScanNow = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SCAN_NOW' }, (response: any) => {
          if (chrome.runtime.lastError) {
            alert('Erro de comunicação.');
            return;
          }
          if (response?.status === 'EMPTY') {
            alert('Nenhuma legenda detectada no DOM.');
          }
        });
      }
    });
  };

  const handleGenerateUnderstanding = async () => {
    if (segments.length === 0) {
      setGenerationError('Nenhuma fala capturada ainda. Ligue as legendas do Google Meet para começar.');
      setIsGenerating(false);
      return;
    }
    
    setGenerationError('');
    setIsGenerating(true);
    if (activeMeeting) logEvent(activeMeeting.id, 'consensus_generation_started');
    
    try {
      const result = await generateConsensusFromTranscript({
        meetingId: activeMeeting?.id || 'manual',
        sourcePlatform: activeMeeting?.source_platform || 'google-meet',
        participants: activeMeeting?.participants || [],
        segments: segments
      });
      
      const consensusObj: ConsensusObject = {
        id: result.id || crypto.randomUUID(),
        meeting_id: result.meeting_id || activeMeeting?.id || 'manual',
        title: result.title || activeMeeting?.title || 'Reunião sem título',
        created_at: result.created_at || Date.now(),
        transcript_segments: result.transcript_segments || segments,
        ...result,
        source_platform: activeMeeting?.source_platform || 'google-meet',
        updated_at: Date.now(),
        participants: activeMeeting?.participants || [],
        consensus_versions: [],
        current_version: 1,
        status: 'draft',
        audit_events: []
      };
      
      if (activeMeeting) {
        await saveConsensus(consensusObj);
        activeMeeting.consensus_object_id = consensusObj.id;
        activeMeeting.updated_at = Date.now();
        await saveMeeting(activeMeeting);
        await logEvent(activeMeeting.id, 'consensus_generated');
      }
      setConsensus(consensusObj);
      const newUsage = await incrementUsage();
      setUsage(newUsage);
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.message.includes('fetch')) {
        setGenerationError('Backend local não encontrado.');
      } else {
        setGenerationError('Erro ao gerar entendimento: ' + err.message);
      }
      if (activeMeeting) logEvent(activeMeeting.id, 'consensus_generation_error', { error: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!consensus) return;
    let md = `# Entendimento da Reunião\n\n`;
    if (consensus.summary) md += `## Resumo\n${consensus.summary}\n\n`;
    
    const addList = (title: string, items: any[] | undefined) => {
      if (items && items.length > 0) {
        md += `## ${title}\n`;
        items.forEach(i => md += `- ${typeof i === 'string' ? i : i.text}\n`);
        md += '\n';
      }
    };
    
    addList('Combinados', consensus.agreements);
    addList('Decisões', consensus.decisions);
    addList('Obrigações', consensus.obligations);
    addList('Responsáveis', consensus.responsible_parties);
    addList('Prazos', consensus.deadlines);
    addList('Pendências', consensus.pending_items);
    addList('Dúvidas Abertas', consensus.open_questions);
    addList('Pontos sem Consenso', consensus.disputed_points);
    
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Entendimento_da_Reuniao.md';
    a.click();
    URL.revokeObjectURL(url);
    if (activeMeeting) logEvent(activeMeeting.id, 'markdown_exported');
  };


  const startEditing = () => {
    setEditedConsensus(JSON.parse(JSON.stringify(consensus)));
    setIsEditingConsensus(true);
  };

  const handleEditItem = (key: keyof ConsensusObject, index: number, value: string) => {
    if (!editedConsensus) return;
    const newItems = [...(editedConsensus[key] as any[])];
    newItems[index] = { ...newItems[index], text: value };
    setEditedConsensus({ ...editedConsensus, [key]: newItems });
  };

  const handleRemoveItem = (key: keyof ConsensusObject, index: number) => {
    if (!editedConsensus) return;
    const newItems = [...(editedConsensus[key] as any[])];
    newItems.splice(index, 1);
    setEditedConsensus({ ...editedConsensus, [key]: newItems });
  };

  const saveEditedConsensus = async () => {
    if (!editedConsensus || !activeMeeting) return;
    const finalConsensus = { ...editedConsensus, status: 'consensus_obtained' as any, updated_at: Date.now() };
    await saveConsensus(finalConsensus as ConsensusObject);
    setConsensus(finalConsensus);
    setIsEditingConsensus(false);
    await logEvent(activeMeeting.id, 'consensus_edited_and_obtained');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 flex flex-col">
      <header className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-blue-600">ToDeAcordo</h1>
          <p className="text-xs text-slate-500">MVP 1 - Google Meet Adapter</p>
        </div>
        <button 
          onClick={() => setDebugMode(!debugMode)}
          className={`text-xs px-2 py-1 rounded transition-colors ${debugMode ? 'bg-blue-100 text-blue-800' : 'text-slate-400 hover:text-slate-600 underline'}`}
        >
          {debugMode ? 'Fechar Debug' : 'Debug'}
        </button>
      </header>

      <div className="mb-4">
        {meetingState === 'INACTIVE' && (
          <div className="bg-slate-200 text-slate-700 p-3 rounded-md text-sm text-center">
            Abra o Google Meet para iniciar.
          </div>
        )}
        
        {meetingState === 'LOBBY' && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md text-sm text-center">
            Aguardando você entrar na sala do Meet.
          </div>
        )}

        {meetingState === 'ACTIVE' && !captionsEnabled && (
          <div className="bg-red-100 border border-red-200 text-red-800 p-3 rounded-md text-sm text-center font-medium shadow-sm">
            🚨 Ative as legendas do Google Meet (CC). Configure o idioma para <strong>Português (Brasil)</strong>.
          </div>
        )}

        {meetingState === 'ACTIVE' && captionsEnabled && (
          <div className="bg-blue-50 border border-blue-100 text-blue-800 p-2.5 rounded-md text-[12px] leading-relaxed shadow-sm">
            💡 <strong>Legendas ativas!</strong> Se o texto capturado estiver estranho, clique em "Mais opções" (três pontos) no Meet &gt; Legendas, e mude o idioma de entrada para <strong>Português (Brasil)</strong>.
          </div>
        )}
      </div>

      <main className="flex-1 flex flex-col gap-4 overflow-hidden">
        {consensus ? (
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-4 overflow-y-auto flex flex-col gap-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-slate-800">Entendimento da Reunião</h2>
                <span className="text-[10px] font-medium text-slate-400">Plano Free: {usage.count}/{usage.limit} Acordos neste mês</span>
              </div>
              <div className="flex gap-2">
              <button 
                onClick={() => {
                  if (usage.count >= usage.limit) {
                    openPaywall('Novos Acordos (Limite Excedido)');
                  } else {
                    handleGenerateUnderstanding();
                  }
                }}
                disabled={isGenerating || segments.length === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-all transform active:scale-95 flex justify-center items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processando...
                  </>
                ) : (
                  <>✨ Atualizar Entendimento</>
                )}
              </button>
              
              <button 
                onClick={handleCaptureScreenshot}
                disabled={!isCapturing}
                className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white p-3 rounded-lg shadow-sm transition-all flex items-center justify-center"
                title="Capturar Screenshot do Slide"
              >
                📸
              </button>
            </div>
            </div>
            
            {consensus.summary && (
              <div>
                <h3 className="font-semibold text-blue-700 text-sm">Resumo</h3>
                <p className="text-slate-600 text-sm leading-relaxed mt-1">{consensus.summary}</p>
              </div>
            )}
            
            {consensus.agreements && consensus.agreements.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-700 text-sm">Combinados</h3>
                <ul className="list-disc pl-5 mt-1 text-slate-600 text-sm">
                  {consensus.agreements.map((item: any, i: number) => <li key={i} title={item.evidence_quote}>{item.text || item}</li>)}
                </ul>
              </div>
            )}
            
            {consensus.decisions && consensus.decisions.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-700 text-sm">Decisões</h3>
                <ul className="list-disc pl-5 mt-1 text-slate-600 text-sm">
                  {consensus.decisions.map((item: any, i: number) => <li key={i} title={item.evidence_quote}>{item.text || item}</li>)}
                </ul>
              </div>
            )}
            
            {consensus.obligations && consensus.obligations.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-700 text-sm">Obrigações</h3>
                <ul className="list-disc pl-5 mt-1 text-slate-600 text-sm">
                  {consensus.obligations.map((item: any, i: number) => <li key={i} title={item.evidence_quote}>{item.text || item}</li>)}
                </ul>
              </div>
            )}

            {consensus.pending_items && consensus.pending_items.length > 0 && (
              <div>
                <h3 className="font-semibold text-orange-600 text-sm">Pendências</h3>
                <ul className="list-disc pl-5 mt-1 text-slate-600 text-sm">
                  {consensus.pending_items.map((item: any, i: number) => <li key={i} title={item.evidence_quote}>{item.text || item}</li>)}
                </ul>
              </div>
            )}
            
            {consensus.responsible_parties && consensus.responsible_parties.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-700 text-sm">Responsáveis</h3>
                <ul className="list-disc pl-5 mt-1 text-slate-600 text-sm">
                  {consensus.responsible_parties.map((item: any, i: number) => <li key={i} title={item.evidence_quote}>{item.text || item}</li>)}
                </ul>
              </div>
            )}
            
            {consensus.deadlines && consensus.deadlines.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-700 text-sm">Prazos</h3>
                <ul className="list-disc pl-5 mt-1 text-slate-600 text-sm">
                  {consensus.deadlines.map((item: any, i: number) => <li key={i} title={item.evidence_quote}>{item.text || item}</li>)}
                </ul>
              </div>
            )}
            
            {consensus.open_questions && consensus.open_questions.length > 0 && (
              <div>
                <h3 className="font-semibold text-purple-600 text-sm">Dúvidas Abertas</h3>
                <ul className="list-disc pl-5 mt-1 text-slate-600 text-sm">
                  {consensus.open_questions.map((item: any, i: number) => <li key={i} title={item.evidence_quote}>{item.text || item}</li>)}
                </ul>
              </div>
            )}

            {isEditingConsensus ? (
              <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded flex flex-col gap-3">
                <h3 className="font-bold text-blue-800">Modo de Edição</h3>
                <p className="text-xs text-blue-600 mb-2">Faça os ajustes necessários no acordo antes de salvá-lo definitivamente.</p>
                
                {['agreements', 'decisions', 'obligations', 'pending_items', 'responsible_parties', 'deadlines'].map(key => {
                  const items = editedConsensus?.[key as keyof ConsensusObject] as any[] || [];
                  if (items.length === 0) return null;
                  return (
                    <div key={key} className="mb-2">
                      <h4 className="font-semibold text-sm capitalize mb-1">{key.replace('_', ' ')}</h4>
                      <div className="flex flex-col gap-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <textarea 
                              className="flex-1 text-sm p-2 border rounded"
                              value={item.text || item}
                              onChange={(e) => handleEditItem(key as keyof ConsensusObject, idx, e.target.value)}
                              rows={2}
                            />
                            <button onClick={() => handleRemoveItem(key as keyof ConsensusObject, idx)} className="text-red-500 hover:text-red-700 text-lg px-2 mt-1" title="Excluir">🗑️</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setIsEditingConsensus(false)} className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-800 py-2 rounded font-medium">Cancelar</button>
                  <button onClick={saveEditedConsensus} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium">✅ Salvar Versão Definitiva</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-4">
                {consensus.status === 'consensus_obtained' && (
                  <div className="bg-green-100 border border-green-200 text-green-800 p-2 rounded text-center text-sm font-bold shadow-sm mb-2">
                    ✅ Acordo Definitivo
                  </div>
                )}
                
                {consensus.status !== 'consensus_obtained' && (
                  <button 
                    onClick={startEditing}
                    className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded transition-colors shadow-sm"
                  >
                    ✏️ Revisar e Editar Acordo
                  </button>
                )}

                <div className="flex gap-2 mb-2">
                  <button 
                    onClick={() => {
                      if (usage.count >= usage.limit) {
                        openPaywall('PDF Corporativo Premium');
                      } else if (activeMeeting) {
                        chrome.tabs.create({ url: chrome.runtime.getURL(`index.html?route=/meeting/${activeMeeting.id}`) });
                      }
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium py-2 px-2 rounded transition-colors shadow-sm flex items-center justify-center gap-1 border border-slate-200"
                    title={usage.count >= usage.limit ? "Recurso Pro" : "Gerar PDF do Acordo"}
                  >
                    <span>📄</span> PDF Oficial
                  </button>
                  <button 
                    onClick={() => {
                      if (usage.count >= usage.limit) {
                        openPaywall('Link Mágico WhatsApp');
                      } else if (activeMeeting) {
                        const validationLink = `https://todeacordo.com.br/index.html?route=/valida/${activeMeeting.id}`;
                        navigator.clipboard.writeText(validationLink);
                        alert('Link de confirmação do WhatsApp copiado para sua área de transferência!');
                      }
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium py-2 px-2 rounded transition-colors shadow-sm flex items-center justify-center gap-1 border border-slate-200"
                    title={usage.count >= usage.limit ? "Recurso Pro" : "Copiar Link WhatsApp"}
                  >
                    <span>💬</span> Zap/Aceite
                  </button>
                </div>
                  <button 
                    onClick={() => {
                      if (activeMeeting) {
                        chrome.tabs.create({ url: chrome.runtime.getURL(`index.html?route=/meeting/${activeMeeting.id}`) });
                      } else {
                        chrome.tabs.create({ url: chrome.runtime.getURL(`index.html`) });
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 px-2 rounded transition-colors shadow-md text-center mb-2"
                  >
                    ✨ Ver no Dashboard Completo
                  </button>
                  <button 
                    onClick={handleExportMarkdown}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium py-2 px-2 rounded transition-colors shadow-sm text-center"
                    title="Exportar Markdown Bruto (Grátis)"
                  >
                    📝 Exportar Texto Simples
                  </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col h-screen bg-white font-sans text-slate-800">
              <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs">
                    ✓
                  </div>
                  <span className="font-bold text-slate-800 tracking-tight">ToDeAcordo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isCapturing ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {meetingState === 'ACTIVE' ? 'Pronto' : 'Aguardando'}
                  </span>
                </div>
              </header>

              <div className="flex-1 bg-white overflow-hidden flex flex-col animate-fadeIn">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h2 className="text-sm font-bold text-slate-700">Transcrição ao Vivo</h2>
                  <div className="flex gap-2">
                    <span className={`flex h-2 w-2 rounded-full ${captionsEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></span>
                    <button 
                      onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('index.html') })}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors"
                    >
                      📊 Meu Painel
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-white p-3 overflow-y-auto flex flex-col gap-2 min-h-[200px]">
                  {segments.length === 0 ? (
                    <div className="text-center my-auto flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center text-xl mb-3 shadow-inner">
                        CC
                      </div>
                      <p className="text-sm font-bold text-slate-700 mb-1">
                        Ouvindo a reunião
                      </p>
                      <p className="text-sm text-slate-500 mt-2 mb-4 text-center">
                        Fale algo na reunião para ver a transcrição ao vivo aqui.
                      </p>
                      
                      <div className="bg-amber-50 border border-amber-100 rounded text-left p-3 flex flex-col gap-1 mb-3">
                        <p className="text-[10px] text-amber-900 font-bold">🌎 Está capturando em outro idioma?</p>
                        <p className="text-[9px] text-amber-800 leading-tight">
                          No Meet, clique em <strong>Três pontos &gt; Legendas</strong> e selecione o idioma de entrada como <strong>Português (Brasil)</strong>.
                        </p>
                      </div>
                      
                      <div className="bg-indigo-50 border border-indigo-100 rounded text-left p-3 flex gap-2">
                        <span className="text-indigo-500 text-sm">🔒</span>
                        <p className="text-[10px] text-indigo-700 leading-tight">
                          <strong>Privacidade garantida:</strong> O ToDeAcordo não grava áudio. Ele usa exclusivamente o texto gerado pelas legendas oficiais da chamada.
                        </p>
                      </div>
                    </div>
                  ) : (
                    segments.map((seg) => (
                      <div key={seg.id} className="text-sm py-2 animate-fadeIn border-b border-slate-50 last:border-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-bold text-slate-900 text-xs">{seg.speaker && seg.speaker !== 'undefined' && seg.speaker !== 'Unknown' ? seg.speaker : 'Desconhecido'}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(seg.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{seg.text}</p>
                      </div>
                    ))
                  )}
                  
                  {isCapturing && liveDraft && (
                    <div className="text-sm pb-2 opacity-70 italic animate-pulse border-l-2 border-green-500 pl-2">
                      <div className="font-semibold text-green-700">{(liveDraft.speaker && liveDraft.speaker !== 'undefined' && liveDraft.speaker !== 'Unknown') ? liveDraft.speaker : 'Desconhecido'} <span className="text-xs font-normal opacity-50">(Capturando...)</span></div>
                      <div className="text-slate-600 mt-1">{liveDraft.text}</div>
                    </div>
                  )}
                  
                  <div ref={endOfListRef} />
                </div>
              </div>

              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                {generationError && (
                  <div className="mb-3 p-3 bg-amber-50 text-amber-800 rounded border border-amber-200 text-xs flex gap-2 items-start">
                    <span className="mt-0.5">⚠️</span>
                    <p>{generationError}</p>
                  </div>
                )}
                <button
                  onClick={handleGenerateUnderstanding}
                  disabled={isGenerating || segments.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analisando conversa...
                    </>
                  ) : (
                    'Gerar Entendimento Automático'
                  )}
                </button>
              </div>

              {isCapturing && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-green-600 font-medium animate-pulse">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  Capturando legendas...
                </div>
              )}
            </div>
          </>
        )}

        {/* Debug Mode */}
        {debugMode && (
          <div className="bg-slate-900 text-green-400 p-3 rounded-lg text-xs font-mono overflow-y-auto max-h-[300px] flex flex-col gap-3">
            <div>
              <h3 className="font-bold text-white border-b border-slate-800 pb-1 mb-2">Diagnóstico / Telemetria</h3>
              {consensus && (
                <div className="flex flex-col gap-1 text-[11px] mb-3 pb-3 border-b border-slate-800">
                  <p className="text-white font-semibold">Fase 5.3 (Anti-Alucinação):</p>
                  <p><span className="text-slate-400">meeting_id:</span> {consensus.meeting_id}</p>
                  <p><span className="text-slate-400">generated_at:</span> {consensus.generated_at ? new Date(consensus.generated_at).toLocaleTimeString() : 'N/A'}</p>
                  <p><span className="text-slate-400">provider:</span> {consensus.provider}</p>
                  <p><span className="text-slate-400">model:</span> {consensus.model}</p>
                  <p><span className="text-slate-400">is_mock:</span> {String(consensus.is_mock)}</p>
                  <p><span className="text-slate-400">transcript_segment_count:</span> {consensus.transcript_segment_count}</p>
                  <p><span className="text-slate-400">transcript_char_count:</span> {consensus.transcript_char_count}</p>
                  <p><span className="text-slate-400">confidence_score:</span> {consensus.confidence_score}</p>
                </div>
              )}
              {telemetry ? (
                <div className="flex flex-col gap-1 text-[11px]">
                  <p><span className="text-slate-400">activeTabUrl:</span> {telemetry.activeTabUrl}</p>
                  <p><span className="text-slate-400">contentScriptConnected:</span> {String(telemetry.contentScriptConnected)}</p>
                  <p><span className="text-slate-400">meetingState:</span> {telemetry.meetingState}</p>
                  <p><span className="text-slate-400">captionsEnabled:</span> {String(telemetry.captionsEnabled)}</p>
                  <p><span className="text-slate-400">mutationObserverActive:</span> {String(telemetry.mutationObserverActive)}</p>
                  <p><span className="text-slate-400">observedRoot:</span> {telemetry.observedRoot}</p>
                  <p><span className="text-slate-400">lastMutationAt:</span> {telemetry.lastMutationAt > 0 ? new Date(telemetry.lastMutationAt).toLocaleTimeString() : 'Nunca'}</p>
                  
                  <p className="text-white font-semibold mt-2 border-t border-slate-800 pt-1">Draft & Commit (Refatoração):</p>
                  <p><span className="text-slate-400">activeDraftSpeaker:</span> {telemetry.activeDraftSpeaker}</p>
                  <p><span className="text-slate-400">activeDraftText:</span> {telemetry.activeDraftText}</p>
                  <p><span className="text-slate-400">activeDraftUpdatedAt:</span> {telemetry.activeDraftUpdatedAt}</p>
                  <p><span className="text-slate-400">committedSegmentsCount:</span> {telemetry.committedSegmentsCount}</p>
                  <p><span className="text-slate-400">draftUpdateCount:</span> {telemetry.draftUpdateCount}</p>
                  <p className="text-yellow-300"><span className="text-slate-400">lastCommitReason:</span> {telemetry.lastCommitReason}</p>
                  <p className="text-red-300"><span className="text-slate-400">lastDiscardReason:</span> {telemetry.lastDiscardReason}</p>
                  <p className="text-white font-semibold mt-2 border-t border-slate-800 pt-1">Rolling Segment (Upsert):</p>
                  <p><span className="text-slate-400">segmentUpdatedCount:</span> {telemetry.segmentUpdatedCount}</p>
                  <p><span className="text-slate-400">lastSegmentUpdatedId:</span> {telemetry.lastSegmentUpdatedId}</p>
                  <p><span className="text-slate-400">updateReason:</span> {telemetry.updateReason}</p>
                  <p><span className="text-slate-400">isExpansionOfCommitted:</span> {String(telemetry.isExpansionOfCommitted)}</p>
                  <p><span className="text-slate-400">novelSuffix:</span> {telemetry.novelSuffix || '(nenhum)'}</p>
                  <p className="text-green-300"><span className="text-slate-400">lastCommittedId:</span> {telemetry.lastCommittedId}</p>
                  <p className="text-green-300 whitespace-pre-wrap"><span className="text-slate-400">lastCommittedText:</span> {telemetry.lastCommittedText}</p>

                  <p className="text-white font-semibold mt-2 border-t border-slate-800 pt-1">Filtro de Sistema & Captura:</p>
                  <p><span className="text-slate-400">currentCaptureAllowed:</span> {String(telemetry.currentCaptureAllowed)}</p>
                  <p className="text-red-300"><span className="text-slate-400">captureBlockedReason:</span> {telemetry.captureBlockedReason}</p>
                  <p><span className="text-slate-400">systemTextFilteredCount:</span> {telemetry.systemTextFilteredCount}</p>
                  <p className="text-yellow-400"><span className="text-slate-400">lastSystemTextFiltered:</span> {telemetry.lastSystemTextFiltered || '(nenhuma)'}</p>
                  <p><span className="text-slate-400">emittedHashesCount:</span> {telemetry.emittedHashesCount}</p>
                </div>
              ) : (
                <p className="text-slate-500">Aguardando telemetria...</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-white border-b border-slate-800 pb-1 mb-1">Ações Manuais</h3>
              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={handleScanNow} 
                  className="bg-green-800 hover:bg-green-700 text-white px-2 py-1 rounded text-[10px]"
                >
                  ⚡ Capturar texto visível agora
                </button>
                <button 
                  onClick={handleRunProbe} 
                  className="bg-blue-800 hover:bg-blue-700 text-white px-2 py-1 rounded text-[10px]"
                >
                  🔍 Executar Caption Probe
                </button>
              </div>
            </div>

            {probeError && <p className="text-red-400 text-[10px]">{probeError}</p>}

            {probeResult && (
              <div>
                <h3 className="font-bold text-white border-b border-slate-800 pb-1 mb-2">Resultado do Probe</h3>
                <div className="flex flex-col gap-1 text-[11px]">
                  <p><span className="text-slate-400">visibleTextNodesCount:</span> {probeResult.visibleTextNodesCount}</p>
                  <p><span className="text-slate-400">ariaLiveCount:</span> {probeResult.ariaLiveCount}</p>
                  <p><span className="text-slate-400">roleStatusLogCount:</span> {probeResult.roleStatusLogCount}</p>
                  <p><span className="text-slate-400">possibleCaptionContainersCount:</span> {probeResult.possibleCaptionContainersCount}</p>
                  <p><span className="text-slate-400">candidateSelector:</span> {probeResult.candidateSelector}</p>
                  <p><span className="text-slate-400">isVisible:</span> {String(probeResult.isVisible)}</p>
                  <p><span className="text-slate-400">tagName:</span> {probeResult.tagName}</p>
                  <p className="whitespace-pre-wrap"><span className="text-slate-400">lastRawText:</span> {probeResult.lastRawText || '(vazio)'}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<SidePanel />);
}

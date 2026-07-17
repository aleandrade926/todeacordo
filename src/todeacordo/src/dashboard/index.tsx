import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import PrivacyPolicy from './Privacy';
import { getAllMeetings, clearMeeting, saveMeeting } from '../storage/meetingStorage';
import { clearConsensusForMeeting } from '../storage/consensusStorage';
import { saveTranscriptSegment, getTranscriptForMeeting } from '../storage/transcriptStorage';
import ValidationPage from './ValidationPage';
import { MeetingDetailsPage } from './MeetingDetailsPage';
import LandingPage from './LandingPage';
import AdminBetaPage from './AdminBetaPage';
import DemoPage from './DemoPage';
import { PaywallModal } from '../components/PaywallModal';
import { FEATURE_FLAGS } from '../featureFlags';
import { useUsage } from '../hooks/useUsage';

import WaitlistPage from './WaitlistPage';
import TemplateSeoPage from './TemplateSeoPage';
import TrustCenterPage from './TrustCenterPage';
import AdminGrowthDashboard from './AdminGrowthDashboard';
import ShareCardPage from './ShareCardPage';

// Rotas Virais
import ProgrammaticSeoPage from '../viral/ProgrammaticSeoPage';
import MisunderstandingCalculator from '../viral/MisunderstandingCalculator';
import BeforeAfterLab from '../viral/BeforeAfterLab';
import PublicRoaster from '../viral/PublicRoaster';
import WallOfConfusion from '../viral/WallOfConfusion';
import WhatsAppViralKit from '../viral/WhatsAppViralKit';
import NotAMinuteMicrosite from '../viral/NotAMinuteMicrosite';
import CompetitorPositioning from '../viral/CompetitorPositioning';

// Portas de Expansão
import IntegrationsDoor from '../doors/IntegrationsDoor';
import ApiDoor from '../doors/ApiDoor';
import WhiteLabelDoor from '../doors/WhiteLabelDoor';
import MarketplaceDoor from '../doors/MarketplaceDoor';
import PartnerDoor from '../doors/PartnerDoor';
import EnterpriseDoor from '../doors/EnterpriseDoor';
import AdminOpportunities from './AdminOpportunities';

// Protocolo
import { ProtocolDoor, AutopsyDoor, DoctorDoor, BenchmarkDoor, IntelligenceDoor, ConsultantKitDoor, EmailSignatureDoor } from '../doors/CategoryDoors';

const DEMO_MEETINGS = [
  { id: 'demo-1', title: 'Combinado com cliente', started_at: Date.now() - 1000 * 60 * 60 * 24, ended_at: Date.now() - 1000 * 60 * 60 * 23, duration: '45 min', status: 'ended', participants: ['Você', 'Cliente'], isDemo: true, type: 'demo', consensusStatus: 'Confirmado' },
  { id: 'demo-2', title: 'Orçamento de reforma', started_at: Date.now() - 1000 * 60 * 60 * 48, ended_at: Date.now() - 1000 * 60 * 60 * 47, duration: '1h20', status: 'ended', participants: ['Você', 'Empreiteiro'], isDemo: true, type: 'demo', consensusStatus: 'Pendente' },
  { id: 'demo-3', title: 'Entrega com freelancer', started_at: Date.now() - 1000 * 60 * 60 * 72, ended_at: Date.now() - 1000 * 60 * 60 * 71, duration: '15 min', status: 'ended', participants: ['Você', 'Dev'], isDemo: true, type: 'demo', consensusStatus: 'Com ressalvas' },
  { id: 'demo-4', title: 'Aluguel casa de praia', started_at: Date.now() - 1000 * 60 * 60 * 96, ended_at: Date.now() - 1000 * 60 * 60 * 95, duration: '30 min', status: 'ended', participants: ['Você', 'Marcos'], isDemo: true, type: 'demo', consensusStatus: 'Confirmado' },
  { id: 'demo-5', title: 'Combinado da viagem', started_at: Date.now() - 1000 * 60 * 60 * 120, ended_at: Date.now() - 1000 * 60 * 60 * 119, duration: '45 min', status: 'ended', participants: ['Você', 'Ana'], isDemo: true, type: 'demo', consensusStatus: 'Confirmado' },
  { id: 'demo-6', title: 'Divisão de contas', started_at: Date.now() - 1000 * 60 * 60 * 144, ended_at: Date.now() - 1000 * 60 * 60 * 143, duration: '10 min', status: 'ended', participants: ['Você', 'João'], isDemo: true, type: 'demo', consensusStatus: 'Pendente' }
];

  const getInitialRoute = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const route = urlParams.get('route');
    if (route) return route;
    return window.location.pathname;
  };

const DashboardApp = () => {
  const [currentRoute] = useState(getInitialRoute());
  const [currentTab, setCurrentTab] = useState('meetings');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [attemptedFeature, setAttemptedFeature] = useState('');
  const [showTopBanner, setShowTopBanner] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creationModalOpen, setCreationModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{link: string} | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [orphanMeetings, setOrphanMeetings] = useState<any[]>([]);
  const { canCreateUnderstanding, recordUsage } = useUsage();

  const [showLanguageWarning, setShowLanguageWarning] = useState<boolean>(() => {
    try {
      const dismissedAt = localStorage.getItem('todeacordo_lang_warn_dismissed_at');
      if (!dismissedAt) return true;
      const dismissedTime = parseInt(dismissedAt, 10);
      if (isNaN(dismissedTime)) return true;
      
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime > sevenDaysInMs) {
        return true;
      }
      return false;
    } catch (e) {
      return true;
    }
  });

  const handleDismissLanguageWarning = () => {
    try {
      localStorage.setItem('todeacordo_lang_warn_dismissed_at', Date.now().toString());
    } catch (e) {
      console.error(e);
    }
    setShowLanguageWarning(false);
  };

  const [userName, setUserName] = useState<string>('Meu Perfil');

  useEffect(() => {
    const loadUserName = async () => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['todeacordo_user_name'], (result: any) => {
          if (result && result.todeacordo_user_name) {
            setUserName(result.todeacordo_user_name);
          }
        });
      } else {
        const local = localStorage.getItem('todeacordo_user_name');
        if (local) {
          setUserName(local);
        }
      }
    };
    loadUserName();
  }, []);

  const handleEditUserName = () => {
    const newName = prompt('Como você gostaria de ser chamado?', userName === 'Meu Perfil' ? '' : userName);
    if (newName !== null) {
      const trimmed = newName.trim();
      const finalName = trimmed || 'Meu Perfil';
      setUserName(finalName);
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ todeacordo_user_name: finalName });
      } else {
        localStorage.setItem('todeacordo_user_name', finalName);
      }
    }
  };

  const getUserInitials = (name: string) => {
    if (name === 'Meu Perfil') return 'MP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
  };

  const showToast = (message: string, type: 'success'|'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const allMeetings = await getAllMeetings();
      const validMeetings = allMeetings.filter((m: any) => m.status !== 'cleared').sort((a: any, b: any) => b.started_at - a.started_at);
      setMeetings(validMeetings);

      // Detects orphan sessions (has segments, but no consensus generated — e.g. battery died or crashed)
      const orphans = [];
      for (const m of allMeetings) {
        if (!m.consensus_object_id && m.status !== 'cleared') {
          const segs = await getTranscriptForMeeting(m.id);
          if (segs.length > 0) {
            orphans.push({ ...m, segmentCount: segs.length });
          }
        }
      }
      setOrphanMeetings(orphans);

      // Auto-Generate Check
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autoGenerate') === 'true') {
        const mId = urlParams.get('meetingId');
        if (mId) {
          // Open the specific meeting with a flag to auto-generate
          window.location.replace(`?route=/meeting/${mId}&autoGenerate=true`);
        }
      }

      // Auto-Open Paywall Check
      if (urlParams.get('showPaywall') === 'true') {
        const feature = urlParams.get('feature') || 'Recurso Pro';
        setAttemptedFeature(feature);
        setPaywallOpen(true);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Route is already initialized

  const handleDelete = async (meetingId: string, isDemo?: boolean) => {
    if (confirm('Tem certeza que deseja excluir este entendimento?')) {
      if (!isDemo) {
        await clearMeeting(meetingId);
        await clearConsensusForMeeting(meetingId);
        await loadData();
      } else {
        setMeetings(prev => prev.filter(m => m.id !== meetingId));
      }
      showToast('Excluído com sucesso', 'success');
    }
  };

  const [isPasting, setIsPasting] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const handleCreateExample = async () => {
    try {
      if (!canCreateUnderstanding()) {
        openFeature('Limite Gratuito Atingido');
        return;
      }
      await recordUsage();
      setCreationModalOpen(false);

      const meetingId = `meet-demo-${Date.now()}`;
      const meeting = {
        id: meetingId,
        title: 'Exemplo de Reunião (João e Maria)',
        started_at: Date.now() - 1000 * 60 * 5,
        ended_at: Date.now(),
        duration: '5 min',
        status: 'ended',
        participants: ['Você', 'João', 'Maria'],
        is_active: false,
        transcript_segment_ids: []
      };

      const segments = [
        { id: `seg-1-${Date.now()}`, speaker: 'João', text: 'Então ficou acordado que a gente entrega o layout na semana que vem, né?', captured_at: Date.now() - 5000, meeting_id: meetingId, timestamp: new Date(Date.now() - 5000).toISOString(), source: 'demo' },
        { id: `seg-2-${Date.now()}`, speaker: 'Maria', text: 'Sim, mas depende do time de marketing me passar a logo nova.', captured_at: Date.now() - 4000, meeting_id: meetingId, timestamp: new Date(Date.now() - 4000).toISOString(), source: 'demo' },
        { id: `seg-3-${Date.now()}`, speaker: 'João', text: 'Beleza, se eles passarem, a gente entrega. E o pagamento?', captured_at: Date.now() - 3000, meeting_id: meetingId, timestamp: new Date(Date.now() - 3000).toISOString(), source: 'demo' },
        { id: `seg-4-${Date.now()}`, speaker: 'Maria', text: 'Pode ser 50% agora e o restante depois, ou a gente acerta tudo no final, vemos depois.', captured_at: Date.now() - 2000, meeting_id: meetingId, timestamp: new Date(Date.now() - 2000).toISOString(), source: 'demo' }
      ];

      await saveMeeting(meeting as any);
      for (const seg of segments) {
        await saveTranscriptSegment(seg);
      }

      window.location.replace(`?route=/meeting/${meetingId}&autoGenerate=true`);
    } catch (e) {
      console.error('Erro ao criar exemplo:', e);
      showToast('Erro ao criar exemplo operacional', 'error');
    }
  };

  const handleProcessPastedText = async () => {
    try {
      if (!pastedText.trim()) {
        showToast('Por favor, cole algum texto.', 'error');
        return;
      }
      if (!canCreateUnderstanding()) {
        openFeature('Limite Gratuito Atingido');
        return;
      }
      await recordUsage();
      setIsPasting(false);
      setCreationModalOpen(false);

      const meetingId = `meet-paste-${Date.now()}`;
      const meeting = {
        id: meetingId,
        title: 'Conversa Colada',
        started_at: Date.now() - 1000 * 60 * 2,
        ended_at: Date.now(),
        duration: '2 min',
        status: 'ended',
        participants: ['Você'],
        is_active: false,
        transcript_segment_ids: []
      };

      const lines = pastedText.split('\n').filter(l => l.trim() !== '');
      const segments = lines.map((line, idx) => {
        const trimmed = line.trim();
        // Recognize only `[Name]: text` or `Name: text` (brackets optional, colon required)
        const match = trimmed.match(/^\[?([^\]\:]+)\]?\s*:\s*(.*)$/);
        if (match) {
          const speaker = match[1].trim();
          const text = match[2].trim();
          return {
            id: `seg-p-${idx}-${Date.now()}`,
            speaker,
            text,
            captured_at: Date.now() - (lines.length - idx) * 1000,
            meeting_id: meetingId,
            timestamp: new Date(Date.now() - (lines.length - idx) * 1000).toISOString(),
            source: 'pasted'
          };
        }
        // Line without ':' -> treat whole line as text by a generic participant
        return {
          id: `seg-p-${idx}-${Date.now()}`,
          speaker: 'Participante',
          text: trimmed,
          captured_at: Date.now() - (lines.length - idx) * 1000,
          meeting_id: meetingId,
          timestamp: new Date(Date.now() - (lines.length - idx) * 1000).toISOString(),
          source: 'pasted'
        };
      });

      // Fill meeting participants with unique speakers found in the pasted text
      const participants = Array.from(new Set(segments.map(s => s.speaker)));
      meeting.participants = participants;

      await saveMeeting(meeting as any);
      for (const seg of segments) {
        await saveTranscriptSegment(seg);
      }
      setPastedText('');

      window.location.replace(`?route=/meeting/${meetingId}&autoGenerate=true`);
    } catch (e) {
      console.error('Erro ao processar texto colado:', e);
      showToast('Erro ao processar a conversa colada', 'error');
    }
  };

  const handleCreateAction = async () => {
    setCreationModalOpen(true);
    setIsPasting(true);
  };

  const openGoogleMeet = () => {
    setCreationModalOpen(false);
    window.open('https://meet.google.com/new', '_blank');
  };



  const openFeature = (feature: string) => {
    setCreationModalOpen(false);
    setAttemptedFeature(feature);
    setPaywallOpen(true);
  };

  const renderCreationModal = () => {
    if (!creationModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
          <button onClick={() => { setCreationModalOpen(false); setIsPasting(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
          
          {isPasting ? (
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Colar conversa ou transcrição</h3>
              <p className="text-xs text-slate-500 mb-4">Cole a transcrição de um chat, e-mail ou reunião abaixo para extrair os combinados operacionais.</p>
              <textarea 
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="Ex:&#10;[João] Entrego na terça-feira&#10;[Maria] Combinado, te pago 50% após o recebimento"
                className="w-full h-48 border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-amber-400 outline-none mb-4 resize-none text-sm"
              />
              <div className="flex gap-2">
                <button onClick={() => setIsPasting(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl transition-colors text-sm">
                  Voltar
                </button>
                <button onClick={handleProcessPastedText} className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-2 rounded-xl transition-colors text-sm">
                  Gerar com IA
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-6">Como deseja criar?</h3>
              <div className="space-y-3">
                <button onClick={handleCreateAction} className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-colors flex items-center gap-3">
                  <span className="text-xl">📝</span>
                  <span className="font-bold text-slate-800">Colar conversa</span>
                </button>
                <button onClick={openGoogleMeet} className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-colors flex items-center gap-3">
                  <span className="text-xl">📹</span>
                  <span className="font-bold text-slate-800">Usar Google Meet</span>
                </button>
                <button onClick={handleCreateExample} className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-3">
                  <span className="text-xl">👀</span>
                  <span className="font-bold text-slate-800">Criar exemplo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPinModal = () => {
    if (!showPinModal) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative border border-slate-100">
          <button 
            onClick={() => setShowPinModal(false)} 
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold transition-colors"
          >
            ✕
          </button>
          
          <div className="text-center mb-6">
            <h3 className="text-2xl font-black text-slate-900 mb-2 flex items-center justify-center gap-2">
              Você está quase lá! 🥳
            </h3>
            <p className="text-slate-500 text-sm">
              Fixe a extensão no seu navegador para ativá-la facilmente nas chamadas do Google Meet.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-center">
            {/* Imagem Ilustrativa Gerada */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-2 shadow-inner">
              <img 
                src="/pin_extension_guide.png" 
                alt="Como fixar extensão" 
                className="w-full object-contain max-h-56 rounded-lg"
              />
            </div>

            {/* Passos do Tutorial */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">Clique no ícone de Extensões</p>
                  <p className="text-xs text-slate-500">Ele tem o formato de quebra-cabeça 🧩 e fica no topo direito do seu Chrome.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">Encontre o ToDeAcordo</p>
                  <p className="text-xs text-slate-500">Procure pelo ToDeAcordo na lista de extensões instaladas.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">Clique no Alfinete 📌</p>
                  <p className="text-xs text-slate-500">Ao clicar para fixar, o ícone do ToDeAcordo ficará visível permanentemente na barra superior do navegador.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => setShowPinModal(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-indigo-200 transition-all transform active:scale-95 text-sm"
            >
              Fixei a extensão!
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMeetingRow = (meeting: any, isDemo: boolean = false) => {
    const validationLink = isDemo ? `/index.html?route=/valida/demo` : `/index.html?route=/valida/${meeting.id}`;
    const dashboardLink = isDemo ? `index.html?route=/meeting/demo` : `index.html?route=/meeting/${meeting.id}`;
    const statusText = meeting.consensusStatus || 'Pendente';
    const statusColor = statusText === 'Confirmado' ? 'bg-green-100 text-green-700 border-green-200' : statusText === 'Com ressalvas' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200';
    const hasConsensus = !!meeting.consensus_object_id;

    return (
      <div key={meeting.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-colors border-b border-slate-100 last:border-0 ${isDemo ? 'bg-amber-50/30' : 'hover:bg-slate-50'}`}>
        <div className="flex-1 min-w-0 pr-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <a href={dashboardLink} className="text-sm font-bold text-slate-900 truncate hover:text-blue-600 transition-colors">
                {meeting.title || 'Entendimento sem título'}
              </a>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColor}`}>
                {statusText}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {new Date(meeting.started_at).toLocaleDateString()}</span>
              {meeting.duration && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span>{meeting.duration}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2 flex-wrap justify-end">
          {/* Botão Gerar Entendimento para reuniões sem consensus */}
          {!isDemo && !hasConsensus && (
            <a
              href={`index.html?route=/meeting/${meeting.id}&autoGenerate=true`}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm border border-amber-300"
              title="Gerar entendimento com IA"
            >
              <span>🧠</span> Gerar entendimento
            </a>
          )}

          {statusText === 'Pendente' ? (
            <button onClick={() => {
              const link = `${window.location.origin}${validationLink}`;
              const msg = `Envie este link para confirmar o entendimento:\n👉 ${link}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
            }} className="hidden md:flex bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded-lg shadow-sm transition-colors items-center gap-2 text-sm">
              <span>💬</span> Compartilhar
            </button>
          ) : null}
          
          <a href={dashboardLink} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1 text-xs font-medium" title="Ver no Painel">
            <span className="text-sm">👁</span> <span className="hidden md:inline">Painel</span>
          </a>
          <button onClick={() => {
            navigator.clipboard.writeText(window.location.origin + validationLink);
            showToast('Link copiado!');
          }} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors flex items-center gap-1 text-xs font-medium" title="Copiar Link de Validação">
            <span className="text-sm">🔗</span> <span className="hidden md:inline">Copiar Link</span>
          </button>
          {statusText !== 'Pendente' && (
            <button onClick={() => {
              const link = `${window.location.origin}${validationLink}`;
              const msg = `Envie este link para confirmar o entendimento:\n👉 ${link}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
            }} className="p-1.5 text-slate-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors flex items-center gap-1 text-xs font-medium" title="WhatsApp">
              <span className="text-sm">💬</span> <span className="hidden md:inline">WhatsApp</span>
            </button>
          )}
          <button onClick={() => handleDelete(meeting.id, isDemo)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir">
            <span className="text-sm">🗑</span>
          </button>
        </div>
      </div>
    );
  };

  const renderSuccessModal = () => {
    if (!successModalData) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative text-center">
          <button onClick={() => setSuccessModalData(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
          
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">✓</div>
          
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Tudo pronto. Seu link de confirmação foi gerado.</h3>
          <p className="text-slate-500 mb-8">Envie para a outra pessoa confirmar se entendeu da mesma forma.</p>
          
          <div className="space-y-3 mb-6">
            <button onClick={() => {
              const msg = `Envie este link para confirmar o entendimento:\n👉 ${successModalData.link}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
            }} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-lg">
              <span>💬</span> Enviar por WhatsApp
            </button>
            <button onClick={() => {
              navigator.clipboard.writeText(successModalData.link);
              showToast('Link copiado!');
            }} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg">
              <span>🔗</span> Copiar link
            </button>
          </div>
          
          <a href={successModalData.link} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
            Ver entendimento
          </a>
        </div>
      </div>
    );
  };

  const renderMeetingsList = () => {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
        {showTopBanner && (
          <div className="bg-indigo-600 text-white px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-semibold shadow-md">
            <div className="flex items-center gap-2">
              <span>⚡</span>
              <span>Quer capturar combinados em tempo real no Google Meet? Instale nossa extensão oficial Chrome!</span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <button 
                onClick={() => setShowPinModal(true)}
                className="text-white hover:text-indigo-200 underline font-bold transition-colors text-xs"
              >
                Como fixar? 🧩
              </button>
              <a 
                href="https://chromewebstore.google.com/detail/jicbcgjheaebfkecdpeenpnifgpjjgig?utm_source=item-share-cb"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-50 transition-all shadow-sm"
              >
                Instalar no Chrome
              </a>
              <button onClick={() => setShowTopBanner(false)} className="text-white/80 hover:text-white font-bold text-base leading-none">✕</button>
            </div>
          </div>
        )}

        <div className="p-4 md:p-10 max-w-5xl mx-auto w-full">
          <div className="flex flex-row justify-between items-center mb-6 md:mb-8 gap-4">
            <h2 className="text-lg md:text-2xl font-black text-slate-900 mb-0 flex items-center gap-2 md:gap-3">
              Meus entendimentos
            </h2>
            <button onClick={() => setCreationModalOpen(true)} className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-black px-4 py-2 md:px-10 md:py-5 rounded-lg md:rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all whitespace-nowrap text-sm md:text-xl flex items-center gap-2 md:gap-3 border border-amber-300">
              <span className="md:hidden">+ Criar</span>
              <span className="hidden md:inline">+ Criar entendimento</span>
            </button>
          </div>

          {showLanguageWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">⚠️</span>
                <div className="text-amber-900">
                  <p className="font-bold text-sm sm:text-base">Antes de iniciar:</p>
                  <p className="text-xs sm:text-sm mt-1 text-amber-800 font-medium">
                    Ative as legendas do Google Meet e selecione Português (Brasil).
                  </p>
                  <p className="font-bold text-sm sm:text-base mt-3">No Meet:</p>
                  <p className="text-xs sm:text-sm mt-1 text-amber-800 leading-relaxed font-medium">
                    Mais opções <strong>⋮</strong> ➔ <strong>Configurações</strong> ➔ <strong>Legendas</strong> ➔ <strong>Português (Brasil)</strong>.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleDismissLanguageWarning}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-xs sm:text-sm shrink-0 border border-amber-600 self-start md:self-center shadow-sm"
              >
                Entendi, continuar
              </button>
            </div>
          )}

          {/* Recovery Banner for orphan/interrupted sessions */}
          {orphanMeetings.length > 0 && (
            <div className="mb-6 bg-amber-50 border border-amber-300 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">⚡</span>
                <div className="flex-1">
                  <p className="font-bold text-amber-900 text-sm">Sessão interrompida detectada</p>
                  <p className="text-amber-700 text-xs mt-1">Uma reunião foi capturada mas o entendimento não foi gerado (queda de energia, fechamento inesperado). Os segmentos de transcrição estão salvos.</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {orphanMeetings.map((m) => (
                  <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-amber-200 rounded-xl px-4 py-3 gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{m.title || 'Reunião sem título'}</p>
                      <p className="text-xs text-slate-500">{new Date(m.started_at).toLocaleString('pt-BR')} • {m.segmentCount} segmentos capturados</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {/* Link relativo (funciona na extensão) */}
                      <a
                        href={`index.html?route=/meeting/${m.id}&autoGenerate=true`}
                        className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        🧠 Gerar entendimento
                      </a>
                      {/* Link absoluto (funciona no site web) */}
                      <a
                        href={`https://todeacordo.com.br/app?route=/meeting/${m.id}&autoGenerate=true`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1"
                        title="Abrir no site (se estiver acessando pela extensão)"
                      >
                        🌐 Abrir no site
                      </a>
                      <button
                        onClick={async () => {
                          await clearMeeting(m.id);
                          setOrphanMeetings(prev => prev.filter(x => x.id !== m.id));
                        }}
                        className="text-slate-400 hover:text-red-500 px-2 py-2 rounded-lg text-xs transition-colors"
                        title="Descartar sessão"
                      >
                        🗑 Descartar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estatísticas dinâmicas */}
          {(() => {
            const allDisplayMeetings = meetings.length > 0 ? meetings : DEMO_MEETINGS;
            const confirmedCount = allDisplayMeetings.filter((m: any) => (m.consensusStatus || 'Pendente') === 'Confirmado').length;
            const pendingCount = allDisplayMeetings.filter((m: any) => (m.consensusStatus || 'Pendente') === 'Pendente').length;
            const reservationsCount = allDisplayMeetings.filter((m: any) => (m.consensusStatus || 'Pendente') === 'Com ressalvas').length;
            const totalCount = allDisplayMeetings.length;
            const clarityPct = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;
            const clarityColor = clarityPct >= 80 ? 'text-green-600' : clarityPct >= 50 ? 'text-amber-500' : 'text-red-500';
            return (
              <>
                {/* Social / Network Effect Indicator */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">📈</div>
                  <p className="text-sm text-indigo-900 font-medium"><strong>{confirmedCount} {confirmedCount === 1 ? 'entendimento confirmado' : 'entendimentos confirmados'}</strong> na sua base.</p>
                </div>

                <div className="relative mb-6">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">🔍</span>
                  <input 
                    type="text" 
                    placeholder="Buscar entendimento por título..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-4 pl-12 pr-4 text-base focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-sm"
                  />
                </div>

                {/* Assinatura do Produto (Indicador Central) */}
                <div className="bg-white rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-1">Entendimentos recentes</h2>
                    <p className="text-slate-500 text-sm">Resumo da sua base de alinhamentos.</p>
                  </div>
                  <div className="flex gap-6 items-center">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> {confirmedCount} {confirmedCount === 1 ? 'Confirmado' : 'Confirmados'}</div>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> {pendingCount} {pendingCount === 1 ? 'Pendente' : 'Pendentes'}</div>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> {reservationsCount} Com ressalvas</div>
                    </div>
                    <div className="w-px h-16 bg-slate-200"></div>
                    <div className="text-center pr-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clareza média</div>
                      <div className={`text-3xl font-black ${clarityColor}`}>{clarityPct}%</div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Seção Copiloto IA removida no MVP */}

          {(() => {
            const query = searchQuery.trim().toLowerCase();
            const filterByQuery = (m: any) => !query || (m.title || '').toLowerCase().includes(query);

            if (meetings.length === 0) {
              const filteredDemo = DEMO_MEETINGS.filter(filterByQuery);
              return (
                <div className="mb-8">
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-10 text-center shadow-sm max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-6">🤝</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Toda conversa importante merece terminar com um entendimento compartilhado.</h3>
                    <p className="text-slate-500 text-sm mb-8">Cole uma conversa, importe do Google Meet ou comece escrevendo.</p>
                    <div className="flex justify-center flex-wrap gap-3">
                      <button onClick={handleCreateAction} className="bg-slate-900 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm hover:bg-slate-800 transition-colors text-sm">Colar conversa</button>
                      <button onClick={openGoogleMeet} className="bg-white border border-slate-300 text-slate-700 font-bold px-6 py-2.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm">Usar no Meet</button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Exemplos para testar</h3>
                    <span className="text-xs text-slate-500">Experimente o fluxo completo antes de usar uma conversa real.</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {filteredDemo.length > 0 ? filteredDemo.map(m => renderMeetingRow(m, true)) : (
                      <div className="p-6 text-center text-slate-400 text-sm">Nenhum exemplo encontrado para "{searchQuery}".</div>
                    )}
                  </div>
                </div>
              );
            }

            const filteredMeetings = meetings.filter(filterByQuery);
            return (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-16">
                {filteredMeetings.length > 0 ? filteredMeetings.map(m => renderMeetingRow(m, false)) : (
                  <div className="p-6 text-center text-slate-400 text-sm">Nenhum entendimento encontrado para "{searchQuery}".</div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  // === REDIRECIONAMENTO DE DOMÍNIO ===
  if (window.location.hostname === 'app.todeacordo.com.br' && currentRoute === '/') {
    window.location.replace('/app');
    return null;
  }

  // === ROTAS ESSENCIAIS ===
  if (currentRoute.startsWith('/meeting')) return <MeetingDetailsPage />;
  if (currentRoute.startsWith('/valida')) return <ValidationPage />;
  if (currentRoute === '/demo') return <DemoPage />;
  if (currentRoute.startsWith('/demo/')) return <ValidationPage />;
  if (currentRoute === '/analisar') return <PublicRoaster />;
  if (currentRoute === '/privacidade') return <PrivacyPolicy />;

  // === ROTAS SECUNDÁRIAS ===
  if (FEATURE_FLAGS.ENABLE_SEO_PAGES && currentRoute.startsWith('/templates/')) return <TemplateSeoPage />;
  if (FEATURE_FLAGS.ENABLE_SEO_PAGES && currentRoute.startsWith('/share/')) return <ShareCardPage />;
  if (FEATURE_FLAGS.ENABLE_WAITLIST && currentRoute === '/waitlist') return <WaitlistPage />;
  if (FEATURE_FLAGS.ENABLE_TRUST_CENTER && currentRoute === '/seguranca') return <TrustCenterPage />;
  
  // Rotas Virais
  if (FEATURE_FLAGS.ENABLE_GROWTH_ROUTES && currentRoute.startsWith('/casos-de-uso/')) return <ProgrammaticSeoPage />;
  if (FEATURE_FLAGS.ENABLE_GROWTH_ROUTES && currentRoute.startsWith('/comparativos/')) return <CompetitorPositioning />;
  if (FEATURE_FLAGS.ENABLE_GROWTH_ROUTES && currentRoute === '/calculadora') return <MisunderstandingCalculator />;
  if (FEATURE_FLAGS.ENABLE_GROWTH_ROUTES && currentRoute === '/antes-e-depois') return <BeforeAfterLab />;
  if (FEATURE_FLAGS.ENABLE_GROWTH_ROUTES && currentRoute === '/mural') return <WallOfConfusion />;
  if (FEATURE_FLAGS.ENABLE_GROWTH_ROUTES && currentRoute === '/tools/whatsapp') return <WhatsAppViralKit />;
  if (FEATURE_FLAGS.ENABLE_GROWTH_ROUTES && currentRoute === '/nao-e-ata') return <NotAMinuteMicrosite />;

  // Portas de Expansão
  if (FEATURE_FLAGS.ENABLE_FAKE_DOORS && currentRoute === '/integracoes') return <IntegrationsDoor />;
  if (FEATURE_FLAGS.ENABLE_FAKE_DOORS && currentRoute === '/api') return <ApiDoor />;
  if (FEATURE_FLAGS.ENABLE_FAKE_DOORS && currentRoute === '/white-label') return <WhiteLabelDoor />;
  if (FEATURE_FLAGS.ENABLE_FAKE_DOORS && currentRoute === '/templates') return <MarketplaceDoor />;
  if (FEATURE_FLAGS.ENABLE_FAKE_DOORS && currentRoute === '/parceiros') return <PartnerDoor />;
  if (FEATURE_FLAGS.ENABLE_FAKE_DOORS && currentRoute === '/empresas') return <EnterpriseDoor />;
  
  // Admin Dashboards
  if (FEATURE_FLAGS.ENABLE_ADMIN_DASHBOARDS && currentRoute === '/admin/growth') return <AdminGrowthDashboard />;
  if (FEATURE_FLAGS.ENABLE_ADMIN_DASHBOARDS && currentRoute === '/admin/opportunities') return <AdminOpportunities />;
  if (FEATURE_FLAGS.ENABLE_ADMIN_DASHBOARDS && currentRoute === '/admin/intelligence') return <IntelligenceDoor />;
  if (FEATURE_FLAGS.ENABLE_ADMIN_DASHBOARDS && currentRoute === '/admin-beta') return <AdminBetaPage />;
  
  // Protocolo
  if (FEATURE_FLAGS.ENABLE_PROTOCOL_PAGES && currentRoute === '/protocol') return <ProtocolDoor />;
  if (FEATURE_FLAGS.ENABLE_PROTOCOL_PAGES && currentRoute === '/autopsia') return <AutopsyDoor />;
  if (FEATURE_FLAGS.ENABLE_PROTOCOL_PAGES && currentRoute === '/doctor') return <DoctorDoor />;
  if (FEATURE_FLAGS.ENABLE_PROTOCOL_PAGES && currentRoute === '/benchmark') return <BenchmarkDoor />;
  if (FEATURE_FLAGS.ENABLE_PROTOCOL_PAGES && currentRoute === '/kit/consultores') return <ConsultantKitDoor />;
  if (FEATURE_FLAGS.ENABLE_SIGNATURE && currentRoute === '/assinatura-email') return <EmailSignatureDoor />;

  if (currentRoute === '/') return <LandingPage />;
  if (loading) return <div className="flex h-screen items-center justify-center">Carregando painel...</div>;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <aside className="w-full md:w-[220px] bg-slate-900 border-b md:border-r md:border-b-0 border-slate-800 flex flex-row md:flex-col shrink-0 md:h-full text-slate-300">
        <div className="p-4 flex items-center gap-3 shrink-0 border-r border-slate-800 md:border-r-0">
          <div className="w-7 h-7 bg-amber-400 rounded-lg flex items-center justify-center text-slate-900 font-bold text-base shadow-sm shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h1 className="hidden md:block text-lg font-black text-white tracking-tight">ToDeAcordo</h1>
        </div>

        <div className="flex-1 overflow-x-auto md:overflow-y-auto flex flex-row md:flex-col scrollbar-hide">
          <nav className="px-3 py-2 flex flex-row md:flex-col gap-2 md:gap-0 items-center md:items-stretch md:space-y-1 text-sm font-medium">
            <button onClick={() => setCurrentTab('meetings')} className={`whitespace-nowrap flex items-center gap-2 md:gap-3 text-left px-3 py-2 rounded-lg transition-colors ${currentTab === 'meetings' ? 'bg-amber-400/10 text-amber-400 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <span className="opacity-70">📄</span> <span className="hidden sm:inline">Meus entendimentos</span><span className="sm:hidden">Entendimentos</span>
            </button>
            
            <button onClick={() => setCreationModalOpen(true)} className="whitespace-nowrap flex items-center gap-2 md:gap-3 text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors md:mt-2">
              <span className="opacity-70">➕</span> <span className="hidden sm:inline">Novo entendimento</span><span className="sm:hidden">Novo</span>
            </button>
            
            <button onClick={() => setCurrentTab('privacy')} className={`whitespace-nowrap flex items-center gap-2 md:gap-3 text-left px-3 py-2 rounded-lg transition-colors ${currentTab === 'privacy' ? 'bg-amber-400/10 text-amber-400 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <span className="opacity-70">🔒</span> Privacidade
            </button>

            <button 
              onClick={() => {
                setAttemptedFeature('Apoio Voluntário');
                setPaywallOpen(true);
              }}
              className="whitespace-nowrap flex items-center gap-2 md:gap-3 text-left px-3 py-2 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-colors md:mt-4 border border-amber-400/20 bg-amber-450/5 text-xs font-bold"
            >
              <span>⚡</span> <span className="hidden sm:inline">Apoiar / Virar Pro</span><span className="sm:hidden">Virar Pro</span>
            </button>
          </nav>

          <div className="mt-auto pb-4 hidden md:block">
            {/* Upgrade/Plano usage hidden for MVP */}

            <div 
              onClick={handleEditUserName}
              title="Clique para alterar seu nome"
              className="px-4 py-2 border-t border-slate-800/50 mt-2 flex items-center gap-3 hover:bg-slate-800 cursor-pointer transition-colors mx-2 rounded-lg"
            >
              <div className="w-6 h-6 rounded bg-slate-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                {getUserInitials(userName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{userName}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-slate-50">
        {currentTab === 'meetings' ? renderMeetingsList() : <div className="p-8 max-w-5xl mx-auto"><PrivacyPolicy /></div>}

        {toast && (
          <div className="absolute bottom-6 right-6 z-50 animate-fadeIn">
            <div className={`px-4 py-3 rounded border text-sm font-bold shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-600 border-green-700 text-white' : 'bg-red-600 border-red-700 text-white'
            }`}>
              {toast.message}
            </div>
          </div>
        )}

        {renderCreationModal()}
        {renderPinModal()}
      </main>

      {renderSuccessModal()}
      <PaywallModal 
        isOpen={paywallOpen} 
        onClose={() => setPaywallOpen(false)} 
        attemptedFeature={attemptedFeature} 
      /></div>
  );
};

const container = document.getElementById('dashboard-root');
if (container) {
  const root = createRoot(container);
  root.render(<DashboardApp />);
}


import { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import { getTranscriptForMeeting } from "../storage/transcriptStorage";

interface TranscriptSegment {
  id?: string;
  meeting_id: string;
  speaker: string | null;
  text: string;
  timestamp: string;
  normalized_text?: string;
  confidence?: number;
}

const SidePanel = () => {
  const [meetingState, setMeetingState] = useState<"INACTIVE" | "LOBBY" | "ACTIVE" | "UNKNOWN">("UNKNOWN");
  const [captionsEnabled, setCaptionsEnabled] = useState<boolean>(false);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string>("");
  const [liveDraft, setLiveDraft] = useState<any>(null);
  const endOfListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfListRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [segments]);

  // Load existing segments when meeting ID is known
  useEffect(() => {
    if (activeMeetingId) {
      getTranscriptForMeeting(activeMeetingId).then(loaded => {
        if (loaded && loaded.length > 0) {
          setSegments(loaded);
        }
      });
    }
  }, [activeMeetingId]);

  useEffect(() => {
    const updateTelemetry = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "GET_STATUS" }, (response: any) => {
            if (chrome.runtime.lastError) return;
            if (response) {
              setMeetingState(response.meetingState || "UNKNOWN");
              setCaptionsEnabled(response.captionsEnabled || false);
              
              if (response.meetingId && response.meetingId !== activeMeetingId) {
                setActiveMeetingId(response.meetingId);
              }
            }
          });
        }
      });
    };

    updateTelemetry();
    const interval = setInterval(updateTelemetry, 1500);
    return () => clearInterval(interval);
  }, [activeMeetingId]);

  useEffect(() => {
    const messageListener = (message: any, _sender: chrome.runtime.MessageSender, sendResponse: (r?: any) => void) => {
      if (message.type === "PING") {
        sendResponse({ status: "PONG_FROM_SIDEPANEL" });
        return true;
      }
      if (message.type === "MEET_STATUS_UPDATE") {
        setMeetingState(message.state);
        setCaptionsEnabled(message.captionsEnabled);
        if (message.meetingId) setActiveMeetingId(message.meetingId);
        sendResponse({ status: "ACK" });
      } else if (message.type === "transcript_segment_committed") {
        if (message.segment) {
          setSegments(prev => [...prev, message.segment]);
        }
        sendResponse({ status: "ACK" });
      } else if (message.type === "transcript_segment_updated") {
        if (message.segment) {
          setSegments(prev => prev.map(s => s.id === message.segment.id ? message.segment : s));
        }
        sendResponse({ status: "ACK" });
      } else if (message.type === "caption_draft_updated") {
        if (message.draft) {
          setLiveDraft(message.draft);
        }
        sendResponse({ status: "ACK" });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  const handleGenerateUnderstanding = async () => {
    if (segments.length === 0) {
      setGenerationError("Nenhuma fala capturada ainda. Ligue as legendas do Google Meet para come�ar.");
      return;
    }
    
    setGenerationError("");
    setIsGenerating(true);
    
    try {
      const response = await fetch("https://app.todeacordo.com.br/api/generate-consensus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          meeting_id: activeMeetingId || "manual_" + Date.now(),
          source_platform: "google-meet",
          participants: [],
          transcript_segments: segments
        })
      });

      if (!response.ok) {
        throw new Error("Erro na API da Vercel: " + response.statusText);
      }

      const result = await response.json();

      if (!result.meeting_id) {
        throw new Error("API n�o retornou meeting_id v�lido.");
      }

      chrome.tabs.create({ url: `https://todeacordo.com.br/app?route=/meeting/${result.meeting_id}` });
    } catch (err: any) {
      console.error(err);
      setGenerationError("Falha ao gerar o consenso: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenDashboard = () => {
    chrome.tabs.create({ url: "https://todeacordo.com.br/app" });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <img src="icons/icon48.png" alt="Logo" className="w-6 h-6 object-contain" />
          <h1 className="font-bold text-slate-800 text-sm tracking-tight">ToDeAcordo</h1>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700">Status do Meet</h2>
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${meetingState === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
              {meetingState === "ACTIVE" ? "EM ANDAMENTO" : meetingState}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className={`h-2 w-2 rounded-full ${captionsEnabled ? "bg-green-500 animate-pulse" : "bg-red-400"}`}></div>
            <p className="text-xs text-slate-600">
              {captionsEnabled ? "Legendas ativas (Capturando)" : "Legendas inativas (Ative no Meet para capturar)"}
            </p>
          </div>

          <p className="text-xs text-slate-500">Falas capturadas: <span className="font-bold text-slate-700">{segments.length}</span></p>

          {liveDraft && (
            <div className="mt-3 bg-amber-50 rounded-lg p-2 border border-amber-200 animate-pulse">
              <span className="text-[10px] font-bold text-amber-600 block mb-1">
                {liveDraft.speaker || "Participante"} <span className="text-slate-400 font-normal ml-1">Falando...</span>
              </span>
              <p className="text-xs text-slate-600 italic line-clamp-2">{liveDraft.text}</p>
            </div>
          )}
        </div>

        {generationError && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-xs text-red-600">
            {generationError}
          </div>
        )}

        <button 
          onClick={handleGenerateUnderstanding}
          disabled={isGenerating || segments.length === 0}
          className={`w-full py-3 px-4 rounded-lg font-bold text-white shadow-md transition-colors flex items-center justify-center gap-2 ${isGenerating || segments.length === 0 ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {isGenerating ? "Gerando na Nuvem..." : "? Gerar entendimento"}
        </button>

        <button 
          onClick={handleOpenDashboard}
          className="w-full py-3 px-4 rounded-lg font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors text-xs"
        >
          ?? Acessar meu painel
        </button>
      </main>
    </div>
  );
};

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<SidePanel />);
}


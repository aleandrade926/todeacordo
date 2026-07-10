import type { ConsensusObject, TranscriptSegment } from '../../types';

interface GenerationParams {
  meetingId: string;
  sourcePlatform?: string;
  participants?: string[];
  transcriptSegments: TranscriptSegment[];
}

export async function generateConsensusViaLlama(params: GenerationParams): Promise<ConsensusObject> {
  const API_BASE_URL = import.meta.env.VITE_TODEACORDO_CONSENSUS_API_BASE_URL
    || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://app.todeacordo.com.br');
  const BACKEND_URL = `${API_BASE_URL}/api/generate-consensus`;
  
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meeting_id: params.meetingId,
      source_platform: params.sourcePlatform || 'google-meet',
      participants: params.participants || [],
      transcript_segments: params.transcriptSegments
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Falha ao gerar entendimento (HTTP ${response.status}).`);
  }

  const consensus = await response.json();
  
  // Adaptador temporário para garantir que a interface não quebre caso a API retorne o formato simples
  if (consensus && typeof consensus.consensus === 'string') {
    return {
      id: "temp-" + Date.now().toString(),
      meeting_id: params.meetingId,
      source_platform: params.sourcePlatform || 'google-meet',
      title: 'Resumo da Reunião',
      created_at: Date.now(),
      updated_at: Date.now(),
      participants: params.participants || [],
      transcript_segments: params.transcriptSegments || [],
      consensus_versions: [{ version: 1, created_at: Date.now(), content: consensus }],
      current_version: 1,
      status: 'pending_review',
      summary: consensus.consensus,
      agreements: [],
      decisions: [{ text: "Entendimento consolidado em formato simples", evidence_quote: consensus.consensus.substring(0, 50) + "..." }],
      obligations: [],
      pending_items: [],
      responsible_parties: [],
      deadlines: [],
      open_questions: [],
      disputed_points: [],
      confidence_score: 50,
      provider: 'groq',
      model: consensus.model || 'llama-3.1-70b-versatile',
      audit_events: []
    } as ConsensusObject;
  }

  return consensus as ConsensusObject;
}

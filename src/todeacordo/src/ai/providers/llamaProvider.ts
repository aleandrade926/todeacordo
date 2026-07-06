import type { ConsensusObject, TranscriptSegment } from '../../types';

interface GenerationParams {
  meetingId: string;
  sourcePlatform?: string;
  participants?: string[];
  transcriptSegments: TranscriptSegment[];
}

export async function generateConsensusViaLlama(params: GenerationParams): Promise<ConsensusObject> {
  const API_BASE_URL = import.meta.env.VITE_TODEACORDO_API_BASE_URL || '';
  const BACKEND_URL = `${API_BASE_URL}/api/todeacordo-consensus`;
  
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
    throw new Error(errorData.error || 'Falha ao gerar consenso com Llama via backend na nuvem.');
  }

  const consensus = await response.json();
  return consensus as ConsensusObject;
}

import type { AuditEvent } from '../audit/auditTypes';

export type ConsensusStatus = 'draft' | 'pending_review' | 'changes_requested' | 'consensus_obtained' | 'disputed' | 'archived';

export interface LiveCaptionDraft {
  id: string;
  speaker: string | null;
  text: string;
  normalized_text: string;
  started_at: number;
  updated_at: number;
  source_node_signature: string;
  status: 'live' | 'committed' | 'discarded';
}

export interface TranscriptSegment {
  id: string;
  meeting_id: string;
  timestamp: string;
  speaker: string | null;
  text: string;
  source: string;
  captured_at: number;
  
  // Opcionais para Auditoria e Deduplicação rígida
  normalized_text?: string;
  normalized_hash?: string;
  dedupe_reason?: string;
  raw_source_text?: string;
  updated_count?: number;
}

export interface ConsensusVersion {
  version: number;
  created_at: number;
  content: any;
}

export interface ConsensusItem {
  id?: string; // Adicionado ID único para tracking de ressalvas item a item
  text: string;
  evidence_quote?: string;
  status?: 'accepted' | 'rejected' | 'needs_adjustment';
  objection_note?: string;
}

export const evaluateTrafficLight = (partialConsensus: Partial<ConsensusObject>) => {
  const redFlagsWords = ["talvez", "depois", "a gente vê", "mais ou menos", "depende", "pode ser", "vamos alinhar"];
  
  const allTexts = [
    ...(partialConsensus.agreements || []).map(a => typeof a === 'string' ? a : a.text),
    ...(partialConsensus.decisions || []).map(a => typeof a === 'string' ? a : a.text),
    ...(partialConsensus.obligations || []).map(a => typeof a === 'string' ? a : a.text),
  ].join(' ').toLowerCase();

  const foundFlags = redFlagsWords.filter(word => allTexts.includes(word));
  const missing = [];
  
  if (!partialConsensus.agreements || partialConsensus.agreements.length === 0) missing.push('acordos');
  if (!partialConsensus.obligations || partialConsensus.obligations.length === 0) missing.push('obrigações');
  
  // Calculate score 0-100
  let score = 100;
  score -= foundFlags.length * 15;
  score -= missing.length * 20;
  
  let trafficLight: 'green' | 'yellow' | 'red' = 'green';
  if (score < 60) trafficLight = 'red';
  else if (score < 85 || foundFlags.length > 0) trafficLight = 'yellow';

  partialConsensus.confidence_score = Math.max(0, score);
  partialConsensus.traffic_light = trafficLight;
  partialConsensus.red_flags = foundFlags;
  partialConsensus.missing_elements = missing;
};

export interface ConsensusObject {
  id: string;
  meeting_id: string;
  source_platform: string;
  title: string;
  created_at: number;
  updated_at: number;
  participants: string[];
  transcript_segments: TranscriptSegment[];
  consensus_versions: ConsensusVersion[];
  clarity_score?: number;
  risk_flags?: {
    type: string;
    text: string;
    evidence_quote?: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  current_version: number;
  status: ConsensusStatus;
  provider?: string;
  model?: string;
  is_mock?: boolean;
  generated_at?: number;
  input_hash?: string;
  consensus_hash?: string; // SHA-256 final document
  validation_hash?: string; // SHA-256 post-signature
  transcript_char_count?: number;
  transcript_segment_count?: number;
  
  // Semáforo e Red Flags (Fase 10D)
  confidence_score?: number; // 0 a 100
  traffic_light?: 'green' | 'yellow' | 'red';
  red_flags?: string[];
  missing_elements?: string[];
  
  // Fase 10E: Risk Map e Próximo Passo
  next_step?: string;
  risk_map?: {
    scope: 'low' | 'medium' | 'high';
    deadline: 'low' | 'medium' | 'high';
    budget: 'low' | 'medium' | 'high';
    responsibility: 'low' | 'medium' | 'high';
  };
  
  summary?: string;
  agreements?: ConsensusItem[];
  decisions?: ConsensusItem[];
  obligations?: ConsensusItem[];
  pending_items?: ConsensusItem[];
  responsible_parties?: ConsensusItem[];
  deadlines?: ConsensusItem[];
  open_questions?: ConsensusItem[];
  disputed_points?: ConsensusItem[];
  
  attachments?: string[];
  validationLink?: string;
  validatedBy?: Array<{
    name: string;
    ip: string;
    timestamp: number;
  }>;
  signatures?: Array<{
    name: string;
    timestamp: number;
    image: string; // Base64 data URL
    accepted_version: number;
    document_hash: string;
  }>;
  
  audit_events: AuditEvent[];
}


export interface MeetingSession {
  id: string;
  platform: string;
  source_platform: string;
  meeting_url?: string;
  meeting_code?: string;
  title: string;
  started_at: number;
  ended_at?: number;
  status: 'active' | 'ended' | 'cleared';
  is_active: boolean; // deprecated by status, but kept for compatibility
  participants: string[];
  transcript_segment_ids: string[];
  consensus_object_id?: string;
  created_at: number;
  updated_at: number;
}

import type { ConsensusObject, TranscriptSegment } from '../types';
import { evaluateTrafficLight } from '../types';
import { generateConsensusViaLlama } from './providers/llamaProvider';
import { mockProvider } from './providers/mockProvider';

const USE_MOCK_FALLBACK = false;

interface ConsensusGenerationOptions {
  meetingId: string;
  sourcePlatform?: string;
  participants?: string[];
  segments: TranscriptSegment[];
}

export async function generateConsensusFromTranscript(options: ConsensusGenerationOptions): Promise<Partial<ConsensusObject>> {
  const { meetingId, sourcePlatform, participants, segments } = options;

  if (!segments || segments.length === 0) {
    throw new Error('Nenhuma fala capturada. Não é possível gerar um entendimento.');
  }

  // Filtrar apenas os consolidaddos/reais, caso passe lixo
  let cleanSegments = segments.filter(s => s.text && s.speaker);

  // Fase 5.4: Deduplicação avançada no payload (Hash + Substring window)
  const normalizeForDedupe = (str: string) => {
    return str.toLowerCase().replace(/[^\w\sÀ-ÿ]/g, '').replace(/\s+/g, ' ').trim();
  };

  const uniqueSegments: TranscriptSegment[] = [];
  for (const seg of cleanSegments) {
    const normText = normalizeForDedupe(seg.text);
    if (!normText) continue;
    
    // Procura por overlap em todas as falas anteriores para descartar re-emissão pura (MVP: checa tudo)
    let isDuplicate = false;
    // Ao invés de usar slice(-5), vamos verificar contra todos os segmentos únicos processados até agora
    for (const recent of uniqueSegments) {
      if (recent.speaker !== seg.speaker) continue;
      
      const recentNorm = normalizeForDedupe(recent.text);
      if (recentNorm.includes(normText)) {
        isDuplicate = true; // O novo é fragmento ou exato do anterior
        break;
      } else if (normText.includes(recentNorm)) {
        // O novo é uma expansão do anterior. Substituímos o anterior pelo novo.
        recent.text = seg.text;
        recent.normalized_text = seg.normalized_text;
        isDuplicate = true;
        break;
      }

      // Advanced word overlap check for Google Meet rolling caption replacements
      const commWords = recentNorm.split(' ').filter(w => w.length > 0);
      const newWords = normText.split(' ').filter(w => w.length > 0);
      
      if (commWords.length >= 3 && newWords.length >= 3) {
        let matchCount = 0;
        const minLen = Math.min(commWords.length, newWords.length);
        for (let i = 0; i < minLen; i++) {
          if (commWords[i] === newWords[i]) {
            matchCount++;
          } else {
            break;
          }
        }
        if (matchCount / commWords.length >= 0.60) {
          recent.text = newWords.length > commWords.length ? seg.text : recent.text;
          recent.normalized_text = newWords.length > commWords.length ? seg.normalized_text : recent.normalized_text;
          isDuplicate = true;
          break;
        }
        
        const overlap = commWords.filter(w => newWords.includes(w)).length;
        if (commWords.length >= 4 && overlap / commWords.length >= 0.75) {
          recent.text = newWords.length > commWords.length ? seg.text : recent.text;
          recent.normalized_text = newWords.length > commWords.length ? seg.normalized_text : recent.normalized_text;
          isDuplicate = true;
          break;
        }
      }
    }

    if (!isDuplicate) {
      uniqueSegments.push(seg);
    }
  }

  cleanSegments = uniqueSegments;

  try {
    // Fase 10D: Semáforo e Red Flags
    const evaluateTrafficLight = (partialConsensus: Partial<ConsensusObject>) => {
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

    // Chama o Provider Llama (via backend local)
    console.log(`[ToDeAcordo] Chamando Llama Provider para ${cleanSegments.length} segmentos...`);
    const consensus = await generateConsensusViaLlama({
      meetingId,
      sourcePlatform,
      participants,
      transcriptSegments: cleanSegments
    });
    
    // Anexa dados base
    consensus.id = crypto.randomUUID();
    consensus.meeting_id = meetingId;
    consensus.created_at = Date.now();
    consensus.transcript_segments = cleanSegments;
    consensus.provider = 'llama-local';

    evaluateTrafficLight(consensus);

    return consensus;
  } catch (error) {
    console.error('[ToDeAcordo] Falha ao gerar consenso via Llama:', error);
    
    if (USE_MOCK_FALLBACK) {
      console.warn('[ToDeAcordo] Usando Mock Provider como fallback devido a erro de API.');
      const transcriptText = cleanSegments.map(s => `${s.speaker}: ${s.text}`).join('\n');
      const mock = await mockProvider(transcriptText);
      const finalMock = {
        ...mock,
        id: crypto.randomUUID(),
        meeting_id: meetingId,
        created_at: Date.now(),
        transcript_segments: cleanSegments,
        provider: 'mock-provider'
      };
      evaluateTrafficLight(finalMock);
      return finalMock;
    }
    
    throw error;
  }
}

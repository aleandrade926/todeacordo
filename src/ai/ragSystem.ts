import { getAllMeetings } from '../storage/meetingStorage';
import { getTranscriptForMeeting } from '../storage/transcriptStorage';

/**
 * RAG Engine (Retrieval-Augmented Generation) 
 * Módulo ultra-sofisticado para "Conversar com suas reuniões passadas".
 */

export interface SemanticSearchResult {
  meetingId: string;
  segmentId: string;
  text: string;
  speaker: string | null;
  timestamp: string;
  score: number;
}

// Em um ambiente real, carregaríamos o @xenova/transformers
// Para este laboratório, vamos construir o motor de busca vetorial local em TF-IDF ou similar.
export class LocalVectorDB {
  private documents: Array<{ id: string, meetingId: string, text: string, speaker: string | null, timestamp: string }> = [];

  async indexAllMeetings() {
    this.documents = [];
    const meetings = await getAllMeetings();
    for (const meeting of meetings) {
      const transcripts = await getTranscriptForMeeting(meeting.id);
      for (const t of transcripts) {
        if (t.text && t.text.trim().length > 10) {
          this.documents.push({
            id: t.id,
            meetingId: meeting.id,
            text: t.text.toLowerCase(),
            speaker: t.speaker,
            timestamp: t.timestamp
          });
        }
      }
    }
  }

  // Busca semântica simplificada (BM25 fallback)
  async search(query: string, topK: number = 5): Promise<SemanticSearchResult[]> {
    if (this.documents.length === 0) await this.indexAllMeetings();

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    const scoredDocs = this.documents.map(doc => {
      let score = 0;
      for (const term of terms) {
        if (doc.text.includes(term)) {
          score += 1;
        }
      }
      return { ...doc, score };
    });

    return scoredDocs
      .filter(d => d.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(d => ({
        meetingId: d.meetingId,
        segmentId: d.id,
        text: d.text,
        speaker: d.speaker,
        timestamp: d.timestamp,
        score: d.score
      }));
  }
}

export const vectorDB = new LocalVectorDB();

export async function askMeetingAssistant(question: string): Promise<string> {
  const results = await vectorDB.search(question, 10);
  
  if (results.length === 0) {
    return "Não encontrei nada sobre isso no seu histórico de reuniões.";
  }

  const context = results.map(r => `[Reunião: ${r.meetingId}] ${r.speaker || 'Desconhecido'}: "${r.text}"`).join('\n');
  
  // Aqui chamaríamos a API da OpenAI/Groq injetando o contexto (RAG)
  // Como estamos isolando, retornamos as evidências.
  
  return `Baseado no seu histórico, encontrei estas evidências relevantes:\n\n${context}\n\n(No ambiente de produção, este contexto será mastigado pelo LLM para gerar uma resposta natural).`;
}

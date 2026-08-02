import crypto from 'crypto';

export const SYSTEM_PROMPT = `Você é um assistente de extração de dados estritamente baseado no transcript fornecido.
Extraia da conversa as decisões, obrigações, prazos e pendências.

REGRAS CRÍTICAS E OBRIGATÓRIAS DE GROUNDING (ANTI-ALUCINAÇÃO):
1. USE EXCLUSIVAMENTE o texto fornecido em "Transcrição". 
2. IGNORE qualquer conhecimento prévio. Se não estiver no texto, não existe.
3. NÃO INVENTE decisões, combinados, responsáveis, prazos ou obrigações que não foram explicitamente falados.
4. Para cada item adicionado nas listas, você DEVE extrair um "evidence_quote" exato (literal).
5. Se o transcript for insuficiente, retorne as listas VAZIAS e um confidence_score baixo (0 a 30).
6. Retorne APENAS JSON válido.

Formato JSON esperado:
{
  "title": "string (resumo em até 5 palavras)",
  "summary": "string (resumo estrito do que foi falado)",
  "agreements": [{"text": "string", "evidence_quote": "string exata do transcript"}],
  "decisions": [{"text": "string", "evidence_quote": "string exata do transcript"}],
  "obligations": [{"text": "string", "evidence_quote": "string exata do transcript"}],
  "pending_items": [{"text": "string", "evidence_quote": "string exata do transcript"}],
  "clarity_score": "number (0-100)",
  "risk_flags": [
    {
      "type": "string (ex: Prazo Ambíguo, Escopo Aberto)",
      "text": "string",
      "evidence_quote": "string exata",
      "severity": "low | medium | high"
    }
  ],
  "confidence_score": "number (0-100)"
}`;

export function buildPrompt(sourcePlatform, participants, transcriptSegments) {
  const conversationText = transcriptSegments
    .map(s => `[${(s.timestamp && !isNaN(Date.parse(s.timestamp))) ? new Date(s.timestamp).toISOString() : '00:00:00'}] ${s.speaker}: ${s.text}`)
    .join('\n');

  return `Dados da reunião:\nPlataforma: ${sourcePlatform || 'Desconhecida'}\nParticipantes: ${(participants || []).join(', ')}\n\nTranscrição:\n${conversationText}`;
}

export function buildConsensusRecord(meetingId, participants, transcriptSegments, parsedData, providerInfo = {}) {
  const hash = crypto.createHash('sha256').update(JSON.stringify(parsedData)).digest('hex');
  
  return {
    id: crypto.randomUUID(),
    meeting_id: meetingId || crypto.randomUUID(),
    generated_at: Date.now(),
    status: 'pending_review',
    participants: participants || [],
    transcript_segments: transcriptSegments || [],
    current_version: 1,
    consensus_versions: [{ version: 1, created_at: Date.now(), content: parsedData, document_hash: hash }],
    title: parsedData.title || "",
    summary: parsedData.summary || "",
    agreements: parsedData.agreements || [],
    decisions: parsedData.decisions || [],
    obligations: parsedData.obligations || [],
    pending_items: parsedData.pending_items || [],
    responsible_parties: parsedData.responsible_parties || [],
    deadlines: parsedData.deadlines || [],
    open_questions: parsedData.open_questions || [],
    disputed_points: parsedData.disputed_points || [],
    reservations: parsedData.reservations || [],
    clarity_score: parsedData.clarity_score || 0,
    risk_flags: parsedData.risk_flags || [],
    confidence_score: parsedData.confidence_score || 0,
    provider: providerInfo.provider || 'groq',
    model: providerInfo.model || 'llama-3.3-70b-versatile',
    is_mock: false,
    transcript_char_count: transcriptSegments ? transcriptSegments.reduce((acc, s) => acc + (s.text ? s.text.length : 0), 0) : 0,
    transcript_segment_count: transcriptSegments ? transcriptSegments.length : 0
  };
}

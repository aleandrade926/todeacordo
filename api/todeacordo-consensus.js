// Vercel Serverless Function para o ToDeAcordo
// Substitui o express do backend/server.js

const LLAMA_API_URL = process.env.LLAMA_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const LLAMA_API_KEY = process.env.LLAMA_API_KEY || process.env.GROQ_API_KEY || '';
const LLAMA_MODEL = process.env.LLAMA_MODEL || 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `Você é um assistente de extração de acordos operacionais estritamente baseado no transcript fornecido.
Extraia da conversa apenas os combinados firmes, decisões, obrigações, pendências, responsáveis, prazos e questões em aberto.

REGRAS CRÍTICAS E OBRIGATÓRIAS DE GROUNDING (ANTI-ALUCINAÇÃO):
1. USE EXCLUSIVAMENTE o texto fornecido em "Transcrição".
2. IGNORE qualquer conhecimento prévio sobre ToDeAcordo, MVP, Manifest V3, OpenAI, Edge Function, Groq, Supabase, backend ou similares. Se esses termos não aparecerem literalmente no transcript, eles não podem existir na resposta.
3. NÃO INVENTE decisões, combinados, responsáveis, prazos, pendências ou questões em aberto que não foram explicitamente falados.
4. Se a evidência não puder ser encontrada de forma clara, prefira omitir o item em vez de inventar.
5. Se o transcript estiver confuso, curto, fragmentado ou insuficiente para extrair acordos firmes, retorne as listas VAZIAS e um confidence_score baixo (0 a 30).
6. Retorne APENAS JSON válido, sem markdown.

Formato JSON esperado:
{
  "title": "string (resumo em até 5 palavras do assunto principal falado, ou 'Entendimento insuficiente')",
  "summary": "string (resumo estrito do que foi falado. Se insuficiente, diga 'A conversa capturada não contém elementos suficientes.')",
  "agreements": [{"text": "string", "evidence_quote": "string exata do transcript"}],
  "decisions": [{"text": "string", "evidence_quote": "string exata do transcript"}],
  "obligations": [{"text": "string", "evidence_quote": "string exata do transcript"}],
  "pending_items": [{"text": "string", "evidence_quote": "string exata do transcript"}],
  "responsible_parties": [{"text": "string", "evidence_quote": "string exata do transcript"}],
  "deadlines": [{"text": "string", "evidence_quote": "string exata do transcript"}],
  "open_questions": [{"text": "string", "evidence_quote": "string exata do transcript"}],
  "disputed_points": [{"text": "string", "evidence_quote": "string exata do transcript"}],
  "confidence_score": 0 a 100
}`;

function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^\w\sÀ-ÿ]/g, '').replace(/\s+/g, ' ').trim();
}

function validateItems(items, normalizedTranscript) {
  if (!Array.isArray(items)) return [];
  return items.filter(item => {
    if (!item.text || !item.evidence_quote) return false;
    const normalizedQuote = normalizeString(item.evidence_quote);
    if (!normalizedQuote || normalizedQuote.length < 5) return false;
    if (normalizedTranscript.includes(normalizedQuote)) return true;

    const normalizedText = normalizeString(item.text);
    const textWords = normalizedText.split(' ').filter(w => w.length > 3);
    const matchingTextWords = textWords.filter(word => normalizedTranscript.includes(word));

    return matchingTextWords.length >= Math.min(2, textWords.length);
  });
}

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'todeacordo-vercel-backend' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { meeting_id, source_platform, participants, transcript_segments } = req.body;

    if (!transcript_segments || transcript_segments.length === 0) {
      return res.status(400).json({ error: 'Nenhum segmento fornecido' });
    }

    const conversationText = transcript_segments.map(s => `${s.speaker}: ${s.text}`).join('\n');
    const charCount = conversationText.length;
    const segmentCount = transcript_segments.length;

    // Gate
    if (segmentCount < 3 && charCount < 50) {
      return res.status(200).json({
        title: "Entendimento insuficiente",
        summary: "A conversa capturada é muito curta para extrair combinados firmes.",
        agreements: [],
        decisions: [],
        obligations: [],
        pending_items: [],
        responsible_parties: [],
        deadlines: [],
        open_questions: [],
        disputed_points: [],
        confidence_score: 0,
        model: LLAMA_MODEL,
        provider: 'vercel-edge',
        is_mock: false,
        generated_at: Date.now(),
        transcript_char_count: charCount,
        transcript_segment_count: segmentCount
      });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Contexto da reunião:\nID: ${meeting_id}\nPlataforma: ${source_platform}\nParticipantes: ${participants.join(', ')}\n\nTranscrição:\n${conversationText}` }
    ];

    const llamaResponse = await fetch(LLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLAMA_API_KEY}`
      },
      body: JSON.stringify({
        model: LLAMA_MODEL,
        messages: messages,
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    if (!llamaResponse.ok) {
      throw new Error(`Llama API error: ${llamaResponse.status}`);
    }

    const data = await llamaResponse.json();
    let parsedContent;
    try {
      parsedContent = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      throw new Error('Falha ao parsear JSON da LLM');
    }

    const normalizedTranscript = normalizeString(conversationText);

    // Filter hallucinated items
    parsedContent.agreements = validateItems(parsedContent.agreements, normalizedTranscript);
    parsedContent.decisions = validateItems(parsedContent.decisions, normalizedTranscript);
    parsedContent.obligations = validateItems(parsedContent.obligations, normalizedTranscript);
    parsedContent.pending_items = validateItems(parsedContent.pending_items, normalizedTranscript);
    parsedContent.responsible_parties = validateItems(parsedContent.responsible_parties, normalizedTranscript);
    parsedContent.deadlines = validateItems(parsedContent.deadlines, normalizedTranscript);
    parsedContent.open_questions = validateItems(parsedContent.open_questions, normalizedTranscript);
    parsedContent.disputed_points = validateItems(parsedContent.disputed_points, normalizedTranscript);

    const totalItemsCount = 
      parsedContent.agreements.length +
      parsedContent.decisions.length +
      parsedContent.obligations.length +
      parsedContent.pending_items.length +
      parsedContent.responsible_parties.length +
      parsedContent.deadlines.length +
      parsedContent.open_questions.length +
      parsedContent.disputed_points.length;

    if (totalItemsCount === 0) {
      parsedContent.title = "Entendimento insuficiente";
      parsedContent.summary = "A conversa capturada não contém elementos suficientes para formar combinados claros, ou todas as extrações falharam na validação textual.";
      parsedContent.confidence_score = 0;
    }

    res.status(200).json({
      ...parsedContent,
      model: LLAMA_MODEL,
      provider: 'vercel-edge',
      is_mock: false,
      generated_at: Date.now(),
      transcript_char_count: charCount,
      transcript_segment_count: segmentCount
    });

  } catch (error) {
    console.error('[Vercel ToDeAcordo] Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
}

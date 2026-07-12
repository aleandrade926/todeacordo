import { SYSTEM_PROMPT, buildPrompt, buildConsensusRecord } from './_lib/consensusCore.js';

// No edge runtime here because we're using Node APIs like fetch and standard environment variables.
// Default to Node.js serverless function.

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { meeting_id, source_platform, participants, transcript_segments } = req.body;

    if (!transcript_segments || !Array.isArray(transcript_segments)) {
      return res.status(400).json({ error: 'transcript_segments ausente ou inválido.' });
    }

    const conversationText = transcript_segments
      .map(s => `[${(s.timestamp && !isNaN(Date.parse(s.timestamp))) ? new Date(s.timestamp).toISOString() : '00:00:00'}] ${s.speaker}: ${s.text}`)
      .join('\n');

    if (conversationText.trim().length < 50) {
      return res.status(400).json({ error: 'Transcript insuficiente.' });
    }

    // Identificação automática de idioma para evitar legendas incorretas
    function detectLanguage(text) {
      const norm = text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ')
        .replace(/\s+/g, ' ');
      const padded = ' ' + norm + ' ';
      const enWords = [' the ', ' and ', ' you ', ' that ', ' is ', ' was ', ' for ', ' are ', ' with ', ' have ', ' this ', ' they ', ' would ', ' what ', ' because '];
      const ptWords = [' que ', ' em ', ' um ', ' uma ', ' com ', ' para ', ' por ', ' como ', ' nao ', ' sim ', ' mais ', ' voce ', ' nos ', ' eles ', ' porque ', ' sobre ', ' tudo ', ' todos '];
      let enCount = 0;
      let ptCount = 0;
      for (const w of enWords) {
        let pos = padded.indexOf(w);
        while (pos !== -1) {
          enCount++;
          pos = padded.indexOf(w, pos + 1);
        }
      }
      for (const w of ptWords) {
        let pos = padded.indexOf(w);
        while (pos !== -1) {
          ptCount++;
          pos = padded.indexOf(w, pos + 1);
        }
      }
      let posE = padded.indexOf(' e ');
      while (posE !== -1) {
        ptCount++;
        posE = padded.indexOf(' e ', posE + 1);
      }
      let posY = padded.indexOf(' y ');
      let esCount = 0;
      while (posY !== -1) {
        esCount++;
        posY = padded.indexOf(' y ', posY + 1);
      }
      if (enCount > 2 && enCount > ptCount) return 'en';
      if (esCount > 2 && esCount > ptCount) return 'es';
      return 'pt';
    }

    const detectedLang = detectLanguage(conversationText);
    if (detectedLang !== 'pt') {
      const langName = detectedLang === 'en' ? 'Inglês' : 'Espanhol';
      return res.status(400).json({ 
        error: `O áudio/legenda da reunião está em ${langName}. Por favor, configure o idioma da legenda no Google Meet para Português (Brasil) e tente novamente.` 
      });
    }

    const userPrompt = buildPrompt(source_platform, participants, transcript_segments);
    
    let parsedData = null;
    let providerUsed = 'groq';
    let modelUsed = process.env.LLAMA_MODEL || 'llama-3.3-70b-versatile';

    const LLAMA_API_URL = process.env.LLAMA_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      console.warn("GROQ_API_KEY não configurada na Vercel. Falha na geração.");
      return res.status(500).json({ error: 'Configuração de API LLM ausente no servidor.' });
    }

    const llmResponse = await fetch(LLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: modelUsed,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        stream: false
      })
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      throw new Error(`Erro LLM (${llmResponse.status}): ${errorText}`);
    }

    const data = await llmResponse.json();
    let content = data.choices[0].message.content;
    
    // Strip markdown formatting if present
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      parsedData = JSON.parse(content);
    } catch (e) {
      console.error("Erro no parse do JSON. Conteúdo retornado:", content);
      throw new Error("O modelo retornou um JSON inválido.");
    }

    const consensusRecord = buildConsensusRecord(
      meeting_id,
      participants,
      transcript_segments,
      parsedData,
      { provider: providerUsed, model: modelUsed }
    );

    res.status(200).json(consensusRecord);
  } catch (error) {
    console.error('Erro na extração serverless:', error);
    res.status(500).json({ error: 'Falha ao gerar entendimento.', details: error.message });
  }
}

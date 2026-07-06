export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });
    }

    const { audio, mimetype } = req.body;
    if (!audio) {
      return res.status(400).json({ error: 'Missing audio base64 payload' });
    }

    const buffer = Buffer.from(audio, 'base64');
    
    // Create FormData for Groq API
    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimetype || 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'pt');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Groq API Error:', data);
      return res.status(response.status).json({ error: 'Groq API Error', details: data });
    }

    return res.status(200).json({
      text: data.text,
      speaker: 'Speaker', // Whisper without diarization doesn't know the speaker
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

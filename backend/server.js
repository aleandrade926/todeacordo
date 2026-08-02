import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Imita as funções serverless importando e encapsulando.
// Usamos require estático ou import dinâmico. Aqui é ES Modules, então usamos import dinâmico para os scripts JS que vão para a Vercel.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;

app.get('/api/health', async (req, res) => {
  const handler = (await import('../api/health.js')).default;
  // Simular req e res da Vercel
  handler(req, res);
});

app.post('/api/generate-consensus', async (req, res) => {
  // Ajuste do env local para simular Vercel
  if (!process.env.GROQ_API_KEY && process.env.LLAMA_API_KEY) {
      process.env.GROQ_API_KEY = process.env.LLAMA_API_KEY; // Fallback for local
  }
  const handler = (await import('../api/generate-consensus.js')).default;
  handler(req, res);
});

app.listen(PORT, () => console.log(`Backend de Desenvolvimento rodando na porta ${PORT}`));

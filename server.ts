import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { responderChatPNAE, ChatHistoricoMensagem } from './api/_lib/pnaeAi';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API endpoint for PNAE Legal & Technical Chat
app.post('/api/chat-suporte-pnae', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Mensagem inválida ou não fornecida.' });
      return;
    }

    const resultado = await responderChatPNAE(
      message,
      Array.isArray(history) ? (history as ChatHistoricoMensagem[]) : undefined
    );

    res.json(resultado);
  } catch (error: unknown) {
    console.error('Erro na rota de chat PNAE:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno ao processar a consulta.';
    res.status(500).json({ error: errorMessage });
  }
});

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Vite Middleware for development vs Static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PNAE Gestão Server rodando na porta ${PORT}`);
  });
}

startServer();

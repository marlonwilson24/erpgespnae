import type { Request, Response } from 'express';
import { responderChatPNAE, ChatHistoricoMensagem } from './_lib/pnaeAi';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
    return;
  }

  try {
    const { message, history } = (req.body ?? {}) as { message?: unknown; history?: unknown };

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Mensagem inválida ou não fornecida.' });
      return;
    }

    const resultado = await responderChatPNAE(
      message,
      Array.isArray(history) ? (history as ChatHistoricoMensagem[]) : undefined
    );

    res.status(200).json(resultado);
  } catch (error: unknown) {
    console.error('Erro na rota de chat PNAE:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno ao processar a consulta.';
    res.status(500).json({ error: errorMessage });
  }
}

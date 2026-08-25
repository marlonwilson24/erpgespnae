import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client (lazy/guarded)
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Built-in Knowledge Base Context for Gemini System Instructions
const PNAE_SYSTEM_INSTRUCTION = `Você é o Assistente Jurídico e Técnico Especialista do PNAE (Programa Nacional de Alimentação Escolar), integrado ao sistema PNAE Gestão.
Sua base de conhecimento principal é:
1. Lei Federal nº 11.947, de 16 de junho de 2009 (Dispõe sobre o atendimento da alimentação escolar e do PNAE).
2. Resolução CD/FNDE nº 06, de 08 de maio de 2020 (Estabelece normas para a execução do PNAE).
3. Resolução CD/FNDE nº 20, de 02 de dezembro de 2020 (Alterações nas diretrizes e prestação de contas).
4. Diretrizes de Nutrição, Cardápios da Nutricionista RT, Chamadas Públicas da Agricultura Familiar, Recebimento nas Escolas e Fiscalização do CAE.

Regras e Respostas:
- Seja claro, objetivo, profissional, cordial e tecnicamente preciso.
- Destaque números de artigos relevantes da Lei 11.947/2009 ou Resolução FNDE 06/2020 quando aplicável.
- Sempre ressalte o limite mínimo obrigatório de 30% dos recursos do FNDE para compras da Agricultura Familiar (Art. 14 da Lei 11.947/09).
- Explique o limite individual de R$ 40.000,00 por ano civil por DAP/CAF física.
- Oriente sobre o papel fiscalizador e independente do CAE (Conselho de Alimentação Escolar) e a emissão do Parecer Conclusivo anual.
- Para dúvidas sobre o sistema PNAE Gestão, explique com passos claros como usar os botões, homologações, geração de PDF e termos de recebimento.
- Responda em Português do Brasil de forma concisa e estruturada com marcadores.`;

// API endpoint for PNAE Legal & Technical Chat
app.post('/api/chat-suporte-pnae', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Mensagem inválida ou não fornecida.' });
      return;
    }

    const ai = getGenAI();

    if (ai) {
      // Format chat history context for Gemini
      const conversationContext = Array.isArray(history) 
        ? history.slice(-6).map((h: { role: string; content: string }) => `${h.role === 'user' ? 'Usuário' : 'Assistente'}: ${h.content}`).join('\n')
        : '';

      const prompt = conversationContext 
        ? `Histórico recente da conversa:\n${conversationContext}\n\nNova pergunta do usuário:\n${message}`
        : message;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: PNAE_SYSTEM_INSTRUCTION,
        },
      });

      const responseText = response.text || 'Não foi possível gerar uma resposta detalhada no momento.';
      res.json({
        reply: responseText,
        source: 'gemini-3.7-flash',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Smart Fallback when GEMINI_API_KEY is not configured
    const clean = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let fallbackReply = '';

    if (clean.includes('30%') || clean.includes('artigo 14') || clean.includes('art 14') || clean.includes('porcentagem') || clean.includes('agricultura familiar')) {
      fallbackReply = `📌 **Art. 14 da Lei nº 11.947/2009 & Resolução CD/FNDE nº 06/2020**\n\n• **Regra dos 30%**: Do total dos recursos financeiros repassados pelo FNDE, no mínimo **30%** (trinta por cento) devem ser destinados exclusivamente à aquisição de alimentos de Agricultores Familiares e Empreendedores Familiares Rurais.\n• **Dispensa de Licitação**: As compras são realizadas através de **Chamada Pública**, processo simplificado e desburocratizado.\n• **Meta Municipal**: O não cumprimento dos 30% pode ensejar ressalvas na prestação de contas do município junto ao FNDE e Tribunal de Contas.`;
    } else if (clean.includes('teto') || clean.includes('limite') || clean.includes('dap') || clean.includes('caf') || clean.includes('40000') || clean.includes('40 mil')) {
      fallbackReply = `📌 **Limite Individual da DAP / CAF (Resolução FNDE nº 06/2020, Art. 39)**\n\n• **Valor Máximo**: Cada Agricultor Familiar individual detentor de DAP ou CAF ativa pode vender até **R$ 40.000,00 por ano civil** para cada Entidade Executora (Prefeitura/Estado).\n• **Cooperativas e Associações**: O teto coletivo é calculado multiplicando R$ 40.000,00 pelo total de cooperados com DAP/CAF válidas e vinculadas ao projeto de venda.\n• O sistema PNAE Gestão monitora automaticamente o saldo e bloqueia contratos que excedam esse limite.`;
    } else if (clean.includes('cae') || clean.includes('conselho') || clean.includes('parecer') || clean.includes('fiscalizacao')) {
      fallbackReply = `📌 **Conselho de Alimentação Escolar - CAE (Arts. 18 e 19 da Lei 11.947/2009)**\n\n• **Natureza**: Órgão colegiado deliberativo e autônomo de fiscalização social.\n• **Principais Funções**:\n  1. Fiscalizar a aplicação dos recursos federais do PNAE.\n  2. Realizar visitas in loco nas cozinhas e despensas escolares.\n  3. Avaliar as condições higiênico-sanitárias e aceitabilidade dos cardápios.\n  4. Apreciar e homologar o **Parecer Conclusivo** anual no SIGPC/FNDE.`;
    } else if (clean.includes('proibido') || clean.includes('ultraprocessado') || clean.includes('refrigerante') || clean.includes('acucar') || clean.includes('nutri')) {
      fallbackReply = `📌 **Diretrizes Nutricionais (Resolução CD/FNDE nº 06/2020)**\n\n• **Alimentos Proibidos**: Bebidas de baixo valor nutricional (refrigerantes, refrescos artificiais, bebidas lácteas com aditivos e adoçantes artificiais para educação infantil).\n• **Ultraprocessados**: Limite estrito de no máximo 15% dos recursos financeiros totais.\n• **Frutas e Hortaliças**: Mínimo de 280g por estudante/semana.\n• **Cardápios**: Elaboração e supervisão obrigatórias por Nutricionista com CRN ativo.`;
    } else if (clean.includes('termo') || clean.includes('recebimento') || clean.includes('entrega') || clean.includes('divergencia')) {
      fallbackReply = `📌 **Recebimento e Conferência nas Escolas (Art. 48 da Res. FNDE 06/2020)**\n\n• No ato da entrega pelo produtor rural ou fornecedor:\n  1. Conferir quantidade física em relação à Autorização de Fornecimento (AF).\n  2. Verificar data de validade, aspecto, temperatura e integridade das embalagens.\n  3. Em caso de divergência ou produto impróprio, recusar e registrar a justificativa no sistema.\n  4. O sistema gera automaticamente o **Termo Oficial de Recebimento em PDF** com as assinaturas da escola e do fornecedor.`;
    } else {
      fallbackReply = `Olá! Sou o **Assistente Inteligente do PNAE** fundamentado na **Lei Federal nº 11.947/2009** e na **Resolução CD/FNDE nº 06/2020**.\n\nPosso esclarecer dúvidas sobre:\n• Regra dos 30% da Agricultura Familiar e Chamadas Públicas;\n• Teto de R$ 40 mil/ano por DAP/CAF;\n• Papel, vistorias e Parecer Conclusivo do CAE;\n• Parâmetros nutricionais e restrições de ultraprocessados;\n• Procedimentos do sistema (emissão de AFs, termos de recebimento e prestação de contas SIGPC).\n\nComo posso ajudar você hoje?`;
    }

    res.json({
      reply: fallbackReply,
      source: 'knowledge-base-local',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Erro na rota de chat PNAE:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno ao processar a consulta.';
    res.status(500).json({ error: errorMessage });
  }
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    aiConfigured: !!process.env.GEMINI_API_KEY 
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

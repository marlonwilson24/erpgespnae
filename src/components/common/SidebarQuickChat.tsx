import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  Scale, 
  HelpCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  ChevronDown, 
  BookOpen, 
  Lightbulb, 
  ShieldCheck,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { QUICK_QUESTIONS, searchLocalKnowledge } from '../../data/pnaeKnowledgeBase';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: string;
  timestamp: string;
}

export const SidebarQuickChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Olá! Sou o **Assistente Jurídico e Técnico do PNAE**.\n\nEstou integrado à base de conhecimento da **Lei nº 11.947/2009** e da **Resolução CD/FNDE nº 06/2020**.\n\nComo posso ajudar você com regras da agricultura familiar (30%), teto da DAP/CAF, fiscalização do CAE ou uso do sistema?',
      source: 'Base Oficial PNAE',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call server backend route
      const response = await fetch('/api/chat-suporte-pnae', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: query,
          history: messages.map(m => ({ role: m.sender, content: m.text }))
        })
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor');
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Informação processada com sucesso.',
        source: data.source === 'gemini-3.7-flash' ? 'Gemini 3.7 Flash IA' : 'Base Jurídica PNAE',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.warn('Usando fallback local inteligente da base jurídica PNAE:', err);
      const localResult = searchLocalKnowledge(query);
      
      const fallbackMsg: ChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        sender: 'assistant',
        text: localResult.answer,
        source: localResult.topic?.articleRef || 'Lei 11.947/2009 & Res. 06/2020',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Histórico reiniciado. Como posso auxiliá-lo com a legislação do PNAE ou procedimentos do sistema?',
        source: 'Base Oficial PNAE',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Render text with basic markdown formatting (bold, bullet points)
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Process bold markers **text**
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-bold text-stone-900">{part.slice(2, -2)}</strong>;
            }
            return part;
          });

          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-emerald-700 font-bold">•</span>
                <span className="flex-1">{formattedLine}</span>
              </div>
            );
          }

          if (/^\d+\./.test(line.trim())) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="font-semibold text-emerald-800">{line.trim().split('.')[0]}.</span>
                <span className="flex-1">{line.trim().replace(/^\d+\.\s*/, '')}</span>
              </div>
            );
          }

          return <p key={idx}>{formattedLine}</p>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Botão Gatilho Integrado na Barra Lateral */}
      <div className="mt-4 pt-3 border-t border-stone-200">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs transition group text-left"
          title="Suporte Jurídico e Técnico com IA - Lei 11.947/09"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold leading-tight flex items-center gap-1">
                <span>Suporte IA PNAE</span>
              </div>
              <p className="text-[10px] text-emerald-200/90 leading-tight">
                Lei 11.947 / Res. 06/20
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-white/20 group-hover:bg-white/30 text-white px-2 py-0.5 rounded-full font-bold transition">
            Abrir
          </span>
        </button>
      </div>

      {/* Modal / Drawer Flutuante de Chat Rápido */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:pr-6 sm:pb-6 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          
          <div 
            className={`w-full ${
              isExpanded ? 'sm:w-[680px] sm:h-[720px]' : 'sm:w-[440px] sm:h-[580px]'
            } h-[85vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden transition-all duration-300`}
          >
            {/* Header do Chat */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
                  <Bot className="w-4 h-4 text-emerald-100" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold">Assistente PNAE & Lei 11.947/09</h3>
                    <span className="text-[9px] bg-emerald-500/30 text-emerald-100 px-1.5 py-0.2 rounded font-semibold border border-emerald-400/30">
                      IA Ativa
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-200 leading-tight">
                    Suporte Jurídico, FNDE, CAE e Operação do Sistema
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-white/80">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition"
                  title={isExpanded ? 'Reduzir tamanho' : 'Expandir janela'}
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handleClearHistory}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition text-emerald-200 hover:text-white"
                  title="Limpar conversa"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition"
                  title="Fechar suporte"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-header com Badges Jurídicos */}
            <div className="px-3.5 py-1.5 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between text-[10px] text-emerald-900 shrink-0">
              <div className="flex items-center gap-1.5 font-medium">
                <Scale className="w-3 h-3 text-emerald-700" />
                <span>Base: Lei 11.947/09 • Resolução CD/FNDE nº 06/2020</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-800">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                <span>Conformidade 100%</span>
              </div>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-stone-50/60">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-stone-600 font-medium">
                      <span>{isUser ? 'Você' : 'Assistente PNAE'}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                      {msg.source && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">{msg.source}</span>
                        </>
                      )}
                    </div>

                    <div
                      className={`relative group max-w-[88%] p-3 rounded-2xl ${
                        isUser
                          ? 'bg-emerald-700 text-white rounded-tr-xs shadow-xs'
                          : 'bg-white text-stone-800 border border-stone-200 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {isUser ? (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        renderFormattedText(msg.text)
                      )}

                      {!isUser && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="absolute -bottom-2.5 right-2 opacity-0 group-hover:opacity-100 transition bg-white border border-stone-200 text-stone-600 hover:text-stone-900 rounded-md px-1.5 py-0.5 text-[9px] shadow-xs flex items-center gap-1"
                          title="Copiar resposta"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              <span className="text-emerald-700 font-semibold">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="p-3 rounded-2xl bg-white border border-stone-200 rounded-tl-xs text-xs text-stone-600 flex items-center gap-2 shadow-xs">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                    <span>Consultando base da Lei 11.947/2009 e gerando resposta...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Sugestões Rápidas de Perguntas */}
            <div className="px-3 py-2 bg-white border-t border-stone-100 shrink-0">
              <div className="flex items-center gap-1 text-[10px] font-bold text-stone-600 mb-1.5">
                <Lightbulb className="w-3 h-3 text-amber-600" />
                <span>Perguntas Frequentes (Clique para consultar):</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                {QUICK_QUESTIONS.slice(0, 4).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={isLoading}
                    className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 border border-stone-200 text-stone-700 text-[10.5px] transition shrink-0 disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Caixa de Entrada de Texto */}
            <div className="p-3 bg-white border-t border-stone-200 shrink-0">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ex: Qual o teto da DAP? Como o CAE fiscaliza?..."
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent bg-stone-50/50"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl shadow-xs transition shrink-0"
                  title="Enviar mensagem"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center justify-between mt-1.5 text-[9.5px] text-stone-600 px-1">
                <span>IA especializada em Legislação da Merenda Escolar</span>
                <span>Pressione Enter para enviar</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

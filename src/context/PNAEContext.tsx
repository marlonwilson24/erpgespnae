import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  UserRole,
  Municipio,
  Escola,
  Alimento,
  Cardapio,
  ChamadaPublica,
  ContratoFornecedor,
  AutorizacaoFornecimento,
  EntregaMercadoria,
  EstoqueItemEscola,
  PrestacaoContasPNAE,
  ParecerCAE,
  AuditoriaLog,
  AlertaPNAE,
  ToastNotificacao,
  PropostaFornecedor,
  ParecerQualidade,
  StatusConferencia,
  VisitaCAE,
  MembroCAE,
  ReuniaoCAE,
  ApontamentoOuvidoriaCAE,
} from '../types';
import {
  mockMunicipio,
  mockUsers,
  mockEscolas,
  mockAlimentos,
  mockCardapios,
  mockChamadasPublicas,
  mockContratos,
  mockAutorizacoesFornecimento,
  mockEntregas,
  mockEstoqueEscola,
  mockPrestacaoContas,
  mockParecerCAE,
  mockAuditoriaLogs,
  mockAlertas,
  mockVisitasCAE,
  mockMembrosCAE,
  mockReunioesCAE,
  mockApontamentosCAE,
} from '../data/mockData';
import { soundManager } from '../lib/notificationSound';
import confetti from 'canvas-confetti';

interface ConfirmarEntregaInput {
  autorizacaoFornecimentoId: string;
  numeroAF: string;
  fornecedorId: string;
  fornecedorNome: string;
  escolaId: string;
  escolaNome: string;
  dataEntrega: string;
  notaFiscalOuComprovante: string;
  responsavelRecebimentoNome: string;
  responsavelRecebimentoCargo: string;
  parecerQualidade: ParecerQualidade;
  statusConferencia: StatusConferencia;
  observacoes?: string;
  itens: {
    id?: string;
    alimentoId: string;
    alimentoNome: string;
    quantidadeRecebida: number;
    unidadeMedida: string;
    aprovado: boolean;
    motivoRejeicao?: string;
  }[];
  termoRecebimentoAssinado?: boolean;
}

interface PNAEContextType {
  currentUser: UserProfile | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
  municipio: Municipio;
  escolas: Escola[];
  alimentos: Alimento[];
  cardapios: Cardapio[];
  chamadasPublicas: ChamadaPublica[];
  contratos: ContratoFornecedor[];
  autorizacoesFornecimento: AutorizacaoFornecimento[];
  entregas: EntregaMercadoria[];
  estoqueEscola: EstoqueItemEscola[];
  estoqueEscolas: EstoqueItemEscola[]; // Alias para compatibilidade
  prestacaoContas: PrestacaoContasPNAE;
  pareceresCae: ParecerCAE[];
  visitasCae: VisitaCAE[];
  membrosCae: MembroCAE[];
  reunioesCae: ReuniaoCAE[];
  apontamentosCae: ApontamentoOuvidoriaCAE[];
  auditoriaLogs: AuditoriaLog[];
  alertas: AlertaPNAE[];
  toasts: ToastNotificacao[];
  somHabilitado: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  login: (email: string, role?: UserRole) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  addCardapio: (cardapio: Omit<Cardapio, 'id' | 'criadoEm'>) => void;
  updateCardapioStatus: (id: string, status: Cardapio['status']) => void;
  addAlimento: (alimento: Omit<Alimento, 'id'>) => void;
  createChamadaPublica: (chamada: Omit<ChamadaPublica, 'id' | 'propostas'>) => void;
  submitProposta: (proposta: Omit<PropostaFornecedor, 'id' | 'dataSubmissao'>) => { success: boolean; error?: string };
  emitirAF: (afData: Omit<AutorizacaoFornecimento, 'id' | 'numeroAF' | 'dataEmissao' | 'status'>) => void;
  registrarRecebimentoEntrega: (
    entrega: Omit<EntregaMercadoria, 'id' | 'termoRecebimentoGerado'>
  ) => void;
  confirmarRecebimentoEntrega: (input: ConfirmarEntregaInput) => EntregaMercadoria;
  darBaixaEstoque: (estoqueId: string, quantidadeUtilizada: number) => void;
  consumirEstoque: (escolaId: string, alimentoId: string, quantidade: number, motivo?: string) => void;
  emitirParecerCAE: (parecer: Omit<ParecerCAE, 'id' | 'assinadoEm'>) => void;
  registrarVisitaCae: (visita: Omit<VisitaCAE, 'id'>) => void;
  addMembroCae: (membro: Omit<MembroCAE, 'id'>) => void;
  updateMembroCae: (id: string, membro: Partial<MembroCAE>) => void;
  agendarReuniaoCae: (reuniao: Omit<ReuniaoCAE, 'id'>) => void;
  registrarApontamentoOuvidoria: (apontamento: Omit<ApontamentoOuvidoriaCAE, 'id' | 'dataRegistro'>) => void;
  responderApontamentoOuvidoria: (id: string, resposta: string, status: ApontamentoOuvidoriaCAE['status']) => void;
  addAuditoriaLog: (acao: string, modulo: string, detalhes: string) => void;
  addAlerta: (alerta: Omit<AlertaPNAE, 'id' | 'data' | 'lido'> & { lido?: boolean; showToast?: boolean }) => void;
  markAlertaLido: (id: string) => void;
  markAllAlertasLidos: () => void;
  removerAlerta: (id: string) => void;
  dismissToast: (id: string) => void;
  toggleSomNotificacao: () => void;
  triggerSimulacaoNotificacao: (tipo: 'entrega_chegando' | 'validade_urgente' | 'estoque_critico') => void;
  updateMunicipio: (updatedData: Partial<Municipio>) => void;
  resetToMockData: () => void;
}

const PNAEContext = createContext<PNAEContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'pnae_erp_v2_';

export const PNAEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'currentUser');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return mockUsers[0]; // Admin por padrão
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [municipio, setMunicipio] = useState<Municipio>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'municipio');
    return saved ? JSON.parse(saved) : mockMunicipio;
  });

  const [escolas, setEscolas] = useState<Escola[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'escolas');
    return saved ? JSON.parse(saved) : mockEscolas;
  });

  const [alimentos, setAlimentos] = useState<Alimento[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'alimentos');
    return saved ? JSON.parse(saved) : mockAlimentos;
  });

  const [cardapios, setCardapios] = useState<Cardapio[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'cardapios');
    return saved ? JSON.parse(saved) : mockCardapios;
  });

  const [chamadasPublicas, setChamadasPublicas] = useState<ChamadaPublica[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'chamadasPublicas');
    return saved ? JSON.parse(saved) : mockChamadasPublicas;
  });

  const [contratos, setContratos] = useState<ContratoFornecedor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'contratos');
    return saved ? JSON.parse(saved) : mockContratos;
  });

  const [autorizacoesFornecimento, setAutorizacoesFornecimento] = useState<AutorizacaoFornecimento[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'autorizacoesFornecimento');
    return saved ? JSON.parse(saved) : mockAutorizacoesFornecimento;
  });

  const [entregas, setEntregas] = useState<EntregaMercadoria[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'entregas');
    return saved ? JSON.parse(saved) : mockEntregas;
  });

  const [estoqueEscola, setEstoqueEscola] = useState<EstoqueItemEscola[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'estoqueEscola');
    return saved ? JSON.parse(saved) : mockEstoqueEscola;
  });

  const [prestacaoContas, setPrestacaoContas] = useState<PrestacaoContasPNAE>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'prestacaoContas');
    return saved ? JSON.parse(saved) : mockPrestacaoContas;
  });

  const [pareceresCae, setPareceresCae] = useState<ParecerCAE[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'pareceresCae');
    return saved ? JSON.parse(saved) : [mockParecerCAE];
  });

  const [visitasCae, setVisitasCae] = useState<VisitaCAE[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'visitasCae');
    return saved ? JSON.parse(saved) : mockVisitasCAE;
  });

  const [membrosCae, setMembrosCae] = useState<MembroCAE[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'membrosCae');
    return saved ? JSON.parse(saved) : mockMembrosCAE;
  });

  const [reunioesCae, setReunioesCae] = useState<ReuniaoCAE[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'reunioesCae');
    return saved ? JSON.parse(saved) : mockReunioesCAE;
  });

  const [apontamentosCae, setApontamentosCae] = useState<ApontamentoOuvidoriaCAE[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'apontamentosCae');
    return saved ? JSON.parse(saved) : mockApontamentosCAE;
  });

  const [auditoriaLogs, setAuditoriaLogs] = useState<AuditoriaLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'auditoriaLogs');
    return saved ? JSON.parse(saved) : mockAuditoriaLogs;
  });

  const [alertas, setAlertas] = useState<AlertaPNAE[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'alertas');
    return saved ? JSON.parse(saved) : mockAlertas;
  });

  const [toasts, setToasts] = useState<ToastNotificacao[]>([]);
  const [somHabilitado, setSomHabilitado] = useState<boolean>(() => !soundManager.getIsMuted());

  // Salvar no LocalStorage sempre que houver modificações
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'cardapios', JSON.stringify(cardapios));
  }, [cardapios]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'chamadasPublicas', JSON.stringify(chamadasPublicas));
  }, [chamadasPublicas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'autorizacoesFornecimento', JSON.stringify(autorizacoesFornecimento));
  }, [autorizacoesFornecimento]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'entregas', JSON.stringify(entregas));
  }, [entregas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'estoqueEscola', JSON.stringify(estoqueEscola));
  }, [estoqueEscola]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'prestacaoContas', JSON.stringify(prestacaoContas));
  }, [prestacaoContas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'pareceresCae', JSON.stringify(pareceresCae));
  }, [pareceresCae]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'alertas', JSON.stringify(alertas));
  }, [alertas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'visitasCae', JSON.stringify(visitasCae));
  }, [visitasCae]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'membrosCae', JSON.stringify(membrosCae));
  }, [membrosCae]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'reunioesCae', JSON.stringify(reunioesCae));
  }, [reunioesCae]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'apontamentosCae', JSON.stringify(apontamentosCae));
  }, [apontamentosCae]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'municipio', JSON.stringify(municipio));
  }, [municipio]);

  const addAuditoriaLog = useCallback((acao: string, modulo: string, detalhes: string) => {
    const newLog: AuditoriaLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      dataHora: new Date().toISOString().replace('T', ' ').substring(0, 19),
      usuarioNome: currentUser?.name || 'Sistema',
      usuarioRole: currentUser?.role || 'ADMIN',
      acao,
      modulo,
      detalhes,
    };
    setAuditoriaLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addAlerta = useCallback((
    alertaData: Omit<AlertaPNAE, 'id' | 'data' | 'lido'> & { lido?: boolean; showToast?: boolean }
  ) => {
    const newId = `al-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const novoAlerta: AlertaPNAE = {
      ...alertaData,
      id: newId,
      data: 'Agora',
      lido: alertaData.lido || false,
      criadoEm: new Date().toISOString(),
    };

    setAlertas(prev => [novoAlerta, ...prev]);

    // Disparar Som & Toast em tempo real
    if (alertaData.showToast !== false) {
      if (alertaData.tipo === 'perigo') {
        soundManager.playDanger();
      } else if (alertaData.tipo === 'alerta') {
        soundManager.playWarning();
      } else {
        soundManager.playChime();
      }

      const novoToast: ToastNotificacao = {
        id: newId,
        tipo: alertaData.tipo,
        titulo: alertaData.titulo,
        mensagem: alertaData.mensagem,
        categoria: alertaData.categoria,
        acaoTexto: alertaData.acaoTexto,
        acaoTab: alertaData.acaoTab,
        afId: alertaData.afId,
        escolaId: alertaData.escolaId,
        duracaoMs: 6500,
      };

      setToasts(prev => [novoToast, ...prev.slice(0, 4)]);
    }
  }, []);

  const markAlertaLido = useCallback((id: string) => {
    setAlertas(prev => prev.map(a => (a.id === id ? { ...a, lido: true } : a)));
  }, []);

  const markAllAlertasLidos = useCallback(() => {
    setAlertas(prev => prev.map(a => ({ ...a, lido: true })));
  }, []);

  const removerAlerta = useCallback((id: string) => {
    setAlertas(prev => prev.filter(a => a.id !== id));
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleSomNotificacao = useCallback(() => {
    setSomHabilitado(prev => {
      const next = !prev;
      soundManager.setMuted(!next);
      if (next) soundManager.playChime();
      return next;
    });
  }, []);

  // Monitoramento dinâmico e contínuo de Prazos de Entrega de AF e Validade de Estoque
  const verificarAlertasAutomaticos = useCallback(() => {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];

    // 1. Monitorar Prazos de Entrega de Agricultura Familiar (AFs)
    autorizacoesFornecimento.forEach(af => {
      if (af.status === 'Em Trânsito' || af.status === 'Emitida') {
        const prazo = new Date(af.dataLimiteEntrega);
        const diffDias = Math.ceil((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        const alertExiste = alertas.some(
          a => a.afId === af.id && (a.categoria === 'entrega_af')
        );

        if (!alertExiste) {
          if (diffDias < 0) {
            // Entrega atrasada
            addAlerta({
              tipo: 'perigo',
              categoria: 'entrega_af',
              prioridade: 'alta',
              titulo: `🚨 Entrega em Atraso: ${af.numeroAF}`,
              mensagem: `A entrega de hortifrúti da AF ${af.numeroAF} (${af.fornecedorNome}) para a escola ${af.escolaNome} expirou o prazo em ${af.dataLimiteEntrega}.`,
              afId: af.id,
              numeroAF: af.numeroAF,
              escolaId: af.escolaId,
              escolaNome: af.escolaNome,
              fornecedorNome: af.fornecedorNome,
              dataLimite: af.dataLimiteEntrega,
              acaoTexto: 'Conferir e Receber',
              acaoTab: 'dashboard',
              linkModulo: 'entregas',
              showToast: false,
            });
          } else if (diffDias <= 2) {
            // Entrega hoje ou nos próximos 2 dias
            addAlerta({
              tipo: 'alerta',
              categoria: 'entrega_af',
              prioridade: 'alta',
              titulo: diffDias === 0 ? `📦 Entrega de Agricultura Familiar HOJE: ${af.numeroAF}` : `⏳ Prazo de Entrega Próximo: ${af.numeroAF}`,
              mensagem: `A AF ${af.numeroAF} de ${af.fornecedorNome} (${af.itens.length} itens) tem previsão de chegada em ${af.escolaNome} até ${af.dataLimiteEntrega}.`,
              afId: af.id,
              numeroAF: af.numeroAF,
              escolaId: af.escolaId,
              escolaNome: af.escolaNome,
              fornecedorNome: af.fornecedorNome,
              dataLimite: af.dataLimiteEntrega,
              diasRestantes: diffDias,
              acaoTexto: 'Ver Autorização de Fornecimento',
              acaoTab: 'dashboard',
              linkModulo: 'entregas',
              showToast: false,
            });
          }
        }
      }
    });

    // 2. Monitorar Validade de Alimentos e Níveis Críticos de Estoque na Despensa
    estoqueEscola.forEach(item => {
      const validade = new Date(item.dataValidadeProxima);
      const diffDiasValidade = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      const alertValidadeExiste = alertas.some(
        a => a.estoqueId === item.id && a.categoria === 'validade_estoque'
      );

      if (!alertValidadeExiste) {
        if (diffDiasValidade <= 0) {
          // Vencido
          addAlerta({
            tipo: 'perigo',
            categoria: 'validade_estoque',
            prioridade: 'alta',
            titulo: `⚠️ Alimento Vencido na Despensa: ${item.alimentoNome}`,
            mensagem: `O lote ${item.lote} de ${item.alimentoNome} (${item.quantidadeAtual} ${item.unidadeMedida}) venceu em ${item.dataValidadeProxima}. Realize o descarte ou verificação imediata.`,
            estoqueId: item.id,
            alimentoId: item.alimentoId,
            alimentoNome: item.alimentoNome,
            escolaId: item.escolaId,
            diasRestantes: diffDiasValidade,
            acaoTexto: 'Acessar Despensa',
            acaoTab: 'estoque-escola',
            linkModulo: 'estoque',
            showToast: false,
          });
        } else if (diffDiasValidade <= 5) {
          // Vence em até 5 dias
          addAlerta({
            tipo: 'alerta',
            categoria: 'validade_estoque',
            prioridade: 'alta',
            titulo: `⏱️ Validade Próxima: ${item.alimentoNome} (Vence em ${diffDiasValidade} dias)`,
            mensagem: `Lote ${item.lote} de ${item.alimentoNome} (${item.quantidadeAtual} ${item.unidadeMedida}) tem validade em ${item.dataValidadeProxima}. Priorize o uso nos cardápios da semana!`,
            estoqueId: item.id,
            alimentoId: item.alimentoId,
            alimentoNome: item.alimentoNome,
            escolaId: item.escolaId,
            diasRestantes: diffDiasValidade,
            acaoTexto: 'Ver Estoque da Escola',
            acaoTab: 'estoque-escola',
            linkModulo: 'estoque',
            showToast: false,
          });
        }
      }

      // Estoque Baixo / Nível de Segurança
      const alertEstoqueBaixoExiste = alertas.some(
        a => a.estoqueId === item.id && a.categoria === 'estoque_baixo'
      );

      if (!alertEstoqueBaixoExiste && item.quantidadeAtual <= item.quantidadeMinimaAlerta && item.quantidadeAtual > 0) {
        addAlerta({
          tipo: 'alerta',
          categoria: 'estoque_baixo',
          prioridade: 'media',
          titulo: `📉 Estoque Baixo: ${item.alimentoNome}`,
          mensagem: `Restam apenas ${item.quantidadeAtual} ${item.unidadeMedida} na despensa (limite mínimo de segurança: ${item.quantidadeMinimaAlerta} ${item.unidadeMedida}).`,
          estoqueId: item.id,
          alimentoId: item.alimentoId,
          alimentoNome: item.alimentoNome,
          escolaId: item.escolaId,
          acaoTexto: 'Ver Despensa',
          acaoTab: 'estoque-escola',
          linkModulo: 'estoque',
          showToast: false,
        });
      }
    });
  }, [autorizacoesFornecimento, estoqueEscola, alertas, addAlerta]);

  // Executar checagem inicial
  useEffect(() => {
    verificarAlertasAutomaticos();
  }, [verificarAlertasAutomaticos]);

  // Simulação interativa em tempo real de eventos do PNAE
  const triggerSimulacaoNotificacao = useCallback((tipo: 'entrega_chegando' | 'validade_urgente' | 'estoque_critico') => {
    if (tipo === 'entrega_chegando') {
      const afAlvo = autorizacoesFornecimento[0] || mockAutorizacoesFornecimento[0];
      addAlerta({
        tipo: 'alerta',
        categoria: 'entrega_af',
        prioridade: 'alta',
        titulo: '🚚 Entrega da Agricultura Familiar a Caminho!',
        mensagem: `O produtor rural ${afAlvo.fornecedorNome} está a caminho da ${afAlvo.escolaNome} com a entrega da ${afAlvo.numeroAF} (hortifrúti orgânico fresco). Prepare a equipe da cozinha para conferência.`,
        afId: afAlvo.id,
        numeroAF: afAlvo.numeroAF,
        escolaId: afAlvo.escolaId,
        escolaNome: afAlvo.escolaNome,
        fornecedorNome: afAlvo.fornecedorNome,
        dataLimite: afAlvo.dataLimiteEntrega,
        acaoTexto: 'Conferir Recebimento',
        acaoTab: 'dashboard',
        linkModulo: 'entregas',
        showToast: true,
      });
      addAuditoriaLog('Alerta em Tempo Real', 'Entregas & AF', `Disparada notificação em tempo real de entrega a caminho da AF ${afAlvo.numeroAF}`);
    } else if (tipo === 'validade_urgente') {
      addAlerta({
        tipo: 'perigo',
        categoria: 'validade_estoque',
        prioridade: 'alta',
        titulo: '⚠️ Alerta Crítico: Hortifrúti Próximo ao Vencimento',
        mensagem: 'Banana Prata Orgânica e Ovos Caipiras da Agricultura Familiar na EMEF Monteiro Lobato vencem em 2 dias. Inclua nas preparações de hoje para evitar desperdício de merenda.',
        escolaId: 'esc-01',
        alimentoNome: 'Banana Prata e Ovos Caipiras',
        diasRestantes: 2,
        acaoTexto: 'Ajustar Cardápio / Despensa',
        acaoTab: 'estoque-escola',
        linkModulo: 'estoque',
        showToast: true,
      });
      addAuditoriaLog('Alerta em Tempo Real', 'Despensa Escolar', 'Notificação de validade urgente gerada para itens perecíveis');
    } else if (tipo === 'estoque_critico') {
      addAlerta({
        tipo: 'alerta',
        categoria: 'estoque_baixo',
        prioridade: 'media',
        titulo: '📉 Estoque Crítico de Feijão Preto e Leite',
        mensagem: 'O saldo de Feijão Preto da Agricultura Familiar na despensa escolar atingiu 12 kg (abaixo da cota mínima de 30 kg). Solicite nova AF à Secretaria.',
        escolaId: 'esc-01',
        alimentoNome: 'Feijão Preto da Agricultura Familiar',
        acaoTexto: 'Ver Estoque',
        acaoTab: 'estoque-escola',
        linkModulo: 'estoque',
        showToast: true,
      });
      addAuditoriaLog('Alerta em Tempo Real', 'Despensa Escolar', 'Alerta de estoque mínimo atingido disparado');
    }
  }, [autorizacoesFornecimento, addAlerta, addAuditoriaLog]);

  const login = (email: string, role?: UserRole): boolean => {
    const foundUser = mockUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() || (role && u.role === role)
    );
    if (foundUser) {
      setCurrentUser(foundUser);
      setActiveTab('dashboard');
      addAuditoriaLog('Login no Sistema', 'Autenticação', `Usuário ${foundUser.name} realizou login com perfil ${foundUser.role}`);
      
      // Boas vindas com notificação suave
      addAlerta({
        tipo: 'info',
        categoria: 'sistema',
        prioridade: 'baixa',
        titulo: `Bem-vindo(a), ${foundUser.name}`,
        mensagem: `Sessão iniciada como ${foundUser.cargo || foundUser.role}. Sistema sincronizado com dados do PNAE ${municipio.nome}-${municipio.uf}.`,
        showToast: true,
      });

      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      addAuditoriaLog('Logout', 'Autenticação', `Usuário ${currentUser.name} encerrou a sessão.`);
    }
    setCurrentUser(null);
  };

  const switchRole = (role: UserRole) => {
    const targetUser = mockUsers.find(u => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      setActiveTab('dashboard');
      addAuditoriaLog('Troca de Perfil Ativo', 'Controle de Acesso', `Perfil alternado para ${role} (${targetUser.name})`);
      
      if (role === 'ESCOLA') {
        soundManager.playChime();
        setToasts(prev => [
          {
            id: `toast-switch-${Date.now()}`,
            tipo: 'info',
            categoria: 'sistema',
            titulo: 'Perfil Escola Ativo',
            mensagem: `Você está gerenciando a ${targetUser.escolaId ? 'unidade escolar atribuída' : 'EMEF Monteiro Lobato'}. Notificações de entregas e estoque ativas.`,
            duracaoMs: 5000,
          },
          ...prev,
        ]);
      }
    }
  };

  const addCardapio = (cardapioData: Omit<Cardapio, 'id' | 'criadoEm'>) => {
    const newCardapio: Cardapio = {
      ...cardapioData,
      id: `card-${Date.now()}`,
      criadoEm: new Date().toISOString().split('T')[0],
    };
    setCardapios(prev => [newCardapio, ...prev]);
    addAuditoriaLog('Criação de Cardápio', 'Cardápios PNAE', `Novo cardápio criado: ${newCardapio.titulo} (${newCardapio.etapaEnsino})`);
  };

  const updateCardapioStatus = (id: string, status: Cardapio['status']) => {
    setCardapios(prev =>
      prev.map(c => (c.id === id ? { ...c, status } : c))
    );
    addAuditoriaLog('Atualização de Status de Cardápio', 'Cardápios PNAE', `Cardápio ${id} alterado para ${status}`);
  };

  const addAlimento = (alimentoData: Omit<Alimento, 'id'>) => {
    const newAlimento: Alimento = {
      ...alimentoData,
      id: `alim-${Date.now()}`,
    };
    setAlimentos(prev => [...prev, newAlimento]);
    addAuditoriaLog('Cadastro de Alimento', 'Catálogo de Alimentos', `Novo alimento inserido: ${newAlimento.nome}`);
  };

  const createChamadaPublica = (chamadaData: Omit<ChamadaPublica, 'id' | 'propostas'>) => {
    const newChamada: ChamadaPublica = {
      ...chamadaData,
      id: `cp-${Date.now()}`,
      propostas: [],
    };
    setChamadasPublicas(prev => [newChamada, ...prev]);
    addAuditoriaLog('Abertura de Chamada Pública', 'Agricultura Familiar', `Edital ${newChamada.numeroEdital} publicado com valor de R$ ${newChamada.valorTotalEstimado.toFixed(2)}`);

    addAlerta({
      tipo: 'info',
      categoria: 'chamada_publica',
      prioridade: 'media',
      titulo: `📢 Nova Chamada Pública Publicada: ${newChamada.numeroEdital}`,
      mensagem: `Edital aberto para aquisição de ${newChamada.objeto} com percentual de ${newChamada.percentualAgriFamiliar}% reservado à Agricultura Familiar.`,
      linkModulo: 'chamadas-publicas',
      showToast: true,
    });
  };

  const submitProposta = (propostaData: Omit<PropostaFornecedor, 'id' | 'dataSubmissao'>): { success: boolean; error?: string } => {
    const LIMITE_ANUAL_DAP = 40000.00;
    if (propostaData.tipoProdutor === 'Individual') {
      const acumulado = propostaData.acumuladoAnoDapCaf;
      if (acumulado + propostaData.valorTotalProposta > LIMITE_ANUAL_DAP) {
        return {
          success: false,
          error: `Limite legal da DAP/CAF excedido! O teto por agricultor familiar é de R$ ${LIMITE_ANUAL_DAP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano civil. O produtor já utilizou R$ ${acumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} e o saldo restante é de R$ ${(LIMITE_ANUAL_DAP - acumulado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        };
      }
    }

    const newProposta: PropostaFornecedor = {
      ...propostaData,
      id: `prop-${Date.now()}`,
      dataSubmissao: new Date().toISOString(),
    };

    setChamadasPublicas(prev =>
      prev.map(cp => {
        if (cp.id === propostaData.chamadaPublicaId) {
          return {
            ...cp,
            propostas: [...cp.propostas, newProposta],
          };
        }
        return cp;
      })
    );

    addAuditoriaLog(
      'Submissão de Projeto de Venda',
      'Chamada Pública',
      `Proposta submetida pelo agricultor ${propostaData.fornecedorNome} no valor de R$ ${propostaData.valorTotalProposta.toFixed(2)}`
    );

    addAlerta({
      tipo: 'sucesso',
      categoria: 'chamada_publica',
      prioridade: 'media',
      titulo: '🌾 Projeto de Venda Submetido com Sucesso',
      mensagem: `Proposta do produtor ${propostaData.fornecedorNome} (CAF/DAP: ${propostaData.fornecedorDapCaf}) no valor de R$ ${propostaData.valorTotalProposta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cadastrada para avaliação.`,
      linkModulo: 'chamadas-publicas',
      showToast: true,
    });

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch { /* ignore */ }

    return { success: true };
  };

  const emitirAF = (afData: Omit<AutorizacaoFornecimento, 'id' | 'numeroAF' | 'dataEmissao' | 'status'>) => {
    const numSeq = autorizacoesFornecimento.length + 43;
    const newAF: AutorizacaoFornecimento = {
      ...afData,
      id: `af-${Date.now()}`,
      numeroAF: `AF-2026-00${numSeq}`,
      dataEmissao: new Date().toISOString().split('T')[0],
      status: 'Em Trânsito',
    };
    setAutorizacoesFornecimento(prev => [newAF, ...prev]);
    addAuditoriaLog('Emissão de AF', 'Autorizações de Fornecimento', `AF ${newAF.numeroAF} emitida para ${newAF.escolaNome} no valor de R$ ${newAF.valorTotalAF.toFixed(2)}`);

    // Notificação em tempo real imediata para a escola destino
    addAlerta({
      tipo: 'alerta',
      categoria: 'entrega_af',
      prioridade: 'alta',
      titulo: `📦 Nova Autorização de Fornecimento Emitida: ${newAF.numeroAF}`,
      mensagem: `A AF ${newAF.numeroAF} foi despachada para entrega na ${newAF.escolaNome} pelo agricultor ${newAF.fornecedorNome}. Prazo limite: ${newAF.dataLimiteEntrega}.`,
      afId: newAF.id,
      numeroAF: newAF.numeroAF,
      escolaId: newAF.escolaId,
      escolaNome: newAF.escolaNome,
      fornecedorNome: newAF.fornecedorNome,
      dataLimite: newAF.dataLimiteEntrega,
      acaoTexto: 'Conferir Recebimento',
      acaoTab: 'dashboard',
      linkModulo: 'entregas',
      showToast: true,
    });
  };

  const registrarRecebimentoEntrega = (
    entregaData: Omit<EntregaMercadoria, 'id' | 'termoRecebimentoGerado'>
  ) => {
    const newEntrega: EntregaMercadoria = {
      ...entregaData,
      id: `ent-${Date.now()}`,
      termoRecebimentoGerado: true,
    };

    setEntregas(prev => [newEntrega, ...prev]);

    // 1. Atualizar status da AF
    setAutorizacoesFornecimento(prev =>
      prev.map(af => {
        if (af.id === entregaData.autorizacaoFornecimentoId) {
          return {
            ...af,
            status: entregaData.statusConferencia === 'Conforme Total' ? 'Entregue Total' : 'Entregue Parcial',
            itens: af.itens.map(afItem => {
              const recItem = entregaData.itensRecebidos.find(r => r.alimentoId === afItem.alimentoId);
              return recItem
                ? { ...afItem, quantidadeEntregue: recItem.quantidadeRecebida }
                : afItem;
            }),
          };
        }
        return af;
      })
    );

    // 2. Atualizar Estoque da Escola Automaticamente (Trigger de Entrada)
    setEstoqueEscola(prev => {
      const updated = [...prev];
      entregaData.itensRecebidos.forEach(itemRec => {
        if (itemRec.aprovado && itemRec.quantidadeRecebida > 0) {
          const index = updated.findIndex(
            est => est.escolaId === entregaData.escolaId && est.alimentoId === itemRec.alimentoId
          );
          if (index >= 0) {
            updated[index] = {
              ...updated[index],
              quantidadeAtual: updated[index].quantidadeAtual + itemRec.quantidadeRecebida,
              ultimaAtualizacao: new Date().toISOString().split('T')[0],
              dataValidadeProxima: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            };
          } else {
            const alimentoInfo = alimentos.find(a => a.id === itemRec.alimentoId);
            updated.push({
              id: `est-${Date.now()}-${itemRec.alimentoId}`,
              escolaId: entregaData.escolaId,
              alimentoId: itemRec.alimentoId,
              alimentoNome: itemRec.alimentoNome,
              categoria: alimentoInfo?.categoria || 'Legumes e Verduras',
              unidadeMedida: itemRec.unidadeMedida,
              quantidadeAtual: itemRec.quantidadeRecebida,
              quantidadeMinimaAlerta: 15,
              dataValidadeProxima: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
              lote: `AF-${entregaData.numeroAF}`,
              ultimaAtualizacao: new Date().toISOString().split('T')[0],
            });
          }
        }
      });
      return updated;
    });

    addAuditoriaLog(
      'Recebimento de Mercadoria na Escola',
      'Entregas & Despensa',
      `Termo de Recebimento gerado para ${entregaData.escolaNome} (AF ${entregaData.numeroAF}). Parecer: ${entregaData.parecerQualidade}`
    );

    addAlerta({
      tipo: 'sucesso',
      categoria: 'entrega_af',
      prioridade: 'baixa',
      titulo: `✅ Recebimento Concluído: AF ${entregaData.numeroAF}`,
      mensagem: `Mercadorias recebidas na ${entregaData.escolaNome} com status '${entregaData.statusConferencia}'. Estoque da despensa atualizado com sucesso!`,
      linkModulo: 'estoque',
      showToast: true,
    });

    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch { /* ignore */ }
  };

  const confirmarRecebimentoEntrega = (input: ConfirmarEntregaInput): EntregaMercadoria => {
    const novaEntrega: EntregaMercadoria = {
      id: `ent-${Date.now()}`,
      autorizacaoFornecimentoId: input.autorizacaoFornecimentoId,
      numeroAF: input.numeroAF,
      escolaId: input.escolaId,
      escolaNome: input.escolaNome,
      fornecedorId: input.fornecedorId,
      fornecedorNome: input.fornecedorNome,
      dataEntrega: input.dataEntrega,
      notaFiscalOuComprovante: input.notaFiscalOuComprovante,
      responsavelRecebimentoNome: input.responsavelRecebimentoNome,
      responsavelRecebimentoCargo: input.responsavelRecebimentoCargo,
      parecerQualidade: input.parecerQualidade,
      statusConferencia: input.statusConferencia,
      observacoes: input.observacoes,
      termoRecebimentoGerado: true,
      itensRecebidos: input.itens.map(it => ({
        alimentoId: it.alimentoId,
        alimentoNome: it.alimentoNome,
        quantidadeEsperada: it.quantidadeRecebida,
        quantidadeRecebida: it.quantidadeRecebida,
        unidadeMedida: it.unidadeMedida,
        aprovado: it.aprovado,
        motivoDivergencia: it.motivoRejeicao,
      })),
    };

    registrarRecebimentoEntrega(novaEntrega);
    return novaEntrega;
  };

  const darBaixaEstoque = (estoqueId: string, quantidadeUtilizada: number) => {
    setEstoqueEscola(prev =>
      prev.map(item => {
        if (item.id === estoqueId) {
          const novaQtd = Math.max(0, item.quantidadeAtual - quantidadeUtilizada);
          
          if (novaQtd <= item.quantidadeMinimaAlerta && novaQtd > 0) {
            addAlerta({
              tipo: 'alerta',
              categoria: 'estoque_baixo',
              prioridade: 'alta',
              titulo: `⚠️ Estoque Crítico: ${item.alimentoNome}`,
              mensagem: `Após consumo para merenda, restam apenas ${novaQtd} ${item.unidadeMedida} de ${item.alimentoNome} (Mínimo: ${item.quantidadeMinimaAlerta} ${item.unidadeMedida}).`,
              estoqueId: item.id,
              alimentoNome: item.alimentoNome,
              escolaId: item.escolaId,
              acaoTexto: 'Ver Despensa',
              acaoTab: 'estoque-escola',
              showToast: true,
            });
          }

          return {
            ...item,
            quantidadeAtual: novaQtd,
            ultimaAtualizacao: new Date().toISOString().split('T')[0],
          };
        }
        return item;
      })
    );
    addAuditoriaLog('Baixa de Consumo de Estoque', 'Despensa Escolar', `Baixa de ${quantidadeUtilizada} un do item ID ${estoqueId} para preparo de merenda escolar.`);
  };

  const consumirEstoque = (escolaId: string, alimentoId: string, quantidade: number, motivo?: string) => {
    setEstoqueEscola(prev =>
      prev.map(item => {
        if (item.escolaId === escolaId && item.alimentoId === alimentoId) {
          const novaQtd = Math.max(0, item.quantidadeAtual - quantidade);
          return {
            ...item,
            quantidadeAtual: novaQtd,
            ultimaAtualizacao: new Date().toISOString().split('T')[0],
          };
        }
        return item;
      })
    );
    addAuditoriaLog('Consumo de Despensa Escolar', 'Despensa Escolar', `Registrada saída de ${quantidade} do item ${alimentoId} na escola ${escolaId}. Motivo: ${motivo || 'Preparo de Refeição'}`);
  };

  const emitirParecerCAE = (parecerData: Omit<ParecerCAE, 'id' | 'assinadoEm'>) => {
    const newParecer: ParecerCAE = {
      ...parecerData,
      id: `par-${Date.now()}`,
      assinadoEm: new Date().toISOString(),
    };
    setPareceresCae(prev => [newParecer, ...prev]);

    setPrestacaoContas(prev => ({
      ...prev,
      statusAprovacao: parecerData.resultadoParecer === 'Favorável sem Ressalvas' 
        ? 'Aprovado pelo CAE' 
        : parecerData.resultadoParecer === 'Favorável com Ressalvas'
        ? 'Aprovado com Ressalvas'
        : 'Rejeitado',
      parecerCaeId: newParecer.id,
    }));

    addAuditoriaLog(
      'Emissão de Parecer Conclusivo do CAE',
      'Controle Social CAE',
      `Parecer conclusivo registrado pelo presidente ${parecerData.presidenteCaeNome}: ${parecerData.resultadoParecer}`
    );

    addAlerta({
      tipo: parecerData.resultadoParecer.includes('Favorável') ? 'sucesso' : 'perigo',
      categoria: 'meta_fnde',
      prioridade: 'alta',
      titulo: '📋 Parecer Conclusivo do CAE Emitido',
      mensagem: `O Conselho de Alimentação Escolar emitiu parecer: "${parecerData.resultadoParecer}". Documento homologado para prestação de contas no SIOPE/SIGECON.`,
      linkModulo: 'prestacao-contas',
      showToast: true,
    });

    try {
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.5 } });
    } catch { /* ignore */ }
  };

  const updateMunicipio = (updatedData: Partial<Municipio>) => {
    setMunicipio(prev => {
      const updated = { ...prev, ...updatedData };
      return updated;
    });

    addAuditoriaLog(
      'Atualização de Dados Institucionais',
      'Configurações do Órgão Gestor',
      `Dados do Órgão Gestor / EEx atualizados com sucesso (Gestor: ${updatedData.gestorNome || municipio.gestorNome || 'N/D'}, CNPJ: ${updatedData.cnpj || municipio.cnpj || 'N/D'})`
    );

    addAlerta({
      tipo: 'sucesso',
      categoria: 'sistema',
      prioridade: 'baixa',
      titulo: '⚙️ Configurações do Órgão Gestor Salvas',
      mensagem: 'Os dados da Entidade Executora, contatos, gestor e logomarcas foram atualizados nos relatórios e documentos oficiais.',
      showToast: true,
    });
  };

  const registrarVisitaCae = (visitaData: Omit<VisitaCAE, 'id'>) => {
    const novaVisita: VisitaCAE = {
      ...visitaData,
      id: `vis-${Date.now()}`,
    };
    setVisitasCae(prev => [novaVisita, ...prev]);

    addAuditoriaLog(
      'Registro de Fiscalização In Loco do CAE',
      'Controle Social CAE',
      `Fiscalização realizada em ${visitaData.escolaNome} na data ${visitaData.dataVisita}. Aceitabilidade: ${visitaData.aceitabilidadeAlunos}`
    );

    addAlerta({
      tipo: 'info',
      categoria: 'sistema',
      prioridade: 'media',
      titulo: `🔍 Nova Fiscalização CAE: ${visitaData.escolaNome}`,
      mensagem: `Relatório de vistoria sanitária e nutricional registrado com parecer de aceitabilidade '${visitaData.aceitabilidadeAlunos}'.`,
      linkModulo: 'cae',
      showToast: true,
    });

    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch { /* ignore */ }
  };

  const addMembroCae = (membroData: Omit<MembroCAE, 'id'>) => {
    const novoMembro: MembroCAE = {
      ...membroData,
      id: `mem-${Date.now()}`,
    };
    setMembrosCae(prev => [...prev, novoMembro]);

    addAuditoriaLog(
      'Inclusão de Conselheiro CAE',
      'Controle Social CAE',
      `Conselheiro ${membroData.nome} (${membroData.cargoMesa} - ${membroData.segmento}) adicionado ao Colegiado.`
    );
  };

  const updateMembroCae = (id: string, updatedData: Partial<MembroCAE>) => {
    setMembrosCae(prev => prev.map(m => m.id === id ? { ...m, ...updatedData } : m));

    addAuditoriaLog(
      'Atualização de Membro CAE',
      'Controle Social CAE',
      `Dados do conselheiro ID ${id} atualizados.`
    );
  };

  const agendarReuniaoCae = (reuniaoData: Omit<ReuniaoCAE, 'id'>) => {
    const novaReuniao: ReuniaoCAE = {
      ...reuniaoData,
      id: `reun-${Date.now()}`,
    };
    setReunioesCae(prev => [novaReuniao, ...prev]);

    addAuditoriaLog(
      'Agendamento de Reunião CAE',
      'Controle Social CAE',
      `Reunião ${reuniaoData.tipo} agendada para ${reuniaoData.dataHora}: ${reuniaoData.pauta}`
    );

    addAlerta({
      tipo: 'info',
      categoria: 'sistema',
      prioridade: 'baixa',
      titulo: `📅 Reunião CAE Agendada: ${reuniaoData.numeroAta}`,
      mensagem: `Pauta convocatória registrada para ${reuniaoData.dataHora} no local: ${reuniaoData.local}.`,
      linkModulo: 'cae',
      showToast: true,
    });
  };

  const registrarApontamentoOuvidoria = (apontamentoData: Omit<ApontamentoOuvidoriaCAE, 'id' | 'dataRegistro'>) => {
    const novoApontamento: ApontamentoOuvidoriaCAE = {
      ...apontamentoData,
      id: `ouv-${Date.now()}`,
      dataRegistro: new Date().toISOString().split('T')[0],
    };
    setApontamentosCae(prev => [novoApontamento, ...prev]);

    addAuditoriaLog(
      'Registro de Manifestação na Ouvidoria CAE',
      'Ouvidoria PNAE',
      `Manifestação recebida de ${apontamentoData.solicitanteTipo} referente a ${apontamentoData.escolaNome}: ${apontamentoData.assunto}`
    );

    addAlerta({
      tipo: 'alerta',
      categoria: 'sistema',
      prioridade: 'media',
      titulo: `📢 Novo Relato na Ouvidoria CAE: ${apontamentoData.escolaNome}`,
      mensagem: `Assunto: "${apontamentoData.assunto}". Solicitante: ${apontamentoData.solicitanteTipo}.`,
      linkModulo: 'cae',
      showToast: true,
    });
  };

  const responderApontamentoOuvidoria = (id: string, resposta: string, status: ApontamentoOuvidoriaCAE['status']) => {
    setApontamentosCae(prev => prev.map(a => a.id === id ? { ...a, respostaCae: resposta, status } : a));

    addAuditoriaLog(
      'Resposta de Ouvidoria CAE',
      'Ouvidoria PNAE',
      `Manifestação ID ${id} atualizada com status '${status}'.`
    );
  };

  const resetToMockData = () => {
    localStorage.clear();
    setMunicipio(mockMunicipio);
    setEscolas(mockEscolas);
    setAlimentos(mockAlimentos);
    setCardapios(mockCardapios);
    setChamadasPublicas(mockChamadasPublicas);
    setContratos(mockContratos);
    setAutorizacoesFornecimento(mockAutorizacoesFornecimento);
    setEntregas(mockEntregas);
    setEstoqueEscola(mockEstoqueEscola);
    setPrestacaoContas(mockPrestacaoContas);
    setPareceresCae([mockParecerCAE]);
    setVisitasCae(mockVisitasCAE);
    setMembrosCae(mockMembrosCAE);
    setReunioesCae(mockReunioesCAE);
    setApontamentosCae(mockApontamentosCAE);
    setAuditoriaLogs(mockAuditoriaLogs);
    setAlertas(mockAlertas);
    setToasts([]);
    setCurrentUser(mockUsers[0]);
    setActiveTab('dashboard');
  };

  return (
    <PNAEContext.Provider
      value={{
        currentUser,
        currentRole: currentUser?.role || 'ADMIN',
        isAuthenticated: !!currentUser,
        municipio,
        escolas,
        alimentos,
        cardapios,
        chamadasPublicas,
        contratos,
        autorizacoesFornecimento,
        entregas,
        estoqueEscola,
        estoqueEscolas: estoqueEscola, // Alias para compatibilidade
        prestacaoContas,
        pareceresCae,
        visitasCae,
        membrosCae,
        reunioesCae,
        apontamentosCae,
        auditoriaLogs,
        alertas,
        toasts,
        somHabilitado,
        activeTab,
        setActiveTab,
        login,
        logout,
        switchRole,
        addCardapio,
        updateCardapioStatus,
        addAlimento,
        createChamadaPublica,
        submitProposta,
        emitirAF,
        registrarRecebimentoEntrega,
        confirmarRecebimentoEntrega,
        darBaixaEstoque,
        consumirEstoque,
        emitirParecerCAE,
        registrarVisitaCae,
        addMembroCae,
        updateMembroCae,
        agendarReuniaoCae,
        registrarApontamentoOuvidoria,
        responderApontamentoOuvidoria,
        addAuditoriaLog,
        addAlerta,
        markAlertaLido,
        markAllAlertasLidos,
        removerAlerta,
        dismissToast,
        toggleSomNotificacao,
        triggerSimulacaoNotificacao,
        updateMunicipio,
        resetToMockData,
      }}
    >
      {children}
    </PNAEContext.Provider>
  );
};

export const usePNAE = () => {
  const context = useContext(PNAEContext);
  if (!context) {
    throw new Error('usePNAE must be used within a PNAEProvider');
  }
  return context;
};

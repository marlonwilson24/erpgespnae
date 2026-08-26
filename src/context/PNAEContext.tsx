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
import confetti from 'canvas-confetti';

// Sub-contextos extraídos
import { AuthProvider, useAuth } from './AuthContext';
import { UIProvider, useUI } from './UIContext';

// Serviços de negócio do Supabase
import { buscarAlimentos, salvarAlimento } from '../lib/services/alimentosService';
import { buscarEscolas, salvarEscola } from '../lib/services/escolasService';
import { buscarCardapios, criarCardapio, atualizarStatusCardapio } from '../lib/services/cardapiosService';
import { buscarChamadasPublicas, criarChamadaPublica, submeterProposta } from '../lib/services/chamadasService';
import {
  buscarContratos,
  buscarAFs,
  emitirAF as emitirAFService,
  buscarEntregas,
  confirmarEntrega as confirmarEntregaService,
  buscarEstoque,
  darBaixaEstoque as darBaixaEstoqueService,
  consumirEstoquePorAlimento as consumirEstoquePorAlimentoService,
} from '../lib/services/entregasEstoqueService';
import {
  buscarPrestacaoContas,
  buscarPareceresCAE,
  emitirParecerCAE as emitirParecerCAEService,
  buscarAuditoriaLogs,
  salvarAuditoriaLog,
} from '../lib/services/prestacaoAuditoriaService';
import { buscarMunicipio, salvarMunicipio } from '../lib/services/municipiosService';
import {
  buscarVisitasCAE,
  registrarVisitaCAE as registrarVisitaCAEService,
  buscarMembrosCAE,
  salvarMembroCAE as salvarMembroCAEService,
  atualizarMembroCAE as atualizarMembroCAEService,
  buscarReunioesCAE,
  agendarReuniaoCAE as agendarReuniaoCAEService,
  buscarApontamentosCAE,
  registrarApontamentoCAE as registrarApontamentoCAEService,
  responderApontamentoCAE as responderApontamentoCAEService,
} from '../lib/services/caeService';

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

/** Interface pública do usePNAE() — mantida idêntica para retrocompatibilidade */
interface PNAEContextType {
  // --- Auth (delegado ao AuthContext) ---
  currentUser: UserProfile | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
  authChecking: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  // --- UI (delegado ao UIContext) ---
  alertas: AlertaPNAE[];
  toasts: ToastNotificacao[];
  somHabilitado: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  addAlerta: (alerta: Omit<AlertaPNAE, 'id' | 'data' | 'lido'> & { lido?: boolean; showToast?: boolean }) => void;
  markAlertaLido: (id: string) => void;
  markAllAlertasLidos: () => void;
  removerAlerta: (id: string) => void;
  dismissToast: (id: string) => void;
  toggleSomNotificacao: () => void;
  // --- Dados de negócio ---
  municipio: Municipio;
  escolas: Escola[];
  alimentos: Alimento[];
  cardapios: Cardapio[];
  chamadasPublicas: ChamadaPublica[];
  contratos: ContratoFornecedor[];
  autorizacoesFornecimento: AutorizacaoFornecimento[];
  entregas: EntregaMercadoria[];
  estoqueEscola: EstoqueItemEscola[];
  estoqueEscolas: EstoqueItemEscola[];
  prestacaoContas: PrestacaoContasPNAE;
  pareceresCae: ParecerCAE[];
  visitasCae: VisitaCAE[];
  membrosCae: MembroCAE[];
  reunioesCae: ReuniaoCAE[];
  apontamentosCae: ApontamentoOuvidoriaCAE[];
  auditoriaLogs: AuditoriaLog[];
  addEscola: (escola: Omit<Escola, 'id'>) => void;
  addCardapio: (cardapio: Omit<Cardapio, 'id' | 'criadoEm'>) => void;
  updateCardapioStatus: (id: string, status: Cardapio['status']) => void;
  addAlimento: (alimento: Omit<Alimento, 'id'>) => void;
  createChamadaPublica: (chamada: Omit<ChamadaPublica, 'id' | 'propostas'>) => void;
  submitProposta: (proposta: Omit<PropostaFornecedor, 'id' | 'dataSubmissao'>) => { success: boolean; error?: string };
  emitirAF: (afData: Omit<AutorizacaoFornecimento, 'id' | 'numeroAF' | 'dataEmissao' | 'status'>) => void;
  registrarRecebimentoEntrega: (entrega: Omit<EntregaMercadoria, 'id' | 'termoRecebimentoGerado'>) => void;
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
  updateMunicipio: (updatedData: Partial<Municipio>) => void;
}

// PNAEContext agora é apenas o contexto de dados de negócio.
// Auth → AuthContext | UI → UIContext
const PNAEContext = createContext<PNAEContextType | undefined>(undefined);

// Registros neutros enquanto o banco não carrega (sem dados fictícios)
const MUNICIPIO_VAZIO: Municipio = {
  id: '',
  nome: '',
  uf: '',
  codigoIbge: '',
  totalAlunosPNAE: 0,
  orcamentoAnualFNDE: 0,
  orcamentoContrapartida: 0,
  anoExercicio: new Date().getFullYear(),
};

const PRESTACAO_CONTAS_VAZIA: PrestacaoContasPNAE = {
  id: '',
  anoExercicio: new Date().getFullYear(),
  municipioId: '',
  municipioNome: '',
  recursoTotalFNDERecebido: 0,
  contrapartidaMunicipalGasta: 0,
  gastoTotalAlimentacao: 0,
  gastoAgriculturaFamiliar: 0,
  percentualAgriculturaFamiliarAtingido: 0,
  cumpreMetaLegal30Porcento: false,
  saldoContabilRemanescente: 0,
  numeroAlunosAtendidos: 0,
  numeroRefeicoesServidasAno: 0,
  statusAprovacao: 'Pendente Análise',
};

// ---------------------------------------------------------------------------
// PNAEBusinessProvider — lógica de negócio pura (dados do Supabase)
// ---------------------------------------------------------------------------
const PNAEBusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, login: authLogin, logout: authLogout, authChecking } = useAuth();
  const ui = useUI();

  const [municipio, setMunicipio] = useState<Municipio>(MUNICIPIO_VAZIO);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [chamadasPublicas, setChamadasPublicas] = useState<ChamadaPublica[]>([]);
  const [contratos, setContratos] = useState<ContratoFornecedor[]>([]);
  const [autorizacoesFornecimento, setAutorizacoesFornecimento] = useState<AutorizacaoFornecimento[]>([]);
  const [entregas, setEntregas] = useState<EntregaMercadoria[]>([]);
  const [estoqueEscola, setEstoqueEscola] = useState<EstoqueItemEscola[]>([]);
  const [prestacaoContas, setPrestacaoContas] = useState<PrestacaoContasPNAE>(PRESTACAO_CONTAS_VAZIA);
  const [pareceresCae, setPareceresCae] = useState<ParecerCAE[]>([]);
  const [visitasCae, setVisitasCae] = useState<VisitaCAE[]>([]);
  const [membrosCae, setMembrosCae] = useState<MembroCAE[]>([]);
  const [reunioesCae, setReunioesCae] = useState<ReuniaoCAE[]>([]);
  const [apontamentosCae, setApontamentosCae] = useState<ApontamentoOuvidoriaCAE[]>([]);
  const [auditoriaLogs, setAuditoriaLogs] = useState<AuditoriaLog[]>([]);

  // Carregamento primário e direto do Supabase para todos os módulos de negócio
  useEffect(() => {
    let isMounted = true;

    async function carregarDadosSupabase() {
      try {
        const [
          munData,
          alimData,
          escData,
          cardData,
          cpData,
          contData,
          afData,
          entData,
          estData,
          pcData,
          parData,
          logData,
          visData,
          memData,
          reunData,
          ouvData,
        ] = await Promise.all([
          buscarMunicipio(),
          buscarAlimentos(),
          buscarEscolas(),
          buscarCardapios(),
          buscarChamadasPublicas(),
          buscarContratos(),
          buscarAFs(),
          buscarEntregas(),
          buscarEstoque(),
          buscarPrestacaoContas(),
          buscarPareceresCAE(),
          buscarAuditoriaLogs(),
          buscarVisitasCAE(),
          buscarMembrosCAE(),
          buscarReunioesCAE(),
          buscarApontamentosCAE(),
        ]);

        if (!isMounted) return;

        if (munData) setMunicipio(munData);
        if (alimData.length > 0) setAlimentos(alimData);
        if (escData.length > 0) setEscolas(escData);
        if (cardData.length > 0) setCardapios(cardData);
        if (cpData.length > 0) setChamadasPublicas(cpData);
        if (contData.length > 0) setContratos(contData);
        if (afData.length > 0) setAutorizacoesFornecimento(afData);
        if (entData.length > 0) setEntregas(entData);
        if (estData.length > 0) setEstoqueEscola(estData);
        if (pcData) setPrestacaoContas(pcData);
        if (parData.length > 0) setPareceresCae(parData);
        if (logData.length > 0) setAuditoriaLogs(logData);
        if (visData.length > 0) setVisitasCae(visData);
        if (memData.length > 0) setMembrosCae(memData);
        if (reunData.length > 0) setReunioesCae(reunData);
        if (ouvData.length > 0) setApontamentosCae(ouvData);
      } catch (err) {
        console.error('[PNAEContext] Falha ao carregar dados do Supabase:', err);
      }
    }

    carregarDadosSupabase();

    return () => {
      isMounted = false;
    };
  }, []);


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
    salvarAuditoriaLog(acao, modulo, detalhes, currentUser?.name, currentUser?.role).catch(() => {});
  }, [currentUser]);

  // Alias de conveniência para ui.addAlerta (reduz verbosidade no código de negócio)
  const addAlerta = ui.addAlerta;


  // Disparar verificação de alertas automáticos via UIContext após carregar dados
  useEffect(() => {
    if (autorizacoesFornecimento.length > 0 || estoqueEscola.length > 0) {
      ui.verificarAlertasAutomaticos(autorizacoesFornecimento, estoqueEscola);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autorizacoesFornecimento, estoqueEscola]);

  // login/logout delegados ao AuthContext
  const login = useCallback(async (email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    const resultado = await authLogin(email, senha);
    if (!resultado.success) {
      addAuditoriaLog('Tentativa de Login Falha', 'Autenticação', `Falha de autenticação para ${email}: ${resultado.error}`);
      return resultado;
    }
    ui.setActiveTab('dashboard');
    addAuditoriaLog('Login no Sistema', 'Autenticação', `Usuário autenticado via Supabase Auth`);
    addAlerta({
      tipo: 'info',
      categoria: 'sistema',
      prioridade: 'baixa',
      titulo: `Bem-vindo(a) ao PNAE`,
      mensagem: `Sessão iniciada. Sistema sincronizado com dados do PNAE ${municipio.nome}-${municipio.uf}.`,
      showToast: true,
    });
    return { success: true };
  }, [authLogin, addAuditoriaLog, ui, addAlerta, municipio]);

  const logout = useCallback(async () => {
    if (currentUser) {
      addAuditoriaLog('Logout', 'Autenticação', `Usuário ${currentUser.name} encerrou a sessão.`);
    }
    await authLogout();
  }, [currentUser, addAuditoriaLog, authLogout]);

  const addEscola = async (escolaData: Omit<Escola, 'id'>) => {
    try {
      const salva = await salvarEscola({ ...escolaData, municipioId: municipio.id });
      if (salva) {
        setEscolas(prev => [...prev, salva]);
      }
    } catch (e) {
      console.error('Erro ao salvar escola no Supabase:', e);
    }
    addAuditoriaLog('Cadastro de Escola', 'Unidades Escolares', `Nova escola cadastrada: ${escolaData.nome} (INEP ${escolaData.codigoInep})`);
  };

  const addCardapio = async (cardapioData: Omit<Cardapio, 'id' | 'criadoEm'>) => {
    try {
      const criado = await criarCardapio(cardapioData, municipio.id);
      if (criado) {
        setCardapios(prev => [criado, ...prev]);
      }
    } catch (e) {
      console.error('Erro ao criar cardápio no Supabase:', e);
      const newCardapio: Cardapio = {
        ...cardapioData,
        id: `card-${Date.now()}`,
        criadoEm: new Date().toISOString().split('T')[0],
      };
      setCardapios(prev => [newCardapio, ...prev]);
    }
    addAuditoriaLog('Criação de Cardápio', 'Cardápios PNAE', `Novo cardápio criado: ${cardapioData.titulo} (${cardapioData.etapaEnsino})`);
  };

  const updateCardapioStatus = async (id: string, status: Cardapio['status']) => {
    setCardapios(prev =>
      prev.map(c => (c.id === id ? { ...c, status } : c))
    );
    await atualizarStatusCardapio(id, status);
    addAuditoriaLog('Atualização de Status de Cardápio', 'Cardápios PNAE', `Cardápio ${id} alterado para ${status}`);
  };

  const addAlimento = async (alimentoData: Omit<Alimento, 'id'>) => {
    try {
      const criado = await salvarAlimento(alimentoData);
      if (criado) {
        setAlimentos(prev => [...prev, criado]);
      }
    } catch (e) {
      console.error('Erro ao salvar alimento no Supabase:', e);
      const newAlimento: Alimento = {
        ...alimentoData,
        id: `alim-${Date.now()}`,
      };
      setAlimentos(prev => [...prev, newAlimento]);
    }
    addAuditoriaLog('Cadastro de Alimento', 'Catálogo de Alimentos', `Novo alimento inserido: ${alimentoData.nome}`);
  };

  const createChamadaPublica = async (chamadaData: Omit<ChamadaPublica, 'id' | 'propostas'>) => {
    try {
      const criada = await criarChamadaPublica(chamadaData, municipio.id);
      if (criada) {
        setChamadasPublicas(prev => [criada, ...prev]);
      }
    } catch (e) {
      console.error('Erro ao criar chamada pública no Supabase:', e);
      const newChamada: ChamadaPublica = {
        ...chamadaData,
        id: `cp-${Date.now()}`,
        propostas: [],
      };
      setChamadasPublicas(prev => [newChamada, ...prev]);
    }
    addAuditoriaLog('Abertura de Chamada Pública', 'Agricultura Familiar', `Edital ${chamadaData.numeroEdital} publicado com valor de R$ ${chamadaData.valorTotalEstimado.toFixed(2)}`);

    addAlerta({
      tipo: 'info',
      categoria: 'chamada_publica',
      prioridade: 'media',
      titulo: `📢 Nova Chamada Pública Publicada: ${chamadaData.numeroEdital}`,
      mensagem: `Edital aberto para aquisição de ${chamadaData.objeto} com percentual de ${chamadaData.percentualAgriFamiliar}% reservado à Agricultura Familiar.`,
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

    submeterProposta(propostaData).catch(err => console.error('Erro ao submeter proposta no Supabase:', err));

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

  const emitirAF = async (afData: Omit<AutorizacaoFornecimento, 'id' | 'numeroAF' | 'dataEmissao' | 'status'>) => {
    try {
      const emitida = await emitirAFService(afData);
      if (emitida) {
        setAutorizacoesFornecimento(prev => [emitida, ...prev]);
      }
    } catch (e) {
      console.error('Erro ao emitir AF no Supabase:', e);
      const numSeq = autorizacoesFornecimento.length + 43;
      const newAF: AutorizacaoFornecimento = {
        ...afData,
        id: `af-${Date.now()}`,
        numeroAF: `AF-2026-00${numSeq}`,
        dataEmissao: new Date().toISOString().split('T')[0],
        status: 'Em Trânsito',
      };
      setAutorizacoesFornecimento(prev => [newAF, ...prev]);
    }

    addAuditoriaLog('Emissão de AF', 'Autorizações de Fornecimento', `AF emitida para ${afData.escolaNome} no valor de R$ ${afData.valorTotalAF.toFixed(2)}`);

    // Notificação em tempo real imediata para a escola destino
    addAlerta({
      tipo: 'alerta',
      categoria: 'entrega_af',
      prioridade: 'alta',
      titulo: `📦 Nova Autorização de Fornecimento Emitida`,
      mensagem: `Uma nova AF foi despachada para entrega na ${afData.escolaNome} pelo agricultor ${afData.fornecedorNome}. Prazo limite: ${afData.dataLimiteEntrega}.`,
      escolaId: afData.escolaId,
      escolaNome: afData.escolaNome,
      fornecedorNome: afData.fornecedorNome,
      dataLimite: afData.dataLimiteEntrega,
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

    confirmarEntregaService(input).catch(err => console.error('Erro ao confirmar entrega no Supabase:', err));
    registrarRecebimentoEntrega(novaEntrega);
    return novaEntrega;
  };

  const darBaixaEstoque = (estoqueId: string, quantidadeUtilizada: number) => {
    darBaixaEstoqueService(estoqueId, quantidadeUtilizada).catch(err => console.error('Erro ao dar baixa no estoque no Supabase:', err));
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
    consumirEstoquePorAlimentoService(escolaId, alimentoId, quantidade)
      .catch(err => console.error('Erro ao registrar consumo de estoque no Supabase:', err));
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

  const emitirParecerCAE = async (parecerData: Omit<ParecerCAE, 'id' | 'assinadoEm'>) => {
    let parecerId = `par-${Date.now()}`;
    try {
      const emitido = await emitirParecerCAEService(parecerData);
      if (emitido) {
        parecerId = emitido.id;
        setPareceresCae(prev => [emitido, ...prev]);
      }
    } catch (e) {
      console.error('Erro ao emitir parecer CAE no Supabase:', e);
      const newParecer: ParecerCAE = {
        ...parecerData,
        id: parecerId,
        assinadoEm: new Date().toISOString(),
      };
      setPareceresCae(prev => [newParecer, ...prev]);
    }

    setPrestacaoContas(prev => ({
      ...prev,
      statusAprovacao: parecerData.resultadoParecer === 'Favorável sem Ressalvas' 
        ? 'Aprovado pelo CAE' 
        : parecerData.resultadoParecer === 'Favorável com Ressalvas'
        ? 'Aprovado com Ressalvas'
        : 'Rejeitado',
      parecerCaeId: parecerId,
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

  const updateMunicipio = async (updatedData: Partial<Municipio>) => {
    try {
      const salvo = await salvarMunicipio({ ...municipio, ...updatedData });
      if (salvo) {
        setMunicipio(salvo);
      } else {
        setMunicipio(prev => ({ ...prev, ...updatedData }));
      }
    } catch (e) {
      console.error('Erro ao salvar município no Supabase:', e);
      setMunicipio(prev => ({ ...prev, ...updatedData }));
    }

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

  const registrarVisitaCae = async (visitaData: Omit<VisitaCAE, 'id'>) => {
    try {
      const criada = await registrarVisitaCAEService(visitaData, municipio.id || currentUser?.municipioId);
      if (criada) {
        setVisitasCae(prev => [criada, ...prev]);
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
        return;
      }
    } catch (e) {
      console.error('Erro ao registrar visita CAE no Supabase:', e);
    }

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

  const addMembroCae = async (membroData: Omit<MembroCAE, 'id'>) => {
    try {
      const salvo = await salvarMembroCAEService(membroData, municipio.id || currentUser?.municipioId);
      if (salvo) {
        setMembrosCae(prev => [...prev, salvo]);
      }
    } catch (e) {
      console.error('Erro ao salvar membro CAE no Supabase:', e);
      const novoMembro: MembroCAE = {
        ...membroData,
        id: `mem-${Date.now()}`,
      };
      setMembrosCae(prev => [...prev, novoMembro]);
    }

    addAuditoriaLog(
      'Inclusão de Conselheiro CAE',
      'Controle Social CAE',
      `Conselheiro ${membroData.nome} (${membroData.cargoMesa} - ${membroData.segmento}) adicionado ao Colegiado.`
    );
  };

  const updateMembroCae = async (id: string, updatedData: Partial<MembroCAE>) => {
    setMembrosCae(prev => prev.map(m => m.id === id ? { ...m, ...updatedData } : m));
    await atualizarMembroCAEService(id, updatedData);

    addAuditoriaLog(
      'Atualização de Membro CAE',
      'Controle Social CAE',
      `Dados do conselheiro ID ${id} atualizados.`
    );
  };

  const agendarReuniaoCae = async (reuniaoData: Omit<ReuniaoCAE, 'id'>) => {
    try {
      const criada = await agendarReuniaoCAEService(reuniaoData, municipio.id || currentUser?.municipioId);
      if (criada) {
        setReunioesCae(prev => [criada, ...prev]);
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
        return;
      }
    } catch (e) {
      console.error('Erro ao agendar reunião CAE no Supabase:', e);
    }

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

  const registrarApontamentoOuvidoria = async (apontamentoData: Omit<ApontamentoOuvidoriaCAE, 'id' | 'dataRegistro'>) => {
    try {
      const salvo = await registrarApontamentoCAEService(
        { ...apontamentoData, dataRegistro: new Date().toISOString().split('T')[0] },
        municipio.id || currentUser?.municipioId
      );
      if (salvo) {
        setApontamentosCae(prev => [salvo, ...prev]);
      }
    } catch (e) {
      console.error('Erro ao registrar apontamento CAE no Supabase:', e);
      const novoApontamento: ApontamentoOuvidoriaCAE = {
        ...apontamentoData,
        id: `ouv-${Date.now()}`,
        dataRegistro: new Date().toISOString().split('T')[0],
      };
      setApontamentosCae(prev => [novoApontamento, ...prev]);
    }

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

  const responderApontamentoOuvidoria = async (id: string, resposta: string, status: ApontamentoOuvidoriaCAE['status']) => {
    setApontamentosCae(prev => prev.map(a => a.id === id ? { ...a, respostaCae: resposta, status } : a));
    await responderApontamentoCAEService(id, resposta, status);

    addAuditoriaLog(
      'Resposta de Ouvidoria CAE',
      'Ouvidoria PNAE',
      `Manifestação ID ${id} atualizada com status '${status}'.`
    );
  };

  return (
    <PNAEContext.Provider
      value={{
        // --- Auth (delegado) ---
        currentUser,
        currentRole: currentUser?.role ?? 'ADMIN',
        isAuthenticated: !!currentUser,
        authChecking,
        login,
        logout,
        // --- UI (delegado) ---
        alertas: ui.alertas,
        toasts: ui.toasts,
        somHabilitado: ui.somHabilitado,
        activeTab: ui.activeTab,
        setActiveTab: ui.setActiveTab,
        addAlerta: ui.addAlerta,
        markAlertaLido: ui.markAlertaLido,
        markAllAlertasLidos: ui.markAllAlertasLidos,
        removerAlerta: ui.removerAlerta,
        dismissToast: ui.dismissToast,
        toggleSomNotificacao: ui.toggleSomNotificacao,
        // --- Dados de negócio ---
        municipio,
        escolas,
        alimentos,
        cardapios,
        chamadasPublicas,
        contratos,
        autorizacoesFornecimento,
        entregas,
        estoqueEscola,
        estoqueEscolas: estoqueEscola,
        prestacaoContas,
        pareceresCae,
        visitasCae,
        membrosCae,
        reunioesCae,
        apontamentosCae,
        auditoriaLogs,
        addEscola,
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
        updateMunicipio,
      }}
    >
      {children}
    </PNAEContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// PNAEProvider público — compõe Auth + UI + Business
// ---------------------------------------------------------------------------
export const PNAEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <UIProvider>
      <PNAEBusinessProvider>
        {children}
      </PNAEBusinessProvider>
    </UIProvider>
  </AuthProvider>
);

// ---------------------------------------------------------------------------
// Hook público agregador — retrocompatível com todos os consumers
// ---------------------------------------------------------------------------
export const usePNAE = (): PNAEContextType => {
  const context = useContext(PNAEContext);
  if (!context) {
    throw new Error('usePNAE must be used within a PNAEProvider');
  }
  return context;
};

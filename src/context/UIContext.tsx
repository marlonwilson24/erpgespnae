/**
 * UIContext
 * ---------
 * Responsável por estado de interface: alertas, toasts, som e navegação por tabs.
 * Extraído de PNAEContext para separar lógica de UI de lógica de negócio/dados,
 * evitando re-renders em componentes de dados quando um toast é emitido.
 *
 * Expõe:
 *  - alertas, toasts, somHabilitado, activeTab
 *  - addAlerta(), markAlertaLido(), markAllAlertasLidos(), removerAlerta()
 *  - dismissToast(), toggleSomNotificacao()
 *  - setActiveTab()
 *  - verificarAlertasAutomaticos() — chamada pelo PNAEContext após mutações
 *  - useUI() hook
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  AlertaPNAE,
  ToastNotificacao,
  AutorizacaoFornecimento,
  EstoqueItemEscola,
} from '../types';
import { soundManager } from '../lib/notificationSound';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface UIContextType {
  alertas: AlertaPNAE[];
  toasts: ToastNotificacao[];
  setAlertas: React.Dispatch<React.SetStateAction<AlertaPNAE[]>>;
  setToasts: React.Dispatch<React.SetStateAction<ToastNotificacao[]>>;
  somHabilitado: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  addAlerta: (alerta: Omit<AlertaPNAE, 'id' | 'data' | 'lido'> & { lido?: boolean; showToast?: boolean }) => void;
  markAlertaLido: (id: string) => void;
  markAllAlertasLidos: () => void;
  removerAlerta: (id: string) => void;
  dismissToast: (id: string) => void;
  toggleSomNotificacao: () => void;
  /** Chamado pelos contextos de dados após mutações que afetam alertas automáticos */
  verificarAlertasAutomaticos: (
    autorizacoes: AutorizacaoFornecimento[],
    estoque: EstoqueItemEscola[],
  ) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const UIContext = createContext<UIContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertas, setAlertas] = useState<AlertaPNAE[]>([]);
  const [toasts, setToasts] = useState<ToastNotificacao[]>([]);
  const [somHabilitado, setSomHabilitado] = useState<boolean>(() => !soundManager.getIsMuted());
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // ------------------------------------------------------------------
  // Alertas & Toasts
  // ------------------------------------------------------------------

  const addAlerta = useCallback((
    alertaData: Omit<AlertaPNAE, 'id' | 'data' | 'lido'> & { lido?: boolean; showToast?: boolean },
  ) => {
    const newId = `al-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const novoAlerta: AlertaPNAE = {
      ...alertaData,
      id: newId,
      data: 'Agora',
      lido: alertaData.lido ?? false,
      criadoEm: new Date().toISOString(),
    };

    setAlertas(prev => [novoAlerta, ...prev]);

    if (alertaData.showToast !== false) {
      // Som contextual
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

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ------------------------------------------------------------------
  // Som
  // ------------------------------------------------------------------

  const toggleSomNotificacao = useCallback(() => {
    setSomHabilitado(prev => {
      const next = !prev;
      soundManager.setMuted(!next);
      if (next) soundManager.playChime();
      return next;
    });
  }, []);

  // ------------------------------------------------------------------
  // Verificação automática de alertas (chamada por contextos de dados)
  // ------------------------------------------------------------------

  const verificarAlertasAutomaticos = useCallback((
    autorizacoesFornecimento: AutorizacaoFornecimento[],
    estoqueEscola: EstoqueItemEscola[],
  ) => {
    const hoje = new Date();

    // 1. Monitorar Prazos de Entrega de AFs
    autorizacoesFornecimento.forEach(af => {
      if (af.status === 'Em Trânsito' || af.status === 'Emitida') {
        const prazo = new Date(af.dataLimiteEntrega);
        const diffDias = Math.ceil((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        const alertExiste = alertas.some(a => a.afId === af.id && a.categoria === 'entrega_af');

        if (!alertExiste) {
          if (diffDias < 0) {
            addAlerta({
              tipo: 'perigo',
              categoria: 'entrega_af',
              prioridade: 'alta',
              titulo: `🚨 Entrega em Atraso: ${af.numeroAF}`,
              mensagem: `A entrega da AF ${af.numeroAF} (${af.fornecedorNome}) para ${af.escolaNome} expirou o prazo em ${af.dataLimiteEntrega}.`,
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
            addAlerta({
              tipo: 'alerta',
              categoria: 'entrega_af',
              prioridade: 'alta',
              titulo: diffDias === 0
                ? `📦 Entrega HOJE: ${af.numeroAF}`
                : `⏳ Prazo Próximo: ${af.numeroAF}`,
              mensagem: `AF ${af.numeroAF} de ${af.fornecedorNome} (${af.itens.length} itens) prevista para ${af.escolaNome} até ${af.dataLimiteEntrega}.`,
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

    // 2. Monitorar Validade e Estoque Crítico
    estoqueEscola.forEach(item => {
      const validade = new Date(item.dataValidadeProxima);
      const diffDiasValidade = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      const alertValidadeExiste = alertas.some(
        a => a.estoqueId === item.id && a.categoria === 'validade_estoque',
      );

      if (!alertValidadeExiste) {
        if (diffDiasValidade <= 0) {
          addAlerta({
            tipo: 'perigo',
            categoria: 'validade_estoque',
            prioridade: 'alta',
            titulo: `⚠️ Alimento Vencido: ${item.alimentoNome}`,
            mensagem: `Lote ${item.lote} de ${item.alimentoNome} (${item.quantidadeAtual} ${item.unidadeMedida}) venceu em ${item.dataValidadeProxima}.`,
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
          addAlerta({
            tipo: 'alerta',
            categoria: 'validade_estoque',
            prioridade: 'alta',
            titulo: `⏱️ Validade Próxima: ${item.alimentoNome} (${diffDiasValidade}d)`,
            mensagem: `Lote ${item.lote} de ${item.alimentoNome} vence em ${item.dataValidadeProxima}. Priorize nos cardápios!`,
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

      const alertEstoqueBaixoExiste = alertas.some(
        a => a.estoqueId === item.id && a.categoria === 'estoque_baixo',
      );
      if (!alertEstoqueBaixoExiste && item.quantidadeAtual <= item.quantidadeMinimaAlerta && item.quantidadeAtual > 0) {
        addAlerta({
          tipo: 'alerta',
          categoria: 'estoque_baixo',
          prioridade: 'media',
          titulo: `📉 Estoque Baixo: ${item.alimentoNome}`,
          mensagem: `Restam apenas ${item.quantidadeAtual} ${item.unidadeMedida} (mínimo: ${item.quantidadeMinimaAlerta} ${item.unidadeMedida}).`,
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
  }, [alertas, addAlerta]);

  // Executa checagem inicial com dados reais (vazio enquanto carregam)
  useEffect(() => {
    // A verificação real é disparada pelo PNAEContext após carregar os dados.
  }, []);

  return (
    <UIContext.Provider
      value={{
        alertas,
        toasts,
        setAlertas,
        setToasts,
        somHabilitado,
        activeTab,
        setActiveTab,
        addAlerta,
        markAlertaLido,
        markAllAlertasLidos,
        removerAlerta,
        dismissToast,
        toggleSomNotificacao,
        verificarAlertasAutomaticos,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUI(): UIContextType {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return ctx;
}

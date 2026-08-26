import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { CategoriaAlertaPNAE } from '../../types';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Truck, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ArrowRight,
  Clock,
  Radio,
  Calendar,
  X
} from 'lucide-react';

interface NotificationCenterProps {
  onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const { 
    alertas, 
    markAlertaLido, 
    markAllAlertasLidos, 
    removerAlerta, 
    somHabilitado,
    toggleSomNotificacao,
    setActiveTab,
    currentRole
  } = usePNAE();

  const [filtroCategoria, setFiltroCategoria] = useState<'todas' | 'entrega_af' | 'validade_estoque' | 'nao_lidas'>('todas');

  const unreadAlerts = alertas.filter(a => !a.lido);
  const entregaAlerts = alertas.filter(a => a.categoria === 'entrega_af');
  const estoqueAlerts = alertas.filter(a => a.categoria === 'validade_estoque' || a.categoria === 'estoque_baixo');

  const alertasFiltrados = alertas.filter(a => {
    if (filtroCategoria === 'nao_lidas') return !a.lido;
    if (filtroCategoria === 'entrega_af') return a.categoria === 'entrega_af';
    if (filtroCategoria === 'validade_estoque') return a.categoria === 'validade_estoque' || a.categoria === 'estoque_baixo';
    return true;
  });

  const handleAction = (tab?: string, alertId?: string) => {
    if (alertId) markAlertaLido(alertId);
    if (tab) setActiveTab(tab);
    if (onClose) onClose();
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header do Notification Center */}
      <div className="p-4 border-b border-stone-100 bg-stone-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-700 text-white shadow-xs">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">Central de Notificações PNAE</h3>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
                Tempo Real
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              {unreadAlerts.length} pendentes • Prazos de entregas e validade da merenda
            </p>
          </div>
        </div>

        {/* Controles do Topo: Som e Fechar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSomNotificacao}
            className={`p-1.5 rounded-lg border transition ${
              somHabilitado 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                : 'bg-stone-100 border-stone-200 text-stone-400 hover:bg-stone-200'
            }`}
            title={somHabilitado ? 'Som de notificação ativado (Clique para mutar)' : 'Som de notificação desativado (Clique para ativar)'}
          >
            {somHabilitado ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros Rápidos */}
      <div className="px-4 py-2.5 bg-white border-b border-stone-100 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setFiltroCategoria('todas')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filtroCategoria === 'todas'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Todas ({alertas.length})
          </button>
          <button
            onClick={() => setFiltroCategoria('entrega_af')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
              filtroCategoria === 'entrega_af'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Truck className="w-3 h-3" />
            <span>Prazos AF ({entregaAlerts.length})</span>
          </button>
          <button
            onClick={() => setFiltroCategoria('validade_estoque')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
              filtroCategoria === 'validade_estoque'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Package className="w-3 h-3" />
            <span>Validade ({estoqueAlerts.length})</span>
          </button>
          <button
            onClick={() => setFiltroCategoria('nao_lidas')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filtroCategoria === 'nao_lidas'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Não Lidas ({unreadAlerts.length})
          </button>
        </div>

        {unreadAlerts.length > 0 && (
          <button
            onClick={markAllAlertasLidos}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 shrink-0"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Ler todas</span>
          </button>
        )}
      </div>

      {/* Lista de Notificações */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-stone-100">
        {alertasFiltrados.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/60 mb-2" />
            <p className="text-sm font-semibold text-stone-700">Tudo em dia!</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Não há notificações pendentes nesta categoria.
            </p>
          </div>
        ) : (
          alertasFiltrados.map(al => {
            const isDanger = al.tipo === 'perigo';
            const isAlert = al.tipo === 'alerta';
            const isSuccess = al.tipo === 'sucesso';

            return (
              <div
                key={al.id}
                className={`pt-3 first:pt-0 rounded-xl p-3 border transition ${
                  al.lido
                    ? 'bg-stone-50/70 border-stone-200/60 opacity-80'
                    : isDanger
                    ? 'bg-red-50/50 border-red-200'
                    : isAlert
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-emerald-50/40 border-emerald-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Ícone contextual */}
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isDanger
                        ? 'bg-red-100 text-red-700'
                        : isAlert
                        ? 'bg-amber-100 text-amber-700'
                        : isSuccess
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {al.categoria === 'entrega_af' ? (
                      <Truck className="w-4 h-4" />
                    ) : al.categoria === 'validade_estoque' ? (
                      <Clock className="w-4 h-4" />
                    ) : al.categoria === 'estoque_baixo' ? (
                      <Package className="w-4 h-4" />
                    ) : isDanger ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>

                  {/* Informações da Notificação */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-stone-900 leading-snug">
                        {al.titulo}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        {!al.lido && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        )}
                        <button
                          onClick={() => removerAlerta(al.id)}
                          className="p-1 rounded-md text-stone-300 hover:text-red-600 transition"
                          title="Excluir alerta"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {al.mensagem}
                    </p>

                    {/* Metadados Adicionais (Escola / AF / Validade) */}
                    {(al.escolaNome || al.numeroAF || al.dataLimite || al.diasRestantes !== undefined) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-stone-500">
                        {al.numeroAF && (
                          <span className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-mono font-bold">
                            {al.numeroAF}
                          </span>
                        )}
                        {al.escolaNome && (
                          <span className="text-stone-600">
                            🏫 {al.escolaNome}
                          </span>
                        )}
                        {al.dataLimite && (
                          <span className="text-amber-800 font-semibold flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" /> Prazo: {al.dataLimite}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Botão de Ação Direta */}
                    <div className="mt-3 pt-2 border-t border-stone-100/80 flex items-center justify-between">
                      <span className="text-[10px] text-stone-400">{al.data}</span>

                      <div className="flex items-center gap-2">
                        {!al.lido && (
                          <button
                            onClick={() => markAlertaLido(al.id)}
                            className="text-[11px] text-stone-500 hover:text-stone-800 font-medium"
                          >
                            Marcar como lido
                          </button>
                        )}

                        {(al.acaoTexto || al.acaoTab) && (
                          <button
                            onClick={() => handleAction(al.acaoTab || 'dashboard', al.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs transition ${
                              isDanger
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : isAlert
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                            }`}
                          >
                            <span>{al.acaoTexto || 'Acessar'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

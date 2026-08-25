import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { StatsCard } from '../common/StatsCard';
import { formatDate, formatCurrency } from '../../lib/utils';
import { 
  School, 
  Truck, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  Sparkles,
  Calendar,
  Radio,
  BellRing
} from 'lucide-react';
import { RecebimentoEntregaModal } from './RecebimentoEntregaModal';
import { AutorizacaoFornecimento } from '../../types';

export const EscolaDashboard: React.FC = () => {
  const { 
    currentUser, 
    escolas, 
    autorizacoesFornecimento, 
    estoqueEscolas, 
    entregas, 
    alertas,
    markAlertaLido,
    triggerSimulacaoNotificacao,
    setActiveTab 
  } = usePNAE();

  const [selectedAFParaReceber, setSelectedAFParaReceber] = useState<AutorizacaoFornecimento | null>(null);

  // Identificar a escola atual do usuário
  const escolaAtual = escolas.find(e => e.id === currentUser?.escolaId) || escolas[0];
  
  // AFs pendentes de entrega para esta escola
  const afsEscola = autorizacoesFornecimento.filter(af => af.escolaId === escolaAtual?.id);
  const afsPendentes = afsEscola.filter(af => af.status === 'Emitida' || af.status === 'Em Trânsito');

  // Estoque da escola
  const estoqueLocal = estoqueEscolas.filter(e => e.escolaId === escolaAtual?.id);
  const entregasRealizadas = entregas.filter(e => e.escolaId === escolaAtual?.id);

  // Alertas específicos desta escola
  const alertasEscola = alertas.filter(a => 
    !a.lido && (
      a.escolaId === escolaAtual?.id || 
      a.categoria === 'entrega_af' || 
      a.categoria === 'validade_estoque' ||
      a.categoria === 'estoque_baixo'
    )
  );

  // Itens com validade próxima (em até 7 dias)
  const itensVencendo = estoqueLocal.filter(item => {
    const prazo = new Date(item.dataValidadeProxima);
    const diffDias = Math.ceil((prazo.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diffDias <= 7;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header da Escola */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">
              {escolaAtual?.nome || 'Unidade Escolar'}
            </h2>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
              INEP: {escolaAtual?.codigoInep}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Responsável pela Merenda: <strong>{currentUser?.name || escolaAtual?.responsavelMerendaNome}</strong> • {escolaAtual?.totalAlunos} alunos matriculados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerSimulacaoNotificacao('entrega_chegando')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold shadow-2xs transition"
            title="Simula o recebimento em tempo real de uma entrega de agricultor familiar"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Simular Chegada de Entrega</span>
          </button>

          <button
            onClick={() => setActiveTab('estoque-escola')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Despensa e Estoque</span>
          </button>
        </div>
      </div>

      {/* Banner de Notificações em Tempo Real da Escola */}
      {alertasEscola.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500 text-white animate-bounce">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <span>Alertas em Tempo Real da Unidade Escolar</span>
                  <span className="flex items-center gap-1 text-[10px] bg-amber-200/80 text-amber-900 font-extrabold px-1.5 py-0.2 rounded-full">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-red-600" />
                    {alertasEscola.length} ativo{alertasEscola.length > 1 ? 's' : ''}
                  </span>
                </h3>
                <p className="text-[11px] text-stone-600">
                  Acompanhe os prazos de entregas de agricultores familiares e a validade dos gêneros na despensa.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {alertasEscola.slice(0, 4).map(al => (
              <div
                key={al.id}
                className="p-3 rounded-xl bg-white/90 border border-stone-200 shadow-2xs flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2 min-w-0">
                  {al.categoria === 'entrega_af' ? (
                    <Truck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-stone-900 truncate">{al.titulo}</p>
                    <p className="text-stone-600 text-[11px] line-clamp-2 mt-0.5">{al.mensagem}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {al.afId && (
                    <button
                      onClick={() => {
                        markAlertaLido(al.id);
                        const afEncontrada = autorizacoesFornecimento.find(a => a.id === al.afId);
                        if (afEncontrada) setSelectedAFParaReceber(afEncontrada);
                      }}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] shadow-2xs transition"
                    >
                      Conferir AF
                    </button>
                  )}
                  {al.categoria === 'validade_estoque' && (
                    <button
                      onClick={() => {
                        markAlertaLido(al.id);
                        setActiveTab('estoque-escola');
                      }}
                      className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-[11px] shadow-2xs transition"
                    >
                      Ver Despensa
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid de KPIs da Escola */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Alunos Atendidos PNAE"
          value={escolaAtual?.totalAlunos.toLocaleString('pt-BR') || 0}
          subtitle={`Atendimento ${escolaAtual?.tipoAtendimento || 'Parcial'}`}
          icon={<School className="w-5 h-5 text-blue-600" />}
          badgeText="Ativo"
          badgeColor="blue"
        />

        <StatsCard
          title="AFs a Receber"
          value={afsPendentes.length}
          subtitle="Entregas programadas"
          icon={<Truck className="w-5 h-5 text-amber-600" />}
          badgeText={afsPendentes.length > 0 ? 'Pendente' : 'Em Dia'}
          badgeColor={afsPendentes.length > 0 ? 'amber' : 'green'}
        />

        <StatsCard
          title="Gêneros em Estoque"
          value={estoqueLocal.length}
          subtitle={`${itensVencendo.length} com validade próxima`}
          icon={<Package className="w-5 h-5 text-emerald-600" />}
          onClick={() => setActiveTab('estoque-escola')}
          badgeText={itensVencendo.length > 0 ? `${itensVencendo.length} Atenção` : 'OK'}
          badgeColor={itensVencendo.length > 0 ? 'amber' : 'green'}
        />

        <StatsCard
          title="Entregas Conferidas"
          value={entregasRealizadas.length}
          subtitle="Com termos atestados"
          icon={<CheckCircle2 className="w-5 h-5 text-purple-600" />}
          badgeText="100% OK"
          badgeColor="green"
        />
      </div>

      {/* Lista de Ordens de Entrega / AFs Pendentes de Agricultura Familiar */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Autorizações de Fornecimento (AF) - Agricultura Familiar
            </h3>
            <p className="text-xs text-stone-500">
              Gêneros alimentícios agroecológicos e da agricultura familiar aguardando conferência e recebimento na unidade.
            </p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
            {afsPendentes.length} entrega{afsPendentes.length !== 1 ? 's' : ''} pendente{afsPendentes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {afsPendentes.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-stone-200 rounded-xl text-stone-400 text-xs">
            Nenhuma AF pendente de recebimento no momento. Todos os gêneros programados foram atestados.
          </div>
        ) : (
          <div className="space-y-3">
            {afsPendentes.map(af => {
              const diffDias = Math.ceil((new Date(af.dataLimiteEntrega).getTime() - new Date().getTime()) / 86400000);
              const ehHoje = diffDias === 0;
              const ehAtrasado = diffDias < 0;

              return (
                <div 
                  key={af.id} 
                  className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    ehAtrasado
                      ? 'border-red-300 bg-red-50/40'
                      : ehHoje
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-stone-200 bg-stone-50/70'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                        {af.numeroAF}
                      </span>
                      <span className="text-xs font-bold text-stone-800">
                        {af.fornecedorNome}
                      </span>
                      
                      {ehAtrasado ? (
                        <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Atrasada
                        </span>
                      ) : ehHoje ? (
                        <span className="text-[10px] bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Previsão de Entrega HOJE
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                          Prazo em {diffDias} dias
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600">
                      <strong>Itens:</strong> {af.itens.map(i => `${i.alimentoNome} (${i.quantidadeAutorizada} ${i.unidadeMedida})`).join(', ')}
                    </p>

                    <p className="text-[11px] text-stone-500 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        Data Limite: <strong>{formatDate(af.dataLimiteEntrega)}</strong>
                      </span>
                      <span>•</span>
                      <span>Valor Total: <strong>{formatCurrency(af.valorTotalAF)}</strong></span>
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedAFParaReceber(af)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Conferir e Atestar Recebimento</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Visão Resumida do Estoque Escolar com Indicadores de Validade */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Despensa Escolar (Estoque e Validade em Tempo Real)
            </h3>
            <p className="text-xs text-stone-500">
              Saldo em tempo real atualizado via Termos de Recebimento de AFs e baixas de consumo.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('estoque-escola')}
            className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>Gerenciar Despensa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {estoqueLocal.map(est => {
            const ehBaixo = est.quantidadeAtual <= est.quantidadeMinimaAlerta;
            const prazo = new Date(est.dataValidadeProxima);
            const diffDias = Math.ceil((prazo.getTime() - new Date().getTime()) / 86400000);
            const ehValidadeCritica = diffDias <= 5;

            return (
              <div key={est.id} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <span className="text-xs font-bold text-stone-900 truncate max-w-[130px]" title={est.alimentoNome}>
                    {est.alimentoNome}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {ehValidadeCritica ? (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded" title={`Validade: ${formatDate(est.dataValidadeProxima)}`}>
                        {diffDias <= 0 ? 'Vencido' : `${diffDias}d validade`}
                      </span>
                    ) : ehBaixo ? (
                      <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                        Baixo
                      </span>
                    ) : (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                        Normal
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-base font-black text-stone-800">
                  {est.quantidadeAtual} <span className="text-xs font-normal text-stone-500">{est.unidadeMedida}</span>
                </p>

                <div className="pt-1 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-400">
                  <span>Validade:</span>
                  <span className={ehValidadeCritica ? 'text-amber-700 font-bold' : 'text-stone-600'}>
                    {formatDate(est.dataValidadeProxima)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Conferência de Entrega */}
      {selectedAFParaReceber && (
        <RecebimentoEntregaModal
          af={selectedAFParaReceber}
          onClose={() => setSelectedAFParaReceber(null)}
        />
      )}

    </div>
  );
};

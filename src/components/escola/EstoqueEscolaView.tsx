import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { formatDate } from '../../lib/utils';
import { exportInventarioEstoquePDF } from '../../lib/exportPdf';
import { 
  Package, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  Search,
  Filter,
  Clock,
  Radio,
  Layers,
  ArrowDownCircle,
  Download
} from 'lucide-react';

export const EstoqueEscolaView: React.FC = () => {
  const { 
    currentUser, 
    escolas, 
    estoqueEscolas, 
    municipio,
    darBaixaEstoque, 
    consumirEstoque,
    triggerSimulacaoNotificacao 
  } = usePNAE();
  
  const escolaAtual = escolas.find(e => e.id === currentUser?.escolaId) || escolas[0];
  const estoqueLocal = estoqueEscolas.filter(e => e.escolaId === escolaAtual?.id);

  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'validade_urgente' | 'estoque_baixo'>('todos');
  const [selectedEstoqueId, setSelectedEstoqueId] = useState<string>(estoqueLocal[0]?.id || '');
  const [qtdConsumo, setQtdConsumo] = useState(10);
  const [motivoConsumo, setMotivoConsumo] = useState('Preparo do Almoço Escolar do Dia');
  const [showModalConsumo, setShowModalConsumo] = useState(false);

  const handleExportPDF = () => {
    if (escolaAtual) {
      exportInventarioEstoquePDF(escolaAtual, estoqueLocal, municipio);
    }
  };

  const handleDarBaixa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstoqueId) return;

    darBaixaEstoque(selectedEstoqueId, Number(qtdConsumo));
    setShowModalConsumo(false);
  };

  const hoje = new Date();

  // Filtragem dos itens de estoque
  const estoqueFiltrado = estoqueLocal.filter(est => {
    const matchBusca = est.alimentoNome.toLowerCase().includes(busca.toLowerCase()) ||
                       est.lote.toLowerCase().includes(busca.toLowerCase()) ||
                       est.categoria.toLowerCase().includes(busca.toLowerCase());
    
    if (!matchBusca) return false;

    const prazo = new Date(est.dataValidadeProxima);
    const diffDias = Math.ceil((prazo.getTime() - hoje.getTime()) / 86400000);

    if (filtro === 'validade_urgente') {
      return diffDias <= 7;
    }
    if (filtro === 'estoque_baixo') {
      return est.quantidadeAtual <= est.quantidadeMinimaAlerta;
    }
    return true;
  });

  const itensCriticosValidade = estoqueLocal.filter(est => {
    const diff = Math.ceil((new Date(est.dataValidadeProxima).getTime() - hoje.getTime()) / 86400000);
    return diff <= 5;
  });

  const itensEstoqueBaixo = estoqueLocal.filter(est => est.quantidadeAtual <= est.quantidadeMinimaAlerta);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header com Ações e Simulador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">
              Controle de Despensa e Estoque
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
              {escolaAtual?.nome}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Gestão em tempo real de validade, entradas de Agricultura Familiar e saídas diárias para a merenda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Exportar Inventário (PDF)</span>
          </button>

          <button
            onClick={() => triggerSimulacaoNotificacao('validade_urgente')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold shadow-2xs transition"
            title="Simula alerta de alimento vencendo em breve"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Simular Alerta de Validade</span>
          </button>

          <button
            onClick={() => {
              if (estoqueLocal[0]) setSelectedEstoqueId(estoqueLocal[0].id);
              setShowModalConsumo(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Minus className="w-4 h-4" />
            <span>Registrar Saída / Consumo do Dia</span>
          </button>
        </div>
      </div>

      {/* Alerta de Validade Crítica se houver */}
      {itensCriticosValidade.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-950 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 animate-pulse">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <span>{itensCriticosValidade.length} item(ns) com validade crítica na despensa!</span>
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.2 rounded-full font-bold">
                Ação Imediata
              </span>
            </p>
            <p className="text-stone-700 mt-1 leading-relaxed">
              Os itens <strong>{itensCriticosValidade.map(i => i.alimentoNome).join(', ')}</strong> possuem validade nos próximos dias. Priorize o consumo nas refeições escolares desta semana para evitar perdas.
            </p>
          </div>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por alimento, lote ou categoria..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filtro === 'todos'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Todos ({estoqueLocal.length})
          </button>
          <button
            onClick={() => setFiltro('validade_urgente')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
              filtro === 'validade_urgente'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Validade Próxima ({itensCriticosValidade.length})</span>
          </button>
          <button
            onClick={() => setFiltro('estoque_baixo')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
              filtro === 'estoque_baixo'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Estoque Baixo ({itensEstoqueBaixo.length})</span>
          </button>
        </div>
      </div>

      {/* Grid de Itens em Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {estoqueFiltrado.map(est => {
          const ehBaixo = est.quantidadeAtual <= est.quantidadeMinimaAlerta;
          const prazo = new Date(est.dataValidadeProxima);
          const diffDias = Math.ceil((prazo.getTime() - hoje.getTime()) / 86400000);
          const ehValidadeCritica = diffDias <= 5;
          const ehValidadeAlerta = diffDias <= 10 && diffDias > 5;

          return (
            <div 
              key={est.id} 
              className={`p-5 rounded-2xl bg-white border shadow-xs space-y-4 flex flex-col justify-between transition ${
                ehValidadeCritica
                  ? 'border-amber-300 ring-1 ring-amber-300/50 bg-amber-50/20'
                  : ehBaixo
                  ? 'border-red-200'
                  : 'border-stone-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">
                      {est.categoria}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 leading-snug mt-0.5">
                      {est.alimentoNome}
                    </h3>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {ehValidadeCritica ? (
                      <span className="text-[10px] bg-red-100 text-red-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {diffDias <= 0 ? 'Vencido' : `${diffDias} dias`}
                      </span>
                    ) : ehValidadeAlerta ? (
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {diffDias} dias
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Em Dia
                      </span>
                    )}

                    {ehBaixo && (
                      <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                        Estoque Baixo
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-black text-stone-900 tracking-tight">
                      {est.quantidadeAtual}{' '}
                      <span className="text-xs font-semibold text-stone-500">{est.unidadeMedida}</span>
                    </p>
                    <span className="text-[10px] font-mono text-stone-500 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                      Lote: {est.lote}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
                    <span>Mínimo de Segurança:</span>
                    <strong className="text-stone-700">{est.quantidadeMinimaAlerta} {est.unidadeMedida}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    Validade:
                  </span>
                  <strong className={ehValidadeCritica ? 'text-red-700 font-bold' : 'text-stone-700'}>
                    {formatDate(est.dataValidadeProxima)}
                  </strong>
                </div>

                <button
                  onClick={() => {
                    setSelectedEstoqueId(est.id);
                    setShowModalConsumo(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Dar Baixa / Consumo</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Registrar Saída / Consumo */}
      {showModalConsumo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-stone-900">
              Registrar Saída da Despensa (Consumo Merenda)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Dá baixa na quantidade utilizada pela equipe de cozinha da escola para as refeições dos alunos.
            </p>

            <form onSubmit={handleDarBaixa} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Selecione o Alimento da Despensa
                </label>
                <select
                  value={selectedEstoqueId}
                  onChange={e => setSelectedEstoqueId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-200 bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                >
                  {estoqueLocal.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.alimentoNome} (Saldo: {item.quantidadeAtual} {item.unidadeMedida}) - Lote: {item.lote}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Quantidade Utilizada
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={qtdConsumo}
                  onChange={e => setQtdConsumo(Number(e.target.value))}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Finalidade / Motivo da Saída
                </label>
                <input
                  type="text"
                  value={motivoConsumo}
                  onChange={e => setMotivoConsumo(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  placeholder="Ex: Preparo do Almoço Escolar do Dia"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowModalConsumo(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
                >
                  Confirmar Baixa de Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

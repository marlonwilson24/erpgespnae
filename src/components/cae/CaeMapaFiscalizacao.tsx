import React, { useState, useMemo } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { Escola, VisitaCAE } from '../../types';
import { formatDate } from '../../lib/utils';
import { 
  School, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Calendar, 
  Search, 
  Filter, 
  Layers, 
  Eye, 
  CheckSquare, 
  Download, 
  ChevronRight, 
  Sparkles, 
  Compass, 
  Maximize2, 
  Minimize2, 
  Info, 
  Utensils, 
  Package, 
  Sparkle, 
  Sprout, 
  Users, 
  Phone, 
  Mail, 
  Map as MapIcon, 
  LayoutGrid, 
  RotateCcw,
  Clock,
  Building2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

export interface EscolaStatusConformidade {
  escola: Escola;
  ultimaVisita?: VisitaCAE;
  todasVisitas: VisitaCAE[];
  statusCor: 'verde' | 'amarelo' | 'vermelho';
  pontuacao: number;
  classificacao: string;
  statusPendencia: 'Sem Pendências' | 'Em Acompanhamento' | 'Não Vistoriada' | 'Crítica';
  diasDesdeUltimaVisita: number | null;
  itensConformes: {
    cardapio: boolean;
    armazenamento: boolean;
    higiene: boolean;
    agriculturaFamiliar: boolean;
  };
  posicaoMapa: {
    x: number; // % do SVG
    y: number; // % do SVG
    zona: 'Urbana' | 'Rural';
    bairro: string;
  };
}

interface CaeMapaFiscalizacaoProps {
  onIniciarChecklistParaEscola: (escolaId: string) => void;
  onRegistrarNovaVisita: () => void;
}

const POSICOES_PREDEFINIDAS: Record<string, { x: number; y: number; zona: 'Urbana' | 'Rural'; bairro: string }> = {
  'esc-01': { x: 48, y: 50, zona: 'Urbana', bairro: 'Centro Histórico' },
  'esc-02': { x: 26, y: 28, zona: 'Urbana', bairro: 'Bairro Esperança (Norte)' },
  'esc-03': { x: 76, y: 74, zona: 'Rural', bairro: 'Linha Santa Cruz (Zona Rural)' },
  'esc-04': { x: 74, y: 30, zona: 'Urbana', bairro: 'Bairro Floresta (Leste)' },
};

export const CaeMapaFiscalizacao: React.FC<CaeMapaFiscalizacaoProps> = ({
  onIniciarChecklistParaEscola,
  onRegistrarNovaVisita
}) => {
  const { municipio, escolas, visitasCae } = usePNAE();

  // Estados de visualização e filtros
  const [modoVisualizacao, setModoVisualizacao] = useState<'MAPA' | 'GRADE' | 'MISTO'>('MISTO');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'VERDE' | 'AMARELO' | 'VERMELHO'>('TODOS');
  const [filtroZona, setFiltroZona] = useState<'TODAS' | 'Urbana' | 'Rural'>('TODAS');
  const [busca, setBusca] = useState<string>('');
  const [escolaSelecionadaId, setEscolaSelecionadaId] = useState<string | null>(escolas[0]?.id || null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mostrarRotulosMapa, setMostrarRotulosMapa] = useState<boolean>(true);
  const [mostrarZonasMapa, setMostrarZonasMapa] = useState<boolean>(true);

  // Calcula a conformidade consolidada de cada escola
  const escolasStatusList: EscolaStatusConformidade[] = useMemo(() => {
    return escolas.map((esc, index) => {
      const visitasEscola = visitasCae
        .filter(v => v.escolaId === esc.id)
        .sort((a, b) => new Date(b.dataVisita).getTime() - new Date(a.dataVisita).getTime());

      const ultimaVisita = visitasEscola[0];

      // Determinação de posição geográfica
      const posDef = POSICOES_PREDEFINIDAS[esc.id] || {
        x: 20 + ((index * 23) % 65),
        y: 25 + ((index * 29) % 55),
        zona: esc.endereco.toLowerCase().includes('rural') ? 'Rural' : 'Urbana',
        bairro: esc.endereco.split('-')[1]?.trim() || 'Setor Municipal'
      };

      // Cálculo de dias desde a última vistoria
      let diasDesdeUltimaVisita: number | null = null;
      if (ultimaVisita?.dataVisita) {
        const diffMs = new Date().getTime() - new Date(ultimaVisita.dataVisita).getTime();
        diasDesdeUltimaVisita = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }

      // Se a escola tiver pontuação explícita de checklist
      let pontuacao = 100;
      let statusCor: 'verde' | 'amarelo' | 'vermelho' = 'verde';
      let classificacao = 'Plena Conformidade Legal';
      let statusPendencia: 'Sem Pendências' | 'Em Acompanhamento' | 'Não Vistoriada' | 'Crítica' = 'Sem Pendências';

      const itensConformes = {
        cardapio: true,
        armazenamento: true,
        higiene: true,
        agriculturaFamiliar: true,
      };

      if (!ultimaVisita) {
        // Não vistoriada ainda
        statusCor = 'vermelho';
        pontuacao = 0;
        classificacao = 'Não Vistoriada no Exercício';
        statusPendencia = 'Não Vistoriada';
        itensConformes.cardapio = false;
        itensConformes.armazenamento = false;
        itensConformes.higiene = false;
        itensConformes.agriculturaFamiliar = false;
      } else {
        itensConformes.cardapio = Boolean(ultimaVisita.cardapioAfixadoEConforme);
        itensConformes.armazenamento = Boolean(ultimaVisita.armazenamentoAdequado);
        itensConformes.higiene = Boolean(ultimaVisita.condicoesHigieneAprovadas);
        itensConformes.agriculturaFamiliar = true; // verificado por padrão na remessa

        if (ultimaVisita.pontuacaoConformidade !== undefined) {
          pontuacao = ultimaVisita.pontuacaoConformidade;
        } else {
          // Calcula com base nos 3 itens principais
          let acertos = 0;
          if (itensConformes.cardapio) acertos++;
          if (itensConformes.armazenamento) acertos++;
          if (itensConformes.higiene) acertos++;
          pontuacao = Math.round((acertos / 3) * 100);
        }

        if (ultimaVisita.statusPendencia === 'Em Acompanhamento') {
          statusPendencia = 'Em Acompanhamento';
        } else if (ultimaVisita.statusPendencia === 'Resolvida' || ultimaVisita.statusPendencia === 'Sem Pendências') {
          statusPendencia = 'Sem Pendências';
        }

        // Regra de Cores Dinâmicas:
        // Verde: >= 85% e sem pendências graves
        // Amarelo: 65% a 84% OU em acompanhamento
        // Vermelho: < 65% OU itens críticos reprovados
        if (pontuacao >= 85 && statusPendencia === 'Sem Pendências' && itensConformes.higiene && itensConformes.armazenamento) {
          statusCor = 'verde';
          classificacao = 'Excelente • Plena Conformidade';
        } else if (pontuacao >= 65 || statusPendencia === 'Em Acompanhamento') {
          statusCor = 'amarelo';
          classificacao = 'Atenção • Em Acompanhamento';
        } else {
          statusCor = 'vermelho';
          classificacao = 'Irregular • Risco Sanitário/Legal';
        }
      }

      return {
        escola: esc,
        ultimaVisita,
        todasVisitas: visitasEscola,
        statusCor,
        pontuacao,
        classificacao,
        statusPendencia,
        diasDesdeUltimaVisita,
        itensConformes,
        posicaoMapa: posDef,
      };
    });
  }, [escolas, visitasCae]);

  // Métricas Consolidadas do Mapa
  const metricas = useMemo(() => {
    const total = escolasStatusList.length;
    const verdes = escolasStatusList.filter(e => e.statusCor === 'verde').length;
    const amarelas = escolasStatusList.filter(e => e.statusCor === 'amarelo').length;
    const vermelhas = escolasStatusList.filter(e => e.statusCor === 'vermelho').length;
    
    const somaPontos = escolasStatusList.reduce((acc, curr) => acc + curr.pontuacao, 0);
    const mediaGeral = total > 0 ? Math.round(somaPontos / total) : 0;

    return {
      total,
      verdes,
      amarelas,
      vermelhas,
      mediaGeral,
      pctVerde: total > 0 ? Math.round((verdes / total) * 100) : 0,
      pctAmarelo: total > 0 ? Math.round((amarelas / total) * 100) : 0,
      pctVermelho: total > 0 ? Math.round((vermelhas / total) * 100) : 0,
    };
  }, [escolasStatusList]);

  // Lista Filtrada
  const escolasFiltradas = useMemo(() => {
    return escolasStatusList.filter(item => {
      const matchBusca = busca === '' || 
        item.escola.nome.toLowerCase().includes(busca.toLowerCase()) ||
        item.escola.codigoInep.includes(busca) ||
        item.posicaoMapa.bairro.toLowerCase().includes(busca.toLowerCase()) ||
        item.escola.responsavelMerendaNome.toLowerCase().includes(busca.toLowerCase());

      const matchStatus = 
        filtroStatus === 'TODOS' ||
        (filtroStatus === 'VERDE' && item.statusCor === 'verde') ||
        (filtroStatus === 'AMARELO' && item.statusCor === 'amarelo') ||
        (filtroStatus === 'VERMELHO' && item.statusCor === 'vermelho');

      const matchZona = 
        filtroZona === 'TODAS' || item.posicaoMapa.zona === filtroZona;

      return matchBusca && matchStatus && matchZona;
    });
  }, [escolasStatusList, busca, filtroStatus, filtroZona]);

  // Escola ativa para o Raio-X lateral
  const escolaSelecionada = useMemo(() => {
    if (!escolaSelecionadaId) return escolasStatusList[0] || null;
    return escolasStatusList.find(e => e.escola.id === escolaSelecionadaId) || escolasStatusList[0] || null;
  }, [escolaSelecionadaId, escolasStatusList]);

  const getStatusBadge = (cor: 'verde' | 'amarelo' | 'vermelho', pontuacao: number, statusPendencia: string) => {
    if (cor === 'verde') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Conforme ({pontuacao}%)</span>
        </span>
      );
    }
    if (cor === 'amarelo') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>{statusPendencia === 'Em Acompanhamento' ? 'Em Acompanhamento' : 'Alerta'} ({pontuacao}%)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-900 border border-red-300">
        <XCircle className="w-3.5 h-3.5 text-red-600" />
        <span>Irregular / Crítico ({pontuacao}%)</span>
      </span>
    );
  };

  return (
    <div id="cae-mapa-interativo-fiscalizacao" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header com Visão Geral da Conformidade Municipal */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-stone-900 via-purple-950 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-400/20 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  Cartografia de Fiscalização do CAE
                </span>
                <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-stone-200 border border-white/10">
                  {municipio.nome} - {municipio.uf} • {escolas.length} Polos Escolares
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white mt-2">
                Mapa Interativo & Grade de Conformidade Sanitária das Escolas
              </h2>
              <p className="text-xs md:text-sm text-stone-300 max-w-3xl leading-relaxed mt-1">
                Monitoramento visual em tempo real da situação higiênico-sanitária e nutricional dos refeitórios escolares com base nas vistorias in loco do CAE e Lei Federal nº 11.947/2009.
              </p>
            </div>

            {/* Gauge de Conformidade da Rede */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 min-w-[240px] justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-300 tracking-wider block">
                  Índice Médio da Rede
                </span>
                <div className="text-3xl font-black text-white mt-0.5">
                  {metricas.mediaGeral}%
                </div>
                <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  {metricas.verdes} de {metricas.total} em Plena Conformidade
                </span>
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-emerald-400/40 border-t-emerald-400 flex items-center justify-center font-black text-sm text-emerald-300 bg-emerald-950/40">
                {metricas.pctVerde}%
              </div>
            </div>
          </div>

          {/* Cards Indicadores por Cor de Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
            <button
              onClick={() => setFiltroStatus(filtroStatus === 'VERDE' ? 'TODOS' : 'VERDE')}
              className={`p-3 rounded-xl border text-left transition ${
                filtroStatus === 'VERDE'
                  ? 'bg-emerald-500/30 border-emerald-400 ring-2 ring-emerald-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Conformes (Verde)
                </span>
                <span className="text-lg font-black text-emerald-300">{metricas.verdes}</span>
              </div>
              <p className="text-[10px] text-emerald-300/80 mt-1">
                {metricas.pctVerde}% da rede sem pendências
              </p>
            </button>

            <button
              onClick={() => setFiltroStatus(filtroStatus === 'AMARELO' ? 'TODOS' : 'AMARELO')}
              className={`p-3 rounded-xl border text-left transition ${
                filtroStatus === 'AMARELO'
                  ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-400'
                  : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  Alerta / Acomp. (Amarelo)
                </span>
                <span className="text-lg font-black text-amber-300">{metricas.amarelas}</span>
              </div>
              <p className="text-[10px] text-amber-300/80 mt-1">
                {metricas.pctAmarelo}% com recomendações ativas
              </p>
            </button>

            <button
              onClick={() => setFiltroStatus(filtroStatus === 'VERMELHO' ? 'TODOS' : 'VERMELHO')}
              className={`p-3 rounded-xl border text-left transition ${
                filtroStatus === 'VERMELHO'
                  ? 'bg-red-500/30 border-red-400 ring-2 ring-red-400'
                  : 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-red-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                  Crítico / Irregular (Vermelho)
                </span>
                <span className="text-lg font-black text-red-300">{metricas.vermelhas}</span>
              </div>
              <p className="text-[10px] text-red-300/80 mt-1">
                {metricas.pctVermelho}% requer vistoria urgente
              </p>
            </button>

            <button
              onClick={() => setFiltroStatus('TODOS')}
              className={`p-3 rounded-xl border text-left transition ${
                filtroStatus === 'TODOS'
                  ? 'bg-white/20 border-white/40 ring-2 ring-white/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-200">
                  Total de Escolas
                </span>
                <span className="text-lg font-black text-white">{metricas.total}</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                Clique para ver todas as unidades
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Controles, Modos de Visualização e Filtros */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Modos de Visualização */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 self-start">
          <button
            onClick={() => setModoVisualizacao('MISTO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              modoVisualizacao === 'MISTO'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mapa & Grade (Misto)</span>
          </button>

          <button
            onClick={() => setModoVisualizacao('MAPA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              modoVisualizacao === 'MAPA'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Apenas Mapa</span>
          </button>

          <button
            onClick={() => setModoVisualizacao('GRADE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              modoVisualizacao === 'GRADE'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Apenas Grade</span>
          </button>
        </div>

        {/* Busca e Filtro de Zona */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl justify-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por escola, INEP ou bairro..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>

          <select
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-purple-500 font-semibold text-stone-700"
          >
            <option value="TODAS">Todas as Zonas</option>
            <option value="Urbana">Zona Urbana</option>
            <option value="Rural">Zona Rural</option>
          </select>

          {filtroStatus !== 'TODOS' && (
            <button
              onClick={() => setFiltroStatus('TODOS')}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar Filtro ({filtroStatus})</span>
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo Principal: Mapa + Grade de Conformidade */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coluna Esquerda/Principal: Mapa Cartográfico Interativo */}
        {(modoVisualizacao === 'MAPA' || modoVisualizacao === 'MISTO') && (
          <div className={`${modoVisualizacao === 'MAPA' ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-3`}>
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-700" />
                  <h3 className="text-sm font-bold text-stone-900">
                    Geolocalização dos Polos Escolares & Status de Fiscalização
                  </h3>
                </div>

                {/* Controles do Mapa */}
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setMostrarRotulosMapa(!mostrarRotulosMapa)}
                    className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition ${
                      mostrarRotulosMapa ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-white border-stone-200 text-stone-500'
                    }`}
                  >
                    Rótulos
                  </button>
                  <button
                    onClick={() => setMostrarZonasMapa(!mostrarZonasMapa)}
                    className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition ${
                      mostrarZonasMapa ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-white border-stone-200 text-stone-500'
                    }`}
                  >
                    Setores
                  </button>
                  <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden ml-1">
                    <button
                      onClick={() => setZoomLevel(Math.max(0.8, zoomLevel - 0.1))}
                      className="p-1 hover:bg-stone-100 text-stone-600"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-1.5 text-[10px] font-bold text-stone-500">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))}
                      className="p-1 hover:bg-stone-100 text-stone-600"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Canvas SVG Cartográfico Interativo */}
              <div className="relative w-full h-[420px] rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-inner select-none">
                
                {/* Elementos Geográficos Vetoriais do Município */}
                <svg
                  viewBox="0 0 800 500"
                  className="w-full h-full object-cover transition-transform duration-300"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <defs>
                    {/* Gradientes e Padrões */}
                    <linearGradient id="bgMunicipal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0f172a" />
                      <stop offset="100%" stopColor="#1e1b4b" />
                    </linearGradient>

                    <linearGradient id="rioGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
                    </linearGradient>

                    {/* Filtro Glow para Marcadores */}
                    <filter id="glowVerde" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glowAmarelo" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glowVermelho" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Fundo do Território */}
                  <rect width="800" height="500" fill="url(#bgMunicipal)" />

                  {/* Grid Cartográfica Suave */}
                  <g stroke="#334155" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.35">
                    <line x1="100" y1="0" x2="100" y2="500" />
                    <line x1="200" y1="0" x2="200" y2="500" />
                    <line x1="300" y1="0" x2="300" y2="500" />
                    <line x1="400" y1="0" x2="400" y2="500" />
                    <line x1="500" y1="0" x2="500" y2="500" />
                    <line x1="600" y1="0" x2="600" y2="500" />
                    <line x1="700" y1="0" x2="700" y2="500" />
                    <line x1="0" y1="100" x2="800" y2="100" />
                    <line x1="0" y1="200" x2="800" y2="200" />
                    <line x1="0" y1="300" x2="800" y2="300" />
                    <line x1="0" y1="400" x2="800" y2="400" />
                  </g>

                  {/* Polígonos de Setores / Distritos Municipais */}
                  {mostrarZonasMapa && (
                    <g opacity="0.4">
                      {/* Setor Norte / Bairro Esperança */}
                      <path
                        d="M 50 40 L 350 40 L 320 220 L 50 200 Z"
                        fill="#6366f1"
                        fillOpacity="0.12"
                        stroke="#818cf8"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                      />
                      <text x="70" y="70" fill="#a5b4fc" fontSize="11" fontWeight="bold">
                        Setor Norte (Bairro Esperança)
                      </text>

                      {/* Setor Centro Histórico */}
                      <path
                        d="M 320 220 L 520 220 L 500 360 L 300 360 Z"
                        fill="#8b5cf6"
                        fillOpacity="0.15"
                        stroke="#a78bfa"
                        strokeWidth="1.5"
                      />
                      <text x="340" y="245" fill="#c4b5fd" fontSize="11" fontWeight="bold">
                        Distrito Central
                      </text>

                      {/* Setor Leste / Bairro Floresta */}
                      <path
                        d="M 550 50 L 760 50 L 760 250 L 530 220 Z"
                        fill="#10b981"
                        fillOpacity="0.08"
                        stroke="#34d399"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                      />
                      <text x="580" y="80" fill="#6ee7b7" fontSize="11" fontWeight="bold">
                        Setor Leste (Bairro Floresta)
                      </text>

                      {/* Setor Rural / Linha Santa Cruz */}
                      <path
                        d="M 500 360 L 770 260 L 770 470 L 480 470 Z"
                        fill="#f59e0b"
                        fillOpacity="0.1"
                        stroke="#fbbf24"
                        strokeWidth="1.5"
                        strokeDasharray="5,5"
                      />
                      <text x="560" y="445" fill="#fcd34d" fontSize="11" fontWeight="bold">
                        Zona Rural (Linha Santa Cruz)
                      </text>
                    </g>
                  )}

                  {/* Hidrografia / Rio Principal do Município */}
                  <path
                    d="M 0 320 C 180 340, 260 280, 420 300 C 580 320, 680 230, 800 240 L 800 270 C 680 260, 580 350, 420 330 C 260 310, 180 370, 0 350 Z"
                    fill="url(#rioGrad)"
                  />
                  <text x="210" y="330" fill="#38bdf8" opacity="0.6" fontSize="9" fontStyle="italic">
                    Rio Santa Clara • Cinturão Hidrográfico
                  </text>

                  {/* Vias Estruturais / Avenidas de Ligação */}
                  <path
                    d="M 210 140 L 384 250 L 608 370"
                    stroke="#475569"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                  <path
                    d="M 384 250 L 592 150"
                    stroke="#475569"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                </svg>

                {/* Marcadores Interativos das Escolas (Camada HTML Absoluta) */}
                <div className="absolute inset-0 pointer-events-none">
                  {escolasFiltradas.map((item) => {
                    const isSelected = escolaSelecionadaId === item.escola.id;
                    const isVerde = item.statusCor === 'verde';
                    const isAmarelo = item.statusCor === 'amarelo';
                    const isVermelho = item.statusCor === 'vermelho';

                    const corHex = isVerde ? '#10b981' : isAmarelo ? '#f59e0b' : '#ef4444';
                    const corBg = isVerde ? 'bg-emerald-500' : isAmarelo ? 'bg-amber-500' : 'bg-red-500';
                    const corRing = isVerde ? 'ring-emerald-400/50' : isAmarelo ? 'ring-amber-400/50' : 'ring-red-400/50';

                    return (
                      <div
                        key={item.escola.id}
                        style={{
                          left: `${item.posicaoMapa.x}%`,
                          top: `${item.posicaoMapa.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute pointer-events-auto group cursor-pointer z-20"
                        onClick={() => setEscolaSelecionadaId(item.escola.id)}
                      >
                        {/* Halo Pulsante de Status */}
                        <div className="relative flex items-center justify-center">
                          <span
                            className={`absolute -inset-2 rounded-full animate-ping opacity-60 ${corBg}`}
                          />
                          
                          {/* Marcador Principal */}
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all transform duration-200 border-2 ${
                              isSelected
                                ? 'scale-125 ring-4 ring-white border-white bg-slate-900 z-30'
                                : 'hover:scale-110 border-white/80 bg-slate-950'
                            }`}
                            style={{
                              boxShadow: `0 0 16px ${corHex}80`
                            }}
                          >
                            <School className="w-4 h-4 text-white" />
                            
                            {/* Ponto / Badge de Pontuação */}
                            <span
                              className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[9px] font-black text-white flex items-center justify-center border border-white shadow-xs ${corBg}`}
                            >
                              {item.pontuacao > 0 ? `${item.pontuacao}%` : '!'}
                            </span>
                          </div>

                          {/* Rótulo Nome da Escola */}
                          {mostrarRotulosMapa && (
                            <div
                              className={`absolute top-11 whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur-md shadow-md transition-all ${
                                isSelected
                                  ? 'bg-purple-900/95 text-white border-purple-400 z-40 scale-105'
                                  : 'bg-slate-900/90 text-stone-200 border-slate-700 hover:bg-slate-800'
                              }`}
                            >
                              <span>{item.escola.nome}</span>
                            </div>
                          )}

                          {/* Tooltip Hover com Raio-X Rápido */}
                          <div className="absolute bottom-12 hidden group-hover:block z-50 pointer-events-none w-56 p-2.5 rounded-xl bg-slate-900/95 text-white border border-slate-700 shadow-2xl backdrop-blur-md text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                              <span className="font-bold text-white text-[11px] line-clamp-1">
                                {item.escola.nome}
                              </span>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${corBg} text-white`}
                              >
                                {item.statusCor.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-300 space-y-0.5">
                              <div>INEP: <strong>{item.escola.codigoInep}</strong> • {item.escola.totalAlunos} alunos</div>
                              <div>Bairro: <strong>{item.posicaoMapa.bairro}</strong></div>
                              <div>Conformidade: <strong className="text-white">{item.pontuacao}%</strong></div>
                              <div>Última Vistoria: <strong>{item.ultimaVisita ? formatDate(item.ultimaVisita.dataVisita) : 'Nenhuma'}</strong></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legenda do Mapa */}
                <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/80 text-[10px] text-stone-300 space-y-1.5 z-10 shadow-lg">
                  <span className="font-bold text-white uppercase tracking-wider block text-[9px]">
                    Legenda de Conformidade
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>🟢 Conforme (≥ 85% • Sem Pendências)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>🟡 Alerta / Em Acompanhamento (65%–84%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span>🔴 Irregular / Sem Vistoria Recente (&lt; 65%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coluna Direita: Raio-X Detalhado da Escola Selecionada no Mapa */}
        {escolaSelecionada && (modoVisualizacao === 'MAPA' || modoVisualizacao === 'MISTO') && (
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
              
              {/* Header do Card de Raio-X */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-stone-900">
                      {escolaSelecionada.escola.nome}
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    INEP: <strong>{escolaSelecionada.escola.codigoInep}</strong> • {escolaSelecionada.posicaoMapa.bairro} ({escolaSelecionada.posicaoMapa.zona})
                  </p>
                </div>

                <div>
                  {getStatusBadge(
                    escolaSelecionada.statusCor,
                    escolaSelecionada.pontuacao,
                    escolaSelecionada.statusPendencia
                  )}
                </div>
              </div>

              {/* Indicador de Desempenho Sanitário */}
              <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                escolaSelecionada.statusCor === 'verde'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : escolaSelecionada.statusCor === 'amarelo'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-red-50/70 border-red-200'
              }`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">
                    Diagnóstico da Fiscalização
                  </span>
                  <h4 className={`text-sm font-bold ${
                    escolaSelecionada.statusCor === 'verde'
                      ? 'text-emerald-900'
                      : escolaSelecionada.statusCor === 'amarelo'
                      ? 'text-amber-900'
                      : 'text-red-900'
                  }`}>
                    {escolaSelecionada.classificacao}
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {escolaSelecionada.ultimaVisita
                      ? `Última vistoria realizada em ${formatDate(escolaSelecionada.ultimaVisita.dataVisita)} (${escolaSelecionada.diasDesdeUltimaVisita} dias atrás)`
                      : 'Nenhuma vistoria técnica registrada neste exercício'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-stone-900">
                    {escolaSelecionada.pontuacao}%
                  </div>
                  <span className="text-[9px] uppercase font-bold text-stone-500">
                    Conformidade
                  </span>
                </div>
              </div>

              {/* Status dos 4 Pilares da Lei 11.947/2009 */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                  Pilares de Avaliação In Loco:
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    escolaSelecionada.itensConformes.cardapio
                      ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                      : 'bg-red-50/40 border-red-200 text-red-950'
                  }`}>
                    {escolaSelecionada.itensConformes.cardapio ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span className="text-[11px] font-medium leading-tight">Cardápio RT & Nutrição</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    escolaSelecionada.itensConformes.armazenamento
                      ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                      : 'bg-red-50/40 border-red-200 text-red-950'
                  }`}>
                    {escolaSelecionada.itensConformes.armazenamento ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span className="text-[11px] font-medium leading-tight">Armazenamento & Validade</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    escolaSelecionada.itensConformes.higiene
                      ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                      : 'bg-red-50/40 border-red-200 text-red-950'
                  }`}>
                    {escolaSelecionada.itensConformes.higiene ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span className="text-[11px] font-medium leading-tight">Higiene & Paramentação</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    escolaSelecionada.itensConformes.agriculturaFamiliar
                      ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                      : 'bg-red-50/40 border-red-200 text-red-950'
                  }`}>
                    {escolaSelecionada.itensConformes.agriculturaFamiliar ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span className="text-[11px] font-medium leading-tight">Agricultura Familiar</span>
                  </div>
                </div>
              </div>

              {/* Informações da Cozinha e Direção */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Direção:</span>
                  <strong className="text-stone-800">{escolaSelecionada.escola.diretorNome}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Cozinheira / Merenda:</span>
                  <strong className="text-stone-800">{escolaSelecionada.escola.responsavelMerendaNome}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Total de Alunos:</span>
                  <strong className="text-stone-800">{escolaSelecionada.escola.totalAlunos} matriculados</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Tipo de Atendimento:</span>
                  <strong className="text-stone-800">{escolaSelecionada.escola.tipoAtendimento}</strong>
                </div>
              </div>

              {/* Recomendações e Parecer da Última Vistoria */}
              {escolaSelecionada.ultimaVisita && (
                <div className="space-y-1 text-xs">
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                    Último Parecer do Colegiado:
                  </span>
                  <p className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-stone-800 leading-relaxed italic text-[11px]">
                    "{escolaSelecionada.ultimaVisita.relatorioObservacoes}"
                  </p>
                  {escolaSelecionada.ultimaVisita.recomendacoesEncaminhadas && (
                    <p className="text-[11px] text-amber-900 font-semibold mt-1">
                      ↳ Encaminhamento: {escolaSelecionada.ultimaVisita.recomendacoesEncaminhadas}
                    </p>
                  )}
                </div>
              )}

              {/* Ações Rápidas da Escola Selecionada */}
              <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onIniciarChecklistParaEscola(escolaSelecionada.escola.id)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm transition"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Realizar Checklist In Loco Nesta Escola</span>
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Grade de Conformidade (Grid View com Cores Dinâmicas) */}
      {(modoVisualizacao === 'GRADE' || modoVisualizacao === 'MISTO') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-purple-700" />
              <h3 className="text-sm font-bold text-stone-900">
                Grade de Conformidade das Unidades Escolares ({escolasFiltradas.length} Polos)
              </h3>
            </div>
            <span className="text-xs text-stone-500">
              Clique em qualquer card para inspecionar o laudo técnico
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {escolasFiltradas.map((item) => {
              const isSelected = escolaSelecionadaId === item.escola.id;
              const isVerde = item.statusCor === 'verde';
              const isAmarelo = item.statusCor === 'amarelo';
              const isVermelho = item.statusCor === 'vermelho';

              const topBarBg = isVerde 
                ? 'bg-emerald-500' 
                : isAmarelo 
                ? 'bg-amber-500' 
                : 'bg-red-500';

              const cardBorder = isSelected
                ? 'border-purple-500 ring-2 ring-purple-500/30'
                : isVerde
                ? 'border-emerald-200 hover:border-emerald-300'
                : isAmarelo
                ? 'border-amber-200 hover:border-amber-300'
                : 'border-red-200 hover:border-red-300';

              return (
                <div
                  key={item.escola.id}
                  onClick={() => setEscolaSelecionadaId(item.escola.id)}
                  className={`rounded-2xl bg-white border ${cardBorder} shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden cursor-pointer group`}
                >
                  {/* Barra de Status Colorida no Topo */}
                  <div className={`h-2.5 w-full ${topBarBg}`} />

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    
                    {/* Header do Card */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                          {item.posicaoMapa.zona} • {item.posicaoMapa.bairro}
                        </span>
                        
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          isVerde ? 'bg-emerald-100 text-emerald-800' : isAmarelo ? 'bg-amber-100 text-amber-900' : 'bg-red-100 text-red-900'
                        }`}>
                          {item.pontuacao}%
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-stone-900 mt-2 line-clamp-1 group-hover:text-purple-700 transition">
                        {item.escola.nome}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        INEP: {item.escola.codigoInep} • {item.escola.totalAlunos} alunos
                      </p>
                    </div>

                    {/* Barra de Progresso de Conformidade */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium">
                        <span>Índice Legal:</span>
                        <strong className={isVerde ? 'text-emerald-700' : isAmarelo ? 'text-amber-700' : 'text-red-700'}>
                          {item.classificacao}
                        </strong>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${topBarBg}`}
                          style={{ width: `${item.pontuacao}%` }}
                        />
                      </div>
                    </div>

                    {/* 4 Indicadores Rápidos em Miniatura */}
                    <div className="grid grid-cols-4 gap-1 py-1.5 border-y border-stone-100 text-center">
                      <div title="Cardápio da Semana" className="space-y-0.5">
                        <Utensils className={`w-3.5 h-3.5 mx-auto ${item.itensConformes.cardapio ? 'text-emerald-600' : 'text-red-600'}`} />
                        <span className="text-[8px] font-bold text-stone-500 block">Cardápio</span>
                      </div>
                      <div title="Armazenamento e Despensa" className="space-y-0.5">
                        <Package className={`w-3.5 h-3.5 mx-auto ${item.itensConformes.armazenamento ? 'text-emerald-600' : 'text-red-600'}`} />
                        <span className="text-[8px] font-bold text-stone-500 block">Estoque</span>
                      </div>
                      <div title="Higiene e EPIs" className="space-y-0.5">
                        <Sparkle className={`w-3.5 h-3.5 mx-auto ${item.itensConformes.higiene ? 'text-emerald-600' : 'text-red-600'}`} />
                        <span className="text-[8px] font-bold text-stone-500 block">Higiene</span>
                      </div>
                      <div title="Agricultura Familiar" className="space-y-0.5">
                        <Sprout className={`w-3.5 h-3.5 mx-auto ${item.itensConformes.agriculturaFamiliar ? 'text-emerald-600' : 'text-red-600'}`} />
                        <span className="text-[8px] font-bold text-stone-500 block">Agri. Fam.</span>
                      </div>
                    </div>

                    {/* Vistoria e Responsável */}
                    <div className="text-[11px] text-stone-500 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>
                          {item.ultimaVisita ? `Vistoria: ${formatDate(item.ultimaVisita.dataVisita)}` : 'Sem vistoria recente'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 line-clamp-1">
                        <Users className="w-3 h-3 text-stone-400" />
                        <span>Resp: {item.escola.responsavelMerendaNome.split('(')[0]}</span>
                      </div>
                    </div>

                    {/* Botão de Ação Rápida */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onIniciarChecklistParaEscola(item.escola.id);
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold transition flex items-center justify-center gap-1"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Abrir Checklist</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

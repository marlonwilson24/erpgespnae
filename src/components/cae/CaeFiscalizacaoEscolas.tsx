import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { formatDate } from '../../lib/utils';
import { exportRelatorioVisitasCaePDF } from '../../lib/exportPdf';
import { 
  School, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Download, 
  Search, 
  Calendar, 
  ClipboardCheck, 
  Users, 
  Eye, 
  Check, 
  X, 
  FileCheck, 
  CheckSquare, 
  History, 
  Scale, 
  Sparkles,
  Compass,
  LayoutGrid
} from 'lucide-react';
import { RegistrarVisitaModal } from './RegistrarVisitaModal';
import { CaeChecklistConformidade } from './CaeChecklistConformidade';
import { CaeMapaFiscalizacao } from './CaeMapaFiscalizacao';

export const CaeFiscalizacaoEscolas: React.FC = () => {
  const { municipio, escolas, visitasCae } = usePNAE();
  const [activeTab, setActiveTab] = useState<'MAPA_GRADE' | 'HISTORICO' | 'CHECKLIST'>('MAPA_GRADE');
  const [escolaSelecionadaChecklist, setEscolaSelecionadaChecklist] = useState<string | undefined>(undefined);
  const [showVisitaModal, setShowVisitaModal] = useState(false);
  const [buscaEscola, setBuscaEscola] = useState('');
  const [filtroPendencia, setFiltroPendencia] = useState<string>('TODOS');

  const handleExportVisitas = () => {
    exportRelatorioVisitasCaePDF(visitasCae, municipio);
  };

  const handleAbrirChecklistParaEscola = (escolaId: string) => {
    setEscolaSelecionadaChecklist(escolaId);
    setActiveTab('CHECKLIST');
  };

  const visitasFiltradas = visitasCae.filter(v => {
    const matchEscola = v.escolaNome.toLowerCase().includes(buscaEscola.toLowerCase()) ||
      v.membrosCaePresentes.some(m => m.toLowerCase().includes(buscaEscola.toLowerCase()));
    
    if (filtroPendencia === 'PENDENTES') {
      return matchEscola && v.statusPendencia === 'Em Acompanhamento';
    }
    if (filtroPendencia === 'SEM_PENDENCIAS') {
      return matchEscola && (v.statusPendencia === 'Sem Pendências' || v.statusPendencia === 'Resolvida');
    }
    return matchEscola;
  });

  const totalVisitas = visitasCae.length;
  const escolasUnicasVisitadas = new Set(visitasCae.map(v => v.escolaId)).size;
  const visitasComPendencias = visitasCae.filter(v => v.statusPendencia === 'Em Acompanhamento').length;
  const taxaConformidade = totalVisitas > 0 
    ? ((visitasCae.filter(v => v.cardapioAfixadoEConforme && v.armazenamentoAdequado && v.condicoesHigieneAprovadas).length / totalVisitas) * 100).toFixed(0)
    : 100;

  return (
    <div id="cae-fiscalizacao-escolas" className="space-y-6 animate-in fade-in duration-300">
      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-stone-900">
              Vistorias & Fiscalizações In Loco nas Escolas
            </h2>
            <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
              <School className="w-3.5 h-3.5" />
              {escolasUnicasVisitadas} de {escolas.length} Escolas Inspecionadas
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Acompanhamento presencial do armazenamento, preparo da merenda, higiene das cozinhas e cumprimento da Lei Federal nº 11.947/2009.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-export-visitas-pdf"
            onClick={handleExportVisitas}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>Exportar Relatório Geral</span>
          </button>

          <button
            id="btn-checklist-inloco-tab"
            onClick={() => setActiveTab('CHECKLIST')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition ${
              activeTab === 'CHECKLIST'
                ? 'bg-purple-800 text-white ring-2 ring-purple-400'
                : 'bg-purple-700 hover:bg-purple-800 text-white'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Checklist In Loco (Lei 11.947)</span>
          </button>
        </div>
      </div>

      {/* Tabs Principais da Fiscalização */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('MAPA_GRADE')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'MAPA_GRADE'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Compass className="w-4 h-4 text-purple-200" />
          <span>Mapa & Grade de Conformidade</span>
          <span className="text-[10px] bg-purple-900/60 text-purple-100 px-1.5 py-0.2 rounded-full font-black uppercase">
            Interativo
          </span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORICO')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'HISTORICO'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Histórico de Vistorias & Laudos ({visitasCae.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CHECKLIST')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'CHECKLIST'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Scale className="w-4 h-4 text-purple-300" />
          <span>Checklist In Loco (Lei 11.947)</span>
          <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded-full font-black uppercase">
            In Loco
          </span>
        </button>
      </div>

      {/* Exibição condicional da View */}
      {activeTab === 'MAPA_GRADE' ? (
        <CaeMapaFiscalizacao
          onIniciarChecklistParaEscola={handleAbrirChecklistParaEscola}
          onRegistrarNovaVisita={() => setShowVisitaModal(true)}
        />
      ) : activeTab === 'CHECKLIST' ? (
        <CaeChecklistConformidade
          escolaPreSelecionadaId={escolaSelecionadaChecklist}
          onChecklistSalvo={() => setActiveTab('HISTORICO')}
        />
      ) : (
        <>
          {/* Cards de Métricas de Vistorias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500">Total de Fiscalizações</span>
                <ClipboardCheck className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-stone-900">{totalVisitas}</div>
              <p className="text-[11px] text-stone-500">
                Relatórios com laudo técnico registrado
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500">Escolas Polo Cobertas</span>
                <School className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-stone-900">
                {escolasUnicasVisitadas} / {escolas.length}
              </div>
              <p className="text-[11px] text-indigo-700 font-medium">
                100% da rede municipal monitorada
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500">Índice de Conformidade</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700">{taxaConformidade}%</div>
              <p className="text-[11px] text-stone-500">
                Armazenamento, cardápio e sanitização
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500">Apontamentos em Aberto</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-700">{visitasComPendencias}</div>
              <p className="text-[11px] text-stone-500">
                Encaminhamentos em monitoramento
              </p>
            </div>
          </div>

          {/* Banner Chamando para o Checklist Interativo */}
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-700 text-white rounded-xl">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-purple-950">
                  Novo Instrumento: Checklist de Conformidade da Lei 11.947
                </h4>
                <p className="text-[11px] text-purple-800">
                  Conselheiros fiscais podem preencher e marcar os 16 requisitos legais in loco na cozinha escolar e gerar laudo assinado.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('CHECKLIST')}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shrink-0 transition"
            >
              Abrir Checklist In Loco
            </button>
          </div>

          {/* Barra de Filtros e Busca */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por escola ou conselheiro..."
                value={buscaEscola}
                onChange={(e) => setBuscaEscola(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltroPendencia('TODOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filtroPendencia === 'TODOS'
                    ? 'bg-purple-700 text-white'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                Todas ({visitasCae.length})
              </button>
              <button
                onClick={() => setFiltroPendencia('PENDENTES')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filtroPendencia === 'PENDENTES'
                    ? 'bg-amber-700 text-white'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                Em Acompanhamento ({visitasComPendencias})
              </button>
              <button
                onClick={() => setFiltroPendencia('SEM_PENDENCIAS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filtroPendencia === 'SEM_PENDENCIAS'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                Sem Pendências ({visitasCae.length - visitasComPendencias})
              </button>
            </div>
          </div>

          {/* Lista Detalhada de Vistorias */}
          <div className="space-y-4">
            {visitasFiltradas.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs">
                Nenhuma vistoria encontrada com os filtros selecionados.
              </div>
            ) : (
              visitasFiltradas.map((vis) => {
                const hasPendencia = vis.statusPendencia === 'Em Acompanhamento';

                return (
                  <div 
                    key={vis.id} 
                    className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-purple-200 transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-stone-900">{vis.escolaNome}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            hasPendencia 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {hasPendencia ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            {vis.statusPendencia || 'Sem Pendências'}
                          </span>
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                            Aceitação: {vis.aceitabilidadeAlunos}
                          </span>
                          {vis.pontuacaoConformidade !== undefined && (
                            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                              Conformidade Legal: {vis.pontuacaoConformidade}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>Data da Vistoria: <strong>{formatDate(vis.dataVisita)}</strong></span>
                          {vis.responsavelEscolaNome && (
                            <>
                              <span className="text-stone-300">•</span>
                              <span>Recebido por: {vis.responsavelEscolaNome}</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[11px] text-stone-500 block">Conselheiros Presentes:</span>
                          <p className="text-xs font-semibold text-stone-800">
                            {vis.membrosCaePresentes.join(' • ')}
                          </p>
                        </div>

                        <button
                          onClick={() => handleAbrirChecklistParaEscola(vis.escolaId)}
                          className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition flex items-center gap-1 shrink-0"
                          title="Fazer nova vistoria com checklist nesta escola"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Nova Vistoria</span>
                        </button>
                      </div>
                    </div>

                    {/* Checklists Sanitários e Nutricionais */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        vis.cardapioAfixadoEConforme 
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                          : 'bg-red-50/50 border-red-200 text-red-900'
                      }`}>
                        <div>
                          <span className="font-semibold block">Cardápio da Semana Afixado</span>
                          <span className="text-[10px] text-stone-500">Mural visível para a comunidade</span>
                        </div>
                        {vis.cardapioAfixadoEConforme ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-red-600" />}
                      </div>

                      <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        vis.armazenamentoAdequado 
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                          : 'bg-red-50/50 border-red-200 text-red-900'
                      }`}>
                        <div>
                          <span className="font-semibold block">Armazenamento & Despensa</span>
                          <span className="text-[10px] text-stone-500">Estrados, ventilação e validades</span>
                        </div>
                        {vis.armazenamentoAdequado ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-red-600" />}
                      </div>

                      <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        vis.condicoesHigieneAprovadas 
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                          : 'bg-red-50/50 border-red-200 text-red-900'
                      }`}>
                        <div>
                          <span className="font-semibold block">Higiene & Paramentação</span>
                          <span className="text-[10px] text-stone-500">Uso de toucas, aventais e limpeza</span>
                        </div>
                        {vis.condicoesHigieneAprovadas ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-red-600" />}
                      </div>
                    </div>

                    {/* Relato e Recomendações */}
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                      <div>
                        <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                          Relatório de Observações do Colegiado:
                        </span>
                        <p className="text-stone-800 leading-relaxed mt-0.5">
                          "{vis.relatorioObservacoes}"
                        </p>
                      </div>

                      {vis.recomendacoesEncaminhadas && (
                        <div className="pt-2 border-t border-stone-200/80">
                          <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                            Recomendações e Encaminhamentos ao Gestor:
                          </span>
                          <p className="text-indigo-950 font-medium leading-relaxed mt-0.5">
                            ↳ {vis.recomendacoesEncaminhadas}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {showVisitaModal && (
        <RegistrarVisitaModal onClose={() => setShowVisitaModal(false)} />
      )}
    </div>
  );
};


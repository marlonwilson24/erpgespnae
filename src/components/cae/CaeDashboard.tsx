import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { StatsCard } from '../common/StatsCard';
import { PNAEProgressBar } from '../common/PNAEProgressBar';
import { formatDate, formatCurrency } from '../../lib/utils';
import { exportParecerCaeOficialPDF, exportRelatorioVisitasCaePDF, exportFichaColegiadoCaePDF } from '../../lib/exportPdf';
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  FileText, 
  Plus, 
  Download, 
  ShieldCheck,
  Calendar,
  Users,
  Tractor,
  School,
  MessageSquare,
  LayoutDashboard
} from 'lucide-react';
import { RegistrarVisitaModal } from './RegistrarVisitaModal';
import { EmitirParecerModal } from './EmitirParecerModal';
import { CaeComprasAgricultura } from './CaeComprasAgricultura';
import { CaeFiscalizacaoEscolas } from './CaeFiscalizacaoEscolas';
import { CaeParecerConclusivo } from './CaeParecerConclusivo';
import { CaeColegiadoAtas } from './CaeColegiadoAtas';
import { CaeOuvidoriaSocial } from './CaeOuvidoriaSocial';

interface CaeDashboardProps {
  initialTab?: 'geral' | 'agricultura' | 'vistorias' | 'parecer' | 'colegiado' | 'ouvidoria';
}

export const CaeDashboard: React.FC<CaeDashboardProps> = ({ initialTab = 'geral' }) => {
  const { 
    municipio, 
    prestacaoContas, 
    pareceresCae, 
    visitasCae, 
    membrosCae,
    reunioesCae,
    apontamentosCae,
    escolas 
  } = usePNAE();

  const [activeTab, setActiveTab] = useState<'geral' | 'agricultura' | 'vistorias' | 'parecer' | 'colegiado' | 'ouvidoria'>(initialTab);
  const [showVisitaModal, setShowVisitaModal] = useState(false);
  const [showParecerModal, setShowParecerModal] = useState(false);

  const activeParecer = pareceresCae[0];

  const handleExportVisitas = () => {
    exportRelatorioVisitasCaePDF(visitasCae, municipio);
  };

  const handleExportParecer = () => {
    if (activeParecer) {
      exportParecerCaeOficialPDF(activeParecer, prestacaoContas, municipio);
    }
  };

  const handleExportColegiado = () => {
    exportFichaColegiadoCaePDF(membrosCae, municipio);
  };

  return (
    <div id="cae-main-module" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header do Conselho CAE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-stone-900">
              Conselho de Alimentação Escolar (CAE)
            </h2>
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Controle Social • Lei Federal nº 11.947/2009
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Órgão colegiado fiscalizador da alimentação escolar em <strong>{municipio.nome} - {municipio.uf}</strong> • Mandato 2024-2028
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-export-colegiado-header"
            onClick={handleExportColegiado}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition"
          >
            <Users className="w-4 h-4 text-stone-500" />
            <span>Colegiado (PDF)</span>
          </button>

          <button
            id="btn-export-visitas-header"
            onClick={handleExportVisitas}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>Vistorias (PDF)</span>
          </button>

          <button
            id="btn-registrar-vistoria-header"
            onClick={() => setShowVisitaModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4 text-stone-500" />
            <span>Nova Vistoria</span>
          </button>

          <button
            id="btn-emitir-parecer-header"
            onClick={() => setShowParecerModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Scale className="w-4 h-4" />
            <span>Parecer Conclusivo</span>
          </button>
        </div>
      </div>

      {/* Navegação por Abas do CAE */}
      <div className="flex border-b border-stone-200 gap-2 sm:gap-6 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('geral')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'geral'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('agricultura')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'agricultura'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <Tractor className="w-4 h-4" />
          <span>Compras da AF (Art. 14)</span>
        </button>

        <button
          onClick={() => setActiveTab('vistorias')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'vistorias'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Fiscalização nas Escolas ({visitasCae.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('colegiado')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'colegiado'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Colegiado & Atas ({membrosCae.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('parecer')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'parecer'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Parecer Conclusivo PNAE</span>
        </button>

        <button
          onClick={() => setActiveTab('ouvidoria')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'ouvidoria'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ouvidoria Social ({apontamentosCae.length})</span>
        </button>
      </div>

      {/* Renderização Condicional de Conteúdo */}
      {activeTab === 'agricultura' && <CaeComprasAgricultura />}
      {activeTab === 'vistorias' && <CaeFiscalizacaoEscolas />}
      {activeTab === 'colegiado' && <CaeColegiadoAtas />}
      {activeTab === 'parecer' && <CaeParecerConclusivo />}
      {activeTab === 'ouvidoria' && <CaeOuvidoriaSocial />}

      {activeTab === 'geral' && (
        <div className="space-y-6">
          {/* Barra de Cumprimento Legal dos 30% da Agricultura Familiar */}
          <PNAEProgressBar
            recursoFNDERecebido={prestacaoContas.recursoTotalFNDERecebido}
            gastoAgriculturaFamiliar={prestacaoContas.gastoAgriculturaFamiliar}
            metaLegalPercentual={30}
          />

          {/* Grid de KPIs do CAE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Status da Prestação de Contas"
              value={prestacaoContas.statusAprovacao}
              subtitle={`Exercício ${prestacaoContas.anoExercicio}`}
              icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
              badgeText="Avaliado"
              badgeColor="green"
            />

            <StatsCard
              title="Meta Agricultura Familiar"
              value={`${prestacaoContas.percentualAgriculturaFamiliarAtingido.toFixed(1)}%`}
              subtitle="Mínimo legal exigido: 30%"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              badgeText="Cumprida"
              badgeColor="green"
            />

            <StatsCard
              title="Visitas In Loco Registradas"
              value={visitasCae.length}
              subtitle={`${escolas.length} escolas fiscalizadas`}
              icon={<MapPin className="w-5 h-5 text-purple-600" />}
              badgeText="Em Dia"
              badgeColor="green"
            />

            <StatsCard
              title="Conselheiros & Atas"
              value={`${membrosCae.length} membros`}
              subtitle={`${reunioesCae.length} atas registradas`}
              icon={<Users className="w-5 h-5 text-blue-600" />}
            />
          </div>

          {/* Parecer Conclusivo Vigente */}
          {activeParecer && (
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded font-mono">
                      {activeParecer.numeroAta}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {activeParecer.resultadoParecer}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 mt-1">
                    Parecer do Colegiado sobre a Execução Financeira (SIGPC)
                  </h3>
                </div>

                <button
                  onClick={handleExportParecer}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500" />
                  <span>Baixar Parecer Assinado (PDF)</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-3">
                <p className="text-stone-700 leading-relaxed italic bg-white p-3 rounded-lg border border-stone-100">
                  "{activeParecer.textoParecerConclusivo}"
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-stone-200 text-[11px] text-stone-500">
                  <span>Presidente: <strong>{activeParecer.presidenteCaeNome}</strong></span>
                  <span>Relator(a): <strong>{activeParecer.relatorCaeNome}</strong></span>
                  <span>Data da Sessão: <strong>{formatDate(activeParecer.dataReuniaoAta)}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Relatórios de Visitas In Loco às Cozinhas Escolares */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Últimas Inspeções e Fiscalizações In Loco nas Escolas
                </h3>
                <p className="text-xs text-stone-500">
                  Acompanhamento sanitário, condições de armazenagem e aceitabilidade dos cardápios.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('vistorias')}
                  className="text-xs font-semibold text-indigo-700 hover:underline"
                >
                  Ver todas as vistorias →
                </button>
                <button
                  onClick={() => setShowVisitaModal(true)}
                  className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg hover:bg-indigo-100"
                >
                  + Nova Inspeção
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {visitasCae.slice(0, 3).map(vis => (
                <div key={vis.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{vis.escolaNome}</h4>
                      <p className="text-[11px] text-stone-500">
                        Data da Visita: {formatDate(vis.dataVisita)} • Conselheiros: {vis.membrosCaePresentes.join(', ')}
                      </p>
                    </div>

                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Aceitabilidade: {vis.aceitabilidadeAlunos}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-stone-200">
                      <span className="text-stone-400 block text-[10px]">Cardápio Afixado:</span>
                      <strong>{vis.cardapioAfixadoEConforme ? 'Conforme ✓' : 'Inconforme ✗'}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-stone-200">
                      <span className="text-stone-400 block text-[10px]">Armazenamento:</span>
                      <strong>{vis.armazenamentoAdequado ? 'Adequado ✓' : 'Inadequado ✗'}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-stone-200">
                      <span className="text-stone-400 block text-[10px]">Higiene & EPIs:</span>
                      <strong>{vis.condicoesHigieneAprovadas ? 'Aprovado ✓' : 'Reprovado ✗'}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 italic">
                    "{vis.relatorioObservacoes}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modais */}
      {showVisitaModal && (
        <RegistrarVisitaModal onClose={() => setShowVisitaModal(false)} />
      )}

      {showParecerModal && (
        <EmitirParecerModal onClose={() => setShowParecerModal(false)} />
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { formatDate, formatCurrency } from '../../lib/utils';
import { exportParecerCaeOficialPDF } from '../../lib/exportPdf';
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  FileText, 
  ShieldCheck, 
  Calendar, 
  UserCheck, 
  Award,
  Check,
  Building2,
  FileCheck,
  Plus
} from 'lucide-react';
import { EmitirParecerModal } from './EmitirParecerModal';

export const CaeParecerConclusivo: React.FC = () => {
  const { municipio, prestacaoContas, pareceresCae, visitasCae, cardapios } = usePNAE();
  const [showParecerModal, setShowParecerModal] = useState(false);

  const activeParecer = pareceresCae[0];

  const handleExportParecer = (parecer = activeParecer) => {
    if (parecer) {
      exportParecerCaeOficialPDF(parecer, prestacaoContas, municipio);
    }
  };

  const metaAFCumprida = prestacaoContas.percentualAgriculturaFamiliarAtingido >= 30;
  const vistoriasRealizadas = visitasCae.length > 0;
  const cardapiosAprovados = cardapios.some(c => ['Aprovado Nutricionista', 'Homologado CAE', 'Em Execução'].includes(c.status));
  const prestacaoPreenchida = prestacaoContas.recursoTotalFNDERecebido > 0;

  const todosRequisitosAtendidos = metaAFCumprida && vistoriasRealizadas && cardapiosAprovados && prestacaoPreenchida;

  return (
    <div id="cae-parecer-conclusivo" className="space-y-6 animate-in fade-in duration-300">
      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">
              Parecer Conclusivo do Conselho de Alimentação Escolar (CAE)
            </h2>
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              Art. 19 da Lei nº 11.947/2009
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Homologação do relatório de gestão e prestação de contas anual do PNAE para submissão ao FNDE / SIOPE / SIGECON.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeParecer && (
            <button
              id="btn-baixar-parecer-pdf"
              onClick={() => handleExportParecer(activeParecer)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-4 h-4 text-stone-500" />
              <span>Baixar Parecer Vigente (PDF)</span>
            </button>
          )}

          <button
            id="btn-emitir-novo-parecer"
            onClick={() => setShowParecerModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir / Atualizar Parecer Oficial</span>
          </button>
        </div>
      </div>

      {/* Checklist de Conformidade Prévia do Colegiado */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-stone-900">
              Checklist de Requisitos Obrigatórios para Emissão do Parecer
            </h3>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
            todosRequisitosAtendidos ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {todosRequisitosAtendidos ? 'Todos os critérios atendidos' : 'Atenção aos apontamentos'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className={`p-4 rounded-xl border ${
            metaAFCumprida ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-stone-900">1. Mínimo 30% da AF</span>
              {metaAFCumprida ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
            </div>
            <p className="text-[11px] text-stone-600">
              Atingido <strong>{prestacaoContas.percentualAgriculturaFamiliarAtingido.toFixed(1)}%</strong> com recursos FNDE.
            </p>
          </div>

          <div className={`p-4 rounded-xl border ${
            vistoriasRealizadas ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-stone-900">2. Fiscalizações In Loco</span>
              {vistoriasRealizadas ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
            </div>
            <p className="text-[11px] text-stone-600">
              <strong>{visitasCae.length}</strong> relatórios de vistoria registrados em atas.
            </p>
          </div>

          <div className={`p-4 rounded-xl border ${
            cardapiosAprovados ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-stone-900">3. Cardápios da Nutricionista</span>
              {cardapiosAprovados ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
            </div>
            <p className="text-[11px] text-stone-600">
              Cardápios técnicos homologados pela RT do município.
            </p>
          </div>

          <div className={`p-4 rounded-xl border ${
            prestacaoPreenchida ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-stone-900">4. Execução Financeira</span>
              {prestacaoPreenchida ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
            </div>
            <p className="text-[11px] text-stone-600">
              Total FNDE: {formatCurrency(prestacaoContas.recursoTotalFNDERecebido)}.
            </p>
          </div>
        </div>
      </div>

      {/* Exibição do Parecer Conclusivo Vigente */}
      {activeParecer ? (
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded font-mono">
                  {activeParecer.numeroAta}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                  activeParecer.resultadoParecer === 'Favorável sem Ressalvas'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : activeParecer.resultadoParecer === 'Favorável com Ressalvas'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  {activeParecer.resultadoParecer}
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900 mt-1">
                Laudo Deliberativo do Colegiado sobre a Gestão dos Recursos PNAE
              </h3>
            </div>

            <button
              onClick={() => handleExportParecer(activeParecer)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Gerar PDF Oficial Assinado</span>
            </button>
          </div>

          <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-4">
            <div>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Texto do Parecer Conclusivo Registrado em Livro Ata:
              </span>
              <p className="text-stone-800 leading-relaxed italic bg-white p-4 rounded-xl border border-stone-200 shadow-xs text-sm">
                "{activeParecer.textoParecerConclusivo}"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-white rounded-lg border border-stone-200">
                <span className="text-stone-400 block text-[10px]">Presidente do Conselho:</span>
                <strong className="text-stone-900 text-xs">{activeParecer.presidenteCaeNome}</strong>
              </div>
              <div className="p-3 bg-white rounded-lg border border-stone-200">
                <span className="text-stone-400 block text-[10px]">Relator(a) do Parecer:</span>
                <strong className="text-stone-900 text-xs">{activeParecer.relatorCaeNome}</strong>
              </div>
              <div className="p-3 bg-white rounded-lg border border-stone-200">
                <span className="text-stone-400 block text-[10px]">Data da Reunião Ordinária:</span>
                <strong className="text-stone-900 text-xs">{formatDate(activeParecer.dataReuniaoAta)}</strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs space-y-3">
          <p>Nenhum parecer conclusivo registrado para o exercício atual.</p>
          <button
            onClick={() => setShowParecerModal(true)}
            className="px-4 py-2 bg-indigo-700 text-white font-semibold rounded-xl text-xs"
          >
            Emitir Primeiro Parecer
          </button>
        </div>
      )}

      {/* Histórico de Pareceres Anteriores */}
      {pareceresCae.length > 1 && (
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900">
            Histórico de Pareceres Emitidos
          </h3>

          <div className="space-y-3">
            {pareceresCae.slice(1).map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-stone-900">{p.numeroAta}</span>
                  <span className="text-stone-500 ml-2">({formatDate(p.dataReuniaoAta)})</span>
                  <p className="text-[11px] text-stone-600 mt-0.5">{p.resultadoParecer}</p>
                </div>

                <button
                  onClick={() => handleExportParecer(p)}
                  className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold hover:bg-stone-100 transition inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showParecerModal && (
        <EmitirParecerModal onClose={() => setShowParecerModal(false)} />
      )}
    </div>
  );
};

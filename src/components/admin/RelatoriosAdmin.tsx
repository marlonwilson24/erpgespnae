import React from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { 
  exportRelatorioAdminPDF, 
  exportRelatorioEscolasPDF, 
  exportRelatorioContratosAFPDF, 
  exportRelatorioEntregasPDF 
} from '../../lib/exportPdf';
import { ClipboardList, Download, School, Tractor, Truck, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export const RelatoriosAdmin: React.FC = () => {
  const { escolas, entregas, contratos, prestacaoContas, municipio } = usePNAE();

  const handleExportConsolidado = () => {
    exportRelatorioAdminPDF(escolas, contratos, entregas, prestacaoContas, municipio);
  };

  const handleExportEscolas = () => {
    exportRelatorioEscolasPDF(escolas, municipio);
  };

  const handleExportContratos = () => {
    exportRelatorioContratosAFPDF(contratos, municipio);
  };

  const handleExportEntregas = () => {
    exportRelatorioEntregasPDF(entregas, municipio);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            Relatórios e Demonstrativos Gerenciais PNAE
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Relatórios por escola, acompanhamento de contratos de agricultores e histórico de entregas.
          </p>
        </div>

        <button
          onClick={handleExportConsolidado}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório Consolidado Geral (PDF)</span>
        </button>
      </div>

      {/* Relatório 1: Distribuição de Alunos e Demanda por Escola */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-stone-900">
              Relatório de Atendimento e Matrículas por Unidade Escolar
            </h3>
          </div>

          <button
            onClick={handleExportEscolas}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Exportar Escolas (PDF)</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] font-semibold border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-3">Escola</th>
                <th className="py-2.5 px-3">INEP</th>
                <th className="py-2.5 px-3">Atendimento</th>
                <th className="py-2.5 px-3">Alunos Atendidos</th>
                <th className="py-2.5 px-3">% da Rede</th>
                <th className="py-2.5 px-3">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {escolas.map(esc => {
                const percentRede = (esc.totalAlunos / municipio.totalAlunosPNAE) * 100;
                return (
                  <tr key={esc.id} className="hover:bg-stone-50/50">
                    <td className="py-2.5 px-3 font-semibold text-stone-900">{esc.nome}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500">{esc.codigoInep}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        esc.tipoAtendimento === 'Integral' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {esc.tipoAtendimento}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-stone-800">{esc.totalAlunos} alunos</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-700">{percentRede.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-stone-600">{esc.diretorNome}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relatório 2: Fornecedores e Contratos Vigentes */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tractor className="w-4 h-4 text-amber-700" />
            <h3 className="text-sm font-bold text-stone-900">
              Contratos Vigentes da Agricultura Familiar e Teto Anual (R$ 40 mil/ano)
            </h3>
          </div>

          <button
            onClick={handleExportContratos}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Exportar Contratos AF (PDF)</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] font-semibold border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-3">Nº Contrato</th>
                <th className="py-2.5 px-3">Produtor / Associação</th>
                <th className="py-2.5 px-3">DAP / CAF</th>
                <th className="py-2.5 px-3">Valor Contratado</th>
                <th className="py-2.5 px-3">Vigência</th>
                <th className="py-2.5 px-3">Teto DAP (R$ 40k)</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {contratos.map(c => (
                <tr key={c.id} className="hover:bg-stone-50/50">
                  <td className="py-2.5 px-3 font-bold text-stone-900">{c.numeroContrato}</td>
                  <td className="py-2.5 px-3 font-semibold">{c.fornecedorNome}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500">{c.fornecedorDapCaf}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-700">{formatCurrency(c.valorTotalContrato)}</td>
                  <td className="py-2.5 px-3 text-stone-500">{formatDate(c.dataInicio)} até {formatDate(c.dataFim)}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      Regular ({(c.valorTotalContrato / 40000 * 100).toFixed(0)}%)
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relatório 3: Histórico de Entregas e Conferências */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-bold text-stone-900">
              Registro Histórico de Entregas Realizadas nas Escolas
            </h3>
          </div>

          <button
            onClick={handleExportEntregas}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Exportar Histórico Entregas (PDF)</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] font-semibold border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Nº AF</th>
                <th className="py-2.5 px-3">Escola</th>
                <th className="py-2.5 px-3">Fornecedor</th>
                <th className="py-2.5 px-3">Conferência</th>
                <th className="py-2.5 px-3">Qualidade</th>
                <th className="py-2.5 px-3">Recebedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {entregas.map(ent => (
                <tr key={ent.id} className="hover:bg-stone-50/50">
                  <td className="py-2.5 px-3 text-stone-500">{formatDate(ent.dataEntrega)}</td>
                  <td className="py-2.5 px-3 font-bold text-stone-900">{ent.numeroAF}</td>
                  <td className="py-2.5 px-3 font-medium">{ent.escolaNome}</td>
                  <td className="py-2.5 px-3">{ent.fornecedorNome}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      {ent.statusConferencia}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-stone-800">{ent.parecerQualidade}</td>
                  <td className="py-2.5 px-3 text-stone-600">{ent.responsavelRecebimentoNome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

import React from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { exportPrestacaoContasPDF } from '../../lib/exportPdf';
import { PNAEProgressBar } from '../common/PNAEProgressBar';
import { 
  FileCheck, 
  Download, 
  CheckCircle2, 
  Scale, 
  AlertTriangle, 
  Building2,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';

export const PrestacaoContasAdmin: React.FC = () => {
  const { prestacaoContas, municipio, pareceresCae } = usePNAE();
  const parecerAtual = pareceresCae[0];

  const handleExportPDF = () => {
    exportPrestacaoContasPDF(prestacaoContas, municipio, parecerAtual);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            Demonstrativo de Prestação de Contas PNAE
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Relatório de Execução Físico-Financeira SIGPC / FNDE • Exercício {prestacaoContas.anoExercicio}
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Gerar e Baixar Relatório Oficial (PDF)</span>
        </button>
      </div>

      {/* Barra de Cumprimento Legal */}
      <PNAEProgressBar
        recursoFNDERecebido={prestacaoContas.recursoTotalFNDERecebido}
        gastoAgriculturaFamiliar={prestacaoContas.gastoAgriculturaFamiliar}
        metaLegalPercentual={30}
      />

      {/* Balanço Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase">Receita FNDE Transferida</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-stone-900 mt-2">
            {formatCurrency(prestacaoContas.recursoTotalFNDERecebido)}
          </p>
          <p className="text-xs text-stone-500 mt-1">Conta Corrente Vinculada PNAE</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase">Gasto em Agricultura Familiar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatCurrency(prestacaoContas.gastoAgriculturaFamiliar)}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            {prestacaoContas.percentualAgriculturaFamiliarAtingido.toFixed(2)}% do FNDE (Meta: &gt;= 30%)
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase">Saldo Remanescente</span>
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-stone-900 mt-2">
            {formatCurrency(prestacaoContas.saldoContabilRemanescente)}
          </p>
          <p className="text-xs text-stone-500 mt-1">Superávit a ser reprogramado</p>
        </div>
      </div>

      {/* Tabela Detalhada de Rubricas */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900">
          Detalhamento da Execução Financeira (PNAE / FNDE)
        </h3>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Rubrica / Demonstrativo</th>
                <th className="py-3 px-4">Base Legal</th>
                <th className="py-3 px-4">Valor Executado</th>
                <th className="py-3 px-4">% Aplicado</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              <tr>
                <td className="py-3 px-4 font-semibold text-stone-900">Repasse Total Federal FNDE</td>
                <td className="py-3 px-4 text-stone-500">Resolução CD/FNDE nº 06/2020</td>
                <td className="py-3 px-4 font-bold">{formatCurrency(prestacaoContas.recursoTotalFNDERecebido)}</td>
                <td className="py-3 px-4">100,00%</td>
                <td className="py-3 px-4 text-right">
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                    Creditado
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-emerald-900">Aquisição da Agricultura Familiar</td>
                <td className="py-3 px-4 text-stone-500">Art. 14 da Lei Federal nº 11.947/2009</td>
                <td className="py-3 px-4 font-bold text-emerald-700">{formatCurrency(prestacaoContas.gastoAgriculturaFamiliar)}</td>
                <td className="py-3 px-4 font-bold text-emerald-700">{prestacaoContas.percentualAgriculturaFamiliarAtingido.toFixed(2)}%</td>
                <td className="py-3 px-4 text-right">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    Cumprido ✓
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-stone-900">Gêneros Não Exclusivos (Outros Fornecedores)</td>
                <td className="py-3 px-4 text-stone-500">Processo Licitatório Municipal</td>
                <td className="py-3 px-4 font-bold">{formatCurrency(prestacaoContas.gastoTotalAlimentacao - prestacaoContas.gastoAgriculturaFamiliar)}</td>
                <td className="py-3 px-4">{((prestacaoContas.gastoTotalAlimentacao - prestacaoContas.gastoAgriculturaFamiliar) / prestacaoContas.recursoTotalFNDERecebido * 100).toFixed(2)}%</td>
                <td className="py-3 px-4 text-right">
                  <span className="text-[10px] bg-stone-100 text-stone-700 font-medium px-2 py-0.5 rounded">
                    Regular
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-stone-900">Contrapartida Municipal Própria</td>
                <td className="py-3 px-4 text-stone-500">Recurso do Tesouro Municipal</td>
                <td className="py-3 px-4 font-bold">{formatCurrency(prestacaoContas.contrapartidaMunicipalGasta)}</td>
                <td className="py-3 px-4">--</td>
                <td className="py-3 px-4 text-right">
                  <span className="text-[10px] bg-stone-100 text-stone-700 font-medium px-2 py-0.5 rounded">
                    Aplicado
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Seção Parecer do CAE */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-700" />
            <h3 className="text-sm font-bold text-stone-900">
              Parecer Conclusivo do Conselho de Alimentação Escolar (CAE)
            </h3>
          </div>
          <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold">
            {prestacaoContas.statusAprovacao}
          </span>
        </div>

        {parecerAtual ? (
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-bold text-stone-900">{parecerAtual.numeroAta}</span>
              <span className="text-stone-500">Data de Registro: {formatDate(parecerAtual.dataReuniaoAta)}</span>
            </div>

            <p className="text-stone-700 leading-relaxed italic bg-white p-3 rounded-lg border border-stone-100">
              "{parecerAtual.textoParecerConclusivo}"
            </p>

            <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-stone-500">
              <span>Presidente CAE: <strong>{parecerAtual.presidenteCaeNome}</strong></span>
              <span>Relator(a): <strong>{parecerAtual.relatorCaeNome}</strong></span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-stone-500">Nenhum parecer emitido ainda para o presente exercício.</p>
        )}
      </div>

    </div>
  );
};

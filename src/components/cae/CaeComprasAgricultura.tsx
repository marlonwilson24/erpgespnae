import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { PNAEProgressBar } from '../common/PNAEProgressBar';
import { exportPrestacaoContasPDF } from '../../lib/exportPdf';
import { 
  Tractor, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Download, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  DollarSign,
  UserCheck,
  Building2,
  Calendar
} from 'lucide-react';

export const CaeComprasAgricultura: React.FC = () => {
  const { 
    municipio, 
    prestacaoContas, 
    contratos, 
    chamadasPublicas, 
    autorizacoesFornecimento,
    entregas 
  } = usePNAE();

  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'AGRICULTURA_FAMILIAR' | 'CONVENCIONAL'>('TODOS');

  const metaLegalPercentual = 30;
  const atingidoPercentual = prestacaoContas.percentualAgriculturaFamiliarAtingido;
  const metaCumprida = atingidoPercentual >= metaLegalPercentual;

  // Filtrar contratos
  const contratosFiltrados = contratos.filter(c => {
    if (filtroTipo === 'AGRICULTURA_FAMILIAR') return c.tipoFornecedor === 'AGRICULTURA_FAMILIAR';
    if (filtroTipo === 'CONVENCIONAL') return c.tipoFornecedor === 'EMPRESA_CONVENCIONAL';
    return true;
  });

  const totalContratadoAF = contratos
    .filter(c => c.tipoFornecedor === 'AGRICULTURA_FAMILIAR')
    .reduce((acc, c) => acc + c.valorTotalContrato, 0);

  const totalExecutadoAF = contratos
    .filter(c => c.tipoFornecedor === 'AGRICULTURA_FAMILIAR')
    .reduce((acc, c) => acc + c.valorExecutado, 0);

  const produtoresUnicosAF = new Set(
    contratos.filter(c => c.tipoFornecedor === 'AGRICULTURA_FAMILIAR').map(c => c.fornecedorNome)
  ).size;

  const handleExportRelatorio = () => {
    exportPrestacaoContasPDF(prestacaoContas, municipio, contratos);
  };

  return (
    <div id="cae-compras-agricultura" className="space-y-6 animate-in fade-in duration-300">
      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">
              Fiscalização de Compras da Agricultura Familiar
            </h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
              metaCumprida ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {metaCumprida ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {metaCumprida ? 'Meta de 30% Cumprida' : 'Meta Pendente'}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Auditoria de conformidade com o <strong>Art. 14 da Lei Federal nº 11.947/2009</strong> e Resolução CD/FNDE nº 06/2020.
          </p>
        </div>

        <button
          id="btn-export-relatorio-af"
          onClick={handleExportRelatorio}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório Fiscal da AF (PDF)</span>
        </button>
      </div>

      {/* Barra de Progresso e Diagnóstico */}
      <PNAEProgressBar
        recursoFNDERecebido={prestacaoContas.recursoTotalFNDERecebido}
        gastoAgriculturaFamiliar={prestacaoContas.gastoAgriculturaFamiliar}
        metaLegalPercentual={metaLegalPercentual}
      />

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Índice Atingido (FNDE)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            {atingidoPercentual.toFixed(1)}%
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            +{(atingidoPercentual - metaLegalPercentual).toFixed(1)}% acima do piso legal obrigatório
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Valor Executado (AF)</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            {formatCurrency(prestacaoContas.gastoAgriculturaFamiliar)}
          </div>
          <p className="text-[11px] text-stone-500">
            Total contratado: {formatCurrency(totalContratadoAF)}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Produtores & Cooperativas</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            {produtoresUnicosAF}
          </div>
          <p className="text-[11px] text-stone-500">
            Com CAF/DAP ativa no município
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Chamadas Públicas</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            {chamadasPublicas.length}
          </div>
          <p className="text-[11px] text-stone-500">
            Editais de compra direta simplificada
          </p>
        </div>
      </div>

      {/* Quadro Demonstrativo Legal: Artigo 14 da Lei 11.947/2009 */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-stone-50 border border-indigo-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-indigo-700" />
          <span>Parecer Técnico do Colegiado sobre a Aquisição da Agricultura Familiar</span>
        </div>
        <p className="text-xs text-stone-700 leading-relaxed">
          Em observância ao <strong>Artigo 14 da Lei nº 11.947/2009</strong>, o Conselho de Alimentação Escolar atesta que 
          do total de <strong>{formatCurrency(prestacaoContas.recursoTotalFNDERecebido)}</strong> repassado pelo FNDE/PNAE no exercício 
          de {prestacaoContas.anoExercicio}, o montante de <strong>{formatCurrency(prestacaoContas.gastoAgriculturaFamiliar)}</strong> foi 
          destinado à aquisição direta de gêneros alimentícios produzidos pela agricultura familiar e empreendedores familiares rurais, 
          atingindo a marca de <strong>{atingidoPercentual.toFixed(2)}%</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs">
            <span className="text-stone-500 block text-[11px]">Critério de Priorização:</span>
            <strong className="text-stone-900">Assentamentos de Reforma Agrária, Comunidades Tradicionais e Quilombolas</strong>
          </div>
          <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs">
            <span className="text-stone-500 block text-[11px]">Limite Individual por DAP/CAF:</span>
            <strong className="text-stone-900">Até R$ 40.000,00 por Declaração/Ano</strong>
          </div>
          <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs">
            <span className="text-stone-500 block text-[11px]">Qualidade & Orgânicos:</span>
            <strong className="text-stone-900">Prioridade a alimentos in natura e sem agrotóxicos</strong>
          </div>
        </div>
      </div>

      {/* Tabela de Contratos Vigentes Auditados */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Contratos Fornecedores Auditados pelo CAE
            </h3>
            <p className="text-xs text-stone-500">
              Controle de empenhos, termos de recebimento e notas fiscais de agricultores familiares e cooperativas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltroTipo('TODOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroTipo === 'TODOS'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              Todos ({contratos.length})
            </button>
            <button
              onClick={() => setFiltroTipo('AGRICULTURA_FAMILIAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroTipo === 'AGRICULTURA_FAMILIAR'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              Agricultura Familiar ({contratos.filter(c => c.tipoFornecedor === 'AGRICULTURA_FAMILIAR').length})
            </button>
            <button
              onClick={() => setFiltroTipo('CONVENCIONAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroTipo === 'CONVENCIONAL'
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              Convencional ({contratos.filter(c => c.tipoFornecedor === 'EMPRESA_CONVENCIONAL').length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Nº Contrato</th>
                <th className="py-3 px-4">Fornecedor / Cooperativa</th>
                <th className="py-3 px-4">Tipo & Documento</th>
                <th className="py-3 px-4">Chamada Pública</th>
                <th className="py-3 px-4">Vigência</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-right">Valor Executado</th>
                <th className="py-3 px-4 text-center">Status Legal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {contratosFiltrados.map((contrato) => {
                const isAF = contrato.tipoFornecedor === 'AGRICULTURA_FAMILIAR';
                const percentExec = contrato.valorTotalContrato > 0 
                  ? ((contrato.valorExecutado / contrato.valorTotalContrato) * 100).toFixed(0) 
                  : '0';

                return (
                  <tr key={contrato.id} className="hover:bg-stone-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {contrato.numeroContrato}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-900">
                      {contrato.fornecedorNome}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isAF ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-800'
                      }`}>
                        {isAF ? <Tractor className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                        {isAF ? 'Agricultura Familiar' : 'Convencional'}
                      </span>
                      <span className="block text-[10px] text-stone-400 font-mono mt-0.5">
                        {contrato.fornecedorDocumento}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-mono">
                      {contrato.chamadaPublicaNumero || 'Edital PNAE'}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      {formatDate(contrato.dataInicio)} até {formatDate(contrato.dataFim)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-stone-900">
                      {formatCurrency(contrato.valorTotalContrato)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-stone-900 block">
                        {formatCurrency(contrato.valorExecutado)}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {percentExec}% entregue
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Auditado
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

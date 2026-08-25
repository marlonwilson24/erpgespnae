import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { formatCurrency } from '../../lib/utils';
import { exportProjecaoComprasPDF } from '../../lib/exportPdf';
import { Calculator, Download, ShoppingCart, Tractor, Sparkles, ArrowRight } from 'lucide-react';

export const ProjecaoCompras: React.FC = () => {
  const { cardapios, alimentos, municipio, setActiveTab } = usePNAE();
  
  const [totalAlunos, setTotalAlunos] = useState(municipio.totalAlunosPNAE || 4250);
  const [diasLetivosMes, setDiasLetivosMes] = useState(20);
  const [selectedCardapioId, setSelectedCardapioId] = useState(cardapios[0]?.id || '');

  const activeCardapio = cardapios.find(c => c.id === selectedCardapioId) || cardapios[0];

  // Cálculo da Projeção Agregada por Alimento
  const consolidadoAlimentos: {
    alimentoId: string;
    nome: string;
    unidade: string;
    perCapitaTotalSemanaG: number;
    quantidadeMensalKg: number;
    precoUnitario: number;
    custoTotal: number;
    ehAgriFamiliar: boolean;
  }[] = [];

  if (activeCardapio) {
    const mapaAlimentos = new Map<string, { totalG: number; ehAF: boolean }>();

    activeCardapio.refeicoes.forEach(ref => {
      ref.itens.forEach(item => {
        const atual = mapaAlimentos.get(item.alimentoId) || { totalG: 0, ehAF: item.ehAgriculturaFamiliar };
        mapaAlimentos.set(item.alimentoId, {
          totalG: atual.totalG + item.perCapitaBrutoG,
          ehAF: item.ehAgriculturaFamiliar,
        });
      });
    });

    mapaAlimentos.forEach((dados, alimId) => {
      const alimObj = alimentos.find(a => a.id === alimId);
      const nome = alimObj?.nome || 'Alimento';
      const precoUnitario = alimObj?.precoReferenciaMedio || 5.0;
      const unidade = alimObj?.unidadeMedida || 'kg';

      // Fórmula PNAE: (Per capita em gramas / 1000) * Total de Alunos * (Dias Letivos do Mês / 5 semanas)
      // Como o totalG é da semana (5 dias), multiplicamos por (diasLetivosMes / 5)
      const quantidadeMensalKg = Math.round((dados.totalG / 1000) * totalAlunos * (diasLetivosMes / 5));
      const custoTotal = quantidadeMensalKg * precoUnitario;

      consolidadoAlimentos.push({
        alimentoId: alimId,
        nome,
        unidade,
        perCapitaTotalSemanaG: dados.totalG,
        quantidadeMensalKg,
        precoUnitario,
        custoTotal,
        ehAgriFamiliar: dados.ehAF,
      });
    });
  }

  const custoTotalMensal = consolidadoAlimentos.reduce((acc, item) => acc + item.custoTotal, 0);
  const custoAgriFamiliar = consolidadoAlimentos
    .filter(i => i.ehAgriFamiliar)
    .reduce((acc, item) => acc + item.custoTotal, 0);
  const percentualAgriFamiliar = custoTotalMensal > 0 ? (custoAgriFamiliar / custoTotalMensal) * 100 : 0;

  const handleExportPDF = () => {
    if (activeCardapio) {
      exportProjecaoComprasPDF(
        activeCardapio,
        totalAlunos,
        diasLetivosMes,
        consolidadoAlimentos,
        municipio
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            Projeção Automática de Compras e Demanda PNAE
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Cálculo automatizado: <strong>Nº Alunos × Per Capita Bruto × Dias Letivos</strong> = Demanda Total para Chamada Pública e Pregão.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>Exportar Projeção (PDF)</span>
          </button>

          <button
            onClick={() => setActiveTab('chamadas-publicas')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Tractor className="w-4 h-4" />
            <span>Lançar em Chamada Pública →</span>
          </button>
        </div>
      </div>

      {/* Painel de Parâmetros de Simulação */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
          Parâmetros do Cálculo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700">Cardápio Base</label>
            <select
              value={selectedCardapioId}
              onChange={e => setSelectedCardapioId(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
            >
              {cardapios.map(c => (
                <option key={c.id} value={c.id}>
                  {c.titulo} ({c.etapaEnsino})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700">Total de Alunos Beneficiários</label>
            <input
              type="number"
              value={totalAlunos}
              onChange={e => setTotalAlunos(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700">Dias Letivos do Mês</label>
            <input
              type="number"
              value={diasLetivosMes}
              onChange={e => setDiasLetivosMes(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-800"
            />
          </div>
        </div>
      </div>

      {/* Cards de Resumo da Projeção */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase">Custo Total Projetado (Mês)</span>
          <p className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(custoTotalMensal)}</p>
          <p className="text-xs text-stone-500 mt-1">Para suprir {totalAlunos} alunos em {diasLetivosMes} dias</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase">Reserva para Agricultura Familiar</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(custoAgriFamiliar)}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            {percentualAgriFamiliar.toFixed(1)}% do valor projetado (Meta Legal &gt;= 30%)
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase">Total de Itens da Lista</span>
          <p className="text-2xl font-bold text-blue-700 mt-1">{consolidadoAlimentos.length} gêneros</p>
          <p className="text-xs text-stone-500 mt-1">Gêneros frescos e não-perecíveis</p>
        </div>
      </div>

      {/* Tabela de Gêneros e Quantitativos Projetados */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900">
            Lista de Compras Consolidada (Demanda Mensal)
          </h3>
          <span className="text-xs text-stone-500 font-mono">
            {totalAlunos} alunos × {diasLetivosMes} dias letivos
          </span>
        </div>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] font-semibold border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-3">Gênero Alimentício</th>
                <th className="py-2.5 px-3">Per Capita Semanal</th>
                <th className="py-2.5 px-3">Demanda Mensal Projetada</th>
                <th className="py-2.5 px-3">Preço Ref. Unitário</th>
                <th className="py-2.5 px-3">Custo Total Projetado</th>
                <th className="py-2.5 px-3 text-right">Origem Prioritária</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {consolidadoAlimentos.map((item, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50">
                  <td className="py-3 px-3 font-semibold text-stone-900">{item.nome}</td>
                  <td className="py-3 px-3 font-mono text-stone-600">{item.perCapitaTotalSemanaG}g / aluno</td>
                  <td className="py-3 px-3 font-bold text-stone-900">
                    {item.quantidadeMensalKg.toLocaleString('pt-BR')} {item.unidade}
                  </td>
                  <td className="py-3 px-3">{formatCurrency(item.precoUnitario)}</td>
                  <td className="py-3 px-3 font-bold text-emerald-700">{formatCurrency(item.custoTotal)}</td>
                  <td className="py-3 px-3 text-right">
                    {item.ehAgriFamiliar ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        Chamada Pública AF
                      </span>
                    ) : (
                      <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                        Lote Geral / Pregão
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

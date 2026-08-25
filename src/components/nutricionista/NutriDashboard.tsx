import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { StatsCard } from '../common/StatsCard';
import { formatCurrency } from '../../lib/utils';
import { exportCardapioPDF } from '../../lib/exportPdf';
import { 
  Utensils, 
  Apple, 
  Carrot, 
  Calculator, 
  Download, 
  Plus, 
  CheckCircle2, 
  HeartPulse,
  Flame,
  Wheat,
  Scale
} from 'lucide-react';
import { NovoCardapioModal } from './NovoCardapioModal';

export const NutriDashboard: React.FC = () => {
  const { cardapios, alimentos, municipio, setActiveTab } = usePNAE();
  const [showNovoCardapioModal, setShowNovoCardapioModal] = useState(false);
  const cardapioAtivo = cardapios[0];

  const handleExportPDF = () => {
    if (cardapioAtivo) {
      exportCardapioPDF(cardapioAtivo, municipio);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">
              Painel da Nutricionista Responsável Técnica (RT)
            </h2>
            <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold">
              CRN-2 / 14892
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Elaboração e planejamento de cardápios balanceados, cálculo de per capita e projeção de compras para o PNAE.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowNovoCardapioModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cardápio</span>
          </button>
        </div>
      </div>

      {/* KPIs Nutricionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Cardápios Homologados"
          value={cardapios.length}
          subtitle="Atende 4.250 alunos"
          icon={<Utensils className="w-5 h-5 text-teal-600" />}
          badgeText="Ativos"
          badgeColor="green"
          onClick={() => setActiveTab('cardapios')}
        />

        <StatsCard
          title="% Agricultura Familiar"
          value={`${cardapioAtivo?.percentualAgriFamiliarEstimado || 48.5}%`}
          subtitle="Nos cardápios vigentes"
          icon={<Carrot className="w-5 h-5 text-emerald-600" />}
          badgeText="Meta FNDE >= 30%"
          badgeColor="green"
        />

        <StatsCard
          title="Catálogo de Alimentos"
          value={alimentos.length}
          subtitle="Tabela TACO/IBGE cadastrada"
          icon={<Apple className="w-5 h-5 text-amber-600" />}
          onClick={() => setActiveTab('alimentos')}
        />

        <StatsCard
          title="Projeção Automática"
          value="Calculada"
          subtitle="Gera lista de compras por lote"
          icon={<Calculator className="w-5 h-5 text-blue-600" />}
          badgeText="Pronto para Edital"
          badgeColor="blue"
          onClick={() => setActiveTab('projecao-compras')}
        />
      </div>

      {/* Cardápio em Execução - Visualização Semanal Detalhada */}
      {cardapioAtivo && (
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {cardapioAtivo.status}
                </span>
                <span className="text-xs font-semibold text-stone-500">
                  Etapa: {cardapioAtivo.etapaEnsino}
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900 mt-1">
                {cardapioAtivo.titulo}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Nutricionista RT: {cardapioAtivo.nutricionistaNome} ({cardapioAtivo.nutricionistaCrn})
              </p>
            </div>

            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Baixar Cardápio Oficial (PDF)</span>
            </button>
          </div>

          {/* Matriz Semanal de Refeições (Segunda a Sexta) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {cardapioAtivo.refeicoes.map((ref, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <span className="text-xs font-bold text-emerald-900">{ref.diaSemana}</span>
                    <span className="text-[10px] bg-stone-200 text-stone-700 font-medium px-1.5 py-0.5 rounded">
                      {ref.tipoRefeicao}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-stone-800 mt-2 leading-snug">
                    {ref.nomePrato}
                  </h4>

                  <div className="mt-2.5 space-y-1">
                    <p className="text-[10px] font-bold text-stone-400 uppercase">Ingredientes & Per Capita:</p>
                    {ref.itens.map(item => (
                      <div key={item.id} className="text-[11px] text-stone-600 flex items-center justify-between">
                        <span className="truncate max-w-[110px]">{item.alimentoNome}</span>
                        <span className="font-mono text-stone-400">{item.perCapitaLiquidoG}{item.unidade}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumo Nutricional do Dia */}
                <div className="pt-2 border-t border-stone-200 text-[10px] space-y-1">
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="flex items-center gap-1 font-semibold text-amber-700">
                      <Flame className="w-3 h-3" /> {ref.totalKcal} kcal
                    </span>
                    <span>Prot: {ref.totalProteinasG}g</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-500">
                    <span>Carb: {ref.totalCarboidratosG}g</span>
                    <span>Vit C: {ref.totalVitaminaCMg}mg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Observações de Dietas Especiais */}
          {cardapioAtivo.observacoesDietasEspeciais && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <HeartPulse className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Adequação para Dietas Especiais (Alergias / Intolerâncias):</strong>
                <span className="text-amber-800 text-[11px]">{cardapioAtivo.observacoesDietasEspeciais}</span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Modal Novo Cardápio */}
      {showNovoCardapioModal && (
        <NovoCardapioModal onClose={() => setShowNovoCardapioModal(false)} />
      )}

    </div>
  );
};

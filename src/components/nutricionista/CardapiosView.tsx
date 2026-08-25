import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { exportCardapioPDF } from '../../lib/exportPdf';
import { Cardapio } from '../../types';
import { 
  Utensils, 
  Download, 
  Plus, 
  Flame, 
  Carrot, 
  HeartPulse, 
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { NovoCardapioModal } from './NovoCardapioModal';

export const CardapiosView: React.FC = () => {
  const { cardapios, municipio } = usePNAE();
  const [selectedCardapio, setSelectedCardapio] = useState<Cardapio | null>(cardapios[0] || null);
  const [showNovoModal, setShowNovoModal] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            Cardápios Homologados da Rede Municipal
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Planejamento alimentar de acordo com os parâmetros nutricionais da Resolução CD/FNDE nº 06/2020.
          </p>
        </div>

        <button
          onClick={() => setShowNovoModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Elaborar Novo Cardápio</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lista de Cardápios */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Cardápios Cadastrados ({cardapios.length})
          </h3>

          {cardapios.map(c => {
            const isSel = selectedCardapio?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCardapio(c)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSel
                    ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-emerald-300 hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {c.etapaEnsino}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                    {c.mesReferencia} (Sem {c.semanaNumero})
                  </span>
                </div>

                <h4 className="text-xs font-bold text-stone-900 mt-2">
                  {c.titulo}
                </h4>

                <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-400 text-[11px]">Agri. Familiar:</span>
                  <strong className="text-emerald-700 font-bold">{c.percentualAgriFamiliarEstimado}%</strong>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detalhes do Cardápio Selecionado */}
        {selectedCardapio ? (
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {selectedCardapio.status}
                    </span>
                    <span className="text-xs font-semibold text-stone-500">
                      Etapa: {selectedCardapio.etapaEnsino}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mt-1">
                    {selectedCardapio.titulo}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Responsável Técnica: <strong>{selectedCardapio.nutricionistaNome}</strong> ({selectedCardapio.nutricionistaCrn})
                  </p>
                </div>

                <button
                  onClick={() => exportCardapioPDF(selectedCardapio, municipio)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500" />
                  <span>Baixar Cardápio Oficial (PDF)</span>
                </button>
              </div>

              {/* Matriz Semanal */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Planejamento Diário e Ingredientes
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedCardapio.refeicoes.map((ref, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                        <span className="text-xs font-bold text-emerald-900">{ref.diaSemana}</span>
                        <span className="text-[10px] bg-stone-200 text-stone-700 font-semibold px-2 py-0.5 rounded">
                          {ref.tipoRefeicao}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-stone-800">{ref.nomePrato}</p>

                      <div className="space-y-1 pt-1 text-xs">
                        <span className="text-[10px] text-stone-400 font-bold uppercase block">Ingredientes:</span>
                        {ref.itens.map(it => (
                          <div key={it.id} className="flex justify-between text-[11px] text-stone-600">
                            <span className="truncate">{it.alimentoNome}</span>
                            <span className="font-mono text-stone-500">{it.perCapitaLiquidoG}g</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-stone-200 flex justify-between text-[10px] text-stone-600 font-semibold">
                        <span className="text-amber-700 flex items-center gap-1">
                          <Flame className="w-3 h-3" /> {ref.totalKcal} kcal
                        </span>
                        <span>Prot: {ref.totalProteinasG}g | Carb: {ref.totalCarboidratosG}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCardapio.observacoesDietasEspeciais && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <HeartPulse className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block">Adequação para Dietas Especiais:</strong>
                    <span className="text-amber-800 text-[11px]">{selectedCardapio.observacoesDietasEspeciais}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center border border-dashed border-stone-300 rounded-2xl bg-white text-stone-400 text-sm">
            Selecione um cardápio ao lado.
          </div>
        )}

      </div>

      {showNovoModal && (
        <NovoCardapioModal onClose={() => setShowNovoModal(false)} />
      )}

    </div>
  );
};

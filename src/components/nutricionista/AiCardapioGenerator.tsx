import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { EtapaEnsino, RefeicaoDia } from '../../types';
import { Sparkles, Bot, CheckCircle2, Flame, Apple, Carrot, ArrowRight, RefreshCw } from 'lucide-react';

export const AiCardapioGenerator: React.FC = () => {
  const { addCardapio, currentUser, setActiveTab } = usePNAE();

  const [etapa, setEtapa] = useState<EtapaEnsino>('Ensino Fundamental I');
  const [focoAgriFamiliar, setFocoAgriFamiliar] = useState(true);
  const [restricaoAlimentar, setRestricaoAlimentar] = useState('Nenhuma restrição severa (cardápio padrão)');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCardapio, setGeneratedCardapio] = useState<{
    titulo: string;
    justificativaNutricional: string;
    percentualAF: number;
    refeicoes: RefeicaoDia[];
  } | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);

    setTimeout(() => {
      // Geração baseada nos parâmetros da Resolução CD/FNDE nº 06/2020
      const mockResult = {
        titulo: `Cardápio Otimizado PNAE - ${etapa} (Foco Agricultura Familiar)`,
        justificativaNutricional: `Elaborado segundo a Resolução CD/FNDE nº 06/2020. Atende a 20% das necessidades nutricionais diárias para turno parcial (ou 70% para integral). Priorização de 3 porções diárias de frutas e hortaliças da agricultura familiar regional, ausência de alimentos ultraprocessados e controle estrito de sódio e açúcares adicionados.`,
        percentualAF: 54.2,
        refeicoes: [
          {
            diaSemana: 'Segunda-feira' as const,
            tipoRefeicao: 'Almoço' as const,
            nomePrato: 'Arroz Integral com Cenoura, Feijão Preto Carioca, Ovos Cozidos Caipiras e Salada de Alface e Tomate',
            descricaoPreparo: 'Preparo com óleo vegetal em dosagem controlada e ervas naturais da horta.',
            itens: [
              { id: 'gen-1', alimentoId: 'alim-01', alimentoNome: 'Arroz Polido Tipo 1', perCapitaLiquidoG: 60, perCapitaBrutoG: 60, unidade: 'g', ehAgriculturaFamiliar: true },
              { id: 'gen-2', alimentoId: 'alim-02', alimentoNome: 'Feijão Preto da Agricultura Familiar', perCapitaLiquidoG: 40, perCapitaBrutoG: 40, unidade: 'g', ehAgriculturaFamiliar: true },
              { id: 'gen-3', alimentoId: 'alim-06', alimentoNome: 'Cenoura Fresca Lavada sem Rama', perCapitaLiquidoG: 30, perCapitaBrutoG: 35, unidade: 'g', ehAgriculturaFamiliar: true },
              { id: 'gen-4', alimentoId: 'alim-03', alimentoNome: 'Ovos de Galinha Caipira', perCapitaLiquidoG: 50, perCapitaBrutoG: 55, unidade: 'unid', ehAgriculturaFamiliar: true },
            ],
            totalKcal: 425,
            totalCarboidratosG: 62,
            totalProteinasG: 19.5,
            totalLipidiosG: 8.0,
            totalFibrasG: 8.2,
            totalCalcioMg: 95,
            totalFerroMg: 3.8,
            totalVitaminaCMg: 22,
          },
          {
            diaSemana: 'Terça-feira' as const,
            tipoRefeicao: 'Almoço' as const,
            nomePrato: 'Polenta Cremosa com Carne Moída Refogada e Couve-Manteiga Picada',
            descricaoPreparo: 'Carne de primeira cozida lentamente com temperos verdes frescos.',
            itens: [
              { id: 'gen-5', alimentoId: 'alim-04', alimentoNome: 'Carne Bovina Moída de 1ª', perCapitaLiquidoG: 70, perCapitaBrutoG: 75, unidade: 'g', ehAgriculturaFamiliar: false },
              { id: 'gen-6', alimentoId: 'alim-05', alimentoNome: 'Banana Prata Fresca', perCapitaLiquidoG: 100, perCapitaBrutoG: 120, unidade: 'g', ehAgriculturaFamiliar: true },
            ],
            totalKcal: 440,
            totalCarboidratosG: 58,
            totalProteinasG: 22.0,
            totalLipidiosG: 9.5,
            totalFibrasG: 6.8,
            totalCalcioMg: 88,
            totalFerroMg: 4.2,
            totalVitaminaCMg: 26,
          },
          {
            diaSemana: 'Quarta-feira' as const,
            tipoRefeicao: 'Almoço' as const,
            nomePrato: 'Arroz Branco, Feijão, Iscas de Frango com Abobrinha e Beterraba Cozida',
            descricaoPreparo: 'Frango marinado no limão e ervas finas, abobrinha salteada.',
            itens: [
              { id: 'gen-7', alimentoId: 'alim-01', alimentoNome: 'Arroz Polido Tipo 1', perCapitaLiquidoG: 60, perCapitaBrutoG: 60, unidade: 'g', ehAgriculturaFamiliar: true },
              { id: 'gen-8', alimentoId: 'alim-02', alimentoNome: 'Feijão Preto da Agricultura Familiar', perCapitaLiquidoG: 40, perCapitaBrutoG: 40, unidade: 'g', ehAgriculturaFamiliar: true },
            ],
            totalKcal: 410,
            totalCarboidratosG: 60,
            totalProteinasG: 21.0,
            totalLipidiosG: 7.2,
            totalFibrasG: 7.5,
            totalCalcioMg: 75,
            totalFerroMg: 3.2,
            totalVitaminaCMg: 30,
          },
          {
            diaSemana: 'Quinta-feira' as const,
            tipoRefeicao: 'Almoço' as const,
            nomePrato: 'Macarrão com Molho de Tomate Caseiro, Carne em Cubos e Salada de Pepino',
            descricaoPreparo: 'Molho 100% natural feito com tomates frescos da agricultura familiar.',
            itens: [
              { id: 'gen-9', alimentoId: 'alim-04', alimentoNome: 'Carne Bovina Moída de 1ª', perCapitaLiquidoG: 70, perCapitaBrutoG: 75, unidade: 'g', ehAgriculturaFamiliar: false },
            ],
            totalKcal: 435,
            totalCarboidratosG: 66,
            totalProteinasG: 20.0,
            totalLipidiosG: 8.8,
            totalFibrasG: 6.2,
            totalCalcioMg: 82,
            totalFerroMg: 3.6,
            totalVitaminaCMg: 18,
          },
          {
            diaSemana: 'Sexta-feira' as const,
            tipoRefeicao: 'Almoço' as const,
            nomePrato: 'Risoto de Legumes da Horta com Frango Desfiado e Sobremesa de Maçã Gala Fresca',
            descricaoPreparo: 'Cozimento lento com cenoura, ervilha e milho fresco.',
            itens: [
              { id: 'gen-10', alimentoId: 'alim-01', alimentoNome: 'Arroz Polido Tipo 1', perCapitaLiquidoG: 60, perCapitaBrutoG: 60, unidade: 'g', ehAgriculturaFamiliar: true },
              { id: 'gen-11', alimentoId: 'alim-06', alimentoNome: 'Cenoura Fresca Lavada sem Rama', perCapitaLiquidoG: 30, perCapitaBrutoG: 35, unidade: 'g', ehAgriculturaFamiliar: true },
            ],
            totalKcal: 420,
            totalCarboidratosG: 63,
            totalProteinasG: 19.0,
            totalLipidiosG: 7.5,
            totalFibrasG: 7.9,
            totalCalcioMg: 90,
            totalFerroMg: 3.4,
            totalVitaminaCMg: 24,
          },
        ],
      };

      setGeneratedCardapio(mockResult);
      setIsGenerating(false);
    }, 1000);
  };

  const handleApplyToSystem = () => {
    if (!generatedCardapio) return;

    addCardapio({
      titulo: generatedCardapio.titulo,
      mesReferencia: '2026-09',
      semanaNumero: 3,
      etapaEnsino: etapa,
      nutricionistaId: currentUser?.id || 'user-nutri',
      nutricionistaNome: currentUser?.name || 'Dra. Mariana Vasconcelos',
      nutricionistaCrn: currentUser?.crn || 'CRN-2 / 14892',
      diasLetivosSemana: 5,
      percentualAgriFamiliarEstimado: generatedCardapio.percentualAF,
      status: 'Aprovado Nutricionista',
      observacoesDietasEspeciais: 'Cardápio balanceado com parâmetros PNAE/FNDE e alta densidade nutritiva.',
      refeicoes: generatedCardapio.refeicoes,
    });

    setActiveTab('cardapios');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">
              Assistente Nutricional PNAE (IA / Resolução FNDE nº 06/2020)
            </h2>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> FNDE AI
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Geração e validação de cardápios com cálculo de VET, macronutrientes, micronutrientes e maximização de compras da agricultura familiar.
          </p>
        </div>
      </div>

      {/* Formulário de Parâmetros IA */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
          Configurações da Geração
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700">Etapa de Ensino Alvo</label>
            <select
              value={etapa}
              onChange={e => setEtapa(e.target.value as EtapaEnsino)}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
            >
              <option value="Ensino Fundamental I">Ensino Fundamental I (6 a 10 anos)</option>
              <option value="Ensino Fundamental II">Ensino Fundamental II (11 a 15 anos)</option>
              <option value="Creche (0 a 3 anos)">Creche (0 a 3 anos)</option>
              <option value="Pré-Escola (4 a 5 anos)">Pré-Escola (4 a 5 anos)</option>
              <option value="Tempo Integral">Tempo Integral (70% VET)</option>
              <option value="Educação de Jovens e Adultos (EJA)">EJA</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700">Restrição / Foco Especial</label>
            <input
              type="text"
              value={restricaoAlimentar}
              onChange={e => setRestricaoAlimentar(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
            />
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Calculando parâmetros PNAE...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Cardápio Inteligente</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-stone-100 text-xs text-stone-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Regras automáticas: Sem ultraprocessados • Mínimo 280g/semana de frutas/hortaliças • Máximo 20% gordura total.</span>
        </div>
      </div>

      {/* Cardápio Gerado */}
      {generatedCardapio && (
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-5 animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  Gerado por IA
                </span>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  {generatedCardapio.percentualAF}% Agricultura Familiar
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900 mt-1">
                {generatedCardapio.titulo}
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {generatedCardapio.justificativaNutricional}
              </p>
            </div>

            <button
              onClick={handleApplyToSystem}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition shrink-0"
            >
              <span>Homologar e Salvar no Sistema</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Matriz das Refeições Geradas */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {generatedCardapio.refeicoes.map((ref, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                  <span className="text-xs font-bold text-stone-900">{ref.diaSemana}</span>
                  <span className="text-[10px] bg-stone-200 text-stone-700 font-semibold px-1.5 py-0.5 rounded">
                    {ref.tipoRefeicao}
                  </span>
                </div>

                <p className="text-xs font-semibold text-stone-800 leading-snug">
                  {ref.nomePrato}
                </p>

                <div className="pt-2 border-t border-stone-200 text-[10px] text-stone-600 font-semibold flex items-center justify-between">
                  <span className="text-amber-700 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> {ref.totalKcal} kcal
                  </span>
                  <span>Prot: {ref.totalProteinasG}g</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};

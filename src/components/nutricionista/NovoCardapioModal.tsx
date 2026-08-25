import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { EtapaEnsino, DiaSemana, TipoRefeicao, RefeicaoDia, RefeicaoItem } from '../../types';
import { Plus, Trash2, Sparkles, Utensils, X, Flame } from 'lucide-react';

interface NovoCardapioModalProps {
  onClose: () => void;
}

export const NovoCardapioModal: React.FC<NovoCardapioModalProps> = ({ onClose }) => {
  const { alimentos, addCardapio, currentUser } = usePNAE();

  const [titulo, setTitulo] = useState('Cardápio Semanal Balanceado - PNAE');
  const [mesReferencia, setMesReferencia] = useState('2026-09');
  const [semanaNumero, setSemanaNumero] = useState(2);
  const [etapaEnsino, setEtapaEnsino] = useState<EtapaEnsino>('Ensino Fundamental I');
  const [observacoesDietas, setObservacoesDietas] = useState('Opção para celíacos e intolerantes a lactose disponível sob solicitação da direção escolar.');

  // Refeições de Segunda a Sexta
  const diasSemana: DiaSemana[] = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];

  const [refeicoes, setRefeicoes] = useState<RefeicaoDia[]>(() => {
    return diasSemana.map(dia => ({
      diaSemana: dia,
      tipoRefeicao: 'Almoço' as TipoRefeicao,
      nomePrato: dia === 'Segunda-feira' ? 'Arroz, Feijão Preto, Ovos Caipiras e Cenoura Refogada' : `Prato Nutritivo de ${dia}`,
      descricaoPreparo: 'Preparo com ingredientes frescos e óleo vegetal em dosagem controlada.',
      itens: [
        { id: `ri-1-${dia}`, alimentoId: 'alim-01', alimentoNome: 'Arroz Polido Tipo 1', perCapitaLiquidoG: 60, perCapitaBrutoG: 60, unidade: 'g', ehAgriculturaFamiliar: true },
        { id: `ri-2-${dia}`, alimentoId: 'alim-02', alimentoNome: 'Feijão Preto da Agricultura Familiar', perCapitaLiquidoG: 40, perCapitaBrutoG: 40, unidade: 'g', ehAgriculturaFamiliar: true },
        { id: `ri-3-${dia}`, alimentoId: 'alim-06', alimentoNome: 'Cenoura Fresca Lavada sem Rama', perCapitaLiquidoG: 35, perCapitaBrutoG: 40, unidade: 'g', ehAgriculturaFamiliar: true },
      ],
      totalKcal: 420,
      totalCarboidratosG: 64,
      totalProteinasG: 18,
      totalLipidiosG: 7,
      totalFibrasG: 8.5,
      totalCalcioMg: 90,
      totalFerroMg: 3.5,
      totalVitaminaCMg: 20,
    }));
  });

  const [selectedDiaIndex, setSelectedDiaIndex] = useState(0);

  const handleAddItemToCurrentDia = (alimentoId: string) => {
    const alim = alimentos.find(a => a.id === alimentoId);
    if (!alim) return;

    const newItem: RefeicaoItem = {
      id: `ri-${Date.now()}`,
      alimentoId: alim.id,
      alimentoNome: alim.nome,
      perCapitaLiquidoG: 30,
      perCapitaBrutoG: 35,
      unidade: alim.unidadeMedida,
      ehAgriculturaFamiliar: alim.ehAgriculturaFamiliar,
    };

    setRefeicoes(prev => {
      const copy = [...prev];
      const dia = copy[selectedDiaIndex];
      const updatedItens = [...dia.itens, newItem];
      
      // Recalcular nutrientes simplificado
      const newKcal = dia.totalKcal + Math.round((alim.caloriasKcal * 30) / 100);
      const newProt = dia.totalProteinasG + Math.round((alim.proteinasG * 30) / 100);

      copy[selectedDiaIndex] = {
        ...dia,
        itens: updatedItens,
        totalKcal: newKcal,
        totalProteinasG: newProt,
      };
      return copy;
    });
  };

  const handleRemoveItem = (itemIndex: number) => {
    setRefeicoes(prev => {
      const copy = [...prev];
      const dia = copy[selectedDiaIndex];
      const updatedItens = dia.itens.filter((_, i) => i !== itemIndex);
      copy[selectedDiaIndex] = { ...dia, itens: updatedItens };
      return copy;
    });
  };

  const handleSaveCardapio = (e: React.FormEvent) => {
    e.preventDefault();

    addCardapio({
      titulo,
      mesReferencia,
      semanaNumero,
      etapaEnsino,
      nutricionistaId: currentUser?.id || 'user-nutri',
      nutricionistaNome: currentUser?.name || 'Dra. Mariana Vasconcelos',
      nutricionistaCrn: currentUser?.crn || 'CRN-2 / 14892',
      diasLetivosSemana: 5,
      percentualAgriFamiliarEstimado: 52.0,
      status: 'Aprovado Nutricionista',
      observacoesDietasEspeciais: observacoesDietas,
      refeicoes,
    });

    onClose();
  };

  const currentDia = refeicoes[selectedDiaIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Elaborar Novo Cardápio Semanal PNAE
            </h3>
            <p className="text-xs text-stone-500">
              Cálculo de per capita, balanceamento nutricional e especificação de itens da Agricultura Familiar.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveCardapio} className="mt-4 space-y-4">
          
          {/* Dados Gerais */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700">Título do Cardápio</label>
              <input
                type="text"
                required
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700">Etapa de Ensino</label>
              <select
                value={etapaEnsino}
                onChange={e => setEtapaEnsino(e.target.value as EtapaEnsino)}
                className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
              >
                <option value="Ensino Fundamental I">Ensino Fundamental I</option>
                <option value="Ensino Fundamental II">Ensino Fundamental II</option>
                <option value="Creche (0 a 3 anos)">Creche (0 a 3 anos)</option>
                <option value="Pré-Escola (4 a 5 anos)">Pré-Escola (4 a 5 anos)</option>
                <option value="Tempo Integral">Tempo Integral</option>
                <option value="Educação de Jovens e Adultos (EJA)">EJA</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-stone-700">Mês / Semana</label>
              <div className="flex gap-1 mt-1">
                <input
                  type="month"
                  value={mesReferencia}
                  onChange={e => setMesReferencia(e.target.value)}
                  className="w-full px-2 py-2 border border-stone-300 rounded-xl text-xs"
                />
                <select
                  value={semanaNumero}
                  onChange={e => setSemanaNumero(Number(e.target.value))}
                  className="px-2 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                >
                  <option value={1}>Sem 1</option>
                  <option value={2}>Sem 2</option>
                  <option value={3}>Sem 3</option>
                  <option value={4}>Sem 4</option>
                </select>
              </div>
            </div>
          </div>

          {/* Abas dos Dias da Semana */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex border-b border-stone-200 space-x-2">
              {diasSemana.map((dia, idx) => (
                <button
                  type="button"
                  key={dia}
                  onClick={() => setSelectedDiaIndex(idx)}
                  className={`py-2 px-3 text-xs font-bold border-b-2 transition ${
                    selectedDiaIndex === idx
                      ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {dia}
                </button>
              ))}
            </div>

            {/* Painel do Dia Selecionado */}
            <div className="mt-3 p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700">Nome do Prato Principal / Refeição</label>
                  <input
                    type="text"
                    value={currentDia.nomePrato}
                    onChange={e => {
                      const val = e.target.value;
                      setRefeicoes(prev => {
                        const copy = [...prev];
                        copy[selectedDiaIndex] = { ...copy[selectedDiaIndex], nomePrato: val };
                        return copy;
                      });
                    }}
                    className="mt-1 w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Tipo da Refeição</label>
                  <select
                    value={currentDia.tipoRefeicao}
                    onChange={e => {
                      const val = e.target.value as TipoRefeicao;
                      setRefeicoes(prev => {
                        const copy = [...prev];
                        copy[selectedDiaIndex] = { ...copy[selectedDiaIndex], tipoRefeicao: val };
                        return copy;
                      });
                    }}
                    className="mt-1 w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Almoço">Almoço</option>
                    <option value="Desjejum">Desjejum</option>
                    <option value="Colação">Colação</option>
                    <option value="Lanche da Tarde">Lanche da Tarde</option>
                    <option value="Jantar">Jantar</option>
                  </select>
                </div>
              </div>

              {/* Itens / Ingredientes do Dia */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Ingredientes do Prato ({currentDia.itens.length})
                  </span>
                  
                  {/* Select rápido para adicionar do catálogo */}
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        handleAddItemToCurrentDia(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="px-2.5 py-1 border border-emerald-300 rounded-lg text-xs bg-white text-emerald-800 font-semibold cursor-pointer"
                  >
                    <option value="">+ Adicionar do Catálogo TACO...</option>
                    {alimentos.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.nome} ({a.unidadeMedida}) {a.ehAgriculturaFamiliar ? '[AF]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {currentDia.itens.map((it, iIdx) => (
                    <div key={it.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-stone-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900">{it.alimentoNome}</span>
                        {it.ehAgriculturaFamiliar && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                            Agricultura Familiar
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-stone-500 text-[11px]">Per Capita:</span>
                        <input
                          type="number"
                          value={it.perCapitaLiquidoG}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setRefeicoes(prev => {
                              const copy = [...prev];
                              const itens = [...copy[selectedDiaIndex].itens];
                              itens[iIdx] = { ...itens[iIdx], perCapitaLiquidoG: val, perCapitaBrutoG: Math.round(val * 1.1) };
                              copy[selectedDiaIndex] = { ...copy[selectedDiaIndex], itens };
                              return copy;
                            });
                          }}
                          className="w-14 px-1.5 py-0.5 border border-stone-300 rounded text-center text-xs font-mono"
                        />
                        <span className="text-stone-400 text-[11px]">{it.unidade}</span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(iIdx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box de Energia e Nutrientes do Dia */}
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-emerald-700" />
                  Total Calórico: {currentDia.totalKcal} kcal
                </span>
                <div className="flex gap-3 text-[11px] text-emerald-900">
                  <span>Carboidratos: <strong>{currentDia.totalCarboidratosG}g</strong></span>
                  <span>Proteínas: <strong>{currentDia.totalProteinasG}g</strong></span>
                  <span>Fibras: <strong>{currentDia.totalFibrasG}g</strong></span>
                </div>
              </div>

            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">Observações / Dietas Especiais</label>
            <textarea
              rows={2}
              value={observacoesDietas}
              onChange={e => setObservacoesDietas(e.target.value)}
              className="mt-1 w-full px-3 py-1.5 border border-stone-300 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800"
            >
              Homologar e Salvar Cardápio
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

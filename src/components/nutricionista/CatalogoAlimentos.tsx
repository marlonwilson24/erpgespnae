import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { Alimento, CategoriaAlimento } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { Apple, Plus, Search, Filter, Carrot, Leaf, Flame, Sparkles } from 'lucide-react';

export const CatalogoAlimentos: React.FC = () => {
  const { alimentos, addAlimento } = usePNAE();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [somenteAgriculturaFamiliar, setSomenteAgriculturaFamiliar] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form states para novo alimento
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaAlimento>('Hortifrúti e Frutas');
  const [unidadeMedida, setUnidadeMedida] = useState('kg');
  const [precoRef, setPrecoRef] = useState(6.50);
  const [ehAF, setEhAF] = useState(true);
  const [ehOrganico, setEhOrganico] = useState(false);
  const [calorias, setCalorias] = useState(50);
  const [proteinas, setProteinas] = useState(1.5);
  const [carboidratos, setCarboidratos] = useState(11);
  const [lipidios, setLipidios] = useState(0.2);
  const [fibras, setFibras] = useState(2.8);
  const [calcio, setCalcio] = useState(30);
  const [ferro, setFerro] = useState(0.5);
  const [vitaminaC, setVitaminaC] = useState(15);

  const filteredAlimentos = alimentos.filter(a => {
    const matchSearch = a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.codigoTaco?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategoria === 'TODAS' || a.categoria === selectedCategoria;
    const matchAF = !somenteAgriculturaFamiliar || a.ehAgriculturaFamiliar;
    return matchSearch && matchCat && matchAF;
  });

  const handleCreateAlimento = (e: React.FormEvent) => {
    e.preventDefault();
    addAlimento({
      nome,
      categoria,
      unidadeMedida,
      precoReferenciaMedio: precoRef,
      ehAgriculturaFamiliar: ehAF,
      ehOrganico,
      caloriasKcal: calorias,
      proteinasG: proteinas,
      carboidratosG: carboidratos,
      lipidiosG: lipidios,
      fibrasG: fibras,
      calcioMg: calcio,
      ferroMg: ferro,
      vitaminaCMg: vitaminaC,
      sodioMg: 5,
    });
    setShowModal(false);
  };

  const categoriasList: (CategoriaAlimento | 'TODAS')[] = [
    'TODAS',
    'Hortifrúti e Frutas',
    'Legumes e Verduras',
    'Grãos, Cereais e Tubérculos',
    'Carnes, Ovos e Pescados',
    'Leite e Derivados',
    'Mercearia e Básicos',
    'Temperos Naturais',
    'Bebidas e Polpas',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            Catálogo de Alimentos e Tabela Nutricional (TACO)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Base de dados de composição centesimal de alimentos por 100g, preços de referência médios e identificação de gêneros da Agricultura Familiar.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Alimento</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome ou código TACO..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategoria}
            onChange={e => setSelectedCategoria(e.target.value)}
            className="px-3 py-1.5 border border-stone-300 rounded-xl text-xs bg-white text-stone-700 font-medium"
          >
            {categoriasList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-xs text-stone-700 font-medium cursor-pointer select-none bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <input
              type="checkbox"
              checked={somenteAgriculturaFamiliar}
              onChange={e => setSomenteAgriculturaFamiliar(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-emerald-800 font-bold">Apenas Agri. Familiar</span>
          </label>
        </div>
      </div>

      {/* Tabela de Alimentos */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] font-semibold border-y border-stone-200">
              <tr>
                <th className="py-2.5 px-3">Código TACO</th>
                <th className="py-2.5 px-3">Alimento</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">Unid.</th>
                <th className="py-2.5 px-3">Preço Ref.</th>
                <th className="py-2.5 px-3">Energia</th>
                <th className="py-2.5 px-3">Proteína</th>
                <th className="py-2.5 px-3">Carboidrato</th>
                <th className="py-2.5 px-3">Fibras</th>
                <th className="py-2.5 px-3 text-right">Classificação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredAlimentos.map(alim => (
                <tr key={alim.id} className="hover:bg-stone-50/50">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-stone-400">{alim.codigoTaco || '--'}</td>
                  <td className="py-2.5 px-3 font-semibold text-stone-900">{alim.nome}</td>
                  <td className="py-2.5 px-3 text-stone-600">{alim.categoria}</td>
                  <td className="py-2.5 px-3 font-mono">{alim.unidadeMedida}</td>
                  <td className="py-2.5 px-3 font-bold text-stone-800">{formatCurrency(alim.precoReferenciaMedio)}</td>
                  <td className="py-2.5 px-3 text-amber-700 font-semibold">{alim.caloriasKcal} kcal</td>
                  <td className="py-2.5 px-3">{alim.proteinasG}g</td>
                  <td className="py-2.5 px-3">{alim.carboidratosG}g</td>
                  <td className="py-2.5 px-3">{alim.fibrasG}g</td>
                  <td className="py-2.5 px-3 text-right space-x-1">
                    {alim.ehAgriculturaFamiliar && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        Agri. Familiar
                      </span>
                    )}
                    {alim.ehOrganico && (
                      <span className="text-[9px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded">
                        Orgânico
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastrar Alimento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-stone-900">Cadastrar Alimento no Catálogo TACO</h3>
            <p className="text-xs text-stone-500 mt-0.5">Informe os dados centesimais por 100g de porção comestível.</p>

            <form onSubmit={handleCreateAlimento} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Nome do Alimento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Abobrinha Italiana Fresca"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Categoria</label>
                  <select
                    value={categoria}
                    onChange={e => setCategoria(e.target.value as CategoriaAlimento)}
                    className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                  >
                    <option value="Hortifrúti e Frutas">Hortifrúti e Frutas</option>
                    <option value="Legumes e Verduras">Legumes e Verduras</option>
                    <option value="Grãos e Cereais">Grãos e Cereais</option>
                    <option value="Carnes e Proteínas">Carnes e Proteínas</option>
                    <option value="Ovos e Lácteos">Ovos e Lácteos</option>
                    <option value="Panificados e Tubérculos">Panificados e Tubérculos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Unidade de Medida</label>
                  <input
                    type="text"
                    required
                    value={unidadeMedida}
                    onChange={e => setUnidadeMedida(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Preço Médio (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={precoRef}
                    onChange={e => setPrecoRef(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-1.5 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Calorias (kcal)</label>
                  <input
                    type="number"
                    value={calorias}
                    onChange={e => setCalorias(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-1.5 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Proteínas (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={proteinas}
                    onChange={e => setProteinas(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-1.5 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Carboidratos (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={carboidratos}
                    onChange={e => setCarboidratos(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-1.5 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Fibras (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fibras}
                    onChange={e => setFibras(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-1.5 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Vitamina C (mg)</label>
                  <input
                    type="number"
                    value={vitaminaC}
                    onChange={e => setVitaminaC(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-1.5 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-1.5 text-xs text-stone-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ehAF}
                    onChange={e => setEhAF(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Agricultura Familiar</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-stone-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ehOrganico}
                    onChange={e => setEhOrganico(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Orgânico / Agroecológico</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800"
                >
                  Salvar no Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

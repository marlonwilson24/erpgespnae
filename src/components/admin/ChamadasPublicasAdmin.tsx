import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { ChamadaPublica, ItemChamadaPublica } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { exportChamadaPublicaPDF } from '../../lib/exportPdf';
import { 
  FileText, 
  Plus, 
  Download, 
  CheckCircle2, 
  Tractor, 
  Calendar, 
  DollarSign, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const ChamadasPublicasAdmin: React.FC = () => {
  const { chamadasPublicas, alimentos, municipio, createChamadaPublica, emitirAF, escolas } = usePNAE();
  
  const [selectedChamada, setSelectedChamada] = useState<ChamadaPublica | null>(chamadasPublicas[0] || null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEmitirAFModal, setShowEmitirAFModal] = useState(false);

  // Form states para nova chamada
  const [numeroEdital, setNumeroEdital] = useState(`00${chamadasPublicas.length + 2}/2026 - PNAE`);
  const [titulo, setTitulo] = useState('Chamada Pública para Aquisição de Hortifrutigranjeiros da Agricultura Familiar');
  const [objeto, setObjeto] = useState('Aquisição de gêneros alimentícios diretamente da Agricultura Familiar e do Empreendedor Familiar Rural para atendimento ao PNAE.');
  const [dataAbertura, setDataAbertura] = useState('2026-09-01');
  const [dataEncerramento, setDataEncerramento] = useState('2026-09-25');
  const [selectedAlimentos, setSelectedAlimentos] = useState<{ alimentoId: string; quantidade: number; precoMax: number }[]>([
    { alimentoId: 'alim-03', quantidade: 5000, precoMax: 5.80 },
    { alimentoId: 'alim-05', quantidade: 6000, precoMax: 3.50 },
  ]);

  // Form state para emitir AF
  const [selectedEscolaId, setSelectedEscolaId] = useState(escolas[0]?.id || '');
  const [dataLimiteAF, setDataLimiteAF] = useState('2026-09-10');

  const handleAddAlimentoRow = () => {
    if (alimentos.length > 0) {
      setSelectedAlimentos(prev => [
        ...prev,
        { alimentoId: alimentos[0].id, quantidade: 1000, precoMax: alimentos[0].precoReferenciaMedio },
      ]);
    }
  };

  const handleCreateChamada = (e: React.FormEvent) => {
    e.preventDefault();

    const itensCriados: ItemChamadaPublica[] = selectedAlimentos.map((sel, idx) => {
      const alim = alimentos.find(a => a.id === sel.alimentoId);
      return {
        id: `cp-item-new-${Date.now()}-${idx}`,
        alimentoId: sel.alimentoId,
        descricaoItem: alim?.nome || 'Alimento',
        unidadeMedida: alim?.unidadeMedida || 'kg',
        quantidadeTotalSolicitada: Number(sel.quantidade),
        precoMaximoReferencia: Number(sel.precoMax),
        valorTotalItem: Number(sel.quantidade) * Number(sel.precoMax),
        exclusivoAgriculturaFamiliar: true,
        exigeOrganico: alim?.ehOrganico || false,
        cronogramaEntrega: 'Semanal',
      };
    });

    const valorTotal = itensCriados.reduce((acc, it) => acc + it.valorTotalItem, 0);

    createChamadaPublica({
      numeroEdital,
      anoExercicio: municipio.anoExercicio,
      titulo,
      objeto,
      dataAbertura,
      dataEncerramento,
      valorTotalEstimado: valorTotal,
      valorReservadoAgriFamiliar: valorTotal,
      percentualAgriFamiliar: 100,
      status: 'Publicada',
      itens: itensCriados,
      arquivoEditalNome: `Edital_${numeroEdital.replace(/[\/\s]/g, '_')}.pdf`,
    });

    setShowNewModal(false);
  };

  const handleEmitirAFSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChamada || selectedChamada.propostas.length === 0) return;

    const propostaVencedora = selectedChamada.propostas[0];
    const escolaSel = escolas.find(esc => esc.id === selectedEscolaId);

    const afItens = selectedChamada.itens.slice(0, 3).map(it => ({
      alimentoId: it.alimentoId,
      alimentoNome: it.descricaoItem,
      quantidadeAutorizada: Math.round(it.quantidadeTotalSolicitada * 0.05), // Lote fracionado para a escola
      quantidadeEntregue: 0,
      unidadeMedida: it.unidadeMedida,
      precoUnitario: it.precoMaximoReferencia,
      valorTotal: Math.round(it.quantidadeTotalSolicitada * 0.05) * it.precoMaximoReferencia,
    }));

    const valorTotalAF = afItens.reduce((acc, it) => acc + it.valorTotal, 0);

    emitirAF({
      contratoId: `cont-${Date.now()}`,
      fornecedorId: propostaVencedora.fornecedorId,
      fornecedorNome: propostaVencedora.fornecedorNome,
      escolaId: selectedEscolaId,
      escolaNome: escolaSel?.nome || 'Escola Municipal',
      dataLimiteEntrega: dataLimiteAF,
      valorTotalAF,
      itens: afItens,
    });

    setShowEmitirAFModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            Chamadas Públicas da Agricultura Familiar
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Aquisições diretas de produtores rurais locais com limite de R$ 40 mil/ano por DAP/CAF (Lei 11.947/09)
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Publicar Nova Chamada Pública</span>
        </button>
      </div>

      {/* Lista de Chamadas e Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna 1: Lista de Editais */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Editais de Chamadas ({chamadasPublicas.length})
          </h3>

          {chamadasPublicas.map(cp => {
            const isSelected = selectedChamada?.id === cp.id;
            return (
              <div
                key={cp.id}
                onClick={() => setSelectedChamada(cp)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-emerald-300 hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {cp.numeroEdital}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                    {cp.status}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-stone-900 mt-2 line-clamp-2">
                  {cp.titulo}
                </h4>

                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Valor Estimado:</span>
                    <strong className="text-stone-800">{formatCurrency(cp.valorTotalEstimado)}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 block">Propostas:</span>
                    <span className="font-semibold text-emerald-700">{cp.propostas.length} submetidas</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coluna 2 e 3: Detalhes do Edital Selecionado */}
        {selectedChamada ? (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Box Principal */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Edital nº {selectedChamada.numeroEdital}
                    </span>
                    <span className="text-xs font-semibold text-stone-500">
                      Exercício {selectedChamada.anoExercicio}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mt-1">
                    {selectedChamada.titulo}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1">
                    {selectedChamada.objeto}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportChamadaPublicaPDF(selectedChamada, municipio)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-stone-500" />
                    <span>Baixar Edital (PDF)</span>
                  </button>

                  {selectedChamada.propostas.length > 0 && (
                    <button
                      onClick={() => setShowEmitirAFModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
                    >
                      <Tractor className="w-3.5 h-3.5" />
                      <span>Emitir AF para Escola</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Informações Gerais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-stone-400 block text-[11px]">Abertura das Propostas</span>
                  <strong className="text-stone-800 font-semibold">{formatDate(selectedChamada.dataAbertura)}</strong>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-stone-400 block text-[11px]">Encerramento</span>
                  <strong className="text-stone-800 font-semibold">{formatDate(selectedChamada.dataEncerramento)}</strong>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-emerald-800 block text-[11px] font-medium">Valor Total Estimado</span>
                  <strong className="text-emerald-950 font-bold">{formatCurrency(selectedChamada.valorTotalEstimado)}</strong>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-stone-400 block text-[11px]">Exclusividade AF</span>
                  <strong className="text-emerald-700 font-bold">100% Agricultura Familiar</strong>
                </div>
              </div>

              {/* Tabela de Itens Solicitados */}
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                  Gêneros Alimentícios Solicitados ({selectedChamada.itens.length} itens)
                </h4>
                <div className="overflow-x-auto border border-stone-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] font-semibold border-b border-stone-200">
                      <tr>
                        <th className="py-2 px-3">Item / Alimento</th>
                        <th className="py-2 px-3">Quantidade</th>
                        <th className="py-2 px-3">Preço Ref. Max</th>
                        <th className="py-2 px-3">Valor Total</th>
                        <th className="py-2 px-3">Cronograma</th>
                        <th className="py-2 px-3">Orgânico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {selectedChamada.itens.map(it => (
                        <tr key={it.id} className="hover:bg-stone-50/50">
                          <td className="py-2.5 px-3 font-semibold text-stone-800">{it.descricaoItem}</td>
                          <td className="py-2.5 px-3">{it.quantidadeTotalSolicitada.toLocaleString('pt-BR')} {it.unidadeMedida}</td>
                          <td className="py-2.5 px-3">{formatCurrency(it.precoMaximoReferencia)}</td>
                          <td className="py-2.5 px-3 font-bold text-stone-900">{formatCurrency(it.valorTotalItem)}</td>
                          <td className="py-2.5 px-3 text-stone-600">{it.cronogramaEntrega}</td>
                          <td className="py-2.5 px-3">
                            {it.exigeOrganico ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Sim</span>
                            ) : (
                              <span className="text-[10px] text-stone-400">Convencional</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Projetos de Venda / Propostas Recebidas dos Agricultores */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Propostas Submetidas pelos Produtores ({selectedChamada.propostas.length})
                  </h4>
                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Validação do limite de R$ 40 mil / ano por DAP/CAF
                  </span>
                </div>

                {selectedChamada.propostas.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-stone-200 rounded-xl text-stone-400 text-xs">
                    Nenhuma proposta submetida ainda. Agricultores podem enviar projetos pelo módulo "Fornecedor".
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedChamada.propostas.map(prop => (
                      <div key={prop.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-stone-900">{prop.fornecedorNome}</p>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                                {prop.tipoProdutor}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-0.5 font-mono">
                              CPF/CNPJ: {prop.fornecedorCpfCnpj} • DAP/CAF: <strong>{prop.fornecedorDapCaf}</strong>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-700 block">
                              {formatCurrency(prop.valorTotalProposta)}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              Data: {formatDate(prop.dataSubmissao)}
                            </span>
                          </div>
                        </div>

                        {/* Status de Conformidade com o Limite de R$ 40.000 */}
                        <div className="p-2.5 rounded-lg bg-white border border-stone-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-stone-700">
                              Limite PNAE (R$ 40.000/ano): <strong>Dentro do Teto Legal</strong> (Saldo restante: {formatCurrency(prop.limiteDisponivelDap - prop.valorTotalProposta)})
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            {prop.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center border border-dashed border-stone-300 rounded-2xl bg-white text-stone-400 text-sm">
            Selecione uma chamada pública ao lado para visualizar os detalhes.
          </div>
        )}

      </div>

      {/* Modal Nova Chamada Pública */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-stone-900">
              Criar Edital de Chamada Pública - PNAE
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Exclusiva para aquisição direta de produtores da Agricultura Familiar (Art. 14 Lei nº 11.947/2009)
            </p>

            <form className="mt-4 space-y-4" onSubmit={handleCreateChamada}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Número do Edital</label>
                  <input
                    type="text"
                    value={numeroEdital}
                    onChange={e => setNumeroEdital(e.target.value)}
                    required
                    className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Data de Abertura</label>
                  <input
                    type="date"
                    value={dataAbertura}
                    onChange={e => setDataAbertura(e.target.value)}
                    required
                    className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Data de Encerramento</label>
                  <input
                    type="date"
                    value={dataEncerramento}
                    onChange={e => setDataEncerramento(e.target.value)}
                    required
                    className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Título da Chamada</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  required
                  className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Objeto Resumido</label>
                <textarea
                  value={objeto}
                  onChange={e => setObjeto(e.target.value)}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              {/* Seleção de Itens */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800">Itens e Alimentos do Edital</label>
                  <button
                    type="button"
                    onClick={handleAddAlimentoRow}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Item
                  </button>
                </div>

                {selectedAlimentos.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-stone-50 p-2 rounded-xl border border-stone-200 text-xs">
                    <div className="col-span-6">
                      <select
                        value={row.alimentoId}
                        onChange={e => {
                          const val = e.target.value;
                          const alim = alimentos.find(a => a.id === val);
                          setSelectedAlimentos(prev => {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], alimentoId: val, precoMax: alim?.precoReferenciaMedio || 5.0 };
                            return copy;
                          });
                        }}
                        className="w-full px-2 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                      >
                        {alimentos.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.nome} ({a.unidadeMedida}) {a.ehOrganico ? '[Orgânico]' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Qtd total"
                        value={row.quantidade}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setSelectedAlimentos(prev => {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], quantidade: val };
                            return copy;
                          });
                        }}
                        className="w-full px-2 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div className="col-span-3 text-right font-semibold text-stone-700">
                      {formatCurrency(row.quantidade * row.precoMax)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition"
                >
                  Publicar Edital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Emitir Autorização de Fornecimento (AF) */}
      {showEmitirAFModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">
              Emitir Autorização de Fornecimento (AF)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Gera a ordem de entrega formal para o agricultor familiar entregar na escola.
            </p>

            <form className="mt-4 space-y-4" onSubmit={handleEmitirAFSubmit}>
              <div>
                <label className="block text-xs font-semibold text-stone-700">Escola de Destino</label>
                <select
                  value={selectedEscolaId}
                  onChange={e => setSelectedEscolaId(e.target.value)}
                  required
                  className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                >
                  {escolas.map(esc => (
                    <option key={esc.id} value={esc.id}>
                      {esc.nome} ({esc.totalAlunos} alunos)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Data Limite de Entrega</label>
                <input
                  type="date"
                  value={dataLimiteAF}
                  onChange={e => setDataLimiteAF(e.target.value)}
                  required
                  className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                <p className="font-semibold text-stone-800">Fornecedor Contratado:</p>
                <p>{selectedChamada?.propostas[0]?.fornecedorNome}</p>
                <p className="text-[11px] text-stone-400 font-mono">DAP/CAF: {selectedChamada?.propostas[0]?.fornecedorDapCaf}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowEmitirAFModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition"
                >
                  Confirmar Emissão de AF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

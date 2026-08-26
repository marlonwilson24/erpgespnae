import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { ChamadaPublica, TipoProdutor } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { Tractor, AlertTriangle, CheckCircle2, X, ShieldAlert } from 'lucide-react';

interface SubmeterPropostaModalProps {
  chamada: ChamadaPublica;
  onClose: () => void;
}

export const SubmeterPropostaModal: React.FC<SubmeterPropostaModalProps> = ({ chamada, onClose }) => {
  const { currentUser, contratos, submitProposta } = usePNAE();

  // Calcular o acumulado atual da DAP do fornecedor no ano
  const LIMITE_LEGAL_DAP = 40000;
  const contratosAno = contratos.filter(c => c.fornecedorId === currentUser?.id);
  const totalContratadoAno = contratosAno.reduce((acc, c) => acc + c.valorTotalContrato, 0);
  const saldoDisponivelDap = Math.max(0, LIMITE_LEGAL_DAP - totalContratadoAno);

  const [tipoProdutor, setTipoProdutor] = useState<TipoProdutor>('Individual');
  const [dapNumero, setDapNumero] = useState(currentUser?.fornecedorDapCaf || 'CAF-RS-2026-881920');
  
  // Itens da proposta
  const [itensProposta, setItensProposta] = useState(() => {
    return chamada.itens.map(it => ({
      chamadaItemId: it.id,
      alimentoId: it.alimentoId,
      descricao: it.descricaoItem,
      unidadeMedida: it.unidadeMedida,
      precoUnitario: it.precoMaximoReferencia,
      quantidadeOfertada: Math.round(it.quantidadeTotalSolicitada * 0.3), // 30% da demanda
    }));
  });

  const valorTotalProposta = itensProposta.reduce((acc, it) => acc + (it.quantidadeOfertada * it.precoUnitario), 0);
  const excedeLimite = valorTotalProposta > saldoDisponivelDap;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (excedeLimite) {
      alert('Limite legal de R$ 40.000,00 por DAP/ano excedido! Reduza as quantidades ofertadas.');
      return;
    }

    const tipoEnquadramento: 'Individual' | 'Grupo Informal' | 'Cooperativa / Associação' =
      tipoProdutor === 'Grupo Formal (Cooperativa)' ? 'Cooperativa / Associação' : tipoProdutor;

    submitProposta({
      chamadaPublicaId: chamada.id,
      fornecedorId: currentUser?.id || 'user-fornecedor',
      fornecedorNome: currentUser?.name || 'Associação de Produtores Familiares',
      fornecedorCpfCnpj: currentUser?.cpf || '91.823.456/0001-02',
      fornecedorDapCaf: dapNumero,
      tipoProdutor: tipoEnquadramento,
      valorTotalProposta,
      acumuladoAnoDapCaf: totalContratadoAno,
      limiteDisponivelDap: saldoDisponivelDap,
      status: 'Em Análise',
      itensOfertados: itensProposta.map(it => ({
        itemChamadaId: it.chamadaItemId,
        quantidadeOfertada: it.quantidadeOfertada,
        precoUnitarioOfertado: it.precoUnitario,
        valorTotal: it.quantidadeOfertada * it.precoUnitario,
      })),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Edital nº {chamada.numeroEdital}
              </span>
              <h3 className="text-base font-bold text-stone-900">
                Submeter Projeto de Venda (Agricultura Familiar)
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Validação legal do limite de R$ 40.000,00/ano civil por DAP/CAF (Art. 14 Lei nº 11.947/2009).
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Card de Alerta do Limite da DAP */}
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${
            excedeLimite ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                {excedeLimite ? <ShieldAlert className="w-4 h-4 text-red-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                <span>Controle de Teto PNAE da DAP / CAF</span>
              </div>
              <span className="font-bold text-stone-900">
                Teto Anual: {formatCurrency(LIMITE_LEGAL_DAP)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-stone-500 block">Já Contratado no Ano:</span>
                <strong>{formatCurrency(totalContratadoAno)}</strong>
              </div>
              <div>
                <span className="text-stone-500 block">Saldo Disponível:</span>
                <strong className="text-emerald-700">{formatCurrency(saldoDisponivelDap)}</strong>
              </div>
              <div>
                <span className="text-stone-500 block">Valor Desta Proposta:</span>
                <strong className={excedeLimite ? 'text-red-700 font-black' : 'text-emerald-800'}>
                  {formatCurrency(valorTotalProposta)}
                </strong>
              </div>
            </div>

            {excedeLimite && (
              <p className="text-red-700 font-bold text-[11px] pt-1 border-t border-red-200">
                ⚠️ A proposta ultrapassa o saldo disponível da DAP! Reduza as quantidades ofertadas.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-stone-700">Enquadramento do Produtor</label>
              <select
                value={tipoProdutor}
                onChange={e => setTipoProdutor(e.target.value as TipoProdutor)}
                className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
              >
                <option value="Individual">Fornecedor Individual (Agricultor Familiar)</option>
                <option value="Grupo Informal">Grupo Informal de Produtores</option>
                <option value="Grupo Formal (Cooperativa)">Grupo Formal (Cooperativa / Associação)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700">Número da DAP ou CAF Válida</label>
              <input
                type="text"
                required
                value={dapNumero}
                onChange={e => setDapNumero(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          {/* Quantidades Ofertadas */}
          <div>
            <label className="block font-semibold text-stone-700 text-xs mb-2">
              Itens Ofertados no Projeto de Venda:
            </label>

            <div className="space-y-2">
              {itensProposta.map((it, idx) => (
                <div key={it.alimentoId} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <strong className="text-stone-900 block">{it.descricao}</strong>
                    <span className="text-stone-500 text-[11px]">
                      Preço Edital: {formatCurrency(it.precoUnitario)} / {it.unidadeMedida}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-600">Qtd:</span>
                      <input
                        type="number"
                        value={it.quantidadeOfertada}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setItensProposta(prev => {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], quantidadeOfertada: val };
                            return copy;
                          });
                        }}
                        className="w-20 px-2 py-1 border border-stone-300 rounded-lg text-xs font-bold text-center bg-white"
                      />
                      <span className="text-stone-500 font-mono">{it.unidadeMedida}</span>
                    </div>

                    <span className="font-bold text-stone-900 min-w-[80px] text-right">
                      {formatCurrency(it.quantidadeOfertada * it.precoUnitario)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
              disabled={excedeLimite}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 disabled:opacity-40 transition"
            >
              Enviar Projeto de Venda
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { AutorizacaoFornecimento, ParecerQualidade, StatusConferencia } from '../../types';
import { exportTermoRecebimentoPDF } from '../../lib/exportPdf';
import { Truck, CheckCircle2, AlertTriangle, X, ShieldCheck } from 'lucide-react';

interface RecebimentoEntregaModalProps {
  af: AutorizacaoFornecimento;
  onClose: () => void;
}

export const RecebimentoEntregaModal: React.FC<RecebimentoEntregaModalProps> = ({ af, onClose }) => {
  const { confirmarRecebimentoEntrega, currentUser, municipio } = usePNAE();

  const [notaFiscal, setNotaFiscal] = useState(`NF-${Math.floor(100000 + Math.random() * 900000)}`);
  const [parecerQualidade, setParecerQualidade] = useState<ParecerQualidade>('Aprovado');
  const [statusConferencia, setStatusConferencia] = useState<StatusConferencia>('Recebido Integralmente');
  const [observacoes, setObservacoes] = useState('Mercadorias entregues em perfeito estado de maturação, higienizadas e dentro da temperatura adequada.');

  // Quantidades recebidas por item
  const [itensRecebidos, setItensRecebidos] = useState(() => {
    return af.itens.map(it => ({
      alimentoId: it.alimentoId,
      alimentoNome: it.alimentoNome,
      quantidadeAutorizada: it.quantidadeAutorizada,
      quantidadeRecebida: it.quantidadeAutorizada, // padrão integral
      unidadeMedida: it.unidadeMedida,
      aprovado: true,
      motivoRejeicao: '',
    }));
  });

  const handleConfirmar = (e: React.FormEvent) => {
    e.preventDefault();

    const entregaCriada = confirmarRecebimentoEntrega({
      autorizacaoFornecimentoId: af.id,
      numeroAF: af.numeroAF,
      fornecedorId: af.fornecedorId,
      fornecedorNome: af.fornecedorNome,
      escolaId: af.escolaId,
      escolaNome: af.escolaNome,
      dataEntrega: new Date().toISOString().split('T')[0],
      notaFiscalOuComprovante: notaFiscal,
      responsavelRecebimentoNome: currentUser?.name || 'Diretora Escolar',
      responsavelRecebimentoCargo: currentUser?.cargo || 'Responsável pela Merenda',
      parecerQualidade,
      statusConferencia,
      observacoes,
      itens: itensRecebidos.map(it => ({
        id: `ei-${Date.now()}-${it.alimentoId}`,
        alimentoId: it.alimentoId,
        alimentoNome: it.alimentoNome,
        quantidadeRecebida: Number(it.quantidadeRecebida),
        unidadeMedida: it.unidadeMedida,
        aprovado: it.aprovado,
        motivoRejeicao: it.motivoRejeicao || undefined,
      })),
      termoRecebimentoAssinado: true,
    });

    // Baixa o Termo de Recebimento em PDF automaticamente
    exportTermoRecebimentoPDF(entregaCriada, municipio);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono">
                {af.numeroAF}
              </span>
              <h3 className="text-base font-bold text-stone-900">
                Conferência e Recebimento de Mercadorias
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Escola: <strong>{af.escolaNome}</strong> • Fornecedor: <strong>{af.fornecedorNome}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmar} className="mt-4 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-stone-700">Nota Fiscal ou Talão de Produtor</label>
              <input
                type="text"
                required
                value={notaFiscal}
                onChange={e => setNotaFiscal(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700">Status da Conferência</label>
              <select
                value={statusConferencia}
                onChange={e => setStatusConferencia(e.target.value as StatusConferencia)}
                className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
              >
                <option value="Recebido Integralmente">Recebido Integralmente (100%)</option>
                <option value="Recebido Parcialmente">Recebido Parcialmente</option>
                <option value="Recusado">Recusado (Mercadoria Inadequada)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 text-xs">Avaliação de Qualidade e Higiene</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(['Aprovado', 'Aprovado com Ressalvas', 'Reprovado'] as ParecerQualidade[]).map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setParecerQualidade(p)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    parecerQualidade === p
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela de Itens e Quantidades Recebidas */}
          <div>
            <label className="block font-semibold text-stone-700 text-xs mb-2">
              Conferência dos Gêneros Entregues:
            </label>

            <div className="space-y-2">
              {itensRecebidos.map((it, idx) => (
                <div key={it.alimentoId} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <strong className="text-stone-900 block">{it.alimentoNome}</strong>
                    <span className="text-stone-500 text-[11px]">
                      Autorizado na AF: {it.quantidadeAutorizada} {it.unidadeMedida}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-stone-600 font-semibold">Qtd Recebida:</span>
                    <input
                      type="number"
                      value={it.quantidadeRecebida}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setItensRecebidos(prev => {
                          const copy = [...prev];
                          copy[idx] = { ...copy[idx], quantidadeRecebida: val };
                          return copy;
                        });
                      }}
                      className="w-20 px-2 py-1 border border-stone-300 rounded-lg text-xs font-bold text-center bg-white"
                    />
                    <span className="text-stone-500 font-mono">{it.unidadeMedida}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 text-xs">Observações do Recebimento / Despensa</label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              className="mt-1 w-full px-3 py-1.5 border border-stone-300 rounded-xl text-xs"
            />
          </div>

          {/* Aviso de Trigger do Supabase */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Ao confirmar, o sistema gerará o <strong>Termo de Recebimento (PDF)</strong> e atualizará o estoque da escola automaticamente (Trigger Supabase).
            </span>
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
              Atestar Recebimento e Baixar Termo
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

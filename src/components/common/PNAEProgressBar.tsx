import React from 'react';
import { formatCurrency } from '../../lib/utils';
import { CheckCircle2, AlertTriangle, Scale } from 'lucide-react';

interface PNAEProgressBarProps {
  recursoFNDERecebido: number;
  gastoAgriculturaFamiliar: number;
  metaLegalPercentual?: number; // 30% por padrão
}

export const PNAEProgressBar: React.FC<PNAEProgressBarProps> = ({
  recursoFNDERecebido,
  gastoAgriculturaFamiliar,
  metaLegalPercentual = 30,
}) => {
  const percentualAtingido = recursoFNDERecebido > 0 
    ? (gastoAgriculturaFamiliar / recursoFNDERecebido) * 100 
    : 0;

  const metaValorMinimo = recursoFNDERecebido * (metaLegalPercentual / 100);
  const cumpreMeta = percentualAtingido >= metaLegalPercentual;

  return (
    <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-stone-900">
              Cumprimento da Meta PNAE - Agricultura Familiar
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
              Art. 14 Lei 11.947/09
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Meta legal mínima: <strong>{metaLegalPercentual}%</strong> do repasse FNDE destinado a produtores locais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cumpreMeta ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Meta Cumprida ({percentualAtingido.toFixed(1)}%)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              Abaixo da Meta ({percentualAtingido.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {/* Barra de Progresso com Marcador dos 30% */}
      <div className="relative pt-2 pb-1">
        <div className="w-full h-4 bg-stone-100 rounded-full overflow-hidden flex border border-stone-200">
          <div
            className={`h-full transition-all duration-700 rounded-full ${
              cumpreMeta ? 'bg-emerald-600' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, percentualAtingido)}%` }}
          />
        </div>

        {/* Linha da meta legal em 30% */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-stone-900 z-10 flex flex-col items-center"
          style={{ left: `${metaLegalPercentual}%` }}
        >
          <span className="text-[9px] font-bold text-stone-700 bg-white px-1 border border-stone-300 rounded shadow-2xs -mt-1">
            30% Meta
          </span>
        </div>
      </div>

      {/* Detalhamento de Valores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-100 text-xs">
        <div>
          <span className="text-stone-400 block text-[11px]">Total FNDE Repassado:</span>
          <strong className="text-stone-800 font-semibold">{formatCurrency(recursoFNDERecebido)}</strong>
        </div>
        <div>
          <span className="text-stone-400 block text-[11px]">Gasto em Agri. Familiar:</span>
          <strong className="text-emerald-700 font-bold">{formatCurrency(gastoAgriculturaFamiliar)}</strong>
        </div>
        <div>
          <span className="text-stone-400 block text-[11px]">Mínimo Obrigatório:</span>
          <strong className="text-stone-800 font-semibold">{formatCurrency(metaValorMinimo)}</strong>
        </div>
        <div>
          <span className="text-stone-400 block text-[11px]">Superávit da Meta:</span>
          <strong className={cumpreMeta ? 'text-emerald-600' : 'text-amber-600'}>
            {cumpreMeta 
              ? `+ ${formatCurrency(gastoAgriculturaFamiliar - metaValorMinimo)}`
              : `- ${formatCurrency(metaValorMinimo - gastoAgriculturaFamiliar)}`}
          </strong>
        </div>
      </div>
    </div>
  );
};

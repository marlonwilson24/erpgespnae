import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { StatusAprovacaoPNAE } from '../../types';
import { Scale, CheckCircle2, AlertTriangle, X, FileText } from 'lucide-react';

interface EmitirParecerModalProps {
  onClose: () => void;
}

export const EmitirParecerModal: React.FC<EmitirParecerModalProps> = ({ onClose }) => {
  const { emitirParecerCAE, municipio, prestacaoContas, currentUser } = usePNAE();

  const [numeroAta, setNumeroAta] = useState(`Ata nº 0${Math.floor(Math.random() * 5) + 3}/2026 - Reunião Ordinária CAE`);
  const [dataReuniao, setDataReuniao] = useState(new Date().toISOString().split('T')[0]);
  const [statusAprovacao, setStatusAprovacao] = useState<StatusAprovacaoPNAE>('Aprovado pelo CAE');
  const [presidenteNome, setPresidenteNome] = useState(currentUser?.name || 'Prof. Carlos Eduardo Silveira');
  const [relatorNome, setRelatorNome] = useState('Dra. Vanessa Dornelles');
  const [textoParecer, setTextoParecer] = useState(`O Conselho de Alimentação Escolar (CAE), em cumprimento ao Art. 19 da Lei Federal nº 11.947/2009, analisou a prestação de contas do PNAE do município de ${municipio.nome} - ${municipio.uf}. Constatou-se a destinação de ${prestacaoContas.percentualAgriculturaFamiliarAtingido.toFixed(1)}% dos recursos federais à Agricultura Familiar, superando a meta legal de 30%, bem como a boa aceitabilidade e qualidade dos cardápios executados.`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const resultadoParecer: 'Favorável sem Ressalvas' | 'Favorável com Ressalvas' | 'Desfavorável (Irregularidades)' =
      statusAprovacao === 'Aprovado pelo CAE'
        ? 'Favorável sem Ressalvas'
        : statusAprovacao === 'Aprovado com Ressalvas'
        ? 'Favorável com Ressalvas'
        : 'Desfavorável (Irregularidades)';

    emitirParecerCAE({
      prestacaoContasId: prestacaoContas.id,
      anoExercicio: municipio.anoExercicio,
      numeroAta,
      dataReuniaoAta: dataReuniao,
      presidenteCaeNome: presidenteNome,
      relatorCaeNome: relatorNome,
      resultadoParecer,
      textoParecerConclusivo: textoParecer,
      recomendacoesAoGestor: '',
      membrosPresentes: [presidenteNome, relatorNome],
      pontosAvaliados: [],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Emitir Parecer Conclusivo do Conselho (CAE)
            </h3>
            <p className="text-xs text-stone-500">
              Atestação formal para inserção no SIGPC / FNDE (Art. 19 Lei nº 11.947/2009).
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700">Número da Ata de Reunião</label>
              <input
                type="text"
                required
                value={numeroAta}
                onChange={e => setNumeroAta(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700">Data da Sessão Plenária</label>
              <input
                type="date"
                value={dataReuniao}
                onChange={e => setDataReuniao(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700">Decisão do Colegiado (Status)</label>
            <select
              value={statusAprovacao}
              onChange={e => setStatusAprovacao(e.target.value as StatusAprovacaoPNAE)}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl bg-white font-bold text-emerald-800"
            >
              <option value="Aprovado pelo CAE">Aprovado pelo CAE (Parecer Favorável)</option>
              <option value="Aprovado com Ressalvas">Aprovado com Ressalvas</option>
              <option value="Reprovado pelo CAE">Reprovado pelo CAE</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700">Presidente do CAE</label>
              <input
                type="text"
                required
                value={presidenteNome}
                onChange={e => setPresidenteNome(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700">Relator(a) do Processo</label>
              <input
                type="text"
                required
                value={relatorNome}
                onChange={e => setRelatorNome(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700">Texto do Parecer Conclusivo</label>
            <textarea
              rows={4}
              required
              value={textoParecer}
              onChange={e => setTextoParecer(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl font-semibold hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-semibold hover:bg-emerald-800"
            >
              Homologar Parecer Oficial
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

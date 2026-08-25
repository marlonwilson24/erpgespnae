import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { ParecerQualidade } from '../../types';
import { Scale, CheckCircle2, AlertTriangle, X, Shield } from 'lucide-react';

interface RegistrarVisitaModalProps {
  onClose: () => void;
}

export const RegistrarVisitaModal: React.FC<RegistrarVisitaModalProps> = ({ onClose }) => {
  const { escolas, registrarVisitaCae, currentUser } = usePNAE();

  const [escolaId, setEscolaId] = useState(escolas[0]?.id || '');
  const [dataVisita, setDataVisita] = useState(new Date().toISOString().split('T')[0]);
  const [membrosPresentes, setMembrosPresentes] = useState(`${currentUser?.name || 'Prof. Carlos Eduardo'}, Maria Luiza (Pais de Alunos)`);
  const [cardapioConforme, setCardapioConforme] = useState(true);
  const [armazenamentoConforme, setArmazenamentoConforme] = useState(true);
  const [higieneConforme, setHigieneConforme] = useState(true);
  const [aceitabilidadeAlunos, setAceitabilidadeAlunos] = useState<ParecerQualidade>('Aprovado');
  const [relatorio, setRelatorio] = useState('Constatou-se despensa organizada com controle de validade em dia, alimentos frescos da agricultura familiar em boas condições e refeição servida rigorosamente de acordo com o cardápio homologado.');
  const [recomendacoes, setRecomendacoes] = useState('Manter a reposição contínua dos registros de temperatura.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const esc = escolas.find(e => e.id === escolaId);

    registrarVisitaCae({
      escolaId,
      escolaNome: esc?.nome || 'Escola Municipal',
      dataVisita,
      membrosCaePresentes: membrosPresentes.split(',').map(m => m.trim()),
      cardapioAfixadoEConforme: cardapioConforme,
      armazenamentoAdequado: armazenamentoConforme,
      condicoesHigieneAprovadas: higieneConforme,
      aceitabilidadeAlunos,
      relatorioObservacoes: relatorio,
      recomendacoesEncaminhadas: recomendacoes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Registrar Relatório de Fiscalização In Loco do CAE
            </h3>
            <p className="text-xs text-stone-500">
              Inspeção da cozinha, despensa e conformidade do cardápio escolar.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700">Unidade Escolar Fiscalizada</label>
              <select
                value={escolaId}
                onChange={e => setEscolaId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
              >
                {escolas.map(esc => (
                  <option key={esc.id} value={esc.id}>{esc.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700">Data da Visita</label>
              <input
                type="date"
                value={dataVisita}
                onChange={e => setDataVisita(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700">Conselheiros Presentes</label>
            <input
              type="text"
              value={membrosPresentes}
              onChange={e => setMembrosPresentes(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl"
            />
          </div>

          {/* Checklist de Itens Avaliados */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <span className="font-bold text-stone-800 uppercase text-[10px] block">Checklist de Conformidade Sanitária e Nutricional:</span>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cardapioConforme}
                onChange={e => setCardapioConforme(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Cardápio oficial visível e refeição do dia em conformidade</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={armazenamentoConforme}
                onChange={e => setArmazenamentoConforme(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Despensa arejada, estrados adequados e controle de validade</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={higieneConforme}
                onChange={e => setHigieneConforme(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Manipuladores com EPIs e boas práticas higiênico-sanitárias</span>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-stone-700">Parecer Geral da Equipe do CAE</label>
            <textarea
              rows={3}
              value={relatorio}
              onChange={e => setRelatorio(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700">Recomendações e Orientações</label>
            <input
              type="text"
              value={recomendacoes}
              onChange={e => setRecomendacoes(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl"
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
              Salvar Relatório de Visita
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

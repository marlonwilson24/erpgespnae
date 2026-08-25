import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { formatDate } from '../../lib/utils';
import { ApontamentoOuvidoriaCAE } from '../../types';
import { 
  MessageSquare, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Send, 
  School, 
  User, 
  AlertCircle, 
  X,
  HelpCircle
} from 'lucide-react';

export const CaeOuvidoriaSocial: React.FC = () => {
  const { apontamentosCae, registrarApontamentoOuvidoria, responderApontamentoOuvidoria, escolas } = usePNAE();

  const [showNovoModal, setShowNovoModal] = useState(false);
  const [apontamentoSelecionado, setApontamentoSelecionado] = useState<ApontamentoOuvidoriaCAE | null>(null);
  const [respostaTexto, setRespostaTexto] = useState('');
  const [novoStatus, setNovoStatus] = useState<ApontamentoOuvidoriaCAE['status']>('Resolvido');

  const [novoRegistro, setNovoRegistro] = useState({
    escolaNome: escolas[0]?.nome || 'EMEF Monteiro Lobato',
    solicitanteTipo: 'Pai/Mãe de Aluno' as const,
    assunto: '',
    descricao: '',
    status: 'Em Análise pelo CAE' as const,
  });

  const handleSaveNovo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoRegistro.assunto || !novoRegistro.descricao) return;
    registrarApontamentoOuvidoria(novoRegistro);
    setShowNovoModal(false);
    setNovoRegistro({
      escolaNome: escolas[0]?.nome || 'EMEF Monteiro Lobato',
      solicitanteTipo: 'Pai/Mãe de Aluno',
      assunto: '',
      descricao: '',
      status: 'Em Análise pelo CAE',
    });
  };

  const handleEnviarResposta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apontamentoSelecionado || !respostaTexto) return;
    responderApontamentoOuvidoria(apontamentoSelecionado.id, respostaTexto, novoStatus);
    setApontamentoSelecionado(null);
    setRespostaTexto('');
  };

  return (
    <div id="cae-ouvidoria-social" className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">
              Ouvidoria & Controle Social da Merenda
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              Canal Aberto à Comunidade Escolar
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Recebimento e tratamento de manifestações, dúvidas, sugestões e denúncias sobre a alimentação escolar.
          </p>
        </div>

        <button
          onClick={() => setShowNovoModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Manifestação</span>
        </button>
      </div>

      {/* Lista de Apontamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {apontamentosCae.map((item) => {
          const isResolvido = item.status === 'Resolvido';

          return (
            <div 
              key={item.id}
              className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-emerald-200 transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">
                      {item.solicitanteTipo} • {item.escolaNome}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 mt-0.5">{item.assunto}</h3>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    isResolvido 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : item.status === 'Encaminhado ao Gestor'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isResolvido ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-100 leading-relaxed">
                  "{item.descricao}"
                </p>

                {item.respostaCae && (
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs">
                    <span className="text-[10px] font-bold text-emerald-900 block">
                      Encaminhamento / Resposta do CAE:
                    </span>
                    <p className="text-emerald-950 mt-0.5 italic">
                      ↳ {item.respostaCae}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-100">
                <span>Registrado em {formatDate(item.dataRegistro)}</span>
                <button
                  onClick={() => {
                    setApontamentoSelecionado(item);
                    setRespostaTexto(item.respostaCae || '');
                    setNovoStatus(item.status);
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Tratar Manifestação →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Registrar Manifestação */}
      {showNovoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">Registrar Manifestação / Ouvidoria</h3>
              <button onClick={() => setShowNovoModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNovo} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Unidade Escolar:</label>
                <select
                  value={novoRegistro.escolaNome}
                  onChange={e => setNovoRegistro({...novoRegistro, escolaNome: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                >
                  {escolas.map(e => (
                    <option key={e.id} value={e.nome}>{e.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Tipo de Solicitante:</label>
                <select
                  value={novoRegistro.solicitanteTipo}
                  onChange={e => setNovoRegistro({...novoRegistro, solicitanteTipo: e.target.value as any})}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                >
                  <option value="Pai/Mãe de Aluno">Pai/Mãe de Aluno</option>
                  <option value="Professor">Professor / Educador</option>
                  <option value="Merendeira">Merendeira / Cozinheira</option>
                  <option value="Comunidade">Comunidade em Geral</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Assunto:</label>
                <input
                  type="text"
                  required
                  value={novoRegistro.assunto}
                  onChange={e => setNovoRegistro({...novoRegistro, assunto: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  placeholder="Ex: Aceitação do novo cardápio de frutas..."
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Relato / Descrição:</label>
                <textarea
                  rows={3}
                  required
                  value={novoRegistro.descricao}
                  onChange={e => setNovoRegistro({...novoRegistro, descricao: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  placeholder="Descreva o apontamento, elogio ou solicitação..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNovoModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tratar Manifestação */}
      {apontamentoSelecionado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">Tratar Manifestação do CAE</h3>
              <button onClick={() => setApontamentoSelecionado(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <span className="font-bold text-stone-900 block">{apontamentoSelecionado.assunto}</span>
              <p className="text-stone-600 mt-1">"{apontamentoSelecionado.descricao}"</p>
            </div>

            <form onSubmit={handleEnviarResposta} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Status da Manifestação:</label>
                <select
                  value={novoStatus}
                  onChange={e => setNovoStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                >
                  <option value="Em Análise pelo CAE">Em Análise pelo CAE</option>
                  <option value="Encaminhado ao Gestor">Encaminhado ao Gestor (Ofício)</option>
                  <option value="Resolvido">Resolvido</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Parecer / Resposta do Conselho:</label>
                <textarea
                  rows={4}
                  required
                  value={respostaTexto}
                  onChange={e => setRespostaTexto(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  placeholder="Registre as providências tomadas pelo colegiado..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setApontamentoSelecionado(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                >
                  Salvar Resposta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

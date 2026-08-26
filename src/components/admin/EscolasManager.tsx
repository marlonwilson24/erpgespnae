import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { Escola, EtapaEnsino } from '../../types';
import { School, Plus, MapPin, Users, Phone, Mail, CheckCircle2 } from 'lucide-react';

export const EscolasManager: React.FC = () => {
  const { escolas, addEscola } = usePNAE();
  const [showAddModal, setShowAddModal] = useState(false);
  const [nome, setNome] = useState('');
  const [codigoInep, setCodigoInep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [diretorNome, setDiretorNome] = useState('');
  const [responsavelMerendaNome, setResponsavelMerendaNome] = useState('');
  const [totalAlunos, setTotalAlunos] = useState(250);
  const [tipoAtendimento, setTipoAtendimento] = useState<'Parcial' | 'Integral'>('Parcial');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            Unidades Escolares da Rede Municipal
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Cadastro de escolas, censo escolar e responsáveis pelo recebimento da alimentação escolar.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Escola</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {escolas.map(esc => (
          <div key={esc.id} className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900">{esc.nome}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    esc.tipoAtendimento === 'Integral' 
                      ? 'bg-purple-100 text-purple-800 border-purple-200' 
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  }`}>
                    {esc.tipoAtendimento}
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-mono mt-0.5">INEP: {esc.codigoInep}</p>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-emerald-700 block">
                  {esc.totalAlunos} alunos
                </span>
                <span className="text-[10px] text-stone-400">Atendidos PNAE</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex items-center gap-1.5 text-stone-500">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{esc.endereco}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>Diretora: <strong>{esc.diretorNome}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Responsável Merenda: <strong>{esc.responsavelMerendaNome}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex flex-wrap gap-1.5">
              {esc.distribuicaoAlunos.map((d, i) => (
                <span key={i} className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium">
                  {d.etapa}: {d.alunos} alunos
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Escola */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Cadastrar Unidade Escolar</h3>
            <p className="text-xs text-stone-500 mt-0.5">Integração com Censo Escolar INEP</p>

            <form
              onSubmit={e => {
                e.preventDefault();
                addEscola({
                  nome,
                  codigoInep,
                  municipioId: '',
                  endereco,
                  diretorNome,
                  responsavelMerendaNome,
                  telefone: '',
                  email: '',
                  totalAlunos,
                  distribuicaoAlunos: [],
                  tipoAtendimento,
                });
                setShowAddModal(false);
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-stone-700">Nome da Escola</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: EMEF Santos Dumont"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Código INEP</label>
                  <input
                    type="text"
                    required
                    placeholder="43029988"
                    value={codigoInep}
                    onChange={e => setCodigoInep(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Total de Alunos</label>
                  <input
                    type="number"
                    required
                    value={totalAlunos}
                    onChange={e => setTotalAlunos(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Endereço Completo</label>
                <input
                  type="text"
                  required
                  value={endereco}
                  onChange={e => setEndereco(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Nome do Diretor(a)</label>
                <input
                  type="text"
                  required
                  value={diretorNome}
                  onChange={e => setDiretorNome(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Responsável pela Merenda</label>
                <input
                  type="text"
                  required
                  value={responsavelMerendaNome}
                  onChange={e => setResponsavelMerendaNome(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800"
                >
                  Salvar Escola
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

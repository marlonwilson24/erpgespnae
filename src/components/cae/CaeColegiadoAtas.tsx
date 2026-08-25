import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { formatDate } from '../../lib/utils';
import { exportFichaColegiadoCaePDF } from '../../lib/exportPdf';
import { MembroCAE, ReuniaoCAE } from '../../types';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  CalendarPlus, 
  Download, 
  ShieldCheck, 
  Award, 
  FileText, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Clock, 
  X, 
  Check,
  Building,
  GraduationCap,
  HeartHandshake
} from 'lucide-react';

export const CaeColegiadoAtas: React.FC = () => {
  const { 
    municipio, 
    membrosCae, 
    reunioesCae, 
    addMembroCae, 
    updateMembroCae, 
    agendarReuniaoCae 
  } = usePNAE();

  const [activeSubTab, setActiveSubTab] = useState<'MEMBROS' | 'REUNIOES'>('MEMBROS');
  const [showAddMembroModal, setShowAddMembroModal] = useState(false);
  const [showAddReuniaoModal, setShowAddReuniaoModal] = useState(false);

  // Form states for Membro
  const [novoMembro, setNovoMembro] = useState<Omit<MembroCAE, 'id'>>({
    nome: '',
    segmento: 'Professores / Trabalhadores da Educação',
    condicao: 'Titular',
    cargoMesa: 'Conselheiro(a)',
    entidadeRepresentada: '',
    cpf: '',
    email: '',
    telefone: '',
    mandatoInicio: '2024-03-10',
    mandatoFim: '2028-03-09',
    portariaNomeacao: 'Portaria Municipal nº 142/2024',
    status: 'Ativo'
  });

  // Form states for Reuniao
  const [novaReuniao, setNovaReuniao] = useState<Omit<ReuniaoCAE, 'id'>>({
    numeroAta: `Ata Ordinária CAE nº 0${reunioesCae.length + 1}/2026`,
    tipo: 'Ordinária',
    dataHora: new Date().toISOString().slice(0, 16).replace('T', ' '),
    local: 'Sede do CAE / Sala da Secretaria de Educação',
    pauta: '',
    resumoDeliberacoes: '',
    membrosPresentes: [],
    status: 'Realizada'
  });

  const handleExportFicha = () => {
    exportFichaColegiadoCaePDF(membrosCae, municipio);
  };

  const handleSaveMembro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoMembro.nome || !novoMembro.cpf) return;
    addMembroCae(novoMembro);
    setShowAddMembroModal(false);
    setNovoMembro({
      nome: '',
      segmento: 'Professores / Trabalhadores da Educação',
      condicao: 'Titular',
      cargoMesa: 'Conselheiro(a)',
      entidadeRepresentada: '',
      cpf: '',
      email: '',
      telefone: '',
      mandatoInicio: '2024-03-10',
      mandatoFim: '2028-03-09',
      portariaNomeacao: 'Portaria Municipal nº 142/2024',
      status: 'Ativo'
    });
  };

  const handleSaveReuniao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaReuniao.pauta || !novaReuniao.resumoDeliberacoes) return;
    agendarReuniaoCae({
      ...novaReuniao,
      membrosPresentes: novaReuniao.membrosPresentes.length > 0 
        ? novaReuniao.membrosPresentes 
        : membrosCae.slice(0, 4).map(m => `${m.nome} (${m.cargoMesa})`)
    });
    setShowAddReuniaoModal(false);
    setNovaReuniao({
      numeroAta: `Ata Ordinária CAE nº 0${reunioesCae.length + 2}/2026`,
      tipo: 'Ordinária',
      dataHora: new Date().toISOString().slice(0, 16).replace('T', ' '),
      local: 'Sede do CAE / Sala da Secretaria de Educação',
      pauta: '',
      resumoDeliberacoes: '',
      membrosPresentes: [],
      status: 'Realizada'
    });
  };

  const getSegmentoIcon = (segmento: string) => {
    if (segmento.includes('Executivo')) return <Building className="w-4 h-4 text-amber-600" />;
    if (segmento.includes('Professores')) return <GraduationCap className="w-4 h-4 text-blue-600" />;
    if (segmento.includes('Pais')) return <HeartHandshake className="w-4 h-4 text-emerald-600" />;
    return <Users className="w-4 h-4 text-purple-600" />;
  };

  return (
    <div id="cae-colegiado-atas" className="space-y-6 animate-in fade-in duration-300">
      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">
              Colegiado do CAE & Livro de Atas
            </h2>
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {membrosCae.length} Conselheiros Nomeados
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Composição paritária oficial, mandatos, portarias e atas deliberativas do Conselho de Alimentação Escolar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-export-colegiado-pdf"
            onClick={handleExportFicha}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>Exportar Colegiado (PDF)</span>
          </button>

          {activeSubTab === 'MEMBROS' ? (
            <button
              id="btn-novo-conselheiro"
              onClick={() => setShowAddMembroModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Conselheiro</span>
            </button>
          ) : (
            <button
              id="btn-nova-reuniao"
              onClick={() => setShowAddReuniaoModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-xs transition"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Registrar Nova Ata</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Internas: Membros vs Atas */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          onClick={() => setActiveSubTab('MEMBROS')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeSubTab === 'MEMBROS'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quadro de Conselheiros ({membrosCae.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('REUNIOES')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeSubTab === 'REUNIOES'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Atas e Reuniões ({reunioesCae.length})</span>
        </button>
      </div>

      {/* Visualização de Conselheiros */}
      {activeSubTab === 'MEMBROS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {membrosCae.map((membro) => {
              const isPresidente = membro.cargoMesa === 'Presidente';
              const isVice = membro.cargoMesa === 'Vice-Presidente';

              return (
                <div 
                  key={membro.id}
                  className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-indigo-200 transition space-y-3 relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {getSegmentoIcon(membro.segmento)}
                        <span className="text-[10px] font-bold text-stone-500 uppercase">
                          {membro.segmento}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-stone-900">{membro.nome}</h3>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isPresidente 
                        ? 'bg-amber-100 text-amber-900 font-bold border border-amber-200' 
                        : isVice
                        ? 'bg-indigo-100 text-indigo-900 font-bold'
                        : 'bg-stone-100 text-stone-700'
                    }`}>
                      {membro.cargoMesa}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <p><strong>Condição:</strong> {membro.condicao}</p>
                    <p><strong>Entidade:</strong> {membro.entidadeRepresentada}</p>
                    <p><strong>Portaria:</strong> {membro.portariaNomeacao}</p>
                    <p><strong>Vigência:</strong> {formatDate(membro.mandatoInicio)} a {formatDate(membro.mandatoFim)}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-100">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-stone-400" />
                      {membro.telefone}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Mail className="w-3 h-3 text-stone-400" />
                      {membro.email}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visualização de Reuniões e Atas */}
      {activeSubTab === 'REUNIOES' && (
        <div className="space-y-4">
          {reunioesCae.map((reuniao) => (
            <div 
              key={reuniao.id}
              className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded font-mono">
                      {reuniao.numeroAta}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      reuniao.status === 'Realizada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {reuniao.status}
                    </span>
                    <span className="text-xs text-stone-500">
                      Sessão {reuniao.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Data/Hora: <strong>{reuniao.dataHora}</strong> • Local: {reuniao.local}</span>
                  </p>
                </div>

                <span className="text-xs font-semibold text-stone-700">
                  {reuniao.membrosPresentes.length} Conselheiros Presentes
                </span>
              </div>

              <div className="text-xs space-y-3">
                <div>
                  <span className="font-bold text-stone-700 uppercase tracking-wider text-[10px] block mb-1">
                    Pauta da Sessão:
                  </span>
                  <p className="text-stone-800 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    {reuniao.pauta}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-indigo-950 uppercase tracking-wider text-[10px] block mb-1">
                    Deliberações e Pareceres Aprovados:
                  </span>
                  <p className="text-stone-800 bg-indigo-50/40 p-3 rounded-lg border border-indigo-100 leading-relaxed italic">
                    "{reuniao.resumoDeliberacoes}"
                  </p>
                </div>

                {reuniao.membrosPresentes.length > 0 && (
                  <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                    <strong>Assinaram a Ata:</strong> {reuniao.membrosPresentes.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastrar Conselheiro */}
      {showAddMembroModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">Cadastrar Conselheiro do CAE</h3>
              <button onClick={() => setShowAddMembroModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMembro} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Nome Completo:</label>
                <input
                  type="text"
                  required
                  value={novoMembro.nome}
                  onChange={e => setNovoMembro({...novoMembro, nome: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Profª. Maria Clara da Silva"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Segmento Representado:</label>
                  <select
                    value={novoMembro.segmento}
                    onChange={e => setNovoMembro({...novoMembro, segmento: e.target.value as any})}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Poder Executivo">Poder Executivo</option>
                    <option value="Professores / Trabalhadores da Educação">Professores / Trabalhadores da Educação</option>
                    <option value="Pais de Alunos">Pais de Alunos</option>
                    <option value="Sociedade Civil Organizada">Sociedade Civil Organizada</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Condição:</label>
                  <select
                    value={novoMembro.condicao}
                    onChange={e => setNovoMembro({...novoMembro, condicao: e.target.value as any})}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Titular">Titular</option>
                    <option value="Suplente">Suplente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Cargo na Mesa Diretora:</label>
                  <select
                    value={novoMembro.cargoMesa}
                    onChange={e => setNovoMembro({...novoMembro, cargoMesa: e.target.value as any})}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Presidente">Presidente</option>
                    <option value="Vice-Presidente">Vice-Presidente</option>
                    <option value="Secretário(a)">Secretário(a)</option>
                    <option value="Relator(a)">Relator(a)</option>
                    <option value="Conselheiro(a)">Conselheiro(a)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Entidade / Associação:</label>
                  <input
                    type="text"
                    required
                    value={novoMembro.entidadeRepresentada}
                    onChange={e => setNovoMembro({...novoMembro, entidadeRepresentada: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                    placeholder="Ex: APM Escola Central"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">CPF:</label>
                  <input
                    type="text"
                    required
                    value={novoMembro.cpf}
                    onChange={e => setNovoMembro({...novoMembro, cpf: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Telefone:</label>
                  <input
                    type="text"
                    value={novoMembro.telefone}
                    onChange={e => setNovoMembro({...novoMembro, telefone: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Email:</label>
                  <input
                    type="email"
                    value={novoMembro.email}
                    onChange={e => setNovoMembro({...novoMembro, email: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                    placeholder="email@dominio.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddMembroModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-semibold"
                >
                  Salvar Conselheiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Ata */}
      {showAddReuniaoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">Registrar Ata de Sessão CAE</h3>
              <button onClick={() => setShowAddReuniaoModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReuniao} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Nº do Livro / Ata:</label>
                  <input
                    type="text"
                    required
                    value={novaReuniao.numeroAta}
                    onChange={e => setNovaReuniao({...novaReuniao, numeroAta: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Tipo de Sessão:</label>
                  <select
                    value={novaReuniao.tipo}
                    onChange={e => setNovaReuniao({...novaReuniao, tipo: e.target.value as any})}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  >
                    <option value="Ordinária">Ordinária</option>
                    <option value="Extraordinária">Extraordinária</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Data e Hora:</label>
                  <input
                    type="text"
                    required
                    value={novaReuniao.dataHora}
                    onChange={e => setNovaReuniao({...novaReuniao, dataHora: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Local da Reunião:</label>
                  <input
                    type="text"
                    required
                    value={novaReuniao.local}
                    onChange={e => setNovaReuniao({...novaReuniao, local: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Pauta Convocatória:</label>
                <textarea
                  rows={2}
                  required
                  value={novaReuniao.pauta}
                  onChange={e => setNovaReuniao({...novaReuniao, pauta: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  placeholder="Ex: 1. Apreciação das compras da AF; 2. Análise dos cardápios..."
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Resumo das Deliberações:</label>
                <textarea
                  rows={3}
                  required
                  value={novaReuniao.resumoDeliberacoes}
                  onChange={e => setNovaReuniao({...novaReuniao, resumoDeliberacoes: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  placeholder="Ex: Aprovada por unanimidade a prestação de contas..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddReuniaoModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-semibold"
                >
                  Salvar Ata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

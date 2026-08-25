import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { mockUsers } from '../../data/mockData';
import { RoleBadge } from '../layout/RoleBadge';
import { UserRole, UserProfile } from '../../types';
import { Users, Plus, Shield, CheckCircle2, Mail, Phone, Lock } from 'lucide-react';

export const UsuariosManager: React.FC = () => {
  const { switchRole } = usePNAE();
  const [usersList, setUsersList] = useState<UserProfile[]>(mockUsers);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState<UserRole>('NUTRICIONISTA');
  const [cargo, setCargo] = useState('');
  const [crn, setCrn] = useState('');
  const [dapCaf, setDapCaf] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: nome,
      email,
      cpf,
      role,
      cargo,
      crn: role === 'NUTRICIONISTA' ? crn : undefined,
      fornecedorDapCaf: role === 'FORNECEDOR' ? dapCaf : undefined,
    };
    setUsersList(prev => [...prev, newUser]);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            Gestão de Usuários e Controle de Acesso (RBAC)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Perfis do Supabase Auth com RLS configurado: Admin, Nutricionista, Escola, Fornecedor e Conselho CAE.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Grid de Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {usersList.map(u => (
          <div key={u.id} className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center font-bold text-sm text-stone-700">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-900 leading-tight">{u.name}</h3>
                    <p className="text-[11px] text-stone-500">{u.cargo || 'Membro do Sistema'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <RoleBadge role={u.role} />
              </div>

              <div className="mt-3 space-y-1 text-xs text-stone-600">
                <div className="flex items-center gap-1.5 text-stone-500">
                  <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">{u.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-500 font-mono text-[11px]">
                  <span>CPF: {u.cpf}</span>
                </div>
                {u.crn && (
                  <p className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded inline-block mt-1">
                    Registro RT: {u.crn}
                  </p>
                )}
                {u.fornecedorDapCaf && (
                  <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded inline-block mt-1 font-mono">
                    DAP/CAF: {u.fornecedorDapCaf}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ativo
              </span>
              <button
                onClick={() => switchRole(u.role)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition"
              >
                Alternar para este usuário →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Usuário */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Cadastrar Usuário</h3>
            <p className="text-xs text-stone-500 mt-0.5">Criar perfil com credenciais e permissões RLS</p>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">CPF</label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={e => setCpf(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Perfil de Acesso (Role)</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                >
                  <option value="ADMIN">ADMIN (Gestor Municipal / Coordenador)</option>
                  <option value="NUTRICIONISTA">NUTRICIONISTA (Responsável Técnica RT)</option>
                  <option value="ESCOLA">ESCOLA (Diretor / Responsável Merenda)</option>
                  <option value="FORNECEDOR">FORNECEDOR (Agricultor Familiar / DAP)</option>
                  <option value="CAE">CAE (Conselho de Alimentação Escolar)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Cargo / Função</label>
                <input
                  type="text"
                  placeholder="Ex: Diretora Geral, Nutricionista RT..."
                  value={cargo}
                  onChange={e => setCargo(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              {role === 'NUTRICIONISTA' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Registro no CRN</label>
                  <input
                    type="text"
                    placeholder="Ex: CRN-2 / 14892"
                    value={crn}
                    onChange={e => setCrn(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              )}

              {role === 'FORNECEDOR' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Número da DAP/CAF</label>
                  <input
                    type="text"
                    placeholder="Ex: CAF-RS-2026-998821"
                    value={dapCaf}
                    onChange={e => setDapCaf(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono"
                  />
                </div>
              )}

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
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

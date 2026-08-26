import React, { useEffect, useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { RoleBadge } from '../layout/RoleBadge';
import {
  PERFIS_DISPONIVEIS,
  cadastrarUsuario,
  atualizarUsuario,
  excluirUsuario,
  listarUsuarios,
  UsuarioListagem,
} from '../../lib/gestaoUsuarios';
import { UserRole } from '../../types';
import {
  Users,
  UserPlus,
  Mail,
  Lock,
  Phone,
  IdCard,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  School,
  Briefcase,
  Info,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

function formatarCpf(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  let resultado = digitos;
  if (digitos.length > 9) {
    resultado = `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
  } else if (digitos.length > 6) {
    resultado = `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  } else if (digitos.length > 3) {
    resultado = `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  }
  return resultado;
}

export const GestaoUsuariosSection: React.FC = () => {
  const { escolas, addAuditoriaLog } = usePNAE();

  const [usuarios, setUsuarios] = useState<UsuarioListagem[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(true);

  const [perfilSelecionado, setPerfilSelecionado] = useState<UserRole>('ADMIN');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState('');
  const [escolaId, setEscolaId] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState<{ origem: 'supabase' | 'local' } | null>(null);
  const [erro, setErro] = useState('');

  // Estado do modal de edição
  const [editando, setEditando] = useState<UsuarioListagem | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSenha, setEditSenha] = useState('');
  const [editMostrarSenha, setEditMostrarSenha] = useState(false);
  const [editPerfil, setEditPerfil] = useState<UserRole>('ESCOLA');
  const [editCpf, setEditCpf] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editCargo, setEditCargo] = useState('');
  const [editEscolaId, setEditEscolaId] = useState('');
  const [editAtivo, setEditAtivo] = useState(true);
  const [editEnviando, setEditEnviando] = useState(false);
  const [editErro, setEditErro] = useState('');

  // Estado do modal de exclusão
  const [excluindo, setExcluindo] = useState<UsuarioListagem | null>(null);
  const [excluirEnviando, setExcluirEnviando] = useState(false);
  const [excluirErro, setExcluirErro] = useState('');

  const carregarLista = async () => {
    setCarregandoLista(true);
    try {
      setUsuarios(await listarUsuarios());
    } finally {
      setCarregandoLista(false);
    }
  };

  useEffect(() => {
    carregarLista();
  }, []);

  const limparFormulario = () => {
    setNome('');
    setEmail('');
    setSenha('');
    setCpf('');
    setTelefone('');
    setCargo('');
    setEscolaId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso(null);
    setEnviando(true);

    try {
      const resultado = await cadastrarUsuario({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        role: perfilSelecionado,
        cpf,
        telefone: telefone.trim() || undefined,
        cargo: cargo.trim() || undefined,
        escolaId: escolaId || undefined,
      });

      if (!resultado.success) {
        setErro(resultado.error || 'Não foi possível cadastrar o usuário.');
        return;
      }

      setSucesso({ origem: resultado.origem });
      addAuditoriaLog(
        'Cadastro de Usuário com Perfil',
        'Usuários e Perfis de Acesso',
        `Usuário ${nome.trim()} (${email.trim()}) cadastrado com perfil ${perfilSelecionado} via Supabase Auth`
      );
      limparFormulario();
      await carregarLista();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado ao cadastrar.');
    } finally {
      setEnviando(false);
    }
  };

  const abrirEdicao = (usuario: UsuarioListagem) => {
    setEditando(usuario);
    setEditNome(usuario.name);
    setEditEmail(usuario.email);
    setEditSenha('');
    setEditMostrarSenha(false);
    setEditPerfil(usuario.role);
    setEditCpf(usuario.cpf || '');
    setEditTelefone(usuario.telefone || '');
    setEditCargo(usuario.cargo || '');
    setEditEscolaId(usuario.escolaId || '');
    setEditAtivo(usuario.ativo);
    setEditErro('');
  };

  const handleEditarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    setEditErro('');
    setEditEnviando(true);

    try {
      const resultado = await atualizarUsuario({
        id: editando.id,
        nome: editNome.trim(),
        email: editEmail.trim(),
        senha: editSenha,
        role: editPerfil,
        cpf: editCpf,
        telefone: editTelefone.trim() || undefined,
        cargo: editCargo.trim() || undefined,
        escolaId: editEscolaId || undefined,
        ativo: editAtivo,
      });

      if (!resultado.success) {
        setEditErro(resultado.error || 'Não foi possível atualizar o usuário.');
        return;
      }

      addAuditoriaLog(
        'Edição de Usuário',
        'Usuários e Perfis de Acesso',
        `Usuário ${editNome.trim()} (${editEmail.trim()}) atualizado com perfil ${editPerfil}`
      );
      setEditando(null);
      await carregarLista();
    } catch (err) {
      setEditErro(err instanceof Error ? err.message : 'Erro inesperado ao atualizar.');
    } finally {
      setEditEnviando(false);
    }
  };

  const handleExcluirConfirm = async () => {
    if (!excluindo) return;
    setExcluirErro('');
    setExcluirEnviando(true);

    try {
      const resultado = await excluirUsuario(excluindo.id);
      if (!resultado.success) {
        setExcluirErro(resultado.error || 'Não foi possível excluir o usuário.');
        return;
      }

      addAuditoriaLog(
        'Exclusão de Usuário',
        'Usuários e Perfis de Acesso',
        `Usuário ${excluindo.name} (${excluindo.email}) excluído do sistema`
      );
      setExcluindo(null);
      await carregarLista();
    } catch (err) {
      setExcluirErro(err instanceof Error ? err.message : 'Erro inesperado ao excluir.');
    } finally {
      setExcluirEnviando(false);
    }
  };

  const perfilInfo = PERFIS_DISPONIVEIS.find(p => p.value === perfilSelecionado);

  const inputClass =
    'w-full px-3.5 py-2.5 text-xs bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* FORMULÁRIO DE CADASTRO */}
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4"
        >
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-700" />
              Cadastrar Novo Usuário
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              O usuário recebe acesso imediato ao painel correspondente ao seu perfil.
            </p>
          </div>

          {/* Seleção de Perfil */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Perfil de Acesso *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PERFIS_DISPONIVEIS.map(perfil => (
                <button
                  key={perfil.value}
                  type="button"
                  onClick={() => setPerfilSelecionado(perfil.value)}
                  className={`p-2.5 rounded-xl border text-left transition ${perfilSelecionado === perfil.value
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                      : 'bg-white border-stone-200 hover:border-emerald-300'
                    }`}
                >
                  <span className={`block text-[11px] font-bold ${perfilSelecionado === perfil.value ? 'text-emerald-900' : 'text-stone-800'
                    }`}>
                    {perfil.label}
                  </span>
                  <span className="block text-[10px] text-stone-500 leading-snug mt-0.5">
                    {perfil.descricao}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Escola (quando perfil ESCOLA) */}
          {perfilSelecionado === 'ESCOLA' && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Unidade Escolar Vinculada *
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  required
                  value={escolaId}
                  onChange={e => setEscolaId(e.target.value)}
                  className={`${inputClass} pl-9 appearance-none`}
                >
                  <option value="">Selecione a escola...</option>
                  {escolas.map(esc => (
                    <option key={esc.id} value={esc.id}>
                      {esc.nome} (INEP {esc.codigoInep})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: João da Silva"
              className={inputClass}
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail de Acesso *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@santaclara.rs.gov.br"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          {/* Senha provisória */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Senha Provisória * <span className="font-normal text-stone-500">(mínimo 6 caracteres)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type={mostrarSenha ? 'text' : 'password'}
                required
                minLength={6}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                className={`${inputClass} pl-9 pr-10`}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(prev => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={-1}
              >
                {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* CPF + Telefone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">CPF *</label>
              <div className="relative">
                <IdCard className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  value={cpf}
                  onChange={e => setCpf(formatarCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className={`${inputClass} pl-9 font-mono`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Telefone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Cargo / Função</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                placeholder={cargoPlaceholder(perfilSelecionado)}
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          {/* Feedbacks */}
          {erro && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          {sucesso && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Usuário cadastrado no Supabase Auth com o perfil selecionado! Já é possível acessar o sistema.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {enviando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cadastrando...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar Usuário</span>
              </>
            )}
          </button>
        </form>

        {/* LISTA DE USUÁRIOS */}
        <div className="xl:col-span-7 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                Usuários do Sistema ({usuarios.length})
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Perfis com acesso ativo ao ERP PNAE municipal.
              </p>
            </div>
          </div>

          {carregandoLista ? (
            <div className="flex items-center justify-center py-10 text-stone-400 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando usuários...
            </div>
          ) : usuarios.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-8">Nenhum usuário encontrado.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">Usuário</th>
                    <th className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">Perfil</th>
                    <th className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">CPF</th>
                    <th className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">Status</th>
                    <th className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => {
                    const escolaVinculada = u.escolaId ? escolas.find(e => e.id === u.escolaId) : null;
                    return (
                      <tr key={`${u.origem}-${u.id}`} className="border-b border-stone-100 last:border-0">
                        <td className="px-2 py-2.5">
                          <span className="block text-xs font-semibold text-stone-900">{u.name}</span>
                          <span className="block text-[11px] text-stone-500">{u.email}</span>
                          {(u.cargo || escolaVinculada) && (
                            <span className="block text-[10px] text-stone-400">
                              {[u.cargo, escolaVinculada ? escolaVinculada.nome : null].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2.5">
                          <RoleBadge role={u.role} size="sm" />
                        </td>
                        <td className="px-2 py-2.5 text-[11px] text-stone-600 font-mono whitespace-nowrap">{u.cpf}</td>
                        <td className="px-2 py-2.5">
                          <span
                            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                              u.ativo
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-600 border-red-200'
                            }`}
                          >
                            {u.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => abrirEdicao(u)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 text-[11px] font-semibold hover:bg-stone-50 hover:text-emerald-700 transition"
                              title="Editar usuário"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => { setExcluirErro(''); setExcluindo(u); }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 text-[11px] font-semibold hover:bg-red-50 transition"
                              title="Excluir usuário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Cadastros reais exigem a variável <strong>SUPABASE_SERVICE_ROLE_KEY</strong> nas serverless functions (Vercel) — nunca exponha esta chave no frontend.
              Perfis permitidos: Gestor (ADMIN), Nutricionista RT, Direção da Escola e Conselho CAE.
            </span>
          </div>
        </div>

      </div>

      {/* MODAL EDITAR USUÁRIO */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { if (!editEnviando) setEditando(null); }}>
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-emerald-700" />
                  Editar Usuário
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Atualize os dados, perfil de acesso ou senha do usuário.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditando(null)}
                disabled={editEnviando}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition disabled:opacity-50"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditarSubmit} className="mt-4 space-y-3">
              {/* Seleção de Perfil */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Perfil de Acesso *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PERFIS_DISPONIVEIS.map(perfil => (
                    <button
                      key={perfil.value}
                      type="button"
                      onClick={() => setEditPerfil(perfil.value)}
                      className={`p-2 rounded-xl border text-left transition ${editPerfil === perfil.value
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                          : 'bg-white border-stone-200 hover:border-emerald-300'
                        }`}
                    >
                      <span className={`block text-[11px] font-bold ${editPerfil === perfil.value ? 'text-emerald-900' : 'text-stone-800'
                        }`}>
                        {perfil.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Escola (quando perfil ESCOLA) */}
              {editPerfil === 'ESCOLA' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Unidade Escolar Vinculada *
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                    <select
                      required
                      value={editEscolaId}
                      onChange={e => setEditEscolaId(e.target.value)}
                      className={`${inputClass} pl-9 appearance-none`}
                    >
                      <option value="">Selecione a escola...</option>
                      {escolas.map(esc => (
                        <option key={esc.id} value={esc.id}>
                          {esc.nome} (INEP {esc.codigoInep})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={editNome}
                  onChange={e => setEditNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail de Acesso *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="usuario@santaclara.rs.gov.br"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nova Senha <span className="font-normal text-stone-500">(deixe em branco para manter)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={editMostrarSenha ? 'text' : 'password'}
                    minLength={6}
                    value={editSenha}
                    onChange={e => setEditSenha(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pl-9 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setEditMostrarSenha(prev => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                    aria-label={editMostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={-1}
                  >
                    {editMostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">CPF *</label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      value={editCpf}
                      onChange={e => setEditCpf(formatarCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      className={`${inputClass} pl-9 font-mono`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Telefone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={editTelefone}
                      onChange={e => setEditTelefone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Cargo / Função</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={editCargo}
                    onChange={e => setEditCargo(e.target.value)}
                    placeholder={cargoPlaceholder(editPerfil)}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              {/* Status ativo */}
              <div className="flex items-center justify-between rounded-xl border border-stone-200 p-3">
                <div>
                  <span className="block text-xs font-semibold text-stone-700">Usuário Ativo</span>
                  <span className="block text-[11px] text-stone-500">
                    Inativos não conseguem acessar o sistema.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditAtivo(prev => !prev)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${editAtivo ? 'bg-emerald-600' : 'bg-stone-300'}`}
                  aria-pressed={editAtivo}
                  aria-label="Alternar status ativo"
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${editAtivo ? 'left-[22px]' : 'left-0.5'}`}
                  />
                </button>
              </div>

              {editErro && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editErro}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  disabled={editEnviando}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-50 transition disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editEnviando}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {editEnviando ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR USUÁRIO */}
      {excluindo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { if (!excluirEnviando) setExcluindo(null); }}>
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900 text-center mt-3">Excluir Usuário</h3>
            <p className="text-xs text-stone-500 text-center mt-1 leading-relaxed">
              Tem certeza que deseja excluir <strong>{excluindo.name}</strong> ({excluindo.email})?
              <br />
              Esta ação remove o acesso e não pode ser desfeita.
            </p>

            {excluirErro && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{excluirErro}</span>
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setExcluindo(null)}
                disabled={excluirEnviando}
                className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-50 transition disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExcluirConfirm}
                disabled={excluirEnviando}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {excluirEnviando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function cargoPlaceholder(role: UserRole): string {
  switch (role) {
    case 'ADMIN': return 'Ex: Coordenador de Alimentação Escolar';
    case 'NUTRICIONISTA': return 'Ex: Nutricionista Responsável Técnica (CRN)';
    case 'ESCOLA': return 'Ex: Diretor(a) Escolar';
    case 'CAE': return 'Ex: Presidente do CAE';
    default: return 'Cargo / Função';
  }
}

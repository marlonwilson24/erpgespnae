pimport React, { useEffect, useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { RoleBadge } from '../layout/RoleBadge';
import {
  PERFIS_DISPONIVEIS,
  cadastrarUsuario,
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
              <table className="w-full text-left min-w-[520px]">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">Usuário</th>
                    <th className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">Perfil</th>
                    <th className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">CPF</th>
                    <th className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">Origem</th>
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
                          <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">
                            Supabase Auth
                          </span>
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

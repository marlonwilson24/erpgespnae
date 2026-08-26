import { supabase } from './supabase';
import { UserProfile, UserRole } from '../types';

interface PerfilSupabaseRow {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  cpf: string;
  telefone: string | null;
  municipio_id: string | null;
  escola_id: string | null;
  crn: string | null;
  dap_caf: string | null;
  cargo: string | null;
}

const ROLES_VALIDOS: UserRole[] = ['ADMIN', 'NUTRICIONISTA', 'ESCOLA', 'FORNECEDOR', 'CAE'];

export function traduzirErroAuth(mensagem: string): string {
  if (mensagem.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
  }
  if (mensagem.includes('Email not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
  }
  if (mensagem.toLowerCase().includes('rate limit')) {
    return 'Muitas tentativas de acesso. Aguarde alguns instantes e tente novamente.';
  }
  if (mensagem.includes('User not found')) {
    return 'Usuário não localizado. Procure o gestor municipal para cadastro.';
  }
  if (mensagem.includes('Failed to fetch')) {
    return 'Falha de conexão com o servidor Supabase. Verifique sua internet ou as variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.';
  }
  return mensagem;
}

export async function entrarComSenha(
  email: string,
  senha: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) {
    return { success: false, error: traduzirErroAuth(error.message) };
  }
  return { success: true };
}

export async function enviarLinkRecuperacao(email: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`,
  });
  if (error) {
    return { success: false, error: traduzirErroAuth(error.message) };
  }
  return { success: true };
}

function mapearPerfil(row: PerfilSupabaseRow): UserProfile {
  return {
    id: row.id,
    name: row.nome,
    email: row.email,
    role: ROLES_VALIDOS.includes(row.role) ? row.role : 'ESCOLA',
    cpf: row.cpf || '000.000.000-00',
    municipioId: row.municipio_id ?? undefined,
    escolaId: row.escola_id ?? undefined,
    crn: row.crn ?? undefined,
    fornecedorDapCaf: row.dap_caf ?? undefined,
    cargo: row.cargo ?? undefined,
    telefone: row.telefone ?? undefined,
  };
}

/**
 * Carrega o perfil do usuário autenticado na tabela public.perfis_usuarios.
 */
export async function carregarPerfil(usuarioId: string, email: string): Promise<UserProfile> {
  try {
    const { data, error } = await supabase
      .from('perfis_usuarios')
      .select('*')
      .eq('id', usuarioId)
      .maybeSingle();

    if (!error && data) {
      return mapearPerfil(data as PerfilSupabaseRow);
    }
  } catch {
    /* tabela inexistente ou sem permissão */
  }

  return {
    id: usuarioId,
    name: email.split('@')[0] || 'Usuário',
    email,
    role: 'ESCOLA',
    cpf: '000.000.000-00',
    cargo: 'Perfil não vinculado',
  };
}

export async function encerrarSessao(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    /* ignore */
  }
}

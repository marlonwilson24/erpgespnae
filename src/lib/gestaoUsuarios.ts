import { UserRole } from '../types';
import { chamarApiJson } from './apiClient';

const ROLES_PERMITIDOS: UserRole[] = ['ADMIN', 'NUTRICIONISTA', 'ESCOLA', 'CAE'];

export interface NovoUsuarioInput {
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
  cpf: string;
  telefone?: string;
  cargo?: string;
  escolaId?: string;
}

export interface AtualizarUsuarioInput {
  id: string;
  nome?: string;
  email?: string;
  senha?: string;
  role?: UserRole;
  cpf?: string;
  telefone?: string;
  cargo?: string;
  escolaId?: string;
  ativo?: boolean;
}

export interface UsuarioListagem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cpf?: string;
  telefone?: string;
  cargo?: string;
  escolaId?: string;
  ativo: boolean;
  origem: 'supabase' | 'demonstracao';
}

export const PERFIS_DISPONIVEIS: { value: UserRole; label: string; descricao: string }[] = [
  { value: 'ADMIN', label: 'Gestor Municipal (ADMIN)', descricao: 'Visão completa: aprovações, contratos, escolas e usuários' },
  { value: 'NUTRICIONISTA', label: 'Nutricionista RT', descricao: 'Cardápios, cálculo nutricional e projeção de compras' },
  { value: 'ESCOLA', label: 'Direção da Escola', descricao: 'Recebimento de entregas (AF), despensa e estoque' },
  { value: 'CAE', label: 'Conselheiro CAE', descricao: 'Fiscalização, controle social e parecer conclusivo' },
];

function lerLocais(): UsuarioListagem[] {
  return [];
}

function salvarLocal(usuario: UsuarioListagem): void {
  void usuario;
}

export async function cadastrarUsuario(
  input: NovoUsuarioInput
): Promise<{ success: boolean; error?: string; origem: 'supabase' | 'local' }> {
  if (!ROLES_PERMITIDOS.includes(input.role)) {
    return { success: false, error: 'Perfil inválido.', origem: 'local' };
  }

  if (!input.nome?.trim() || !input.email?.trim() || !input.senha || !input.cpf?.trim()) {
    return { success: false, error: 'Preencha todos os campos obrigatórios.', origem: 'local' };
  }

  if (input.senha.length < 6) {
    return { success: false, error: 'A senha provisória deve ter no mínimo 6 caracteres.', origem: 'local' };
  }

  // Cadastro real via Supabase (serverless function com service role)
  try {
    const resposta = await chamarApiJson<{ usuario: UsuarioListagem }>('POST', '/api/admin-usuarios', input);
    if (resposta.ok) {
      return { success: true, origem: 'supabase' };
    }
    if ('error' in resposta) {
      return { success: false, error: resposta.error, origem: 'supabase' };
    }
    return { success: false, error: 'Erro desconhecido ao cadastrar.', origem: 'supabase' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha de conexão com o servidor Supabase.', origem: 'supabase' };
  }
}


export async function listarUsuarios(): Promise<UsuarioListagem[]> {
  let supabaseUsuarios: UsuarioListagem[] = [];
  try {
    const resposta = await chamarApiJson<{ usuarios: UsuarioListagem[] }>('GET', '/api/admin-usuarios');
    if (resposta.ok) {
      supabaseUsuarios = resposta.data.usuarios.map(u => ({ ...u, origem: 'supabase' as const }));
    }
  } catch {
    /* sem sessão ou endpoint indisponível */
  }

  return supabaseUsuarios;
}

export async function atualizarUsuario(
  input: AtualizarUsuarioInput
): Promise<{ success: boolean; error?: string; origem: 'supabase' | 'local' }> {
  if (!input.id) {
    return { success: false, error: 'Informe o usuário a ser atualizado.', origem: 'local' };
  }

  if (input.role && !ROLES_PERMITIDOS.includes(input.role)) {
    return { success: false, error: 'Perfil inválido.', origem: 'local' };
  }

  if (input.senha !== undefined && input.senha !== '' && input.senha.length < 6) {
    return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.', origem: 'local' };
  }

  try {
    const resposta = await chamarApiJson<{ usuario: UsuarioListagem }>('PUT', '/api/admin-usuarios', input);
    if (resposta.ok) {
      return { success: true, origem: 'supabase' };
    }
    if ('error' in resposta) {
      return { success: false, error: resposta.error, origem: 'supabase' };
    }
    return { success: false, error: 'Erro desconhecido ao atualizar.', origem: 'supabase' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha de conexão com o servidor Supabase.', origem: 'supabase' };
  }
}

export async function excluirUsuario(
  id: string
): Promise<{ success: boolean; error?: string; origem: 'supabase' | 'local' }> {
  if (!id) {
    return { success: false, error: 'Informe o usuário a ser excluído.', origem: 'local' };
  }

  try {
    const resposta = await chamarApiJson<{ sucesso: boolean }>('DELETE', '/api/admin-usuarios', { id });
    if (resposta.ok) {
      return { success: true, origem: 'supabase' };
    }
    if ('error' in resposta) {
      return { success: false, error: resposta.error, origem: 'supabase' };
    }
    return { success: false, error: 'Erro desconhecido ao excluir.', origem: 'supabase' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha de conexão com o servidor Supabase.', origem: 'supabase' };
  }
}

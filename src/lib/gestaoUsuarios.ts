import { UserRole } from '../types';
import { mockUsers } from '../data/mockData';
import { chamarApiJson } from './apiClient';

const LS_KEY = 'pnae_erp_v2_usuariosLocais';
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
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function salvarLocal(usuario: UsuarioListagem): void {
  const locais = lerLocais();
  locais.unshift(usuario);
  localStorage.setItem(LS_KEY, JSON.stringify(locais));
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

  const emailNormalizado = input.email.trim().toLowerCase();

  const duplicado = [...lerLocais(), ...mockUsers].some(
    u => u.email.toLowerCase() === emailNormalizado ||
         (u.cpf || '').replace(/\D/g, '') === input.cpf.replace(/\D/g, '')
  );
  if (duplicado) {
    return { success: false, error: 'Já existe um usuário com este e-mail ou CPF.', origem: 'local' };
  }

  // Tenta cadastro real via Supabase (serverless function com service role)
  try {
    const resposta = await chamarApiJson<{ usuario: UsuarioListagem }>('POST', '/api/admin-usuarios', input);
    if (resposta.ok) {
      return { success: true, origem: 'supabase' };
    }
    if ('error' in resposta) {
      return { success: false, error: resposta.error, origem: 'supabase' };
    }
    return { success: false, error: 'Erro desconhecido ao cadastrar.', origem: 'supabase' };
  } catch {
    // Sem sessão Supabase ou endpoint não configurado: registra em modo demonstração
    salvarLocal({
      id: `usr-local-${Date.now()}`,
      name: input.nome.trim(),
      email: emailNormalizado,
      role: input.role,
      cpf: input.cpf,
      telefone: input.telefone,
      cargo: input.cargo,
      escolaId: input.role === 'ESCOLA' ? input.escolaId : undefined,
      ativo: true,
      origem: 'demonstracao',
    });
    return { success: true, origem: 'local' };
  }
}

export async function listarUsuarios(): Promise<UsuarioListagem[]> {
  const locais = lerLocais();
  const demo = mockUsers.map<UsuarioListagem>(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    cpf: u.cpf,
    telefone: u.telefone,
    cargo: u.cargo,
    escolaId: u.escolaId,
    ativo: true,
    origem: 'demonstracao',
  }));

  let supabaseUsuarios: UsuarioListagem[] = [];
  try {
    const resposta = await chamarApiJson<{ usuarios: UsuarioListagem[] }>('GET', '/api/admin-usuarios');
    if (resposta.ok) {
      supabaseUsuarios = resposta.data.usuarios.map(u => ({ ...u, origem: 'supabase' as const }));
    }
  } catch {
    /* modo demonstração */
  }

  const vistos = new Set<string>();
  return [supabaseUsuarios, locais, demo]
    .flat()
    .filter(u => {
      const chave = u.email.toLowerCase();
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
}

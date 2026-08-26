import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function getServiceClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_JWT_SECRET;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}


export interface FalhaAutorizacao {
  status: number;
  error: string;
}

/**
 * Valida o JWT do chamador e exige perfil ADMIN em perfis_usuarios.
 * Usa o service client (bypassa RLS) apenas no servidor.
 */
export async function exigirAdmin(
  service: SupabaseClient,
  authHeader?: string
): Promise<{ ok: true } | FalhaAutorizacao> {
  const token = (authHeader || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    return { status: 401, error: 'Autenticação necessária.' };
  }

  let data;
  try {
    const resposta = await service.auth.getUser(token);
    data = resposta.data;
    if (resposta.error || !resposta.data?.user) {
      return { status: 401, error: 'Sessão inválida ou expirada.' };
    }
  } catch {
    return { status: 401, error: 'Sessão inválida ou expirada.' };
  }

  let perfil;
  try {
    const { data: perfilRow, error: perfilError } = await service
      .from('perfis_usuarios')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();
    if (perfilError || !perfilRow) return { status: 403, error: 'Perfil não encontrado.' };
    perfil = perfilRow;
  } catch {
    return { status: 403, error: 'Perfil não encontrado.' };
  }

  if (perfil.role !== 'ADMIN') {
    return { status: 403, error: 'Apenas Gestores Municipais (ADMIN) podem realizar esta operação.' };
  }

  return { ok: true };
}

export function traduzirErroSupabase(message: string): string {
  if (message.toLowerCase().includes('already') && message.toLowerCase().includes('registered')) {
    return 'Já existe um usuário cadastrado com este e-mail.';
  }
  if (message.includes('duplicate key') || message.includes('23505')) {
    return 'Registro duplicado: verifique se o CPF, e-mail ou código IBGE informado já não está em uso.';
  }
  if (message.toLowerCase().includes('password')) {
    return 'A senha deve ter no mínimo 6 caracteres.';
  }
  if (message.toLowerCase().includes('invalid') && message.toLowerCase().includes('email')) {
    return 'E-mail inválido. Verifique o formato digitado.';
  }
  return message;
}

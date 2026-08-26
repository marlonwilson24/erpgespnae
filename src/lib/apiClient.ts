import { supabase } from './supabase';

export type ApiResultado<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

async function obterTokenSessao(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Chama uma serverless function da Vercel enviando o JWT da sessão Supabase.
 * Lança erro quando não há sessão ou o endpoint não está disponível
 * (permindo fallback para modo demonstração no chamador).
 */
export async function chamarApiJson<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<ApiResultado<T>> {
  const token = await obterTokenSessao();
  if (!token) throw new Error('sem-sessao');

  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Endpoint indisponível (fallback SPA do servidor de desenvolvimento)
    throw new Error('endpoint-indisponivel');
  }

  const data = await res.json();
  if (!res.ok) {
    return { ok: false, status: res.status, error: data.error || `Erro ${res.status}.` };
  }
  return { ok: true, data };
}

import { supabase } from '../supabase';
import { Municipio } from '../../types';
import { mapMunicipioFromDB, mapMunicipioToDB } from './mappers';

/**
 * Busca o município da sessão (via RLS por município) ou, quando o perfil não
 * estiver vinculado, o registro mais recente da tabela public.municipios.
 */
export async function buscarMunicipio(municipioId?: string): Promise<Municipio | null> {
  try {
    let query = supabase
      .from('municipios')
      .select('*')
      .order('atualizado_em', { ascending: false })
      .limit(1);

    if (municipioId) {
      const { data, error } = await supabase
        .from('municipios')
        .select('*')
        .eq('id', municipioId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar município no Supabase:', error);
        return null;
      }
      return data ? mapMunicipioFromDB(data) : null;
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return null;
    }
    return mapMunicipioFromDB(data[0]);
  } catch (err) {
    console.error('Erro ao buscar município:', err);
    return null;
  }
}

/**
 * Persiste os dados do município (cadastro básico + Órgão Gestor/EEx) via RLS.
 * Upsert por código IBGE quando o registro ainda não existe no banco.
 */
export async function salvarMunicipio(
  municipio: Partial<Municipio>
): Promise<Municipio | null> {
  const row = mapMunicipioToDB(municipio);

  let query = supabase.from('municipios').upsert(row, { onConflict: 'codigo_ibge' });

  if (row.id) {
    query = query.eq('id', row.id);
  }

  const { data, error } = await query.select().single();

  if (error || !data) {
    console.error('Erro ao salvar município no Supabase:', error);
    throw new Error(error?.message || 'Falha ao salvar dados do município.');
  }

  return mapMunicipioFromDB(data);
}

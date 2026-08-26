import { supabase } from '../supabase';
import { Escola } from '../../types';
import { mapEscolaFromDB, mapEscolaToDB } from './mappers';

export async function buscarEscolas(municipioId?: string): Promise<Escola[]> {
  let query = supabase.from('escolas').select('*').order('nome', { ascending: true });

  if (municipioId) {
    query = query.eq('municipio_id', municipioId);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error('Erro ao buscar escolas do Supabase:', error);
    return [];
  }

  return data.map(mapEscolaFromDB);
}

export async function salvarEscola(escolaData: Omit<Escola, 'id'> | Escola): Promise<Escola | null> {
  const row = mapEscolaToDB(escolaData);
  const { data, error } = await supabase
    .from('escolas')
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao salvar escola no Supabase:', error);
    throw new Error(error?.message || 'Falha ao salvar escola no banco.');
  }

  return mapEscolaFromDB(data);
}

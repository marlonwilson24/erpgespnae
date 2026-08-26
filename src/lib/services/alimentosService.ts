import { supabase } from '../supabase';
import { Alimento } from '../../types';
import { mapAlimentoFromDB, mapAlimentoToDB } from './mappers';

export async function buscarAlimentos(): Promise<Alimento[]> {
  const { data, error } = await supabase
    .from('alimentos')
    .select('*')
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error || !data) {
    console.error('Erro ao buscar alimentos do Supabase:', error);
    return [];
  }

  return data.map(mapAlimentoFromDB);
}

export async function salvarAlimento(alimentoData: Omit<Alimento, 'id'> | Alimento): Promise<Alimento | null> {
  const row = mapAlimentoToDB(alimentoData);
  const { data, error } = await supabase
    .from('alimentos')
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao salvar alimento no Supabase:', error);
    throw new Error(error?.message || 'Falha ao salvar alimento no banco.');
  }

  return mapAlimentoFromDB(data);
}

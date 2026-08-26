import { supabase } from '../supabase';
import {
  VisitaCAE,
  MembroCAE,
  ReuniaoCAE,
  ApontamentoOuvidoriaCAE,
} from '../../types';
import {
  mapVisitaCAEFromDB,
  mapVisitaCAEToDB,
  mapMembroCAEFromDB,
  mapMembroCAEToDB,
  mapReuniaoCAEFromDB,
  mapReuniaoCAEToDB,
  mapApontamentoCAEFromDB,
  mapApontamentoCAEToDB,
} from './mappers';

// ==========================================
// VISITAS (FISCALIZAÇÃO IN LOCO)
// ==========================================
export async function buscarVisitasCAE(): Promise<VisitaCAE[]> {
  const { data, error } = await supabase
    .from('visitas_cae')
    .select(`
      *,
      escolas ( nome )
    `)
    .order('data_visita', { ascending: false });

  if (error || !data) {
    console.error('Erro ao buscar visitas CAE no Supabase:', error);
    return [];
  }

  return data.map(mapVisitaCAEFromDB);
}

export async function registrarVisitaCAE(
  visita: Omit<VisitaCAE, 'id'>,
  municipioId?: string
): Promise<VisitaCAE | null> {
  const row = mapVisitaCAEToDB({ ...visita, municipioId });
  const { data, error } = await supabase
    .from('visitas_cae')
    .insert(row)
    .select(`
      *,
      escolas ( nome )
    `)
    .single();

  if (error || !data) {
    console.error('Erro ao registrar visita CAE no Supabase:', error);
    throw new Error(error?.message || 'Falha ao registrar visita CAE.');
  }

  return mapVisitaCAEFromDB(data);
}

// ==========================================
// MEMBROS (QUADRO DE CONSELHEIROS)
// ==========================================
export async function buscarMembrosCAE(): Promise<MembroCAE[]> {
  const { data, error } = await supabase
    .from('membros_cae')
    .select('*')
    .order('nome', { ascending: true });

  if (error || !data) {
    console.error('Erro ao buscar membros CAE no Supabase:', error);
    return [];
  }

  return data.map(mapMembroCAEFromDB);
}

export async function salvarMembroCAE(
  membro: Omit<MembroCAE, 'id'>,
  municipioId?: string
): Promise<MembroCAE | null> {
  const row = mapMembroCAEToDB({ ...membro, municipioId });
  const { data, error } = await supabase
    .from('membros_cae')
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao salvar membro CAE no Supabase:', error);
    throw new Error(error?.message || 'Falha ao salvar membro CAE.');
  }

  return mapMembroCAEFromDB(data);
}

export async function atualizarMembroCAE(
  id: string,
  membro: Partial<MembroCAE>
): Promise<boolean> {
  const { error } = await supabase
    .from('membros_cae')
    .update({
      nome: membro.nome,
      segmento: membro.segmento,
      condicao: membro.condicao,
      cargo_mesa: membro.cargoMesa,
      entidade_representada: membro.entidadeRepresentada,
      cpf: membro.cpf,
      email: membro.email,
      telefone: membro.telefone,
      mandato_inicio: membro.mandatoInicio,
      mandato_fim: membro.mandatoFim,
      portaria_nomeacao: membro.portariaNomeacao,
      status: membro.status,
    })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar membro CAE no Supabase:', error);
    return false;
  }
  return true;
}

// ==========================================
// REUNIÕES / ATAS
// ==========================================
export async function buscarReunioesCAE(): Promise<ReuniaoCAE[]> {
  const { data, error } = await supabase
    .from('reunioes_cae')
    .select('*')
    .order('data_hora', { ascending: false });

  if (error || !data) {
    console.error('Erro ao buscar reuniões CAE no Supabase:', error);
    return [];
  }

  return data.map(mapReuniaoCAEFromDB);
}

export async function agendarReuniaoCAE(
  reuniao: Omit<ReuniaoCAE, 'id'>,
  municipioId?: string
): Promise<ReuniaoCAE | null> {
  const row = mapReuniaoCAEToDB({ ...reuniao, municipioId });
  const { data, error } = await supabase
    .from('reunioes_cae')
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao agendar reunião CAE no Supabase:', error);
    throw new Error(error?.message || 'Falha ao agendar reunião CAE.');
  }

  return mapReuniaoCAEFromDB(data);
}

// ==========================================
// OUVIDORIA
// ==========================================
export async function buscarApontamentosCAE(): Promise<ApontamentoOuvidoriaCAE[]> {
  const { data, error } = await supabase
    .from('apontamentos_ouvidoria_cae')
    .select('*')
    .order('data_registro', { ascending: false });

  if (error || !data) {
    console.error('Erro ao buscar apontamentos CAE no Supabase:', error);
    return [];
  }

  return data.map(mapApontamentoCAEFromDB);
}

export async function registrarApontamentoCAE(
  apontamento: Omit<ApontamentoOuvidoriaCAE, 'id'>,
  municipioId?: string
): Promise<ApontamentoOuvidoriaCAE | null> {
  const row = mapApontamentoCAEToDB({ ...apontamento, municipioId });
  const { data, error } = await supabase
    .from('apontamentos_ouvidoria_cae')
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao registrar apontamento CAE no Supabase:', error);
    throw new Error(error?.message || 'Falha ao registrar apontamento CAE.');
  }

  return mapApontamentoCAEFromDB(data);
}

export async function responderApontamentoCAE(
  id: string,
  resposta: string,
  status: ApontamentoOuvidoriaCAE['status']
): Promise<boolean> {
  const { error } = await supabase
    .from('apontamentos_ouvidoria_cae')
    .update({ resposta_cae: resposta, status })
    .eq('id', id);

  if (error) {
    console.error('Erro ao responder apontamento CAE no Supabase:', error);
    return false;
  }
  return true;
}

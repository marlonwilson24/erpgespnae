import { supabase } from '../supabase';
import { PrestacaoContasPNAE, ParecerCAE, AuditoriaLog } from '../../types';
import {
  mapPrestacaoContasFromDB,
  mapParecerCAEFromDB,
  mapAuditoriaLogFromDB,
} from './mappers';

// ==========================================
// PRESTAÇÃO DE CONTAS PNAE
// ==========================================
export async function buscarPrestacaoContas(municipioId?: string): Promise<PrestacaoContasPNAE | null> {
  let query = supabase
    .from('prestacoes_contas')
    .select(`
      *,
      municipios ( nome )
    `)
    .order('ano_exercicio', { ascending: false })
    .limit(1);

  if (municipioId) {
    query = query.eq('municipio_id', municipioId);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    console.error('Nenhuma prestação de contas no Supabase:', error);
    return null;
  }

  return mapPrestacaoContasFromDB(data[0]);
}

// ==========================================
// PARECERES CAE
// ==========================================
export async function buscarPareceresCAE(): Promise<ParecerCAE[]> {
  const { data, error } = await supabase
    .from('pareceres_cae')
    .select('*')
    .order('assinado_em', { ascending: false });

  if (error || !data) {
    console.error('Erro ao buscar pareceres CAE no Supabase:', error);
    return [];
  }

  return data.map(mapParecerCAEFromDB);
}

export async function emitirParecerCAE(
  parecerData: Omit<ParecerCAE, 'id' | 'assinadoEm'>
): Promise<ParecerCAE | null> {
  const { data, error } = await supabase
    .from('pareceres_cae')
    .insert({
      prestacao_contas_id: parecerData.prestacaoContasId,
      ano_exercicio: parecerData.anoExercicio || new Date().getFullYear(),
      data_reuniao_ata: parecerData.dataReuniaoAta,
      numero_ata: parecerData.numeroAta,
      presidente_cae_nome: parecerData.presidenteCaeNome,
      relator_cae_nome: parecerData.relatorCaeNome,
      resultado_parecer: parecerData.resultadoParecer,
      texto_parecer_conclusivo: parecerData.textoParecerConclusivo,
      recomendacoes_ao_gestor: parecerData.recomendacoesAoGestor || null,
      membros_presentes: parecerData.membrosPresentes || [],
      assinado_em: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao salvar parecer CAE no Supabase:', error);
    throw new Error(error?.message || 'Falha ao registrar parecer CAE.');
  }

  // Atualizar status da Prestação de Contas para Aprovado pelo CAE
  await supabase
    .from('prestacoes_contas')
    .update({
      status_aprovacao: parecerData.resultadoParecer.includes('Favorável')
        ? 'Aprovado pelo CAE'
        : 'Rejeitado',
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', parecerData.prestacaoContasId);

  return mapParecerCAEFromDB(data);
}

// ==========================================
// AUDITORIA LOGS
// ==========================================
export async function buscarAuditoriaLogs(): Promise<AuditoriaLog[]> {
  const { data, error } = await supabase
    .from('auditoria_logs')
    .select('*')
    .order('data_hora', { ascending: false })
    .limit(100);

  if (error || !data) {
    console.error('Erro ao buscar auditoria logs no Supabase:', error);
    return [];
  }

  return data.map(mapAuditoriaLogFromDB);
}

export async function salvarAuditoriaLog(
  acao: string,
  modulo: string,
  detalhes: string,
  usuarioNome?: string,
  usuarioRole?: string
): Promise<void> {
  const { data: usuarioSessao } = await supabase.auth.getUser();

  const acaoFormatada = (acao || 'Ação').substring(0, 20);

  await supabase.from('auditoria_logs').insert({
    usuario_id: usuarioSessao?.user?.id || null,
    usuario_nome: usuarioNome || 'Sistema',
    usuario_role: usuarioRole || 'ADMIN',
    acao: acaoFormatada,
    modulo: (modulo || 'Geral').substring(0, 100),
    detalhes,
    data_hora: new Date().toISOString(),
  });
}


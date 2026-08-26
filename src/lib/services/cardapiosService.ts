import { supabase } from '../supabase';
import { Cardapio, RefeicaoDia, RefeicaoItem } from '../../types';
import { mapCardapioFromDB } from './mappers';

export async function buscarCardapios(municipioId?: string): Promise<Cardapio[]> {
  let query = supabase
    .from('cardapios')
    .select(`
      *,
      perfis_usuarios ( nome, crn )
    `)
    .order('criado_em', { ascending: false });

  if (municipioId) {
    query = query.eq('municipio_id', municipioId);
  }

  const { data: cardapiosRows, error } = await query;

  if (error || !cardapiosRows) {
    console.error('Erro ao buscar cardápios no Supabase:', error);
    return [];
  }

  const cardapios: Cardapio[] = [];

  for (const cRow of cardapiosRows) {
    // Buscar refeições do cardápio
    const { data: refeicoesRows } = await supabase
      .from('cardapio_refeicoes')
      .select('*')
      .eq('cardapio_id', cRow.id);

    const refeicoes: RefeicaoDia[] = [];

    if (refeicoesRows && refeicoesRows.length > 0) {
      for (const rRow of refeicoesRows) {
        // Buscar itens da refeição
        const { data: itensRows } = await supabase
          .from('cardapio_refeicao_itens')
          .select(`
            *,
            alimentos ( nome, eh_agricultura_familiar, unidade_medida )
          `)
          .eq('refeicao_id', rRow.id);

        const itens: RefeicaoItem[] = (itensRows || []).map((iRow: any) => ({
          id: iRow.id,
          alimentoId: iRow.alimento_id,
          alimentoNome: iRow.alimentos?.nome || 'Alimento',
          perCapitaLiquidoG: Number(iRow.per_capita_liquido_g) || 0,
          perCapitaBrutoG: Number(iRow.per_capita_bruto_g) || 0,
          unidade: iRow.alimentos?.unidade_medida || 'g',
          ehAgriculturaFamiliar: Boolean(iRow.alimentos?.eh_agricultura_familiar),
        }));

        refeicoes.push({
          diaSemana: rRow.dia_semana,
          tipoRefeicao: rRow.tipo_refeicao,
          nomePrato: rRow.nome_prato,
          descricaoPreparo: rRow.descricao_preparo || '',
          itens,
          totalKcal: Number(rRow.total_kcal) || 0,
          totalCarboidratosG: Number(rRow.total_carboidratos_g) || 0,
          totalProteinasG: Number(rRow.total_proteinas_g) || 0,
          totalLipidiosG: Number(rRow.total_lipidios_g) || 0,
          totalFibrasG: Number(rRow.total_fibras_g) || 0,
          totalCalcioMg: Number(rRow.total_calcio_mg) || 0,
          totalFerroMg: Number(rRow.total_ferro_mg) || 0,
          totalVitaminaCMg: Number(rRow.total_vitamina_c_mg) || 0,
        });
      }
    }

    cardapios.push(mapCardapioFromDB(cRow, refeicoes));
  }

  return cardapios;
}

export async function criarCardapio(
  cardapioData: Omit<Cardapio, 'id' | 'criadoEm'>,
  municipioId?: string
): Promise<Cardapio | null> {
  const { data: usuarioSessao } = await supabase.auth.getUser();
  let userId = usuarioSessao?.user?.id;

  if (!userId) {
    const { data: perfilExistente } = await supabase
      .from('perfis_usuarios')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (perfilExistente) {
      userId = perfilExistente.id;
    } else {
      userId = cardapioData.nutricionistaId;
    }
  }

  // Inserir registro pai na tabela cardapios
  const { data: cardapioInserido, error: errCardapio } = await supabase
    .from('cardapios')
    .insert({
      municipio_id: municipioId || '00000000-0000-0000-0000-000000000001',
      titulo: cardapioData.titulo,
      mes_referencia: cardapioData.mesReferencia,
      semana_numero: cardapioData.semanaNumero,
      etapa_ensino: cardapioData.etapaEnsino,
      nutricionista_id: userId,
      dias_letivos_semana: cardapioData.diasLetivosSemana || 5,
      percentual_agri_familiar_estimado: cardapioData.percentualAgriFamiliarEstimado || 0,
      status: cardapioData.status || 'Rascunho',
      observacoes_dietas_especiais: cardapioData.observacoesDietasEspeciais || null,
    })
    .select()
    .single();


  if (errCardapio || !cardapioInserido) {
    console.error('Erro ao inserir cardápio no Supabase:', errCardapio);
    throw new Error(errCardapio?.message || 'Falha ao criar cardápio.');
  }

  // Inserir refeições e itens associados
  for (const ref of cardapioData.refeicoes || []) {
    const { data: refInserida } = await supabase
      .from('cardapio_refeicoes')
      .insert({
        cardapio_id: cardapioInserido.id,
        dia_semana: ref.diaSemana,
        tipo_refeicao: ref.tipoRefeicao,
        nome_prato: ref.nomePrato,
        descricao_preparo: ref.descricaoPreparo,
        total_kcal: ref.totalKcal,
        total_carboidratos_g: ref.totalCarboidratosG,
        total_proteinas_g: ref.totalProteinasG,
        total_lipidios_g: ref.totalLipidiosG,
        total_fibras_g: ref.totalFibrasG,
        total_calcio_mg: ref.totalCalcioMg,
        total_ferro_mg: ref.totalFerroMg,
        total_vitamina_c_mg: ref.totalVitaminaCMg,
      })
      .select()
      .single();

    if (refInserida && ref.itens) {
      for (const item of ref.itens) {
        await supabase.from('cardapio_refeicao_itens').insert({
          refeicao_id: refInserida.id,
          alimento_id: item.alimentoId,
          per_capita_liquido_g: item.perCapitaLiquidoG,
          per_capita_bruto_g: item.perCapitaBrutoG,
        });
      }
    }
  }

  return mapCardapioFromDB(cardapioInserido, cardapioData.refeicoes || []);
}

export async function atualizarStatusCardapio(id: string, status: Cardapio['status']): Promise<boolean> {
  const { error } = await supabase
    .from('cardapios')
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar status do cardápio:', error);
    return false;
  }
  return true;
}

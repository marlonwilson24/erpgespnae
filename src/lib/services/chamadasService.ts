import { supabase } from '../supabase';
import { ChamadaPublica, PropostaFornecedor, ItemChamadaPublica } from '../../types';
import { mapChamadaPublicaFromDB } from './mappers';

export async function buscarChamadasPublicas(municipioId?: string): Promise<ChamadaPublica[]> {
  let query = supabase.from('chamadas_publicas').select('*').order('criado_em', { ascending: false });

  if (municipioId) {
    query = query.eq('municipio_id', municipioId);
  }

  const { data: chamadasRows, error } = await query;

  if (error || !chamadasRows) {
    console.error('Erro ao buscar chamadas públicas no Supabase:', error);
    return [];
  }

  const result: ChamadaPublica[] = [];

  for (const cRow of chamadasRows) {
    // Buscar itens da chamada
    const { data: itensRows } = await supabase
      .from('chamada_publica_itens')
      .select(`
        *,
        alimentos ( nome, unidade_medida )
      `)
      .eq('chamada_publica_id', cRow.id);

    const itens: ItemChamadaPublica[] = (itensRows || []).map((iRow: any) => ({
      id: iRow.id,
      alimentoId: iRow.alimento_id,
      descricaoItem: iRow.alimentos?.nome || 'Alimento',
      unidadeMedida: iRow.alimentos?.unidade_medida || 'kg',
      quantidadeTotalSolicitada: Number(iRow.quantidade_total_solicitada) || 0,
      precoMaximoReferencia: Number(iRow.preco_maximo_referencia) || 0,
      valorTotalItem: Number(iRow.valor_total_item) || 0,
      exclusivoAgriculturaFamiliar: Boolean(iRow.exclusivo_agricultura_familiar),
      exigeOrganico: Boolean(iRow.exige_organico),
      cronogramaEntrega: iRow.cronograma_entrega || 'Semanal',
    }));

    // Buscar propostas enviadas
    const { data: propostasRows } = await supabase
      .from('propostas_fornecedores')
      .select(`
        *,
        perfis_usuarios ( nome, cpf, dap_caf, caf )
      `)
      .eq('chamada_publica_id', cRow.id);

    const propostas: PropostaFornecedor[] = [];

    if (propostasRows) {
      for (const pRow of propostasRows) {
        const { data: pItens } = await supabase
          .from('proposta_itens')
          .select('*')
          .eq('proposta_id', pRow.id);

        const perf = pRow.perfis_usuarios || {};
        propostas.push({
          id: pRow.id,
          chamadaPublicaId: pRow.chamada_publica_id,
          fornecedorId: pRow.fornecedor_id,
          fornecedorNome: perf.nome || 'Produtor Rural',
          fornecedorCpfCnpj: perf.cpf || '',
          fornecedorDapCaf: perf.dap_caf || perf.caf || '',
          tipoProdutor: pRow.tipo_produtor || 'Individual',
          valorTotalProposta: Number(pRow.valor_total_proposta) || 0,
          acumuladoAnoDapCaf: Number(pRow.acumulado_ano_dap_caf) || 0,
          limiteDisponivelDap: Math.max(0, 40000 - (Number(pRow.acumulado_ano_dap_caf) || 0)),
          status: pRow.status || 'Em Análise',
          motivoDesclassificacao: pRow.motivo_desclassificacao || undefined,
          itensOfertados: (pItens || []).map((pi: any) => ({
            itemChamadaId: pi.item_chamada_id,
            quantidadeOfertada: Number(pi.quantidade_ofertada) || 0,
            precoUnitarioOfertado: Number(pi.preco_unitario_ofertado) || 0,
            valorTotal: Number(pi.valor_total) || 0,
          })),
          dataSubmissao: pRow.data_submissao || new Date().toISOString(),
        });
      }
    }

    result.push(mapChamadaPublicaFromDB(cRow, itens, propostas));
  }

  return result;
}

export async function criarChamadaPublica(
  chamadaData: Omit<ChamadaPublica, 'id' | 'propostas'>,
  municipioId?: string
): Promise<ChamadaPublica | null> {
  const { data: cpInserida, error: errCP } = await supabase
    .from('chamadas_publicas')
    .insert({
      municipio_id: municipioId || '00000000-0000-0000-0000-000000000001',
      numero_edital: chamadaData.numeroEdital,
      ano_exercicio: chamadaData.anoExercicio || new Date().getFullYear(),
      titulo: chamadaData.titulo,
      objeto: chamadaData.objeto,
      data_abertura: chamadaData.dataAbertura,
      data_encerramento: chamadaData.dataEncerramento,
      valor_total_estimado: chamadaData.valorTotalEstimado,
      valor_reservado_agri_familiar: chamadaData.valorReservadoAgriFamiliar,
      status: chamadaData.status || 'Publicada',
    })
    .select()
    .single();

  if (errCP || !cpInserida) {
    console.error('Erro ao cadastrar chamada pública no Supabase:', errCP);
    throw new Error(errCP?.message || 'Falha ao cadastrar chamada pública.');
  }

  // Inserir itens da chamada pública
  for (const item of chamadaData.itens || []) {
    await supabase.from('chamada_publica_itens').insert({
      chamada_publica_id: cpInserida.id,
      alimento_id: item.alimentoId,
      quantidade_total_solicitada: item.quantidadeTotalSolicitada,
      preco_maximo_referencia: item.precoMaximoReferencia,
      exclusivo_agricultura_familiar: item.exclusivoAgriculturaFamiliar,
      exige_organico: item.exigeOrganico,
      cronograma_entrega: item.cronogramaEntrega || 'Semanal',
    });
  }

  return mapChamadaPublicaFromDB(cpInserida, chamadaData.itens || [], []);
}

export async function submeterProposta(
  propostaData: Omit<PropostaFornecedor, 'id' | 'dataSubmissao'>
): Promise<{ success: boolean; error?: string }> {
  const { data: usuarioSessao } = await supabase.auth.getUser();
  const fornecedorId = usuarioSessao?.user?.id || propostaData.fornecedorId;

  const { data: propInserida, error: errProp } = await supabase
    .from('propostas_fornecedores')
    .insert({
      chamada_publica_id: propostaData.chamadaPublicaId,
      fornecedor_id: fornecedorId,
      tipo_produtor: propostaData.tipoProdutor === 'Cooperativa / Associação' ? 'Grupo Formal' : 'Individual',
      valor_total_proposta: propostaData.valorTotalProposta,
      acumulado_ano_dap_caf: propostaData.acumuladoAnoDapCaf || 0,
      status: propostaData.status || 'Em Análise',
    })
    .select()
    .single();

  if (errProp || !propInserida) {
    console.error('Erro ao submeter proposta no Supabase:', errProp);
    return { success: false, error: errProp?.message || 'Falha ao salvar proposta no Supabase.' };
  }

  for (const item of propostaData.itensOfertados || []) {
    await supabase.from('proposta_itens').insert({
      proposta_id: propInserida.id,
      item_chamada_id: item.itemChamadaId,
      quantidade_ofertada: item.quantidadeOfertada,
      preco_unitario_ofertado: item.precoUnitarioOfertado,
    });
  }

  return { success: true };
}

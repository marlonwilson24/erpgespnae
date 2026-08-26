import { supabase } from '../supabase';
import {
  ContratoFornecedor,
  AutorizacaoFornecimento,
  EntregaMercadoria,
  EstoqueItemEscola,
} from '../../types';
import {
  mapContratoFromDB,
  mapAFFromDB,
  mapEntregaFromDB,
  mapEstoqueFromDB,
} from './mappers';

// ==========================================
// CONTRATOS
// ==========================================
export async function buscarContratos(municipioId?: string): Promise<ContratoFornecedor[]> {
  let query = supabase
    .from('contratos_fornecedores')
    .select(`
      *,
      perfis_usuarios ( nome, cpf, dap_caf, caf, cpf_cnpj_fornecedor )
    `)
    .order('criado_em', { ascending: false });

  if (municipioId) {
    query = query.eq('municipio_id', municipioId);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error('Erro ao buscar contratos no Supabase:', error);
    return [];
  }

  return data.map(mapContratoFromDB);
}

// ==========================================
// AUTORIZAÇÕES DE FORNECIMENTO (AF)
// ==========================================
export async function buscarAFs(municipioId?: string): Promise<AutorizacaoFornecimento[]> {
  let query = supabase
    .from('autorizacoes_fornecimento')
    .select(`
      *,
      perfis_usuarios ( nome ),
      escolas ( nome )
    `)
    .order('criado_em', { ascending: false });

  const { data: afRows, error } = await query;
  if (error || !afRows) {
    console.error('Erro ao buscar AFs no Supabase:', error);
    return [];
  }

  const afs: AutorizacaoFornecimento[] = [];

  for (const row of afRows) {
    const { data: itensRows } = await supabase
      .from('af_itens')
      .select(`
        *,
        alimentos ( nome, unidade_medida )
      `)
      .eq('af_id', row.id);

    afs.push(mapAFFromDB(row, itensRows || []));
  }

  return afs;
}

export async function emitirAF(
  afData: Omit<AutorizacaoFornecimento, 'id' | 'numeroAF' | 'dataEmissao' | 'status'>
): Promise<AutorizacaoFornecimento | null> {
  const { data: afsContagem } = await supabase.from('autorizacoes_fornecimento').select('id', { count: 'exact', head: true });
  const count = (afsContagem?.length || 0) + 43;
  const numeroAF = `AF-2026-00${count}`;

  const { data: afInserida, error: errAF } = await supabase
    .from('autorizacoes_fornecimento')
    .insert({
      numero_af: numeroAF,
      contrato_id: afData.contratoId,
      escola_id: afData.escolaId,
      fornecedor_id: afData.fornecedorId,
      data_emissao: new Date().toISOString().split('T')[0],
      data_limite_entrega: afData.dataLimiteEntrega,
      valor_total_af: afData.valorTotalAF,
      status: 'Em Trânsito',
    })
    .select()
    .single();

  if (errAF || !afInserida) {
    console.error('Erro ao emitir AF no Supabase:', errAF);
    throw new Error(errAF?.message || 'Falha ao emitir AF.');
  }

  for (const item of afData.itens || []) {
    await supabase.from('af_itens').insert({
      af_id: afInserida.id,
      alimento_id: item.alimentoId,
      quantidade_autorizada: item.quantidadeAutorizada,
      quantidade_entregue: item.quantidadeEntregue || 0,
      preco_unitario: item.precoUnitario,
    });
  }

  return mapAFFromDB(afInserida, []);
}

// ==========================================
// ENTREGAS DE MERCADORIAS
// ==========================================
export async function buscarEntregas(escolaId?: string): Promise<EntregaMercadoria[]> {
  let query = supabase
    .from('entregas_mercadorias')
    .select(`
      *,
      autorizacoes_fornecimento ( numero_af ),
      escolas ( nome ),
      perfis_usuarios!fornecedor_id ( nome ),
      responsavel:perfis_usuarios!responsavel_recebimento_id ( nome, cargo )
    `)
    .order('criado_em', { ascending: false });

  if (escolaId) {
    query = query.eq('escola_id', escolaId);
  }

  const { data: entregasRows, error } = await query;
  if (error || !entregasRows) {
    console.error('Erro ao buscar entregas no Supabase:', error);
    return [];
  }

  const entregas: EntregaMercadoria[] = [];

  for (const row of entregasRows) {
    const { data: itensRows } = await supabase
      .from('entrega_itens')
      .select(`
        *,
        alimentos ( nome, unidade_medida )
      `)
      .eq('entrega_id', row.id);

    entregas.push(mapEntregaFromDB(row, itensRows || []));
  }

  return entregas;
}

export async function confirmarEntrega(input: any): Promise<EntregaMercadoria | null> {
  const { data: usuarioSessao } = await supabase.auth.getUser();
  const respId = usuarioSessao?.user?.id || input.responsavelRecebimentoId;

  // Inserir registro na tabela entregas_mercadorias
  const { data: entregaInserida, error: errEntrega } = await supabase
    .from('entregas_mercadorias')
    .insert({
      af_id: input.autorizacaoFornecimentoId,
      escola_id: input.escolaId,
      fornecedor_id: input.fornecedorId,
      data_entrega: input.dataEntrega || new Date().toISOString().split('T')[0],
      nota_fiscal_ou_recibo: input.notaFiscalOuComprovante,
      responsavel_recebimento_id: respId || '00000000-0000-0000-0000-000000000001',
      status_conferencia: input.statusConferencia || 'Conforme Total',
      parecer_qualidade: input.parecerQualidade || 'Excelente',
      observacoes: input.observacoes || null,
      termo_recebimento_gerado: true,
    })
    .select()
    .single();

  if (errEntrega || !entregaInserida) {
    console.error('Erro ao registrar entrega no Supabase:', errEntrega);
    throw new Error(errEntrega?.message || 'Falha ao registrar entrega.');
  }

  // Inserir itens entregues e atualizar saldo em estoque_escola
  for (const item of input.itens || []) {
    // Buscar af_item_id correspondente
    const { data: afItem } = await supabase
      .from('af_itens')
      .select('id')
      .eq('af_id', input.autorizacaoFornecimentoId)
      .eq('alimento_id', item.alimentoId)
      .maybeSingle();

    if (afItem) {
      await supabase.from('entrega_itens').insert({
        entrega_id: entregaInserida.id,
        af_item_id: afItem.id,
        alimento_id: item.alimentoId,
        quantidade_esperada: item.quantidadeRecebida,
        quantidade_recebida: item.quantidadeRecebida,
        aprovado: item.aprovado,
        motivo_divergencia: item.motivoRejeicao || null,
      });

      if (item.aprovado && item.quantidadeRecebida > 0) {
        // Atualizar/Upsert saldo em estoque_escola
        const { data: estoqueExistente } = await supabase
          .from('estoque_escola')
          .select('id, quantidade_atual')
          .eq('escola_id', input.escolaId)
          .eq('alimento_id', item.alimentoId)
          .maybeSingle();

        if (estoqueExistente) {
          await supabase
            .from('estoque_escola')
            .update({
              quantidade_atual: Number(estoqueExistente.quantidade_atual) + Number(item.quantidadeRecebida),
              ultima_atualizacao: new Date().toISOString(),
            })
            .eq('id', estoqueExistente.id);
        } else {
          await supabase.from('estoque_escola').insert({
            escola_id: input.escolaId,
            alimento_id: item.alimentoId,
            quantidade_atual: item.quantidadeRecebida,
            quantidade_minima_alerta: 10,
            data_validade_proxima: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            lote: `LOTE-${Date.now().toString().slice(-4)}`,
          });
        }
      }
    }
  }

  // Atualizar status da AF para Entregue Total
  await supabase
    .from('autorizacoes_fornecimento')
    .update({ status: 'Entregue Total', atualizado_em: new Date().toISOString() })
    .eq('id', input.autorizacaoFornecimentoId);

  return mapEntregaFromDB(entregaInserida, []);
}

// ==========================================
// ESTOQUE ESCOLAR
// ==========================================
export async function buscarEstoque(escolaId?: string): Promise<EstoqueItemEscola[]> {
  let query = supabase
    .from('estoque_escola')
    .select(`
      *,
      alimentos ( nome, categoria, unidade_medida )
    `)
    .order('ultima_atualizacao', { ascending: false });

  if (escolaId) {
    query = query.eq('escola_id', escolaId);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error('Erro ao buscar estoque no Supabase:', error);
    return [];
  }

  return data.map(mapEstoqueFromDB);
}

export async function darBaixaEstoque(estoqueId: string, quantidadeUtilizada: number): Promise<boolean> {
  const { data: item } = await supabase
    .from('estoque_escola')
    .select('quantidade_atual')
    .eq('id', estoqueId)
    .single();

  if (!item) return false;

  const novaQtd = Math.max(0, Number(item.quantidade_atual) - quantidadeUtilizada);

  const { error } = await supabase
    .from('estoque_escola')
    .update({
      quantidade_atual: novaQtd,
      ultima_atualizacao: new Date().toISOString(),
    })
    .eq('id', estoqueId);

  if (error) {
    console.error('Erro ao dar baixa no estoque:', error);
    return false;
  }
  return true;
}

/**
 * Dá baixa no estoque de uma escola localizando o item pelo par
 * (escola_id, alimento_id) — usado pelo consumo de despensa escolar.
 */
export async function consumirEstoquePorAlimento(
  escolaId: string,
  alimentoId: string,
  quantidade: number
): Promise<boolean> {
  const { data: item } = await supabase
    .from('estoque_escola')
    .select('id, quantidade_atual')
    .eq('escola_id', escolaId)
    .eq('alimento_id', alimentoId)
    .maybeSingle();

  if (!item) return false;

  const novaQtd = Math.max(0, Number(item.quantidade_atual) - quantidade);

  const { error } = await supabase
    .from('estoque_escola')
    .update({
      quantidade_atual: novaQtd,
      ultima_atualizacao: new Date().toISOString(),
    })
    .eq('id', item.id);

  if (error) {
    console.error('Erro ao registrar consumo de estoque:', error);
    return false;
  }
  return true;
}

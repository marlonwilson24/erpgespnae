import {
  Alimento,
  Escola,
  Cardapio,
  ChamadaPublica,
  PropostaFornecedor,
  ContratoFornecedor,
  AutorizacaoFornecimento,
  EntregaMercadoria,
  EstoqueItemEscola,
  PrestacaoContasPNAE,
  ParecerCAE,
  AuditoriaLog,
  ItemChamadaPublica,
  RefeicaoDia,
  RefeicaoItem,
  Municipio,
  VisitaCAE,
  MembroCAE,
  ReuniaoCAE,
  ApontamentoOuvidoriaCAE,
} from '../../types';

// ==========================================
// MUNICÍPIO
// ==========================================
export function mapMunicipioFromDB(row: any): Municipio {
  return {
    id: row.id,
    nome: row.nome,
    uf: row.uf,
    codigoIbge: row.codigo_ibge,
    totalAlunosPNAE: Number(row.total_alunos_pnae) || 0,
    orcamentoAnualFNDE: Number(row.orcamento_anual_fnde) || 0,
    orcamentoContrapartida: Number(row.orcamento_contrapartida) || 0,
    anoExercicio: Number(row.ano_exercicio) || new Date().getFullYear(),
    orgaoNome: row.orgao_nome || undefined,
    cnpj: row.cnpj || undefined,
    endereco: row.endereco || undefined,
    email: row.email || undefined,
    telefone: row.telefone || undefined,
    gestorNome: row.gestor_nome || undefined,
    gestorCargo: row.gestor_cargo || undefined,
    portaria: row.portaria || undefined,
    logo1: row.logo1 || undefined,
    logo2: row.logo2 || undefined,
  };
}

export function mapMunicipioToDB(m: Partial<Municipio>): Record<string, any> {
  const idValido = m.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.id);
  return {
    ...(idValido ? { id: m.id } : {}),
    nome: m.nome,
    uf: m.uf,
    codigo_ibge: m.codigoIbge,
    total_alunos_pnae: m.totalAlunosPNAE ?? 0,
    orcamento_anual_fnde: m.orcamentoAnualFNDE ?? 0,
    orcamento_contrapartida: m.orcamentoContrapartida ?? 0,
    ano_exercicio: m.anoExercicio ?? new Date().getFullYear(),
    orgao_nome: m.orgaoNome || null,
    cnpj: m.cnpj || null,
    endereco: m.endereco || null,
    email: m.email || null,
    telefone: m.telefone || null,
    gestor_nome: m.gestorNome || null,
    gestor_cargo: m.gestorCargo || null,
    portaria: m.portaria || null,
    logo1: m.logo1 || null,
    logo2: m.logo2 || null,
  };
}

// ==========================================
// VISITAS CAE
// ==========================================
export function mapVisitaCAEFromDB(row: any): VisitaCAE {
  return {
    id: row.id,
    escolaId: row.escola_id,
    escolaNome: row.escolas?.nome || 'Escola Municipal',
    dataVisita: row.data_visita,
    membrosCaePresentes: Array.isArray(row.membros_cae_presentes) ? row.membros_cae_presentes : [],
    cardapioAfixadoEConforme: Boolean(row.cardapio_afixado_e_conforme),
    armazenamentoAdequado: Boolean(row.armazenamento_adequado),
    condicoesHigieneAprovadas: Boolean(row.condicoes_higiene_aprovadas),
    aceitabilidadeAlunos: row.aceitabilidade_alunos || 'Aprovado',
    relatorioObservacoes: row.relatorio_observacoes || '',
    recomendacoesEncaminhadas: row.recomendacoes_encaminhadas || undefined,
    statusPendencia: row.status_pendencia || 'Sem Pendências',
    checklistItens: Array.isArray(row.checklist_itens) ? row.checklist_itens : undefined,
    pontuacaoConformidade: row.pontuacao_conformidade != null ? Number(row.pontuacao_conformidade) : undefined,
    classificacaoLegal: row.classificacao_legal || undefined,
    responsavelEscolaNome: row.responsavel_escola_nome || undefined,
    responsavelEscolaCargo: row.responsavel_escola_cargo || undefined,
  };
}

export function mapVisitaCAEToDB(v: Omit<VisitaCAE, 'id'> & { municipioId?: string }): Record<string, any> {
  return {
    municipio_id: v.municipioId,
    escola_id: v.escolaId,
    data_visita: v.dataVisita,
    membros_cae_presentes: v.membrosCaePresentes || [],
    cardapio_afixado_e_conforme: v.cardapioAfixadoEConforme ?? true,
    armazenamento_adequado: v.armazenamentoAdequado ?? true,
    condicoes_higiene_aprovadas: v.condicoesHigieneAprovadas ?? true,
    aceitabilidade_alunos: v.aceitabilidadeAlunos || 'Aprovado',
    relatorio_observacoes: v.relatorioObservacoes || null,
    recomendacoes_encaminhadas: v.recomendacoesEncaminhadas || null,
    status_pendencia: v.statusPendencia || 'Sem Pendências',
    checklist_itens: v.checklistItens ? JSON.parse(JSON.stringify(v.checklistItens)) : null,
    pontuacao_conformidade: v.pontuacaoConformidade ?? null,
    classificacao_legal: v.classificacaoLegal || null,
    responsavel_escola_nome: v.responsavelEscolaNome || null,
    responsavel_escola_cargo: v.responsavelEscolaCargo || null,
  };
}

// ==========================================
// MEMBROS CAE
// ==========================================
export function mapMembroCAEFromDB(row: any): MembroCAE {
  return {
    id: row.id,
    nome: row.nome,
    segmento: row.segmento || 'Sociedade Civil Organizada',
    condicao: row.condicao || 'Titular',
    cargoMesa: row.cargo_mesa || 'Conselheiro(a)',
    entidadeRepresentada: row.entidade_representada || '',
    cpf: row.cpf,
    email: row.email || '',
    telefone: row.telefone || '',
    mandatoInicio: row.mandato_inicio || '',
    mandatoFim: row.mandato_fim || '',
    portariaNomeacao: row.portaria_nomeacao || '',
    status: row.status || 'Ativo',
  };
}

export function mapMembroCAEToDB(m: Omit<MembroCAE, 'id'> & { municipioId?: string }): Record<string, any> {
  return {
    municipio_id: m.municipioId,
    nome: m.nome,
    segmento: m.segmento,
    condicao: m.condicao || 'Titular',
    cargo_mesa: m.cargoMesa || 'Conselheiro(a)',
    entidade_representada: m.entidadeRepresentada || null,
    cpf: m.cpf,
    email: m.email || null,
    telefone: m.telefone || null,
    mandato_inicio: m.mandatoInicio || null,
    mandato_fim: m.mandatoFim || null,
    portaria_nomeacao: m.portariaNomeacao || null,
    status: m.status || 'Ativo',
  };
}

// ==========================================
// REUNIÕES CAE
// ==========================================
export function mapReuniaoCAEFromDB(row: any): ReuniaoCAE {
  return {
    id: row.id,
    numeroAta: row.numero_ata,
    tipo: row.tipo || 'Ordinária',
    dataHora: row.data_hora
      ? new Date(row.data_hora).toISOString().slice(0, 16).replace('T', ' ')
      : '',
    local: row.local || '',
    pauta: row.pauta || '',
    resumoDeliberacoes: row.resumo_deliberacoes || '',
    membrosPresentes: Array.isArray(row.membros_presentes) ? row.membros_presentes : [],
    status: row.status || 'Agendada',
    arquivoAtaUrl: row.arquivo_ata_url || undefined,
  };
}

export function mapReuniaoCAEToDB(r: Omit<ReuniaoCAE, 'id'> & { municipioId?: string }): Record<string, any> {
  return {
    municipio_id: r.municipioId,
    numero_ata: r.numeroAta,
    tipo: r.tipo || 'Ordinária',
    data_hora: r.dataHora ? new Date(r.dataHora.replace(' ', 'T')).toISOString() : new Date().toISOString(),
    local: r.local || null,
    pauta: r.pauta || null,
    resumo_deliberacoes: r.resumoDeliberacoes || null,
    membros_presentes: r.membrosPresentes || [],
    status: r.status || 'Agendada',
    arquivo_ata_url: r.arquivoAtaUrl || null,
  };
}

// ==========================================
// APONTAMENTOS OUVIDORIA CAE
// ==========================================
export function mapApontamentoCAEFromDB(row: any): ApontamentoOuvidoriaCAE {
  return {
    id: row.id,
    escolaNome: row.escola_nome,
    solicitanteTipo: row.solicitante_tipo,
    dataRegistro: row.data_registro,
    assunto: row.assunto,
    descricao: row.descricao,
    status: row.status || 'Em Análise pelo CAE',
    respostaCae: row.resposta_cae || undefined,
  };
}

export function mapApontamentoCAEToDB(a: Omit<ApontamentoOuvidoriaCAE, 'id'> & { municipioId?: string }): Record<string, any> {
  return {
    municipio_id: a.municipioId,
    escola_nome: a.escolaNome,
    solicitante_tipo: a.solicitanteTipo,
    data_registro: a.dataRegistro || new Date().toISOString().split('T')[0],
    assunto: a.assunto,
    descricao: a.descricao,
    status: a.status || 'Em Análise pelo CAE',
    resposta_cae: a.respostaCae || null,
  };
}

// ==========================================
// ALIMENTOS
// ==========================================
export function mapAlimentoFromDB(row: any): Alimento {
  return {
    id: row.id,
    codigoTaco: row.codigo_taco || undefined,
    nome: row.nome,
    categoria: row.categoria || 'Hortifrúti e Frutas',
    unidadeMedida: row.unidade_medida || 'kg',
    precoReferenciaMedio: Number(row.preco_referencia_medio) || 0,
    ehAgriculturaFamiliar: Boolean(row.eh_agricultura_familiar),
    ehOrganico: Boolean(row.eh_organico),
    caloriasKcal: Number(row.calorias_kcal) || 0,
    carboidratosG: Number(row.carboidratos_g) || 0,
    proteinasG: Number(row.proteinas_g) || 0,
    lipidiosG: Number(row.lipidios_g) || 0,
    fibrasG: Number(row.fibras_g) || 0,
    calcioMg: Number(row.calcio_mg) || 0,
    ferroMg: Number(row.ferro_mg) || 0,
    vitaminaCMg: Number(row.vitamina_c_mg) || 0,
    sodioMg: Number(row.sodio_mg) || 0,
  };
}

export function mapAlimentoToDB(a: Partial<Alimento>): Record<string, any> {
  return {
    ...(a.id ? { id: a.id } : {}),
    codigo_taco: a.codigoTaco || null,
    nome: a.nome,
    categoria: a.categoria,
    unidade_medida: a.unidadeMedida,
    preco_referencia_medio: a.precoReferenciaMedio,
    eh_agricultura_familiar: a.ehAgriculturaFamiliar,
    eh_organico: a.ehOrganico,
    calorias_kcal: a.caloriasKcal ?? 0,
    carboidratos_g: a.carboidratosG ?? 0,
    proteinas_g: a.proteinasG ?? 0,
    lipidios_g: a.lipidiosG ?? 0,
    fibras_g: a.fibrasG ?? 0,
    calcio_mg: a.calcioMg ?? 0,
    ferro_mg: a.ferroMg ?? 0,
    vitamina_c_mg: a.vitaminaCMg ?? 0,
    sodio_mg: a.sodioMg ?? 0,
    ativo: true,
  };
}


// ==========================================
// ESCOLAS
// ==========================================
export function mapEscolaFromDB(row: any): Escola {
  return {
    id: row.id,
    nome: row.nome,
    codigoInep: row.codigo_inep,
    municipioId: row.municipio_id,
    endereco: row.endereco,
    diretorNome: row.diretor_nome,
    responsavelMerendaNome: row.responsavel_merenda_nome,
    telefone: row.telefone || '',
    email: row.email || '',
    totalAlunos: Number(row.total_alunos) || 0,
    distribuicaoAlunos: [],
    tipoAtendimento: row.tipo_atendimento || 'Parcial',
  };
}

export function mapEscolaToDB(e: Partial<Escola>): Record<string, any> {
  return {
    ...(e.id ? { id: e.id } : {}),
    municipio_id: e.municipioId,
    nome: e.nome,
    codigo_inep: e.codigoInep,
    endereco: e.endereco,
    diretor_nome: e.diretorNome,
    responsavel_merenda_nome: e.responsavelMerendaNome,
    telefone: e.telefone || null,
    email: e.email || null,
    total_alunos: e.totalAlunos || 0,
    tipo_atendimento: e.tipoAtendimento || 'Parcial',
  };
}

// ==========================================
// CARDÁPIOS
// ==========================================
export function mapCardapioFromDB(row: any, refeicoesEntrada: RefeicaoDia[] = []): Cardapio {
  const nutricionista = row.perfis_usuarios || {};
  let refeicoes = refeicoesEntrada;

  if (refeicoes.length === 0 && Array.isArray(row.cardapio_refeicoes)) {
    refeicoes = row.cardapio_refeicoes.map((r: any) => ({
      id: r.id,
      diaSemana: r.dia_semana,
      tipoRefeicao: r.tipo_refeicao,
      nomePrato: r.nome_prato,
      totalKcal: Number(r.total_kcal) || 0,
      totalCarboidratosG: Number(r.total_carboidratos_g) || 0,
      totalProteinasG: Number(r.total_proteinas_g) || 0,
      totalLipidiosG: Number(r.total_lipidios_g) || 0,
      totalFibrasG: Number(r.total_fibras_g) || 0,
      totalVitaminaCMg: Number(r.total_vitamina_c_mg) || 0,
      itens: Array.isArray(r.cardapio_refeicao_itens)
        ? r.cardapio_refeicao_itens.map((it: any) => ({
            alimentoId: it.alimento_id,
            alimentoNome: it.alimentos?.nome || 'Alimento',
            perCapitaLiquidoG: Number(it.per_capita_liquido_g) || 0,
            unidade: it.unidade || 'g',
            ehAgriculturaFamiliar: Boolean(it.eh_agricultura_familiar),
          }))
        : [],
    }));
  }

  return {
    id: row.id,
    titulo: row.titulo,
    mesReferencia: row.mes_referencia,
    semanaNumero: Number(row.semana_numero) || 1,
    etapaEnsino: row.etapa_ensino,
    nutricionistaId: row.nutricionista_id,
    nutricionistaNome: nutricionista.nome || 'Nutricionista RT',
    nutricionistaCrn: nutricionista.crn || 'CRN-0000',
    diasLetivosSemana: Number(row.dias_letivos_semana) || 5,
    percentualAgriFamiliarEstimado: Number(row.percentual_agri_familiar_estimado) || 0,
    status: row.status || 'Rascunho',
    observacoesDietasEspeciais: row.observacoes_dietas_especiais || undefined,
    refeicoes,
    criadoEm: row.criado_em ? String(row.criado_em).split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

// ==========================================
// CHAMADAS PÚBLICAS
// ==========================================
export function mapChamadaPublicaFromDB(
  row: any,
  itensEntrada: ItemChamadaPublica[] = [],
  propostas: PropostaFornecedor[] = []
): ChamadaPublica {
  let itens = itensEntrada;
  if (itens.length === 0 && Array.isArray(row.chamada_publica_itens)) {
    itens = row.chamada_publica_itens.map((it: any) => ({
      id: it.id,
      numeroItem: Number(it.numero_item) || 1,
      descricaoItem: it.descricao_item,
      unidadeMedida: it.unidade_medida,
      quantidadeTotalSolicitada: Number(it.quantidade_total_solicitada) || 0,
      precoMaximoReferencia: Number(it.preco_maximo_referencia) || 0,
      valorTotalItem: Number(it.valor_total_item) || 0,
      cronogramaEntrega: it.cronograma_entrega || 'Semanal',
      exigeOrganico: Boolean(it.exige_organico),
    }));
  }

  return {
    id: row.id,
    numeroEdital: row.numero_edital,
    anoExercicio: Number(row.ano_exercicio) || new Date().getFullYear(),
    titulo: row.titulo,
    objeto: row.objeto,
    dataAbertura: row.data_abertura,
    dataEncerramento: row.data_encerramento,
    valorTotalEstimado: Number(row.valor_total_estimado) || 0,
    valorReservadoAgriFamiliar: Number(row.valor_reservado_agri_familiar) || 0,
    percentualAgriFamiliar: row.valor_total_estimado > 0
      ? Math.round((Number(row.valor_reservado_agri_familiar) / Number(row.valor_total_estimado)) * 100)
      : 30,
    status: row.status || 'Publicada',
    itens,
    propostas,
    arquivoEditalNome: row.arquivo_edital_url || undefined,
  };
}


// ==========================================
// CONTRATOS
// ==========================================
export function mapContratoFromDB(row: any): ContratoFornecedor {
  const fornecedor = row.perfis_usuarios || {};
  return {
    id: row.id,
    numeroContrato: row.numero_contrato,
    chamadaPublicaId: row.chamada_publica_id,
    fornecedorId: row.fornecedor_id,
    fornecedorNome: fornecedor.nome || 'Fornecedor',
    fornecedorCpfCnpj: fornecedor.cpf || fornecedor.cpf_cnpj_fornecedor || '',
    fornecedorDapCaf: fornecedor.dap_caf || fornecedor.caf || '',
    valorTotalContrato: Number(row.valor_total_contrato) || 0,
    dataInicio: row.data_inicio,
    dataFim: row.data_fim,
    status: row.status || 'Vigente',
  };
}

// ==========================================
// AUTORIZAÇÕES DE FORNECIMENTO (AF)
// ==========================================
export function mapAFFromDB(row: any, itens: any[] = []): AutorizacaoFornecimento {
  const fornecedor = row.perfis_usuarios || {};
  const escola = row.escolas || {};
  return {
    id: row.id,
    numeroAF: row.numero_af,
    contratoId: row.contrato_id,
    fornecedorId: row.fornecedor_id,
    fornecedorNome: fornecedor.nome || 'Fornecedor',
    escolaId: row.escola_id,
    escolaNome: escola.nome || 'Escola Destino',
    dataEmissao: row.data_emissao,
    dataLimiteEntrega: row.data_limite_entrega,
    valorTotalAF: Number(row.valor_total_af) || 0,
    status: row.status || 'Emitida',
    itens: itens.map(i => ({
      alimentoId: i.alimento_id,
      alimentoNome: i.alimentos?.nome || 'Alimento',
      quantidadeAutorizada: Number(i.quantidade_autorizada) || 0,
      quantidadeEntregue: Number(i.quantidade_entregue) || 0,
      unidadeMedida: i.alimentos?.unidade_medida || 'kg',
      precoUnitario: Number(i.preco_unitario) || 0,
      valorTotal: Number(i.valor_total) || 0,
    })),
  };
}

// ==========================================
// ENTREGAS DE MERCADORIAS
// ==========================================
export function mapEntregaFromDB(row: any, itens: any[] = []): EntregaMercadoria {
  const af = row.autorizacoes_fornecimento || {};
  const escola = row.escolas || {};
  const fornecedor = row.perfis_usuarios || {};
  const resp = row.responsavel || {};
  return {
    id: row.id,
    autorizacaoFornecimentoId: row.af_id,
    numeroAF: af.numero_af || '',
    escolaId: row.escola_id,
    escolaNome: escola.nome || '',
    fornecedorId: row.fornecedor_id,
    fornecedorNome: fornecedor.nome || '',
    dataEntrega: row.data_entrega,
    notaFiscalOuComprovante: row.nota_fiscal_ou_recibo,
    responsavelRecebimentoNome: resp.nome || 'Responsável',
    responsavelRecebimentoCargo: resp.cargo || 'Servidor',
    statusConferencia: row.status_conferencia || 'Conforme Total',
    parecerQualidade: row.parecer_qualidade || 'Excelente',
    observacoes: row.observacoes || undefined,
    termoRecebimentoGerado: Boolean(row.termo_recebimento_gerado),
    itensRecebidos: itens.map(i => ({
      alimentoId: i.alimento_id,
      alimentoNome: i.alimentos?.nome || 'Alimento',
      quantidadeEsperada: Number(i.quantidade_esperada) || 0,
      quantidadeRecebida: Number(i.quantidade_recebida) || 0,
      unidadeMedida: i.alimentos?.unidade_medida || 'kg',
      aprovado: Boolean(i.aprovado),
      motivoDivergencia: i.motivo_divergencia || undefined,
    })),
  };
}

// ==========================================
// ESTOQUE DA ESCOLA
// ==========================================
export function mapEstoqueFromDB(row: any): EstoqueItemEscola {
  const alimento = row.alimentos || {};
  return {
    id: row.id,
    escolaId: row.escola_id,
    alimentoId: row.alimento_id,
    alimentoNome: alimento.nome || 'Alimento',
    categoria: alimento.categoria || 'Mercearia e Básicos',
    unidadeMedida: alimento.unidade_medida || 'kg',
    quantidadeAtual: Number(row.quantidade_atual) || 0,
    quantidadeMinimaAlerta: Number(row.quantidade_minima_alerta) || 10,
    dataValidadeProxima: row.data_validade_proxima || new Date().toISOString().split('T')[0],
    lote: row.lote || 'LOTE-001',
    ultimaAtualizacao: row.ultima_atualizacao
      ? new Date(row.ultima_atualizacao).toISOString().replace('T', ' ').substring(0, 19)
      : new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
}

// ==========================================
// PRESTAÇÃO DE CONTAS
// ==========================================
export function mapPrestacaoContasFromDB(row: any): PrestacaoContasPNAE {
  const municipio = row.municipios || {};
  return {
    id: row.id,
    anoExercicio: Number(row.ano_exercicio) || new Date().getFullYear(),
    municipioId: row.municipio_id,
    municipioNome: municipio.nome || 'Município',
    recursoTotalFNDERecebido: Number(row.recurso_total_fnde_recebido) || 0,
    contrapartidaMunicipalGasta: Number(row.contrapartida_municipal_gasta) || 0,
    gastoTotalAlimentacao: Number(row.gasto_total_alimentacao) || 0,
    gastoAgriculturaFamiliar: Number(row.gasto_agricultura_familiar) || 0,
    percentualAgriculturaFamiliarAtingido: Number(row.percentual_agricultura_familiar) || 0,
    cumpreMetaLegal30Porcento: Boolean(row.cumpre_meta_legal_30_porcento),
    saldoContabilRemanescente: Number(row.saldo_remanescente) || 0,
    numeroAlunosAtendidos: Number(row.numero_alunos_atendidos) || 0,
    numeroRefeicoesServidasAno: (Number(row.numero_alunos_atendidos) || 0) * 200,
    statusAprovacao: row.status_aprovacao || 'Pendente Análise',
  };
}

// ==========================================
// PARECER CAE
// ==========================================
export function mapParecerCAEFromDB(row: any): ParecerCAE {
  return {
    id: row.id,
    prestacaoContasId: row.prestacao_contas_id,
    anoExercicio: Number(row.ano_exercicio) || new Date().getFullYear(),
    dataReuniaoAta: row.data_reuniao_ata,
    numeroAta: row.numero_ata,
    presidenteCaeNome: row.presidente_cae_nome,
    relatorCaeNome: row.relator_cae_nome,
    resultadoParecer: row.resultado_parecer || 'Favorável sem Ressalvas',
    pontosAvaliados: [
      { criterio: 'Cumprimento dos Cardápios pela Nutricionista RT', status: 'Atendido', observacao: 'Cardápios elaborados em conformidade legal.' },
      { criterio: 'Aplicação do percentual mínimo de 30% em Agricultura Familiar', status: 'Atendido', observacao: 'Metas atingidas com chamadas públicas vigentes.' },
      { criterio: 'Condições Sanitárias das Cozinhas e Despensas', status: 'Atendido', observacao: 'Vistorias realizadas sem irregularidades graves.' },
    ],
    textoParecerConclusivo: row.texto_parecer_conclusivo,
    recomendacoesAoGestor: row.recomendacoes_ao_gestor || '',
    membrosPresentes: Array.isArray(row.membros_presentes) ? row.membros_presentes : [],
    assinadoEm: row.assinado_em || new Date().toISOString(),
  };
}

// ==========================================
// AUDITORIA LOGS
// ==========================================
export function mapAuditoriaLogFromDB(row: any): AuditoriaLog {
  return {
    id: row.id,
    dataHora: row.data_hora
      ? new Date(row.data_hora).toISOString().replace('T', ' ').substring(0, 19)
      : new Date().toISOString().replace('T', ' ').substring(0, 19),
    usuarioNome: row.usuario_nome || 'Sistema',
    usuarioRole: row.usuario_role || 'ADMIN',
    acao: row.acao,
    modulo: row.modulo,
    detalhes: row.detalhes || '',
  };
}

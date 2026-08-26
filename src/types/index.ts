export type UserRole = 'ADMIN' | 'NUTRICIONISTA' | 'ESCOLA' | 'FORNECEDOR' | 'CAE';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cpf: string;
  municipioId?: string;
  escolaId?: string;
  fornecedorDapCaf?: string;
  telefone?: string;
  crn?: string; // Nutricionista CRN
  cargo?: string;
  avatarUrl?: string;
}

export interface Municipio {
  id: string;
  nome: string;
  uf: string;
  codigoIbge: string;
  totalAlunosPNAE: number;
  orcamentoAnualFNDE: number;
  orcamentoContrapartida: number;
  anoExercicio: number;

  // Dados do Órgão Gestor (EEx)
  orgaoNome?: string;
  cnpj?: string;
  endereco?: string;
  email?: string;
  telefone?: string;
  gestorNome?: string;
  gestorCargo?: string;
  portaria?: string;
  logo1?: string; // Logo 1 (Brasão da Prefeitura / EEx) Base64 ou URL
  logo2?: string; // Logo 2 (Logo PNAE / FNDE / Secretaria) Base64 ou URL
}

export type EtapaEnsino = 
  | 'Creche (0 a 3 anos)'
  | 'Pré-Escola (4 a 5 anos)'
  | 'Ensino Fundamental I'
  | 'Ensino Fundamental II'
  | 'Ensino Médio'
  | 'Educação de Jovens e Adultos (EJA)'
  | 'Indígena / Quilombola'
  | 'Tempo Integral';

export interface Escola {
  id: string;
  nome: string;
  codigoInep: string;
  municipioId: string;
  endereco: string;
  diretorNome: string;
  responsavelMerendaNome: string;
  telefone: string;
  email: string;
  totalAlunos: number;
  distribuicaoAlunos: {
    etapa: EtapaEnsino;
    alunos: number;
  }[];
  tipoAtendimento: 'Parcial' | 'Integral';
}

export type CategoriaAlimento = 
  | 'Hortifrúti e Frutas'
  | 'Legumes e Verduras'
  | 'Grãos, Cereais e Tubérculos'
  | 'Carnes, Ovos e Pescados'
  | 'Leite e Derivados'
  | 'Mercearia e Básicos'
  | 'Temperos Naturais'
  | 'Bebidas e Polpas';

export interface Alimento {
  id: string;
  codigoTaco?: string;
  nome: string;
  categoria: CategoriaAlimento;
  unidadeMedida: 'kg' | 'g' | 'litro' | 'unidade' | 'maço' | 'dúzia' | 'cx';
  precoReferenciaMedio: number;
  ehAgriculturaFamiliar: boolean;
  ehOrganico: boolean;
  caloriasKcal: number; // por 100g
  carboidratosG: number;
  proteinasG: number;
  lipidiosG: number;
  fibrasG: number;
  calcioMg: number;
  ferroMg: number;
  vitaminaCMg: number;
  sodioMg: number;
}

export interface RefeicaoItem {
  id: string;
  alimentoId: string;
  alimentoNome: string;
  perCapitaLiquidoG: number; // Gramas per capita por aluno
  perCapitaBrutoG: number; // Com fator de correção
  unidade: string;
  ehAgriculturaFamiliar: boolean;
}

export type TipoRefeicao = 'Desjejum' | 'Colação' | 'Almoço' | 'Lanche da Tarde' | 'Jantar';
export type DiaSemana = 'Segunda-feira' | 'Terça-feira' | 'Quarta-feira' | 'Quinta-feira' | 'Sexta-feira';

export interface RefeicaoDia {
  diaSemana: DiaSemana;
  tipoRefeicao: TipoRefeicao;
  nomePrato: string;
  descricaoPreparo: string;
  itens: RefeicaoItem[];
  totalKcal: number;
  totalCarboidratosG: number;
  totalProteinasG: number;
  totalLipidiosG: number;
  totalFibrasG: number;
  totalCalcioMg: number;
  totalFerroMg: number;
  totalVitaminaCMg: number;
}

export interface Cardapio {
  id: string;
  titulo: string;
  mesReferencia: string; // Ex: '2026-09'
  semanaNumero: number;
  etapaEnsino: EtapaEnsino;
  nutricionistaId: string;
  nutricionistaNome: string;
  nutricionistaCrn: string;
  diasLetivosSemana: number;
  percentualAgriFamiliarEstimado: number;
  status: 'Rascunho' | 'Aprovado Nutricionista' | 'Homologado CAE' | 'Em Execução';
  observacoesDietasEspeciais?: string;
  refeicoes: RefeicaoDia[];
  criadoEm: string;
}

export interface ProjecaoItemCompra {
  alimentoId: string;
  alimentoNome: string;
  categoria: CategoriaAlimento;
  unidadeMedida: string;
  quantidadeTotalNecessaria: number;
  precoEstimadoUnitario: number;
  valorTotalEstimado: number;
  ehAgriculturaFamiliar: boolean;
  ehOrganico: boolean;
}

export type StatusChamadaPublica = 'Publicada' | 'Em Análise de Propostas' | 'Homologada' | 'Contratos Emitidos' | 'Encerrada';

export interface ItemChamadaPublica {
  id: string;
  alimentoId: string;
  descricaoItem: string;
  unidadeMedida: string;
  quantidadeTotalSolicitada: number;
  precoMaximoReferencia: number;
  valorTotalItem: number;
  exclusivoAgriculturaFamiliar: boolean;
  exigeOrganico: boolean;
  cronogramaEntrega: 'Semanal' | 'Quinzenal' | 'Mensal';
}

export interface PropostaFornecedor {
  id: string;
  chamadaPublicaId: string;
  fornecedorId: string;
  fornecedorNome: string;
  fornecedorCpfCnpj: string;
  fornecedorDapCaf: string;
  tipoProdutor: 'Individual' | 'Grupo Informal' | 'Cooperativa / Associação';
  valorTotalProposta: number;
  acumuladoAnoDapCaf: number; // Validação do limite de R$ 40.000,00
  limiteDisponivelDap: number;
  status: 'Em Análise' | 'Habilitada' | 'Vencedora' | 'Desclassificada';
  motivoDesclassificacao?: string;
  itensOfertados: {
    itemChamadaId: string;
    quantidadeOfertada: number;
    precoUnitarioOfertado: number;
    valorTotal: number;
  }[];
  dataSubmissao: string;
}

export interface ChamadaPublica {
  id: string;
  numeroEdital: string;
  anoExercicio: number;
  titulo: string;
  objeto: string;
  dataAbertura: string;
  dataEncerramento: string;
  valorTotalEstimado: number;
  valorReservadoAgriFamiliar: number;
  percentualAgriFamiliar: number;
  status: StatusChamadaPublica;
  itens: ItemChamadaPublica[];
  propostas: PropostaFornecedor[];
  arquivoEditalNome?: string;
}

export interface ContratoFornecedor {
  id: string;
  numeroContrato: string;
  chamadaPublicaId: string;
  fornecedorId: string;
  fornecedorNome: string;
  fornecedorCpfCnpj: string;
  fornecedorDapCaf: string;
  valorTotalContrato: number;
  dataInicio: string;
  dataFim: string;
  status: 'Vigente' | 'Concluído' | 'Cancelado';
}

export interface AutorizacaoFornecimento {
  id: string;
  numeroAF: string;
  contratoId: string;
  fornecedorId: string;
  fornecedorNome: string;
  escolaId: string;
  escolaNome: string;
  dataEmissao: string;
  dataLimiteEntrega: string;
  valorTotalAF: number;
  status: 'Emitida' | 'Em Trânsito' | 'Entregue Total' | 'Entregue Parcial' | 'Atrasada' | 'Recusada';
  itens: {
    alimentoId: string;
    alimentoNome: string;
    quantidadeAutorizada: number;
    quantidadeEntregue: number;
    unidadeMedida: string;
    precoUnitario: number;
    valorTotal: number;
  }[];
}

export interface EntregaMercadoria {
  id: string;
  autorizacaoFornecimentoId: string;
  numeroAF: string;
  escolaId: string;
  escolaNome: string;
  fornecedorId: string;
  fornecedorNome: string;
  dataEntrega: string;
  notaFiscalOuComprovante: string;
  responsavelRecebimentoNome: string;
  responsavelRecebimentoCargo: string;
  statusConferencia: StatusConferencia;
  parecerQualidade: ParecerQualidade;
  observacoes?: string;
  termoRecebimentoGerado?: boolean;
  itensRecebidos: {
    alimentoId: string;
    alimentoNome: string;
    quantidadeEsperada: number;
    quantidadeRecebida: number;
    unidadeMedida: string;
    aprovado: boolean;
    motivoDivergencia?: string;
  }[];
}

export interface EstoqueItemEscola {
  id: string;
  escolaId: string;
  alimentoId: string;
  alimentoNome: string;
  categoria: CategoriaAlimento;
  unidadeMedida: string;
  quantidadeAtual: number;
  quantidadeMinimaAlerta: number;
  dataValidadeProxima: string;
  lote: string;
  ultimaAtualizacao: string;
}

export interface PrestacaoContasPNAE {
  id: string;
  anoExercicio: number;
  municipioId: string;
  municipioNome: string;
  recursoTotalFNDERecebido: number;
  contrapartidaMunicipalGasta: number;
  gastoTotalAlimentacao: number;
  gastoAgriculturaFamiliar: number;
  percentualAgriculturaFamiliarAtingido: number;
  cumpreMetaLegal30Porcento: boolean;
  saldoContabilRemanescente: number;
  numeroAlunosAtendidos: number;
  numeroRefeicoesServidasAno: number;
  statusAprovacao: 'Pendente Análise' | 'Em Análise CAE' | 'Aprovado pelo CAE' | 'Aprovado com Ressalvas' | 'Rejeitado';
  parecerCaeId?: string;
}

export interface ParecerCAE {
  id: string;
  prestacaoContasId: string;
  anoExercicio: number;
  dataReuniaoAta: string;
  numeroAta: string;
  presidenteCaeNome: string;
  relatorCaeNome: string;
  resultadoParecer: 'Favorável sem Ressalvas' | 'Favorável com Ressalvas' | 'Desfavorável (Irregularidades)';
  pontosAvaliados: {
    criterio: string;
    status: 'Atendido' | 'Parcial' | 'Não Atendido';
    observacao: string;
  }[];
  textoParecerConclusivo: string;
  recomendacoesAoGestor: string;
  membrosPresentes: string[];
  assinadoEm: string;
}

export interface AuditoriaLog {
  id: string;
  dataHora: string;
  usuarioNome: string;
  usuarioRole: UserRole;
  acao: string;
  modulo: string;
  detalhes: string;
}

export type CategoriaAlertaPNAE = 
  | 'entrega_af' 
  | 'validade_estoque' 
  | 'estoque_baixo' 
  | 'meta_fnde' 
  | 'chamada_publica'
  | 'sistema';

export type PrioridadeAlerta = 'alta' | 'media' | 'baixa';

export interface AlertaPNAE {
  id: string;
  tipo: 'alerta' | 'perigo' | 'sucesso' | 'info';
  titulo: string;
  mensagem: string;
  data: string;
  lido: boolean;
  linkModulo?: string;
  categoria?: CategoriaAlertaPNAE;
  prioridade?: PrioridadeAlerta;
  escolaId?: string;
  escolaNome?: string;
  afId?: string;
  numeroAF?: string;
  fornecedorNome?: string;
  alimentoId?: string;
  alimentoNome?: string;
  estoqueId?: string;
  diasRestantes?: number;
  dataLimite?: string;
  acaoTexto?: string;
  acaoTab?: string;
  criadoEm?: string;
}

export interface ItemChecklistConformidade {
  id: string;
  eixo: 'Nutrição e Cardápio' | 'Agricultura Familiar' | 'Armazenamento e Validade' | 'Higiene e Manipulação' | 'Estrutura e Controle Social';
  artigoLei: string; // Ex: 'Art. 3º e 12 da Lei 11.947/2009'
  titulo: string;
  descricao: string;
  detalheObrigatorio: string;
  status: 'Conforme' | 'NaoConforme' | 'NaoAplica';
  observacao?: string;
  pesoCritico?: boolean;
}

export interface ChecklistConformidadeData {
  escolaId: string;
  escolaNome: string;
  dataVistoria: string;
  conselheiros: string[];
  responsavelEscolaNome: string;
  responsavelEscolaCargo: string;
  itens: ItemChecklistConformidade[];
  observacoesGerais: string;
  recomendacoesImediatas: string;
  pontuacaoGeral: number; // 0 a 100%
  classificacaoLegal: 'Excelente / Plena Conformidade' | 'Satisfatório com Recomendações' | 'Irregular / Risco Sanitário ou Legal';
}

export interface VisitaCAE {
  id: string;
  escolaId: string;
  escolaNome: string;
  dataVisita: string;
  membrosCaePresentes: string[];
  cardapioAfixadoEConforme: boolean;
  armazenamentoAdequado: boolean;
  condicoesHigieneAprovadas: boolean;
  aceitabilidadeAlunos: ParecerQualidade;
  relatorioObservacoes: string;
  recomendacoesEncaminhadas?: string;
  statusPendencia?: 'Resolvida' | 'Em Acompanhamento' | 'Sem Pendências';
  checklistItens?: ItemChecklistConformidade[];
  pontuacaoConformidade?: number;
  classificacaoLegal?: string;
  responsavelEscolaNome?: string;
  responsavelEscolaCargo?: string;
}

export interface MembroCAE {
  id: string;
  nome: string;
  segmento: 'Poder Executivo' | 'Professores / Trabalhadores da Educação' | 'Pais de Alunos' | 'Sociedade Civil Organizada';
  condicao: 'Titular' | 'Suplente';
  cargoMesa: 'Presidente' | 'Vice-Presidente' | 'Secretário(a)' | 'Conselheiro(a)' | 'Relator(a)';
  entidadeRepresentada: string;
  cpf: string;
  email: string;
  telefone: string;
  mandatoInicio: string;
  mandatoFim: string;
  portariaNomeacao: string;
  status: 'Ativo' | 'Licenciado' | 'Substituído';
}

export interface ReuniaoCAE {
  id: string;
  numeroAta: string;
  tipo: 'Ordinária' | 'Extraordinária';
  dataHora: string;
  local: string;
  pauta: string;
  resumoDeliberacoes: string;
  membrosPresentes: string[];
  status: 'Realizada' | 'Agendada' | 'Cancelada';
  arquivoAtaUrl?: string;
}

export interface ApontamentoOuvidoriaCAE {
  id: string;
  escolaNome: string;
  solicitanteTipo: 'Pai/Mãe de Aluno' | 'Professor' | 'Merendeira' | 'Comunidade';
  dataRegistro: string;
  assunto: string;
  descricao: string;
  status: 'Em Análise pelo CAE' | 'Encaminhado ao Gestor' | 'Resolvido';
  respostaCae?: string;
}

export interface ToastNotificacao {
  id: string;
  tipo: 'alerta' | 'perigo' | 'sucesso' | 'info';
  titulo: string;
  mensagem: string;
  categoria?: CategoriaAlertaPNAE;
  acaoTexto?: string;
  acaoTab?: string;
  afId?: string;
  escolaId?: string;
  duracaoMs?: number;
}

export type StatusAprovacaoPNAE = 'Pendente Análise' | 'Em Análise CAE' | 'Aprovado pelo CAE' | 'Aprovado com Ressalvas' | 'Rejeitado';
export type ParecerQualidade = 'Excelente' | 'Bom' | 'Regular' | 'Inadequado' | 'Aprovado' | 'Aprovado com Ressalvas' | 'Reprovado';
export type StatusConferencia = 'Conforme Total' | 'Conforme com Ressalva' | 'Rejeitado / Devolvido' | 'Recebido Integralmente' | 'Recebido Parcialmente' | 'Recusado';
export type TipoProdutor = 'Individual' | 'Grupo Informal' | 'Cooperativa / Associação' | 'Grupo Formal (Cooperativa)';


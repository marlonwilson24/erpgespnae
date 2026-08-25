import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  PrestacaoContasPNAE, 
  ParecerCAE, 
  Cardapio, 
  EntregaMercadoria, 
  ChamadaPublica,
  Municipio,
  Escola,
  ContratoFornecedor,
  EstoqueItemEscola,
  AuditoriaLog,
  AutorizacaoFornecimento,
  UserProfile,
  VisitaCAE,
  MembroCAE,
  ReuniaoCAE,
  ItemChecklistConformidade,
  ChecklistConformidadeData
} from '../types';
import { formatCurrency, formatDate } from './utils';

// Cache de logos convertidas para PNG (jsPDF não suporta SVG nativamente)
const logoCache = new Map<string, string | null>();

function carregarLogoParaPdf(src?: string | null): Promise<string | null> {
  if (!src) return Promise.resolve(null);
  const cached = logoCache.get(src);
  if (cached !== undefined) return Promise.resolve(cached);

  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D indisponível');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        logoCache.set(src, dataUrl);
        resolve(dataUrl);
      } catch {
        logoCache.set(src, null);
        resolve(null);
      }
    };
    img.onerror = () => {
      logoCache.set(src, null);
      resolve(null);
    };
    img.src = src;
  });
}

// Helper to draw official header on any PDF page
async function drawOfficialHeader(
  doc: jsPDF, 
  title: string, 
  subtitle: string, 
  municipio: Municipio, 
  isLandscape = false
) {
  const width = isLandscape ? 297 : 210;
  const centerX = width / 2;

  // Header Banner
  doc.setFillColor(30, 115, 45); // PNAE Green
  doc.rect(0, 0, width, 24, 'F');

  // Logos do Órgão Gestor (esquerda: brasão municipal / direita: logo institucional PNAE)
  const [logoEsquerda, logoDireita] = await Promise.all([
    carregarLogoParaPdf(municipio.logo1),
    carregarLogoParaPdf(municipio.logo2),
  ]);

  const logoSize = 16;
  const logoY = (24 - logoSize) / 2;

  if (logoEsquerda) {
    try { doc.addImage(logoEsquerda, 'PNG', 8, logoY, logoSize, logoSize); } catch { /* ignore */ }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PROGRAMA NACIONAL DE ALIMENTAÇÃO ESCOLAR - PNAE / FNDE', centerX, 8, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const orgaoLine = (municipio.orgaoNome || `PREFEITURA MUNICIPAL DE ${municipio.nome.toUpperCase()} - ${municipio.uf.toUpperCase()} | SECRETARIA DE EDUCAÇÃO`).toUpperCase();
  doc.text(orgaoLine, centerX, 14, { align: 'center' });

  const cnpjText = municipio.cnpj ? ` • CNPJ: ${municipio.cnpj}` : '';
  doc.text(`Exercício: ${municipio.anoExercicio} • Código IBGE: ${municipio.codigoIbge}${cnpjText}`, centerX, 19.5, { align: 'center' });

  if (logoDireita) {
    try { doc.addImage(logoDireita, 'PNG', width - 8 - logoSize, logoY, logoSize, logoSize); } catch { /* ignore */ }
  }

  // Document Title Bar
  doc.setFillColor(245, 247, 245);
  doc.rect(14, 28, width - 28, 14, 'F');
  doc.setDrawColor(200, 215, 200);
  doc.rect(14, 28, width - 28, 14, 'S');

  doc.setTextColor(30, 60, 30);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), centerX, 34.5, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(subtitle, centerX, 39.5, { align: 'center' });
}

// Helper to add official footer and page numbering
function addOfficialFooters(doc: jsPDF, docCode: string, isLandscape = false) {
  const pageCount = doc.getNumberOfPages();
  const width = isLandscape ? 297 : 210;
  const height = isLandscape ? 210 : 297;
  const centerX = width / 2;

  const now = new Date().toLocaleString('pt-BR');

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, height - 12, width - 14, height - 12);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`Documento Oficial emitido pelo Sistema de Gestão PNAE em ${now} • Código: ${docCode}`, 14, height - 7);
    doc.text(`Página ${i} de ${pageCount}`, width - 14, height - 7, { align: 'right' });
    doc.text('Conformidade com a Lei Federal nº 11.947/2009 e Resolução CD/FNDE nº 06/2020', centerX, height - 7, { align: 'center' });
  }
}

// ==========================================
// 1. PRESTAÇÃO DE CONTAS OFICIAL (FNDE / SIGPC)
// ==========================================
export async function exportPrestacaoContasPDF(
  pc: PrestacaoContasPNAE, 
  municipio: Municipio, 
  parecer?: ParecerCAE
) {
  const doc = new jsPDF();

  await drawOfficialHeader(
    doc,
    'Demonstrativo de Prestação de Contas Anual do PNAE',
    `Relatório de Execução Físico-Financeira SIGPC / FNDE • Exercício ${pc.anoExercicio}`,
    municipio
  );

  // Informações Gerais
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DADOS CADASTRAIS DA ENTIDADE EXECUTORA (EEx)', 14, 47);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Município: ${municipio.nome} - ${municipio.uf}  |  Código IBGE: ${municipio.codigoIbge}`, 14, 52);
  doc.text(`Total de Alunos Atendidos na Rede: ${pc.numeroAlunosAtendidos.toLocaleString('pt-BR')} matrículas PNAE`, 14, 57);
  doc.text(`Total de Refeições Servidas no Exercício: ${pc.numeroRefeicoesServidasAno.toLocaleString('pt-BR')} refeições`, 14, 62);
  doc.text(`Status Atual de Tramitação: ${pc.statusAprovacao.toUpperCase()}`, 14, 67);

  // Tabela Financeira
  const dataFinanceira = [
    ['Recurso Total FNDE Repassado (Conta PNAE)', formatCurrency(pc.recursoTotalFNDERecebido), '100,00%', 'Verba Federal Vinculada'],
    ['Contrapartida Municipal Própria Aplicada', formatCurrency(pc.contrapartidaMunicipalGasta), `${((pc.contrapartidaMunicipalGasta / pc.recursoTotalFNDERecebido) * 100).toFixed(2)}%`, 'Recurso Próprio do Tesouro'],
    ['Gasto Total em Gêneros Alimentícios', formatCurrency(pc.gastoTotalAlimentacao), `${((pc.gastoTotalAlimentacao / pc.recursoTotalFNDERecebido) * 100).toFixed(2)}%`, 'Execução Total da Merenda'],
    [
      'Aquisição da Agricultura Familiar (Art. 14)', 
      formatCurrency(pc.gastoAgriculturaFamiliar), 
      `${pc.percentualAgriculturaFamiliarAtingido.toFixed(2)}%`, 
      pc.cumpreMetaLegal30Porcento ? 'CUMPRIDO (>= 30% Legal) ✓' : 'ABAIXO DA META LEGAL ✗'
    ],
    ['Saldo Remanescente em Conta Corrente', formatCurrency(pc.saldoContabilRemanescente), `${((pc.saldoContabilRemanescente / pc.recursoTotalFNDERecebido) * 100).toFixed(2)}%`, 'Superávit / A reprogramar'],
  ];

  autoTable(doc, {
    startY: 72,
    head: [['Rubrica Orçamentária / PNAE', 'Valor Executado (R$)', '% Aplicado', 'Status / Fundamentação Legal']],
    body: dataFinanceira,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 35, halign: 'right' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 42 },
    }
  });

  // Parecer do CAE
  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 140;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('2. DELIBERAÇÃO DO CONSELHO DE ALIMENTAÇÃO ESCOLAR (CAE)', 14, finalY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  if (parecer) {
    doc.text(`Ata de Sessão nº: ${parecer.numeroAta}   |   Data da Homologação: ${formatDate(parecer.dataReuniaoAta)}`, 14, finalY + 5);
    doc.text(`Resultado da Análise Colegiada: ${parecer.resultadoParecer.toUpperCase()}`, 14, finalY + 10);

    const splitText = doc.splitTextToSize(`"${parecer.textoParecerConclusivo}"`, 182);
    doc.text(splitText, 14, finalY + 16);

    const afterTextY = finalY + 16 + splitText.length * 4;
    doc.text(`Presidente do CAE: ${parecer.presidenteCaeNome}  |  Relator(a): ${parecer.relatorCaeNome}`, 14, afterTextY + 2);
  } else {
    doc.text('Parecer do CAE em tramitação junto ao Colegiado Municipal.', 14, finalY + 5);
  }

  // Assinaturas
  const sigY = 245;
  doc.setLineWidth(0.5);
  doc.line(20, sigY, 95, sigY);
  doc.line(115, sigY, 190, sigY);

  doc.setFontSize(8);
  doc.text('Prefeito(a) / Gestor(a) Municipal', 57.5, sigY + 4, { align: 'center' });
  doc.text('Secretaria Municipal de Educação', 57.5, sigY + 8, { align: 'center' });

  doc.text(parecer?.presidenteCaeNome || 'Presidente do Conselho CAE', 152.5, sigY + 4, { align: 'center' });
  doc.text('Conselho de Alimentação Escolar', 152.5, sigY + 8, { align: 'center' });

  addOfficialFooters(doc, `PC-${pc.anoExercicio}-${municipio.codigoIbge}`);
  doc.save(`Prestacao_Contas_PNAE_${pc.anoExercicio}_${municipio.nome.replace(/\s+/g, '_')}.pdf`);
}

// ==========================================
// 2. PARECER CONCLUSIVO DO CAE (OFICIAL)
// ==========================================
export async function exportParecerCaeOficialPDF(
  parecer: ParecerCAE,
  prestacaoContas: PrestacaoContasPNAE,
  municipio: Municipio
) {
  const doc = new jsPDF();

  await drawOfficialHeader(
    doc,
    'Parecer Conclusivo do Conselho de Alimentação Escolar',
    `Controle Social e Fiscalização • Ata nº ${parecer.numeroAta} • Exercício ${parecer.anoExercicio}`,
    municipio
  );

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DADOS DA SESSÃO COLEGIADA DO CAE', 14, 47);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Número da Ata: ${parecer.numeroAta}   |   Data da Reunião: ${formatDate(parecer.dataReuniaoAta)}`, 14, 52);
  doc.text(`Presidente do CAE: ${parecer.presidenteCaeNome}   |   Relator(a): ${parecer.relatorCaeNome}`, 14, 57);
  doc.text(`Membros Presentes: ${parecer.membrosPresentes.join(', ')}`, 14, 62);
  doc.text(`Deliberação: ${parecer.resultadoParecer.toUpperCase()}`, 14, 67);

  // Critérios Avaliados
  const tableData = parecer.pontosAvaliados.map(pt => [
    pt.criterio,
    pt.status,
    pt.observacao
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['Critério de Fiscalização Avaliado', 'Avaliação', 'Observações do Colegiado']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 74 }
    }
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 130;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('2. PARECER CONCLUSIVO E RECOMENDAÇÕES', 14, finalY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const splitParecer = doc.splitTextToSize(`"${parecer.textoParecerConclusivo}"`, 182);
  doc.text(splitParecer, 14, finalY + 6);

  const afterParecerY = finalY + 6 + splitParecer.length * 4.5;

  if (parecer.recomendacoesAoGestor) {
    doc.setFont('helvetica', 'bold');
    doc.text('Recomendações ao Gestor Público:', 14, afterParecerY + 3);
    doc.setFont('helvetica', 'normal');
    const splitRec = doc.splitTextToSize(parecer.recomendacoesAoGestor, 182);
    doc.text(splitRec, 14, afterParecerY + 8);
  }

  // Assinaturas
  const sigY = 245;
  doc.setLineWidth(0.5);
  doc.line(20, sigY, 95, sigY);
  doc.line(115, sigY, 190, sigY);

  doc.setFontSize(8);
  doc.text(parecer.presidenteCaeNome, 57.5, sigY + 4, { align: 'center' });
  doc.text('Presidente do CAE', 57.5, sigY + 8, { align: 'center' });

  doc.text(parecer.relatorCaeNome, 152.5, sigY + 4, { align: 'center' });
  doc.text('Relator(a) do Parecer', 152.5, sigY + 8, { align: 'center' });

  addOfficialFooters(doc, `CAE-ATA-${parecer.numeroAta.replace(/[^a-zA-Z0-9]/g, '')}`);
  doc.save(`Parecer_CAE_Ata_${parecer.numeroAta.replace(/[\/\s]/g, '_')}.pdf`);
}

// ==========================================
// 3. RELATÓRIO DE VISITAS E FISCALIZAÇÕES IN LOCO DO CAE
// ==========================================
export async function exportRelatorioVisitasCaePDF(
  visitas: {
    id: string;
    escolaNome: string;
    dataVisita: string;
    membrosCaePresentes: string[];
    cardapioAfixadoEConforme: boolean;
    armazenamentoAdequado: boolean;
    condicoesHigieneAprovadas: boolean;
    aceitabilidadeAlunos: string;
    relatorioObservacoes: string;
  }[],
  municipio: Municipio
) {
  const doc = new jsPDF('landscape');

  await drawOfficialHeader(
    doc,
    'Relatório de Fiscalização e Inspeções Sanitárias In Loco nas Escolas',
    'Conselho de Alimentação Escolar (CAE) • Acompanhamento das Condições de Armazenamento, Cozinha e Merenda',
    municipio,
    true
  );

  const tableData = visitas.map(v => [
    v.escolaNome,
    formatDate(v.dataVisita),
    v.membrosCaePresentes.join(', '),
    v.cardapioAfixadoEConforme ? 'Conforme ✓' : 'Inconforme ✗',
    v.armazenamentoAdequado ? 'Adequado ✓' : 'Inadequado ✗',
    v.condicoesHigieneAprovadas ? 'Aprovado ✓' : 'Reprovado ✗',
    v.aceitabilidadeAlunos,
    v.relatorioObservacoes
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['Escola / Unidade', 'Data', 'Conselheiros Presentes', 'Cardápio Afixado', 'Despensa / Armaz.', 'Higiene & EPIs', 'Aceitabilidade', 'Parecer / Observações']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 40 },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 73 },
    }
  });

  addOfficialFooters(doc, `CAE-INSPECAO-${municipio.anoExercicio}`, true);
  doc.save(`Relatorio_Fiscalizacoes_CAE_${municipio.anoExercicio}.pdf`);
}

// ==========================================
// 4. RELATÓRIO COMPLETO GERENCIAL PNAE (ADMIN)
// ==========================================
export async function exportRelatorioAdminPDF(
  escolas: Escola[],
  contratos: ContratoFornecedor[],
  entregas: EntregaMercadoria[],
  prestacaoContas: PrestacaoContasPNAE,
  municipio: Municipio
) {
  const doc = new jsPDF();

  await drawOfficialHeader(
    doc,
    'Relatório Gerencial Consolidado da Alimentação Escolar',
    `Panorama Geral da Rede Municipal • Escolas, Contratos da Agricultura Familiar e Entregas • Exercício ${municipio.anoExercicio}`,
    municipio
  );

  // Resumo Executivo
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. RESUMO EXECUTIVO DA EXECUÇÃO FÍSICO-FINANCEIRA', 14, 47);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Total de Escolas Atendidas: ${escolas.length} unidades escolares   |   Total de Alunos Atendidos: ${municipio.totalAlunosPNAE.toLocaleString('pt-BR')} matrículas`, 14, 52);
  doc.text(`Repasse Federal FNDE: ${formatCurrency(prestacaoContas.recursoTotalFNDERecebido)}   |   Executado com Agricultura Familiar: ${formatCurrency(prestacaoContas.gastoAgriculturaFamiliar)} (${prestacaoContas.percentualAgriculturaFamiliarAtingido.toFixed(1)}%)`, 14, 57);
  doc.text(`Total de Contratos AF Ativos: ${contratos.length}   |   Total de Entregas Realizadas: ${entregas.length} remessas`, 14, 62);

  // Tabela 1: Escolas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('2. DISTRIBUIÇÃO DE MATRÍCULAS E ATENDIMENTO POR ESCOLA', 14, 70);

  const dataEscolas = escolas.map(e => [
    e.nome,
    e.codigoInep,
    e.tipoAtendimento,
    `${e.totalAlunos} alunos`,
    `${((e.totalAlunos / municipio.totalAlunosPNAE) * 100).toFixed(1)}%`,
    e.diretorNome
  ]);

  autoTable(doc, {
    startY: 74,
    head: [['Escola Municipal', 'INEP', 'Atendimento', 'Alunos', '% da Rede', 'Diretor(a) Responsável']],
    body: dataEscolas,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  // Tabela 2: Contratos AF
  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  let nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 140;

  if (nextY > 230) {
    doc.addPage();
    await drawOfficialHeader(doc, 'Relatório Gerencial Consolidado - Contratos e Entregas', 'Continuação', municipio);
    nextY = 46;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('3. CONTRATOS DA AGRICULTURA FAMILIAR E CUMPRIMENTO DO TETO (R$ 40.000 / ANO)', 14, nextY);

  const dataContratos = contratos.map(c => [
    c.numeroContrato,
    c.fornecedorNome,
    c.fornecedorDapCaf,
    formatCurrency(c.valorTotalContrato),
    `${formatDate(c.dataInicio)} a ${formatDate(c.dataFim)}`,
    c.status
  ]);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Nº Contrato', 'Produtor / Associação', 'DAP / CAF', 'Valor Contratado', 'Vigência', 'Status']],
    body: dataContratos,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  // Tabela 3: Entregas
  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 200;

  if (nextY > 230) {
    doc.addPage();
    await drawOfficialHeader(doc, 'Relatório Gerencial Consolidado - Histórico de Entregas', 'Continuação', municipio);
    nextY = 46;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('4. HISTÓRICO RECENTE DE ENTREGAS E CONFERÊNCIA NAS COZINHAS', 14, nextY);

  const dataEntregas = entregas.map(ent => [
    formatDate(ent.dataEntrega),
    ent.numeroAF,
    ent.escolaNome,
    ent.fornecedorNome,
    ent.statusConferencia,
    ent.parecerQualidade,
    ent.responsavelRecebimentoNome
  ]);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Data', 'Nº AF', 'Escola Destino', 'Fornecedor', 'Conferência', 'Qualidade', 'Recebedor']],
    body: dataEntregas,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  addOfficialFooters(doc, `REL-GERAL-${municipio.anoExercicio}`);
  doc.save(`Relatorio_Gerencial_PNAE_${municipio.anoExercicio}_${municipio.nome.replace(/\s+/g, '_')}.pdf`);
}

// ==========================================
// 5. RELATÓRIO ESPECÍFICO DE ESCOLAS E MATRÍCULAS
// ==========================================
export async function exportRelatorioEscolasPDF(escolas: Escola[], municipio: Municipio) {
  const doc = new jsPDF();

  await drawOfficialHeader(
    doc,
    'Relatório de Atendimento e Matrículas por Unidade Escolar',
    `Censo Escolar e Distribuição da Demanda de Alimentação • Exercício ${municipio.anoExercicio}`,
    municipio
  );

  const data = escolas.map(esc => [
    esc.nome,
    esc.codigoInep,
    esc.tipoAtendimento,
    `${esc.totalAlunos} alunos`,
    `${((esc.totalAlunos / municipio.totalAlunosPNAE) * 100).toFixed(1)}%`,
    esc.diretorNome,
    esc.responsavelMerendaNome
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['Unidade Escolar', 'INEP', 'Regime', 'Alunos', '% da Rede', 'Diretor(a)', 'Resp. Merenda']],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  addOfficialFooters(doc, `REL-ESCOLAS-${municipio.anoExercicio}`);
  doc.save(`Relatorio_Escolas_PNAE_${municipio.anoExercicio}.pdf`);
}

// ==========================================
// 6. RELATÓRIO ESPECÍFICO DE CONTRATOS DA AGRICULTURA FAMILIAR
// ==========================================
export async function exportRelatorioContratosAFPDF(contratos: ContratoFornecedor[], municipio: Municipio) {
  const doc = new jsPDF();

  await drawOfficialHeader(
    doc,
    'Relatório de Contratos Vigentes da Agricultura Familiar',
    `Controle de Cumprimento do Art. 14 da Lei 11.947/2009 e Teto Anual da DAP/CAF (R$ 40 mil)`,
    municipio
  );

  const LIMITE_DAP = 40000;
  const data = contratos.map(c => {
    const percTeto = (c.valorTotalContrato / LIMITE_DAP) * 100;
    return [
      c.numeroContrato,
      c.fornecedorNome,
      c.fornecedorDapCaf,
      formatCurrency(c.valorTotalContrato),
      `${formatDate(c.dataInicio)} a ${formatDate(c.dataFim)}`,
      `${percTeto.toFixed(0)}% (Saldo: ${formatCurrency(LIMITE_DAP - c.valorTotalContrato)})`,
      c.status
    ];
  });

  autoTable(doc, {
    startY: 46,
    head: [['Nº Contrato', 'Produtor / Associação', 'DAP / CAF', 'Valor (R$)', 'Vigência', 'Uso do Teto DAP', 'Status']],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  addOfficialFooters(doc, `REL-CONTRATOS-AF-${municipio.anoExercicio}`);
  doc.save(`Relatorio_Contratos_Agricultura_Familiar_${municipio.anoExercicio}.pdf`);
}

// ==========================================
// 7. RELATÓRIO ESPECÍFICO DE ENTREGAS E CONFERÊNCIA
// ==========================================
export async function exportRelatorioEntregasPDF(entregas: EntregaMercadoria[], municipio: Municipio) {
  const doc = new jsPDF();

  await drawOfficialHeader(
    doc,
    'Registro Histórico de Entregas e Conferência nas Escolas',
    `Rastreabilidade das Remessas, Pareceres de Qualidade e Conformidade FNDE`,
    municipio
  );

  const data = entregas.map(ent => [
    formatDate(ent.dataEntrega),
    ent.numeroAF,
    ent.escolaNome,
    ent.fornecedorNome,
    ent.statusConferencia,
    ent.parecerQualidade,
    ent.responsavelRecebimentoNome
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['Data', 'Nº AF', 'Escola Destinatária', 'Fornecedor Contratado', 'Conferência', 'Qualidade', 'Recebedor(a)']],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  addOfficialFooters(doc, `REL-ENTREGAS-${municipio.anoExercicio}`);
  doc.save(`Relatorio_Historico_Entregas_${municipio.anoExercicio}.pdf`);
}

// ==========================================
// 8. PROJEÇÃO DE COMPRAS E DEMANDA NUTRICIONAL
// ==========================================
export async function exportProjecaoComprasPDF(
  cardapio: Cardapio,
  totalAlunos: number,
  diasLetivosMes: number,
  consolidadoAlimentos: {
    nome: string;
    unidade: string;
    perCapitaTotalSemanaG: number;
    quantidadeMensalKg: number;
    precoUnitario: number;
    custoTotal: number;
    ehAgriFamiliar: boolean;
  }[],
  municipio: Municipio
) {
  const doc = new jsPDF();

  await drawOfficialHeader(
    doc,
    'Projeção Oficial de Compras e Estimativa de Demanda PNAE',
    `Planejamento de Aquisição: ${totalAlunos.toLocaleString('pt-BR')} Alunos • ${diasLetivosMes} Dias Letivos • Cardápio: ${cardapio.titulo}`,
    municipio
  );

  const custoTotalMensal = consolidadoAlimentos.reduce((acc, item) => acc + item.custoTotal, 0);
  const custoAgriFamiliar = consolidadoAlimentos
    .filter(i => i.ehAgriFamiliar)
    .reduce((acc, item) => acc + item.custoTotal, 0);
  const percentualAgriFamiliar = custoTotalMensal > 0 ? (custoAgriFamiliar / custoTotalMensal) * 100 : 0;

  // Informações da Projeção
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('1. PARÂMETROS E DEMANDA CONSOLIDADA', 14, 47);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Cardápio Base: ${cardapio.titulo} (${cardapio.etapaEnsino})   |   Nutricionista RT: ${cardapio.nutricionistaNome}`, 14, 52);
  doc.text(`Custo Total Mensal Estimado: ${formatCurrency(custoTotalMensal)}   |   Cota Agricultura Familiar: ${formatCurrency(custoAgriFamiliar)} (${percentualAgriFamiliar.toFixed(1)}%)`, 14, 57);

  const tableData = consolidadoAlimentos.map(item => [
    item.nome,
    `${item.perCapitaTotalSemanaG}g / aluno`,
    `${item.quantidadeMensalKg.toLocaleString('pt-BR')} ${item.unidade}`,
    formatCurrency(item.precoUnitario),
    formatCurrency(item.custoTotal),
    item.ehAgriFamiliar ? 'Chamada Pública AF' : 'Lote Geral / Pregão'
  ]);

  autoTable(doc, {
    startY: 63,
    head: [['Gênero Alimentício', 'Per Capita Semanal', 'Demanda Mensal Projetada', 'Preço Ref. Unitário', 'Custo Total Projetado', 'Destinação / Origem']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 36, halign: 'center' },
    }
  });

  addOfficialFooters(doc, `PROJ-COMPRAS-${municipio.anoExercicio}`);
  doc.save(`Projecao_Compras_PNAE_${cardapio.mesReferencia}_${cardapio.etapaEnsino.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

// ==========================================
// 9. INVENTÁRIO E ESTOQUE DA DESPENSA ESCOLAR
// ==========================================
export async function exportInventarioEstoquePDF(
  escola: Escola,
  itensEstoque: EstoqueItemEscola[],
  municipio: Municipio
) {
  const doc = new jsPDF();

  await drawOfficialHeader(
    doc,
    'Relatório de Inventário e Saldo da Despensa Escolar',
    `Unidade Escolar: ${escola.nome} (INEP ${escola.codigoInep}) • Responsável: ${escola.responsavelMerendaNome}`,
    municipio
  );

  const hoje = new Date();
  const data = itensEstoque.map(item => {
    const prazo = new Date(item.dataValidadeProxima);
    const diffDias = Math.ceil((prazo.getTime() - hoje.getTime()) / 86400000);
    const statusValidade = diffDias <= 0 ? 'VENCIDO' : diffDias <= 5 ? `CRÍTICO (${diffDias}d)` : diffDias <= 15 ? `ALERTA (${diffDias}d)` : 'REGULAR';
    const statusEstoque = item.quantidadeAtual <= item.quantidadeMinimaAlerta ? 'ABAIXO DO MÍNIMO' : 'NORMAL';

    return [
      item.alimentoNome,
      item.categoria,
      `${item.quantidadeAtual} ${item.unidadeMedida}`,
      `${item.quantidadeMinimaAlerta} ${item.unidadeMedida}`,
      item.lote,
      formatDate(item.dataValidadeProxima),
      statusValidade,
      statusEstoque
    ];
  });

  autoTable(doc, {
    startY: 46,
    head: [['Gênero Alimentício', 'Categoria', 'Saldo Atual', 'Mín. Alerta', 'Lote', 'Validade', 'Status Validade', 'Estoque']],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 25 : 220;
  const sigY = Math.min(finalY, 250);

  doc.setLineWidth(0.5);
  doc.line(20, sigY, 95, sigY);
  doc.line(115, sigY, 190, sigY);

  doc.setFontSize(8);
  doc.text(escola.responsavelMerendaNome, 57.5, sigY + 4, { align: 'center' });
  doc.text('Responsável pela Despensa / Merendeira Chefe', 57.5, sigY + 8, { align: 'center' });

  doc.text(escola.diretorNome, 152.5, sigY + 4, { align: 'center' });
  doc.text('Diretor(a) da Unidade Escolar', 152.5, sigY + 8, { align: 'center' });

  addOfficialFooters(doc, `ESTOQUE-${escola.codigoInep}`);
  doc.save(`Inventario_Estoque_${escola.nome.replace(/\s+/g, '_')}.pdf`);
}

// ==========================================
// 10. TRILHA DE AUDITORIA E LOGS DE CONFORMIDADE
// ==========================================
export async function exportAuditoriaLogsPDF(logs: AuditoriaLog[], municipio: Municipio) {
  const doc = new jsPDF();

  await drawOfficialHeader(
    doc,
    'Trilha de Auditoria e Logs de Conformidade Legal PNAE',
    'Registro Imutável de Operações Sensíveis: Homologações, Atas do CAE, AFs e Recebimentos',
    municipio
  );

  const data = logs.map(l => [
    l.dataHora,
    l.usuarioNome,
    l.usuarioRole,
    l.modulo,
    l.acao,
    l.detalhes
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['Data e Hora', 'Usuário Responsável', 'Perfil', 'Módulo', 'Ação', 'Detalhes da Operação']],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 26 },
      4: { cellWidth: 28 },
      5: { cellWidth: 44 },
    }
  });

  addOfficialFooters(doc, `AUDIT-LOG-${municipio.anoExercicio}`);
  doc.save(`Trilha_Auditoria_PNAE_${municipio.anoExercicio}.pdf`);
}

// ==========================================
// 11. EXTRATO DO PRODUTOR RURAL / FORNECEDOR AF
// ==========================================
export async function exportExtratoProdutorPDF(
  user: UserProfile,
  contratos: ContratoFornecedor[],
  afs: AutorizacaoFornecimento[],
  entregas: EntregaMercadoria[],
  municipio: Municipio
) {
  const doc = new jsPDF();

  await drawOfficialHeader(
    doc,
    'Extrato Financeiro e de Fornecimento do Produtor Rural',
    `Agricultura Familiar • DAP/CAF: ${user.fornecedorDapCaf || 'CAF-REGULAR'} • Exercício ${municipio.anoExercicio}`,
    municipio
  );

  const LIMITE_DAP = 40000;
  const totalContratado = contratos.reduce((acc, c) => acc + c.valorTotalContrato, 0);
  const saldoDap = Math.max(0, LIMITE_DAP - totalContratado);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DADOS DO PRODUTOR E CONTROLE DE TETO LEGAL', 14, 47);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Produtor / Entidade: ${user.name}   |   CPF/CNPJ: ${user.cpf}`, 14, 52);
  doc.text(`Declaração de Aptidão ao PRONAF (DAP/CAF): ${user.fornecedorDapCaf || 'CAF-RS-2026-881920'}`, 14, 57);
  doc.text(`Teto Anual PNAE (Lei 11.947/09): ${formatCurrency(LIMITE_DAP)}   |   Contratado: ${formatCurrency(totalContratado)}   |   Saldo Disponível: ${formatCurrency(saldoDap)}`, 14, 62);

  // Tabela de Contratos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('2. CONTRATOS VIGENTES', 14, 70);

  const dataContratos = contratos.map(c => [
    c.numeroContrato,
    formatCurrency(c.valorTotalContrato),
    `${formatDate(c.dataInicio)} a ${formatDate(c.dataFim)}`,
    c.status
  ]);

  autoTable(doc, {
    startY: 73,
    head: [['Nº Contrato', 'Valor Contratado', 'Período de Vigência', 'Status']],
    body: dataContratos,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  // Tabela de Autorizações de Fornecimento
  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  let nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 120;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('3. ORDENS DE FORNECIMENTO (AF) EMITIDAS', 14, nextY);

  const dataAFs = afs.map(af => [
    af.numeroAF,
    af.escolaNome,
    formatDate(af.dataLimiteEntrega),
    formatCurrency(af.valorTotalAF),
    af.status
  ]);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Nº AF', 'Escola Destinatária', 'Prazo Limite Entrega', 'Valor Total', 'Status']],
    body: dataAFs,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  addOfficialFooters(doc, `EXTRATO-PROD-${user.cpf.replace(/[^0-9]/g, '')}`);
  doc.save(`Extrato_Produtor_${user.name.replace(/\s+/g, '_')}_${municipio.anoExercicio}.pdf`);
}

// ==========================================
// 12. CARDÁPIO OFICIAL PNAE (EXISTENTE MELHORADO)
// ==========================================
export async function exportCardapioPDF(cardapio: Cardapio, municipio: Municipio) {
  const doc = new jsPDF('landscape');

  await drawOfficialHeader(
    doc,
    'Cardápio Oficial da Alimentação Escolar',
    `${cardapio.titulo} • Etapa: ${cardapio.etapaEnsino} • Nutricionista RT: ${cardapio.nutricionistaNome} (${cardapio.nutricionistaCrn})`,
    municipio,
    true
  );

  // Tabela com dias da semana
  const colHeaders = ['Dia da Semana', 'Tipo', 'Preparação / Prato Principal', 'Ingredientes & Per Capita', 'Valor Nutricional'];
  const rows = cardapio.refeicoes.map(r => [
    r.diaSemana,
    r.tipoRefeicao,
    r.nomePrato,
    r.itens.map(i => `${i.alimentoNome} (${i.perCapitaLiquidoG}${i.unidade}) ${i.ehAgriculturaFamiliar ? '[AF]' : ''}`).join('\n'),
    `Kcal: ${r.totalKcal} | Carb: ${r.totalCarboidratosG}g | Prot: ${r.totalProteinasG}g | Fibras: ${r.totalFibrasG}g | Vit C: ${r.totalVitaminaCMg}mg`,
  ]);

  autoTable(doc, {
    startY: 46,
    head: [colHeaders],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8.5, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 22 },
      2: { cellWidth: 70 },
      3: { cellWidth: 100 },
      4: { cellWidth: 65 },
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 170;
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(8);
  doc.text(`Legenda: [AF] = Gênero proveniente da Agricultura Familiar (Art. 14 Lei 11.947/2009). % Estimado de AF no Cardápio: ${cardapio.percentualAgriFamiliarEstimado}%`, 14, finalY);
  if (cardapio.observacoesDietasEspeciais) {
    doc.text(`Observações / Dietas Especiais: ${cardapio.observacoesDietasEspeciais}`, 14, finalY + 4.5);
  }

  addOfficialFooters(doc, `CARDAPIO-${cardapio.mesReferencia}`, true);
  doc.save(`Cardapio_Oficial_PNAE_${cardapio.mesReferencia}_Semana_${cardapio.semanaNumero}.pdf`);
}

// ==========================================
// 13. TERMO DE RECEBIMENTO DE MERCADORIAS (EXISTENTE MELHORADO)
// ==========================================
export async function exportTermoRecebimentoPDF(entrega: EntregaMercadoria, municipio: Municipio) {
  const doc = new jsPDF();

  await drawOfficialHeader(
    doc,
    'Termo Oficial de Recebimento e Conferência de Alimentos',
    `Unidade Escolar: ${entrega.escolaNome} • Autorização de Fornecimento nº ${entrega.numeroAF}`,
    municipio
  );

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DADOS DO RECEBIMENTO E DO FORNECEDOR', 14, 47);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Escola Municipal: ${entrega.escolaNome}   |   Data da Entrega: ${formatDate(entrega.dataEntrega)}`, 14, 52);
  doc.text(`Fornecedor / Produtor: ${entrega.fornecedorNome}   |   Nota Fiscal/Talão: ${entrega.notaFiscalOuComprovante}`, 14, 57);
  doc.text(`Status da Conferência: ${entrega.statusConferencia}   |   Parecer de Qualidade: ${entrega.parecerQualidade}`, 14, 62);

  const tableData = entrega.itensRecebidos.map(it => [
    it.alimentoNome,
    `${it.quantidadeEsperada} ${it.unidadeMedida}`,
    `${it.quantidadeRecebida} ${it.unidadeMedida}`,
    it.aprovado ? 'Aprovado / Conforme ✓' : 'Divergente / Recusado ✗',
    it.motivoDivergencia || 'Sem ressalvas',
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['Gênero Alimentício', 'Qtd Prevista na AF', 'Qtd Entregue', 'Status Conferência', 'Observações']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 140;

  if (entrega.observacoes) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.text(`Observações da Despensa: "${entrega.observacoes}"`, 14, finalY);
  }

  // Assinaturas
  const sigY = 240;
  doc.setLineWidth(0.5);
  doc.line(20, sigY, 95, sigY);
  doc.line(115, sigY, 190, sigY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(entrega.responsavelRecebimentoNome, 57.5, sigY + 4, { align: 'center' });
  doc.text('Responsável pelo Recebimento na Escola', 57.5, sigY + 8, { align: 'center' });

  doc.text(entrega.fornecedorNome, 152.5, sigY + 4, { align: 'center' });
  doc.text('Produtor Rural / Entregador', 152.5, sigY + 8, { align: 'center' });

  addOfficialFooters(doc, `TERMO-REC-${entrega.numeroAF}`);
  doc.save(`Termo_Recebimento_${entrega.numeroAF}_${entrega.escolaNome.replace(/\s+/g, '_')}.pdf`);
}

// ==========================================
// 14. EDITAL DE CHAMADA PÚBLICA (EXISTENTE MELHORADO)
// ==========================================
export async function exportChamadaPublicaPDF(cp: ChamadaPublica, municipio: Municipio) {
  const doc = new jsPDF();

  await drawOfficialHeader(
    doc,
    `Edital de Chamada Pública nº ${cp.numeroEdital}`,
    `Aquisição Exclusiva de Gêneros da Agricultura Familiar • Art. 14 da Lei nº 11.947/2009`,
    municipio
  );

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('1. OBJETO DA CHAMADA PÚBLICA:', 14, 47);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const splitObjeto = doc.splitTextToSize(cp.objeto, 182);
  doc.text(splitObjeto, 14, 52);

  const afterObjetoY = 52 + splitObjeto.length * 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('2. PRAZOS, VALORES ESTIMADOS E TETO DA DAP/CAF:', 14, afterObjetoY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período de Recebimento de Projetos de Venda: ${formatDate(cp.dataAbertura)} a ${formatDate(cp.dataEncerramento)}`, 14, afterObjetoY + 9);
  doc.text(`Valor Total Estimado do Edital: ${formatCurrency(cp.valorTotalEstimado)} (100% Exclusivo Agricultura Familiar)`, 14, afterObjetoY + 14);
  doc.text(`Limite Individual por Declaração (DAP/CAF): Até R$ 40.000,00 por ano civil conforme Resolução CD/FNDE nº 06/2020.`, 14, afterObjetoY + 19);

  const tableData = cp.itens.map(it => [
    it.descricaoItem,
    `${it.quantidadeTotalSolicitada.toLocaleString('pt-BR')} ${it.unidadeMedida}`,
    formatCurrency(it.precoMaximoReferencia),
    formatCurrency(it.valorTotalItem),
    it.cronogramaEntrega,
    it.exigeOrganico ? 'Orgânico/Agroecológico' : 'Convencional',
  ]);

  autoTable(doc, {
    startY: afterObjetoY + 25,
    head: [['Gênero Alimentício Solicitado', 'Quantidade', 'Preço Ref. Max', 'Valor Total Estimado', 'Cronograma', 'Exigência']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  addOfficialFooters(doc, `EDITAL-CP-${cp.numeroEdital.replace(/[^a-zA-Z0-9]/g, '')}`);
  doc.save(`Edital_Chamada_Publica_${cp.numeroEdital.replace(/[\/\s]/g, '_')}.pdf`);
}

// ==========================================
// 8. FICHA CADASTRAL DO ÓRGÃO GESTOR (EEx)
// ==========================================
export async function exportFichaCadastralOrgaoPDF(orgao: Partial<Municipio>) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const munData: Municipio = {
    id: orgao.id || 'mun-01',
    nome: orgao.nome || 'Santa Clara do Sul',
    uf: orgao.uf || 'RS',
    codigoIbge: orgao.codigoIbge || '4316808',
    totalAlunosPNAE: orgao.totalAlunosPNAE || 4250,
    orcamentoAnualFNDE: orgao.orcamentoAnualFNDE || 720000,
    orcamentoContrapartida: orgao.orcamentoContrapartida || 280000,
    anoExercicio: orgao.anoExercicio || 2026,
    orgaoNome: orgao.orgaoNome,
    cnpj: orgao.cnpj,
    endereco: orgao.endereco,
    email: orgao.email,
    telefone: orgao.telefone,
    gestorNome: orgao.gestorNome,
    gestorCargo: orgao.gestorCargo,
    portaria: orgao.portaria,
    logo1: orgao.logo1,
    logo2: orgao.logo2,
  };

  await drawOfficialHeader(
    doc,
    'FICHA CADASTRAL DA ENTIDADE EXECUTORA (EEx) - PNAE',
    `Cadastro Institucional Oficial • Exercício ${munData.anoExercicio} • Lei Federal nº 11.947/2009`,
    munData
  );

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 60, 30);
  doc.text('1. DADOS INSTITUCIONAIS DA ENTIDADE EXECUTORA:', 14, 48);

  const dadosGerais = [
    ['Razão Social / Nome do Órgão:', orgao.orgaoNome || 'Não informado'],
    ['CNPJ da Entidade Executora:', orgao.cnpj || 'Não informado'],
    ['Município Sede / UF:', `${orgao.nome || ''} - ${orgao.uf || ''}`],
    ['Código IBGE:', orgao.codigoIbge || 'Não informado'],
    ['Exercício Vigente:', `${orgao.anoExercicio || 2026}`],
    ['Endereço Completo da Sede:', orgao.endereco || 'Não informado'],
    ['E-mail Institucional:', orgao.email || 'Não informado'],
    ['Telefone / Contato Oficial:', orgao.telefone || 'Não informado'],
  ];

  autoTable(doc, {
    startY: 52,
    body: dadosGerais,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [60, 60, 60], cellWidth: 60 },
      1: { textColor: [20, 20, 20] },
    },
  });

  const lastY1 = (doc as any).lastAutoTable.finalY + 6;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 60, 30);
  doc.text('2. GESTOR RESPONSÁVEL & ATO DE DESIGNAÇÃO:', 14, lastY1);

  const dadosGestao = [
    ['Nome do(a) Gestor(a) Responsável:', orgao.gestorNome || 'Não informado'],
    ['Cargo / Função Oficial:', orgao.gestorCargo || 'Não informado'],
    ['Portaria / Decreto de Nomeação:', orgao.portaria || 'Não informado'],
  ];

  autoTable(doc, {
    startY: lastY1 + 4,
    body: dadosGestao,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [60, 60, 60], cellWidth: 60 },
      1: { textColor: [20, 20, 20] },
    },
  });

  const lastY2 = (doc as any).lastAutoTable.finalY + 8;

  doc.setFillColor(245, 248, 245);
  doc.rect(14, lastY2, 182, 34, 'F');
  doc.setDrawColor(200, 220, 200);
  doc.rect(14, lastY2, 182, 34, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 70, 30);
  doc.text('DECLARAÇÃO DE CONFORMIDADE E RESPONSABILIDADE LEGAL', 18, lastY2 + 7);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const termoTexto = 'Declaramos para os devidos fins de direito, perante o Fundo Nacional de Desenvolvimento da Educação (FNDE), Ministério da Educação e Conselho de Alimentação Escolar (CAE), que as informações cadastrais e institucionais acima descritas são verídicas e representam a estrutura de gestão do PNAE no presente exercício, comprometendo-se com o cumprimento do percentual mínimo de 30% da Agricultura Familiar (Art. 14 da Lei 11.947/2009).';
  const splitTermo = doc.splitTextToSize(termoTexto, 174);
  doc.text(splitTermo, 18, lastY2 + 13);

  const signY = lastY2 + 55;
  doc.setDrawColor(120, 120, 120);
  doc.line(25, signY, 95, signY);
  doc.line(115, signY, 185, signY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(orgao.gestorNome || 'Gestor(a) Responsável', 60, signY + 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(orgao.gestorCargo || 'Secretário(a) de Educação', 60, signY + 8.5, { align: 'center' });
  doc.text('Entidade Executora (EEx)', 60, signY + 12.5, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Presidência do CAE', 150, signY + 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Conselho de Alimentação Escolar', 150, signY + 8.5, { align: 'center' });
  doc.text('Controle Social / Fiscalização', 150, signY + 12.5, { align: 'center' });

  addOfficialFooters(doc, 'FICHA-CAD-EEX');
  doc.save(`Ficha_Cadastral_Orgao_Gestor_${munData.nome.replace(/\s+/g, '_')}.pdf`);
}

// ==========================================
// 12. COMPOSIÇÃO OFICIAL DO COLEGIADO CAE
// ==========================================
export async function exportFichaColegiadoCaePDF(
  membros: MembroCAE[],
  municipio: Municipio
) {
  const doc = new jsPDF();

  await drawOfficialHeader(
    doc,
    'Ficha de Composição do Conselho de Alimentação Escolar (CAE)',
    'Quadro Oficial de Conselheiros Titulares e Suplentes • Mandato 2024-2028 • Lei nº 11.947/2009',
    municipio
  );

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DADOS INSTITUCIONAIS DO CONSELHO', 14, 47);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Município Sede: ${municipio.nome} - ${municipio.uf}   |   Exercício: ${municipio.anoExercicio}`, 14, 52);
  doc.text(`Vigência do Mandato: 2024 a 2028 (4 anos)   |   Total de Conselheiros: ${membros.length} membros`, 14, 57);

  const presidente = membros.find(m => m.cargoMesa === 'Presidente');
  const vice = membros.find(m => m.cargoMesa === 'Vice-Presidente');
  doc.text(`Presidente: ${presidente?.nome || 'A definir'}   |   Vice-Presidente: ${vice?.nome || 'A definir'}`, 14, 62);

  const tableData = membros.map((m, idx) => [
    (idx + 1).toString(),
    m.nome,
    m.segmento,
    `${m.condicao} (${m.cargoMesa})`,
    m.entidadeRepresentada,
    m.telefone
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['#', 'Nome do Conselheiro', 'Segmento Representado', 'Condição / Mesa', 'Entidade / Órgão', 'Contato']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 45, fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 32, halign: 'center' },
      4: { cellWidth: 35 },
      5: { cellWidth: 20 }
    }
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  const lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 200;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 40, 60);
  doc.text('FUNDAMENTAÇÃO LEGAL DO CONTROLE SOCIAL (ART. 18 E 19 DA LEI 11.947/2009)', 14, lastY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 70, 70);
  const infoLegal = 'O CAE é órgão colegiado de caráter fiscalizador, deliberativo e de assessoramento, composto obrigatoriamente por 1 representante do Poder Executivo, 2 representantes de trabalhadores da educação/docentes, 2 representantes de pais de alunos e 2 representantes de entidades civis organizadas, com mandato de 4 (quatro) anos, vedada a recondução no mesmo cargo de presidência por mais de 2 mandatos consecutivos.';
  const splitInfo = doc.splitTextToSize(infoLegal, 182);
  doc.text(splitInfo, 14, lastY + 5);

  const signY = 245;
  doc.setLineWidth(0.5);
  doc.line(20, signY, 95, signY);
  doc.line(115, signY, 190, signY);

  doc.setFontSize(8);
  doc.text(presidente?.nome || 'Presidente do Conselho CAE', 57.5, signY + 4, { align: 'center' });
  doc.text('Conselho de Alimentação Escolar', 57.5, signY + 8, { align: 'center' });

  doc.text(municipio.gestorNome || 'Prefeito(a) / Gestor(a) Municipal', 152.5, signY + 4, { align: 'center' });
  doc.text('Poder Executivo Municipal', 152.5, signY + 8, { align: 'center' });

  addOfficialFooters(doc, `CAE-COLEGIADO-${municipio.codigoIbge}`);
  doc.save(`Composicao_Colegiado_CAE_${municipio.nome.replace(/\s+/g, '_')}.pdf`);
}

// ==========================================
// 15. CHECKLIST DE CONFORMIDADE IN LOCO (LEI 11.947/2009)
// ==========================================
export async function exportChecklistConformidadePDF(
  data: ChecklistConformidadeData,
  municipio: Municipio
) {
  const doc = new jsPDF();

  await drawOfficialHeader(
    doc,
    'Laudo de Vistoria e Checklist de Conformidade In Loco',
    `Avaliação Técnica Sanitária e Nutricional • Lei Federal nº 11.947/2009 • Res. CD/FNDE nº 06/2020`,
    municipio
  );

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DADOS DA FISCALIZAÇÃO IN LOCO', 14, 47);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Unidade Escolar: ${data.escolaNome}   |   Data da Vistoria: ${formatDate(data.dataVistoria)}`, 14, 52);
  doc.text(`Responsável na Escola: ${data.responsavelEscolaNome || 'Não informado'} (${data.responsavelEscolaCargo || 'Cozinha / Direção'})`, 14, 56.5);
  doc.text(`Conselheiros do CAE Presentes: ${data.conselheiros.join(', ')}`, 14, 61);
  doc.text(`Índice de Conformidade Legal: ${data.pontuacaoGeral}%   |   Classificação: ${data.classificacaoLegal}`, 14, 65.5);

  const tableData = data.itens.map((item, idx) => {
    const statusText = item.status === 'Conforme' 
      ? 'CONFORME [✓]' 
      : item.status === 'NaoConforme' 
      ? 'NÃO CONFORME [✗]' 
      : 'NÃO SE APLICA [-]';
    
    return [
      `${idx + 1}. ${item.titulo}\n(${item.artigoLei})`,
      item.eixo,
      statusText,
      item.observacao || item.detalheObrigatorio
    ];
  });

  autoTable(doc, {
    startY: 70,
    head: [['Item Avaliado / Amparo Legal', 'Eixo Temático', 'Status', 'Evidências & Observações']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 67 }
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 2) {
        const raw = String(hookData.cell.raw);
        if (raw.includes('NÃO CONFORME')) {
          hookData.cell.styles.textColor = [200, 20, 20];
          hookData.cell.styles.fontStyle = 'bold';
        } else if (raw.includes('CONFORME')) {
          hookData.cell.styles.textColor = [20, 120, 40];
          hookData.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  let nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 210;

  if (nextY > 230) {
    doc.addPage();
    await drawOfficialHeader(doc, 'Laudo de Vistoria e Checklist de Conformidade', 'Parecer e Recomendações', municipio);
    nextY = 46;
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 40, 60);
  doc.text('2. PARECER GERAL E RECOMENDAÇÕES DA EQUIPE FISCALIZADORA', 14, nextY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  const obsText = data.observacoesGerais || 'Vistoria in loco concluída sem ocorrências impeditivas adicionais.';
  const splitObs = doc.splitTextToSize(`Observações do CAE: ${obsText}`, 182);
  doc.text(splitObs, 14, nextY + 5);

  const afterObsY = nextY + 5 + splitObs.length * 4;

  if (data.recomendacoesImediatas) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(160, 40, 20);
    doc.text('Recomendações e Prazos Notificados à Direção / Gestor:', 14, afterObsY + 2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const splitRec = doc.splitTextToSize(data.recomendacoesImediatas, 182);
    doc.text(splitRec, 14, afterObsY + 6);
  }

  const signY = 250;
  doc.setLineWidth(0.5);
  doc.line(20, signY, 95, signY);
  doc.line(115, signY, 190, signY);

  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(data.conselheiros[0] || 'Conselheiro(a) Relator(a) do CAE', 57.5, signY + 4, { align: 'center' });
  doc.text('Conselho de Alimentação Escolar', 57.5, signY + 8, { align: 'center' });

  doc.text(data.responsavelEscolaNome || 'Responsável pela Escola', 152.5, signY + 4, { align: 'center' });
  doc.text(data.responsavelEscolaCargo || 'Cozinha / Direção da Unidade', 152.5, signY + 8, { align: 'center' });

  addOfficialFooters(doc, `CHECKLIST-CAE-${data.escolaId.toUpperCase()}`);
  doc.save(`Checklist_Conformidade_CAE_${data.escolaNome.replace(/\s+/g, '_')}_${data.dataVistoria}.pdf`);
}




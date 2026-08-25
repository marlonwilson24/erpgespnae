export interface PnaeLegalTopic {
  id: string;
  title: string;
  articleRef: string;
  category: 'LEGISLAÇÃO' | 'AGRICULTURA_FAMILIAR' | 'CAE' | 'NUTRIÇÃO' | 'SISTEMA';
  summary: string;
  details: string;
  keywords: string[];
}

export const PNAE_KNOWLEDGE_BASE: PnaeLegalTopic[] = [
  {
    id: 'art-14-agri-familiar',
    title: 'Mínimo de 30% da Agricultura Familiar (Art. 14)',
    articleRef: 'Lei nº 11.947/2009, Art. 14 & Res. FNDE nº 06/2020',
    category: 'AGRICULTURA_FAMILIAR',
    summary: 'Do total dos recursos financeiros repassados pelo FNDE, no mínimo 30% devem ser utilizados na aquisição de gêneros alimentícios diretamente da Agricultura Familiar e do Empreendedor Familiar Rural.',
    details: 'A aquisição pode ser realizada por meio de Chamada Pública, dispensando licitação tradicional conforme Art. 14 da Lei 11.947/2009. Prioriza-se assentamentos da reforma agrária, comunidades tradicionais indígenas e quilombolas, e produtores de orgânicos.',
    keywords: ['30%', 'artigo 14', 'agricultura familiar', 'porcentagem', 'recurso fnde', 'chamada publica', 'obrigatorio', 'meta legal']
  },
  {
    id: 'teto-dap-caf',
    title: 'Limite Individual da DAP / CAF (R$ 40.000 / ano)',
    articleRef: 'Resolução CD/FNDE nº 06/2020, Art. 39',
    category: 'AGRICULTURA_FAMILIAR',
    summary: 'O limite individual de venda do Agricultor Familiar e do Empreendedor Familiar Rural para a alimentação escolar é de até R$ 40.000,00 por DAP/CAF por ano civil, por Entidade Executora (EEx).',
    details: 'Para cooperativas e associações, o limite total é o resultado da multiplicação de R$ 40.000,00 pelo número de cooperados/associados ativos com DAP/CAF física válida vinculada à proposta.',
    keywords: ['teto', 'limite', 'dap', 'caf', '40000', '40 mil', 'produtor', 'valor maximo', 'cooperativa']
  },
  {
    id: 'prioridades-chamada-publica',
    title: 'Ordem de Prioridade na Chamada Pública',
    articleRef: 'Lei nº 11.947/2009, Art. 14, § 1º & Res. FNDE 06/2020',
    category: 'AGRICULTURA_FAMILIAR',
    summary: 'Critérios de desempate e prioridade na seleção dos projetos de venda da agricultura familiar.',
    details: '1º: Assentamentos de reforma agrária, comunidades tradicionais indígenas e comunidades quilombolas.\n2º: Fornecedores de gêneros certificados como orgânicos ou agroecológicos.\n3º: Grupos de mulheres.\n4º: Fornecedores locais do município, seguidos pelos do território rural, estado e país.',
    keywords: ['prioridade', 'desempate', 'indigenas', 'quilombolas', 'assentados', 'organicos', 'mulheres', 'local']
  },
  {
    id: 'papel-cae',
    title: 'Atribuições e Competências do CAE',
    articleRef: 'Lei nº 11.947/2009, Arts. 18 e 19',
    category: 'CAE',
    summary: 'O Conselho de Alimentação Escolar (CAE) é órgão colegiado de fiscalização e controle social do PNAE.',
    details: 'Competências: fiscalizar a aplicação dos recursos transferidos pelo FNDE; zelar pela qualidade dos alimentos (higiene, aceitabilidade, condições de armazenamento); fiscalizar os cardápios; realizar visitas in loco e emitir o Parecer Conclusivo anual no SIGPC/FNDE.',
    keywords: ['cae', 'conselho', 'fiscalizacao', 'parecer', 'visita', 'atribuicao', 'controle social', 'membros']
  },
  {
    id: 'parecer-conclusivo-cae',
    title: 'Emissão do Parecer Conclusivo Anual do CAE',
    articleRef: 'Resolução CD/FNDE nº 06/2020, Art. 56',
    category: 'CAE',
    summary: 'O CAE deve analisar a prestação de contas da EEx e emitir o Parecer Conclusivo até o prazo fixado pelo FNDE.',
    details: 'Opções de deliberação: Aprovação Total, Aprovação com Ressalvas ou Reprovação. Caso reprovado ou com irregularidades graves não sanadas, o FNDE pode suspender os repasses federais até regularização.',
    keywords: ['parecer conclusivo', 'aprovacao', 'ressalvas', 'reprovacao', 'prazo cae', 'sigpc']
  },
  {
    id: 'diretrizes-nutricionais',
    title: 'Exigências Nutricionais e Alimentos Proibidos',
    articleRef: 'Resolução CD/FNDE nº 06/2020, Arts. 17 a 22',
    category: 'NUTRIÇÃO',
    summary: 'Regras rigorosas para garantir alimentação saudável, adequada e segura nas escolas públicas.',
    details: 'É proibida a aquisição de bebidas de baixo teor nutricional (refrigerantes, refrescos artificiais). Alimentos ultraprocessados têm limite máximo de 15% dos recursos. Obrigatório mínimo de 280g/aluno/semana de frutas e hortaliças. Cardápios devem cobrir de 20% a 70% das necessidades nutricionais diárias conforme a jornada.',
    keywords: ['nutricao', 'ultraprocessados', 'refrigerante', 'acucar', 'frutas', 'hortalicas', 'vet', 'proibido', 'restricao']
  },
  {
    id: 'responsavel-tecnico-nutri',
    title: 'Responsável Técnico (RT) Nutricionista',
    articleRef: 'Lei nº 11.947/2009, Art. 12',
    category: 'NUTRIÇÃO',
    summary: 'A elaboração dos cardápios do PNAE é atribuição privativa e obrigatória de nutricionista habilitado com CRN.',
    details: 'O Nutricionista RT deve calcular os parâmetros nutricionais (energia, carboidratos, proteínas, lipídios, fibras, cálcio, ferro, vitamina C), respeitar hábitos culturais e testar a aceitabilidade dos alimentos (mínimo de 85% para preparações novas).',
    keywords: ['nutricionista', 'rt', 'crn', 'responsavel tecnico', 'aceitabilidade', 'cardapio', 'calculo nutricional']
  },
  {
    id: 'termo-recebimento-escola',
    title: 'Recebimento de Mercadorias e Conferência na Escola',
    articleRef: 'Resolução CD/FNDE nº 06/2020, Art. 48',
    category: 'SISTEMA',
    summary: 'Como realizar a conferência física e documental no momento da entrega dos alimentos na escola.',
    details: 'No ato da entrega pelo fornecedor: conferir quantidades conforme Autorização de Fornecimento (AF), checar validade, temperatura, integridade das embalagens e frescor de hortifrútis. Em caso de desconformidade, registrar recusa parcial/total e emitir o Termo de Recebimento com ressalvas.',
    keywords: ['recebimento', 'conferencia', 'af', 'entrega', 'escola', 'termo', 'validade', 'recusa', 'divergencia']
  },
  {
    id: 'suporte-sistema-chamadas',
    title: 'Como lançar uma Chamada Pública no Sistema',
    articleRef: 'PNAE Gestão - Manual Operacional',
    category: 'SISTEMA',
    summary: 'Passo a passo para publicar edital de compras da agricultura familiar no sistema.',
    details: 'Acesse o módulo "Chamadas Públicas", clique em "Nova Chamada Pública", preencha o número do edital, período de recebimento de projetos de venda, vincule os itens projetados pela nutricionista com preços de referência do mercado local e publique.',
    keywords: ['como criar chamada', 'novo edital', 'sistema', 'publicar chamada', 'cadastrar item']
  },
  {
    id: 'prestacao-contas-sigpc',
    title: 'Prestação de Contas Anual e SIGPC',
    articleRef: 'Lei nº 11.947/2009, Art. 20',
    category: 'LEGISLAÇÃO',
    summary: 'Comprovação da aplicação correta dos recursos transferidos pela União no exercício.',
    details: 'A Entidade Executora deve registrar todas as despesas no SIGPC/FNDE, demonstrando a aplicação dos 30% da agricultura familiar, conciliação bancária, extratos e submeter ao CAE para emissão do parecer conclusivo até o prazo legal.',
    keywords: ['prestacao de contas', 'sigpc', 'fnde', 'exercicio', 'conciliacao', 'extrato', 'superavit']
  }
];

export const QUICK_QUESTIONS = [
  'Qual é a porcentagem mínima obrigatória para compra da Agricultura Familiar?',
  'Qual é o teto máximo de venda anual por DAP/CAF no PNAE?',
  'Quais são os critérios de prioridade na Chamada Pública?',
  'Quais alimentos são proibidos ou restritos pela Resolução FNDE 06/2020?',
  'Como o CAE deve emitir o Parecer Conclusivo?',
  'Como registrar uma entrega com itens divergentes na escola?'
];

export function searchLocalKnowledge(query: string): { topic?: PnaeLegalTopic; answer: string } {
  const clean = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const item of PNAE_KNOWLEDGE_BASE) {
    const matchKeyword = item.keywords.some(k => clean.includes(k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
    if (matchKeyword) {
      return {
        topic: item,
        answer: `📌 **${item.title}** (${item.articleRef})\n\n${item.summary}\n\n**Detalhamento Jurídico & Operacional:**\n${item.details}`
      };
    }
  }

  return {
    answer: `Conforme a **Lei Federal nº 11.947/2009** e a **Resolução CD/FNDE nº 06/2020**:\n\n• O PNAE visa garantir a segurança alimentar dos estudantes com no mínimo **30% dos repasses federais** aplicados em produtos da Agricultura Familiar local.\n• O limite anual por produtor é de **R$ 40.000,00 por DAP/CAF**.\n• O controle social é exercido de forma autônoma pelo **Conselho de Alimentação Escolar (CAE)**.\n\n*Para dúvidas específicas, experimente perguntar sobre teto da DAP, prioridades de chamada pública, fiscalização do CAE ou cálculo nutricional.*`
  };
}

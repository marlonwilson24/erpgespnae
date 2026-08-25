import React, { useState, useMemo } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { ItemChecklistConformidade, ChecklistConformidadeData, ParecerQualidade } from '../../types';
import { exportChecklistConformidadePDF } from '../../lib/exportPdf';
import { 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Scale, 
  Download, 
  Save, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Building2, 
  Calendar, 
  UserCheck, 
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  FileCheck2,
  Apple,
  Sprout,
  Package,
  Sparkle,
  UtensilsCrossed
} from 'lucide-react';

const ITENS_LEI_11947_PADRAO: ItemChecklistConformidade[] = [
  // Eixo 1: Nutrição e Cardápio (Arts. 2º, 3º e 12 da Lei 11.947/2009)
  {
    id: 'item-nut-1',
    eixo: 'Nutrição e Cardápio',
    artigoLei: 'Art. 3º e 12 da Lei 11.947/2009',
    titulo: 'Cardápio Afixado e Assinado por Nutricionista RT',
    descricao: 'O cardápio da semana está afixado em local visível e acessível para toda a comunidade escolar, contendo identificação do(a) nutricionista com CRN ativo.',
    detalheObrigatorio: 'Exigência legal do PNAE para transparência e garantia da atuação técnica do nutricionista.',
    status: 'Conforme',
    observacao: 'Cardápio da semana visível na entrada do refeitório, assinado pela nutricionista RT.',
    pesoCritico: true,
  },
  {
    id: 'item-nut-2',
    eixo: 'Nutrição e Cardápio',
    artigoLei: 'Art. 3º, Inciso I da Lei 11.947/2009',
    titulo: 'Conformidade da Refeição Servida no Dia',
    descricao: 'A refeição servida no dia da vistoria corresponde exatamente à preparação e porções programadas no cardápio homologado.',
    detalheObrigatorio: 'Não é permitida a substituição arbitrária de ingredientes sem prévia justificativa técnica do nutricionista.',
    status: 'Conforme',
    observacao: 'Refeição do dia servida rigorosamente de acordo com a programação semanal.',
    pesoCritico: false,
  },
  {
    id: 'item-nut-3',
    eixo: 'Nutrição e Cardápio',
    artigoLei: 'Art. 12 e Res. CD/FNDE nº 06/2020',
    titulo: 'Oferta Mínima de Frutas e Hortaliças Frescas',
    descricao: 'Garantia da oferta de no mínimo 3 porções de frutas e hortaliças por semana (200g/aluno/semana na educação básica).',
    detalheObrigatorio: 'Cumprimento das metas nutricionais de micronutrientes e fibras recomendadas pelo FNDE.',
    status: 'Conforme',
    observacao: 'Banana e maçã servidas como sobremesa e salada de alface/tomate no almoço.',
    pesoCritico: true,
  },
  {
    id: 'item-nut-4',
    eixo: 'Nutrição e Cardápio',
    artigoLei: 'Art. 14 da Resolução CD/FNDE nº 06/2020',
    titulo: 'Restrição a Ultraprocessados e Bebidas Açucaradas',
    descricao: 'Ausência total de refrigerantes, sucos artificiais em pó, refrescos adoçados, guloseimas e alimentos ultraprocessados com excesso de sódio ou gordura.',
    detalheObrigatorio: 'Proibição expressa de bebidas de baixo teor nutricional no ambiente escolar.',
    status: 'Conforme',
    observacao: 'Nenhum item ultraprocessado ou refrigerante constatado na despensa.',
    pesoCritico: true,
  },
  {
    id: 'item-nut-5',
    eixo: 'Nutrição e Cardápio',
    artigoLei: 'Art. 12, § 2º da Lei 11.947/2009',
    titulo: 'Atendimento às Necessidades Nutricionais Especiais',
    descricao: 'Preparo individualizado e adaptado para alunos com diagnóstico de diabetes, doença celíaca, intolerância à lactose, alergias alimentares ou fenilcetonúria.',
    detalheObrigatorio: 'Direito à alimentação escolar adequada a condições de saúde específicas com laudo médico.',
    status: 'Conforme',
    observacao: 'Escola possui 2 alunos celíacos com cardápio sem glúten armazenado separadamente.',
    pesoCritico: true,
  },

  // Eixo 2: Aquisição da Agricultura Familiar (Art. 14 da Lei 11.947/2009)
  {
    id: 'item-agri-1',
    eixo: 'Agricultura Familiar',
    artigoLei: 'Art. 14 da Lei 11.947/2009',
    titulo: 'Presença de Alimentos da Agricultura Familiar',
    descricao: 'Constatação física de gêneros alimentícios oriundos de produtores rurais familiares, cooperativas ou assentamentos com DAP/CAF.',
    detalheObrigatorio: 'Mínimo legal de 30% dos recursos federais do PNAE investidos na agricultura familiar.',
    status: 'Conforme',
    observacao: 'Hortaliças, mandioca e frutas entregues pela Cooperativa da Agricultura Familiar local.',
    pesoCritico: true,
  },
  {
    id: 'item-agri-2',
    eixo: 'Agricultura Familiar',
    artigoLei: 'Art. 14, § 1º da Lei 11.947/2009',
    titulo: 'Qualidade Sensorial e Frescor dos Produtos Locais',
    descricao: 'Os hortifrútis e produtos da agricultura familiar apresentam integridade física, frescor, ausência de pragas, bolores ou sinais de deterioração.',
    detalheObrigatorio: 'Critério de qualidade e segurança do alimento entregue diretamente pelo produtor.',
    status: 'Conforme',
    observacao: 'Gêneros frescos recebidos no dia anterior com ótimo aspecto e padronização.',
    pesoCritico: false,
  },
  {
    id: 'item-agri-3',
    eixo: 'Agricultura Familiar',
    artigoLei: 'Art. 14 da Lei 11.947 / Manual FNDE',
    titulo: 'Termo de Recebimento de Mercadoria e Comprovante de AF',
    descricao: 'Existência do Termo Oficial de Recebimento assinado na escola, conferindo os quantitativos entregues com a Autorização de Fornecimento (AF).',
    detalheObrigatorio: 'Rastreabilidade fiscal e física da entrega de cada remessa.',
    status: 'Conforme',
    observacao: 'Talão de notas fiscais e termos de recebimento arquivados na pasta de merenda.',
    pesoCritico: false,
  },

  // Eixo 3: Armazenamento e Validade (Manual de Boas Práticas e FNDE)
  {
    id: 'item-arm-1',
    eixo: 'Armazenamento e Validade',
    artigoLei: 'RDC 216/Anvisa e Manual do CAE',
    titulo: 'Armazenamento sobre Estrados e Prateleiras Laváveis',
    descricao: 'Gêneros alimentícios devidamente organizados em estrados plásticos ou inox (mínimo 15 cm do piso e 50 cm das paredes), sem contato direto com o solo.',
    detalheObrigatorio: 'Garante ventilação, evita umidade e impede o trânsito de pragas.',
    status: 'Conforme',
    observacao: 'Despensa possui estrados plásticos de alta resistência e prateleiras higienizadas.',
    pesoCritico: true,
  },
  {
    id: 'item-arm-2',
    eixo: 'Armazenamento e Validade',
    artigoLei: 'Manual FNDE / Código de Defesa do Consumidor',
    titulo: 'Controle Rigoroso de Prazos de Validade (Método PVPS)',
    descricao: 'Todos os produtos estão dentro do prazo de validade e organizados pelo método Primeiro que Vence, Primeiro que Sai (PVPS).',
    detalheObrigatorio: 'Proibição de qualquer gênero vencido ou com embalagem estufada/danificada no estoque.',
    status: 'Conforme',
    observacao: 'Todos os lotes etiquetados com data de recebimento e controle de validade em dia.',
    pesoCritico: true,
  },
  {
    id: 'item-arm-3',
    eixo: 'Armazenamento e Validade',
    artigoLei: 'RDC 216/Anvisa e Boas Práticas PNAE',
    titulo: 'Ventilação, Iluminação e Telas de Proteção contra Pragas',
    descricao: 'A despensa é arejada, com temperatura amena, sem infiltrações e possui telas milimétricas íntegras em todas as janelas e aberturas.',
    detalheObrigatorio: 'Prevenção contra a entrada de insetos, roedores e vetores de contaminação.',
    status: 'Conforme',
    observacao: 'Janelas teladas e ambiente fresco com termômetro de controle ambiental.',
    pesoCritico: false,
  },
  {
    id: 'item-arm-4',
    eixo: 'Armazenamento e Validade',
    artigoLei: 'RDC 216/Anvisa / Normas Sanitárias',
    titulo: 'Isolamento de Produtos Químicos e Saneantes',
    descricao: 'Produtos de limpeza e saneantes estão guardados em armário exclusivo, fechado e totalmente isolado dos alimentos secos e perecíveis.',
    detalheObrigatorio: 'Evita contaminação cruzada por substâncias tóxicas.',
    status: 'Conforme',
    observacao: 'Materiais de limpeza mantidos em depósito anexo exclusivo e trancado.',
    pesoCritico: true,
  },

  // Eixo 4: Higiene e Manipulação (RDC 216/Anvisa & Manual do CAE)
  {
    id: 'item-hig-1',
    eixo: 'Higiene e Manipulação',
    artigoLei: 'RDC 216/Anvisa e Boas Práticas PNAE',
    titulo: 'Uso de EPIs e Paramentação das Merendeiras',
    descricao: 'Manipuladoras de alimentos vestem uniforme completo e limpo (touca protetora de cabelo, avental claro, sapatos fechados, unhas curtas e sem adornos).',
    detalheObrigatorio: 'Barreira física fundamental contra contaminação microbiológica dos alimentos.',
    status: 'Conforme',
    observacao: 'Equipe de 3 merendeiras paramentadas com touca, avental e calçado de segurança.',
    pesoCritico: true,
  },
  {
    id: 'item-hig-2',
    eixo: 'Higiene e Manipulação',
    artigoLei: 'Portaria MS 888 / Res. CD/FNDE nº 06/2020',
    titulo: 'Água Potável e Higienização Semestral da Caixa d’Água',
    descricao: 'Disponibilidade de água tratada/filtrada para consumo dos alunos e preparo das refeições, com comprovante de limpeza da caixa d’água nos últimos 6 meses.',
    detalheObrigatorio: 'Garantia de potabilidade e prevenção de surtos de doenças de veiculação hídrica.',
    status: 'Conforme',
    observacao: 'Certificado de higienização da caixa d’água afixado na cozinha, com validade até o próximo semestre.',
    pesoCritico: true,
  },
  {
    id: 'item-hig-3',
    eixo: 'Higiene e Manipulação',
    artigoLei: 'RDC 216/Anvisa / Manual FNDE',
    titulo: 'Higienização e Desinfecção Correta de Hortifrúti',
    descricao: 'Procedimento correto de lavagem e sanitização de frutas e verduras cruas em solução clorada adequada (tempo de imersão e enxágue) antes do consumo.',
    detalheObrigatorio: 'Eliminação de parasitas e bactérias patogênicas em saladas e frutas servidas cruas.',
    status: 'Conforme',
    observacao: 'Balde e hipoclorito de sódio alimentar disponíveis com protocolo de diluição visível.',
    pesoCritico: false,
  },

  // Eixo 5: Estrutura e Controle Social (Arts. 15 e 19 da Lei 11.947/2009)
  {
    id: 'item-est-1',
    eixo: 'Estrutura e Controle Social',
    artigoLei: 'Arts. 15 e 19 da Lei 11.947/2009',
    titulo: 'Condições do Refeitório e Acolhimento dos Alunos',
    descricao: 'Espaço de alimentação limpo, iluminado, arejado, com mesas e cadeiras higienizadas e em tamanho ergonômico para a faixa etária atendida.',
    detalheObrigatorio: 'Espaço pedagógico e de socialização durante o momento da refeição escolar.',
    status: 'Conforme',
    observacao: 'Refeitório coberto com mesas confortáveis e bebedouro higienizado.',
    pesoCritico: false,
  },
  {
    id: 'item-est-2',
    eixo: 'Estrutura e Controle Social',
    artigoLei: 'Art. 19 da Lei 11.947/2009 / Manual do CAE',
    titulo: 'Livre Acesso do CAE e Transparência na Fiscalização',
    descricao: 'Garantia de livre acesso dos conselheiros do CAE a todas as dependências da escola (cozinha, despensa, refeitório) e aos registros e notas da merenda.',
    detalheObrigatorio: 'Prerrogativa inegociável de fiscalização do Controle Social garantida por Lei Federal.',
    status: 'Conforme',
    observacao: 'Direção e equipe da cozinha franquearam acesso total e irrestrito aos conselheiros.',
    pesoCritico: true,
  },
];

interface CaeChecklistConformidadeProps {
  onChecklistSalvo?: () => void;
  escolaPreSelecionadaId?: string;
}

export const CaeChecklistConformidade: React.FC<CaeChecklistConformidadeProps> = ({
  onChecklistSalvo,
  escolaPreSelecionadaId
}) => {
  const { municipio, escolas, registrarVisitaCae, currentUser, membrosCae } = usePNAE();

  const [escolaId, setEscolaId] = useState<string>(
    escolaPreSelecionadaId || escolas[0]?.id || ''
  );
  const [dataVistoria, setDataVistoria] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [conselheirosTexto, setConselheirosTexto] = useState<string>(
    currentUser?.name ? `${currentUser.name} (Relator)` : 'Prof. Carlos Eduardo (Relator), Maria Luiza (Pais)'
  );
  const [responsavelEscolaNome, setResponsavelEscolaNome] = useState<string>('Dona Francisca de Assis');
  const [responsavelEscolaCargo, setResponsavelEscolaCargo] = useState<string>('Merendeira-Chefe');
  const [itens, setItens] = useState<ItemChecklistConformidade[]>(ITENS_LEI_11947_PADRAO);
  const [eixoFiltro, setEixoFiltro] = useState<string>('TODOS');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [observacoesGerais, setObservacoesGerais] = useState<string>(
    'Vistoria in loco realizada com rigor técnico. Despensa e cozinha em excelente estado sanitário, refeição do dia saborosa e nutritiva, com cumprimento integral das diretrizes da Lei Federal nº 11.947/2009.'
  );
  const [recomendacoesImediatas, setRecomendacoesImediatas] = useState<string>(
    'Manter a periodicidade do registro das temperaturas dos refrigeradores e garantir reposição de toucas descartáveis.'
  );
  const [mostrarApenasNaoConformes, setMostrarApenasNaoConformes] = useState<boolean>(false);
  const [itemAbertoObservacao, setItemAbertoObservacao] = useState<string | null>(null);

  // Escola selecionada
  const escolaSelecionada = useMemo(() => {
    return escolas.find(e => e.id === escolaId) || escolas[0];
  }, [escolaId, escolas]);

  // Atualiza nome de responsável quando muda a escola
  const handleEscolaChange = (id: string) => {
    setEscolaId(id);
    const esc = escolas.find(e => e.id === id);
    if (esc) {
      setResponsavelEscolaNome(esc.responsavelMerendaNome || 'Responsável pela Cozinha');
      setResponsavelEscolaCargo('Responsável pela Merenda / Direção');
    }
  };

  // Alterar status do item
  const handleStatusChange = (itemId: string, novoStatus: 'Conforme' | 'NaoConforme' | 'NaoAplica') => {
    setItens(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: novoStatus };
      }
      return item;
    }));
  };

  // Alterar observação do item
  const handleObservacaoChange = (itemId: string, texto: string) => {
    setItens(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, observacao: texto };
      }
      return item;
    }));
  };

  // Cálculos de Conformidade
  const metricas = useMemo(() => {
    const totalItens = itens.length;
    const conformes = itens.filter(i => i.status === 'Conforme').length;
    const naoConformes = itens.filter(i => i.status === 'NaoConforme').length;
    const naoAplica = itens.filter(i => i.status === 'NaoAplica').length;
    const itensAvaliados = totalItens - naoAplica;

    const pontuacao = itensAvaliados > 0 
      ? Math.round((conformes / itensAvaliados) * 100) 
      : 100;

    let classificacao: 'Excelente / Plena Conformidade' | 'Satisfatório com Recomendações' | 'Irregular / Risco Sanitário ou Legal' = 'Excelente / Plena Conformidade';
    if (pontuacao < 70 || naoConformes >= 3) {
      classificacao = 'Irregular / Risco Sanitário ou Legal';
    } else if (pontuacao < 90 || naoConformes > 0) {
      classificacao = 'Satisfatório com Recomendações';
    }

    const criticosNaoConformes = itens.filter(i => i.pesoCritico && i.status === 'NaoConforme');

    // Métricas por Eixo
    const eixos = Array.from(new Set(itens.map(i => i.eixo)));
    const scoresPorEixo = eixos.map(eixo => {
      const itensDoEixo = itens.filter(i => i.eixo === eixo);
      const conf = itensDoEixo.filter(i => i.status === 'Conforme').length;
      const naoConf = itensDoEixo.filter(i => i.status === 'NaoConforme').length;
      const na = itensDoEixo.filter(i => i.status === 'NaoAplica').length;
      const totalValidos = itensDoEixo.length - na;
      const pct = totalValidos > 0 ? Math.round((conf / totalValidos) * 100) : 100;
      return {
        eixo,
        total: itensDoEixo.length,
        conformes: conf,
        naoConformes: naoConf,
        pct,
      };
    });

    return {
      totalItens,
      conformes,
      naoConformes,
      naoAplica,
      pontuacao,
      classificacao,
      criticosNaoConformes,
      scoresPorEixo,
    };
  }, [itens]);

  // Filtros
  const itensFiltrados = useMemo(() => {
    return itens.filter(item => {
      const matchEixo = eixoFiltro === 'TODOS' || item.eixo === eixoFiltro;
      const matchTermo = termoBusca === '' ||
        item.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
        item.descricao.toLowerCase().includes(termoBusca.toLowerCase()) ||
        item.artigoLei.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (item.observacao && item.observacao.toLowerCase().includes(termoBusca.toLowerCase()));
      const matchStatus = !mostrarApenasNaoConformes || item.status === 'NaoConforme';
      return matchEixo && matchTermo && matchStatus;
    });
  }, [itens, eixoFiltro, termoBusca, mostrarApenasNaoConformes]);

  // Ações em lote
  const marcarTodosComoConforme = () => {
    setItens(prev => prev.map(item => ({ ...item, status: 'Conforme' })));
  };

  const resetarChecklist = () => {
    setItens(ITENS_LEI_11947_PADRAO);
    setObservacoesGerais('Constatou-se despensa organizada, controle de validade e refeição servida de acordo com o cardápio homologado.');
    setRecomendacoesImediatas('Manter o preenchimento contínuo dos controles de temperatura e recebimento.');
  };

  // Exportar PDF do Checklist
  const handleExportPDF = () => {
    const dados: ChecklistConformidadeData = {
      escolaId,
      escolaNome: escolaSelecionada?.nome || 'Escola Municipal',
      dataVistoria,
      conselheiros: conselheirosTexto.split(',').map(s => s.trim()).filter(Boolean),
      responsavelEscolaNome,
      responsavelEscolaCargo,
      itens,
      observacoesGerais,
      recomendacoesImediatas,
      pontuacaoGeral: metricas.pontuacao,
      classificacaoLegal: metricas.classificacao,
    };
    exportChecklistConformidadePDF(dados, municipio);
  };

  // Salvar no Histórico do CAE
  const handleSalvarVistoria = () => {
    const cardapioOk = !itens.some(i => i.eixo === 'Nutrição e Cardápio' && i.status === 'NaoConforme' && i.pesoCritico);
    const armOk = !itens.some(i => i.eixo === 'Armazenamento e Validade' && i.status === 'NaoConforme' && i.pesoCritico);
    const higOk = !itens.some(i => i.eixo === 'Higiene e Manipulação' && i.status === 'NaoConforme' && i.pesoCritico);
    
    let parecerAceitabilidade: ParecerQualidade = 'Aprovado';
    if (metricas.pontuacao >= 90) parecerAceitabilidade = 'Excelente';
    else if (metricas.pontuacao >= 75) parecerAceitabilidade = 'Bom';
    else if (metricas.pontuacao >= 60) parecerAceitabilidade = 'Regular';
    else parecerAceitabilidade = 'Inadequado';

    const statusPendencia = metricas.naoConformes > 0 ? 'Em Acompanhamento' : 'Sem Pendências';

    registrarVisitaCae({
      escolaId,
      escolaNome: escolaSelecionada?.nome || 'Escola Municipal',
      dataVisita: dataVistoria,
      membrosCaePresentes: conselheirosTexto.split(',').map(s => s.trim()).filter(Boolean),
      cardapioAfixadoEConforme: cardapioOk,
      armazenamentoAdequado: armOk,
      condicoesHigieneAprovadas: higOk,
      aceitabilidadeAlunos: parecerAceitabilidade,
      relatorioObservacoes: `${observacoesGerais} (Pontuação de Conformidade Legal: ${metricas.pontuacao}% - ${metricas.classificacao})`,
      recomendacoesEncaminhadas: recomendacoesImediatas,
      statusPendencia,
      checklistItens: itens,
      pontuacaoConformidade: metricas.pontuacao,
      classificacaoLegal: metricas.classificacao,
      responsavelEscolaNome,
      responsavelEscolaCargo,
    });

    if (onChecklistSalvo) {
      onChecklistSalvo();
    }
  };

  const getEixoIcon = (eixo: string) => {
    switch (eixo) {
      case 'Nutrição e Cardápio':
        return <Apple className="w-4 h-4 text-emerald-600" />;
      case 'Agricultura Familiar':
        return <Sprout className="w-4 h-4 text-lime-600" />;
      case 'Armazenamento e Validade':
        return <Package className="w-4 h-4 text-amber-600" />;
      case 'Higiene e Manipulação':
        return <Sparkle className="w-4 h-4 text-cyan-600" />;
      case 'Estrutura e Controle Social':
        return <UtensilsCrossed className="w-4 h-4 text-purple-600" />;
      default:
        return <Scale className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div id="checklist-conformidade-cae" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header do Checklist com Base Legal */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-900 to-stone-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-400/20 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  Instrumento de Fiscalização In Loco
                </span>
                <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-stone-200 border border-white/10">
                  Lei Federal nº 11.947/2009 • Res. CD/FNDE nº 06/2020
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white mt-2">
                Checklist Oficial de Conformidade Sanitária & Nutricional
              </h2>
              <p className="text-xs md:text-sm text-stone-300 max-w-3xl leading-relaxed mt-1">
                Avaliação presencial dos itens obrigatórios do PNAE: verificação de cardápios, recebimento da agricultura familiar, condições de estocagem, higiene dos manipuladores e aceitabilidade pelos alunos.
              </p>
            </div>

            {/* Gauge de Pontuação Geral */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 min-w-[210px] justify-center text-center">
              <div>
                <div className="text-3xl md:text-4xl font-black text-white flex items-center justify-center gap-1">
                  <span>{metricas.pontuacao}%</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-stone-300 tracking-wider block mt-0.5">
                  Índice de Conformidade
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                  metricas.pontuacao >= 90
                    ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                    : metricas.pontuacao >= 70
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : 'bg-red-400/20 text-red-300 border border-red-400/30'
                }`}>
                  {metricas.classificacao}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Progresso e Métricas Rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="text-stone-300 text-[11px]">Total de Itens da Lei:</span>
              <span className="font-bold text-white text-sm">{metricas.totalItens}</span>
            </div>
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 flex items-center justify-between">
              <span className="text-emerald-200 text-[11px]">Conformes (✓):</span>
              <span className="font-bold text-emerald-300 text-sm">{metricas.conformes}</span>
            </div>
            <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 flex items-center justify-between">
              <span className="text-red-200 text-[11px]">Não Conformes (✗):</span>
              <span className="font-bold text-red-300 text-sm">{metricas.naoConformes}</span>
            </div>
            <div className="bg-stone-500/10 p-2.5 rounded-xl border border-stone-500/20 flex items-center justify-between">
              <span className="text-stone-300 text-[11px]">Não se Aplica (-):</span>
              <span className="font-bold text-stone-300 text-sm">{metricas.naoAplica}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Não Conformidades Críticas */}
      {metricas.criticosNaoConformes.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 shadow-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-red-950">
              Atenção: {metricas.criticosNaoConformes.length} item(ns) crítico(s) de conformidade legal não atendido(s)
            </h4>
            <p className="text-red-800">
              Itens marcados como não conformes: {metricas.criticosNaoConformes.map(i => `"${i.titulo}"`).join(', ')}. Notificação formal e plano de ação corretiva recomendados para a Direção Escolar e Nutricionista RT.
            </p>
          </div>
        </div>
      )}

      {/* Painel de Identificação da Vistoria In Loco */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-700" />
            <h3 className="text-sm font-bold text-stone-900">
              Dados da Vistoria Presencial & Escola Fiscalizada
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={marcarTodosComoConforme}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Marcar Todos Conformes</span>
            </button>
            <button
              onClick={resetarChecklist}
              className="text-xs font-semibold text-stone-600 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Unidade Escolar Fiscalizada
            </label>
            <select
              value={escolaId}
              onChange={(e) => handleEscolaChange(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
            >
              {escolas.map((esc) => (
                <option key={esc.id} value={esc.id}>
                  {esc.nome} ({esc.codigoInep}) - {esc.totalAlunos} alunos
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Data da Fiscalização In Loco
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={dataVistoria}
                onChange={(e) => setDataVistoria(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Responsável na Escola (Recebeu a Vistoria)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={responsavelEscolaNome}
                onChange={(e) => setResponsavelEscolaNome(e.target.value)}
                placeholder="Nome do(a) responsável"
                className="flex-1 px-3 py-2 border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 font-medium"
              />
              <input
                type="text"
                value={responsavelEscolaCargo}
                onChange={(e) => setResponsavelEscolaCargo(e.target.value)}
                placeholder="Cargo"
                className="w-32 px-3 py-2 border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 font-medium text-[11px]"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block font-semibold text-stone-700 mb-1">
              Conselheiros do CAE Presentes na Diligência
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={conselheirosTexto}
                onChange={(e) => setConselheirosTexto(e.target.value)}
                placeholder="Ex: Prof. Carlos Eduardo (Relator), Maria Luiza (Pais de Alunos)"
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>
            <p className="text-[10px] text-stone-500 mt-1">
              Dica: O CAE atua em comissão ou colegiado. Separe os nomes dos conselheiros por vírgula.
            </p>
          </div>
        </div>
      </div>

      {/* Desempenho por Eixo da Lei 11.947 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {metricas.scoresPorEixo.map((sc) => (
          <div 
            key={sc.eixo} 
            onClick={() => setEixoFiltro(eixoFiltro === sc.eixo ? 'TODOS' : sc.eixo)}
            className={`p-3.5 rounded-2xl border cursor-pointer transition shadow-xs ${
              eixoFiltro === sc.eixo 
                ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20' 
                : 'bg-white border-stone-200 hover:border-purple-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                {getEixoIcon(sc.eixo)}
                <span className="text-[11px] font-bold text-stone-800 line-clamp-1">
                  {sc.eixo}
                </span>
              </div>
              <span className={`text-xs font-black ${
                sc.pct >= 90 ? 'text-emerald-700' : sc.pct >= 70 ? 'text-amber-700' : 'text-red-700'
              }`}>
                {sc.pct}%
              </span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  sc.pct >= 90 ? 'bg-emerald-600' : sc.pct >= 70 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${sc.pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1.5 font-medium">
              <span>{sc.conformes}/{sc.total} Conformes</span>
              {sc.naoConformes > 0 && (
                <span className="text-red-600 font-bold">{sc.naoConformes} ✗</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Barra de Filtros dos Itens do Checklist */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {['TODOS', 'Nutrição e Cardápio', 'Agricultura Familiar', 'Armazenamento e Validade', 'Higiene e Manipulação', 'Estrutura e Controle Social'].map((tab) => (
            <button
              key={tab}
              onClick={() => setEixoFiltro(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                eixoFiltro === tab
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {tab === 'TODOS' ? 'Todos os Eixos' : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar item da lei..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>

          <button
            onClick={() => setMostrarApenasNaoConformes(!mostrarApenasNaoConformes)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1 whitespace-nowrap ${
              mostrarApenasNaoConformes
                ? 'bg-red-50 text-red-700 border-red-300'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Apenas Inconformidades ({metricas.naoConformes})</span>
          </button>
        </div>
      </div>

      {/* Lista Interativa de Itens do Checklist */}
      <div className="space-y-3">
        {itensFiltrados.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs">
            Nenhum item do checklist corresponde aos filtros selecionados.
          </div>
        ) : (
          itensFiltrados.map((item, index) => {
            const isConforme = item.status === 'Conforme';
            const isNaoConforme = item.status === 'NaoConforme';
            const isNaoAplica = item.status === 'NaoAplica';
            const isObsOpen = itemAbertoObservacao === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 md:p-5 rounded-2xl border transition shadow-xs space-y-3 ${
                  isNaoConforme
                    ? 'bg-red-50/40 border-red-300 ring-1 ring-red-300'
                    : isConforme
                    ? 'bg-white border-stone-200 hover:border-emerald-300'
                    : 'bg-stone-50 border-stone-200 opacity-80'
                }`}
              >
                {/* Linha Principal do Item */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                        {item.eixo}
                      </span>
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        {item.artigoLei}
                      </span>
                      {item.pesoCritico && (
                        <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                          Requisito Crítico
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-stone-900 pt-0.5">
                      {item.titulo}
                    </h4>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      {item.descricao}
                    </p>

                    <p className="text-[11px] text-stone-400 italic">
                      Amparo legal: {item.detalheObrigatorio}
                    </p>
                  </div>

                  {/* Botoes de Ação Rápida de Status */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-stone-100/80 p-1.5 rounded-xl border border-stone-200">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, 'Conforme')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        isConforme
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Conforme</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleStatusChange(item.id, 'NaoConforme');
                        setItemAbertoObservacao(item.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        isNaoConforme
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Não Conforme</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, 'NaoAplica')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                        isNaoAplica
                          ? 'bg-stone-600 text-white shadow-xs'
                          : 'text-stone-500 hover:bg-stone-200'
                      }`}
                      title="Não se aplica a esta modalidade/escola"
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">N/A</span>
                    </button>
                  </div>
                </div>

                {/* Campo de Observação e Evidências */}
                <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setItemAbertoObservacao(isObsOpen ? null : item.id)}
                      className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                    >
                      <span>
                        {item.observacao ? 'Evidência / Observação Registrada' : 'Adicionar Evidência ou Registro Específico'}
                      </span>
                      {isObsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {item.observacao && !isObsOpen && (
                      <span className="text-[11px] text-stone-500 line-clamp-1 italic max-w-md">
                        "{item.observacao}"
                      </span>
                    )}
                  </div>

                  {isObsOpen && (
                    <div className="mt-1 space-y-1.5 animate-in fade-in duration-150">
                      <textarea
                        rows={2}
                        value={item.observacao || ''}
                        onChange={(e) => handleObservacaoChange(item.id, e.target.value)}
                        placeholder="Descreva a evidência verificada in loco, fotos anexadas, número de lote, temperaturas ou justificativa..."
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Conclusão Geral e Recomendações */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-purple-700" />
          Parecer Geral da Equipe e Recomendações ao Gestor / Nutricionista RT
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Síntese do Laudo de Fiscalização do CAE
            </label>
            <textarea
              rows={4}
              value={observacoesGerais}
              onChange={(e) => setObservacoesGerais(e.target.value)}
              placeholder="Descreva o panorama geral observado na escola fiscalizada..."
              className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 font-medium leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Recomendações e Encaminhamentos com Prazos
            </label>
            <textarea
              rows={4}
              value={recomendacoesImediatas}
              onChange={(e) => setRecomendacoesImediatas(e.target.value)}
              placeholder="Recomendações técnicas à direção escolar, nutricionista RT ou secretaria de educação..."
              className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 font-medium leading-relaxed"
            />
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-stone-100">
          <div className="text-xs text-stone-500">
            <span>Classificação: </span>
            <strong className="text-stone-900">{metricas.classificacao}</strong>
            <span className="mx-1.5">•</span>
            <span>Taxa de Conformidade: </span>
            <strong className="text-purple-700">{metricas.pontuacao}%</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-4 h-4 text-stone-500" />
              <span>Exportar Laudo Oficial em PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSalvarVistoria}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>Salvar no Histórico de Fiscalizações do CAE</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

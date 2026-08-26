import { describe, it, expect } from 'vitest';
import {
  mapAlimentoFromDB,
  mapAlimentoToDB,
  mapEscolaFromDB,
  mapCardapioFromDB,
  mapChamadaPublicaFromDB,
  mapPrestacaoContasFromDB,
  mapAuditoriaLogFromDB,
} from '../mappers';
import { Alimento } from '../../../types';

describe('Mapeadores de Dados Supabase (mappers.ts)', () => {
  it('deve mapear linha do banco alimentos (snake_case) para entidade TypeScript (camelCase)', () => {
    const row = {
      id: 'alim-123',
      nome: 'Maçã Fuji',
      categoria: 'Hortifrúti e Frutas',
      unidade_medida: 'kg',
      preco_referencia_medio: 8.5,
      eh_agricultura_familiar: true,
      eh_organico: false,
      calorias_kcal: 52,
      carboidratos_g: 14,
      proteinas_g: 0.3,
      lipidios_g: 0.2,
      fibras_g: 2.4,
      vitamina_c_mg: 4.6,
      calcio_mg: 6,
      ferro_mg: 0.12,
    };

    const mapped = mapAlimentoFromDB(row);

    expect(mapped.id).toBe('alim-123');
    expect(mapped.nome).toBe('Maçã Fuji');
    expect(mapped.unidadeMedida).toBe('kg');
    expect(mapped.precoReferenciaMedio).toBe(8.5);
    expect(mapped.ehAgriculturaFamiliar).toBe(true);
    expect(mapped.ehOrganico).toBe(false);
    expect(mapped.caloriasKcal).toBe(52);
    expect(mapped.carboidratosG).toBe(14);
  });

  it('deve converter objeto de alimento TypeScript para formato do banco (snake_case)', () => {
    const alimentoInput: Partial<Alimento> = {
      nome: 'Banana Prata',
      categoria: 'Hortifrúti e Frutas',
      unidadeMedida: 'kg',
      precoReferenciaMedio: 6.0,
      ehAgriculturaFamiliar: true,
      ehOrganico: true,
      caloriasKcal: 89,
      carboidratosG: 23,
      proteinasG: 1.1,
      lipidiosG: 0.3,
      fibrasG: 2.6,
      vitaminaCMg: 8.7,
      calcioMg: 5,
      ferroMg: 0.26,
    };

    const dbRow = mapAlimentoToDB(alimentoInput);

    expect(dbRow.nome).toBe('Banana Prata');
    expect(dbRow.unidade_medida).toBe('kg');
    expect(dbRow.eh_agricultura_familiar).toBe(true);
    expect(dbRow.calorias_kcal).toBe(89);
  });

  it('deve mapear escolas do banco corretamente', () => {
    const row = {
      id: 'esc-001',
      codigo_inep: '12345678',
      nome: 'Escola Municipal Machado de Assis',
      endereco: 'Rua A, 100',
      total_alunos: 450,
      diretor_nome: 'Maria Silva',
      responsavel_merenda_nome: 'Ana Santos',
      tipo_atendimento: 'Integral',
    };

    const esc = mapEscolaFromDB(row);

    expect(esc.id).toBe('esc-001');
    expect(esc.codigoInep).toBe('12345678');
    expect(esc.totalAlunos).toBe(450);
    expect(esc.diretorNome).toBe('Maria Silva');
    expect(esc.responsavelMerendaNome).toBe('Ana Santos');
  });

  it('deve mapear cardápios com nutricionista e refeições', () => {
    const row = {
      id: 'card-1',
      titulo: 'Cardápio Setembro',
      mes_referencia: '2026-09',
      semana_numero: 1,
      etapa_ensino: 'Ensino Fundamental I',
      dias_letivos_semana: 5,
      percentual_agri_familiar_estimado: 40,
      status: 'Aprovado RT',
      observacoes_dietas_especiais: 'Sem lactose para 3 alunos',
      perfis_usuarios: {
        nome: 'Dra. Nutricionista',
        crn: 'CRN-1234',
      },
      cardapio_refeicoes: [
        {
          id: 'ref-1',
          dia_semana: 'Segunda-feira',
          tipo_refeicao: 'Almoço',
          nome_prato: 'Arroz, Feijão e Frango Assado',
          cardapio_refeicao_itens: [
            {
              alimento_id: 'alim-1',
              alimentos: { nome: 'Frango' },
              per_capita_liquido_g: 100,
              unidade: 'g',
              eh_agricultura_familiar: false,
            },
          ],
        },
      ],
    };

    const card = mapCardapioFromDB(row);

    expect(card.id).toBe('card-1');
    expect(card.nutricionistaNome).toBe('Dra. Nutricionista');
    expect(card.nutricionistaCrn).toBe('CRN-1234');
    expect(card.refeicoes).toHaveLength(1);
    expect(card.refeicoes[0].diaSemana).toBe('Segunda-feira');
    expect(card.refeicoes[0].itens[0].alimentoNome).toBe('Frango');
  });

  it('deve mapear chamadas públicas com itens e propostas', () => {
    const row = {
      id: 'cp-10',
      numero_edital: '001/2026',
      ano_exercicio: 2026,
      titulo: 'Edital Merenda Escolar',
      objeto: 'Aquisição de hortifrúti',
      data_abertura: '2026-01-10',
      data_encerramento: '2026-01-25',
      valor_total_estimado: 50000,
      valor_reservado_agri_familiar: 30000,
      status: 'Publicada',
      chamada_publica_itens: [
        {
          id: 'item-1',
          numero_item: 1,
          descricao_item: 'Cenoura Orgânica',
          unidade_medida: 'kg',
          quantidade_total_solicitada: 500,
          preco_maximo_referencia: 5.5,
          valor_total_item: 2750,
          cronograma_entrega: 'Semanal',
          exige_organico: true,
        },
      ],
    };

    const cp = mapChamadaPublicaFromDB(row);

    expect(cp.id).toBe('cp-10');
    expect(cp.numeroEdital).toBe('001/2026');
    expect(cp.itens).toHaveLength(1);
    expect(cp.itens[0].descricaoItem).toBe('Cenoura Orgânica');
    expect(cp.itens[0].exigeOrganico).toBe(true);
  });

  it('deve mapear prestação de contas PNAE e pareceres CAE', () => {
    const pcRow = {
      id: 'pc-2026',
      ano_exercicio: 2026,
      numero_alunos_atendidos: 5000,
      numero_refeicoes_servidas_ano: 900000,
      recurso_total_fnde_recebido: 400000,
      contrapartida_municipal_gasta: 150000,
      gasto_total_alimentacao: 550000,
      gasto_agricultura_familiar: 160000,
      percentual_agricultura_familiar: 40,
      cumpre_meta_legal_30_porcento: true,
      saldo_remanescente: 5000,
      status_aprovacao: 'Aprovado pelo CAE',
    };

    const pc = mapPrestacaoContasFromDB(pcRow);

    expect(pc.anoExercicio).toBe(2026);
    expect(pc.recursoTotalFNDERecebido).toBe(400000);
    expect(pc.gastoAgriculturaFamiliar).toBe(160000);
    expect(pc.cumpreMetaLegal30Porcento).toBe(true);
  });

  it('deve mapear logs de auditoria', () => {
    const logRow = {
      id: 'log-99',
      usuario_nome: 'João Auditor',
      usuario_role: 'ADMIN',
      acao: 'Homologar Edital',
      modulo: 'Chamada Pública',
      detalhes: 'Edital 001/2026 homologado com sucesso.',
      data_hora: '2026-08-25T20:00:00Z',
    };

    const log = mapAuditoriaLogFromDB(logRow);

    expect(log.id).toBe('log-99');
    expect(log.usuarioNome).toBe('João Auditor');
    expect(log.acao).toBe('Homologar Edital');
  });
});

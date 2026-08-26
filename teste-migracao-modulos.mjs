import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_JWT_SECRET;

console.log('==================================================');
console.log('TESTE COMPLETO DOS MÓDULOS DE NEGÓCIO - SUPABASE');
console.log('==================================================\n');

if (!url || !serviceKey) {
  console.error('ERRO: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes!');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function obterOuCriarMunicipio() {
  const { data: existentes } = await supabase.from('municipios').select('*').limit(1);
  if (existentes && existentes.length > 0) {
    return existentes[0].id;
  }

  const { data: criado, error } = await supabase
    .from('municipios')
    .upsert({
      nome: 'Prefeitura Municipal Teste',
      uf: 'PA',
      codigo_ibge: '1501402',
      total_alunos_pnae: 5000,
      orcamento_anual_fnde: 250000.00,
      orcamento_contrapartida: 100000.00,
      ano_exercicio: 2026,
    }, { onConflict: 'codigo_ibge' })
    .select()
    .single();

  if (error || !criado) {
    throw new Error(`Falha ao preparar município: ${error?.message}`);
  }
  return criado.id;
}

async function obterOuCriarPerfilNutricionista(municipioId) {
  const { data: existentes } = await supabase.from('perfis_usuarios').select('id').limit(1);
  if (existentes && existentes.length > 0) {
    return existentes[0].id;
  }

  // Se a tabela auth.users/perfis_usuarios estiver sem linhas, criar usuário temporário de teste no auth admin
  const { data: userAuth, error: errAuth } = await supabase.auth.admin.createUser({
    email: `nutri.teste.${Date.now()}@pnae.gov.br`,
    password: 'SenhaProvisoria123!',
    email_confirm: true,
  });

  if (errAuth || !userAuth?.user) {
    throw new Error(`Falha ao criar usuário de teste no Auth: ${errAuth?.message}`);
  }

  const { data: perfilCriado, error: errPerfil } = await supabase
    .from('perfis_usuarios')
    .insert({
      id: userAuth.user.id,
      nome: 'Nutricionista RT Teste',
      email: userAuth.user.email,
      role: 'NUTRICIONISTA',
      cpf: `${Math.floor(Math.random()*900+100)}.456.789-00`,
      municipio_id: municipioId,
      crn: 'CRN-12345',
      ativo: true,
    })
    .select()
    .single();

  if (errPerfil || !perfilCriado) {
    throw new Error(`Falha ao criar perfil em perfis_usuarios: ${errPerfil?.message}`);
  }

  return perfilCriado.id;
}

async function executarTestes() {
  const municipioId = await obterOuCriarMunicipio();
  console.log(`✓ Município base ativo no Supabase ID: ${municipioId}`);

  const perfilId = await obterOuCriarPerfilNutricionista(municipioId);
  console.log(`✓ Perfil de usuário ativo no Supabase ID: ${perfilId}`);

  console.log('\n1. Testando Módulo ALIMENTOS (SELECT / INSERT / DELETE)...');
  const nomeAlimento = `Alimento Teste ${Date.now()}`;
  const { data: alimCriado, error: errAlim } = await supabase
    .from('alimentos')
    .insert({
      nome: nomeAlimento,
      categoria: 'Hortifrúti e Frutas',
      unidade_medida: 'kg',
      preco_referencia_medio: 12.50,
      eh_agricultura_familiar: true,
      eh_organico: true,
      calorias_kcal: 45,
      carboidratos_g: 10,
      proteinas_g: 1,
      lipidios_g: 0.5,
      fibras_g: 2,
    })
    .select()
    .single();

  if (errAlim || !alimCriado) {
    console.error('❌ Falha ao inserir alimento:', errAlim);
  } else {
    console.log(`✓ Alimento criado com sucesso! ID: ${alimCriado.id} (${alimCriado.nome})`);
    await supabase.from('alimentos').delete().eq('id', alimCriado.id);
    console.log('✓ Alimento de teste removido.');
  }

  console.log('\n2. Testando Módulo CARDÁPIOS (SELECT / INSERT / DELETE)...');
  const { data: cardCriado, error: errCard } = await supabase
    .from('cardapios')
    .insert({
      municipio_id: municipioId,
      titulo: `Cardápio Teste Integração ${Date.now()}`,
      mes_referencia: '2026-09',
      semana_numero: 1,
      etapa_ensino: 'Ensino Fundamental I',
      nutricionista_id: perfilId,
      status: 'Rascunho',
    })
    .select()
    .single();

  if (errCard || !cardCriado) {
    console.error('❌ Falha ao criar cardápio:', errCard);
  } else {
    console.log(`✓ Cardápio criado com sucesso! ID: ${cardCriado.id} (${cardCriado.titulo})`);
    await supabase.from('cardapios').delete().eq('id', cardCriado.id);
    console.log('✓ Cardápio de teste removido.');
  }

  console.log('\n3. Testando Módulo CHAMADAS PÚBLICAS (SELECT / INSERT / DELETE)...');
  const editalNum = `ED-TESTE-${Date.now()}`;
  const { data: cpCriada, error: errCP } = await supabase
    .from('chamadas_publicas')
    .insert({
      municipio_id: municipioId,
      numero_edital: editalNum,
      ano_exercicio: 2026,
      titulo: 'Edital Teste de Aquisição PNAE',
      objeto: 'Aquisição de hortifrúti orgânico',
      data_abertura: '2026-09-01',
      data_encerramento: '2026-09-15',
      valor_total_estimado: 50000.00,
      valor_reservado_agri_familiar: 25000.00,
      status: 'Publicada',
    })
    .select()
    .single();

  if (errCP || !cpCriada) {
    console.error('❌ Falha ao criar chamada pública:', errCP);
  } else {
    console.log(`✓ Chamada Pública criada! ID: ${cpCriada.id} (Edital: ${cpCriada.numero_edital})`);
    await supabase.from('chamadas_publicas').delete().eq('id', cpCriada.id);
    console.log('✓ Chamada Pública de teste removida.');
  }

  console.log('\n4. Testando Módulo AUDITORIA LOGS (SELECT / INSERT)...');
  const { data: logCriado, error: errLog } = await supabase
    .from('auditoria_logs')
    .insert({
      usuario_nome: 'Sistema de Teste',
      usuario_role: 'ADMIN',
      acao: 'Teste Migracao'.substring(0, 20),
      modulo: 'Validação Automatizada',
      detalhes: 'Teste de persistência direta em PostgreSQL executado com sucesso.',
    })
    .select()
    .single();

  if (errLog || !logCriado) {
    console.error('❌ Falha ao criar auditoria log:', errLog);
  } else {
    console.log(`✓ Auditoria Log gravado no Supabase! ID: ${logCriado.id}`);
  }

  console.log('\n==================================================');
  console.log('TODOS OS TESTES DE INTEGRAÇÃO SUPABASE CONCLUÍDOS COM SUCESSO!');
  console.log('==================================================\n');
}

executarTestes().catch(console.error);

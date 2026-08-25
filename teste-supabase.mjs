import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('ERRO: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes no .env');
  process.exit(1);
}

const host = new URL(url).host;
console.log(`\n=== TESTE SUPABASE ===`);
console.log(`Projeto: ${host}`);
console.log(`Chave: anon key (${key.slice(0, 12)}...)`);

const supabase = createClient(url, key);

const TABELAS = [
  'municipios',
  'perfis_usuarios',
  'escolas',
  'alimentos',
  'cardapios',
  'cardapio_refeicoes',
  'cardapio_refeicao_itens',
  'chamadas_publicas',
  'chamada_publica_itens',
  'propostas_fornecedores',
  'proposta_itens',
  'contratos_fornecedores',
  'autorizacoes_fornecimento',
  'af_itens',
  'entregas_mercadorias',
  'entrega_itens',
  'estoque_escola',
  'prestacoes_contas',
  'pareceres_cae',
  'auditoria_logs',
];

async function testarTabela(tabela) {
  const inicio = performance.now();
  const { count, error } = await supabase
    .from(tabela)
    .select('*', { count: 'exact', head: true });
  const ms = Math.round(performance.now() - inicio);

  if (error) {
    return { tabela, ok: false, code: error.code || '?', msg: error.message, ms };
  }
  return { tabela, ok: true, count, ms };
}

function traduzir(code, msg) {
  if (code === '42P01') return 'Tabela não existe (migration não executada?)';
  if (code === '42501' || /row-level security/i.test(msg)) return 'Bloqueada por RLS (sem policy para anon)';
  if (/relation .* does not exist/i.test(msg)) return 'Tabela não existe';
  return '';
}

async function main() {
  // 1. Conectividade + sessão
  console.log('\n--- Sessão/Auth ---');
  const { data: sessao } = await supabase.auth.getSession();
  console.log(`Sessão ativa: ${sessao?.session ? 'sim' : 'não (modo anônimo — esperado fora do login)'}`);

  // 2. Latência
  console.log('\n--- Latência (primeira query) ---');
  const t0 = performance.now();
  const { error: erroPing } = await supabase.from('municipios').select('id').limit(1);
  const latencia = Math.round(performance.now() - t0);
  if (!erroPing) {
    console.log(`REST API respondeu em ${latencia} ms ${latencia < 300 ? '(bom)' : latencia < 800 ? '(aceitável)' : '(alto)'}`);
  } else {
    console.log(`Falha inicial: [${erroPing.code}] ${erroPing.message}`);
  }

  // 3. Tabelas do migration
  console.log('\n--- Tabelas (count exato via head) ---');
  let okCount = 0;
  const falhas = [];

  for (const tabela of TABELAS) {
    const r = await testarTabela(tabela);
    if (r.ok) {
      okCount++;
      console.log(`✓ ${r.tabela.padEnd(28)} OK — ${r.count} registro(s) (${r.ms}ms)`);
    } else {
      falhas.push(r);
      const motivo = traduzir(r.code, r.msg);
      console.log(`✗ ${r.tabela.padEnd(28)} ERRO [${r.code}] ${r.msg}${motivo ? ` → ${motivo}` : ''} (${r.ms}ms)`);
    }
  }

  // 4. Resumo
  console.log('\n--- Resumo ---');
  console.log(`Conexão: ${falhas.length < TABELAS.length ? 'FUNCIONAL' : 'FALHOU'}`);
  console.log(`Tabelas acessíveis: ${okCount}/${TABELAS.length}`);

  if (falhas.length > 0) {
    const inexistentes = falhas.filter(f => f.code === '42P01' || /does not exist/i.test(f.msg));
    const rls = falhas.filter(f => f.code === '42501' || /row-level security|permission/i.test(f.msg));
    const outras = falhas.filter(f => !inexistentes.includes(f) && !rls.includes(f));
    if (inexistentes.length) console.log(`→ Não existem no banco: ${inexistentes.map(f => f.tabela).join(', ')}`);
    if (rls.length) console.log(`→ Bloqueadas por RLS/permissão (anon): ${rls.map(f => f.tabela).join(', ')}`);
    if (outras.length) console.log(`→ Outros erros: ${outras.map(f => `${f.tabela} [${f.code}]`).join(', ')}`);
    process.exitCode = 2;
  }
}

main().catch(e => {
  console.error('FALHA GERAL:', e.message);
  process.exit(1);
});

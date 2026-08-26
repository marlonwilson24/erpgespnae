import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_JWT_SECRET;

console.log('--- TESTANDO GRAVAÇÃO NO SUPABASE (UUID AUTO-GEN) ---');

const supabaseAnon = createClient(url, anonKey);
const supabaseAdmin = serviceKey ? createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } }) : null;

async function testarWrite() {
  console.log('\n1. Testando INSERT via Anon Key (Sem autenticação no cliente)...');
  const { data: dataAnon, error: errAnon } = await supabaseAnon
    .from('municipios')
    .insert([{ nome: 'Município Teste Anon', uf: 'PA', codigo_ibge: '1111111' }])
    .select();

  if (errAnon) {
    console.error('❌ ERRO AO INSERIR COM ANON KEY:');
    console.error('  Código:', errAnon.code);
    console.error('  Mensagem:', errAnon.message);
    console.error('  Detalhes:', errAnon.details);
    if (errAnon.code === '42501' || /row-level security/i.test(errAnon.message)) {
      console.error('  👉 CAUSA: Bloqueado por Row Level Security (RLS)! O Supabase rejeita inserções anônimas sem policy RLS adequada.');
    }
  } else {
    console.log('✓ Inserido com sucesso via Anon Key!', dataAnon);
    if (supabaseAdmin) await supabaseAdmin.from('municipios').delete().eq('codigo_ibge', '1111111');
  }

  if (supabaseAdmin) {
    console.log('\n2. Testando INSERT via Service Role Key...');
    const { data: dataAdmin, error: errAdmin } = await supabaseAdmin
      .from('municipios')
      .upsert([{ nome: 'Município Teste Admin', uf: 'PA', codigo_ibge: '9999999' }], { onConflict: 'codigo_ibge' })
      .select();

    if (errAdmin) {
      console.error('❌ ERRO AO INSERIR COM SERVICE ROLE KEY:', errAdmin);
    } else {
      console.log('✓ Sucesso com Service Role Key!', dataAdmin);
      await supabaseAdmin.from('municipios').delete().eq('codigo_ibge', '9999999');
      console.log('✓ Registro de teste removido.');
    }
  }
}

testarWrite().catch(console.error);

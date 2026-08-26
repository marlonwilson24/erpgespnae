import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_JWT_SECRET!;

if (!url || !key) {
  console.error('Sem credenciais de service role no .env');
  process.exit(1);
}

const svc = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  // 1. Diagnóstico
  const { data: perfis, error: errP } = await svc.from('perfis_usuarios').select('id,nome,email,role').limit(5);
  console.log('[diagnostico] perfis_usuarios:', errP ? `ERRO ${errP.message}` : JSON.stringify(perfis));

  const { data: mun, error: errM } = await svc.from('municipios').select('id,nome,codigo_ibge').limit(5);
  console.log('[diagnostico] municipios:', errM ? `ERRO ${errM.message}` : JSON.stringify(mun));

  // 2. Criar usuário no auth
  const email = 'marlonwilsonlopes@gmail.com';
  const senha = 'Pnae@7619$';
  const { data: user, error: errU } = await svc.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome: 'MarlonWilson Pereira Lopes', role: 'ADMIN' },
  });
  if (errU) {
    console.log('[auth] ERRO ao criar usuário:', errU.message);
    process.exit(1);
  }
  console.log('[auth] usuário criado:', user.user?.id, user.user?.email);

  // 3. Inserir perfil ADMIN
  const { data: perfil, error: errI } = await svc
    .from('perfis_usuarios')
    .insert({
      id: user.user!.id,
      nome: 'MarlonWilson Pereira Lopes',
      email,
      role: 'ADMIN',
      cpf: '62904833234',
      cargo: 'Coordenador Geral de Alimentação Escolar',
      ativo: true,
    })
    .select('id,nome,email,role,cargo')
    .single();

  if (errI) {
    console.log('[perfil] ERRO ao inserir perfil:', errI.message);
    process.exit(1);
  }
  console.log('[perfil] inserido:', JSON.stringify(perfil));

  // 4. Verificar role final (trigger pode ter forçado ESCOLA)
  const { data: check, error: errC } = await svc
    .from('perfis_usuarios')
    .select('id,nome,email,role,cargo,ativo')
    .eq('id', user.user!.id)
    .maybeSingle();
  if (errC) console.log('[verificar] erro:', errC.message);
  else console.log('[verificar] perfil final:', JSON.stringify(check));
}

main().catch(e => {
  console.error('Falha geral:', e.message);
  process.exit(1);
});

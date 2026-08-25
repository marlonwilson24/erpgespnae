import type { Request, Response } from 'express';
import { getServiceClient, exigirAdmin, traduzirErroSupabase } from './_lib/supabaseAdmin';

const ROLES_PERMITIDOS = ['ADMIN', 'NUTRICIONISTA', 'ESCOLA', 'CAE'];

export default async function handler(req: Request, res: Response) {
  const service = getServiceClient();

  if (!service) {
    res.status(503).json({
      error: 'Serviço de gestão de usuários não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.',
      configurado: false,
    });
    return;
  }

  const autorizacao = await exigirAdmin(service, req.headers.authorization);
  if ('status' in autorizacao) {
    res.status(autorizacao.status).json({ error: autorizacao.error });
    return;
  }

  // LISTAR usuários
  if (req.method === 'GET') {
    try {
      const { data, error } = await service
        .from('perfis_usuarios')
        .select('id, nome, email, role, cpf, telefone, cargo, escola_id, ativo, criado_em')
        .order('criado_em', { ascending: false });

      if (error) {
        res.status(500).json({ error: traduzirErroSupabase(error.message) });
        return;
      }

      const usuarios = (data || []).map(u => ({
        id: u.id,
        name: u.nome,
        email: u.email,
        role: u.role,
        cpf: u.cpf,
        telefone: u.telefone,
        cargo: u.cargo,
        escolaId: u.escola_id,
        ativo: u.ativo,
        criadoEm: u.criado_em,
      }));

      res.status(200).json({ usuarios });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ error: 'Erro interno ao listar usuários.' });
    }
    return;
  }

  // CADASTRAR usuário (Auth + Perfil)
  if (req.method === 'POST') {
    try {
      const { nome, email, senha, role, cpf, telefone, cargo, escolaId } = (req.body ?? {}) as Record<string, unknown>;

      if (!nome || !email || !senha || !role || !cpf) {
        res.status(400).json({ error: 'Preencha todos os campos obrigatórios: nome, e-mail, senha provisória, perfil e CPF.' });
        return;
      }

      if (typeof senha !== 'string' || senha.length < 6) {
        res.status(400).json({ error: 'A senha provisória deve ter no mínimo 6 caracteres.' });
        return;
      }

      if (!ROLES_PERMITIDOS.includes(String(role))) {
        res.status(400).json({ error: 'Perfil inválido. Permitidos: Gestor (ADMIN), Nutricionista, Escola e CAE.' });
        return;
      }

      const { data: criado, error: erroCriacao } = await service.auth.admin.createUser({
        email: String(email).trim().toLowerCase(),
        password: senha,
        email_confirm: true,
        user_metadata: { nome, role },
      });

      if (erroCriacao || !criado?.user) {
        res.status(400).json({ error: traduzirErroSupabase(erroCriacao?.message || 'Falha ao criar usuário no Auth.') });
        return;
      }

      const { data: perfilCriado, error: erroPerfil } = await service
        .from('perfis_usuarios')
        .insert({
          id: criado.user.id,
          nome,
          email: String(email).trim().toLowerCase(),
          role,
          cpf,
          telefone: telefone || null,
          cargo: cargo || null,
          escola_id: role === 'ESCOLA' && escolaId ? escolaId : null,
          ativo: true,
        })
        .select()
        .single();

      if (erroPerfil) {
        // Rollback do usuário órfão no Auth
        try { await service.auth.admin.deleteUser(criado.user.id); } catch { /* ignore */ }
        res.status(400).json({ error: traduzirErroSupabase(erroPerfil.message) });
        return;
      }

      res.status(201).json({
        usuario: {
          id: perfilCriado.id,
          name: perfilCriado.nome,
          email: perfilCriado.email,
          role: perfilCriado.role,
          cpf: perfilCriado.cpf,
          telefone: perfilCriado.telefone,
          cargo: perfilCriado.cargo,
          escolaId: perfilCriado.escola_id,
          ativo: perfilCriado.ativo,
        },
      });
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
    }
    return;
  }

  res.status(405).json({ error: 'Método não permitido.' });
}

import type { Request, Response } from 'express';
import { getServiceClient, exigirAdmin, traduzirErroSupabase } from './_lib/supabaseAdmin';

const ROLES_PERMITIDOS = ['ADMIN', 'NUTRICIONISTA', 'ESCOLA', 'CAE'];

function montarPerfil(body: Record<string, unknown>, role: string, escolaId?: unknown) {
  return {
    nome: typeof body.nome === 'string' ? body.nome.trim() : undefined,
    role,
    cpf: typeof body.cpf === 'string' ? body.cpf.trim() : undefined,
    telefone: typeof body.telefone === 'string' && body.telefone.trim() ? body.telefone.trim() : null,
    cargo: typeof body.cargo === 'string' && body.cargo.trim() ? body.cargo.trim() : null,
    escola_id: role === 'ESCOLA' && typeof escolaId === 'string' && escolaId ? escolaId : null,
  };
}

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

  // ATUALIZAR usuário (perfil + Auth opcional)
  if (req.method === 'PUT') {
    try {
      const { id, nome, email, senha, role, cpf, telefone, cargo, escolaId, ativo } = (req.body ?? {}) as Record<string, unknown>;

      if (typeof id !== 'string' || !id) {
        res.status(400).json({ error: 'Informe o id do usuário a ser atualizado.' });
        return;
      }

      if (role !== undefined && !ROLES_PERMITIDOS.includes(String(role))) {
        res.status(400).json({ error: 'Perfil inválido. Permitidos: Gestor (ADMIN), Nutricionista, Escola e CAE.' });
        return;
      }

      if (senha !== undefined && (typeof senha !== 'string' || (senha !== '' && senha.length < 6))) {
        res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres ou estar vazia para não alterar.' });
        return;
      }

      // Carrega o perfil atual para preservar escola_id quando o papel não muda
      const { data: perfilAtual, error: erroBusca } = await service
        .from('perfis_usuarios')
        .select('id, role, escola_id')
        .eq('id', id)
        .maybeSingle();

      if (erroBusca || !perfilAtual) {
        res.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }

      const novoRole = role !== undefined ? String(role) : perfilAtual.role;
      const perfilBase = montarPerfil(
        (req.body ?? {}) as Record<string, unknown>,
        novoRole,
        role !== undefined ? escolaId : perfilAtual.escola_id
      );

      const camposPerfil: Record<string, unknown> = {};
      for (const [campo, valor] of Object.entries(perfilBase)) {
        if (valor !== undefined && campo !== 'role') camposPerfil[campo] = valor;
      }
      if (role !== undefined) camposPerfil.role = novoRole;
      if (typeof ativo === 'boolean') camposPerfil.ativo = ativo;

      // Atualiza e-mail/senha no Auth (se informado)
      if (email !== undefined || senha !== undefined) {
        const authUpdate: Record<string, unknown> = {};
        if (typeof email === 'string' && email.trim()) authUpdate.email = email.trim().toLowerCase();
        if (typeof senha === 'string' && senha) authUpdate.password = senha;

        if (Object.keys(authUpdate).length > 0) {
          const { error: erroAuth } = await service.auth.admin.updateUserById(id, authUpdate);
          if (erroAuth) {
            res.status(400).json({ error: traduzirErroSupabase(erroAuth.message) });
            return;
          }
        }
      }

      if (Object.keys(camposPerfil).length > 0) {
        const { data: atualizado, error: erroPerfil } = await service
          .from('perfis_usuarios')
          .update(camposPerfil)
          .eq('id', id)
          .select()
          .single();

        if (erroPerfil) {
          res.status(400).json({ error: traduzirErroSupabase(erroPerfil.message) });
          return;
        }

        res.status(200).json({
          usuario: {
            id: atualizado.id,
            name: atualizado.nome,
            email: atualizado.email,
            role: atualizado.role,
            cpf: atualizado.cpf,
            telefone: atualizado.telefone,
            cargo: atualizado.cargo,
            escolaId: atualizado.escola_id,
            ativo: atualizado.ativo,
          },
        });
        return;
      }

      res.status(400).json({ error: 'Nenhum campo informado para atualização.' });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ error: 'Erro interno ao atualizar usuário.' });
    }
    return;
  }

  // EXCLUIR usuário (Auth + Perfil)
  if (req.method === 'DELETE') {
    try {
      const { id } = (req.body ?? {}) as Record<string, unknown>;

      if (typeof id !== 'string' || !id) {
        res.status(400).json({ error: 'Informe o id do usuário a ser excluído.' });
        return;
      }

      // Remove o perfil primeiro (evita restrição de chave estrangeira)
      const { error: erroPerfil } = await service.from('perfis_usuarios').delete().eq('id', id);
      if (erroPerfil) {
        res.status(400).json({ error: traduzirErroSupabase(erroPerfil.message) });
        return;
      }

      const { error: erroAuth } = await service.auth.admin.deleteUser(id);
      if (erroAuth) {
        res.status(400).json({ error: traduzirErroSupabase(erroAuth.message) });
        return;
      }

      res.status(200).json({ sucesso: true });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      res.status(500).json({ error: 'Erro interno ao excluir usuário.' });
    }
    return;
  }

  res.status(405).json({ error: 'Método não permitido.' });
}

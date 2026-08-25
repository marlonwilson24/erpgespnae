import type { Request, Response } from 'express';
import { getServiceClient, exigirAdmin, traduzirErroSupabase } from './_lib/supabaseAdmin';

interface MunicipioPayload {
  nome: string;
  uf: string;
  codigoIbge: string;
  totalAlunosPnae: number;
  orcamentoAnualFnde: number;
  orcamentoContrapartida: number;
  anoExercicio: number;
}

function validarPayload(body: Record<string, unknown>): { ok: true; dados: MunicipioPayload } | { ok: false; error: string } {
  const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
  const uf = typeof body.uf === 'string' ? body.uf.trim().toUpperCase() : '';
  const codigoIbge = typeof body.codigoIbge === 'string' ? body.codigoIbge.trim() : '';
  const totalAlunosPnae = Number(body.totalAlunosPnae);
  const orcamentoAnualFnde = Number(body.orcamentoAnualFnde);
  const orcamentoContrapartida = Number(body.orcamentoContrapartida);
  const anoExercicio = Number(body.anoExercicio);

  if (!nome || !uf || !codigoIbge) {
    return { ok: false, error: 'Preencha os campos obrigatórios: município, UF e código IBGE.' };
  }

  if (uf.length !== 2) {
    return { ok: false, error: 'A UF deve conter exatamente 2 letras (ex: RS).' };
  }

  if (!Number.isFinite(totalAlunosPnae) || totalAlunosPnae < 0) {
    return { ok: false, error: 'Informe um total de alunos válido (número igual ou superior a zero).' };
  }

  if (!Number.isFinite(orcamentoAnualFnde) || orcamentoAnualFnde < 0 || !Number.isFinite(orcamentoContrapartida) || orcamentoContrapartida < 0) {
    return { ok: false, error: 'Informe valores orçamentários válidos (iguais ou superiores a zero).' };
  }

  if (!Number.isInteger(anoExercicio) || anoExercicio < 2020 || anoExercicio > 2035) {
    return { ok: false, error: 'O exercício deve ser um ano entre 2020 e 2035.' };
  }

  return {
    ok: true,
    dados: {
      nome,
      uf,
      codigoIbge,
      totalAlunosPnae: Math.round(totalAlunosPnae),
      orcamentoAnualFnde,
      orcamentoContrapartida,
      anoExercicio,
    },
  };
}

export default async function handler(req: Request, res: Response) {
  const service = getServiceClient();

  if (!service) {
    res.status(503).json({
      error: 'Serviço de municípios não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.',
      configurado: false,
    });
    return;
  }

  const autorizacao = await exigirAdmin(service, req.headers.authorization);
  if ('status' in autorizacao) {
    res.status(autorizacao.status).json({ error: autorizacao.error });
    return;
  }

  // CONSULTAR dados do município (?codigoIbge=...)
  if (req.method === 'GET') {
    try {
      const codigoIbge = String(req.query.codigoIbge || '').trim();

      let query = service
        .from('municipios')
        .select('*')
        .order('atualizado_em', { ascending: false })
        .limit(1);

      if (codigoIbge) {
        query = service
          .from('municipios')
          .select('*')
          .eq('codigo_ibge', codigoIbge)
          .order('atualizado_em', { ascending: false })
          .limit(1);
      }

      const { data, error } = await query;

      if (error) {
        res.status(500).json({ error: traduzirErroSupabase(error.message) });
        return;
      }

      const row = data?.[0];
      res.status(200).json({
        municipio: row
          ? {
              id: row.id,
              nome: row.nome,
              uf: row.uf,
              codigoIbge: row.codigo_ibge,
              totalAlunosPnae: row.total_alunos_pnae,
              orcamentoAnualFnde: row.orcamento_anual_fnde,
              orcamentoContrapartida: row.orcamento_contrapartida,
              anoExercicio: row.ano_exercicio,
              atualizadoEm: row.atualizado_em,
            }
          : null,
      });
    } catch (error) {
      console.error('Erro ao consultar município:', error);
      res.status(500).json({ error: 'Erro interno ao consultar o município.' });
    }
    return;
  }

  // SALVAR / ATUALIZAR (upsert por codigo_ibge)
  if (req.method === 'POST') {
    try {
      const validacao = validarPayload((req.body ?? {}) as Record<string, unknown>);
      if ('error' in validacao) {
        res.status(400).json({ error: validacao.error });
        return;
      }

      const d = validacao.dados;

      const { data, error } = await service
        .from('municipios')
        .upsert(
          {
            nome: d.nome,
            uf: d.uf,
            codigo_ibge: d.codigoIbge,
            total_alunos_pnae: d.totalAlunosPnae,
            orcamento_anual_fnde: d.orcamentoAnualFnde,
            orcamento_contrapartida: d.orcamentoContrapartida,
            ano_exercicio: d.anoExercicio,
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: 'codigo_ibge' }
        )
        .select()
        .single();

      if (error) {
        res.status(400).json({ error: traduzirErroSupabase(error.message) });
        return;
      }

      res.status(201).json({
        municipio: {
          id: data.id,
          nome: data.nome,
          uf: data.uf,
          codigoIbge: data.codigo_ibge,
          totalAlunosPnae: data.total_alunos_pnae,
          orcamentoAnualFnde: data.orcamento_anual_fnde,
          orcamentoContrapartida: data.orcamento_contrapartida,
          anoExercicio: data.ano_exercicio,
        },
      });
    } catch (error) {
      console.error('Erro ao salvar município:', error);
      res.status(500).json({ error: 'Erro interno ao salvar os dados do município.' });
    }
    return;
  }

  res.status(405).json({ error: 'Método não permitido.' });
}

import { chamarApiJson } from './apiClient';

export interface DadosMunicipioInput {
  nome: string;
  uf: string;
  codigoIbge: string;
  totalAlunosPnae: number;
  orcamentoAnualFnde: number;
  orcamentoContrapartida: number;
  anoExercicio: number;
}

export type ResultadoSincronizacao =
  | { sucesso: true; destino: 'supabase' | 'local' }
  | { sucesso: false; destino: 'supabase'; erro: string };

/**
 * Sincroniza os dados cadastrais do município com a tabela public.municipios
 * no Supabase (upsert por código IBGE, via serverless function com service role).
 * Sem sessão/endpoint disponível, persiste localmente em modo demonstração.
 */
export async function sincronizarMunicipio(
  dados: DadosMunicipioInput
): Promise<ResultadoSincronizacao> {
  if (!dados.nome?.trim() || !dados.uf?.trim() || !dados.codigoIbge?.trim()) {
    return {
      sucesso: false,
      destino: 'supabase',
      erro: 'Preencha município, UF e código IBGE antes de sincronizar.',
    };
  }

  try {
    const resposta = await chamarApiJson<{ municipio: unknown }>('POST', '/api/municipios', {
      nome: dados.nome.trim(),
      uf: dados.uf.trim().toUpperCase(),
      codigoIbge: dados.codigoIbge.trim(),
      totalAlunosPnae: Number(dados.totalAlunosPnae) || 0,
      orcamentoAnualFnde: Number(dados.orcamentoAnualFnde) || 0,
      orcamentoContrapartida: Number(dados.orcamentoContrapartida) || 0,
      anoExercicio: Number(dados.anoExercicio) || new Date().getFullYear(),
    });

    if (resposta.ok) {
      return { sucesso: true, destino: 'supabase' };
    }
    if ('error' in resposta) {
      return { sucesso: false, destino: 'supabase', erro: resposta.error };
    }
    return { sucesso: false, destino: 'supabase', erro: 'Erro desconhecido ao sincronizar.' };
  } catch (err: any) {
    return { sucesso: false, destino: 'supabase', erro: err?.message || 'Falha ao conectar ao servidor para sincronização.' };
  }

}

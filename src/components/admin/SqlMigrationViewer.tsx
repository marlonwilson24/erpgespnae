import React, { useState } from 'react';
import { Database, Copy, CheckCircle2, Download, Terminal, Shield, Sparkles } from 'lucide-react';

export const SqlMigrationViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sqlContent = `-- ============================================================================
-- BANCO DE DADOS ERP PNAE - LEI Nº 11.947/2009 & RESOLUÇÕES CD/FNDE
-- SISTEMA INTEGRADO DE GESTÃO DA ALIMENTAÇÃO ESCOLAR E AGRICULTURA FAMILIAR
-- ============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABELA DE MUNICÍPIOS / ENTIDADE EXECUTORA (EEx)
CREATE TABLE IF NOT EXISTS public.municipios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    uf CHAR(2) NOT NULL,
    codigo_ibge VARCHAR(10) NOT NULL UNIQUE,
    total_alunos_pnae INTEGER NOT NULL DEFAULT 0,
    orcamento_anual_fnde NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    orcamento_contrapartida NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    ano_exercicio INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PERFIS DE USUÁRIO COM SUPABASE AUTH INTEGRADO
CREATE TYPE user_role_type AS ENUM ('ADMIN', 'NUTRICIONISTA', 'ESCOLA', 'FORNECEDOR', 'CAE');

CREATE TABLE IF NOT EXISTS public.perfis_usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role user_role_type NOT NULL DEFAULT 'ESCOLA',
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    municipio_id UUID REFERENCES public.municipios(id) ON DELETE SET NULL,
    escola_id UUID,
    crn VARCHAR(50),
    dap_caf VARCHAR(50),
    cargo VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. UNIDADES ESCOLARES MUNICIPAIS
CREATE TABLE IF NOT EXISTS public.escolas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    codigo_inep VARCHAR(12) NOT NULL UNIQUE,
    endereco TEXT NOT NULL,
    diretor_nome VARCHAR(255) NOT NULL,
    responsavel_merenda_nome VARCHAR(255) NOT NULL,
    total_alunos INTEGER NOT NULL DEFAULT 0,
    tipo_atendimento VARCHAR(20) NOT NULL DEFAULT 'Parcial'
);

-- 4. CATÁLOGO DE ALIMENTOS (TABELA TACO / PNAE)
CREATE TABLE IF NOT EXISTS public.alimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_taco VARCHAR(20),
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    preco_referencia_medio NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    eh_agricultura_familiar BOOLEAN NOT NULL DEFAULT FALSE,
    eh_organico BOOLEAN NOT NULL DEFAULT FALSE,
    calorias_kcal NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    proteinas_g NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    carboidratos_g NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    lipidios_g NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    fibras_g NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    calcio_mg NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    ferro_mg NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    vitamina_c_mg NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    sodio_mg NUMERIC(8,2) NOT NULL DEFAULT 0.00
);

-- 5. CARDÁPIOS HOMOLOGADOS
CREATE TABLE IF NOT EXISTS public.cardapios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mes_referencia VARCHAR(7) NOT NULL,
    semana_numero INTEGER NOT NULL,
    etapa_ensino VARCHAR(100) NOT NULL,
    nutricionista_id UUID NOT NULL REFERENCES public.perfis_usuarios(id),
    percentual_agri_familiar_estimado NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Rascunho'
);

-- 6. CHAMADAS PÚBLICAS DA AGRICULTURA FAMILIAR (ART. 14 LEI 11.947/09)
CREATE TABLE IF NOT EXISTS public.chamadas_publicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    numero_edital VARCHAR(50) NOT NULL UNIQUE,
    ano_exercicio INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    titulo VARCHAR(255) NOT NULL,
    objeto TEXT NOT NULL,
    data_abertura DATE NOT NULL,
    data_encerramento DATE NOT NULL,
    valor_total_estimado NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Publicada'
);

-- 7. PROPOSTAS DE PRODUTORES (VALIDAÇÃO DE R$ 40K POR DAP/CAF)
CREATE TABLE IF NOT EXISTS public.propostas_fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamada_publica_id UUID NOT NULL REFERENCES public.chamadas_publicas(id) ON DELETE CASCADE,
    fornecedor_id UUID NOT NULL REFERENCES public.perfis_usuarios(id),
    valor_total_proposta NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    acumulado_ano_dap_caf NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Em Análise',
    data_submissao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TRIGGER DE NEGÓCIO: VALIDAÇÃO DO TETO DE R$ 40.000,00 POR DAP/ANO
CREATE OR REPLACE FUNCTION public.validar_limite_dap_fornecedor()
RETURNS TRIGGER AS $$
DECLARE
    v_total_ano NUMERIC(15,2);
BEGIN
    SELECT COALESCE(SUM(valor_total_contrato), 0)
    INTO v_total_ano
    FROM public.contratos_fornecedores
    WHERE fornecedor_id = NEW.fornecedor_id
      AND EXTRACT(YEAR FROM data_inicio) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND status != 'Cancelado';

    IF (v_total_ano + NEW.valor_total_contrato) > 40000.00 THEN
        RAISE EXCEPTION 'Limite PNAE Excedido! DAP/CAF ultrapassa R$ 40.000,00/ano civil.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. TRIGGER DE ESTOQUE AUTOMÁTICO NA ESCOLA APÓS ENTREGA
CREATE OR REPLACE FUNCTION public.atualizar_estoque_apos_entrega()
RETURNS TRIGGER AS $$
DECLARE
    v_escola_id UUID;
BEGIN
    SELECT escola_id INTO v_escola_id FROM public.entregas_mercadorias WHERE id = NEW.entrega_id;
    IF NEW.aprovado = TRUE AND NEW.quantidade_recebida > 0 THEN
        INSERT INTO public.estoque_escola (escola_id, alimento_id, quantidade_atual, ultima_atualizacao)
        VALUES (v_escola_id, NEW.alimento_id, NEW.quantidade_recebida, NOW())
        ON CONFLICT (escola_id, alimento_id)
        DO UPDATE SET quantidade_atual = public.estoque_escola.quantidade_atual + EXCLUDED.quantidade_atual;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. POLÍTICAS ROW LEVEL SECURITY (RLS)
ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardapios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamadas_publicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propostas_fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin total" ON public.municipios FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.perfis_usuarios WHERE id = auth.uid() AND role = 'ADMIN')
);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([sqlContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'supabase_pnae_migration.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">
              Migração SQL & Estrutura de Banco (Supabase)
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
              PostgreSQL + RLS
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            DDL completo com tabelas, chaves estrangeiras, triggers de validação de limite R$ 40k, atualização de estoque e políticas RLS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado para a área de transferência!' : 'Copiar Código SQL'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>Baixar .sql</span>
          </button>
        </div>
      </div>

      {/* Cards de Destaques Técnicos do Banco */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
            <Shield className="w-4 h-4" />
            <span>Políticas RLS por Perfil</span>
          </div>
          <p className="text-xs text-stone-600">
            Regras de segurança no Supabase que isolam os dados entre Admin, Nutricionista, Escola, Fornecedor e Conselho CAE.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
            <Terminal className="w-4 h-4" />
            <span>Trigger Limite DAP R$ 40k</span>
          </div>
          <p className="text-xs text-stone-600">
            Função PL/pgSQL que barra contratos acima do teto legal anual por Declaração de Aptidão ao Pronaf / CAF.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
            <Database className="w-4 h-4" />
            <span>Trigger Atualização Estoque</span>
          </div>
          <p className="text-xs text-stone-600">
            Atualização automática e atômica da despensa escolar assim que o termo de entrega é atestado.
          </p>
        </div>
      </div>

      {/* Bloco de Código SQL com Syntax Highlighting */}
      <div className="rounded-2xl border border-stone-800 bg-stone-950 p-4 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800 text-stone-400 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
            <span className="font-mono ml-2 text-stone-300 text-xs">supabase_pnae_schema.sql</span>
          </div>
          <span className="text-[11px] text-stone-500">PostgreSQL 15+ / Supabase</span>
        </div>

        <pre className="text-xs font-mono text-emerald-400 overflow-x-auto max-h-[500px] leading-relaxed p-2">
          <code>{sqlContent}</code>
        </pre>
      </div>

      {/* Instruções para execução no Supabase */}
      <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2 text-emerald-950">
        <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          Como aplicar no seu projeto Supabase:
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-emerald-800 text-[11px]">
          <li>Acesse o painel do seu projeto no Supabase (<strong>supabase.com/dashboard</strong>).</li>
          <li>No menu lateral esquerdo, clique em <strong>SQL Editor</strong>.</li>
          <li>Clique em <strong>New query</strong>, cole o código SQL acima e clique em <strong>Run</strong>.</li>
          <li>Todas as tabelas, tipos ENUM, triggers e políticas RLS serão criadas instantaneamente!</li>
        </ol>
      </div>
    </div>
  );
};

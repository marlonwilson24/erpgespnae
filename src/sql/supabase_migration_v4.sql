-- ============================================================================
-- ERP PNAE - SUPABASE / POSTGRESQL
-- MIGRATION V4 - MÓDULO CAE + DADOS DO ÓRGÃO GESTOR (EEx)
-- ============================================================================
-- Aplicar sobre a V3 (não faz DROP de objetos existentes).
--  1. Adiciona colunas de cadastro institucional (EEx) na tabela municipios:
--     órgão, CNPJ, endereço, contatos, gestor, portaria e logomarcas — hoje
--     mantidas apenas no estado local do navegador.
--  2. Cria as tabelas do módulo de Controle Social CAE (antes só em
--     localStorage via mockData):
--       visitas_cae                (Fiscalização In Loco)
--       membros_cae                (Quadro de Conselheiros)
--       reunioes_cae               (Livro de Atas / Reuniões)
--       apontamentos_ouvidoria_cae (Ouvidoria Social)
--  3. RLS por município (mesmo padrão das demais tabelas da V3):
--       * leitura: ADMIN ou dentro do próprio município (CAE/equipe municipal)
--       * escrita: ADMIN/CAE, restrita ao município do perfil
--  4. Triggers de atualizado_em e índices.
-- ============================================================================

-- ============================================================================
-- 1. ÓRGÃO GESTOR (EEx) NA TABELA MUNICIPIOS
-- ============================================================================

ALTER TABLE public.municipios
    ADD COLUMN IF NOT EXISTS orgao_nome VARCHAR(500),
    ADD COLUMN IF NOT EXISTS cnpj VARCHAR(20),
    ADD COLUMN IF NOT EXISTS endereco TEXT,
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS telefone VARCHAR(60),
    ADD COLUMN IF NOT EXISTS gestor_nome VARCHAR(255),
    ADD COLUMN IF NOT EXISTS gestor_cargo VARCHAR(255),
    ADD COLUMN IF NOT EXISTS portaria VARCHAR(255),
    ADD COLUMN IF NOT EXISTS logo1 TEXT,
    ADD COLUMN IF NOT EXISTS logo2 TEXT;

-- ============================================================================
-- 2. TABELAS DO MÓDULO CAE
-- ============================================================================

-- Fiscalização in loco (vistorias e laudos do CAE nas escolas)
CREATE TABLE IF NOT EXISTS public.visitas_cae (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    data_visita DATE NOT NULL DEFAULT CURRENT_DATE,
    membros_cae_presentes TEXT[] NOT NULL DEFAULT '{}',
    cardapio_afixado_e_conforme BOOLEAN NOT NULL DEFAULT TRUE,
    armazenamento_adequado BOOLEAN NOT NULL DEFAULT TRUE,
    condicoes_higiene_aprovadas BOOLEAN NOT NULL DEFAULT TRUE,
    aceitabilidade_alunos VARCHAR(30) NOT NULL DEFAULT 'Aprovado'
        CHECK (aceitabilidade_alunos IN ('Excelente', 'Bom', 'Regular', 'Inadequado', 'Aprovado', 'Aprovado com Ressalvas', 'Reprovado')),
    relatorio_observacoes TEXT,
    recomendacoes_encaminhadas TEXT,
    status_pendencia VARCHAR(30) NOT NULL DEFAULT 'Sem Pendências'
        CHECK (status_pendencia IN ('Resolvida', 'Em Acompanhamento', 'Sem Pendências')),
    checklist_itens JSONB,
    pontuacao_conformidade NUMERIC(5,2) CHECK (pontuacao_conformidade BETWEEN 0 AND 100),
    classificacao_legal VARCHAR(100),
    responsavel_escola_nome VARCHAR(255),
    responsavel_escola_cargo VARCHAR(255),
    criado_por UUID REFERENCES public.perfis_usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quadro de conselheiros do CAE
CREATE TABLE IF NOT EXISTS public.membros_cae (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    segmento VARCHAR(100) NOT NULL
        CHECK (segmento IN ('Poder Executivo', 'Professores / Trabalhadores da Educação', 'Pais de Alunos', 'Sociedade Civil Organizada')),
    condicao VARCHAR(30) NOT NULL DEFAULT 'Titular'
        CHECK (condicao IN ('Titular', 'Suplente')),
    cargo_mesa VARCHAR(30) NOT NULL DEFAULT 'Conselheiro(a)'
        CHECK (cargo_mesa IN ('Presidente', 'Vice-Presidente', 'Secretário(a)', 'Conselheiro(a)', 'Relator(a)')),
    entidade_representada VARCHAR(255),
    cpf VARCHAR(14) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    mandato_inicio DATE,
    mandato_fim DATE,
    portaria_nomeacao VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'Ativo'
        CHECK (status IN ('Ativo', 'Licenciado', 'Substituído')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (municipio_id, cpf)
);

-- Livro de Atas / Reuniões do CAE
CREATE TABLE IF NOT EXISTS public.reunioes_cae (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    numero_ata VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'Ordinária'
        CHECK (tipo IN ('Ordinária', 'Extraordinária')),
    data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    local VARCHAR(255),
    pauta TEXT,
    resumo_deliberacoes TEXT,
    membros_presentes TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(30) NOT NULL DEFAULT 'Agendada'
        CHECK (status IN ('Realizada', 'Agendada', 'Cancelada')),
    arquivo_ata_url TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ouvidoria Social do CAE
CREATE TABLE IF NOT EXISTS public.apontamentos_ouvidoria_cae (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    escola_nome VARCHAR(255) NOT NULL,
    solicitante_tipo VARCHAR(50) NOT NULL
        CHECK (solicitante_tipo IN ('Pai/Mãe de Aluno', 'Professor', 'Merendeira', 'Comunidade')),
    data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    assunto VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Em Análise pelo CAE'
        CHECK (status IN ('Em Análise pelo CAE', 'Encaminhado ao Gestor', 'Resolvido')),
    resposta_cae TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. TRIGGERS DE ATUALIZAÇÃO
-- ============================================================================

DROP TRIGGER IF EXISTS trg_visitas_cae_updated_at ON public.visitas_cae;
CREATE TRIGGER trg_visitas_cae_updated_at BEFORE UPDATE ON public.visitas_cae
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_membros_cae_updated_at ON public.membros_cae;
CREATE TRIGGER trg_membros_cae_updated_at BEFORE UPDATE ON public.membros_cae
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_reunioes_cae_updated_at ON public.reunioes_cae;
CREATE TRIGGER trg_reunioes_cae_updated_at BEFORE UPDATE ON public.reunioes_cae
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ouvidoria_cae_updated_at ON public.apontamentos_ouvidoria_cae;
CREATE TRIGGER trg_ouvidoria_cae_updated_at BEFORE UPDATE ON public.apontamentos_ouvidoria_cae
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. RLS
-- ============================================================================

ALTER TABLE public.visitas_cae ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membros_cae ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reunioes_cae ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apontamentos_ouvidoria_cae ENABLE ROW LEVEL SECURITY;

-- VISITAS CAE
-- Leitura: ADMIN, a escola fiscalizada e a equipe municipal (CAE/nutricionista)
-- do município da escola. Escrita: ADMIN e CAE, dentro do próprio município.
CREATE POLICY visitas_cae_select
ON public.visitas_cae FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR escola_id = public.get_current_user_escola_id()
    OR EXISTS (
        SELECT 1 FROM public.escolas e
        WHERE e.id = escola_id AND e.municipio_id = public.get_current_user_municipio_id()
    )
);

CREATE POLICY visitas_cae_write
ON public.visitas_cae FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('ADMIN', 'CAE'))
WITH CHECK (
    public.get_current_user_role() IN ('ADMIN', 'CAE')
    AND (public.is_admin() OR municipio_id = public.get_current_user_municipio_id())
);

-- MEMBROS CAE
CREATE POLICY membros_cae_select
ON public.membros_cae FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR municipio_id = public.get_current_user_municipio_id()
);

CREATE POLICY membros_cae_write
ON public.membros_cae FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('ADMIN', 'CAE'))
WITH CHECK (
    public.get_current_user_role() IN ('ADMIN', 'CAE')
    AND (public.is_admin() OR municipio_id = public.get_current_user_municipio_id())
);

-- REUNIÕES CAE
CREATE POLICY reunioes_cae_select
ON public.reunioes_cae FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR municipio_id = public.get_current_user_municipio_id()
);

CREATE POLICY reunioes_cae_write
ON public.reunioes_cae FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('ADMIN', 'CAE'))
WITH CHECK (
    public.get_current_user_role() IN ('ADMIN', 'CAE')
    AND (public.is_admin() OR municipio_id = public.get_current_user_municipio_id())
);

-- OUVIDORIA CAE
CREATE POLICY ouvidoria_cae_select
ON public.apontamentos_ouvidoria_cae FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR municipio_id = public.get_current_user_municipio_id()
);

CREATE POLICY ouvidoria_cae_write
ON public.apontamentos_ouvidoria_cae FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('ADMIN', 'CAE'))
WITH CHECK (
    public.get_current_user_role() IN ('ADMIN', 'CAE')
    AND (public.is_admin() OR municipio_id = public.get_current_user_municipio_id())
);

-- ============================================================================
-- 5. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_visitas_cae_municipio ON public.visitas_cae(municipio_id);
CREATE INDEX IF NOT EXISTS idx_visitas_cae_escola ON public.visitas_cae(escola_id);
CREATE INDEX IF NOT EXISTS idx_visitas_cae_data ON public.visitas_cae(data_visita);

CREATE INDEX IF NOT EXISTS idx_membros_cae_municipio ON public.membros_cae(municipio_id);
CREATE INDEX IF NOT EXISTS idx_membros_cae_segmento ON public.membros_cae(segmento);

CREATE INDEX IF NOT EXISTS idx_reunioes_cae_municipio ON public.reunioes_cae(municipio_id);
CREATE INDEX IF NOT EXISTS idx_reunioes_cae_data ON public.reunioes_cae(data_hora);

CREATE INDEX IF NOT EXISTS idx_ouvidoria_cae_municipio ON public.apontamentos_ouvidoria_cae(municipio_id);
CREATE INDEX IF NOT EXISTS idx_ouvidoria_cae_status ON public.apontamentos_ouvidoria_cae(status);

-- ============================================================================
-- 6. VERIFICAÇÕES FINAIS
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='municipios' AND column_name='gestor_nome') THEN
        RAISE EXCEPTION 'Colunas do Órgão Gestor não foram adicionadas em municipios.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='membros_cae') THEN
        RAISE EXCEPTION 'RLS: policies de membros_cae não foram criadas.';
    END IF;
END $$;

-- ============================================================================
-- FIM DA MIGRATION V4
-- ============================================================================

-- ============================================================================
-- ERP PNAE - SUPABASE / POSTGRESQL
-- MIGRATION V3 - CORREÇÕES DE BUGS E SEGURANÇA
-- ============================================================================
-- Alterações em relação à V2:
--  1. [BUG CRÍTICO] validar_consistencia_proposta_item() consultava a tabela
--     errada (chamadas_publicas em vez de chamada_publica_itens), o que
--     bloqueava todo INSERT/UPDATE em proposta_itens.
--  2. [SEGURANÇA CRÍTICA] Usuário comum podia se autopromover a ADMIN e se
--     vincular a qualquer município/escola via INSERT/UPDATE do próprio
--     perfil (role, municipio_id, escola_id não eram protegidos). Adicionado
--     trigger proteger_campos_sensiveis_perfil().
--  3. [RLS] Papel CAE enxergava dados de TODOS os municípios em várias
--     tabelas, contrariando o objetivo de "RLS por município". Removidas as
--     cláusulas de acesso irrestrito, mantendo apenas o acesso já existente
--     via comparação de municipio_id (que também cobre o CAE, desde que seu
--     perfil tenha municipio_id preenchido).
--  4. [RLS] entregas_update permitia que qualquer NUTRICIONISTA (de qualquer
--     município) alterasse entregas de outros municípios. Escopado.
--  5. [RLS] proposta_itens_access tinha precedência de AND/OR incorreta no
--     WITH CHECK, impedindo NUTRICIONISTA de inserir/editar itens de
--     proposta. Corrigido.
--  6. [PERFORMANCE] auth.uid() reescrito como (select auth.uid()) nas
--     funções auxiliares e nas policies, permitindo ao planejador cachear o
--     valor por statement em vez de reavaliar por linha.
--  7. [ROBUSTEZ] Loop de DROP POLICY passou a agir apenas sobre as tabelas
--     desta migration, em vez de todo o schema public.
--  8. [COBERTURA] Auditoria estendida para perfis_usuarios,
--     propostas_fornecedores, af_itens e entrega_itens.
--  9. [SIMPLIFICAÇÃO] aplicar_delta_estoque() deixou de fazer uma escrita
--     redundante (upsert "no-op" seguido de UPDATE) em deltas negativos.
-- ============================================================================
-- Objetivos:
--  * schema consistente e executável em PostgreSQL/Supabase
--  * RLS por município/escola/perfil
--  * funções SECURITY DEFINER sem recursão de RLS
--  * integridade entre Chamada -> Proposta -> Contrato -> AF -> Entrega -> Estoque
--  * controle de INSERT/UPDATE/DELETE no estoque
--  * auditoria com before/after em JSONB
--  * índices para FKs e consultas de RLS
--  * validações de datas, valores e quantidades
--  * controle configurável do limite anual por CAF/EEx
--
-- IMPORTANTE:
-- Esta versão é recomendada para uma INSTALAÇÃO NOVA. Ela não executa DROP de
-- objetos existentes. Para uma base já em produção, faça backup e aplique uma
-- migration de transição específica, preservando os dados.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TIPOS
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'user_role_type' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.user_role_type AS ENUM
        ('ADMIN', 'NUTRICIONISTA', 'ESCOLA', 'FORNECEDOR', 'CAE');
    END IF;
END $$;

-- ============================================================================
-- 2. TABELAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.municipios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    uf CHAR(2) NOT NULL,
    codigo_ibge VARCHAR(10) NOT NULL UNIQUE,
    total_alunos_pnae INTEGER NOT NULL DEFAULT 0 CHECK (total_alunos_pnae >= 0),
    orcamento_anual_fnde NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (orcamento_anual_fnde >= 0),
    orcamento_contrapartida NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (orcamento_contrapartida >= 0),
    ano_exercicio INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        CHECK (ano_exercicio BETWEEN 2000 AND 2200),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.escolas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    codigo_inep VARCHAR(12) NOT NULL UNIQUE,
    endereco TEXT NOT NULL,
    diretor_nome VARCHAR(255) NOT NULL,
    responsavel_merenda_nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    total_alunos INTEGER NOT NULL DEFAULT 0 CHECK (total_alunos >= 0),
    tipo_atendimento VARCHAR(20) NOT NULL DEFAULT 'Parcial'
        CHECK (tipo_atendimento IN ('Parcial', 'Integral')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.perfis_usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role public.user_role_type NOT NULL DEFAULT 'ESCOLA',
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    municipio_id UUID REFERENCES public.municipios(id) ON DELETE SET NULL,
    escola_id UUID REFERENCES public.escolas(id) ON DELETE SET NULL,
    crn VARCHAR(50),
    dap_caf VARCHAR(50),
    -- Campos novos para compatibilidade com a regulamentação baseada em CAF.
    tipo_produtor VARCHAR(30) NOT NULL DEFAULT 'Individual'
        CHECK (tipo_produtor IN ('Individual', 'Grupo Informal', 'Grupo Formal', 'EFR')),
    caf VARCHAR(50),
    caf_tipo VARCHAR(30)
        CHECK (caf_tipo IS NULL OR caf_tipo IN ('Pessoa Física', 'Pessoa Jurídica')),
    cpf_cnpj_fornecedor VARCHAR(18),
    cargo VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_taco VARCHAR(20),
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    preco_referencia_medio NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (preco_referencia_medio >= 0),
    eh_agricultura_familiar BOOLEAN NOT NULL DEFAULT FALSE,
    eh_organico BOOLEAN NOT NULL DEFAULT FALSE,
    calorias_kcal NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (calorias_kcal >= 0),
    carboidratos_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (carboidratos_g >= 0),
    proteinas_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (proteinas_g >= 0),
    lipidios_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (lipidios_g >= 0),
    fibras_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (fibras_g >= 0),
    calcio_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (calcio_mg >= 0),
    ferro_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (ferro_mg >= 0),
    vitamina_c_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (vitamina_c_mg >= 0),
    sodio_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (sodio_mg >= 0),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cardapios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mes_referencia VARCHAR(7) NOT NULL CHECK (mes_referencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    semana_numero INTEGER NOT NULL CHECK (semana_numero BETWEEN 1 AND 5),
    etapa_ensino VARCHAR(100) NOT NULL,
    nutricionista_id UUID NOT NULL REFERENCES public.perfis_usuarios(id),
    dias_letivos_semana INTEGER NOT NULL DEFAULT 5 CHECK (dias_letivos_semana BETWEEN 1 AND 7),
    percentual_agri_familiar_estimado NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (percentual_agri_familiar_estimado BETWEEN 0 AND 100),
    status VARCHAR(50) NOT NULL DEFAULT 'Rascunho'
        CHECK (status IN ('Rascunho', 'Aprovado Nutricionista', 'Homologado CAE', 'Em Execução')),
    observacoes_dietas_especiais TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cardapio_refeicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cardapio_id UUID NOT NULL REFERENCES public.cardapios(id) ON DELETE CASCADE,
    dia_semana VARCHAR(20) NOT NULL,
    tipo_refeicao VARCHAR(50) NOT NULL,
    nome_prato VARCHAR(255) NOT NULL,
    descricao_preparo TEXT,
    total_kcal NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_kcal >= 0),
    total_carboidratos_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_carboidratos_g >= 0),
    total_proteinas_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_proteinas_g >= 0),
    total_lipidios_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_lipidios_g >= 0),
    total_fibras_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_fibras_g >= 0),
    total_calcio_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_calcio_mg >= 0),
    total_ferro_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_ferro_mg >= 0),
    total_vitamina_c_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_vitamina_c_mg >= 0),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cardapio_refeicao_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refeicao_id UUID NOT NULL REFERENCES public.cardapio_refeicoes(id) ON DELETE CASCADE,
    alimento_id UUID NOT NULL REFERENCES public.alimentos(id),
    per_capita_liquido_g NUMERIC(8,2) NOT NULL CHECK (per_capita_liquido_g >= 0),
    per_capita_bruto_g NUMERIC(8,2) NOT NULL CHECK (per_capita_bruto_g >= per_capita_liquido_g),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (refeicao_id, alimento_id)
);

CREATE TABLE IF NOT EXISTS public.chamadas_publicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    numero_edital VARCHAR(50) NOT NULL UNIQUE,
    ano_exercicio INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        CHECK (ano_exercicio BETWEEN 2000 AND 2200),
    titulo VARCHAR(255) NOT NULL,
    objeto TEXT NOT NULL,
    data_abertura DATE NOT NULL,
    data_encerramento DATE NOT NULL,
    valor_total_estimado NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (valor_total_estimado >= 0),
    valor_reservado_agri_familiar NUMERIC(15,2) NOT NULL DEFAULT 0
        CHECK (valor_reservado_agri_familiar >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Publicada'
        CHECK (status IN ('Publicada', 'Em Análise de Propostas', 'Homologada', 'Contratos Emitidos', 'Encerrada')),
    arquivo_edital_url TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_chamada_datas CHECK (data_encerramento >= data_abertura),
    CONSTRAINT ck_chamada_reserva CHECK (valor_reservado_agri_familiar <= valor_total_estimado)
);

CREATE TABLE IF NOT EXISTS public.chamada_publica_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chamada_publica_id UUID NOT NULL REFERENCES public.chamadas_publicas(id) ON DELETE CASCADE,
    alimento_id UUID NOT NULL REFERENCES public.alimentos(id),
    quantidade_total_solicitada NUMERIC(12,2) NOT NULL CHECK (quantidade_total_solicitada > 0),
    preco_maximo_referencia NUMERIC(10,2) NOT NULL CHECK (preco_maximo_referencia > 0),
    valor_total_item NUMERIC(15,2)
        GENERATED ALWAYS AS (quantidade_total_solicitada * preco_maximo_referencia) STORED,
    exclusivo_agricultura_familiar BOOLEAN NOT NULL DEFAULT TRUE,
    exige_organico BOOLEAN NOT NULL DEFAULT FALSE,
    cronograma_entrega VARCHAR(50) NOT NULL DEFAULT 'Semanal',
    UNIQUE (chamada_publica_id, alimento_id)
);

CREATE TABLE IF NOT EXISTS public.propostas_fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chamada_publica_id UUID NOT NULL REFERENCES public.chamadas_publicas(id) ON DELETE CASCADE,
    fornecedor_id UUID NOT NULL REFERENCES public.perfis_usuarios(id),
    tipo_produtor VARCHAR(30) NOT NULL DEFAULT 'Individual'
        CHECK (tipo_produtor IN ('Individual', 'Grupo Informal', 'Grupo Formal', 'EFR')),
    valor_total_proposta NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (valor_total_proposta >= 0),
    acumulado_ano_dap_caf NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (acumulado_ano_dap_caf >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Em Análise'
        CHECK (status IN ('Em Análise', 'Habilitada', 'Vencedora', 'Desclassificada')),
    motivo_desclassificacao TEXT,
    data_submissao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (chamada_publica_id, fornecedor_id)
);

CREATE TABLE IF NOT EXISTS public.proposta_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposta_id UUID NOT NULL REFERENCES public.propostas_fornecedores(id) ON DELETE CASCADE,
    item_chamada_id UUID NOT NULL REFERENCES public.chamada_publica_itens(id),
    quantidade_ofertada NUMERIC(12,2) NOT NULL CHECK (quantidade_ofertada > 0),
    preco_unitario_ofertado NUMERIC(10,2) NOT NULL CHECK (preco_unitario_ofertado > 0),
    valor_total NUMERIC(15,2)
        GENERATED ALWAYS AS (quantidade_ofertada * preco_unitario_ofertado) STORED,
    UNIQUE (proposta_id, item_chamada_id)
);

CREATE TABLE IF NOT EXISTS public.contratos_fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    chamada_publica_id UUID NOT NULL REFERENCES public.chamadas_publicas(id),
    fornecedor_id UUID NOT NULL REFERENCES public.perfis_usuarios(id),
    proposta_id UUID REFERENCES public.propostas_fornecedores(id),
    numero_contrato VARCHAR(50) NOT NULL UNIQUE,
    valor_total_contrato NUMERIC(15,2) NOT NULL CHECK (valor_total_contrato > 0),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Vigente'
        CHECK (status IN ('Vigente', 'Concluído', 'Cancelado')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_contrato_datas CHECK (data_fim >= data_inicio)
);

CREATE TABLE IF NOT EXISTS public.autorizacoes_fornecimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_af VARCHAR(50) NOT NULL UNIQUE,
    contrato_id UUID NOT NULL REFERENCES public.contratos_fornecedores(id) ON DELETE CASCADE,
    escola_id UUID NOT NULL REFERENCES public.escolas(id),
    fornecedor_id UUID NOT NULL REFERENCES public.perfis_usuarios(id),
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_limite_entrega DATE NOT NULL,
    valor_total_af NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (valor_total_af >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Emitida'
        CHECK (status IN ('Emitida', 'Em Trânsito', 'Entregue Total', 'Entregue Parcial', 'Atrasada', 'Recusada')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_af_datas CHECK (data_limite_entrega >= data_emissao)
);

CREATE TABLE IF NOT EXISTS public.af_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    af_id UUID NOT NULL REFERENCES public.autorizacoes_fornecimento(id) ON DELETE CASCADE,
    proposta_item_id UUID REFERENCES public.proposta_itens(id),
    alimento_id UUID NOT NULL REFERENCES public.alimentos(id),
    quantidade_autorizada NUMERIC(12,2) NOT NULL CHECK (quantidade_autorizada > 0),
    quantidade_entregue NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantidade_entregue >= 0),
    preco_unitario NUMERIC(10,2) NOT NULL CHECK (preco_unitario > 0),
    valor_total NUMERIC(15,2)
        GENERATED ALWAYS AS (quantidade_autorizada * preco_unitario) STORED,
    UNIQUE (af_id, alimento_id)
);

CREATE TABLE IF NOT EXISTS public.entregas_mercadorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    af_id UUID NOT NULL REFERENCES public.autorizacoes_fornecimento(id),
    escola_id UUID NOT NULL REFERENCES public.escolas(id),
    fornecedor_id UUID NOT NULL REFERENCES public.perfis_usuarios(id),
    data_entrega DATE NOT NULL DEFAULT CURRENT_DATE,
    nota_fiscal_ou_recibo VARCHAR(100) NOT NULL,
    responsavel_recebimento_id UUID NOT NULL REFERENCES public.perfis_usuarios(id),
    status_conferencia VARCHAR(50) NOT NULL DEFAULT 'Conforme Total'
        CHECK (status_conferencia IN ('Conforme Total', 'Conforme com Ressalva', 'Rejeitado / Devolvido')),
    parecer_qualidade VARCHAR(30) NOT NULL DEFAULT 'Excelente'
        CHECK (parecer_qualidade IN ('Excelente', 'Bom', 'Regular', 'Inadequado')),
    observacoes TEXT,
    termo_recebimento_gerado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.entrega_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrega_id UUID NOT NULL REFERENCES public.entregas_mercadorias(id) ON DELETE CASCADE,
    af_item_id UUID NOT NULL REFERENCES public.af_itens(id),
    alimento_id UUID NOT NULL REFERENCES public.alimentos(id),
    quantidade_esperada NUMERIC(12,2) NOT NULL CHECK (quantidade_esperada > 0),
    quantidade_recebida NUMERIC(12,2) NOT NULL CHECK (quantidade_recebida >= 0),
    aprovado BOOLEAN NOT NULL DEFAULT TRUE,
    motivo_divergencia TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (entrega_id, af_item_id)
);

CREATE TABLE IF NOT EXISTS public.estoque_escola (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    alimento_id UUID NOT NULL REFERENCES public.alimentos(id),
    quantidade_atual NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantidade_atual >= 0),
    quantidade_minima_alerta NUMERIC(12,2) NOT NULL DEFAULT 10 CHECK (quantidade_minima_alerta >= 0),
    data_validade_proxima DATE,
    lote VARCHAR(50),
    ultima_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (escola_id, alimento_id)
);

CREATE TABLE IF NOT EXISTS public.prestacoes_contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    ano_exercicio INTEGER NOT NULL CHECK (ano_exercicio BETWEEN 2000 AND 2200),
    recurso_total_fnde_recebido NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (recurso_total_fnde_recebido >= 0),
    contrapartida_municipal_gasta NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (contrapartida_municipal_gasta >= 0),
    gasto_total_alimentacao NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (gasto_total_alimentacao >= 0),
    gasto_agricultura_familiar NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (gasto_agricultura_familiar >= 0),
    percentual_agricultura_familiar NUMERIC(7,2)
        GENERATED ALWAYS AS (
            CASE WHEN recurso_total_fnde_recebido > 0
                 THEN ROUND((gasto_agricultura_familiar / recurso_total_fnde_recebido) * 100, 2)
                 ELSE 0 END
        ) STORED,
    cumpre_meta_legal_30_porcento BOOLEAN
        GENERATED ALWAYS AS (
            CASE WHEN recurso_total_fnde_recebido > 0
                 THEN gasto_agricultura_familiar >= (recurso_total_fnde_recebido * 0.30)
                 ELSE FALSE END
        ) STORED,
    saldo_remanescente NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (saldo_remanescente >= 0),
    numero_alunos_atendidos INTEGER NOT NULL DEFAULT 0 CHECK (numero_alunos_atendidos >= 0),
    status_aprovacao VARCHAR(50) NOT NULL DEFAULT 'Pendente Análise'
        CHECK (status_aprovacao IN ('Pendente Análise', 'Em Análise CAE', 'Aprovado pelo CAE', 'Aprovado com Ressalvas', 'Rejeitado')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (municipio_id, ano_exercicio)
);

CREATE TABLE IF NOT EXISTS public.pareceres_cae (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestacao_contas_id UUID NOT NULL REFERENCES public.prestacoes_contas(id) ON DELETE CASCADE,
    ano_exercicio INTEGER NOT NULL,
    data_reuniao_ata DATE NOT NULL,
    numero_ata VARCHAR(50) NOT NULL,
    presidente_cae_nome VARCHAR(255) NOT NULL,
    relator_cae_nome VARCHAR(255) NOT NULL,
    resultado_parecer VARCHAR(50) NOT NULL
        CHECK (resultado_parecer IN ('Favorável sem Ressalvas', 'Favorável com Ressalvas', 'Desfavorável (Irregularidades)')),
    texto_parecer_conclusivo TEXT NOT NULL,
    recomendacoes_ao_gestor TEXT,
    membros_presentes TEXT[] NOT NULL DEFAULT '{}',
    assinado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (prestacao_contas_id)
);

CREATE TABLE IF NOT EXISTS public.auditoria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usuario_nome VARCHAR(255),
    usuario_role public.user_role_type,
    acao VARCHAR(20) NOT NULL,
    modulo VARCHAR(100) NOT NULL,
    registro_id UUID,
    detalhes TEXT,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_origem INET,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de configuração das regras anuais. Evita "hard-code" do limite no trigger.
CREATE TABLE IF NOT EXISTS public.regras_pnae (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ano_exercicio INTEGER NOT NULL UNIQUE CHECK (ano_exercicio BETWEEN 2000 AND 2200),
    limite_anual_por_caf NUMERIC(15,2) NOT NULL DEFAULT 40000 CHECK (limite_anual_por_caf > 0),
    percentual_minimo_agricultura_familiar NUMERIC(5,2) NOT NULL DEFAULT 30
        CHECK (percentual_minimo_agricultura_familiar BETWEEN 0 AND 100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. FUNÇÕES AUXILIARES DE USUÁRIO / RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.perfis_usuarios WHERE id = (SELECT auth.uid()) AND ativo = TRUE LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_municipio_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT municipio_id FROM public.perfis_usuarios WHERE id = (SELECT auth.uid()) AND ativo = TRUE LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_escola_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT escola_id FROM public.perfis_usuarios WHERE id = (SELECT auth.uid()) AND ativo = TRUE LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(public.get_current_user_role() = 'ADMIN', FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_staff_municipal()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA','CAE'), FALSE);
$$;

-- ============================================================================
-- 3.1 PROTEÇÃO CONTRA AUTOPROMOÇÃO DE PRIVILÉGIO (V3 - CORREÇÃO CRÍTICA)
-- ============================================================================
-- As policies perfis_admin_insert e perfis_self_update permitem que o
-- próprio usuário crie/edite sua linha em perfis_usuarios (id = auth.uid()).
-- Sem esta trigger, nada impedia um usuário comum de definir role='ADMIN'
-- (ou qualquer municipio_id/escola_id) na própria linha e assim burlar toda
-- a estratégia de RLS baseada nesses campos. A trigger força, para quem NÃO
-- é admin: papel padrão 'ESCOLA' na criação e bloqueio de alteração de
-- role/municipio_id/escola_id/ativo em updates subsequentes. A vinculação a
-- um município/escola específico deve ser feita por um ADMIN.

CREATE OR REPLACE FUNCTION public.proteger_campos_sensiveis_perfil()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.role := 'ESCOLA';
        NEW.municipio_id := NULL;
        NEW.escola_id := NULL;
        NEW.ativo := TRUE;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.role := OLD.role;
        NEW.municipio_id := OLD.municipio_id;
        NEW.escola_id := OLD.escola_id;
        NEW.ativo := OLD.ativo;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protege_perfil ON public.perfis_usuarios;
CREATE TRIGGER trg_protege_perfil
BEFORE INSERT OR UPDATE ON public.perfis_usuarios
FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_sensiveis_perfil();

-- ============================================================================
-- 4. FUNÇÕES DE INTEGRIDADE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validar_consistencia_proposta_item()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_chamada UUID;
BEGIN
    -- CORRIGIDO (V3): item_chamada_id referencia chamada_publica_itens(id),
    -- não chamadas_publicas(id). A versão anterior consultava a tabela pai
    -- e por isso v_chamada era sempre NULL, bloqueando todo INSERT/UPDATE
    -- em proposta_itens.
    SELECT chamada_publica_id
      INTO v_chamada
      FROM public.chamada_publica_itens
     WHERE id = NEW.item_chamada_id;

    IF v_chamada IS NULL THEN
        RAISE EXCEPTION 'Item da chamada pública não encontrado.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM public.propostas_fornecedores p
         WHERE p.id = NEW.proposta_id
           AND p.chamada_publica_id = v_chamada
    ) THEN
        RAISE EXCEPTION 'A proposta e o item da chamada pública pertencem a chamadas diferentes.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_valida_proposta_item ON public.proposta_itens;
CREATE TRIGGER trg_valida_proposta_item
BEFORE INSERT OR UPDATE ON public.proposta_itens
FOR EACH ROW EXECUTE FUNCTION public.validar_consistencia_proposta_item();

CREATE OR REPLACE FUNCTION public.validar_af()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_municipio UUID;
    v_fornecedor UUID;
BEGIN
    SELECT municipio_id, fornecedor_id
      INTO v_municipio, v_fornecedor
      FROM public.contratos_fornecedores
     WHERE id = NEW.contrato_id;

    IF v_municipio IS NULL THEN
        RAISE EXCEPTION 'Contrato da AF não encontrado.';
    END IF;

    IF NEW.fornecedor_id <> v_fornecedor THEN
        RAISE EXCEPTION 'O fornecedor da AF deve ser o mesmo fornecedor do contrato.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.escolas e
        WHERE e.id = NEW.escola_id AND e.municipio_id = v_municipio
    ) THEN
        RAISE EXCEPTION 'A escola da AF não pertence ao município do contrato.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_valida_af ON public.autorizacoes_fornecimento;
CREATE TRIGGER trg_valida_af
BEFORE INSERT OR UPDATE ON public.autorizacoes_fornecimento
FOR EACH ROW EXECUTE FUNCTION public.validar_af();

CREATE OR REPLACE FUNCTION public.validar_entrega()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_af public.autorizacoes_fornecimento%ROWTYPE;
BEGIN
    SELECT * INTO v_af
      FROM public.autorizacoes_fornecimento
     WHERE id = NEW.af_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'AF não encontrada.';
    END IF;

    IF NEW.escola_id <> v_af.escola_id OR NEW.fornecedor_id <> v_af.fornecedor_id THEN
        RAISE EXCEPTION 'Escola e fornecedor da entrega devem coincidir com a AF.';
    END IF;

    IF NEW.data_entrega < (
        SELECT data_emissao FROM public.autorizacoes_fornecimento WHERE id = NEW.af_id
    ) THEN
        RAISE EXCEPTION 'A data da entrega não pode ser anterior à emissão da AF.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_valida_entrega ON public.entregas_mercadorias;
CREATE TRIGGER trg_valida_entrega
BEFORE INSERT OR UPDATE ON public.entregas_mercadorias
FOR EACH ROW EXECUTE FUNCTION public.validar_entrega();

CREATE OR REPLACE FUNCTION public.validar_entrega_item()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_af_id UUID;
    v_alimento UUID;
BEGIN
    SELECT af_id, alimento_id
      INTO v_af_id, v_alimento
      FROM public.af_itens
     WHERE id = NEW.af_item_id;

    IF v_af_id IS NULL THEN
        RAISE EXCEPTION 'Item da AF não encontrado.';
    END IF;

    IF v_alimento <> NEW.alimento_id THEN
        RAISE EXCEPTION 'O alimento do item da entrega não corresponde ao item da AF.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.entregas_mercadorias
        WHERE id = NEW.entrega_id AND af_id = v_af_id
    ) THEN
        RAISE EXCEPTION 'O item da entrega deve pertencer à mesma AF da entrega.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_valida_entrega_item ON public.entrega_itens;
CREATE TRIGGER trg_valida_entrega_item
BEFORE INSERT OR UPDATE ON public.entrega_itens
FOR EACH ROW EXECUTE FUNCTION public.validar_entrega_item();

-- ============================================================================
-- 5. LIMITE ANUAL POR CAF / FORNECEDOR
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validar_limite_anual_fornecedor()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_ano INTEGER;
    v_limite NUMERIC(15,2);
    v_caf TEXT;
    v_total NUMERIC(15,2);
BEGIN
    IF NEW.status = 'Cancelado' THEN
        RETURN NEW;
    END IF;

    v_ano := EXTRACT(YEAR FROM NEW.data_inicio)::INTEGER;

    SELECT COALESCE(limite_anual_por_caf, 40000)
      INTO v_limite
      FROM public.regras_pnae
     WHERE ano_exercicio = v_ano
       AND ativo = TRUE
     LIMIT 1;

    IF v_limite IS NULL THEN
        v_limite := 40000;
    END IF;

    SELECT COALESCE(NULLIF(caf, ''), NULLIF(dap_caf, ''))
      INTO v_caf
      FROM public.perfis_usuarios
     WHERE id = NEW.fornecedor_id;

    IF v_caf IS NULL THEN
        RAISE EXCEPTION 'Fornecedor % não possui CAF/DAP cadastrado.', NEW.fornecedor_id;
    END IF;

    SELECT COALESCE(SUM(c.valor_total_contrato), 0)
      INTO v_total
      FROM public.contratos_fornecedores c
      JOIN public.perfis_usuarios p ON p.id = c.fornecedor_id
     WHERE c.fornecedor_id = NEW.fornecedor_id
       AND EXTRACT(YEAR FROM c.data_inicio)::INTEGER = v_ano
       AND c.status <> 'Cancelado'
       AND c.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

    IF v_total + NEW.valor_total_contrato > v_limite THEN
        RAISE EXCEPTION
            'Limite anual configurado para o CAF excedido. Ano: %, Limite: R$ %, Acumulado: R$ %, Novo contrato: R$ %.',
            v_ano, v_limite, v_total, NEW.valor_total_contrato;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_valida_limite_anual ON public.contratos_fornecedores;
CREATE TRIGGER trg_valida_limite_anual
BEFORE INSERT OR UPDATE OF fornecedor_id, valor_total_contrato, data_inicio, status
ON public.contratos_fornecedores
FOR EACH ROW EXECUTE FUNCTION public.validar_limite_anual_fornecedor();

-- ============================================================================
-- 6. ESTOQUE - INSERT / UPDATE / DELETE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.aplicar_delta_estoque(
    p_escola_id UUID,
    p_alimento_id UUID,
    p_delta NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_atual NUMERIC;
BEGIN
    IF p_delta = 0 THEN
        RETURN;
    END IF;

    -- CORRIGIDO (V3): um único INSERT ... ON CONFLICT aplica o delta (positivo
    -- ou negativo) diretamente, sem a escrita redundante da versão anterior.
    -- Importante: no caminho de INSERT (linha ainda não existe) o valor
    -- inicial é o próprio p_delta (não GREATEST(p_delta,0)) — caso contrário
    -- um delta negativo sem estoque prévio silenciosamente viraria 0 em vez
    -- de estourar o CHECK (quantidade_atual >= 0). O CHECK da tabela cobre
    -- os dois caminhos (INSERT e UPDATE); convertemos a violação numa
    -- mensagem de erro mais clara para quem chama a função.
    BEGIN
        INSERT INTO public.estoque_escola (
            escola_id, alimento_id, quantidade_atual, ultima_atualizacao
        )
        VALUES (
            p_escola_id, p_alimento_id, p_delta, NOW()
        )
        ON CONFLICT (escola_id, alimento_id)
        DO UPDATE SET
            quantidade_atual = public.estoque_escola.quantidade_atual + p_delta,
            ultima_atualizacao = NOW()
        RETURNING quantidade_atual INTO v_atual;
    EXCEPTION
        WHEN check_violation THEN
            RAISE EXCEPTION 'Estoque insuficiente para estornar a entrega. Escola: %, Alimento: %.',
                p_escola_id, p_alimento_id;
    END;
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_estoque_apos_entrega()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_escola_old UUID;
    v_escola_new UUID;
    v_delta_old NUMERIC := 0;
    v_delta_new NUMERIC := 0;
    v_af_old UUID;
    v_af_new UUID;
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        SELECT escola_id INTO v_escola_old
          FROM public.entregas_mercadorias WHERE id = OLD.entrega_id;

        v_delta_old := CASE WHEN OLD.aprovado THEN OLD.quantidade_recebida ELSE 0 END;
        PERFORM public.aplicar_delta_estoque(v_escola_old, OLD.alimento_id, -v_delta_old);
    END IF;

    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        SELECT escola_id INTO v_escola_new
          FROM public.entregas_mercadorias WHERE id = NEW.entrega_id;

        v_delta_new := CASE WHEN NEW.aprovado THEN NEW.quantidade_recebida ELSE 0 END;
        PERFORM public.aplicar_delta_estoque(v_escola_new, NEW.alimento_id, v_delta_new);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_atualiza_estoque_entrega ON public.entrega_itens;
CREATE TRIGGER trg_atualiza_estoque_entrega
AFTER INSERT OR UPDATE OR DELETE ON public.entrega_itens
FOR EACH ROW EXECUTE FUNCTION public.atualizar_estoque_apos_entrega();

-- ============================================================================
-- 7. ATUALIZAÇÃO DA QUANTIDADE ENTREGUE NA AF
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recalcular_quantidade_entregue_af()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_af_item_id UUID;
    v_af_id UUID;
BEGIN
    v_af_item_id := COALESCE(NEW.af_item_id, OLD.af_item_id);

    SELECT af_id INTO v_af_id
      FROM public.af_itens WHERE id = v_af_item_id;

    UPDATE public.af_itens ai
       SET quantidade_entregue = COALESCE((
           SELECT SUM(ei.quantidade_recebida)
             FROM public.entrega_itens ei
             JOIN public.entregas_mercadorias e ON e.id = ei.entrega_id
            WHERE ei.af_item_id = ai.id
              AND ei.aprovado = TRUE
              AND e.status_conferencia <> 'Rejeitado / Devolvido'
       ), 0),
           atualizado_em = NOW()
     WHERE ai.id = v_af_item_id;

    UPDATE public.autorizacoes_fornecimento af
       SET status = CASE
           WHEN NOT EXISTS (
               SELECT 1 FROM public.af_itens ai WHERE ai.af_id = af.id
           ) THEN af.status
           WHEN EXISTS (
               SELECT 1 FROM public.af_itens ai
                WHERE ai.af_id = af.id AND ai.quantidade_entregue > 0
                  AND ai.quantidade_entregue < ai.quantidade_autorizada
           ) THEN 'Entregue Parcial'
           WHEN NOT EXISTS (
               SELECT 1 FROM public.af_itens ai
                WHERE ai.af_id = af.id
                  AND ai.quantidade_entregue < ai.quantidade_autorizada
           ) THEN 'Entregue Total'
           ELSE 'Emitida'
       END,
       atualizado_em = NOW()
     WHERE af.id = v_af_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recalcula_af_entregue ON public.entrega_itens;
CREATE TRIGGER trg_recalcula_af_entregue
AFTER INSERT OR UPDATE OR DELETE ON public.entrega_itens
FOR EACH ROW EXECUTE FUNCTION public.recalcular_quantidade_entregue_af();

-- ============================================================================
-- 8. VALORES DA AF
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recalcular_valor_af()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_af UUID;
BEGIN
    v_af := COALESCE(NEW.af_id, OLD.af_id);

    UPDATE public.autorizacoes_fornecimento
       SET valor_total_af = COALESCE((
           SELECT SUM(valor_total) FROM public.af_itens WHERE af_id = v_af
       ), 0),
       atualizado_em = NOW()
     WHERE id = v_af;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recalcula_valor_af ON public.af_itens;
CREATE TRIGGER trg_recalcula_valor_af
AFTER INSERT OR UPDATE OR DELETE ON public.af_itens
FOR EACH ROW EXECUTE FUNCTION public.recalcular_valor_af();

-- ============================================================================
-- 9. ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_municipios_updated_at ON public.municipios;
CREATE TRIGGER trg_municipios_updated_at BEFORE UPDATE ON public.municipios
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_escolas_updated_at ON public.escolas;
CREATE TRIGGER trg_escolas_updated_at BEFORE UPDATE ON public.escolas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_perfis_updated_at ON public.perfis_usuarios;
CREATE TRIGGER trg_perfis_updated_at BEFORE UPDATE ON public.perfis_usuarios
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_alimentos_updated_at ON public.alimentos;
CREATE TRIGGER trg_alimentos_updated_at BEFORE UPDATE ON public.alimentos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_cardapios_updated_at ON public.cardapios;
CREATE TRIGGER trg_cardapios_updated_at BEFORE UPDATE ON public.cardapios
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_cardapio_refeicoes_updated_at ON public.cardapio_refeicoes;
CREATE TRIGGER trg_cardapio_refeicoes_updated_at BEFORE UPDATE ON public.cardapio_refeicoes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_chamadas_updated_at ON public.chamadas_publicas;
CREATE TRIGGER trg_chamadas_updated_at BEFORE UPDATE ON public.chamadas_publicas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_propostas_updated_at ON public.propostas_fornecedores;
CREATE TRIGGER trg_propostas_updated_at BEFORE UPDATE ON public.propostas_fornecedores
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_contratos_updated_at ON public.contratos_fornecedores;
CREATE TRIGGER trg_contratos_updated_at BEFORE UPDATE ON public.contratos_fornecedores
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_af_updated_at ON public.autorizacoes_fornecimento;
CREATE TRIGGER trg_af_updated_at BEFORE UPDATE ON public.autorizacoes_fornecimento
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_entregas_updated_at ON public.entregas_mercadorias;
CREATE TRIGGER trg_entregas_updated_at BEFORE UPDATE ON public.entregas_mercadorias
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_entrega_itens_updated_at ON public.entrega_itens;
CREATE TRIGGER trg_entrega_itens_updated_at BEFORE UPDATE ON public.entrega_itens
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_prestacoes_updated_at ON public.prestacoes_contas;
CREATE TRIGGER trg_prestacoes_updated_at BEFORE UPDATE ON public.prestacoes_contas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_regras_updated_at ON public.regras_pnae;
CREATE TRIGGER trg_regras_updated_at BEFORE UPDATE ON public.regras_pnae
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 10. AUDITORIA
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_log_auditoria()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_nome TEXT;
    v_role public.user_role_type;
    v_id UUID;
BEGIN
    SELECT nome, role INTO v_nome, v_role
      FROM public.perfis_usuarios
     WHERE id = v_uid;

    v_id := COALESCE(NEW.id, OLD.id);

    INSERT INTO public.auditoria_logs (
        usuario_id, usuario_nome, usuario_role, acao, modulo, registro_id,
        detalhes, dados_anteriores, dados_novos, ip_origem
    )
    VALUES (
        v_uid,
        COALESCE(v_nome, CURRENT_USER),
        v_role,
        TG_OP,
        TG_TABLE_NAME,
        v_id,
        format('Operação %s executada na tabela %s.', TG_OP, TG_TABLE_NAME),
        CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        NULLIF(current_setting('request.headers', TRUE), '')::JSONB ->> 'x-forwarded-for'
    );

    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        -- Auditoria nunca deve impedir uma operação de negócio.
        RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_chamadas ON public.chamadas_publicas;
CREATE TRIGGER trg_audit_chamadas
AFTER INSERT OR UPDATE OR DELETE ON public.chamadas_publicas
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_auditoria();

DROP TRIGGER IF EXISTS trg_audit_contratos ON public.contratos_fornecedores;
CREATE TRIGGER trg_audit_contratos
AFTER INSERT OR UPDATE OR DELETE ON public.contratos_fornecedores
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_auditoria();

DROP TRIGGER IF EXISTS trg_audit_af ON public.autorizacoes_fornecimento;
CREATE TRIGGER trg_audit_af
AFTER INSERT OR UPDATE OR DELETE ON public.autorizacoes_fornecimento
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_auditoria();

DROP TRIGGER IF EXISTS trg_audit_entregas ON public.entregas_mercadorias;
CREATE TRIGGER trg_audit_entregas
AFTER INSERT OR UPDATE OR DELETE ON public.entregas_mercadorias
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_auditoria();

DROP TRIGGER IF EXISTS trg_audit_prestacoes ON public.prestacoes_contas;
CREATE TRIGGER trg_audit_prestacoes
AFTER INSERT OR UPDATE OR DELETE ON public.prestacoes_contas
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_auditoria();

-- ADICIONADO (V3): cobertura de auditoria para tabelas sensíveis que
-- ficaram de fora da V2, apesar do objetivo declarado de auditoria completa.
DROP TRIGGER IF EXISTS trg_audit_perfis ON public.perfis_usuarios;
CREATE TRIGGER trg_audit_perfis
AFTER INSERT OR UPDATE OR DELETE ON public.perfis_usuarios
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_auditoria();

DROP TRIGGER IF EXISTS trg_audit_propostas ON public.propostas_fornecedores;
CREATE TRIGGER trg_audit_propostas
AFTER INSERT OR UPDATE OR DELETE ON public.propostas_fornecedores
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_auditoria();

DROP TRIGGER IF EXISTS trg_audit_af_itens ON public.af_itens;
CREATE TRIGGER trg_audit_af_itens
AFTER INSERT OR UPDATE OR DELETE ON public.af_itens
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_auditoria();

DROP TRIGGER IF EXISTS trg_audit_entrega_itens ON public.entrega_itens;
CREATE TRIGGER trg_audit_entrega_itens
AFTER INSERT OR UPDATE OR DELETE ON public.entrega_itens
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_auditoria();

-- ============================================================================
-- 11. RLS
-- ============================================================================

ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardapios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardapio_refeicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardapio_refeicao_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamadas_publicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamada_publica_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propostas_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposta_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autorizacoes_fornecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.af_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_mercadorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrega_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_escola ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestacoes_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pareceres_cae ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_pnae ENABLE ROW LEVEL SECURITY;

-- Remove policies com os mesmos nomes para tornar a seção repetível.
-- CORRIGIDO (V3): a versão anterior varria TODAS as policies do schema
-- public, o que apagaria policies de tabelas alheias a esta migration caso
-- o schema seja compartilhado. Agora o escopo é restrito às tabelas
-- efetivamente criadas/geridas por este arquivo.
DO $$
DECLARE
    r RECORD;
    v_tabelas CONSTANT TEXT[] := ARRAY[
        'municipios', 'perfis_usuarios', 'escolas', 'alimentos',
        'cardapios', 'cardapio_refeicoes', 'cardapio_refeicao_itens',
        'chamadas_publicas', 'chamada_publica_itens',
        'propostas_fornecedores', 'proposta_itens',
        'contratos_fornecedores', 'autorizacoes_fornecimento', 'af_itens',
        'entregas_mercadorias', 'entrega_itens', 'estoque_escola',
        'prestacoes_contas', 'pareceres_cae', 'auditoria_logs', 'regras_pnae'
    ];
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
          FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename = ANY(v_tabelas)
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                       r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- MUNICÍPIOS
-- CORRIGIDO (V3): removida a cláusula "OR role = 'CAE'" sem escopo, que
-- dava a qualquer CAE visibilidade de TODOS os municípios. A comparação
-- "id = get_current_user_municipio_id()" já cobre o CAE dentro do seu
-- próprio município (desde que o perfil do CAE tenha municipio_id
-- preenchido, como os demais papéis municipais).
CREATE POLICY municipios_select
ON public.municipios FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR id = public.get_current_user_municipio_id()
);

CREATE POLICY municipios_admin_write
ON public.municipios FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- PERFIS
CREATE POLICY perfis_select
ON public.perfis_usuarios FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR id = (SELECT auth.uid())
    OR municipio_id = public.get_current_user_municipio_id()
);

CREATE POLICY perfis_self_update
ON public.perfis_usuarios FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()) OR public.is_admin())
WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY perfis_admin_insert
ON public.perfis_usuarios FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR id = (SELECT auth.uid()));

CREATE POLICY perfis_admin_delete
ON public.perfis_usuarios FOR DELETE TO authenticated
USING (public.is_admin());

-- ESCOLAS
-- CORRIGIDO (V3): CAE escopado ao próprio município (ver nota em municipios_select).
CREATE POLICY escolas_select
ON public.escolas FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR municipio_id = public.get_current_user_municipio_id()
);

CREATE POLICY escolas_write
ON public.escolas FOR ALL TO authenticated
USING (
    public.is_admin()
    OR public.get_current_user_role() IN ('NUTRICIONISTA','ESCOLA')
       AND municipio_id = public.get_current_user_municipio_id()
)
WITH CHECK (
    public.is_admin()
    OR public.get_current_user_role() IN ('NUTRICIONISTA','ESCOLA')
       AND municipio_id = public.get_current_user_municipio_id()
);

-- ALIMENTOS
CREATE POLICY alimentos_select
ON public.alimentos FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY alimentos_admin_nutri_write
ON public.alimentos FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA'))
WITH CHECK (public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA'));

-- CARDÁPIOS
-- CORRIGIDO (V3): CAE escopado ao próprio município.
CREATE POLICY cardapios_select
ON public.cardapios FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR municipio_id = public.get_current_user_municipio_id()
);

CREATE POLICY cardapios_write
ON public.cardapios FOR ALL TO authenticated
USING (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND municipio_id = public.get_current_user_municipio_id()
)
WITH CHECK (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND municipio_id = public.get_current_user_municipio_id()
);

-- FILHOS DE CARDÁPIO
CREATE POLICY cardapio_refeicoes_select
ON public.cardapio_refeicoes FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.cardapios c
        WHERE c.id = cardapio_id
          AND (
              public.is_admin()
              OR c.municipio_id = public.get_current_user_municipio_id()
          )
    )
);

CREATE POLICY cardapio_refeicoes_write
ON public.cardapio_refeicoes FOR ALL TO authenticated
USING (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND EXISTS (
        SELECT 1 FROM public.cardapios c
        WHERE c.id = cardapio_id
          AND c.municipio_id = public.get_current_user_municipio_id()
    )
)
WITH CHECK (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND EXISTS (
        SELECT 1 FROM public.cardapios c
        WHERE c.id = cardapio_id
          AND c.municipio_id = public.get_current_user_municipio_id()
    )
);

CREATE POLICY cardapio_refeicao_itens_select
ON public.cardapio_refeicao_itens FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
          FROM public.cardapio_refeicoes cr
          JOIN public.cardapios c ON c.id = cr.cardapio_id
         WHERE cr.id = refeicao_id
           AND (public.is_admin() OR c.municipio_id = public.get_current_user_municipio_id())
    )
);

CREATE POLICY cardapio_refeicao_itens_write
ON public.cardapio_refeicao_itens FOR ALL TO authenticated
USING (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND EXISTS (
        SELECT 1
          FROM public.cardapio_refeicoes cr
          JOIN public.cardapios c ON c.id = cr.cardapio_id
         WHERE cr.id = refeicao_id
           AND c.municipio_id = public.get_current_user_municipio_id()
    )
)
WITH CHECK (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND EXISTS (
        SELECT 1
          FROM public.cardapio_refeicoes cr
          JOIN public.cardapios c ON c.id = cr.cardapio_id
         WHERE cr.id = refeicao_id
           AND c.municipio_id = public.get_current_user_municipio_id()
    )
);

-- CHAMADAS
-- CORRIGIDO (V3): CAE escopado ao próprio município (a comparação de
-- municipio_id abaixo já cobre esse caso). FORNECEDOR continua irrestrito
-- de propósito, já que chamadas públicas são, por definição legal, públicas
-- a qualquer fornecedor interessado, de qualquer município.
CREATE POLICY chamadas_select
ON public.chamadas_publicas FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR public.get_current_user_role() = 'FORNECEDOR'
    OR municipio_id = public.get_current_user_municipio_id()
);

CREATE POLICY chamadas_write
ON public.chamadas_publicas FOR ALL TO authenticated
USING (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND municipio_id = public.get_current_user_municipio_id()
)
WITH CHECK (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND municipio_id = public.get_current_user_municipio_id()
);

-- CORRIGIDO (V3): CAE removido da lista irrestrita; escopado via
-- c.municipio_id abaixo, igual aos demais papéis municipais.
CREATE POLICY chamada_itens_access
ON public.chamada_publica_itens FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chamadas_publicas c
        WHERE c.id = chamada_publica_id
          AND (
              public.is_admin()
              OR public.get_current_user_role() = 'FORNECEDOR'
              OR c.municipio_id = public.get_current_user_municipio_id()
          )
    )
);

CREATE POLICY chamada_itens_write
ON public.chamada_publica_itens FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chamadas_publicas c
        WHERE c.id = chamada_publica_id
          AND public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
          AND c.municipio_id = public.get_current_user_municipio_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chamadas_publicas c
        WHERE c.id = chamada_publica_id
          AND public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
          AND c.municipio_id = public.get_current_user_municipio_id()
    )
);

-- PROPOSTAS
CREATE POLICY propostas_select
ON public.propostas_fornecedores FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR public.get_current_user_role() IN ('NUTRICIONISTA','CAE')
    OR fornecedor_id = (SELECT auth.uid())
);

CREATE POLICY propostas_insert
ON public.propostas_fornecedores FOR INSERT TO authenticated
WITH CHECK (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    OR (public.get_current_user_role() = 'FORNECEDOR' AND fornecedor_id = (SELECT auth.uid()))
);

CREATE POLICY propostas_update
ON public.propostas_fornecedores FOR UPDATE TO authenticated
USING (
    public.is_admin()
    OR public.get_current_user_role() IN ('NUTRICIONISTA')
    OR fornecedor_id = (SELECT auth.uid())
)
WITH CHECK (
    public.is_admin()
    OR public.get_current_user_role() IN ('NUTRICIONISTA')
    OR fornecedor_id = (SELECT auth.uid())
);

CREATE POLICY propostas_delete
ON public.propostas_fornecedores FOR DELETE TO authenticated
USING (public.is_admin() OR fornecedor_id = (SELECT auth.uid()));

-- CORRIGIDO (V3): o WITH CHECK original tinha precedência de AND/OR
-- incorreta — "role IN ('NUTRICIONISTA','FORNECEDOR') AND fornecedor_id =
-- auth.uid()" exigia fornecedor_id = auth.uid() também para NUTRICIONISTA,
-- o que nunca é verdade para esse papel. Na prática, nutricionistas
-- conseguiam apenas LER itens de proposta (via USING), mas não
-- inserir/atualizar. Corrigido para que NUTRICIONISTA não dependa de
-- fornecedor_id, e apenas FORNECEDOR precise ser o dono da proposta.
CREATE POLICY proposta_itens_access
ON public.proposta_itens FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.propostas_fornecedores p
        WHERE p.id = proposta_id
          AND (
              public.is_admin()
              OR public.get_current_user_role() IN ('NUTRICIONISTA','CAE')
              OR p.fornecedor_id = (SELECT auth.uid())
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.propostas_fornecedores p
        WHERE p.id = proposta_id
          AND (
              public.is_admin()
              OR public.get_current_user_role() = 'NUTRICIONISTA'
              OR (
                  public.get_current_user_role() = 'FORNECEDOR'
                  AND p.fornecedor_id = (SELECT auth.uid())
              )
          )
    )
);

-- CONTRATOS
CREATE POLICY contratos_select
ON public.contratos_fornecedores FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR public.get_current_user_role() = 'CAE'
    OR fornecedor_id = (SELECT auth.uid())
    OR municipio_id = public.get_current_user_municipio_id()
);

CREATE POLICY contratos_write
ON public.contratos_fornecedores FOR ALL TO authenticated
USING (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND municipio_id = public.get_current_user_municipio_id()
)
WITH CHECK (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND municipio_id = public.get_current_user_municipio_id()
);

-- AF
-- CORRIGIDO (V3): CAE escopado — o EXISTS abaixo (via escola.municipio_id)
-- já concede acesso ao CAE dentro do próprio município.
CREATE POLICY af_select
ON public.autorizacoes_fornecimento FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR fornecedor_id = (SELECT auth.uid())
    OR escola_id = public.get_current_user_escola_id()
    OR EXISTS (
        SELECT 1 FROM public.escolas e
        WHERE e.id = escola_id AND e.municipio_id = public.get_current_user_municipio_id()
    )
);

CREATE POLICY af_write
ON public.autorizacoes_fornecimento FOR ALL TO authenticated
USING (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND EXISTS (
        SELECT 1 FROM public.escolas e
        WHERE e.id = escola_id AND e.municipio_id = public.get_current_user_municipio_id()
    )
)
WITH CHECK (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND EXISTS (
        SELECT 1 FROM public.escolas e
        WHERE e.id = escola_id AND e.municipio_id = public.get_current_user_municipio_id()
    )
);

CREATE POLICY af_itens_select
ON public.af_itens FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
          FROM public.autorizacoes_fornecimento af
         WHERE af.id = af_id
           AND (
               public.is_admin()
               OR public.get_current_user_role() IN ('NUTRICIONISTA','CAE')
               OR af.fornecedor_id = (SELECT auth.uid())
               OR af.escola_id = public.get_current_user_escola_id()
           )
    )
);

CREATE POLICY af_itens_write
ON public.af_itens FOR ALL TO authenticated
USING (
    public.is_admin()
    OR (
        public.get_current_user_role() = 'NUTRICIONISTA'
        AND EXISTS (
            SELECT 1 FROM public.autorizacoes_fornecimento af
            WHERE af.id = af_id
              AND EXISTS (
                  SELECT 1 FROM public.escolas e
                  WHERE e.id = af.escola_id
                    AND e.municipio_id = public.get_current_user_municipio_id()
              )
        )
    )
)
WITH CHECK (
    public.is_admin()
    OR (
        public.get_current_user_role() = 'NUTRICIONISTA'
        AND EXISTS (
            SELECT 1 FROM public.autorizacoes_fornecimento af
            WHERE af.id = af_id
              AND EXISTS (
                  SELECT 1 FROM public.escolas e
                  WHERE e.id = af.escola_id
                    AND e.municipio_id = public.get_current_user_municipio_id()
              )
        )
    )
);

-- ENTREGAS
-- CORRIGIDO (V3): CAE escopado via EXISTS (escola.municipio_id) abaixo.
CREATE POLICY entregas_select
ON public.entregas_mercadorias FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR fornecedor_id = (SELECT auth.uid())
    OR escola_id = public.get_current_user_escola_id()
    OR EXISTS (
        SELECT 1 FROM public.escolas e
        WHERE e.id = escola_id AND e.municipio_id = public.get_current_user_municipio_id()
    )
);

CREATE POLICY entregas_insert
ON public.entregas_mercadorias FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin()
    OR (
        public.get_current_user_role() = 'ESCOLA'
        AND escola_id = public.get_current_user_escola_id()
    )
    OR (
        public.get_current_user_role() = 'NUTRICIONISTA'
        AND EXISTS (
            SELECT 1 FROM public.escolas e
            WHERE e.id = escola_id AND e.municipio_id = public.get_current_user_municipio_id()
        )
    )
);

-- CORRIGIDO (V3): antes, QUALQUER nutricionista (de qualquer município)
-- podia atualizar entregas de outros municípios, pois a condição
-- "role = 'NUTRICIONISTA'" não tinha filtro de município — diferente da
-- policy de INSERT, que já exigia o mesmo município. Alinhado aqui.
CREATE POLICY entregas_update
ON public.entregas_mercadorias FOR UPDATE TO authenticated
USING (
    public.is_admin()
    OR (
        public.get_current_user_role() = 'ESCOLA'
        AND escola_id = public.get_current_user_escola_id()
    )
    OR (
        public.get_current_user_role() = 'NUTRICIONISTA'
        AND EXISTS (
            SELECT 1 FROM public.escolas e
            WHERE e.id = escola_id AND e.municipio_id = public.get_current_user_municipio_id()
        )
    )
)
WITH CHECK (
    public.is_admin()
    OR (
        public.get_current_user_role() = 'ESCOLA'
        AND escola_id = public.get_current_user_escola_id()
    )
    OR (
        public.get_current_user_role() = 'NUTRICIONISTA'
        AND EXISTS (
            SELECT 1 FROM public.escolas e
            WHERE e.id = escola_id AND e.municipio_id = public.get_current_user_municipio_id()
        )
    )
);

CREATE POLICY entregas_delete
ON public.entregas_mercadorias FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY entrega_itens_access
ON public.entrega_itens FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.entregas_mercadorias e
        WHERE e.id = entrega_id
          AND (
              public.is_admin()
              OR e.escola_id = public.get_current_user_escola_id()
              OR e.fornecedor_id = (SELECT auth.uid())
              OR public.get_current_user_role() IN ('NUTRICIONISTA','CAE')
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.entregas_mercadorias e
        WHERE e.id = entrega_id
          AND (
              public.is_admin()
              OR e.escola_id = public.get_current_user_escola_id()
              OR public.get_current_user_role() = 'NUTRICIONISTA'
          )
    )
);

-- ESTOQUE
-- CORRIGIDO (V3): CAE escopado via EXISTS (escola.municipio_id) abaixo.
CREATE POLICY estoque_select
ON public.estoque_escola FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR escola_id = public.get_current_user_escola_id()
    OR EXISTS (
        SELECT 1 FROM public.escolas e
        WHERE e.id = escola_id AND e.municipio_id = public.get_current_user_municipio_id()
    )
);

CREATE POLICY estoque_write
ON public.estoque_escola FOR ALL TO authenticated
USING (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.escolas e
            WHERE e.id = escola_id AND e.municipio_id = public.get_current_user_municipio_id()
        )
    )
)
WITH CHECK (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.escolas e
            WHERE e.id = escola_id AND e.municipio_id = public.get_current_user_municipio_id()
        )
    )
);

-- PRESTAÇÃO DE CONTAS
-- CORRIGIDO (V3): CAE escopado via municipio_id abaixo.
CREATE POLICY prestacoes_select
ON public.prestacoes_contas FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR municipio_id = public.get_current_user_municipio_id()
);

CREATE POLICY prestacoes_write
ON public.prestacoes_contas FOR ALL TO authenticated
USING (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND municipio_id = public.get_current_user_municipio_id()
)
WITH CHECK (
    public.get_current_user_role() IN ('ADMIN','NUTRICIONISTA')
    AND municipio_id = public.get_current_user_municipio_id()
);

-- PARECER CAE
-- CORRIGIDO (V3): CAE escopado via EXISTS (prestacoes_contas.municipio_id)
-- abaixo — cobre o CAE dentro do seu próprio município.
CREATE POLICY pareceres_select
ON public.pareceres_cae FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.prestacoes_contas pc
        WHERE pc.id = prestacao_contas_id
          AND pc.municipio_id = public.get_current_user_municipio_id()
    )
);

CREATE POLICY pareceres_write
ON public.pareceres_cae FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('ADMIN','CAE'))
WITH CHECK (public.get_current_user_role() IN ('ADMIN','CAE'));

-- AUDITORIA
CREATE POLICY auditoria_select
ON public.auditoria_logs FOR SELECT TO authenticated
USING (public.get_current_user_role() IN ('ADMIN','CAE'));

-- REGRAS PNAE
CREATE POLICY regras_select
ON public.regras_pnae FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY regras_admin_write
ON public.regras_pnae FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- 12. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_escolas_municipio ON public.escolas(municipio_id);
CREATE INDEX IF NOT EXISTS idx_perfis_municipio ON public.perfis_usuarios(municipio_id);
CREATE INDEX IF NOT EXISTS idx_perfis_escola ON public.perfis_usuarios(escola_id);
CREATE INDEX IF NOT EXISTS idx_perfis_role ON public.perfis_usuarios(role);
CREATE INDEX IF NOT EXISTS idx_perfis_caf ON public.perfis_usuarios(caf);

CREATE INDEX IF NOT EXISTS idx_cardapios_municipio ON public.cardapios(municipio_id);
CREATE INDEX IF NOT EXISTS idx_cardapios_nutricionista ON public.cardapios(nutricionista_id);
CREATE INDEX IF NOT EXISTS idx_cardapio_refeicoes_cardapio ON public.cardapio_refeicoes(cardapio_id);
CREATE INDEX IF NOT EXISTS idx_cardapio_itens_refeicao ON public.cardapio_refeicao_itens(refeicao_id);
CREATE INDEX IF NOT EXISTS idx_cardapio_itens_alimento ON public.cardapio_refeicao_itens(alimento_id);

CREATE INDEX IF NOT EXISTS idx_chamadas_municipio_ano ON public.chamadas_publicas(municipio_id, ano_exercicio);
CREATE INDEX IF NOT EXISTS idx_chamada_itens_chamada ON public.chamada_publica_itens(chamada_publica_id);
CREATE INDEX IF NOT EXISTS idx_chamada_itens_alimento ON public.chamada_publica_itens(alimento_id);

CREATE INDEX IF NOT EXISTS idx_propostas_chamada ON public.propostas_fornecedores(chamada_publica_id);
CREATE INDEX IF NOT EXISTS idx_propostas_fornecedor ON public.propostas_fornecedores(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_proposta_itens_proposta ON public.proposta_itens(proposta_id);
CREATE INDEX IF NOT EXISTS idx_proposta_itens_chamada ON public.proposta_itens(item_chamada_id);

CREATE INDEX IF NOT EXISTS idx_contratos_municipio ON public.contratos_fornecedores(municipio_id);
CREATE INDEX IF NOT EXISTS idx_contratos_fornecedor ON public.contratos_fornecedores(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contratos_chamada ON public.contratos_fornecedores(chamada_publica_id);
CREATE INDEX IF NOT EXISTS idx_contratos_ano_inicio ON public.contratos_fornecedores(data_inicio);

CREATE INDEX IF NOT EXISTS idx_af_contrato ON public.autorizacoes_fornecimento(contrato_id);
CREATE INDEX IF NOT EXISTS idx_af_escola ON public.autorizacoes_fornecimento(escola_id);
CREATE INDEX IF NOT EXISTS idx_af_fornecedor ON public.autorizacoes_fornecimento(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_af_itens_af ON public.af_itens(af_id);
CREATE INDEX IF NOT EXISTS idx_af_itens_proposta ON public.af_itens(proposta_item_id);
CREATE INDEX IF NOT EXISTS idx_af_itens_alimento ON public.af_itens(alimento_id);

CREATE INDEX IF NOT EXISTS idx_entregas_af ON public.entregas_mercadorias(af_id);
CREATE INDEX IF NOT EXISTS idx_entregas_escola_data ON public.entregas_mercadorias(escola_id, data_entrega);
CREATE INDEX IF NOT EXISTS idx_entregas_fornecedor ON public.entregas_mercadorias(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_entrega_itens_entrega ON public.entrega_itens(entrega_id);
CREATE INDEX IF NOT EXISTS idx_entrega_itens_af_item ON public.entrega_itens(af_item_id);

CREATE INDEX IF NOT EXISTS idx_estoque_escola ON public.estoque_escola(escola_id);
CREATE INDEX IF NOT EXISTS idx_estoque_alimento ON public.estoque_escola(alimento_id);

CREATE INDEX IF NOT EXISTS idx_prestacoes_municipio_ano ON public.prestacoes_contas(municipio_id, ano_exercicio);
CREATE INDEX IF NOT EXISTS idx_pareceres_prestacao ON public.pareceres_cae(prestacao_contas_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_data ON public.auditoria_logs(usuario_id, data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_modulo_data ON public.auditoria_logs(modulo, data_hora DESC);

-- ============================================================================
-- 13. DADOS INICIAIS
-- ============================================================================

INSERT INTO public.regras_pnae (ano_exercicio, limite_anual_por_caf, percentual_minimo_agricultura_familiar)
VALUES (2026, 40000.00, 30.00)
ON CONFLICT (ano_exercicio) DO UPDATE SET
    limite_anual_por_caf = EXCLUDED.limite_anual_por_caf,
    percentual_minimo_agricultura_familiar = EXCLUDED.percentual_minimo_agricultura_familiar,
    atualizado_em = NOW();

-- Alimentos de demonstração. Remova este bloco se a base for exclusivamente produtiva.
INSERT INTO public.alimentos
(id, nome, categoria, unidade_medida, preco_referencia_medio, eh_agricultura_familiar,
 eh_organico, calorias_kcal, proteinas_g, carboidratos_g, lipidios_g, fibras_g,
 calcio_mg, ferro_mg, vitamina_c_mg, sodio_mg)
VALUES
('b1b2c3d4-0000-0000-0000-000000000001', 'Arroz Integral Polido Tipo 1', 'Grãos, Cereais e Tubérculos', 'kg', 6.50, TRUE, TRUE, 360, 7.3, 77.4, 1.9, 4.8, 12, 1.8, 0, 1),
('b1b2c3d4-0000-0000-0000-000000000002', 'Feijão Carioca Novo', 'Grãos, Cereais e Tubérculos', 'kg', 8.20, TRUE, FALSE, 329, 20.0, 61.2, 1.3, 15.2, 160, 8.0, 0, 5),
('b1b2c3d4-0000-0000-0000-000000000003', 'Banana Prata Agroecológica', 'Hortifrúti e Frutas', 'kg', 5.80, TRUE, TRUE, 98, 1.3, 26.0, 0.1, 2.0, 8, 0.4, 21.6, 1),
('b1b2c3d4-0000-0000-0000-000000000004', 'Maçã Gala Regional', 'Hortifrúti e Frutas', 'kg', 7.40, TRUE, FALSE, 52, 0.3, 13.8, 0.2, 2.4, 6, 0.1, 4.6, 1),
('b1b2c3d4-0000-0000-0000-000000000005', 'Alface Crespa Hidropônica/Orgânica', 'Legumes e Verduras', 'maço', 3.50, TRUE, TRUE, 15, 1.4, 2.9, 0.2, 1.3, 36, 1.8, 18.0, 9),
('b1b2c3d4-0000-0000-0000-000000000006', 'Cenoura Fresca sem Rama', 'Legumes e Verduras', 'kg', 4.90, TRUE, FALSE, 34, 1.3, 7.7, 0.2, 3.2, 23, 0.2, 5.3, 40),
('b1b2c3d4-0000-0000-0000-000000000007', 'Peito de Frango em Cubos Congelado', 'Carnes, Ovos e Pescados', 'kg', 18.90, FALSE, FALSE, 119, 21.5, 0.0, 3.0, 0.0, 11, 0.4, 0, 48),
('b1b2c3d4-0000-0000-0000-000000000008', 'Ovos Caipiras da Agricultura Familiar', 'Carnes, Ovos e Pescados', 'dúzia', 12.00, TRUE, TRUE, 143, 13.0, 1.6, 8.9, 0.0, 42, 1.6, 0, 168),
('b1b2c3d4-0000-0000-0000-000000000009', 'Leite Pasteurizado Integral Tipo C', 'Leite e Derivados', 'litro', 4.60, TRUE, FALSE, 60, 3.1, 4.7, 0.0, 0.0, 120, 0.1, 1.0, 50),
('b1b2c3d4-0000-0000-0000-000000000010', 'Iogurte Natural Batido Morango/Mel', 'Leite e Derivados', 'litro', 8.50, TRUE, FALSE, 72, 3.8, 9.5, 2.1, 0.0, 130, 0.1, 2.0, 55)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 14. VERIFICAÇÕES FINAIS
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='municipios') THEN
        RAISE EXCEPTION 'RLS: policies de municipios não foram criadas.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='perfis_usuarios') THEN
        RAISE EXCEPTION 'RLS: policies de perfis_usuarios não foram criadas.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_escolas_municipio') THEN
        RAISE EXCEPTION 'Índice idx_escolas_municipio não foi criado.';
    END IF;
END $$;

-- ============================================================================
-- FIM DA MIGRATION V2
-- ============================================================================

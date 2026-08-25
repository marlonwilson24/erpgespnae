-- ============================================================================
-- BANCO DE DADOS ERP PNAE - LEI Nº 11.947/2009 & RESOLUÇÕES CD/FNDE
-- SISTEMA INTEGRADO DE GESTÃO DA ALIMENTAÇÃO ESCOLAR E AGRICULTURA FAMILIAR
-- ============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABELAS PRINCIPAIS
-- ============================================================================

-- Tabela de Municípios / Entidades Executoras (EEx)
CREATE TABLE IF NOT EXISTS public.municipios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    uf CHAR(2) NOT NULL,
    codigo_ibge VARCHAR(10) NOT NULL UNIQUE,
    total_alunos_pnae INTEGER NOT NULL DEFAULT 0,
    orcamento_anual_fnde NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    orcamento_contrapartida NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    ano_exercicio INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Perfis de Usuários (Integrada com Supabase Auth)
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
    crn VARCHAR(50), -- Nutricionista
    dap_caf VARCHAR(50), -- Fornecedor Agricultor Familiar
    cargo VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Unidades Escolares
CREATE TABLE IF NOT EXISTS public.escolas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    codigo_inep VARCHAR(12) NOT NULL UNIQUE,
    endereco TEXT NOT NULL,
    diretor_nome VARCHAR(255) NOT NULL,
    responsavel_merenda_nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    total_alunos INTEGER NOT NULL DEFAULT 0,
    tipo_atendimento VARCHAR(20) NOT NULL DEFAULT 'Parcial' CHECK (tipo_atendimento IN ('Parcial', 'Integral')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar Foreign Key retroativa em perfis_usuarios para escolas
ALTER TABLE public.perfis_usuarios 
    ADD CONSTRAINT fk_usuario_escola 
    FOREIGN KEY (escola_id) REFERENCES public.escolas(id) ON DELETE SET NULL;

-- Tabela de Catálogo de Alimentos (Base TACO / PNAE)
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
    carboidratos_g NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    proteinas_g NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    lipidios_g NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    fibras_g NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    calcio_mg NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    ferro_mg NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    vitamina_c_mg NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    sodio_mg NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Cardápios
CREATE TABLE IF NOT EXISTS public.cardapios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mes_referencia VARCHAR(7) NOT NULL, -- YYYY-MM
    semana_numero INTEGER NOT NULL CHECK (semana_numero BETWEEN 1 AND 5),
    etapa_ensino VARCHAR(100) NOT NULL,
    nutricionista_id UUID NOT NULL REFERENCES public.perfis_usuarios(id),
    dias_letivos_semana INTEGER NOT NULL DEFAULT 5,
    percentual_agri_familiar_estimado NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Aprovado Nutricionista', 'Homologado CAE', 'Em Execução')),
    observacoes_dietas_especiais TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Refeições Diárias do Cardápio
CREATE TABLE IF NOT EXISTS public.cardapio_refeicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cardapio_id UUID NOT NULL REFERENCES public.cardapios(id) ON DELETE CASCADE,
    dia_semana VARCHAR(20) NOT NULL,
    tipo_refeicao VARCHAR(50) NOT NULL,
    nome_prato VARCHAR(255) NOT NULL,
    descricao_preparo TEXT,
    total_kcal NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    total_carboidratos_g NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    total_proteinas_g NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    total_lipidios_g NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    total_fibras_g NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    total_calcio_mg NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    total_ferro_mg NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    total_vitamina_c_mg NUMERIC(8,2) NOT NULL DEFAULT 0.00
);

-- Tabela de Ingredientes / Alimentos por Refeição
CREATE TABLE IF NOT EXISTS public.cardapio_refeicao_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refeicao_id UUID NOT NULL REFERENCES public.cardapio_refeicoes(id) ON DELETE CASCADE,
    alimento_id UUID NOT NULL REFERENCES public.alimentos(id),
    per_capita_liquido_g NUMERIC(8,2) NOT NULL,
    per_capita_bruto_g NUMERIC(8,2) NOT NULL
);

-- Tabela de Chamadas Públicas da Agricultura Familiar (Art. 14 Lei 11.947/2009)
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
    valor_reservado_agri_familiar NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Publicada' CHECK (status IN ('Publicada', 'Em Análise de Propostas', 'Homologada', 'Contratos Emitidos', 'Encerrada')),
    arquivo_edital_url TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Itens da Chamada Pública
CREATE TABLE IF NOT EXISTS public.chamada_publica_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamada_publica_id UUID NOT NULL REFERENCES public.chamadas_publicas(id) ON DELETE CASCADE,
    alimento_id UUID NOT NULL REFERENCES public.alimentos(id),
    quantidade_total_solicitada NUMERIC(12,2) NOT NULL,
    preco_maximo_referencia NUMERIC(10,2) NOT NULL,
    valor_total_item NUMERIC(15,2) GENERATED ALWAYS AS (quantidade_total_solicitada * preco_maximo_referencia) STORED,
    exclusivo_agricultura_familiar BOOLEAN NOT NULL DEFAULT TRUE,
    exige_organico BOOLEAN NOT NULL DEFAULT FALSE,
    cronograma_entrega VARCHAR(50) NOT NULL DEFAULT 'Semanal'
);

-- Tabela de Propostas dos Agricultores Familiares (Projetos de Venda)
CREATE TABLE IF NOT EXISTS public.propostas_fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamada_publica_id UUID NOT NULL REFERENCES public.chamadas_publicas(id) ON DELETE CASCADE,
    fornecedor_id UUID NOT NULL REFERENCES public.perfis_usuarios(id),
    tipo_produtor VARCHAR(50) NOT NULL DEFAULT 'Individual',
    valor_total_proposta NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    acumulado_ano_dap_caf NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Em Análise' CHECK (status IN ('Em Análise', 'Habilitada', 'Vencedora', 'Desclassificada')),
    motivo_desclassificacao TEXT,
    data_submissao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Itens Ofertados na Proposta
CREATE TABLE IF NOT EXISTS public.proposta_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposta_id UUID NOT NULL REFERENCES public.propostas_fornecedores(id) ON DELETE CASCADE,
    item_chamada_id UUID NOT NULL REFERENCES public.chamada_publica_itens(id),
    quantidade_ofertada NUMERIC(12,2) NOT NULL,
    preco_unitario_ofertado NUMERIC(10,2) NOT NULL,
    valor_total NUMERIC(15,2) GENERATED ALWAYS AS (quantidade_ofertada * preco_unitario_ofertado) STORED
);

-- Tabela de Contratos com Fornecedores
CREATE TABLE IF NOT EXISTS public.contratos_fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    chamada_publica_id UUID NOT NULL REFERENCES public.chamadas_publicas(id),
    fornecedor_id UUID NOT NULL REFERENCES public.perfis_usuarios(id),
    numero_contrato VARCHAR(50) NOT NULL UNIQUE,
    valor_total_contrato NUMERIC(15,2) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Vigente' CHECK (status IN ('Vigente', 'Concluído', 'Cancelado')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Autorizações de Fornecimento (AF)
CREATE TABLE IF NOT EXISTS public.autorizacoes_fornecimento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_af VARCHAR(50) NOT NULL UNIQUE,
    contrato_id UUID NOT NULL REFERENCES public.contratos_fornecedores(id) ON DELETE CASCADE,
    escola_id UUID NOT NULL REFERENCES public.escolas(id),
    fornecedor_id UUID NOT NULL REFERENCES public.perfis_usuarios(id),
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_limite_entrega DATE NOT NULL,
    valor_total_af NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'Emitida' CHECK (status IN ('Emitida', 'Em Trânsito', 'Entregue Total', 'Entregue Parcial', 'Atrasada', 'Recusada')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Itens da AF
CREATE TABLE IF NOT EXISTS public.af_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    af_id UUID NOT NULL REFERENCES public.autorizacoes_fornecimento(id) ON DELETE CASCADE,
    alimento_id UUID NOT NULL REFERENCES public.alimentos(id),
    quantidade_autorizada NUMERIC(12,2) NOT NULL,
    quantidade_entregue NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    preco_unitario NUMERIC(10,2) NOT NULL,
    valor_total NUMERIC(15,2) GENERATED ALWAYS AS (quantidade_autorizada * preco_unitario) STORED
);

-- Tabela de Entregas Realizadas / Conferência na Escola (Termo de Recebimento)
CREATE TABLE IF NOT EXISTS public.entregas_mercadorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    af_id UUID NOT NULL REFERENCES public.autorizacoes_fornecimento(id),
    escola_id UUID NOT NULL REFERENCES public.escolas(id),
    fornecedor_id UUID NOT NULL REFERENCES public.perfis_usuarios(id),
    data_entrega DATE NOT NULL DEFAULT CURRENT_DATE,
    nota_fiscal_ou_recibo VARCHAR(100) NOT NULL,
    responsavel_recebimento_id UUID NOT NULL REFERENCES public.perfis_usuarios(id),
    status_conferencia VARCHAR(50) NOT NULL DEFAULT 'Conforme Total' CHECK (status_conferencia IN ('Conforme Total', 'Conforme com Ressalva', 'Rejeitado / Devolvido')),
    parecer_qualidade VARCHAR(30) NOT NULL DEFAULT 'Excelente' CHECK (parecer_qualidade IN ('Excelente', 'Bom', 'Regular', 'Inadequado')),
    observacoes TEXT,
    termo_recebimento_gerado BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Itens da Entrega
CREATE TABLE IF NOT EXISTS public.entrega_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entrega_id UUID NOT NULL REFERENCES public.entregas_mercadorias(id) ON DELETE CASCADE,
    alimento_id UUID NOT NULL REFERENCES public.alimentos(id),
    quantidade_esperada NUMERIC(12,2) NOT NULL,
    quantidade_recebida NUMERIC(12,2) NOT NULL,
    aprovado BOOLEAN NOT NULL DEFAULT TRUE,
    motivo_divergencia TEXT
);

-- Tabela de Estoque das Escolas
CREATE TABLE IF NOT EXISTS public.estoque_escola (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    alimento_id UUID NOT NULL REFERENCES public.alimentos(id),
    quantidade_atual NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    quantidade_minima_alerta NUMERIC(12,2) NOT NULL DEFAULT 10.00,
    data_validade_proxima DATE,
    lote VARCHAR(50),
    ultima_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_escola_alimento UNIQUE (escola_id, alimento_id)
);

-- Tabela de Prestação de Contas PNAE (Exercício Anual / Quadrimestral)
CREATE TABLE IF NOT EXISTS public.prestacoes_contas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    ano_exercicio INTEGER NOT NULL,
    recurso_total_fnde_recebido NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    contrapartida_municipal_gasta NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    gasto_total_alimentacao NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    gasto_agricultura_familiar NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    percentual_agricultura_familiar NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN recurso_total_fnde_recebido > 0 
        THEN (gasto_agricultura_familiar / recurso_total_fnde_recebido) * 100 
        ELSE 0 END
    ) STORED,
    cumpre_meta_legal_30_porcento BOOLEAN GENERATED ALWAYS AS (
        (gasto_agricultura_familiar / NULLIF(recurso_total_fnde_recebido, 0)) >= 0.30
    ) STORED,
    saldo_remanescente NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    numero_alunos_atendidos INTEGER NOT NULL DEFAULT 0,
    status_aprovacao VARCHAR(50) NOT NULL DEFAULT 'Pendente Análise' CHECK (status_aprovacao IN ('Pendente Análise', 'Em Análise CAE', 'Aprovado pelo CAE', 'Aprovado com Ressalvas', 'Rejeitado')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_municipio_ano UNIQUE (municipio_id, ano_exercicio)
);

-- Tabela de Pareceres Conclusivos do CAE (Conselho de Alimentação Escolar)
CREATE TABLE IF NOT EXISTS public.pareceres_cae (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prestacao_contas_id UUID NOT NULL REFERENCES public.prestacoes_contas(id) ON DELETE CASCADE,
    ano_exercicio INTEGER NOT NULL,
    data_reuniao_ata DATE NOT NULL,
    numero_ata VARCHAR(50) NOT NULL,
    presidente_cae_nome VARCHAR(255) NOT NULL,
    relator_cae_nome VARCHAR(255) NOT NULL,
    resultado_parecer VARCHAR(50) NOT NULL CHECK (resultado_parecer IN ('Favorável sem Ressalvas', 'Favorável com Ressalvas', 'Desfavorável (Irregularidades)')),
    texto_parecer_conclusivo TEXT NOT NULL,
    recomendacoes_ao_gestor TEXT,
    membros_presentes TEXT[] NOT NULL DEFAULT '{}',
    assinado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.auditoria_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_id UUID REFERENCES auth.users(id),
    usuario_nome VARCHAR(255) NOT NULL,
    usuario_role user_role_type NOT NULL,
    acao VARCHAR(100) NOT NULL,
    modulo VARCHAR(100) NOT NULL,
    detalhes TEXT NOT NULL,
    ip_origem VARCHAR(45)
);

-- ============================================================================
-- 2. TRIGGERS E FUNÇÕES DE NEGÓCIO PNAE
-- ============================================================================

-- Função 1: Validação do Limite Anual de R$ 40.000,00 por DAP/CAF (Resolução FNDE)
CREATE OR REPLACE FUNCTION public.validar_limite_dap_fornecedor()
RETURNS TRIGGER AS $$
DECLARE
    v_total_ano NUMERIC(15,2);
    v_ano INTEGER;
BEGIN
    v_ano := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Calcula o somatório dos contratos firmados no ano vigente para este fornecedor
    SELECT COALESCE(SUM(valor_total_contrato), 0)
    INTO v_total_ano
    FROM public.contratos_fornecedores
    WHERE fornecedor_id = NEW.fornecedor_id
      AND EXTRACT(YEAR FROM data_inicio) = v_ano
      AND status != 'Cancelado';

    IF (v_total_ano + NEW.valor_total_contrato) > 40000.00 THEN
        RAISE EXCEPTION 'Limite legal do PNAE excedido! O Agricultor Familiar (DAP/CAF) não pode ultrapassar R$ 40.000,00/ano civil por Declaração. Acumulado atual: R$ %, Nova proposta: R$ %', 
            v_total_ano, NEW.valor_total_contrato;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_valida_limite_dap
BEFORE INSERT OR UPDATE ON public.contratos_fornecedores
FOR EACH ROW
EXECUTE FUNCTION public.validar_limite_dap_fornecedor();


-- Função 2: Atualizar Estoque da Escola Automaticamente após Registro da Entrega
CREATE OR REPLACE FUNCTION public.atualizar_estoque_apos_entrega()
RETURNS TRIGGER AS $$
DECLARE
    r_item RECORD;
    v_escola_id UUID;
BEGIN
    SELECT escola_id INTO v_escola_id 
    FROM public.entregas_mercadorias 
    WHERE id = NEW.entrega_id;

    -- Se o item foi aprovado, soma ao estoque da escola
    IF NEW.aprovado = TRUE AND NEW.quantidade_recebida > 0 THEN
        INSERT INTO public.estoque_escola (escola_id, alimento_id, quantidade_atual, ultima_atualizacao)
        VALUES (v_escola_id, NEW.alimento_id, NEW.quantidade_recebida, NOW())
        ON CONFLICT (escola_id, alimento_id)
        DO UPDATE SET 
            quantidade_atual = public.estoque_escola.quantidade_atual + EXCLUDED.quantidade_atual,
            ultima_atualizacao = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualiza_estoque_entrega
AFTER INSERT ON public.entrega_itens
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_estoque_apos_entrega();


-- Função 3: Auditoria Automática de Eventos Críticos
CREATE OR REPLACE FUNCTION public.trigger_log_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.auditoria_logs (usuario_nome, usuario_role, acao, modulo, detalhes)
    VALUES (
        CURRENT_USER,
        'ADMIN',
        TG_OP,
        TG_TABLE_NAME,
        'Operação ' || TG_OP || ' executada na tabela ' || TG_TABLE_NAME || ' com ID ' || COALESCE(NEW.id::text, OLD.id::text)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_chamadas
AFTER INSERT OR UPDATE OR DELETE ON public.chamadas_publicas
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_auditoria();

CREATE TRIGGER trg_audit_entregas
AFTER INSERT OR UPDATE OR DELETE ON public.entregas_mercadorias
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_auditoria();

-- ============================================================================
-- 3. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardapios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamadas_publicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propostas_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autorizacoes_fornecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_mercadorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_escola ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestacoes_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pareceres_cae ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_logs ENABLE ROW LEVEL SECURITY;

-- Regra Geral de Visualização para CAE e ADMIN (Auditoria Completa)
CREATE POLICY "Admin tem acesso total" ON public.municipios FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.perfis_usuarios WHERE id = auth.uid() AND role = 'ADMIN')
);

CREATE POLICY "CAE pode visualizar todos os dados" ON public.prestacoes_contas FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.perfis_usuarios WHERE id = auth.uid() AND role IN ('CAE', 'ADMIN'))
);

CREATE POLICY "Nutricionista gerencia cardápios e alimentos" ON public.cardapios FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.perfis_usuarios WHERE id = auth.uid() AND role IN ('NUTRICIONISTA', 'ADMIN'))
);

CREATE POLICY "Escola visualiza e recebe mercadorias de sua unidade" ON public.entregas_mercadorias FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.perfis_usuarios WHERE id = auth.uid() AND (role = 'ADMIN' OR (role = 'ESCOLA' AND escola_id = public.entregas_mercadorias.escola_id)))
);

CREATE POLICY "Fornecedor visualiza e envia propostas" ON public.propostas_fornecedores FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.perfis_usuarios WHERE id = auth.uid() AND (role = 'ADMIN' OR (role = 'FORNECEDOR' AND fornecedor_id = auth.uid())))
);

-- ============================================================================
-- 4. DADOS INICIAIS (SEEDS DE EXEMPLO)
-- ============================================================================

INSERT INTO public.municipios (id, nome, uf, codigo_ibge, total_alunos_pnae, orcamento_anual_fnde, orcamento_contrapartida, ano_exercicio)
VALUES ('a1b2c3d4-0000-0000-0000-000000000001', 'Santa Clara do Sul', 'RS', '4316808', 4250, 680000.00, 240000.00, 2026)
ON CONFLICT DO NOTHING;

INSERT INTO public.alimentos (id, nome, categoria, unidade_medida, preco_referencia_medio, eh_agricultura_familiar, eh_organico, calorias_kcal, proteinas_g, carboidratos_g, lipidios_g, fibras_g, calcio_mg, ferro_mg, vitamina_c_mg, sodio_mg) VALUES
('b1b2c3d4-0000-0000-0000-000000000001', 'Arroz Integral Polido Tipo 1', 'Grãos, Cereais e Tubérculos', 'kg', 6.50, TRUE, TRUE, 360, 7.3, 77.4, 1.9, 4.8, 12, 1.8, 0, 1),
('b1b2c3d4-0000-0000-0000-000000000002', 'Feijão Carioca Novo', 'Grãos, Cereais e Tubérculos', 'kg', 8.20, TRUE, FALSE, 329, 20.0, 61.2, 1.3, 15.2, 160, 8.0, 0, 5),
('b1b2c3d4-0000-0000-0000-000000000003', 'Banana Prata Agroecológica', 'Hortifrúti e Frutas', 'kg', 5.80, TRUE, TRUE, 98, 1.3, 26.0, 0.1, 2.0, 8, 0.4, 21.6, 1),
('b1b2c3d4-0000-0000-0000-000000000004', 'Maçã Gala Regional', 'Hortifrúti e Frutas', 'kg', 7.40, TRUE, FALSE, 52, 0.3, 13.8, 0.2, 2.4, 6, 0.1, 4.6, 1),
('b1b2c3d4-0000-0000-0000-000000000005', 'Alface Crespa Hidropônica/Orgânica', 'Legumes e Verduras', 'maço', 3.50, TRUE, TRUE, 15, 1.4, 2.9, 0.2, 1.3, 36, 1.8, 18.0, 9),
('b1b2c3d4-0000-0000-0000-000000000006', 'Cenoura Fresca sem Rama', 'Legumes e Verduras', 'kg', 4.90, TRUE, FALSE, 34, 1.3, 7.7, 0.2, 3.2, 23, 0.2, 5.3, 40),
('b1b2c3d4-0000-0000-0000-000000000007', 'Peito de Frango em Cubos Congelado', 'Carnes, Ovos e Pescados', 'kg', 18.90, FALSE, FALSE, 119, 21.5, 0.0, 3.0, 0.0, 11, 0.4, 0, 48),
('b1b2c3d4-0000-0000-0000-000000000008', 'Ovos Caipiras da Agricultura Familiar', 'Carnes, Ovos e Pescados', 'dúzia', 12.00, TRUE, TRUE, 143, 13.0, 1.6, 8.9, 0.0, 42, 1.6, 0, 168),
('b1b2c3d4-0000-0000-0000-000000000009', 'Leite Pasteurizado Integral Tipo C', 'Leite e Derivados', 'litro', 4.60, TRUE, FALSE, 60, 3.1, 4.7, 3.2, 0.0, 120, 0.1, 1.0, 50),
('b1b2c3d4-0000-0000-0000-000000000010', 'Iogurte Natural Batido Morango/Mel', 'Leite e Derivados', 'litro', 8.50, TRUE, FALSE, 72, 3.8, 9.5, 2.1, 0.0, 130, 0.1, 2.0, 55)
ON CONFLICT DO NOTHING;

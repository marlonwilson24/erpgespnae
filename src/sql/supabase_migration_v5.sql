-- ============================================================================
-- ERP PNAE - SUPABASE / POSTGRESQL
-- MIGRATION V5 - CORREÇÕES DE PERSISTÊNCIA
-- ============================================================================
-- ATENÇÃO: Aplique PRIMEIRO a supabase_migration_v4.sql (módulo CAE) e em
-- seguida este arquivo. A V4 cria as tabelas visitas_cae, membros_cae,
-- reunioes_cae e apontamentos_ouvidoria_cae que ainda não existem no banco
-- (as consultas retornam 404/PGRST205).
--
-- O que este script corrige:
--  1. [BUG] O app grava logs de auditoria diretamente do cliente
--     (salvarAuditoriaLog -> INSERT em public.auditoria_logs), mas a tabela só
--     possuía policy de SELECT (ADMIN/CAE). Todo INSERT retornava 403 e era
--     engolido silenciosamente pelo .catch(). Adicionada policy de INSERT.
--  2. Verificação final para orientar sobre a ordem de aplicação.
-- ============================================================================

-- ============================================================================
-- 1. POLICY DE INSERT PARA AUDITORIA
-- ============================================================================
-- Qualquer usuário autenticado pode registrar ações (login, cadastros etc.).
-- A leitura continua restrita a ADMIN/CAE pela policy auditoria_select da V3.
DROP POLICY IF EXISTS auditoria_insert ON public.auditoria_logs;
CREATE POLICY auditoria_insert
ON public.auditoria_logs FOR INSERT TO authenticated
WITH CHECK (TRUE);

-- ============================================================================
-- 2. VERIFICAÇÕES FINAIS
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'membros_cae'
    ) THEN
        RAISE EXCEPTION
            'Tabela membros_cae não encontrada. Aplique a supabase_migration_v4.sql (módulo CAE) ANTES desta migration.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'auditoria_logs' AND policyname = 'auditoria_insert'
    ) THEN
        RAISE EXCEPTION 'Policy auditoria_insert não foi criada em auditoria_logs.';
    END IF;
END $$;

-- ============================================================================
-- FIM DA MIGRATION V5
-- ============================================================================

-- ============================================================================
-- FIX: Promover perfil para ADMIN (bootstrap do primeiro Gestor)
-- ============================================================================
-- O trigger trg_protege_perfil (migration V3) impede que qualquer pessoa se
-- autopromova a ADMIN via aplicação. Para o PRIMEIRO Gestor Municipal é
-- necessário desabilitar o trigger temporariamente e ajustar o perfil.
--
-- COMO USAR:
--   1. Abra o SQL Editor no painel do Supabase (Dashboard > SQL Editor > New query).
--   2. Cole e execute o bloco abaixo.
--   3. Feito isso, faça login com o e-mail/senha cadastrados — o acesso
--      passará a ser o painel do Gestor (ADMIN).
-- ============================================================================

BEGIN;

ALTER TABLE public.perfis_usuarios DISABLE TRIGGER trg_protege_perfil;

UPDATE public.perfis_usuarios
   SET role         = 'ADMIN',
       municipio_id = 'aa39239d-4d20-49c2-a415-2cb9e6f9d2a0',
       ativo        = TRUE
 WHERE id = '7f48928a-af6c-4f75-93c9-4160408c14d4';

ALTER TABLE public.perfis_usuarios ENABLE TRIGGER trg_protege_perfil;

COMMIT;

-- Verificação (deve retornar role = ADMIN):
-- SELECT id, nome, email, role, municipio_id, ativo
--   FROM public.perfis_usuarios
--  WHERE id = '7f48928a-af6c-4f75-93c9-4160408c14d4';

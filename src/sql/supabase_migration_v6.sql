-- ============================================================================
-- ERP PNAE - SUPABASE / POSTGRESQL
-- MIGRATION V6 - CORREÇÃO DO CADASTRO DE USUÁRIOS COM PERFIL CAE
-- ============================================================================
-- Problema: o trigger trg_protege_perfil (migration V3) reescrevia role para
-- 'ESCOLA' em todo INSERT executado pelo service-role client do servidor,
-- porque nesse contexto auth.uid() é NULL e, portanto, public.is_admin()
-- retorna FALSE. Como o endpoint /api/admin-usuarios cria perfis via service
-- role (depois de validar o chamador com exigirAdmin), qualquer usuário
-- cadastrado com perfil CAE (ou NUTRICIONISTA/ADMIN) era gravado como ESCOLA.
--
-- Correção: operações originadas do service_role (conexão servidor a servidor)
-- passam a ser tratadas como confiáveis, assim como as do ADMIN autenticado.
-- A camada de segurança continua garantida porque o endpoint só aceita
-- requisições cujo JWT pertença a um perfil ADMIN (exigirAdmin).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.proteger_campos_sensiveis_perfil()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- ADMIN autenticado ou service-role (servidor) podem definir o papel livremente.
    IF public.is_admin() OR auth.role() = 'service_role' THEN
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
-- VERIFICAÇÕES FINAIS
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_protege_perfil'
          AND tgrelid = 'public.perfis_usuarios'::regclass
    ) THEN
        RAISE EXCEPTION 'Trigger trg_protege_perfil não foi recriada em perfis_usuarios.';
    END IF;
END $$;

-- ============================================================================
-- FIM DA MIGRATION V6
-- ============================================================================

-- ============================================================================
-- SCRIPT DE ROLLBACK: Motor Empresa ↔ Oportunidade (Receita Sintonia MVP)
-- Remove EXCLUSIVAMENTE as novas tabelas e políticas criadas pelo MVP
-- Nenhuma tabela existente (taxmanagers_leads, taxmanagers_companies, etc.) é afetada.
-- ============================================================================

-- 1. REMOVER POLÍTICAS RLS
DROP POLICY IF EXISTS "Parceiros gerenciam matches dos seus leads" ON public.taxmanagers_opportunity_matches;
DROP POLICY IF EXISTS "Parceiros veem matches dos seus leads" ON public.taxmanagers_opportunity_matches;
DROP POLICY IF EXISTS "Apenas admins criam/editam oportunidades" ON public.taxmanagers_opportunities;
DROP POLICY IF EXISTS "Leitura de oportunidades ativas" ON public.taxmanagers_opportunities;

-- 2. REMOVER ÍNDICES
DROP INDEX IF EXISTS public.idx_opp_matches_status;
DROP INDEX IF EXISTS public.idx_opp_matches_parceiro_id;
DROP INDEX IF EXISTS public.idx_opp_matches_lead_id;
DROP INDEX IF EXISTS public.idx_opp_matches_opp_id;

-- 3. REMOVER TABELAS NOVAS (CASCADE remove constraints associadas)
DROP TABLE IF EXISTS public.taxmanagers_opportunity_matches CASCADE;
DROP TABLE IF EXISTS public.taxmanagers_opportunities CASCADE;

NOTIFY pgrst, 'reload schema';

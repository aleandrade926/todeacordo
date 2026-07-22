-- ============================================================================
-- MIGRATION: Motor Empresa ↔ Oportunidade (Receita Sintonia MVP)
-- Script Idempotente de Criação de Tabelas, Índices e RLS
-- ============================================================================

-- 1. TABELA DE OPORTUNIDADES
CREATE TABLE IF NOT EXISTS public.taxmanagers_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  target_sectors JSONB DEFAULT '[]'::jsonb,
  target_roles JSONB DEFAULT '[]'::jsonb,
  inclusion_criteria JSONB DEFAULT '[]'::jsonb,
  exclusion_criteria JSONB DEFAULT '[]'::jsonb,
  base_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE MATCHES DE OPORTUNIDADE
CREATE TABLE IF NOT EXISTS public.taxmanagers_opportunity_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.taxmanagers_opportunities(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.taxmanagers_companies(id) ON DELETE SET NULL,
  lead_id UUID NOT NULL REFERENCES public.taxmanagers_leads(id) ON DELETE CASCADE,
  parceiro_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE SET NULL,
  company_name_snapshot TEXT,
  company_resolution_source TEXT CHECK (company_resolution_source IN ('company_id', 'candidate_company_id', 'legacy_text', 'missing')),
  company_resolution_status TEXT CHECK (company_resolution_status IN ('confirmed', 'candidate', 'unresolved', 'missing')),
  opportunity_adherence_score INT DEFAULT 0,
  relationship_signal INT DEFAULT 0,
  contact_curve TEXT CHECK (contact_curve IN ('A', 'B', 'C')),
  score_reasons JSONB DEFAULT '[]'::jsonb,
  missing_data JSONB DEFAULT '[]'::jsonb,
  recommended_action TEXT,
  match_status TEXT CHECK (match_status IN ('PRIORIDADE', 'VALIDAR', 'NÃO ABORDAR')),
  commercial_status TEXT DEFAULT 'pendente' CHECK (commercial_status IN ('pendente', 'abordado', 'respondeu', 'sem_interesse', 'reuniao_marcada')),
  next_contact_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_opp_lead UNIQUE (opportunity_id, lead_id)
);

-- 3. ÍNDICES DE PERFORMANCE E UNICIDADE
CREATE INDEX IF NOT EXISTS idx_opp_matches_opp_id ON public.taxmanagers_opportunity_matches(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_matches_lead_id ON public.taxmanagers_opportunity_matches(lead_id);
CREATE INDEX IF NOT EXISTS idx_opp_matches_parceiro_id ON public.taxmanagers_opportunity_matches(parceiro_id);
CREATE INDEX IF NOT EXISTS idx_opp_matches_status ON public.taxmanagers_opportunity_matches(match_status, commercial_status);

-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.taxmanagers_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_opportunity_matches ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS RIGOROSAS (Idempotentes - Sem Acesso Genérico por parceiro_id IS NULL)
DROP POLICY IF EXISTS "Leitura de oportunidades ativas" ON public.taxmanagers_opportunities;
CREATE POLICY "Leitura de oportunidades ativas" 
ON public.taxmanagers_opportunities FOR SELECT 
USING (status = 'active' OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Apenas admins criam/editam oportunidades" ON public.taxmanagers_opportunities;
CREATE POLICY "Apenas admins criam/editam oportunidades" 
ON public.taxmanagers_opportunities FOR ALL 
USING (public.is_taxmanagers_admin()) WITH CHECK (public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros veem matches dos seus leads" ON public.taxmanagers_opportunity_matches;
CREATE POLICY "Parceiros veem matches dos seus leads" 
ON public.taxmanagers_opportunity_matches FOR SELECT 
USING (
  (parceiro_id IS NOT NULL AND parceiro_id = auth.uid()) 
  OR public.is_taxmanagers_admin()
);

DROP POLICY IF EXISTS "Parceiros gerenciam matches dos seus leads" ON public.taxmanagers_opportunity_matches;
CREATE POLICY "Parceiros gerenciam matches dos seus leads" 
ON public.taxmanagers_opportunity_matches FOR ALL 
USING (
  (parceiro_id IS NOT NULL AND parceiro_id = auth.uid()) 
  OR public.is_taxmanagers_admin()
)
WITH CHECK (
  (parceiro_id IS NOT NULL AND parceiro_id = auth.uid()) 
  OR public.is_taxmanagers_admin()
);

-- 5. SEED INICIAL DA OPORTUNIDADE RECEITA SINTONIA (Idempotente por Name)
INSERT INTO public.taxmanagers_opportunities (
  name, 
  description, 
  status, 
  target_sectors, 
  target_roles, 
  inclusion_criteria, 
  exclusion_criteria, 
  base_message
)
SELECT 
  'Tax Managers — Diagnóstico Receita Sintonia',
  'Identificar empresas e contatos com maior aderência para abordagem comercial relacionada ao Receita Sintonia.',
  'active',
  '["Indústria", "Varejo", "Agronegócio", "Energia", "Tecnologia", "Saúde"]'::jsonb,
  '["CFO", "Diretor Fiscal", "Diretor Financeiro", "Controller", "Head Fiscal", "Sócio Tributário"]'::jsonb,
  '["Empresa média ou grande", "Operação tributária relevante", "Sinal público ou complexidade fiscal"]'::jsonb,
  '["Empresas inativas", "Baixa complexidade tributária evidente", "Microempresas/MEI sem passivo fiscal"]'::jsonb,
  'Olá {{nome}}, identificamos oportunidade de otimização no Diagnóstico Receita Sintonia para a {{empresa}}.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.taxmanagers_opportunities WHERE name = 'Tax Managers — Diagnóstico Receita Sintonia'
);

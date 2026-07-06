CREATE TABLE IF NOT EXISTS public.taxmanagers_agent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.taxmanagers_leads(id) ON DELETE CASCADE,
    parceiro_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.taxmanagers_partners(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'mirror_mode'
        CHECK (status IN ('mirror_mode', 'client_active', 'inactive')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.taxmanagers_agent_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.taxmanagers_agent_profiles(id) ON DELETE CASCADE,
    tipo VARCHAR(100) NOT NULL CHECK (tipo IN (
        'perfil_operacional',
        'tese',
        'icp',
        'lista_empresas',
        'mensagens',
        'cadencia',
        'next_actions'
    )),
    conteudo TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'success'
        CHECK (status IN ('success', 'error', 'user_edited', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT agent_outputs_agent_tipo_unique UNIQUE(agent_id, tipo)
);

CREATE INDEX IF NOT EXISTS taxmanagers_agent_profiles_lead_idx
ON public.taxmanagers_agent_profiles (lead_id);

CREATE INDEX IF NOT EXISTS taxmanagers_agent_profiles_parceiro_status_idx
ON public.taxmanagers_agent_profiles (parceiro_id, status);

CREATE INDEX IF NOT EXISTS taxmanagers_agent_outputs_agent_tipo_idx
ON public.taxmanagers_agent_outputs (agent_id, tipo);

CREATE OR REPLACE FUNCTION public.update_agent_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_taxmanagers_agent_profiles_updated_at
ON public.taxmanagers_agent_profiles;

CREATE TRIGGER update_taxmanagers_agent_profiles_updated_at
BEFORE UPDATE ON public.taxmanagers_agent_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_agent_updated_at_column();

DROP TRIGGER IF EXISTS update_taxmanagers_agent_outputs_updated_at
ON public.taxmanagers_agent_outputs;

CREATE TRIGGER update_taxmanagers_agent_outputs_updated_at
BEFORE UPDATE ON public.taxmanagers_agent_outputs
FOR EACH ROW EXECUTE FUNCTION public.update_agent_updated_at_column();

ALTER TABLE public.taxmanagers_agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_agent_outputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem selecionar todos os perfis de agentes"
ON public.taxmanagers_agent_profiles;
CREATE POLICY "Admins podem selecionar todos os perfis de agentes"
ON public.taxmanagers_agent_profiles FOR SELECT
USING (public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Admins podem inserir perfis de agentes"
ON public.taxmanagers_agent_profiles;
CREATE POLICY "Admins podem inserir perfis de agentes"
ON public.taxmanagers_agent_profiles FOR INSERT
WITH CHECK (
    public.is_taxmanagers_admin()
    AND created_by = auth.uid()
);

DROP POLICY IF EXISTS "Admins podem atualizar todos os perfis de agentes"
ON public.taxmanagers_agent_profiles;
CREATE POLICY "Admins podem atualizar todos os perfis de agentes"
ON public.taxmanagers_agent_profiles FOR UPDATE
USING (public.is_taxmanagers_admin())
WITH CHECK (public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Admins podem deletar todos os perfis de agentes"
ON public.taxmanagers_agent_profiles;
CREATE POLICY "Admins podem deletar todos os perfis de agentes"
ON public.taxmanagers_agent_profiles FOR DELETE
USING (public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros podem ver seus proprios agentes ativos"
ON public.taxmanagers_agent_profiles;
CREATE POLICY "Parceiros podem ver seus proprios agentes ativos"
ON public.taxmanagers_agent_profiles FOR SELECT
USING (
    parceiro_id = auth.uid()
    AND status = 'client_active'
);

DROP POLICY IF EXISTS "Parceiros podem atualizar seus proprios agentes ativos"
ON public.taxmanagers_agent_profiles;

DROP POLICY IF EXISTS "Admins podem selecionar todos os outputs"
ON public.taxmanagers_agent_outputs;
CREATE POLICY "Admins podem selecionar todos os outputs"
ON public.taxmanagers_agent_outputs FOR SELECT
USING (public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Admins podem inserir outputs"
ON public.taxmanagers_agent_outputs;
CREATE POLICY "Admins podem inserir outputs"
ON public.taxmanagers_agent_outputs FOR INSERT
WITH CHECK (
    public.is_taxmanagers_admin()
    AND EXISTS (
        SELECT 1
        FROM public.taxmanagers_agent_profiles ap
        WHERE ap.id = agent_id
    )
);

DROP POLICY IF EXISTS "Admins podem atualizar todos os outputs"
ON public.taxmanagers_agent_outputs;
CREATE POLICY "Admins podem atualizar todos os outputs"
ON public.taxmanagers_agent_outputs FOR UPDATE
USING (public.is_taxmanagers_admin())
WITH CHECK (public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Admins podem deletar todos os outputs"
ON public.taxmanagers_agent_outputs;
CREATE POLICY "Admins podem deletar todos os outputs"
ON public.taxmanagers_agent_outputs FOR DELETE
USING (public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros podem ver outputs dos seus agentes ativos"
ON public.taxmanagers_agent_outputs;
CREATE POLICY "Parceiros podem ver outputs dos seus agentes ativos"
ON public.taxmanagers_agent_outputs FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.taxmanagers_agent_profiles ap
        WHERE ap.id = agent_id
          AND ap.parceiro_id = auth.uid()
          AND ap.status = 'client_active'
    )
);

DROP POLICY IF EXISTS "Parceiros podem atualizar outputs dos seus agentes ativos"
ON public.taxmanagers_agent_outputs;

NOTIFY pgrst, 'reload schema';

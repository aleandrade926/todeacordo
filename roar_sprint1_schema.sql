-- --- SCHEMA DE BANCO DE DADOS COMPLETO: TAXMANAGERS PARTNER ---
-- Inclui as tabelas base do MVP + Estrutura Roar da Sprint 1

-- ==========================================
-- PARTE 1: TABELAS BASE (Obrigatórias)
-- ==========================================

-- 1. Perfis de Parceiros
CREATE TABLE IF NOT EXISTS public.taxmanagers_partners (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  faixa TEXT DEFAULT 'Branca' CHECK (faixa IN ('Branca', 'Verde', 'Preta')),
  saldo_comissao NUMERIC(12,2) DEFAULT 0.00,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Campanhas
CREATE TABLE IF NOT EXISTS public.taxmanagers_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  parceiro_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Leads (Funil Principal)
CREATE TABLE IF NOT EXISTS public.taxmanagers_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES public.taxmanagers_campaigns(id) ON DELETE SET NULL,
  parceiro_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  empresa TEXT,
  cargo TEXT,
  url TEXT,
  email TEXT,
  telefone TEXT,
  aniversario TEXT,
  passo1_mensagem TEXT,
  passo2_mensagem TEXT,
  passo3_mensagem TEXT,
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Abordado', 'Passo 1', 'Passo 2', 'Passo 3', 'Reunião Agendada', 'Faturado', 'Descartado')),
  chat_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bloco de Migração Segura para Leads Legados
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'taxmanagers_leads' AND column_name = 'cnpj'
    ) THEN
        -- Renomeia 'name' para 'nome' se existir
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'taxmanagers_leads' AND column_name = 'name') THEN
            ALTER TABLE public.taxmanagers_leads RENAME COLUMN name TO nome;
        END IF;

        -- Renomeia 'phone' para 'telefone' se existir
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'taxmanagers_leads' AND column_name = 'phone') THEN
            ALTER TABLE public.taxmanagers_leads RENAME COLUMN phone TO telefone;
        END IF;

        -- Remove as colunas antigas que não são mais usadas no novo modelo
        ALTER TABLE public.taxmanagers_leads DROP COLUMN IF EXISTS cnpj;
        ALTER TABLE public.taxmanagers_leads DROP COLUMN IF EXISTS message;

        -- Adiciona as novas colunas e chaves estrangeiras necessárias
        ALTER TABLE public.taxmanagers_leads ADD COLUMN IF NOT EXISTS campanha_id UUID REFERENCES public.taxmanagers_campaigns(id) ON DELETE SET NULL;
        ALTER TABLE public.taxmanagers_leads ADD COLUMN IF NOT EXISTS parceiro_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE SET NULL;
        ALTER TABLE public.taxmanagers_leads ADD COLUMN IF NOT EXISTS empresa TEXT;
        ALTER TABLE public.taxmanagers_leads ADD COLUMN IF NOT EXISTS cargo TEXT;
        ALTER TABLE public.taxmanagers_leads ADD COLUMN IF NOT EXISTS url TEXT;
        ALTER TABLE public.taxmanagers_leads ADD COLUMN IF NOT EXISTS aniversario TEXT;
        ALTER TABLE public.taxmanagers_leads ADD COLUMN IF NOT EXISTS passo1_mensagem TEXT;
        ALTER TABLE public.taxmanagers_leads ADD COLUMN IF NOT EXISTS passo2_mensagem TEXT;
        ALTER TABLE public.taxmanagers_leads ADD COLUMN IF NOT EXISTS passo3_mensagem TEXT;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'taxmanagers_leads' AND column_name = 'status') THEN
            ALTER TABLE public.taxmanagers_leads ADD COLUMN status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Abordado', 'Passo 1', 'Passo 2', 'Passo 3', 'Reunião Agendada', 'Faturado', 'Descartado'));
        END IF;
        
        ALTER TABLE public.taxmanagers_leads ADD COLUMN IF NOT EXISTS chat_history TEXT;
    END IF;
END $$;


-- 4. Vendas e Comissões Antigas
CREATE TABLE IF NOT EXISTS public.taxmanagers_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.taxmanagers_leads(id) ON DELETE SET NULL,
  parceiro_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE SET NULL,
  valor_contrato NUMERIC(12,2) NOT NULL,
  comissao_parceiro NUMERIC(12,2) NOT NULL,
  comissao_taxmanagers NUMERIC(12,2) NOT NULL,
  comissao_expert NUMERIC(12,2) NOT NULL,
  comissao_autor NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Configurações do Agente IA
CREATE TABLE IF NOT EXISTS public.taxmanagers_agent_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES public.taxmanagers_campaigns(id) ON DELETE CASCADE,
  parceiro_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE CASCADE,
  thesis_focus TEXT DEFAULT 'Automático',
  system_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(campanha_id, parceiro_id)
);


-- ==========================================
-- PARTE 2: TABELAS ROAR (Sprint 1)
-- ==========================================

-- 6. Cadências
CREATE TABLE IF NOT EXISTS public.taxmanagers_cadences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  target_type TEXT,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.taxmanagers_partners(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Etapas da Cadência
CREATE TABLE IF NOT EXISTS public.taxmanagers_cadence_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cadence_id UUID REFERENCES public.taxmanagers_cadences(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  channel TEXT CHECK(channel IN ('email', 'phone', 'linkedin_manual', 'whatsapp_manual', 'manual_task')),
  delay_days INT DEFAULT 0,
  subject_template TEXT,
  body_template TEXT,
  goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Cadências Ativas em Leads
CREATE TABLE IF NOT EXISTS public.taxmanagers_lead_cadences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.taxmanagers_leads(id) ON DELETE CASCADE,
  cadence_id UUID REFERENCES public.taxmanagers_cadences(id) ON DELETE CASCADE,
  current_step_id UUID REFERENCES public.taxmanagers_cadence_steps(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'stopped', 'replied', 'opt_out')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  next_due_at TIMESTAMP WITH TIME ZONE,
  owner_partner_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE CASCADE
);

-- 9. Tarefas (Ações do Parceiro)
CREATE TABLE IF NOT EXISTS public.taxmanagers_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.taxmanagers_leads(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE CASCADE,
  cadence_id UUID REFERENCES public.taxmanagers_cadences(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.taxmanagers_cadence_steps(id) ON DELETE CASCADE,
  type TEXT,
  channel TEXT,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'done', 'skipped', 'rescheduled')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Interações (Timeline do Lead)
CREATE TABLE IF NOT EXISTS public.taxmanagers_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.taxmanagers_leads(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE CASCADE,
  type TEXT CHECK(type IN ('email', 'phone', 'linkedin', 'whatsapp', 'note', 'status_change', 'ai_suggestion', 'import', 'task_completed')),
  direction TEXT CHECK(direction IN ('inbound', 'outbound', 'internal')),
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES public.taxmanagers_partners(id) ON DELETE SET NULL
);

-- 11. Lista de Supressão
CREATE TABLE IF NOT EXISTS public.taxmanagers_suppression_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES public.taxmanagers_partners(id) ON DELETE SET NULL
);

-- 12. Fila de Jobs IA
CREATE TABLE IF NOT EXISTS public.taxmanagers_ai_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.taxmanagers_leads(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.taxmanagers_campaigns(id) ON DELETE SET NULL,
  job_type TEXT CHECK(job_type IN ('generate_message', 'classify_reply', 'suggest_next_step', 'summarize_chat')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  input_payload JSONB,
  output_payload JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 13. Ledger de Comissões
CREATE TABLE IF NOT EXISTS public.taxmanagers_commission_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.taxmanagers_sales(id) ON DELETE CASCADE,
  beneficiary_type TEXT CHECK(beneficiary_type IN ('partner', 'taxmanagers', 'expert', 'author')),
  beneficiary_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  percentage NUMERIC(5,2),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'paid', 'canceled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- PARTE 3: ÍNDICES, RLS E POLICIES
-- ==========================================

-- Função auxiliar Admin
CREATE OR REPLACE FUNCTION public.is_taxmanagers_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.taxmanagers_partners 
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices de Performance
CREATE INDEX IF NOT EXISTS taxmanagers_tasks_partner_due_status_idx ON public.taxmanagers_tasks (partner_id, status, due_at);
CREATE INDEX IF NOT EXISTS taxmanagers_interactions_lead_created_idx ON public.taxmanagers_interactions (lead_id, created_at);
CREATE INDEX IF NOT EXISTS taxmanagers_lead_cadences_owner_status_idx ON public.taxmanagers_lead_cadences (owner_partner_id, status, next_due_at);
CREATE INDEX IF NOT EXISTS taxmanagers_ai_jobs_partner_status_idx ON public.taxmanagers_ai_jobs (partner_id, status, created_at);

-- Habilitar RLS em todas
ALTER TABLE public.taxmanagers_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_cadence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_lead_cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_suppression_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_commission_ledger ENABLE ROW LEVEL SECURITY;

-- POLICIES DE BASE (Se não existirem)
DROP POLICY IF EXISTS "Parceiros podem ver o próprio perfil" ON public.taxmanagers_partners;
CREATE POLICY "Parceiros podem ver o próprio perfil" ON public.taxmanagers_partners FOR SELECT USING (auth.uid() = id OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros podem criar o próprio perfil" ON public.taxmanagers_partners;
CREATE POLICY "Parceiros podem criar o próprio perfil" ON public.taxmanagers_partners FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Apenas admin pode atualizar parceiros" ON public.taxmanagers_partners;
CREATE POLICY "Apenas admin pode atualizar parceiros" ON public.taxmanagers_partners FOR ALL USING (public.is_taxmanagers_admin()) WITH CHECK (public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros veem seus leads ou unassigned" ON public.taxmanagers_leads;
CREATE POLICY "Parceiros veem seus leads ou unassigned" ON public.taxmanagers_leads FOR SELECT USING (parceiro_id = auth.uid() OR parceiro_id IS NULL OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros criam seus próprios leads" ON public.taxmanagers_leads;
CREATE POLICY "Parceiros criam seus próprios leads" ON public.taxmanagers_leads FOR INSERT WITH CHECK (parceiro_id = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros atualizam seus leads ou reivindicam unassigned" ON public.taxmanagers_leads;
CREATE POLICY "Parceiros atualizam seus leads ou reivindicam unassigned" ON public.taxmanagers_leads FOR UPDATE USING (parceiro_id = auth.uid() OR parceiro_id IS NULL OR public.is_taxmanagers_admin()) WITH CHECK (parceiro_id = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros deletam apenas seus próprios leads" ON public.taxmanagers_leads;
CREATE POLICY "Parceiros deletam apenas seus próprios leads" ON public.taxmanagers_leads FOR DELETE USING (parceiro_id = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros gerenciam suas próprias configurações de agente" ON public.taxmanagers_agent_config;
CREATE POLICY "Parceiros gerenciam suas próprias configurações de agente" ON public.taxmanagers_agent_config FOR ALL USING (parceiro_id = auth.uid() OR public.is_taxmanagers_admin()) WITH CHECK (parceiro_id = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros veem suas campanhas" ON public.taxmanagers_campaigns;
CREATE POLICY "Parceiros veem suas campanhas" ON public.taxmanagers_campaigns FOR SELECT USING (parceiro_id IS NULL OR parceiro_id = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros criam campanhas para si" ON public.taxmanagers_campaigns;
CREATE POLICY "Parceiros criam campanhas para si" ON public.taxmanagers_campaigns FOR INSERT WITH CHECK (parceiro_id = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros atualizam próprias campanhas" ON public.taxmanagers_campaigns;
CREATE POLICY "Parceiros atualizam próprias campanhas" ON public.taxmanagers_campaigns FOR UPDATE USING (parceiro_id = auth.uid() OR public.is_taxmanagers_admin()) WITH CHECK (parceiro_id = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros veem apenas suas próprias vendas" ON public.taxmanagers_sales;
CREATE POLICY "Parceiros veem apenas suas próprias vendas" ON public.taxmanagers_sales FOR SELECT USING (parceiro_id = auth.uid() OR public.is_taxmanagers_admin());

-- POLICIES ROAR SPRINT 1
DROP POLICY IF EXISTS "Parceiros veem as próprias cadências ou campanhas ativas globais" ON public.taxmanagers_cadences;
CREATE POLICY "Parceiros veem as próprias cadências ou campanhas ativas globais" ON public.taxmanagers_cadences FOR SELECT USING (created_by = auth.uid() OR created_by IS NULL OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros podem criar cadências para si" ON public.taxmanagers_cadences;
CREATE POLICY "Parceiros podem criar cadências para si" ON public.taxmanagers_cadences FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros atualizam próprias cadências" ON public.taxmanagers_cadences;
CREATE POLICY "Parceiros atualizam próprias cadências" ON public.taxmanagers_cadences FOR UPDATE USING (created_by = auth.uid() OR public.is_taxmanagers_admin()) WITH CHECK (created_by = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros excluem próprias cadências" ON public.taxmanagers_cadences;
CREATE POLICY "Parceiros excluem próprias cadências" ON public.taxmanagers_cadences FOR DELETE USING (created_by = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros veem etapas das cadências visíveis" ON public.taxmanagers_cadence_steps;
CREATE POLICY "Parceiros veem etapas das cadências visíveis" ON public.taxmanagers_cadence_steps FOR SELECT USING (true); 

DROP POLICY IF EXISTS "Apenas admin edita etapas de cadência" ON public.taxmanagers_cadence_steps;
CREATE POLICY "Apenas admin edita etapas de cadência" ON public.taxmanagers_cadence_steps FOR ALL USING (public.is_taxmanagers_admin()) WITH CHECK (public.is_taxmanagers_admin()); 

DROP POLICY IF EXISTS "Parceiros gerenciam cadências de seus leads" ON public.taxmanagers_lead_cadences;
CREATE POLICY "Parceiros gerenciam cadências de seus leads" ON public.taxmanagers_lead_cadences FOR ALL USING (owner_partner_id = auth.uid() OR public.is_taxmanagers_admin()) WITH CHECK (owner_partner_id = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros gerenciam suas próprias tarefas" ON public.taxmanagers_tasks;
CREATE POLICY "Parceiros gerenciam suas próprias tarefas" ON public.taxmanagers_tasks FOR ALL USING (partner_id = auth.uid() OR public.is_taxmanagers_admin()) WITH CHECK (partner_id = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros gerenciam as interações de seus leads" ON public.taxmanagers_interactions;
CREATE POLICY "Parceiros gerenciam as interações de seus leads" ON public.taxmanagers_interactions FOR ALL USING (partner_id = auth.uid() OR public.is_taxmanagers_admin()) WITH CHECK (partner_id = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros veem apenas suas supressões" ON public.taxmanagers_suppression_list;
CREATE POLICY "Parceiros veem apenas suas supressões" ON public.taxmanagers_suppression_list FOR SELECT USING (created_by = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros podem adicionar à lista de supressão" ON public.taxmanagers_suppression_list;
CREATE POLICY "Parceiros podem adicionar à lista de supressão" ON public.taxmanagers_suppression_list FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros gerenciam apenas seus próprios jobs de IA" ON public.taxmanagers_ai_jobs;
CREATE POLICY "Parceiros gerenciam apenas seus próprios jobs de IA" ON public.taxmanagers_ai_jobs FOR ALL USING (partner_id = auth.uid() OR public.is_taxmanagers_admin()) WITH CHECK (partner_id = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Parceiros veem apenas suas linhas de comissão aprovadas/pagas/pendentes" ON public.taxmanagers_commission_ledger;
CREATE POLICY "Parceiros veem apenas suas linhas de comissão aprovadas/pagas/pendentes" ON public.taxmanagers_commission_ledger FOR SELECT USING (beneficiary_id = auth.uid() OR public.is_taxmanagers_admin());

DROP POLICY IF EXISTS "Apenas admin modifica o ledger financeiro" ON public.taxmanagers_commission_ledger;
CREATE POLICY "Apenas admin modifica o ledger financeiro" ON public.taxmanagers_commission_ledger FOR ALL USING (public.is_taxmanagers_admin()) WITH CHECK (public.is_taxmanagers_admin());

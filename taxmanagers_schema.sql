-- --- SCHEMA DE BANCO DE DADOS PARA TAXMANAGERS CRM ---

-- 1. Tabela de Perfis de Parceiros / Franqueados
CREATE TABLE IF NOT EXISTS public.taxmanagers_partners (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  faixa TEXT DEFAULT 'Branca' CHECK (faixa IN ('Branca', 'Verde', 'Preta')),
  saldo_comissao NUMERIC(12,2) DEFAULT 0.00,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Campanhas
CREATE TABLE IF NOT EXISTS public.taxmanagers_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  parceiro_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE CASCADE, -- NULL indica campanha global/admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Leads
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

-- 4. Tabela de Vendas e Comissões (Splits)
CREATE TABLE IF NOT EXISTS public.taxmanagers_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.taxmanagers_leads(id) ON DELETE SET NULL,
  parceiro_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE SET NULL,
  valor_contrato NUMERIC(12,2) NOT NULL,
  comissao_parceiro NUMERIC(12,2) NOT NULL, -- 30%
  comissao_taxmanagers NUMERIC(12,2) NOT NULL, -- 50%
  comissao_expert NUMERIC(12,2) NOT NULL, -- 10%
  comissao_autor NUMERIC(12,2) NOT NULL, -- 10%
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Configurações do Agente de IA
CREATE TABLE IF NOT EXISTS public.taxmanagers_agent_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES public.taxmanagers_campaigns(id) ON DELETE CASCADE,
  parceiro_id UUID REFERENCES public.taxmanagers_partners(id) ON DELETE CASCADE,
  thesis_focus TEXT DEFAULT 'Automático',
  system_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(campanha_id, parceiro_id)
);

-- --- HABILITAR SEGURANÇA ROW LEVEL SECURITY (RLS) ---
ALTER TABLE public.taxmanagers_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxmanagers_agent_config ENABLE ROW LEVEL SECURITY;

-- --- DEFINIÇÃO DE POLÍTICAS DE ACESSO ---

-- Função auxiliar para checar se o usuário logado é Admin
CREATE OR REPLACE FUNCTION public.is_taxmanagers_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.taxmanagers_partners 
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para taxmanagers_partners
CREATE POLICY "Parceiros podem ver o próprio perfil" 
ON public.taxmanagers_partners FOR SELECT 
USING (auth.uid() = id OR public.is_taxmanagers_admin());

CREATE POLICY "Apenas admin pode atualizar ou deletar parceiros" 
ON public.taxmanagers_partners FOR ALL 
USING (public.is_taxmanagers_admin());

-- Políticas para taxmanagers_campaigns
CREATE POLICY "Parceiros veem suas campanhas ou campanhas globais" 
ON public.taxmanagers_campaigns FOR SELECT 
USING (parceiro_id IS NULL OR parceiro_id = auth.uid() OR public.is_taxmanagers_admin());

CREATE POLICY "Parceiros podem criar campanhas para si" 
ON public.taxmanagers_campaigns FOR INSERT 
WITH CHECK (parceiro_id = auth.uid() OR public.is_taxmanagers_admin());

CREATE POLICY "Parceiros podem editar suas próprias campanhas" 
ON public.taxmanagers_campaigns FOR UPDATE 
USING (parceiro_id = auth.uid() OR public.is_taxmanagers_admin());

-- Políticas para taxmanagers_leads
CREATE POLICY "Parceiros gerenciam apenas seus próprios leads" 
ON public.taxmanagers_leads FOR ALL 
USING (parceiro_id = auth.uid() OR public.is_taxmanagers_admin());

-- Políticas para taxmanagers_sales
CREATE POLICY "Parceiros veem apenas suas próprias vendas" 
ON public.taxmanagers_sales FOR SELECT 
USING (parceiro_id = auth.uid() OR public.is_taxmanagers_admin());

CREATE POLICY "Apenas admin registra/edita splits de vendas" 
ON public.taxmanagers_sales FOR ALL 
USING (public.is_taxmanagers_admin());

-- Políticas para taxmanagers_agent_config
CREATE POLICY "Parceiros gerenciam suas próprias configurações de agente" 
ON public.taxmanagers_agent_config FOR ALL 
USING (parceiro_id = auth.uid() OR public.is_taxmanagers_admin());

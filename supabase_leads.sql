-- Tabela unificada de Leads para Captação (Infra, B2B, Brokers)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  region TEXT,
  stage TEXT,
  source TEXT NOT NULL, -- ex: 'infra_demand', 'infra_supply', 'broker', 'owner'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS (Row Level Security)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política: Permitir inserção de novos leads (público)
CREATE POLICY "Permitir inserção anônima de leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

-- Política: Permitir leitura apenas para usuários autenticados (ou remova se quiser leitura pública)
-- CREATE POLICY "Permitir leitura para usuários autenticados" 
-- ON public.leads 
-- FOR SELECT 
-- USING (auth.role() = 'authenticated');

-- Se precisar permitir leitura anônima temporariamente:
CREATE POLICY "Permitir leitura pública temporária" 
ON public.leads 
FOR SELECT 
USING (true);

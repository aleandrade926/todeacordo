-- ============================================================================
-- MIGRATION & DEDUPLICATION SCRIPT FOR TAXMANAGERS LEADS
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  kept_lead_id UUID;
  dup_lead RECORD;
  merged_email TEXT;
  merged_phone TEXT;
  merged_role TEXT;
  merged_company TEXT;
  merged_anniversary TEXT;
  merged_chat_history TEXT;
BEGIN
  -- 1. Criar a coluna linkedin_key se não existir
  BEGIN
    ALTER TABLE public.taxmanagers_leads ADD COLUMN linkedin_key TEXT;
    RAISE NOTICE 'Coluna linkedin_key criada com sucesso.';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Coluna linkedin_key já existe.';
  END;

  -- 2. Normalizar e preencher linkedin_key nos leads existentes
  -- Regex (?i)linkedin\.com/in/([^/?#\s]+) extrai de forma estável o handle/username
  UPDATE public.taxmanagers_leads
  SET linkedin_key = lower(trim(substring(url from '(?i)linkedin\.com/in/([^/?#\s]+)')))
  WHERE url IS NOT NULL AND (linkedin_key IS NULL OR linkedin_key = '');
  
  RAISE NOTICE 'linkedin_key preenchido para leads existentes.';

  -- 3. Mesclar duplicados existentes mantendo o mais antigo ou com histórico/timeline
  FOR r IN 
    SELECT parceiro_id, linkedin_key
    FROM public.taxmanagers_leads
    WHERE linkedin_key IS NOT NULL
    GROUP BY parceiro_id, linkedin_key
    HAVING COUNT(*) > 1
  LOOP
    -- Localiza o lead mais antigo (menor created_at) para ser o mantido
    SELECT id, email, telefone, cargo, empresa, aniversario, chat_history
    INTO kept_lead_id, merged_email, merged_phone, merged_role, merged_company, merged_anniversary, merged_chat_history
    FROM public.taxmanagers_leads
    WHERE (parceiro_id = r.parceiro_id OR (parceiro_id IS NULL AND r.parceiro_id IS NULL)) 
      AND linkedin_key = r.linkedin_key
    ORDER BY created_at ASC, id ASC
    LIMIT 1;

    -- Loop por todos os outros leads duplicados do mesmo grupo
    FOR dup_lead IN
      SELECT id, email, telefone, cargo, empresa, aniversario, chat_history
      FROM public.taxmanagers_leads
      WHERE (parceiro_id = r.parceiro_id OR (parceiro_id IS NULL AND r.parceiro_id IS NULL)) 
        AND linkedin_key = r.linkedin_key 
        AND id <> kept_lead_id
    LOOP
      -- Mescla dados de e-mail se o mantido for nulo/vazio/sem
      IF (merged_email IS NULL OR merged_email = '' OR lower(merged_email) LIKE 'sem%') 
         AND dup_lead.email IS NOT NULL AND dup_lead.email <> '' AND lower(dup_lead.email) NOT LIKE 'sem%' THEN
        merged_email := dup_lead.email;
      END IF;

      -- Mescla dados de telefone se o mantido for nulo/vazio/sem
      IF (merged_phone IS NULL OR merged_phone = '' OR lower(merged_phone) LIKE 'sem%') 
         AND dup_lead.telefone IS NOT NULL AND dup_lead.telefone <> '' AND lower(dup_lead.telefone) NOT LIKE 'sem%' THEN
        merged_phone := dup_lead.telefone;
      END IF;

      -- Cargo
      IF (merged_role IS NULL OR merged_role = '') AND dup_lead.cargo IS NOT NULL AND dup_lead.cargo <> '' THEN
        merged_role := dup_lead.cargo;
      END IF;

      -- Empresa
      IF (merged_company IS NULL OR merged_company = '') AND dup_lead.empresa IS NOT NULL AND dup_lead.empresa <> '' THEN
        merged_company := dup_lead.empresa;
      END IF;

      -- Aniversário
      IF (merged_anniversary IS NULL OR merged_anniversary = '') AND dup_lead.aniversario IS NOT NULL AND dup_lead.aniversario <> '' THEN
        merged_anniversary := dup_lead.aniversario;
      END IF;

      -- Histórico de conversa do chat
      IF dup_lead.chat_history IS NOT NULL AND dup_lead.chat_history <> '' THEN
        IF merged_chat_history IS NULL OR merged_chat_history = '' THEN
          merged_chat_history := dup_lead.chat_history;
        ELSE
          merged_chat_history := merged_chat_history || E'\n' || dup_lead.chat_history;
        END If;
      END IF;

      -- Re-linkar relações estrangeiras das tabelas filhas para o lead mantido
      -- Evita a remoção via CASCADE nas exclusões abaixo
      UPDATE public.taxmanagers_sales SET lead_id = kept_lead_id WHERE lead_id = dup_lead.id;
      UPDATE public.taxmanagers_lead_cadences SET lead_id = kept_lead_id WHERE lead_id = dup_lead.id;
      UPDATE public.taxmanagers_tasks SET lead_id = kept_lead_id WHERE lead_id = dup_lead.id;
      UPDATE public.taxmanagers_interactions SET lead_id = kept_lead_id WHERE lead_id = dup_lead.id;
      UPDATE public.taxmanagers_ai_jobs SET lead_id = kept_lead_id WHERE lead_id = dup_lead.id;

      -- Deleta o lead duplicado limpo
      DELETE FROM public.taxmanagers_leads WHERE id = dup_lead.id;
    END LOOP;

    -- Atualiza o lead mantido com todos os dados consolidados
    UPDATE public.taxmanagers_leads
    SET email = COALESCE(merged_email, email),
        telefone = COALESCE(merged_phone, telefone),
        cargo = COALESCE(merged_role, cargo),
        empresa = COALESCE(merged_company, empresa),
        aniversario = COALESCE(merged_anniversary, aniversario),
        chat_history = COALESCE(merged_chat_history, chat_history)
    WHERE id = kept_lead_id;

  END LOOP;
  
  RAISE NOTICE 'Mesclagem e limpeza de duplicados concluída.';
END $$;

-- 4. Remover qualquer índice parcial que possa ter sido criado anteriormente
DROP INDEX IF EXISTS public.taxmanagers_leads_parceiro_linkedin_key_uidx;

-- 5. Criar a restrição de chave única (UNIQUE CONSTRAINT)
ALTER TABLE public.taxmanagers_leads 
DROP CONSTRAINT IF EXISTS taxmanagers_leads_parceiro_linkedin_key_key;

ALTER TABLE public.taxmanagers_leads 
DROP CONSTRAINT IF EXISTS taxmanagers_leads_partner_linkedin_key_unique;

ALTER TABLE public.taxmanagers_leads 
ADD CONSTRAINT taxmanagers_leads_partner_linkedin_key_unique UNIQUE (parceiro_id, linkedin_key);

-- 6. Recarregar esquema no PostgREST
NOTIFY pgrst, 'reload schema';

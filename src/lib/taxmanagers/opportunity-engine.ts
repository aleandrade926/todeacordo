export type CompanyResolutionSource = "company_id" | "candidate_company_id" | "legacy_text" | "missing";
export type CompanyResolutionStatus = "confirmed" | "candidate" | "unresolved" | "missing";
export type TargetMatchStatus = "PRIORIDADE" | "VALIDAR" | "NÃO ABORDAR";
export type ContactCurve = "A" | "B" | "C";

export interface LeadInput {
  id: string;
  nome: string;
  empresa?: string | null;
  cargo?: string | null;
  email?: string | null;
  telefone?: string | null;
  url?: string | null;
  linkedin_key?: string | null;
  company_id?: string | null;
  candidate_company_id?: string | null;
  parceiro_id?: string | null;
  metadata?: Record<string, any> | null;
  chat_history?: string | null;
  status?: string | null;
  created_at?: string;
}

export interface CompanyResolutionResult {
  company_id: string | null;
  candidate_company_id: string | null;
  company_name_snapshot: string | null;
  company_resolution_source: CompanyResolutionSource;
  company_resolution_status: CompanyResolutionStatus;
}

export interface ScoreDetails {
  opportunity_adherence_score: number;
  relationship_signal: number;
  contact_curve: ContactCurve;
  score_reasons: string[];
  negative_reasons: string[];
  missing_data: string[];
}

export interface OpportunityMatchResult {
  opportunity_id: string;
  lead_id: string;
  lead_name: string;
  lead_cargo: string | null;
  company_id: string | null;
  company_name_snapshot: string | null;
  company_resolution_source: CompanyResolutionSource;
  company_resolution_status: CompanyResolutionStatus;
  opportunity_adherence_score: number;
  relationship_signal: number;
  contact_curve: ContactCurve;
  score_reasons: string[];
  missing_data: string[];
  recommended_action: string;
  match_status: TargetMatchStatus;
  commercial_status: "pendente" | "abordado" | "respondeu" | "sem_interesse" | "reuniao_marcada";
  next_contact_at: string | null;
  notes: string | null;
  parceiro_id?: string | null;
}

export interface ManualMatchEdits {
  commercial_status?: "pendente" | "abordado" | "respondeu" | "sem_interesse" | "reuniao_marcada";
  next_contact_at?: string | null;
  notes?: string | null;
}

/**
 * 1. Resolução em 4 Níveis (Strict Hierarchy)
 */
export function resolveCompanyHierarchy(lead: LeadInput): CompanyResolutionResult {
  const companyId = lead.company_id?.trim() || null;
  const candidateId = lead.candidate_company_id?.trim() || null;
  const legacyText = lead.empresa?.trim() || null;

  // PRIMEIRA OPÇÃO: Se company_id estiver preenchido -> confirmada
  if (companyId) {
    return {
      company_id: companyId,
      candidate_company_id: candidateId,
      company_name_snapshot: legacyText || "Empresa Vinculada",
      company_resolution_source: "company_id",
      company_resolution_status: "confirmed",
    };
  }

  // SEGUNDA OPÇÃO: Se candidate_company_id estiver preenchido -> candidata
  if (candidateId) {
    return {
      company_id: null,
      candidate_company_id: candidateId,
      company_name_snapshot: legacyText || "Empresa Candidata",
      company_resolution_source: "candidate_company_id",
      company_resolution_status: "candidate",
    };
  }

  // TERCEIRA OPÇÃO: Se ambos vazios, mas campo textual empresa preenchido -> texto legado
  if (legacyText) {
    return {
      company_id: null,
      candidate_company_id: null,
      company_name_snapshot: legacyText,
      company_resolution_source: "legacy_text",
      company_resolution_status: "unresolved",
    };
  }

  // QUARTA OPÇÃO: Nenhuma informação de empresa
  return {
    company_id: null,
    candidate_company_id: null,
    company_name_snapshot: null,
    company_resolution_source: "missing",
    company_resolution_status: "missing",
  };
}

/**
 * Classifica a Curva ABC do Contato (Autoridade do Cargo)
 */
export function classifyContactCurve(cargo?: string | null): ContactCurve {
  if (!cargo) return "C";
  const c = cargo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const aKeywords = [
    "ceo", "cfo", "diretor", "director", "socio", "fundador", "founder", 
    "owner", "partner", "presidente", "superintendente", "vp", "vice"
  ];
  if (aKeywords.some(k => c.includes(k))) return "A";

  const bKeywords = [
    "gerente", "manager", "coordenador", "head", "advogado", "tributario", 
    "tributaria", "fiscal", "controller", "auditor", "consultor", "especialista"
  ];
  if (bKeywords.some(k => c.includes(k))) return "B";

  return "C";
}

/**
 * Calculador Determinístico de Aderência à Oportunidade (Receita Sintonia)
 */
export function calculateOpportunityScore(
  lead: LeadInput, 
  resolution: CompanyResolutionResult
): ScoreDetails {
  let opportunity_adherence_score = 0;
  let relationship_signal = 0;
  const score_reasons: string[] = [];
  const negative_reasons: string[] = [];
  const missing_data: string[] = [];

  const meta = lead.metadata || {};
  const empText = (resolution.company_name_snapshot || "").toLowerCase();
  const metaStr = JSON.stringify(meta).toLowerCase();

  // 1. Porte Médio ou Grande com evidência (+25)
  const hasPorteEvidence = meta.porte_empresa === "medio" || meta.porte_empresa === "grande" ||
    metaStr.includes("faturamento_relevante") || metaStr.includes("lucro_real") ||
    empText.includes("s.a.") || empText.includes("sa") || empText.includes("holding") ||
    empText.includes("industria") || empText.includes("brasil") || empText.includes("grupo");

  if (hasPorteEvidence) {
    opportunity_adherence_score += 25;
    score_reasons.push("+25: Porte médio/grande com evidência cadastral ou operacional");
  } else {
    missing_data.push("Evidência de Porte/Faturamento ausente");
  }

  // 2. Operação tributária relevante (+20)
  const hasTaxOperationEvidence = meta.operacao_tributaria === "relevante" ||
    metaStr.includes("icms") || metaStr.includes("pis_cofins") || metaStr.includes("lucro_real") ||
    empText.includes("distribuidora") || empText.includes("logistica") || empText.includes("usina") ||
    empText.includes("alimentos") || empText.includes("farmaceutica") || empText.includes("atacado");

  if (hasTaxOperationEvidence) {
    opportunity_adherence_score += 20;
    score_reasons.push("+20: Operação tributária de alta complexidade (ICMS/PIS/COFINS/Lucro Real)");
  } else {
    missing_data.push("Evidência de Operação Tributária ausente");
  }

  // 3. Sinal público ou histórico de complexidade fiscal (+15)
  const hasComplexitySignal = meta.complexidade_fiscal === true ||
    metaStr.includes("sintonia") || metaStr.includes("recuperacao") || metaStr.includes("contencioso") ||
    Boolean(lead.chat_history && (lead.chat_history.includes("tribut") || lead.chat_history.includes("fiscal") || lead.chat_history.includes("imposto")));

  if (hasComplexitySignal) {
    opportunity_adherence_score += 15;
    score_reasons.push("+15: Sinal de complexidade fiscal ou histórico interno de demanda tributária");
  } else {
    missing_data.push("Sinal público/histórico de demanda fiscal ausente");
  }

  // 4. Histórico de relacionamento / interação (+10) -> relationship_signal
  const hasRelationship = meta.lead_captured === true || Boolean(lead.chat_history) || 
    Boolean(lead.email && lead.email !== "sem e-mail") || Boolean(lead.telefone && lead.telefone !== "sem telefone");

  if (hasRelationship) {
    relationship_signal += 10;
    score_reasons.push("+10 (Sinal Comercial): Histórico de relacionamento, contato capturado ou interação recente");
  }

  // 5. Baixa aderência evidente (-30)
  const isLowAdherence = meta.baixa_aderencia === true ||
    metaStr.includes("microempresa") || metaStr.includes("mei") || empText.includes("mei ") ||
    empText.includes("inativa") || empText.includes("simples nacional sem operacao") ||
    metaStr.includes("concorrente");

  if (isLowAdherence) {
    opportunity_adherence_score -= 30;
    negative_reasons.push("-30: Baixa aderência evidente (microempresa, MEI ou incompatibilidade tributária)");
  }

  if (resolution.company_resolution_status !== "confirmed") {
    missing_data.push(`Vínculo de Empresa: ${resolution.company_resolution_status.toUpperCase()}`);
  }

  const contact_curve = classifyContactCurve(lead.cargo);

  return {
    opportunity_adherence_score,
    relationship_signal,
    contact_curve,
    score_reasons: [...score_reasons, ...negative_reasons],
    negative_reasons,
    missing_data,
  };
}

/**
 * Classifica a Oportunidade nos Grupos (PRIORIDADE, VALIDAR, NÃO ABORDAR)
 */
export function determineMatchStatus(
  resolution: CompanyResolutionResult,
  scoreDetails: ScoreDetails
): { match_status: TargetMatchStatus; recommended_action: string } {

  if (scoreDetails.opportunity_adherence_score < 0 || scoreDetails.negative_reasons.length > 0) {
    return {
      match_status: "NÃO ABORDAR",
      recommended_action: "Não abordar - Baixa aderência tributária corporativa evidente.",
    };
  }

  const isCompanyConfirmed = resolution.company_resolution_status === "confirmed";
  const isGoodAdherence = scoreDetails.opportunity_adherence_score >= 20;
  const isGoodContact = scoreDetails.contact_curve === "A" || scoreDetails.contact_curve === "B";

  if (isCompanyConfirmed && isGoodAdherence && isGoodContact) {
    return {
      match_status: "PRIORIDADE",
      recommended_action: `Abordar decisor (Curva ${scoreDetails.contact_curve}) para Diagnóstico Receita Sintonia com foco em recuperação/otimização fiscal.`,
    };
  }

  let reasonToValidate = "Validar dados antes de abordar:";
  if (!isCompanyConfirmed) {
    reasonToValidate += ` Confirmar vínculo de empresa (${resolution.company_resolution_status}).`;
  }
  if (scoreDetails.missing_data.length > 0) {
    reasonToValidate += ` Verificar ${scoreDetails.missing_data.join(", ")}.`;
  }

  return {
    match_status: "VALIDAR",
    recommended_action: reasonToValidate,
  };
}

/**
 * Avalia um Lead e gera o Match de Oportunidade Completo
 */
export function evaluateLeadOpportunityMatch(
  lead: LeadInput,
  opportunityId: string = "opp-receita-sintonia"
): OpportunityMatchResult {
  const resolution = resolveCompanyHierarchy(lead);
  const scoreDetails = calculateOpportunityScore(lead, resolution);
  const { match_status, recommended_action } = determineMatchStatus(resolution, scoreDetails);

  return {
    opportunity_id: opportunityId,
    lead_id: lead.id,
    lead_name: lead.nome,
    lead_cargo: lead.cargo || null,
    company_id: resolution.company_id,
    company_name_snapshot: resolution.company_name_snapshot,
    company_resolution_source: resolution.company_resolution_source,
    company_resolution_status: resolution.company_resolution_status,
    opportunity_adherence_score: scoreDetails.opportunity_adherence_score,
    relationship_signal: scoreDetails.relationship_signal,
    contact_curve: scoreDetails.contact_curve,
    score_reasons: scoreDetails.score_reasons,
    missing_data: scoreDetails.missing_data,
    recommended_action,
    match_status,
    commercial_status: "pendente",
    next_contact_at: null,
    notes: null,
    parceiro_id: lead.parceiro_id || null,
  };
}

/**
 * Recalcula o Match Preservando Edições Manuais (Notas, Status Comercial, Data Próximo Contato)
 */
export function mergeMatchWithManualEdits(
  calculatedMatch: OpportunityMatchResult,
  manualEdits?: ManualMatchEdits | null
): OpportunityMatchResult {
  if (!manualEdits) return calculatedMatch;

  return {
    ...calculatedMatch,
    commercial_status: manualEdits.commercial_status || calculatedMatch.commercial_status,
    next_contact_at: manualEdits.next_contact_at !== undefined ? manualEdits.next_contact_at : calculatedMatch.next_contact_at,
    notes: manualEdits.notes !== undefined ? manualEdits.notes : calculatedMatch.notes,
  };
}

/**
 * Salva/Atualiza o Match no Supabase Idempotentemente (Previne duplicatas por UNIQUE(opportunity_id, lead_id))
 */
export async function saveOpportunityMatchState(
  supabaseClient: any,
  match: OpportunityMatchResult,
  manualEdits?: ManualMatchEdits | null
): Promise<{ success: boolean; mode: "persisted" | "in_memory_only"; data: any; error: string | null }> {
  const mergedMatch = mergeMatchWithManualEdits(match, manualEdits);

  const payload = {
    opportunity_id: mergedMatch.opportunity_id,
    lead_id: mergedMatch.lead_id,
    company_id: mergedMatch.company_id,
    parceiro_id: mergedMatch.parceiro_id || null,
    company_name_snapshot: mergedMatch.company_name_snapshot,
    company_resolution_source: mergedMatch.company_resolution_source,
    company_resolution_status: mergedMatch.company_resolution_status,
    opportunity_adherence_score: mergedMatch.opportunity_adherence_score,
    relationship_signal: mergedMatch.relationship_signal,
    contact_curve: mergedMatch.contact_curve,
    score_reasons: mergedMatch.score_reasons,
    missing_data: mergedMatch.missing_data,
    recommended_action: mergedMatch.recommended_action,
    match_status: mergedMatch.match_status,
    commercial_status: mergedMatch.commercial_status,
    next_contact_at: mergedMatch.next_contact_at,
    notes: mergedMatch.notes,
    updated_at: new Date().toISOString(),
  };

  if (!supabaseClient) {
    return { success: false, mode: "in_memory_only", data: mergedMatch, error: "No Supabase client provided" };
  }

  try {
    const { data, error } = await supabaseClient
      .from("taxmanagers_opportunity_matches")
      .upsert(payload, { onConflict: "opportunity_id,lead_id" })
      .select();

    if (error) {
      console.warn("[saveOpportunityMatchState] Database notice (table may be pending migration):", error.message);
      return { success: false, mode: "in_memory_only", data: mergedMatch, error: error.message };
    }

    return { success: true, mode: "persisted", data: data?.[0] || mergedMatch, error: null };
  } catch (err: any) {
    return { success: false, mode: "in_memory_only", data: mergedMatch, error: err?.message || String(err) };
  }
}

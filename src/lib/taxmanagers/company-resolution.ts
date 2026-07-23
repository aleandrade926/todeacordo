export interface LeadResolutionInput {
  id: string;
  nome?: string | null;
  empresa?: string | null;
  cnpj?: string | null;
  linkedin_url?: string | null;
  company_id?: string | null;
  candidate_company_id?: string | null;
  parceiro_id?: string | null;
  status?: string | null;
  cargo?: string | null;
  metadata?: Record<string, any> | null;
  chat_history?: string | null;
}

export interface ExistingCompanyRecord {
  id: string;
  nome_fantasia?: string | null;
  razao_social?: string | null;
  cnpj?: string | null;
  domain?: string | null;
  linkedin_url?: string | null;
  parceiro_id?: string | null;
}

export type ConfidenceTier = "high" | "medium" | "low" | "none";

export interface CompanyResolutionOutcome {
  confidence: ConfidenceTier;
  company_id: string | null;
  candidate_company_id: string | null;
  company_name_snapshot: string | null;
  action_recommended: "link_confirmed" | "link_candidate" | "keep_legacy" | "require_review";
  reason: string;
}

export type EmploymentRecencyStatus =
  | "current_confirmed"
  | "current_unconfirmed"
  | "historical"
  | "retired"
  | "career_break"
  | "unemployed"
  | "transition"
  | "missing";

export type CurrentEmploymentStatus =
  | "active"
  | "inactive_or_unresolved"
  | "retired"
  | "career_break"
  | "unemployed"
  | "transition";

export interface ExperienceInput {
  company_name?: string | null;
  role?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  is_current?: boolean | null;
}

export interface EmploymentResolutionOutcome {
  current_company_name: string | null;
  current_role: string | null;
  current_employment_status: CurrentEmploymentStatus;
  current_role_started_at: string | null;
  previous_company_name: string | null;
  previous_role: string | null;
  previous_role_ended_at: string | null;
  employment_recency_status: EmploymentRecencyStatus;
  is_current_link_active: boolean;
  reason: string;
}

const INVALID_COMPANY_NAMES = [
  "autonomo", "autônoma", "autonomo", "freelancer", "desempregado", "desempregada",
  "em transicao", "em transição", "estudante", "confidencial", "nao informado",
  "não informado", "particular", "sem empresa", "n/a", "na", "null", "none"
];

export function sanitizeCNPJ(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length === 14 ? digits : null;
}

export function isInvalidCompanyName(name?: string | null): boolean {
  if (!name || !name.trim()) return true;
  const normalized = name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return INVALID_COMPANY_NAMES.includes(normalized);
}

export function detectSpecialStatus(text?: string | null): CurrentEmploymentStatus | null {
  if (!text || !text.trim()) return null;
  const normalized = text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (
    normalized.includes("aposentad") ||
    normalized.includes("retired") ||
    normalized.includes("aposentadoria") ||
    normalized.includes("retirement")
  ) {
    return "retired";
  }

  if (
    normalized.includes("pausa na carreira") ||
    normalized.includes("career break") ||
    normalized.includes("sabatic") ||
    normalized.includes("sabbath") ||
    normalized.includes("pausa profissional")
  ) {
    return "career_break";
  }

  if (
    normalized.includes("desempregad") ||
    normalized.includes("unemployed") ||
    normalized.includes("open to work") ||
    normalized.includes("em busca de recolocacao") ||
    normalized.includes("disponivel para o mercado")
  ) {
    return "unemployed";
  }

  if (
    normalized.includes("em transicao") ||
    normalized.includes("in transition") ||
    normalized.includes("transicao de carreira")
  ) {
    return "transition";
  }

  return null;
}

export function resolveEmploymentDetails(lead: any): EmploymentResolutionOutcome {
  const meta = lead.metadata || {};
  const experiences: ExperienceInput[] = Array.isArray(meta.experiences) ? meta.experiences : [];

  // 1. Identificar status especiais por metadata ou campos de texto
  const specialStatusFromMeta: CurrentEmploymentStatus | null =
    meta.current_employment_status ||
    (meta.is_retired ? "retired" : null) ||
    (meta.career_break ? "career_break" : null) ||
    (meta.unemployed ? "unemployed" : null) ||
    (meta.transition ? "transition" : null);

  const specialStatusFromText =
    detectSpecialStatus(lead.cargo) ||
    detectSpecialStatus(lead.empresa) ||
    detectSpecialStatus(lead.status) ||
    detectSpecialStatus(lead.chat_history);

  const specialStatus = specialStatusFromMeta || specialStatusFromText;

  // 2. Processar array de experiências (se fornecido)
  let activeExp: ExperienceInput | null = null;
  let pastExp: ExperienceInput | null = null;

  if (experiences.length > 0) {
    for (const exp of experiences) {
      const isPast = Boolean(exp.ended_at) || exp.is_current === false;
      const isSpecialExp = detectSpecialStatus(exp.company_name) || detectSpecialStatus(exp.role);
      
      if (!isPast && !isSpecialExp && exp.company_name && !isInvalidCompanyName(exp.company_name)) {
        if (!activeExp) activeExp = exp;
      } else if (isPast && exp.company_name && !isInvalidCompanyName(exp.company_name)) {
        if (!pastExp) pastExp = exp;
      }
    }
  }

  // 3. Checagem direta de campos de término e empresa anterior em metadata
  const directEndedAt = meta.previous_role_ended_at || meta.ended_at || null;
  const isDirectHistorical = Boolean(directEndedAt);

  let current_company_name: string | null = null;
  let current_role: string | null = null;
  let current_role_started_at: string | null = null;
  let previous_company_name: string | null = null;
  let previous_role: string | null = null;
  let previous_role_ended_at: string | null = null;

  if (activeExp) {
    current_company_name = activeExp.company_name || null;
    current_role = activeExp.role || lead.cargo || null;
    current_role_started_at = activeExp.started_at || null;

    if (pastExp) {
      previous_company_name = pastExp.company_name || null;
      previous_role = pastExp.role || null;
      previous_role_ended_at = pastExp.ended_at || null;
    } else if (meta.previous_company_name) {
      previous_company_name = meta.previous_company_name || null;
      previous_role = meta.previous_role || null;
      previous_role_ended_at = meta.previous_role_ended_at || meta.ended_at || null;
    }
  } else if (pastExp) {
    previous_company_name = pastExp.company_name || null;
    previous_role = pastExp.role || lead.cargo || null;
    previous_role_ended_at = pastExp.ended_at || null;
  } else if (isDirectHistorical || specialStatus || meta.previous_company_name) {
    previous_company_name = meta.previous_company_name || (lead.empresa && !isInvalidCompanyName(lead.empresa) ? lead.empresa : null);
    previous_role = meta.previous_role || lead.cargo || null;
    previous_role_ended_at = directEndedAt;
  } else if (lead.empresa && !isInvalidCompanyName(lead.empresa)) {
    current_company_name = lead.empresa.trim();
    current_role = lead.cargo?.trim() || null;
    current_role_started_at = meta.current_role_started_at || null;
  }

  // 4. Determinar current_employment_status & employment_recency_status
  let current_employment_status: CurrentEmploymentStatus;
  let employment_recency_status: EmploymentRecencyStatus;

  if (specialStatus) {
    current_employment_status = specialStatus;
    employment_recency_status = specialStatus;
    current_company_name = null;
    current_role = null;
  } else if (current_company_name) {
    current_employment_status = "active";
    if (lead.company_id) {
      employment_recency_status = "current_confirmed";
    } else {
      employment_recency_status = "current_unconfirmed";
    }
  } else if (previous_company_name || directEndedAt || pastExp) {
    current_employment_status = "inactive_or_unresolved";
    employment_recency_status = "historical";
  } else {
    current_employment_status = "inactive_or_unresolved";
    employment_recency_status = "missing";
  }

  const is_current_link_active = current_employment_status === "active" && Boolean(current_company_name);

  let reason = `Status de vínculo: ${employment_recency_status}.`;
  if (specialStatus === "retired") {
    const yearEnded = previous_role_ended_at ? previous_role_ended_at.slice(0, 4) : "";
    reason = `Contato aposentado; vínculo com a empresa encerrado${yearEnded ? ` em ${yearEnded}` : ""}.`;
  } else if (specialStatus === "career_break") {
    reason = "Contato em pausa na carreira; vínculo com a empresa encerrado.";
  } else if (specialStatus === "unemployed") {
    reason = "Contato desempregado / em busca de recolocação; sem vínculo ativo.";
  } else if (specialStatus === "transition") {
    reason = "Contato em transição de carreira; validar vínculo profissional atual antes de abordar.";
  } else if (employment_recency_status === "historical") {
    reason = "Vínculo profissional histórico encerrado; validar vínculo profissional atual antes de abordar.";
  }

  return {
    current_company_name,
    current_role,
    current_employment_status,
    current_role_started_at,
    previous_company_name,
    previous_role,
    previous_role_ended_at,
    employment_recency_status,
    is_current_link_active,
    reason
  };
}

export function resolveLeadCompany(
  lead: LeadResolutionInput,
  tenantCompanies: ExistingCompanyRecord[] = []
): CompanyResolutionOutcome {
  const empDetails = resolveEmploymentDetails(lead);
  
  if (!empDetails.is_current_link_active) {
    return {
      confidence: "none",
      company_id: null,
      candidate_company_id: null,
      company_name_snapshot: null,
      action_recommended: "require_review",
      reason: empDetails.reason
    };
  }

  const cnpjClean = sanitizeCNPJ(lead.cnpj);
  const rawName = empDetails.current_company_name || lead.empresa?.trim() || null;

  // 1. Alta confiança: Vínculo exato por CNPJ no mesmo tenant
  if (cnpjClean) {
    const matched = tenantCompanies.find(c => c.cnpj && sanitizeCNPJ(c.cnpj) === cnpjClean);
    if (matched) {
      return {
        confidence: "high",
        company_id: matched.id,
        candidate_company_id: null,
        company_name_snapshot: matched.nome_fantasia || matched.razao_social || rawName,
        action_recommended: "link_confirmed",
        reason: "CNPJ совпада com empresa confirmada do mesmo tenant."
      };
    }
  }

  // 2. Se já possui company_id preenchido
  if (lead.company_id) {
    const existing = tenantCompanies.find(c => c.id === lead.company_id);
    return {
      confidence: "high",
      company_id: lead.company_id,
      candidate_company_id: null,
      company_name_snapshot: existing?.nome_fantasia || rawName || "Empresa Confirmada",
      action_recommended: "link_confirmed",
      reason: "company_id já associado formalmente."
    };
  }

  // 3. Se possui candidate_company_id preenchido
  if (lead.candidate_company_id) {
    const candidate = tenantCompanies.find(c => c.id === lead.candidate_company_id);
    return {
      confidence: "medium",
      company_id: null,
      candidate_company_id: lead.candidate_company_id,
      company_name_snapshot: candidate?.nome_fantasia || rawName || "Empresa Candidata",
      action_recommended: "link_candidate",
      reason: "candidate_company_id associado para validação posterior."
    };
  }

  // 4. Nome textual legado isolado
  if (rawName && !isInvalidCompanyName(rawName)) {
    return {
      confidence: "low",
      company_id: null,
      candidate_company_id: null,
      company_name_snapshot: rawName,
      action_recommended: "keep_legacy",
      reason: "Nome de empresa textual mantido sem vinculo formal."
    };
  }

  return {
    confidence: "none",
    company_id: null,
    candidate_company_id: null,
    company_name_snapshot: null,
    action_recommended: "require_review",
    reason: "Sem informações de empresa."
  };
}

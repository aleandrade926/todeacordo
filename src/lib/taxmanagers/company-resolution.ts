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

export function resolveLeadCompany(
  lead: LeadResolutionInput,
  tenantCompanies: ExistingCompanyRecord[] = []
): CompanyResolutionOutcome {
  const cnpjClean = sanitizeCNPJ(lead.cnpj);
  const rawName = lead.empresa?.trim() || null;

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

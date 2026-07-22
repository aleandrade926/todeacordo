export type CompanyResolutionStatus =
  | "resolved_auto"
  | "resolved_manual"
  | "pending_review"
  | "unresolved_low_confidence"
  | "invalid_name";

export type CompanyConfidence = "unknown" | "high" | "medium" | "low" | "none";

export interface CompanyRecord {
  id: string;
  parceiro_id: string;
  display_name: string;
  normalized_name: string;
  cnpj?: string | null;
  domain?: string | null;
  linkedin_url?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface CompanyResolutionInput {
  partnerId: string;
  companyName: string;
  cnpj?: string | null;
  corporateLinkedinUrl?: string | null;
  corporateDomain?: string | null;
  city?: string | null;
  state?: string | null;
  source: "linkedin_import" | "manual";
}

export interface CompanyCreationProposal {
  parceiro_id: string;
  display_name: string;
  normalized_name: string;
  source: "import" | "manual";
  status: "active";
  data_confidence: "high";
  review_status: "unreviewed";
  cnpj: string | null;
  domain: string | null;
  linkedin_url: string | null;
  city: string | null;
  state: string | null;
}

export interface CompanyResolution {
  company_id: string | null;
  candidate_company_id: string | null;
  company_resolution_status: CompanyResolutionStatus;
  company_resolution_reason: string;
  company_confidence: CompanyConfidence;
  company_evidence: Record<string, unknown>;
  human_confirmation_required: boolean;
  create_company: CompanyCreationProposal | null;
}

const INVALID_COMPANY_NAMES = new Set([
  "autonomo",
  "confidencial",
  "desempregado",
  "em transicao",
]);

export function normalizeCompanyText(value?: string | null): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeCnpj(value?: string | null): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 14 ? digits : null;
}

export function isValidCnpj(value?: string | null): boolean {
  const digits = normalizeCnpj(value);
  if (!digits || /^(\d)\1{13}$/.test(digits)) return false;

  const calculateDigit = (base: string, weights: number[]) => {
    const sum = base.split("").reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const first = calculateDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calculateDigit(digits.slice(0, 12) + first, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits.endsWith(`${first}${second}`);
}

export function canonicalizeDomain(value?: string | null): string | null {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return null;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export function canonicalizeCorporateLinkedin(value?: string | null): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const match = url.pathname.match(/^\/company\/([^/?#]+)\/?$/i);
    if (host !== "linkedin.com" || !match?.[1]) return null;
    return `https://linkedin.com/company/${match[1].toLowerCase()}`;
  } catch {
    return null;
  }
}

function compatibleNames(left: string, right: string): boolean {
  if (!left || !right) return false;
  if (left === right) return true;
  const shorter = left.length <= right.length ? left : right;
  const longer = left.length > right.length ? left : right;
  return shorter.length >= 5 && longer.includes(shorter);
}

function uniqueCompanies(companies: CompanyRecord[]): CompanyRecord[] {
  return [...new Map(companies.map(company => [company.id, company])).values()];
}

export function resolveCompanyForNewContact(
  input: CompanyResolutionInput,
  availableCompanies: CompanyRecord[],
): CompanyResolution {
  const normalizedName = normalizeCompanyText(input.companyName);
  const validCnpj = isValidCnpj(input.cnpj) ? normalizeCnpj(input.cnpj) : null;
  const linkedinUrl = canonicalizeCorporateLinkedin(input.corporateLinkedinUrl);
  const domain = canonicalizeDomain(input.corporateDomain);
  const city = normalizeCompanyText(input.city);
  const state = normalizeCompanyText(input.state);
  const tenantCompanies = availableCompanies.filter(company => company.parceiro_id === input.partnerId);
  const evidence = {
    source: input.source,
    company_name: input.companyName || null,
    normalized_name: normalizedName || null,
    cnpj: validCnpj,
    corporate_linkedin_url: linkedinUrl,
    corporate_domain: domain,
    city: city || null,
    state: state || null,
  };

  if (!normalizedName || INVALID_COMPANY_NAMES.has(normalizedName)) {
    return {
      company_id: null,
      candidate_company_id: null,
      company_resolution_status: "invalid_name",
      company_resolution_reason: normalizedName ? `invalid_company_name:${normalizedName}` : "missing_company_name",
      company_confidence: "none",
      company_evidence: evidence,
      human_confirmation_required: false,
      create_company: null,
    };
  }

  const strongMatches = uniqueCompanies(tenantCompanies.filter(company => {
    const companyCnpj = normalizeCnpj(company.cnpj);
    const companyLinkedin = canonicalizeCorporateLinkedin(company.linkedin_url);
    return (validCnpj && companyCnpj === validCnpj) || (linkedinUrl && companyLinkedin === linkedinUrl);
  }));

  if (strongMatches.length === 1) {
    return {
      company_id: strongMatches[0].id,
      candidate_company_id: null,
      company_resolution_status: "resolved_auto",
      company_resolution_reason: validCnpj ? "exact_valid_cnpj_match" : "exact_corporate_linkedin_match",
      company_confidence: "high",
      company_evidence: evidence,
      human_confirmation_required: false,
      create_company: null,
    };
  }

  if (strongMatches.length > 1) {
    return {
      company_id: null,
      candidate_company_id: null,
      company_resolution_status: "pending_review",
      company_resolution_reason: "conflicting_strong_identifiers",
      company_confidence: "medium",
      company_evidence: { ...evidence, matching_company_ids: strongMatches.map(company => company.id) },
      human_confirmation_required: true,
      create_company: null,
    };
  }

  if (validCnpj || linkedinUrl) {
    return {
      company_id: null,
      candidate_company_id: null,
      company_resolution_status: "resolved_auto",
      company_resolution_reason: "validated_strong_identifier_requires_company_creation",
      company_confidence: "high",
      company_evidence: evidence,
      human_confirmation_required: false,
      create_company: {
        parceiro_id: input.partnerId,
        display_name: input.companyName.trim(),
        normalized_name: normalizedName,
        source: input.source === "manual" ? "manual" : "import",
        status: "active",
        data_confidence: "high",
        review_status: "unreviewed",
        cnpj: validCnpj,
        domain,
        linkedin_url: linkedinUrl,
        city: city || null,
        state: state || null,
      },
    };
  }

  const mediumMatches = uniqueCompanies(tenantCompanies.filter(company => {
    const companyName = normalizeCompanyText(company.normalized_name || company.display_name);
    const companyDomain = canonicalizeDomain(company.domain);
    const companyCity = normalizeCompanyText(company.city);
    const companyState = normalizeCompanyText(company.state);
    const domainAndName = Boolean(domain && companyDomain === domain && compatibleNames(normalizedName, companyName));
    const nameAndLocation = Boolean(city && state && normalizedName === companyName && city === companyCity && state === companyState);
    return domainAndName || nameAndLocation;
  }));

  if (domain || (city && state)) {
    if (mediumMatches.length === 1) {
      return {
        company_id: null,
        candidate_company_id: mediumMatches[0].id,
        company_resolution_status: "pending_review",
        company_resolution_reason: domain ? "domain_and_compatible_name_match" : "exact_name_city_state_match",
        company_confidence: "medium",
        company_evidence: evidence,
        human_confirmation_required: true,
        create_company: null,
      };
    }

    return {
      company_id: null,
      candidate_company_id: null,
      company_resolution_status: "pending_review",
      company_resolution_reason: mediumMatches.length > 1
        ? "ambiguous_medium_confidence_matches"
        : "medium_evidence_without_existing_company",
      company_confidence: "medium",
      company_evidence: {
        ...evidence,
        matching_company_ids: mediumMatches.map(company => company.id),
      },
      human_confirmation_required: true,
      create_company: null,
    };
  }

  return {
    company_id: null,
    candidate_company_id: null,
    company_resolution_status: "unresolved_low_confidence",
    company_resolution_reason: "company_name_only",
    company_confidence: "low",
    company_evidence: evidence,
    human_confirmation_required: false,
    create_company: null,
  };
}

export function resolutionFields(resolution: CompanyResolution) {
  return {
    company_id: resolution.company_id,
    candidate_company_id: resolution.candidate_company_id,
    company_resolution_status: resolution.company_resolution_status,
    company_resolution_reason: resolution.company_resolution_reason,
    company_confidence: resolution.company_confidence,
    company_evidence: resolution.company_evidence,
    human_confirmation_required: resolution.human_confirmation_required,
  };
}

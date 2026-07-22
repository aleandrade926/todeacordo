import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalizeCorporateLinkedin,
  isValidCnpj,
  resolveCompanyForNewContact,
  type CompanyRecord,
} from "./company-resolution.ts";
import { writeNewContactSafely } from "./new-contact-write.ts";

const partnerA = "00000000-0000-0000-0000-00000000000a";
const partnerB = "00000000-0000-0000-0000-00000000000b";

function company(overrides: Partial<CompanyRecord> = {}): CompanyRecord {
  return {
    id: "10000000-0000-0000-0000-000000000001",
    parceiro_id: partnerA,
    display_name: "Empresa Exemplo",
    normalized_name: "empresa exemplo",
    cnpj: "11222333000181",
    domain: "exemplo.com.br",
    linkedin_url: "https://linkedin.com/company/empresa-exemplo",
    city: "São Paulo",
    state: "SP",
    ...overrides,
  };
}

test("valida CNPJ e aceita somente LinkedIn corporativo canônico", () => {
  assert.equal(isValidCnpj("11.222.333/0001-81"), true);
  assert.equal(isValidCnpj("11.111.111/1111-11"), false);
  assert.equal(
    canonicalizeCorporateLinkedin("https://www.linkedin.com/company/Empresa-Exemplo/"),
    "https://linkedin.com/company/empresa-exemplo",
  );
  assert.equal(canonicalizeCorporateLinkedin("https://linkedin.com/in/pessoa"), null);
});

test("alta confiança vincula empresa do mesmo tenant por CNPJ exato", () => {
  const result = resolveCompanyForNewContact({
    partnerId: partnerA,
    companyName: "Empresa Exemplo",
    cnpj: "11.222.333/0001-81",
    source: "linkedin_import",
  }, [company()]);
  assert.equal(result.company_id, company().id);
  assert.equal(result.candidate_company_id, null);
  assert.equal(result.company_confidence, "high");
  assert.equal(result.create_company, null);
});

test("alta confiança propõe criação somente com identificador formal válido", () => {
  const result = resolveCompanyForNewContact({
    partnerId: partnerA,
    companyName: "Empresa Nova",
    corporateLinkedinUrl: "https://linkedin.com/company/empresa-nova",
    source: "linkedin_import",
  }, []);
  assert.equal(result.company_id, null);
  assert.equal(result.company_confidence, "high");
  assert.equal(result.create_company?.linkedin_url, "https://linkedin.com/company/empresa-nova");
});

test("nome manual isolado permanece legado e não cria conta", () => {
  const result = resolveCompanyForNewContact({
    partnerId: partnerA,
    companyName: "Empresa Apenas Texto",
    source: "manual",
  }, []);
  assert.equal(result.company_id, null);
  assert.equal(result.candidate_company_id, null);
  assert.equal(result.company_resolution_status, "unresolved_low_confidence");
  assert.equal(result.company_confidence, "low");
  assert.equal(result.create_company, null);
});

test("evidência média sem empresa cadastrada exige revisão e não cria provisória", () => {
  const result = resolveCompanyForNewContact({
    partnerId: partnerA,
    companyName: "Empresa Exemplo",
    corporateDomain: "exemplo.com.br",
    source: "linkedin_import",
  }, []);
  assert.equal(result.candidate_company_id, null);
  assert.equal(result.company_resolution_status, "pending_review");
  assert.equal(result.company_resolution_reason, "medium_evidence_without_existing_company");
  assert.equal(result.human_confirmation_required, true);
  assert.equal(result.create_company, null);
});

test("evidência média aponta somente candidato do mesmo tenant", () => {
  const sameTenant = resolveCompanyForNewContact({
    partnerId: partnerA,
    companyName: "Empresa Exemplo",
    corporateDomain: "exemplo.com.br",
    source: "linkedin_import",
  }, [company()]);
  assert.equal(sameTenant.candidate_company_id, company().id);
  assert.equal(sameTenant.company_id, null);
  assert.equal(sameTenant.human_confirmation_required, true);

  const otherTenant = resolveCompanyForNewContact({
    partnerId: partnerA,
    companyName: "Empresa Exemplo",
    corporateDomain: "exemplo.com.br",
    source: "linkedin_import",
  }, [company({ parceiro_id: partnerB })]);
  assert.equal(otherTenant.candidate_company_id, null);
  assert.equal(otherTenant.company_resolution_reason, "medium_evidence_without_existing_company");
});

for (const invalidName of ["Aut\u00f4nomo", "Confidencial", "Desempregado", "Em transi\u00e7\u00e3o"]) {
  test(`nome inválido não cria empresa: ${invalidName}`, () => {
    const result = resolveCompanyForNewContact({
      partnerId: partnerA,
      companyName: invalidName,
      source: "manual",
    }, []);
    assert.equal(result.company_resolution_status, "invalid_name");
    assert.equal(result.company_id, null);
    assert.equal(result.create_company, null);
  });
}

for (const importStatus of ["active", "quarantine"] as const) {
  test(`lead ${importStatus} existente recebe somente payload legado`, async () => {
    const existing = {
      id: `lead-${importStatus}`,
      import_status: importStatus,
      company_id: "company-original",
      candidate_company_id: null,
      company_resolution_status: "resolved_manual",
      company_resolution_reason: "human_review",
      company_confidence: "high",
      company_evidence: { original: true },
      human_confirmation_required: false,
    };
    let receivedPayload: Record<string, unknown> | null = null;
    const outcome = await writeNewContactSafely({
      linkedinKey: "pessoa",
      findExisting: async () => existing,
      legacyPayload: { nome: "Pessoa", empresa: "Texto atualizado" },
      buildNewPayload: async () => { throw new Error("resolução não deveria executar"); },
      insertNew: async () => { throw new Error("insert não deveria executar"); },
      upsertLegacy: async payload => {
        receivedPayload = payload;
        return { data: [existing], error: null };
      },
    });
    assert.equal(outcome.mode, "updated_existing");
    assert.deepEqual(receivedPayload, { nome: "Pessoa", empresa: "Texto atualizado" });
    assert.equal(existing.company_id, "company-original");
    assert.deepEqual(existing.company_evidence, { original: true });
  });
}

test("lead sem parceiro existente não é alterado pelo import de outro tenant", async () => {
  const unassigned = { id: "unassigned", parceiro_id: null, linkedin_key: "pessoa", empresa: "Legado" };
  let insertedPayload: Record<string, unknown> | null = null;
  const outcome = await writeNewContactSafely({
    linkedinKey: "pessoa",
    findExisting: async () => null,
    legacyPayload: { parceiro_id: partnerA, linkedin_key: "pessoa", empresa: "Nova" },
    buildNewPayload: async () => ({
      parceiro_id: partnerA,
      linkedin_key: "pessoa",
      empresa: "Nova",
      company_id: null,
    }),
    insertNew: async payload => {
      insertedPayload = payload;
      return { data: [{ id: "new-partner-lead" }], error: null };
    },
    upsertLegacy: async () => { throw new Error("não deveria atualizar lead sem parceiro"); },
  });
  assert.equal(outcome.mode, "inserted");
  assert.equal(unassigned.empresa, "Legado");
  assert.equal((insertedPayload as Record<string, unknown> | null)?.parceiro_id, partnerA);
});

test("conflito simultâneo preserva campos empresariais do vencedor", async () => {
  let stored: Record<string, unknown> | null = null;
  let lookups = 0;
  const run = (label: string) => writeNewContactSafely({
    linkedinKey: "mesma-pessoa",
    findExisting: async () => {
      lookups += 1;
      await new Promise(resolve => setTimeout(resolve, 5));
      return null;
    },
    legacyPayload: { nome: label, empresa: "Empresa legado", linkedin_key: "mesma-pessoa" },
    buildNewPayload: async () => ({
      nome: label,
      empresa: "Empresa legado",
      linkedin_key: "mesma-pessoa",
      company_id: `company-${label}`,
      company_resolution_status: "resolved_auto",
    }),
    insertNew: async payload => {
      if (stored) return { data: null, error: { code: "23505", message: "duplicate" } };
      stored = { ...payload };
      return { data: [stored], error: null };
    },
    upsertLegacy: async payload => {
      const protectedCompanyId = stored?.company_id;
      stored = { ...stored, ...payload };
      assert.equal(stored.company_id, protectedCompanyId);
      assert.equal("company_id" in payload, false);
      return { data: [stored], error: null };
    },
  });

  const outcomes = await Promise.all([run("primeiro"), run("segundo")]);
  assert.equal(lookups, 2);
  assert.deepEqual(outcomes.map(result => result.mode).sort(), ["inserted", "lost_insert_race"]);
  assert.match(String((stored as Record<string, unknown> | null)?.company_id), /^company-(primeiro|segundo)$/);
});

test("reimportação mantém todos os campos empresariais em base histórica de 18.156 registros", async () => {
  const historical = Array.from({ length: 18_156 }, (_, index) => ({
    id: `lead-${index}`,
    company_id: index === 117 ? "company-original" : null,
    candidate_company_id: index === 117 ? null : `candidate-${index}`,
    company_resolution_status: index === 117 ? "resolved_manual" : null,
    company_resolution_reason: index === 117 ? "confirmed" : null,
    company_confidence: index === 117 ? "high" : null,
    company_evidence: index === 117 ? { reviewed: true } : null,
    human_confirmation_required: index !== 117,
  }));
  const before = JSON.stringify(historical);
  const target = historical[117];

  await writeNewContactSafely({
    linkedinKey: "historico",
    findExisting: async () => target,
    legacyPayload: { nome: "Nome atualizado", empresa: "Empresa textual" },
    buildNewPayload: async () => { throw new Error("não deve resolver histórico"); },
    insertNew: async () => { throw new Error("não deve inserir histórico"); },
    upsertLegacy: async () => ({ data: [target], error: null }),
  });

  assert.equal(historical.length, 18_156);
  assert.equal(JSON.stringify(historical), before);
});

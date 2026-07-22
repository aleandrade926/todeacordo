import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateLeadOpportunityMatch,
  resolveCompanyHierarchy,
  mergeMatchWithManualEdits,
  saveOpportunityMatchState,
  type LeadInput
} from "./opportunity-engine.ts";

test("CENÁRIO 1: Lead com company_id confirmado", () => {
  const lead: LeadInput = {
    id: "lead-1",
    nome: "Carlos Silva",
    cargo: "CFO",
    company_id: "comp-uuid-100",
    empresa: "Indústrias Matarazzo S.A.",
    metadata: { porte_empresa: "grande", operacao_tributaria: "relevante" }
  };

  const resolution = resolveCompanyHierarchy(lead);
  assert.equal(resolution.company_resolution_source, "company_id");
  assert.equal(resolution.company_resolution_status, "confirmed");
  assert.equal(resolution.company_id, "comp-uuid-100");

  const match = evaluateLeadOpportunityMatch(lead);
  assert.equal(match.match_status, "PRIORIDADE");
  assert.equal(match.contact_curve, "A");
  assert.equal(match.opportunity_adherence_score, 45); // +25 porte +20 operacao
  assert.equal(match.company_resolution_status, "confirmed");
});

test("CENÁRIO 2: Lead com candidate_company_id (candidata não confirmada)", () => {
  const lead: LeadInput = {
    id: "lead-2",
    nome: "Mariana Costa",
    cargo: "Controller",
    candidate_company_id: "comp-candidate-200",
    empresa: "Distribuidora de Bebidas Alfa",
    metadata: { operacao_tributaria: "relevante" }
  };

  const resolution = resolveCompanyHierarchy(lead);
  assert.equal(resolution.company_resolution_source, "candidate_company_id");
  assert.equal(resolution.company_resolution_status, "candidate");
  assert.equal(resolution.company_id, null);
  assert.equal(resolution.candidate_company_id, "comp-candidate-200");

  const match = evaluateLeadOpportunityMatch(lead);
  assert.equal(match.match_status, "VALIDAR");
  assert.equal(match.contact_curve, "B");
});

test("CENÁRIO 3: Lead apenas com empresa textual legada (sem vínculos)", () => {
  const lead: LeadInput = {
    id: "lead-3",
    nome: "Roberto Alves",
    cargo: "Diretor Fiscal",
    empresa: "Construtora Omega LTDA",
    metadata: { complexidade_fiscal: true }
  };

  const resolution = resolveCompanyHierarchy(lead);
  assert.equal(resolution.company_resolution_source, "legacy_text");
  assert.equal(resolution.company_resolution_status, "unresolved");
  assert.equal(resolution.company_name_snapshot, "Construtora Omega LTDA");
  assert.equal(resolution.company_id, null);
  assert.equal(resolution.candidate_company_id, null);

  const match = evaluateLeadOpportunityMatch(lead);
  assert.equal(match.match_status, "VALIDAR");
  assert.ok(match.missing_data.some(d => d.includes("UNRESOLVED")));
});

test("CENÁRIO 4: Lead sem informação de empresa (missing)", () => {
  const lead: LeadInput = {
    id: "lead-4",
    nome: "Fernanda Lima",
    cargo: "Gerente Tributário"
  };

  const resolution = resolveCompanyHierarchy(lead);
  assert.equal(resolution.company_resolution_source, "missing");
  assert.equal(resolution.company_resolution_status, "missing");
  assert.equal(resolution.company_name_snapshot, null);

  const match = evaluateLeadOpportunityMatch(lead);
  assert.equal(match.match_status, "VALIDAR");
  assert.equal(match.company_resolution_status, "missing");
});

test("VALIDAÇÃO DE PONTUAÇÃO: Curva ABC e Cargo NÃO afetam o Opportunity Adherence Score", () => {
  const leadSemCargo: LeadInput = {
    id: "lead-5",
    nome: "Analista Anônimo",
    cargo: null,
    company_id: "comp-555",
    empresa: "Grupo Alimentos S.A.",
    metadata: { porte_empresa: "grande", operacao_tributaria: "relevante" }
  };

  const match = evaluateLeadOpportunityMatch(leadSemCargo);
  assert.equal(match.contact_curve, "C");
  assert.equal(match.opportunity_adherence_score, 45);
  assert.equal("opportunity_adherence_score" in match, true);
  assert.equal("relationship_signal" in match, true);
  assert.equal("contact_curve" in match, true);
});

test("VALIDAÇÃO DE NÃO ABORDAR: Baixa aderência evidente gera penalidade -30", () => {
  const leadMicro: LeadInput = {
    id: "lead-6",
    nome: "João Micro",
    cargo: "Sócio",
    empresa: "Lanchonete do João MEI",
    metadata: { baixa_aderencia: true }
  };

  const match = evaluateLeadOpportunityMatch(leadMicro);
  assert.equal(match.match_status, "NÃO ABORDAR");
  assert.ok(match.opportunity_adherence_score <= -30);
});

test("PRESERVAÇÃO DE DADOS MANUAIS NO RECÁLCULO DO MATCH", () => {
  const lead: LeadInput = {
    id: "lead-7",
    nome: "Paulo Souza",
    cargo: "CFO",
    company_id: "comp-777",
    empresa: "Empresa S.A.",
    metadata: { porte_empresa: "grande" }
  };

  const initialMatch = evaluateLeadOpportunityMatch(lead);
  const manualEdits = {
    commercial_status: "reuniao_marcada" as const,
    next_contact_at: "2026-08-01",
    notes: "Cliente confirmou interesse na reunião de demonstração."
  };

  const merged = mergeMatchWithManualEdits(initialMatch, manualEdits);

  assert.equal(merged.commercial_status, "reuniao_marcada");
  assert.equal(merged.next_contact_at, "2026-08-01");
  assert.equal(merged.notes, "Cliente confirmou interesse na reunião de demonstração.");
  // Score calculados continuam íntegros
  assert.equal(merged.opportunity_adherence_score, 25);
  assert.equal(merged.match_status, "PRIORIDADE");
});

test("SAVE MATCH HANDLER: Fallback seguro quando banco está pendente de migration", async () => {
  const lead: LeadInput = {
    id: "lead-8",
    nome: "Ana Beatriz",
    cargo: "Controller",
    empresa: "Empresa Teste LTDA"
  };
  const match = evaluateLeadOpportunityMatch(lead);

  // Sem cliente Supabase -> deve retornar in_memory_only sem lançar erro
  const result = await saveOpportunityMatchState(null, match, { notes: "Nota local" });

  assert.equal(result.success, false);
  assert.equal(result.mode, "in_memory_only");
  assert.equal(result.data.notes, "Nota local");
});

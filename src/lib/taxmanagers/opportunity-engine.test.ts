import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateLeadOpportunityMatch,
  resolveCompanyHierarchy,
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
  assert.equal(match.opportunity_adherence_score, 45);
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

  const match = evaluateLeadOpportunityMatch(lead);
  assert.equal(match.match_status, "VALIDAR");
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

  const match = evaluateLeadOpportunityMatch(lead);
  assert.equal(match.match_status, "VALIDAR");
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
});

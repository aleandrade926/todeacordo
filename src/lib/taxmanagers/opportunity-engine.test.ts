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

// ============================================================================
// TESTES OBRIGATÓRIOS DE VÍNCULO PROFISSIONAL ATUAL (REGRA 9)
// ============================================================================

test("REGRA DE VÍNCULO 1: experiência sem data final = atual", () => {
  const lead: LeadInput = {
    id: "test-exp-1",
    nome: "João Silva",
    cargo: "Diretor Financeiro",
    empresa: "Empresa Atual Ltda",
    metadata: {
      experiences: [
        {
          company_name: "Empresa Atual Ltda",
          role: "Diretor Financeiro",
          started_at: "2023-01",
          ended_at: null,
          is_current: true
        }
      ]
    }
  };

  const match = evaluateLeadOpportunityMatch(lead);
  assert.equal(match.current_company_name, "Empresa Atual Ltda");
  assert.equal(match.current_role, "Diretor Financeiro");
  assert.equal(match.current_employment_status, "active");
  assert.equal(match.employment_recency_status, "current_unconfirmed");
});

test("REGRA DE VÍNCULO 2: experiência com data final = histórica", () => {
  const lead: LeadInput = {
    id: "test-exp-2",
    nome: "Maria Souza",
    cargo: "Gerente Fiscal",
    empresa: "Empresa Antiga S.A.",
    metadata: {
      experiences: [
        {
          company_name: "Empresa Antiga S.A.",
          role: "Gerente Fiscal",
          started_at: "2019-01",
          ended_at: "2022-05",
          is_current: false
        }
      ]
    }
  };

  const match = evaluateLeadOpportunityMatch(lead);
  assert.equal(match.current_company_name, null);
  assert.equal(match.current_role, null);
  assert.equal(match.previous_company_name, "Empresa Antiga S.A.");
  assert.equal(match.previous_role, "Gerente Fiscal");
  assert.equal(match.previous_role_ended_at, "2022-05");
  assert.equal(match.current_employment_status, "inactive_or_unresolved");
  assert.equal(match.employment_recency_status, "historical");
});

test("REGRA DE VÍNCULO 3: aposentadoria posterior à última empresa = aposentado", () => {
  const lead: LeadInput = {
    id: "test-exp-3",
    nome: "Pedro Santos",
    cargo: "CFO (Aposentado)",
    empresa: "Banco Antigo S.A.",
    metadata: {
      previous_company_name: "Banco Antigo S.A.",
      previous_role: "CFO",
      previous_role_ended_at: "2021-12",
      is_retired: true
    }
  };

  const match = evaluateLeadOpportunityMatch(lead);
  assert.equal(match.current_company_name, null);
  assert.equal(match.current_role, null);
  assert.equal(match.current_employment_status, "retired");
  assert.equal(match.employment_recency_status, "retired");
  assert.equal(match.previous_company_name, "Banco Antigo S.A.");
  assert.equal(match.previous_role_ended_at, "2021-12");
  assert.equal(match.match_status, "NÃO ABORDAR");
});

test("REGRA DE VÍNCULO 4: pausa na carreira = não tratar empresa anterior como atual", () => {
  const lead: LeadInput = {
    id: "test-exp-4",
    nome: "Ana Oliveira",
    cargo: "Pausa na Carreira / Sabático",
    empresa: "Consultoria Anterior LTDA",
    metadata: {
      career_break: true,
      ended_at: "2023-02"
    }
  };

  const match = evaluateLeadOpportunityMatch(lead);
  assert.equal(match.current_company_name, null);
  assert.equal(match.previous_company_name, "Consultoria Anterior LTDA");
  assert.equal(match.current_employment_status, "career_break");
  assert.equal(match.employment_recency_status, "career_break");
  assert.equal(match.match_status, "NÃO ABORDAR");
});

test("REGRA DE VÍNCULO 5: troca de empresa = usar somente vínculo mais recente ainda ativo", () => {
  const lead: LeadInput = {
    id: "test-exp-5",
    nome: "Lucas Mendes",
    cargo: "VP de Finanças",
    empresa: "Empresa Nova S.A.",
    metadata: {
      experiences: [
        {
          company_name: "Empresa Velha LTDA",
          role: "Gerente Financeiro",
          started_at: "2015-01",
          ended_at: "2021-11",
          is_current: false
        },
        {
          company_name: "Empresa Nova S.A.",
          role: "VP de Finanças",
          started_at: "2021-12",
          ended_at: null,
          is_current: true
        }
      ]
    }
  };

  const match = evaluateLeadOpportunityMatch(lead);
  assert.equal(match.current_company_name, "Empresa Nova S.A.");
  assert.equal(match.current_role, "VP de Finanças");
  assert.equal(match.previous_company_name, "Empresa Velha LTDA");
  assert.equal(match.previous_role_ended_at, "2021-11");
  assert.equal(match.current_employment_status, "active");
});

test("REGRA DE VÍNCULO 6: não gerar mensagem dirigida à empresa histórica", () => {
  const leadHistorico: LeadInput = {
    id: "test-exp-6",
    nome: "Patricia Lima",
    cargo: "Ex-Controller",
    empresa: "Indústria Histórica S.A.",
    metadata: {
      ended_at: "2022-01",
      unemployed: true
    }
  };

  const match = evaluateLeadOpportunityMatch(leadHistorico);
  assert.equal(match.current_company_name, null);
  assert.equal(match.current_employment_status, "unemployed");
  assert.equal(match.match_status, "NÃO ABORDAR");
  assert.equal(match.recommended_action.includes("sem vínculo ativo"), true);
});

test("CASO AMARAL RIBEIRO: Amaral Ribeiro não pode aparecer como Controller atual da Komax", () => {
  const leadAmaral: LeadInput = {
    id: "lead-amaral-ribeiro",
    nome: "Amaral Ribeiro",
    cargo: "Controller",
    empresa: "Komax Testing Brasil Ltda.",
    metadata: {
      previous_company_name: "Komax Testing Brasil Ltda.",
      previous_role: "Controller",
      previous_role_ended_at: "2022-10",
      is_retired: true
    }
  };

  const match = evaluateLeadOpportunityMatch(leadAmaral);

  // Asserções conforme a regra 8 fornecida pelo usuário
  assert.equal(match.current_company_name, null);
  assert.equal(match.current_role, null);
  assert.equal(match.current_employment_status, "retired");
  assert.equal(match.previous_company_name, "Komax Testing Brasil Ltda.");
  assert.equal(match.previous_role, "Controller");
  assert.equal(match.previous_role_ended_at, "2022-10");
  assert.equal(match.employment_recency_status, "retired");
  assert.equal(match.match_status, "NÃO ABORDAR");
  assert.equal(
    match.recommended_action,
    "Contato aposentado; vínculo com a empresa encerrado em 2022."
  );
});

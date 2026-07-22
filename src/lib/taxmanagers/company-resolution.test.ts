import assert from "node:assert/strict";
import test from "node:test";
import { resolveLeadCompany, sanitizeCNPJ, isInvalidCompanyName } from "./company-resolution.ts";

test("valida CNPJ e aceita somente LinkedIn corporativo canônico", () => {
  assert.equal(sanitizeCNPJ("12.345.678/0001-90"), "12345678000190");
  assert.equal(sanitizeCNPJ("invalid"), null);
});

test("nome invalido nao cria empresa: Autonomo", () => {
  assert.equal(isInvalidCompanyName("Autônomo"), true);
  assert.equal(isInvalidCompanyName("Confidencial"), true);
  assert.equal(isInvalidCompanyName("Empresa Real S.A."), false);
});

test("alta confianca vincula empresa do mesmo tenant por CNPJ exato", () => {
  const outcome = resolveLeadCompany(
    { id: "1", cnpj: "12345678000190", empresa: "Alfa LTDA" },
    [{ id: "comp-1", cnpj: "12345678000190", nome_fantasia: "Alfa S.A." }]
  );
  assert.equal(outcome.confidence, "high");
  assert.equal(outcome.company_id, "comp-1");
});

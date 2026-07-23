import assert from "node:assert/strict";
import test from "node:test";

import {
  getSavedActiveTab,
  getSavedFrutaBaixaSubTab,
  getSavedOpportunityGroup,
  getSavedOpportunityFilter,
  STORAGE_KEYS
} from "./navigation-state.ts";

test("TESTE F5 1 & 2: abrir Oportunidades e confirmar permanencia", () => {
  const customStorage = { [STORAGE_KEYS.ACTIVE_TAB]: "fruta_baixa", [STORAGE_KEYS.FRUTA_BAIXA_SUBTAB]: "oportunidade" };
  assert.equal(getSavedActiveTab(undefined, customStorage), "fruta_baixa");
  assert.equal(getSavedFrutaBaixaSubTab(undefined, customStorage), "oportunidade");
});

test("TESTE F5 3 & 4: abrir VALIDAR e confirmar permanencia em VALIDAR", () => {
  const customStorage = { [STORAGE_KEYS.OPPORTUNITY_GROUP]: "VALIDAR" };
  assert.equal(getSavedOpportunityGroup(undefined, customStorage), "VALIDAR");

  const customUrl = "http://localhost/painel?tab=fruta_baixa&subtab=oportunidade&grupo=VALIDAR";
  assert.equal(getSavedOpportunityGroup(customUrl), "VALIDAR");
});

test("TESTE F5 5 & 6: abrir PRIORIDADE e confirmar permanencia em PRIORIDADE", () => {
  const customStorage = { [STORAGE_KEYS.OPPORTUNITY_GROUP]: "PRIORIDADE" };
  assert.equal(getSavedOpportunityGroup(undefined, customStorage), "PRIORIDADE");

  const customUrl = "http://localhost/painel?tab=fruta_baixa&subtab=oportunidade&grupo=PRIORIDADE";
  assert.equal(getSavedOpportunityGroup(customUrl), "PRIORIDADE");
});

test("TESTE F5 7 & 8: trocar para Fila Ranqueada e confirmar permanencia", () => {
  const customStorage = { [STORAGE_KEYS.ACTIVE_TAB]: "fruta_baixa", [STORAGE_KEYS.FRUTA_BAIXA_SUBTAB]: "fila_padrao" };
  assert.equal(getSavedFrutaBaixaSubTab(undefined, customStorage), "fila_padrao");

  const customUrl = "http://localhost/painel?tab=fruta_baixa&subtab=fila_padrao";
  assert.equal(getSavedFrutaBaixaSubTab(customUrl), "fila_padrao");
});

test("TESTE F5 9: inserir filtro, atualizar e confirmar restauracao", () => {
  const customStorage = { [STORAGE_KEYS.OPPORTUNITY_FILTER]: "Komax" };
  assert.equal(getSavedOpportunityFilter(undefined, customStorage), "Komax");

  const customUrl = "http://localhost/painel?tab=fruta_baixa&subtab=oportunidade&filter=Komax";
  assert.equal(getSavedOpportunityFilter(customUrl), "Komax");
});

test("TESTE F5 10: valor invalido no armazenamento com fallback seguro", () => {
  const customStorage = {
    [STORAGE_KEYS.ACTIVE_TAB]: "TAB_CORROMPIDA",
    [STORAGE_KEYS.FRUTA_BAIXA_SUBTAB]: "SUBTAB_INVALIDA",
    [STORAGE_KEYS.OPPORTUNITY_GROUP]: "GRUPO_INEXISTENTE"
  };

  assert.equal(getSavedActiveTab(undefined, customStorage), "hoje");
  assert.equal(getSavedFrutaBaixaSubTab(undefined, customStorage), "fila_padrao");
  assert.equal(getSavedOpportunityGroup(undefined, customStorage), "PRIORIDADE");
});

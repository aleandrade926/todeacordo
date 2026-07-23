import type { TargetMatchStatus } from "./opportunity-engine";

export type ActiveTabType = "hoje" | "dashboard" | "leads" | "comissoes" | "config" | "fruta_baixa";
export type FrutaBaixaSubTabType = "fila_padrao" | "oportunidade";

export const STORAGE_KEYS = {
  ACTIVE_TAB: "taxmanagers_active_tab",
  FRUTA_BAIXA_SUBTAB: "taxmanagers_fruta_baixa_subtab",
  OPPORTUNITY_GROUP: "taxmanagers_opportunity_group",
  OPPORTUNITY_FILTER: "taxmanagers_opportunity_filter",
} as const;

export function getSavedActiveTab(customUrl?: string, customStorage?: Record<string, string>): ActiveTabType {
  try {
    const validTabs: ActiveTabType[] = ["hoje", "dashboard", "leads", "comissoes", "config", "fruta_baixa"];
    
    // 1. Checar URL
    if (typeof window !== "undefined" || customUrl) {
      const searchStr = customUrl ? new URL(customUrl, "http://localhost").search : window.location.search;
      const params = new URLSearchParams(searchStr);
      const urlTab = params.get("tab");
      if (urlTab && validTabs.includes(urlTab as ActiveTabType)) {
        return urlTab as ActiveTabType;
      }
    }

    // 2. Checar LocalStorage
    const localTab = customStorage ? customStorage[STORAGE_KEYS.ACTIVE_TAB] : (typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) : null);
    if (localTab && validTabs.includes(localTab as ActiveTabType)) {
      return localTab as ActiveTabType;
    }
  } catch (e) {}

  return "hoje";
}

export function getSavedFrutaBaixaSubTab(customUrl?: string, customStorage?: Record<string, string>): FrutaBaixaSubTabType {
  try {
    if (typeof window !== "undefined" || customUrl) {
      const searchStr = customUrl ? new URL(customUrl, "http://localhost").search : window.location.search;
      const params = new URLSearchParams(searchStr);
      const urlSub = params.get("subtab");
      if (urlSub === "oportunidade" || urlSub === "oportunidades") return "oportunidade";
      if (urlSub === "fila_padrao" || urlSub === "fila_ranqueada") return "fila_padrao";
    }

    const localSub = customStorage ? customStorage[STORAGE_KEYS.FRUTA_BAIXA_SUBTAB] : (typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEYS.FRUTA_BAIXA_SUBTAB) : null);
    if (localSub === "oportunidade" || localSub === "oportunidades") return "oportunidade";
    if (localSub === "fila_padrao" || localSub === "fila_ranqueada") return "fila_padrao";
  } catch (e) {}

  return "fila_padrao";
}

export function getSavedOpportunityGroup(customUrl?: string, customStorage?: Record<string, string>): TargetMatchStatus {
  try {
    if (typeof window !== "undefined" || customUrl) {
      const searchStr = customUrl ? new URL(customUrl, "http://localhost").search : window.location.search;
      const params = new URLSearchParams(searchStr);
      const rawGroup = params.get("grupo")?.toUpperCase();
      if (rawGroup === "PRIORIDADE") return "PRIORIDADE";
      if (rawGroup === "VALIDAR") return "VALIDAR";
      if (rawGroup === "NÃO ABORDAR" || rawGroup === "NAO_ABORDAR" || rawGroup === "NAOABORDAR") return "NÃO ABORDAR";
    }

    const rawLocal = customStorage ? customStorage[STORAGE_KEYS.OPPORTUNITY_GROUP] : (typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEYS.OPPORTUNITY_GROUP) : null);
    const upperLocal = rawLocal?.toUpperCase();
    if (upperLocal === "PRIORIDADE") return "PRIORIDADE";
    if (upperLocal === "VALIDAR") return "VALIDAR";
    if (upperLocal === "NÃO ABORDAR" || upperLocal === "NAO_ABORDAR" || upperLocal === "NAOABORDAR") return "NÃO ABORDAR";
  } catch (e) {}

  return "PRIORIDADE";
}

export function getSavedOpportunityFilter(customUrl?: string, customStorage?: Record<string, string>): string {
  try {
    if (typeof window !== "undefined" || customUrl) {
      const searchStr = customUrl ? new URL(customUrl, "http://localhost").search : window.location.search;
      const params = new URLSearchParams(searchStr);
      const urlFilter = params.get("filter") || params.get("search");
      if (urlFilter && typeof urlFilter === "string") {
        return urlFilter.slice(0, 100);
      }
    }

    const localFilter = customStorage ? customStorage[STORAGE_KEYS.OPPORTUNITY_FILTER] : (typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEYS.OPPORTUNITY_FILTER) : null);
    if (localFilter && typeof localFilter === "string") {
      return localFilter.slice(0, 100);
    }
  } catch (e) {}

  return "";
}

export function syncNavigationStateToStorageAndUrl(
  activeTab: ActiveTabType,
  subTab?: FrutaBaixaSubTabType,
  group?: TargetMatchStatus,
  filter?: string
) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
      if (subTab) localStorage.setItem(STORAGE_KEYS.FRUTA_BAIXA_SUBTAB, subTab);
      if (group) localStorage.setItem(STORAGE_KEYS.OPPORTUNITY_GROUP, group);
      if (filter !== undefined) localStorage.setItem(STORAGE_KEYS.OPPORTUNITY_FILTER, filter);
    }

    if (typeof window !== "undefined" && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", activeTab);
      if (subTab) url.searchParams.set("subtab", subTab);
      if (group) url.searchParams.set("grupo", group);
      if (filter) url.searchParams.set("filter", filter);
      else url.searchParams.delete("filter");

      window.history.replaceState(null, "", url.toString());
    }
  } catch (e) {}
}

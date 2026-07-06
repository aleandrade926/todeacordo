// Feature Flags — Modo Resgate
// Desligar tudo que não é fluxo principal.
// Fluxo principal: home, /demo, /analisar, /valida/:id, /app, sidepanel, gerar entendimento.

export const FEATURE_FLAGS = {
  ENABLE_GROWTH_ROUTES: false,       // /calculadora, /antes-e-depois, /mural, /tools/whatsapp, /nao-e-ata, /casos-de-uso, /comparativos
  ENABLE_COUNTERPARTY_CLAIM: false,  // Lead gate no /valida
  ENABLE_SIGNATURE: false,           // /assinatura-email
  ENABLE_FAKE_DOORS: false,          // /integracoes, /api, /white-label, /templates, /parceiros, /empresas
  ENABLE_ADMIN_DASHBOARDS: false,    // /admin/growth, /admin/opportunities, /admin/intelligence, /admin-beta
  ENABLE_PROTOCOL_PAGES: false,      // /protocol, /autopsia, /doctor, /benchmark, /kit/consultores
  ENABLE_SEO_PAGES: false,           // /templates/:slug, /share/:id
  ENABLE_WAITLIST: false,            // /waitlist
  ENABLE_TRUST_CENTER: false,        // /seguranca
} as const;

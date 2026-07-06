// src/growth/growthLogger.ts

export type GrowthEventName = 
  | 'validation_page_opened'
  | 'validation_cta_clicked'
  | 'waitlist_joined'
  | 'referral_link_opened'
  | 'demo_opened'
  | 'demo_cta_clicked'
  | 'pdf_downloaded'
  | 'whatsapp_clicked'
  | 'email_clicked'
  | 'paywall_viewed'
  | 'feature_vote_submitted'
  | 'founder_interest_submitted'
  | 'share_clicked'
  | 'copy_link_clicked'
  | 'install_cta_clicked'
  | 'accepted_with_signature'
  | 'accepted_with_reservation'
  | 'lead_captured_from_validation'
  | 'agreement_created'
  | 'validation_link_opened'
  | 'validation_link_clicked'
  | 'counterparty_identified'
  | 'funnel_event';

export interface GrowthEventPayload {
  meeting_id?: string;
  consensus_id?: string;
  validation_id?: string;
  ref?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  source_page?: string;
  user_role?: 'owner' | 'counterparty' | 'visitor' | 'admin';
  persona?: string;
  email?: string;
  [key: string]: any;
}

export const trackGrowthEvent = (eventName: GrowthEventName, payload?: GrowthEventPayload) => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const incomingRef = urlParams.get('ref');
    
    // Persistência do referral e UTMs por 30 dias (usando timestamp no localStorage)
    if (incomingRef) {
      localStorage.setItem('tda_attribution_ref', incomingRef);
      localStorage.setItem('tda_attribution_ref_time', Date.now().toString());
    }
    
    // Salvar UTMs se houver na URL
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(param => {
      const val = urlParams.get(param);
      if (val) {
        localStorage.setItem(`tda_${param}`, val);
      }
    });

    // Validar expiração de 30 dias (30 * 24 * 60 * 60 * 1000 = 2592000000 ms)
    const refTime = localStorage.getItem('tda_attribution_ref_time');
    let attributionRef = null;
    if (refTime && Date.now() - parseInt(refTime, 10) < 2592000000) {
      attributionRef = localStorage.getItem('tda_attribution_ref');
    } else {
      localStorage.removeItem('tda_attribution_ref');
      localStorage.removeItem('tda_attribution_ref_time');
    }

    const event = {
      id: crypto.randomUUID(),
      event_name: eventName,
      timestamp: Date.now(),
      url: window.location.href,
      attribution_ref: attributionRef,
      utm_source: urlParams.get('utm_source') || localStorage.getItem('tda_utm_source'),
      utm_medium: urlParams.get('utm_medium') || localStorage.getItem('tda_utm_medium'),
      utm_campaign: urlParams.get('utm_campaign') || localStorage.getItem('tda_utm_campaign'),
      source_page: payload?.source_page || window.location.pathname,
      user_role: payload?.user_role || 'visitor',
      payload
    };

    // Salvar no localStorage para análise de funil local no dashboard
    const existingEvents = JSON.parse(localStorage.getItem('tda_growth_events') || '[]');
    existingEvents.push(event);
    localStorage.setItem('tda_growth_events', JSON.stringify(existingEvents));

    console.log(`[Growth Tracker] ${eventName}`, event);
  } catch (error) {
    console.error(`[Growth Tracker] Falha ao registrar evento ${eventName}`, error);
  }
};

// Alias simplificado para facilitar chamadas no app
export const trackEvent = (eventName: GrowthEventName, payload?: GrowthEventPayload) => {
  trackGrowthEvent(eventName, payload);
};

export const getOrCreateReferralCode = (nameOrEmail?: string): string => {
  let ref = localStorage.getItem('tda_my_referral_code');
  if (!ref) {
    const prefix = nameOrEmail ? nameOrEmail.split('@')[0].split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 'user';
    const suffix = Math.random().toString(36).substring(2, 6);
    ref = `${prefix}-${suffix}`;
    localStorage.setItem('tda_my_referral_code', ref);
  }
  return ref;
};

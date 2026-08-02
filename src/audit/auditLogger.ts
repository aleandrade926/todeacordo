import { saveAuditEvent } from '../storage/auditStorage';
import type { AuditEventType } from './auditTypes';

export const logEvent = async (
  meetingId: string,
  type: AuditEventType,
  details?: Record<string, any>
): Promise<void> => {
  const urlParams = new URLSearchParams(window.location.search);
  const utm_source = urlParams.get('utm_source');
  const utm_medium = urlParams.get('utm_medium');
  const utm_campaign = urlParams.get('utm_campaign');
  const ref = urlParams.get('ref');

  const enrichedDetails = {
    ...details,
    ...(utm_source && { utm_source }),
    ...(utm_medium && { utm_medium }),
    ...(utm_campaign && { utm_campaign }),
    ...(ref && { referral_code: ref }),
  };

  const event = {
    id: crypto.randomUUID(),
    meeting_id: meetingId,
    type,
    timestamp: Date.now(),
    details: enrichedDetails
  };
  
  try {
    await saveAuditEvent(event);
    console.log(`[AuditLog] ${type}`, event);
  } catch (error) {
    console.error(`[AuditLog] Falha ao registrar evento ${type}`, error);
  }
};

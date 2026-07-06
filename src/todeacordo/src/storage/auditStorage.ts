import { getDB } from './db';
import type { AuditEvent } from '../audit/auditTypes';

export const saveAuditEvent = async (event: AuditEvent): Promise<void> => {
  const db = await getDB();
  await db.put('audit', event);
};

export const getAuditEventsForMeeting = async (meetingId: string): Promise<AuditEvent[]> => {
  const db = await getDB();
  const events = await db.getAllFromIndex('audit', 'by-meeting', meetingId);
  return events.sort((a, b) => a.timestamp - b.timestamp);
};

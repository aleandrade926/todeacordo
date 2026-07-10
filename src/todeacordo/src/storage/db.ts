import { openDB, unwrap } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { MeetingSession, TranscriptSegment, ConsensusObject } from '../types';
import type { AuditEvent } from '../audit/auditTypes';

interface ToDeAcordoDB extends DBSchema {
  meetings: {
    key: string;
    value: MeetingSession;
  };
  transcripts: {
    key: string;
    value: TranscriptSegment;
    indexes: { 'by-meeting': string };
  };
  consensus: {
    key: string;
    value: ConsensusObject;
    indexes: { 'by-meeting': string };
  };
  audit: {
    key: string;
    value: AuditEvent;
    indexes: { 'by-meeting': string };
  };
}

const DB_NAME = 'ToDeAcordoDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ToDeAcordoDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<ToDeAcordoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const rawDb = unwrap(db);
        if (!rawDb.objectStoreNames.contains('meetings')) {
          db.createObjectStore('meetings', { keyPath: 'id' });
        }
        if (!rawDb.objectStoreNames.contains('transcripts')) {
          const transcriptStore = db.createObjectStore('transcripts', { keyPath: 'id' });
          transcriptStore.createIndex('by-meeting', 'meeting_id');
        }
        if (!rawDb.objectStoreNames.contains('consensus')) {
          const consensusStore = db.createObjectStore('consensus', { keyPath: 'id' });
          consensusStore.createIndex('by-meeting', 'meeting_id');
        }
        if (!rawDb.objectStoreNames.contains('audit')) {
          const auditStore = db.createObjectStore('audit', { keyPath: 'id' });
          auditStore.createIndex('by-meeting', 'meeting_id');
        }
      },
    });
  }
  return dbPromise;
};

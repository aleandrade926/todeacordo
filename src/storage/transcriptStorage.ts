import { getDB } from './db';
import type { TranscriptSegment } from '../types';

export const saveTranscriptSegment = async (segment: TranscriptSegment): Promise<void> => {
  const db = await getDB();
  await db.put('transcripts', segment);
};

export const getTranscriptForMeeting = async (meetingId: string): Promise<TranscriptSegment[]> => {
  const db = await getDB();
  const segments = await db.getAllFromIndex('transcripts', 'by-meeting', meetingId);
  return segments.sort((a, b) => a.captured_at - b.captured_at);
};

export const clearTranscriptsForMeeting = async (meetingId: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('transcripts', 'readwrite');
  const segments = await tx.store.index('by-meeting').getAllKeys(meetingId);
  for (const key of segments) {
    await tx.store.delete(key);
  }
  await tx.done;
};

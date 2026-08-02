import { getDB } from './db';
import type { MeetingSession } from '../types';

export const saveMeeting = async (meeting: MeetingSession): Promise<void> => {
  const db = await getDB();
  await db.put('meetings', meeting);
};

export const getMeeting = async (id: string): Promise<MeetingSession | undefined> => {
  const db = await getDB();
  return db.get('meetings', id);
};

export const getAllMeetings = async (): Promise<MeetingSession[]> => {
  const db = await getDB();
  return db.getAll('meetings');
};

export const getActiveMeeting = async (): Promise<MeetingSession | undefined> => {
  const db = await getDB();
  const all = await db.getAll('meetings');
  return all.find(m => m.status === 'active' || m.is_active);
};

export const clearMeeting = async (id: string): Promise<void> => {

  const meeting = await getMeeting(id);
  if (meeting) {
    meeting.status = 'cleared';
    meeting.is_active = false;
    await saveMeeting(meeting);
  }
};

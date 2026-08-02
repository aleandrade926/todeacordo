import { getDB } from './db';
import { supabase } from './supabaseClient';
import type { ConsensusObject } from '../types';

export const saveConsensus = async (consensus: ConsensusObject): Promise<void> => {
  const db = await getDB();
  await db.put('consensus', consensus);

  // Sync to Supabase if configured
  if (supabase) {
    try {
      const { error } = await supabase
        .from('consensus')
        .upsert({
          id: consensus.id,
          meeting_id: consensus.meeting_id,
          data: consensus,
          updated_at: new Date().toISOString()
        });
      if (error) {
        console.error('Error syncing consensus to Supabase:', error);
      } else {
        console.log(`[SupabaseSync] Consensus ${consensus.id} synced successfully.`);
      }
    } catch (err) {
      console.error('Failed to sync consensus to Supabase:', err);
    }
  }
};

export const getConsensus = async (id: string): Promise<ConsensusObject | undefined> => {
  const db = await getDB();
  const localData = await db.get('consensus', id);

  // Sync/fetch latest version from Supabase if online
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('consensus')
        .select('data')
        .eq('id', id)
        .single();
      
      if (!error && data && data.data) {
        const remoteConsensus = data.data as ConsensusObject;
        await db.put('consensus', remoteConsensus);
        return remoteConsensus;
      }
    } catch (err) {
      console.error('Failed to load consensus from Supabase:', err);
    }
  }

  return localData;
};

export const getAllConsensus = async (): Promise<ConsensusObject[]> => {
  const db = await getDB();
  return db.getAll('consensus');
};

export const getConsensusForMeeting = async (meetingId: string): Promise<ConsensusObject | undefined> => {
  const db = await getDB();
  const localData = await db.getAllFromIndex('consensus', 'by-meeting', meetingId);
  let result = localData.length > 0 ? localData[localData.length - 1] : undefined;

  // Try fetching latest from Supabase if online
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('consensus')
        .select('data')
        .eq('meeting_id', meetingId)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (!error && data && data.length > 0 && data[0].data) {
        const remoteConsensus = data[0].data as ConsensusObject;
        await db.put('consensus', remoteConsensus);
        result = remoteConsensus;
      }
    } catch (err) {
      console.error('Failed to load consensus from Supabase for meeting:', err);
    }
  }

  return result;
};

export const clearConsensusForMeeting = async (meetingId: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('consensus', 'readwrite');
  const items = await tx.store.index('by-meeting').getAllKeys(meetingId);
  for (const key of items) {
    await tx.store.delete(key);
  }
  await tx.done;

  if (supabase) {
    try {
      await supabase
        .from('consensus')
        .delete()
        .eq('meeting_id', meetingId);
    } catch (err) {
      console.error('Failed to clear consensus from Supabase:', err);
    }
  }
};

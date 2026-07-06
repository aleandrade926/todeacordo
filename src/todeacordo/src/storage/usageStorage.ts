export interface WaitlistLead {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  role: string;
  attempted_feature: string;
  source_meeting_id?: string;
  created_at: number;
}

const USAGE_KEY = 'todeacordo_usage_count';
const TRANSCRIPT_USAGE_KEY = 'todeacordo_transcript_usage_count';
const WAITLIST_KEY = 'todeacordo_waitlist';
const FREE_LIMIT = 3;
const TRANSCRIPT_LIMIT = 20;

// Check if running inside a Chrome Extension
const isExtension = typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;

// Função auxiliar para pegar o mês atual em YYYY-MM
const getCurrentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const getUsage = async (): Promise<{ count: number; limit: number }> => {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.local.get([USAGE_KEY], (result) => {
        const data = (result[USAGE_KEY] || {}) as Record<string, number>;
        const monthKey = getCurrentMonthKey();
        resolve({ count: data[monthKey] || 0, limit: FREE_LIMIT });
      });
    });
  } else {
    try {
      const raw = localStorage.getItem(USAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      const monthKey = getCurrentMonthKey();
      return { count: data[monthKey] || 0, limit: FREE_LIMIT };
    } catch (e) {
      console.error('Error reading localStorage usage:', e);
      return { count: 0, limit: FREE_LIMIT };
    }
  }
};

export const getTranscriptUsage = async (): Promise<{ count: number; limit: number }> => {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.local.get([TRANSCRIPT_USAGE_KEY], (result) => {
        const data = (result[TRANSCRIPT_USAGE_KEY] || {}) as Record<string, number>;
        const monthKey = getCurrentMonthKey();
        resolve({ count: data[monthKey] || 0, limit: TRANSCRIPT_LIMIT });
      });
    });
  } else {
    try {
      const raw = localStorage.getItem(TRANSCRIPT_USAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      const monthKey = getCurrentMonthKey();
      return { count: data[monthKey] || 0, limit: TRANSCRIPT_LIMIT };
    } catch (e) {
      console.error('Error reading localStorage transcript usage:', e);
      return { count: 0, limit: TRANSCRIPT_LIMIT };
    }
  }
};

export const incrementUsage = async (): Promise<{ count: number; limit: number }> => {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.local.get([USAGE_KEY], (result) => {
        const data = (result[USAGE_KEY] || {}) as Record<string, number>;
        const monthKey = getCurrentMonthKey();
        data[monthKey] = (data[monthKey] || 0) + 1;
        chrome.storage.local.set({ [USAGE_KEY]: data }, () => resolve({ count: data[monthKey], limit: FREE_LIMIT }));
      });
    });
  } else {
    try {
      const raw = localStorage.getItem(USAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      const monthKey = getCurrentMonthKey();
      data[monthKey] = (data[monthKey] || 0) + 1;
      localStorage.setItem(USAGE_KEY, JSON.stringify(data));
      return { count: data[monthKey], limit: FREE_LIMIT };
    } catch (e) {
      console.error('Error writing localStorage usage:', e);
      return { count: 0, limit: FREE_LIMIT };
    }
  }
};

export const incrementTranscriptUsage = async (): Promise<{ count: number; limit: number }> => {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.local.get([TRANSCRIPT_USAGE_KEY], (result) => {
        const data = (result[TRANSCRIPT_USAGE_KEY] || {}) as Record<string, number>;
        const monthKey = getCurrentMonthKey();
        data[monthKey] = (data[monthKey] || 0) + 1;
        chrome.storage.local.set({ [TRANSCRIPT_USAGE_KEY]: data }, () => resolve({ count: data[monthKey], limit: TRANSCRIPT_LIMIT }));
      });
    });
  } else {
    try {
      const raw = localStorage.getItem(TRANSCRIPT_USAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      const monthKey = getCurrentMonthKey();
      data[monthKey] = (data[monthKey] || 0) + 1;
      localStorage.setItem(TRANSCRIPT_USAGE_KEY, JSON.stringify(data));
      return { count: data[monthKey], limit: TRANSCRIPT_LIMIT };
    } catch (e) {
      console.error('Error writing localStorage transcript usage:', e);
      return { count: 0, limit: TRANSCRIPT_LIMIT };
    }
  }
};

export const addLeadToWaitlist = async (lead: Omit<WaitlistLead, 'id' | 'created_at'>): Promise<void> => {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.local.get([WAITLIST_KEY], (result) => {
        const leads: WaitlistLead[] = Array.isArray(result[WAITLIST_KEY]) ? result[WAITLIST_KEY] : [];
        leads.push({
          ...lead,
          id: crypto.randomUUID(),
          created_at: Date.now()
        });
        chrome.storage.local.set({ [WAITLIST_KEY]: leads }, () => resolve());
      });
    });
  } else {
    try {
      const raw = localStorage.getItem(WAITLIST_KEY);
      const leads = raw ? JSON.parse(raw) : [];
      leads.push({
        ...lead,
        id: crypto.randomUUID(),
        created_at: Date.now()
      });
      localStorage.setItem(WAITLIST_KEY, JSON.stringify(leads));
    } catch (e) {
      console.error('Error writing localStorage waitlist:', e);
    }
  }
};

export const getWaitlist = async (): Promise<WaitlistLead[]> => {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.local.get([WAITLIST_KEY], (result) => {
        resolve(Array.isArray(result[WAITLIST_KEY]) ? result[WAITLIST_KEY] : []);
      });
    });
  } else {
    try {
      const raw = localStorage.getItem(WAITLIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error reading localStorage waitlist:', e);
      return [];
    }
  }
};

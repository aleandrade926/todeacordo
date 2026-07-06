import { useState, useEffect } from 'react';
import { getUsage, incrementUsage, getTranscriptUsage, incrementTranscriptUsage } from '../storage/usageStorage';

export function useUsage() {
  const [count, setCount] = useState(0);
  const [limit, setLimit] = useState(3);
  const [transcriptCount, setTranscriptCount] = useState(0);
  const [transcriptLimit, setTranscriptLimit] = useState(20);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const data = await getUsage();
      setCount(data.count);
      setLimit(data.limit);
      
      const tData = await getTranscriptUsage();
      setTranscriptCount(tData.count);
      setTranscriptLimit(tData.limit);
    } catch (e) {
      console.error("Erro ao carregar uso:", e);
    } finally {
      setLoading(false);
    }
  };

  const remainingQuota = () => Math.max(0, limit - count);
  const remainingTranscriptQuota = () => Math.max(0, transcriptLimit - transcriptCount);
  
  const canCreateUnderstanding = () => count < limit;
  const canTranscribe = () => transcriptCount < transcriptLimit;

  const recordUsage = async () => {
    const data = await incrementUsage();
    setCount(data.count);
    setLimit(data.limit);
    return data;
  };

  const recordTranscriptUsage = async () => {
    const data = await incrementTranscriptUsage();
    setTranscriptCount(data.count);
    setTranscriptLimit(data.limit);
    return data;
  };

  return {
    count,
    limit,
    transcriptCount,
    transcriptLimit,
    loading,
    remainingQuota,
    remainingTranscriptQuota,
    canCreateUnderstanding,
    canTranscribe,
    recordUsage,
    recordTranscriptUsage,
    refreshUsage: loadUsage
  };
}

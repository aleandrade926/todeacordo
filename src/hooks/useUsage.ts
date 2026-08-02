import { useState, useEffect } from 'react';
import { getUsage, incrementUsage, getTranscriptUsage, incrementTranscriptUsage, getProStatus } from '../storage/usageStorage';

export function useUsage() {
  const [count, setCount] = useState(0);
  const [limit, setLimit] = useState(3);
  const [transcriptCount, setTranscriptCount] = useState(0);
  const [transcriptLimit, setTranscriptLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const pro = await getProStatus();
      setIsPro(pro);

      const data = await getUsage();
      setCount(data.count);
      setLimit(pro ? 9999 : data.limit);
      
      const tData = await getTranscriptUsage();
      setTranscriptCount(tData.count);
      setTranscriptLimit(pro ? 9999 : tData.limit);
    } catch (e) {
      console.error("Erro ao carregar uso:", e);
    } finally {
      setLoading(false);
    }
  };

  const remainingQuota = () => Math.max(0, limit - count);
  const remainingTranscriptQuota = () => Math.max(0, transcriptLimit - transcriptCount);
  
  const canCreateUnderstanding = () => isPro || count < limit;
  const canTranscribe = () => isPro || transcriptCount < transcriptLimit;

  const recordUsage = async () => {
    const data = await incrementUsage();
    setCount(data.count);
    const pro = await getProStatus();
    setLimit(pro ? 9999 : data.limit);
    return data;
  };

  const recordTranscriptUsage = async () => {
    const data = await incrementTranscriptUsage();
    setTranscriptCount(data.count);
    const pro = await getProStatus();
    setTranscriptLimit(pro ? 9999 : data.limit);
    return data;
  };

  return {
    count,
    limit,
    transcriptCount,
    transcriptLimit,
    loading,
    isPro,
    remainingQuota,
    remainingTranscriptQuota,
    canCreateUnderstanding,
    canTranscribe,
    recordUsage,
    recordTranscriptUsage,
    refreshUsage: loadUsage
  };
}

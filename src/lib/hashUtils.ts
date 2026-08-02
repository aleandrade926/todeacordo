/**
 * Utilitário para gerar SHA-256 no navegador usando Crypto API Nativa.
 * Usado para a "Trilha de Confiança" do ToDeAcordo.
 */
export async function generateSHA256(content: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Gera um hash canonizado de um objeto de consenso para auditoria.
 * Ignora campos dinâmicos como audit_events, timestamps locais ou assinaturas para gerar a "Hash Base do Entendimento".
 */
export async function generateConsensusHash(consensus: any): Promise<string> {
  const baseObject = {
    meeting_id: consensus.meeting_id,
    participants: consensus.participants,
    summary: consensus.summary,
    agreements: consensus.agreements,
    decisions: consensus.decisions,
    obligations: consensus.obligations,
    pending_items: consensus.pending_items,
    responsible_parties: consensus.responsible_parties,
    deadlines: consensus.deadlines
  };
  
  const jsonString = JSON.stringify(baseObject);
  return generateSHA256(jsonString);
}

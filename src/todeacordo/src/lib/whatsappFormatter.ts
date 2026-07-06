import type { ConsensusObject, MeetingSession } from '../types';

export const formatForWhatsApp = (meeting: MeetingSession, consensus: ConsensusObject): string => {
  const dateObj = new Date(meeting.started_at);
  const dateStr = dateObj.toLocaleDateString('pt-BR');
  
  let text = `*🤝 Acordo de Reunião: ${meeting.title || 'Sem título'}*\n`;
  text += `📅 Data: ${dateStr}\n`;
  if (meeting.participants && meeting.participants.length > 0) {
    text += `👥 Participantes: ${meeting.participants.join(', ')}\n`;
  }
  text += `\n`;

  if (consensus.summary) {
    text += `*🎯 Resumo Executivo*\n`;
    text += `_${consensus.summary}_\n\n`;
  }

  if (consensus.agreements && consensus.agreements.length > 0) {
    text += `*✅ Pontos Acordados*\n`;
    consensus.agreements.forEach(item => {
      text += `• ${item.text || item}\n`;
    });
    text += `\n`;
  }

  if (consensus.decisions && consensus.decisions.length > 0) {
    text += `*🎯 Decisões Tomadas*\n`;
    consensus.decisions.forEach(item => {
      text += `• ${item.text || item}\n`;
    });
    text += `\n`;
  }

  if (consensus.obligations && consensus.obligations.length > 0) {
    text += `*⚠️ Obrigações e Pendências*\n`;
    consensus.obligations.forEach(item => {
      text += `• ${item.text || item}\n`;
    });
    text += `\n`;
  }

  // Link de Validação
  text += `*Assine e Valide este acordo:* ✅\n`;
  text += `👉 https://todeacordo.com.br/valida/${consensus.meeting_id}\n\n`;

  text += `_Gerado por ToDeAcordo AI ✨_\n`;
  return text;
};

export const generateWhatsAppLink = (text: string): string => {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

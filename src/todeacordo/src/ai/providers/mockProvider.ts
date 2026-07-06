import type { ConsensusObject } from '../../types';

export const mockProvider = async (_transcript: string): Promise<Partial<ConsensusObject>> => {
  // Simula um delay de rede (2 segundos)
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    summary: 'Reunião sobre o lançamento do MVP 1 do ToDeAcordo.',
    agreements: [
      { text: 'A arquitetura principal deve suportar versões futuras de consenso.' },
      { text: 'O design inicial será focado em ser limpo e premium.' }
    ],
    decisions: [
      { text: 'Não usaremos backend no primeiro momento para gravar áudio, apenas a extensão capturando o texto localmente.' },
      { text: 'A chave da API da OpenAI ficará protegida em um backend Edge Function.' }
    ],
    obligations: [
      { text: 'Implementar MVP 1 em Manifest V3 focando no Google Meet' }
    ],
    pending_items: [
      { text: 'Definir a paleta de cores final' }
    ],
    responsible_parties: [
      { text: 'Equipe de Desenvolvimento' }
    ],
    deadlines: [
      { text: 'Até o final da semana para fase 1 a 3' }
    ],
    open_questions: [
      { text: 'Qual será o comportamento se o usuário desligar a legenda no meio da reunião?' }
    ],
    disputed_points: [],
    confidence_score: 95
  };
};

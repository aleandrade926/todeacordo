import type { ConsensusObject } from '../types';

export const MOCK_CONSENSUS: ConsensusObject = {
  id: 'demo-123',
  meeting_id: 'demo',
  title: 'Alinhamento de Escopo - ToDeAcordo',
  created_at: Date.now(),
  updated_at: Date.now(),
  source_platform: 'google-meet',
  participants: ['Alexandre (Cliente)', 'João (Agência)'],
  summary: 'Reunião para definição das entregas da Fase 10 e acertos financeiros do projeto.',
  agreements: [
    { text: 'A entrega será feita em duas etapas principais.', evidence_quote: 'vamos fatiar a entrega em duas' },
    { text: 'O escopo da Fase 11 fica para o mês seguinte.', evidence_quote: 'a gente joga a parte da Stripe pro mês que vem' }
  ],
  decisions: [
    { text: 'Aprovação do layout da Landing Page.', evidence_quote: 'tá aprovado, gostei muito daquele gradiente escuro' }
  ],
  obligations: [
    { text: 'Enviar as chaves de API da Vercel.', evidence_quote: 'preciso que você me mande o token da vercel ainda hoje' }
  ],
  deadlines: [
    { text: 'Envio das chaves de API até Sexta-feira às 18h.', evidence_quote: 'te mando até sexta, umas 18h tá na sua mão' }
  ],
  responsible_parties: [
    { text: 'Alexandre: Responsável por enviar as chaves.', evidence_quote: 'eu pego as chaves com meu time' }
  ],
  pending_items: [
    { text: 'Aprovar o orçamento dos anúncios.', evidence_quote: 'ainda falta ver quanto vamos botar no tráfego pago' }
  ],
  open_questions: [],
  disputed_points: [],
  transcript_segments: [],
  consensus_versions: [],
  current_version: 1,
  status: 'draft',
  audit_events: []
};

export const MOCK_CONSENSUS_CONSULTORIA: ConsensusObject = {
  id: 'demo-consultoria',
  meeting_id: 'demo-2',
  title: 'Kickoff: Consultoria Estratégica Q3',
  created_at: Date.now(),
  updated_at: Date.now(),
  source_platform: 'google-meet',
  participants: ['Roberto (Consultor)', 'Carolina (CEO)'],
  summary: 'Alinhamento inicial do escopo do projeto, aprovação de orçamento da Fase 1 e definição de cronograma preliminar.',
  
  traffic_light: 'yellow',
  confidence_score: 72,
  red_flags: ['talvez', 'depois a gente vê', 'depende'],
  missing_elements: [],
  next_step: 'Carolina aprovar formalmente o orçamento para liberação da equipe.',
  
  risk_map: {
    scope: 'low',
    deadline: 'high',
    budget: 'medium',
    responsibility: 'low'
  },

  agreements: [
    { id: 'agr_1', text: 'O diagnóstico será feito presencialmente na sede de SP.', evidence_quote: 'sim, a gente fecha de fazer in loco na Faria Lima' },
    { id: 'agr_2', text: 'O valor da Fase 1 está dentro do budget, mas depende de aprovação do conselho.', evidence_quote: 'o valor cabe, mas depende da assinatura do CFO' }
  ],
  decisions: [
    { id: 'dec_1', text: 'Início do projeto marcado para o dia 15.', evidence_quote: 'fechado, dia 15 a gente dá o kick-off oficial' }
  ],
  obligations: [
    { id: 'obl_1', text: 'Roberto: Enviar NDA assinado até amanhã.', evidence_quote: 'eu te mando o NDA amanhã cedo sem falta' },
    { id: 'obl_2', text: 'Carolina: Confirmar prazo final de entrega.', evidence_quote: 'talvez a gente consiga esticar o prazo, depois a gente vê' }
  ],
  pending_items: [],
  status: 'pending_review',
  transcript_segments: [],
  audit_events: [],
  current_version: 1,
  clarity_score: 65,
  risk_flags: [
    {
      type: 'Prazo Ambíguo',
      text: 'O prazo para envio dos dados foi citado como "semana que vem", o que pode gerar atrasos.',
      evidence_quote: 'Marcos: A gente te manda isso lá pra semana que vem, fica tranquilo.',
      severity: 'high'
    },
    {
      type: 'Escopo Aberto',
      text: 'A análise dos concorrentes foi prometida sem um limite de empresas.',
      evidence_quote: 'Ana: Sim, eu dou uma olhada nos concorrentes também.',
      severity: 'medium'
    }
  ],
  consensus_versions: [
    {
      version: 1,
      created_at: Date.now(),
      content: {}
    }
  ]
};

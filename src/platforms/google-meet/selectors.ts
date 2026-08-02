/**
 * Seletores do Google Meet com múltiplos fallbacks.
 */
export const MEET_SELECTORS = {
  // Botões de controle de saída
  LEAVE_CALL_BUTTONS: [
    'button[aria-label*="Sair da chamada"]',
    'button[aria-label*="Leave call"]',
    'button[data-tooltip*="Sair da chamada"]',
    'button[data-tooltip*="Leave call"]',
    '[jsname="Ry41Wb"]',
    '[jscontroller="Ry41Wb"]'
  ],

  // Outros indicadores de reunião ativa
  ACTIVE_INDICATORS: [
    'button[aria-label*="Chat com todos" i]',
    'button[aria-label*="Chat with everyone" i]',
    'button[aria-label*="Mostrar todos" i]',
    'button[aria-label*="Show everyone" i]',
    '[jscontroller="x37nNd"]', // Toolbar inferior inteira
    '[aria-label*="Atividades" i]',
    '[aria-label*="Activities" i]'
  ],

  // Botão de alternar legendas (CC)
  CAPTIONS_TOGGLE_BUTTONS: [
    'button[aria-label*="legenda" i]',
    'button[aria-label*="caption" i]',
    'button[aria-label*="subtít" i]',
    'button[aria-label*="subtit" i]',
    'button[aria-label*="sous-tit" i]',
    'button[aria-label*="untertitel" i]',
    'button[aria-label*="sottotit" i]',
    'button[data-tooltip*="legenda" i]',
    'button[data-tooltip*="caption" i]',
    'button[data-tooltip*="subtít" i]',
    'button[data-tooltip*="subtit" i]',
    'button[data-tooltip*="sous-tit" i]',
    'button[data-tooltip*="untertitel" i]',
    'button[data-tooltip*="sottotit" i]',
    '[jscontroller="r49Sxf"]',
    '[jsname="r49Sxf"]'
  ],

  // Containers principais de legendas
  CAPTIONS_CONTAINERS: [
    '.a4cQT',
    '.VbKzg',
    '[jsname="tX9u1b"]',
    '.KjMtvf',
    '.i3PoEd',
    '.X49Xn'
  ],

  // Elementos internos de fala
  CAPTION_TEXTS: [
    '.CNusmb',
    'span.zs7s8d',
    '.T2hybc',
    '.waN44b'
  ],

  // Elementos contendo o falante
  SPEAKER_NAMES: [
    '.jO7h3c',
    '.zs7s8d',
    '.xt4G2',
    '.yt5B2'
  ],

  // Botões de lista de participantes
  PARTICIPANTS_BUTTONS: [
    'button[aria-label*="Participantes"]',
    'button[aria-label*="Everyone"]',
    'button[aria-label*="participantes"]'
  ]
};

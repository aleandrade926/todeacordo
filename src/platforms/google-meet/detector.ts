import { MEET_SELECTORS } from './selectors';

export type MeetingState = 'INACTIVE' | 'LOBBY' | 'ACTIVE';

export class MeetingDetector {
  /**
   * Identifica se a aba atual está em uma reunião ativa, lobby ou se não é do Meet.
   */
  static detectState(): MeetingState {
    const path = window.location.pathname;

    // Google Meet utiliza links no formato /abc-defg-hij ou slugs de apelido.
    // Se o pathname não começar com barra ou for muito curto, não é uma sala.
    if (!path.startsWith('/') || path.length < 5 || path === '/signup' || path === '/terms') {
      return 'INACTIVE';
    }

    // 1. Procura por qualquer botão de desligar/sair da chamada
    for (const selector of MEET_SELECTORS.LEAVE_CALL_BUTTONS) {
      if (document.querySelector(selector)) {
        return 'ACTIVE';
      }
    }

    // 2. Procura por outros indicadores fortes de chamada ativa (Chat, Participantes, Toolbar etc.)
    for (const selector of MEET_SELECTORS.ACTIVE_INDICATORS) {
      if (document.querySelector(selector)) {
        return 'ACTIVE';
      }
    }

    // 3. Se existe um container de legendas, estamos em uma chamada ativa
    for (const selector of MEET_SELECTORS.CAPTIONS_CONTAINERS) {
      if (document.querySelector(selector)) {
        return 'ACTIVE';
      }
    }

    // Se está em uma URL de sala, mas nenhum controle de reunião ativa está visível, assume Lobby
    return 'LOBBY';
  }

  /**
   * Verifica se as legendas estão ligadas usando seletores de botões ou presença de texto.
   */
  static areCaptionsEnabled(): boolean {
    // 1. Checa botões de toggle
    for (const selector of MEET_SELECTORS.CAPTIONS_TOGGLE_BUTTONS) {
      const btn = document.querySelector(selector);
      if (btn) {
        const isPressed = btn.getAttribute('aria-pressed') === 'true';
        if (isPressed) return true;

        if (btn.classList.contains('H2a7Sec') || btn.classList.contains('l47oze')) {
          return true;
        }
        
        // Verifica se tem classe indicando ativo no Google Meet
        if (btn.classList.contains('VfPpkd-Bz112c-LgbsSe-OWXEXe-INsHu')) {
          return true;
        }
      }
    }

    // 2. Heurística secundária: Verifica presença de containers VISÍVEIS ou com texto
    for (const selector of MEET_SELECTORS.CAPTIONS_CONTAINERS) {
      const container = document.querySelector(selector) as HTMLElement;
      if (container) {
        // Se tem texto, definitivamente está rodando
        if (container.textContent && container.textContent.trim().length > 0) {
          return true;
        }
        
        // Verifica se está visível no DOM
        const style = window.getComputedStyle(container);
        if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          // No meet, o container muitas vezes fica na tela invisível. Se está visível e tem dimensões, está ativo.
          if (container.getBoundingClientRect().height > 0) {
            return true;
          }
        }
      }
    }
    
    // 3. Heurística de fallback: procura spans de texto de fala diretamente
    for (const selector of MEET_SELECTORS.CAPTION_TEXTS) {
      if (document.querySelector(selector)) {
        return true;
      }
    }

    return false;
  }
}

import { MEET_SELECTORS } from './selectors';

export class ParticipantExtractor {
  /**
   * Extração básica de participantes baseada em aria-labels comuns.
   * Em futuras fases será aprimorado com contagem e nomes reais.
   */
  static getParticipantsCount(): number | null {
    let btn: Element | null = null;
    for (const selector of MEET_SELECTORS.PARTICIPANTS_BUTTONS) {
      btn = document.querySelector(selector);
      if (btn) break;
    }
    if (!btn) return null;
    
    // Tenta extrair o número de participantes do texto ou aria-label (ex: "Participantes: 3")
    const label = btn.getAttribute('aria-label') || btn.textContent || '';
    const match = label.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }
}

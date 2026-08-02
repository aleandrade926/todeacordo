export interface ProbeResult {
  visibleTextNodesCount: number;
  ariaLiveCount: number;
  roleStatusLogCount: number;
  possibleCaptionContainersCount: number;
  lastRawText: string;
  candidateSelector: string;
  isVisible: boolean;
  className: string;
  tagName: string;
}

export class CaptionProbe {
  /**
   * Realiza uma busca manual e instantânea no DOM buscando nós que
   * se comportam ou têm atributos de container de legendas.
   */
  static scan(): ProbeResult {
    console.log('[ToDeAcordo][CaptionProbe] Iniciando varredura manual do DOM.');
    
    let visibleTextNodesCount = 0;
    let ariaLiveCount = 0;
    let roleStatusLogCount = 0;
    let possibleCaptionContainersCount = 0;
    let lastRawText = '';
    let candidateSelector = 'Nenhum';
    let isVisible = false;
    let className = '';
    let tagName = '';

    const allElements = document.querySelectorAll('*');
    const candidates: HTMLElement[] = [];

    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      
      // 1. Verificar aria-live
      const ariaLive = htmlEl.getAttribute('aria-live');
      if (ariaLive && (ariaLive === 'polite' || ariaLive === 'assertive')) {
        ariaLiveCount++;
      }

      // 2. Verificar role
      const role = htmlEl.getAttribute('role');
      if (role && (role === 'status' || role === 'log')) {
        roleStatusLogCount++;
      }

      // 3. Contagem de nós com texto visível
      const text = (htmlEl.innerText || '').trim();
      let isElVisible = false;
      try {
        const style = window.getComputedStyle(htmlEl);
        isElVisible = style.display !== 'none' && style.visibility !== 'hidden' && htmlEl.offsetWidth > 0;
      } catch (e) {
        // Ignora erros de elementos que não suportam getComputedStyle (ex: SVG ou shadow-root)
      }

      if (isElVisible && text.length > 0) {
        visibleTextNodesCount++;
      }

      // 4. Heurística de container de legenda
      let matchesHeuristic = false;
      
      if (
        htmlEl.classList.contains('a4cQT') || 
        htmlEl.classList.contains('VbKzg') || 
        htmlEl.getAttribute('jsname') === 'tX9u1b' ||
        htmlEl.classList.contains('KjMtvf') ||
        htmlEl.classList.contains('i3PoEd') ||
        htmlEl.classList.contains('X49Xn')
      ) {
        matchesHeuristic = true;
      }

      // Se tem aria-live e está visível, e tem texto relevante
      if (ariaLive && isElVisible && text.length > 0 && htmlEl.tagName !== 'BODY' && htmlEl.tagName !== 'HTML') {
        matchesHeuristic = true;
      }

      if (matchesHeuristic) {
        possibleCaptionContainersCount++;
        candidates.push(htmlEl);
      }
    });

    // Se achou candidatos, escolhe o mais provável que contém texto
    if (candidates.length > 0) {
      const textCandidates = candidates.filter(el => el.innerText && el.innerText.trim().length > 0);
      const target = textCandidates[textCandidates.length - 1] || candidates[candidates.length - 1];
      
      if (target) {
        lastRawText = (target.innerText || '').trim();
        isVisible = true;
        className = target.className;
        tagName = target.tagName;
        
        // Determina seletor simplificado
        if (target.id) {
          candidateSelector = `#${target.id}`;
        } else {
          const jsname = target.getAttribute('jsname');
          if (jsname) {
            candidateSelector = `[jsname="${jsname}"]`;
          } else {
            candidateSelector = target.className.split(' ').filter(Boolean).map(c => `.${c}`).join('');
          }
        }
      }
    }

    console.log('[ToDeAcordo][CaptionProbe] Varredura concluída.', {
      visibleTextNodesCount,
      ariaLiveCount,
      roleStatusLogCount,
      possibleCaptionContainersCount,
      lastRawText,
      candidateSelector
    });

    return {
      visibleTextNodesCount,
      ariaLiveCount,
      roleStatusLogCount,
      possibleCaptionContainersCount,
      lastRawText,
      candidateSelector,
      isVisible,
      className,
      tagName
    };
  }
}

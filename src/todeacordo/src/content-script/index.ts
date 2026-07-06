import type { MeetingState } from '../platforms/google-meet/detector';
import { MeetingDetector } from '../platforms/google-meet/detector';
import { CaptionExtractor } from '../platforms/google-meet/captionExtractor';
import { CaptionProbe } from '../platforms/google-meet/probe';
import { MEET_SELECTORS } from '../platforms/google-meet/selectors';

console.log('[ToDeAcordo][ContentScript] Script ativo.');

// Injeta CSS para "Ghost Captions" (Legendas Invisíveis)
const injectGhostCSS = () => {
  if (document.getElementById('todeacordo-ghost-css')) return;
  const style = document.createElement('style');
  style.id = 'todeacordo-ghost-css';
  style.textContent = `
    /* Ghost Captions by ToDeAcordo */
    .a4cQT, .VbKzg, [jsname="tX9u1b"], .KjMtvf, .i3PoEd, .X49Xn {
      opacity: 0.001 !important;
      pointer-events: none !important;
      z-index: -9999 !important;
    }
  `;
  document.head.appendChild(style);
  console.log('[ToDeAcordo][ContentScript] Ghost CSS Injetado (Legendas Invisíveis).');
};

const injectInPageUI = () => {
  if (document.getElementById('todeacordo-inpage-container')) return;

  const style = document.createElement('style');
  style.id = 'todeacordo-inpage-css';
  style.textContent = `
    #todeacordo-inpage-container {
      position: fixed;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #todeacordo-inpage-container.collapsed {
      transform: translate(calc(100% - 48px), -50%);
    }
    #todeacordo-fab {
      width: 48px;
      height: 48px;
      background: #f59e0b;
      border-radius: 24px 0 0 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: -2px 0 8px rgba(0,0,0,0.15);
      border: 1px solid #d97706;
      border-right: none;
      transition: background 0.2s;
    }
    #todeacordo-fab:hover {
      background: #d97706;
    }
    #todeacordo-fab svg {
      width: 24px;
      height: 24px;
      color: #fff;
    }
    #todeacordo-sidebar {
      width: 360px;
      height: 85vh;
      background: #fff;
      border-radius: 16px 0 0 16px;
      box-shadow: -4px 0 24px rgba(0,0,0,0.2);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1px solid #e2e8f0;
      border-right: none;
    }
    #todeacordo-sidebar iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: #fff;
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'todeacordo-inpage-container';
  // Open by default
  container.className = '';

  const fab = document.createElement('div');
  fab.id = 'todeacordo-fab';
  fab.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="pointer-events: none;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  
  const sidebar = document.createElement('div');
  sidebar.id = 'todeacordo-sidebar';
  
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('sidepanel.html');
  iframe.allow = "microphone; clipboard-write; clipboard-read";

  sidebar.appendChild(iframe);
  container.appendChild(fab);
  container.appendChild(sidebar);

  document.body.appendChild(container);

  fab.addEventListener('click', () => {
    container.classList.toggle('collapsed');
  });

  console.log('[ToDeAcordo][ContentScript] In-Page UI Injetada.');
};

const autoEnableCaptions = () => {
  if (!MeetingDetector.areCaptionsEnabled()) {
    for (const selector of MEET_SELECTORS.CAPTIONS_TOGGLE_BUTTONS) {
      const btn = document.querySelector(selector) as HTMLElement;
      if (btn) {
        btn.click();
        console.log('[ToDeAcordo][ContentScript] Botão CC clicado automaticamente.');
        return;
      }
    }
  }
};

let currentState: MeetingState = 'INACTIVE';
let captionsEnabled: boolean = false;
let captionExtractor: CaptionExtractor | null = null;
let isCapturing: boolean = false;
let meetingId: string = 'meet-' + Date.now();
let lastObservedUrl = window.location.href;

// Reconecta o observer se o DOM mudar drasticamente
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target && target.innerText) {
    const text = target.innerText.toLowerCase();
    if (text.includes('participar') || text.includes('entrar') || text.includes('join')) {
      setTimeout(() => {
        if (captionExtractor) captionExtractor.reconnect();
      }, 2000);
    }
  }
});

// Função para checar o status e notificar o painel
const checkMeetingState = () => {
  if (window.location.href !== lastObservedUrl) {
    lastObservedUrl = window.location.href;
    if (captionExtractor) captionExtractor.reconnect();
  }

  const newState = MeetingDetector.detectState();
  const newCaptionsEnabled = MeetingDetector.areCaptionsEnabled();

  // Tarefa 4: Se o estado da reunião mudar de ACTIVE para LOBBY/INACTIVE, autodesliga a captura
  // MAS apenas se currentCaptureAllowed também for falso.
  const captureAllowed = captionExtractor ? captionExtractor.currentCaptureAllowed : false;
  if (newState !== 'ACTIVE' && isCapturing && !captureAllowed) {
    console.log('[ToDeAcordo][ContentScript] Reunião não está mais ativa. Auto-desligando capture.');
    if (captionExtractor) {
      captionExtractor.stop();
    }
    isCapturing = false;
    
    // Notifica o painel sobre o auto-stop
    chrome.runtime.sendMessage({
      type: 'CAPTURE_AUTO_STOPPED',
      reason: `Estado da reunião mudou para: ${newState}`
    }).catch(() => {});
    
    // Se saiu da reunião ativa, limpa a sessão para não reusar o ID na próxima reunião na mesma aba
    sessionStorage.removeItem('todeacordo_meeting_id');
  }

  if (newState !== currentState || newCaptionsEnabled !== captionsEnabled) {
    currentState = newState;
    captionsEnabled = newCaptionsEnabled;
    console.log(`[ToDeAcordo][ContentScript] Status alterado. Reunião: ${currentState}, Legendas: ${captionsEnabled}`);
    
    if (currentState === 'ACTIVE') {
      // Usa sessionStorage para sobreviver a F5 (Reload da página)
      let storedMeetingId = sessionStorage.getItem('todeacordo_meeting_id');
      if (!storedMeetingId) {
        storedMeetingId = 'meet-' + Date.now();
        sessionStorage.setItem('todeacordo_meeting_id', storedMeetingId);
      }
      meetingId = storedMeetingId;
      injectInPageUI();
      
      // AUTO-START CAPTURE
      if (!isCapturing) {
        if (captionExtractor) {
          captionExtractor.stop();
        }
        injectGhostCSS();
        autoEnableCaptions();
        captionExtractor = new CaptionExtractor(meetingId, (event) => {
          chrome.runtime.sendMessage(event).catch(() => {});
        });
        
        captionExtractor.start();
        isCapturing = true;
        console.log('[ToDeAcordo][ContentScript] Captura AUTO-INICIADA com sucesso!');
      }
    }

    chrome.runtime.sendMessage({
      type: 'MEET_STATUS_UPDATE',
      state: currentState,
      captionsEnabled: captionsEnabled,
      isCapturing: isCapturing,
      meetingId: meetingId
    }).catch(() => {});
  }
};

setInterval(checkMeetingState, 1000);

// Listener para receber comandos do Side Panel
chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  console.log(`[ToDeAcordo][ContentScript] Mensagem recebida:`, message.type);

  if (message.type === 'START_CAPTURE') {
    // Só inicia se estiver ACTIVE (Tarefa 4)
    if (currentState !== 'ACTIVE') {
      sendResponse({ status: 'ERROR', reason: 'Apenas é permitido capturar em reunião ACTIVE (ativa).' });
      return;
    }

    if (!captionExtractor) {
      // Ativa a magia invisível do ToDeAcordo
      injectGhostCSS();
      autoEnableCaptions();
      
      captionExtractor = new CaptionExtractor(meetingId, (event) => {
        chrome.runtime.sendMessage(event).catch(() => {});
      });
    }
    
    captionExtractor.start();
    isCapturing = true;
    sendResponse({ status: 'OK' });
  }

  else if (message.type === 'STOP_CAPTURE') {
    if (captionExtractor) {
      captionExtractor.stop();
    }
    isCapturing = false;
    sendResponse({ status: 'OK' });
  }
  
  else if (message.type === 'GET_STATUS') {
    sendResponse({
      activeTabUrl: window.location.href,
      contentScriptConnected: true,
      meetingState: currentState,
      captionsEnabled: captionsEnabled,
      mutationObserverActive: isCapturing,
      observedRoot: 'document.body',
      lastMutationAt: captionExtractor ? captionExtractor.lastMutationAt : 0,
      
      // Telemetria refatorada
      activeDraftText: captionExtractor ? captionExtractor.activeDraftText : '',
      activeDraftSpeaker: captionExtractor ? captionExtractor.activeDraftSpeaker : '',
      activeDraftUpdatedAt: captionExtractor ? captionExtractor.activeDraftUpdatedAt : 0,
      committedSegmentsCount: captionExtractor ? captionExtractor.committedSegmentsCount : 0,
      draftUpdateCount: captionExtractor ? captionExtractor.draftUpdateCount : 0,
      lastCommitReason: captionExtractor ? captionExtractor.lastCommitReason : '',
      lastDiscardReason: captionExtractor ? captionExtractor.lastDiscardReason : '',
      lastCleanedText: captionExtractor ? captionExtractor.lastCleanedText : '',
      // Rolling Segment Telemetry (Tarefa 6)
      lastCommittedText: captionExtractor ? captionExtractor.lastCommittedText : '',
      lastCommittedId: captionExtractor ? captionExtractor.lastCommittedId : '',
      lastSegmentUpdatedId: captionExtractor ? captionExtractor.lastSegmentUpdatedId : '',
      updateReason: captionExtractor ? captionExtractor.updateReason : '',
      isExpansionOfCommitted: captionExtractor ? captionExtractor.isExpansionOfCommitted : false,
      novelSuffix: captionExtractor ? captionExtractor.novelSuffix : '',
      segmentUpdatedCount: captionExtractor ? captionExtractor.segmentUpdatedCount : 0,
      
      emittedHashesCount: captionExtractor ? captionExtractor.getEmittedHashesCount() : 0,
      systemTextFilteredCount: captionExtractor ? captionExtractor.systemTextFilteredCount : 0,
      lastSystemTextFiltered: captionExtractor ? captionExtractor.lastSystemTextFiltered : '',
      currentCaptureAllowed: captionExtractor ? captionExtractor.currentCaptureAllowed : false,
      captureBlockedReason: captionExtractor ? captionExtractor.captureBlockedReason : 'Sem extractor ativo',
    });
  }

  else if (message.type === 'RUN_PROBE') {
    const result = CaptionProbe.scan();
    sendResponse({ status: 'OK', result });
  }

  else if (message.type === 'SCAN_NOW') {
    if (currentState !== 'ACTIVE') {
      sendResponse({ status: 'EMPTY', reason: 'Captura manual bloqueada fora de ACTIVE.' });
      return;
    }

    const result = CaptionProbe.scan();
    if (result.lastRawText) {
      const segment = {
        id: 'scan-' + Date.now(),
        meeting_id: meetingId,
        timestamp: new Date().toISOString(),
        speaker: `Scan (${result.tagName}${result.className ? `.${result.className.split(' ')[0]}` : ''})`,
        text: result.lastRawText,
        source: 'manual-scan',
        captured_at: Date.now()
      };
      
      chrome.runtime.sendMessage({ type: 'NEW_SEGMENT', segment }).catch(() => {});
      sendResponse({ status: 'OK', segment });
    } else {
      sendResponse({ status: 'EMPTY', reason: 'Nenhum texto detectado nos nós candidatos.' });
    }
  }
  
  return true;
});

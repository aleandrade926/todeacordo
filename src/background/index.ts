import { saveTranscriptSegment } from '../storage/transcriptStorage';

console.log('Background script initialized');

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error: any) => console.error(error));

let lastKnownState = 'UNKNOWN';

chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG_FROM_BACKGROUND' });
  }

  if (message.type === 'MEET_STATUS_UPDATE') {
    if (lastKnownState === 'ACTIVE' && (message.state === 'INACTIVE' || message.state === 'UNKNOWN' || message.state === 'LOBBY')) {
      console.log('Meeting ended. Transcript saved. Waiting for user to open Sidepanel.');
    }
    lastKnownState = message.state;
  }

  // Backup seguro: Mesmo que o Sidepanel esteja fechado, o background garante que as falas não sejam perdidas.
  if (message.type === "transcript_segment_committed" || message.type === "NEW_SEGMENT" || message.type === "transcript_segment_updated") {
    if (message.segment) {
      saveTranscriptSegment(message.segment).catch(err => console.error("Erro ao salvar segmento em background:", err));
    }
  }
});

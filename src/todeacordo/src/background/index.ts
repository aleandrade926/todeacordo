console.log('Background script initialized');

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error: any) => console.error(error));

let lastKnownState = 'UNKNOWN';

chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  console.log('Message received in background:', message);
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG_FROM_BACKGROUND' });
  }

  if (message.type === 'MEET_STATUS_UPDATE') {
    if (lastKnownState === 'ACTIVE' && (message.state === 'INACTIVE' || message.state === 'UNKNOWN' || message.state === 'LOBBY')) {
      // Meeting ended! Open dashboard to generate consensus.
      let url = chrome.runtime.getURL('index.html?autoGenerate=true');
      if (message.meetingId) {
        url += `&meetingId=${message.meetingId}`;
      }
      chrome.tabs.create({ url: url });
    }
    lastKnownState = message.state;
  }
});

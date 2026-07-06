chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes("linkedin.com")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  } else {
    // Inject a quick alert if not on LinkedIn
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => { alert("Por favor, abra a extensão apenas em páginas do LinkedIn."); }
    });
  }
});

let BASE_URL = 'https://ieltsoasis.site/api';

async function getBaseUrl() {
  const data = await chrome.storage.local.get(['server_url']);
  if (data.server_url) {
    BASE_URL = data.server_url.replace(/\/+$/, '') + '/api';
  }
  return BASE_URL;
}

// Zero-touch token recovery by inspecting all open tabs for oasis_token
async function recoverTokenFromTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id || !tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("edge://")) continue;
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const token = localStorage.getItem("oasis_token");
            const user = localStorage.getItem("oasis_user");
            if (token) {
              return { token, user, origin: window.location.origin };
            }
            return null;
          }
        });
        if (results && results[0] && results[0].result) {
          const res = results[0].result;
          if (res.token) {
            let userInfo = null;
            if (res.user) {
              try { userInfo = typeof res.user === 'string' ? JSON.parse(res.user) : res.user; } catch (e) {}
            }
            await chrome.storage.local.set({
              jwt_token: res.token,
              user_info: userInfo,
              server_url: res.origin
            });
            console.log("[Service Worker] Recovered token from tab:", tab.url);
            await syncUserProfile(res.token);
            return res.token;
          }
        }
      } catch (e) {}
    }
  } catch (err) {
    console.error("recoverTokenFromTabs error:", err);
  }
  return null;
}

// Install event
chrome.runtime.onInstalled.addListener(() => {
  console.log("Mát Cha AI Eo extension installed.");
  // Create context menus safely by clearing first
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "explain-with-matcha",
      title: "Giải thích bằng Mát Cha AI 🍵",
      contexts: ["selection"]
    }, () => {
      if (chrome.runtime.lastError) {
        // Ignored if already created
      }
    });
  });
  
  // Set default settings
  chrome.storage.local.set({ reminders_enabled: true });
  setupAlarms();
});

// Setup study reminder alarms (30-minute interval)
function setupAlarms() {
  chrome.alarms.clearAll(() => {
    chrome.storage.local.get(['reminders_enabled'], (data) => {
      if (data.reminders_enabled !== false) {
        chrome.alarms.create("matcha-vocab-alarm", {
          periodInMinutes: 30
        });
        console.log("Alarms set: 30 minutes interval.");
      }
    });
  });
}

// Listen to Alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'matcha-vocab-alarm') {
    const data = await chrome.storage.local.get(['reminders_enabled']);
    if (data.reminders_enabled === false) return;

    // Send to active tabs in all windows (helps trigger even if Chrome is backgrounded or has multiple windows)
    const activeTabs = await chrome.tabs.query({ active: true });
    for (const tab of activeTabs) {
      if (tab.id && tab.url && !tab.url.includes("ieltsoasis.site") && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://")) {
        chrome.tabs.sendMessage(tab.id, {
          action: "show_reminder"
        }).catch(() => {}); // ignore if tab has no content script
      }
    }
  }
});

// Helper to fetch vocab reminder
async function fetchVocabReminder(token) {
  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}/vocabulary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const list = await response.json();
      if (list && list.length > 0) {
        // Return a random word from the list
        const idx = Math.floor(Math.random() * list.length);
        return list[idx];
      }
    }
  } catch (err) {
    console.error(err);
  }
  return null;
}

// Context Menu Action
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "explain-with-matcha" && info.selectionText) {
    // Save selected text to storage and open side panel
    chrome.storage.local.set({ selected_word: info.selectionText }, () => {
      chrome.sidePanel.open({ tabId: tab.id });
    });
  }
});

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'save_jwt_token') {
    let userInfo = null;
    if (message.user) {
      try {
        userInfo = typeof message.user === 'string' ? JSON.parse(message.user) : message.user;
      } catch (e) {}
    }
    chrome.storage.local.set({ jwt_token: message.token, user_info: userInfo }, async () => {
      console.log("JWT Token synchronized successfully.");
      await syncUserProfile(message.token);
      setupAlarms();
      sendResponse({ status: 'success' });
    });
    return true; // Keep message channel open for async response
  }

  if (message.action === 'recover_token_from_tabs') {
    (async () => {
      const token = await recoverTokenFromTabs();
      sendResponse({ token: token });
    })();
    return true;
  }

  if (message.action === 'sync_vocab') {
    (async () => {
      const data = await chrome.storage.local.get(['jwt_token']);
      let activeToken = message.token || data.jwt_token;
      if (!activeToken) {
        activeToken = await recoverTokenFromTabs();
      }
      if (activeToken) {
        if (message.token && message.token !== data.jwt_token) {
          await chrome.storage.local.set({ jwt_token: message.token });
        }
        const syncedList = await syncUserProfile(activeToken);
        sendResponse({ status: 'synced', count: syncedList.length, vocab: syncedList });
      } else {
        sendResponse({ status: 'no_token', vocab: [] });
      }
    })();
    return true;
  }
  
  if (message.action === 'toggle_reminders') {
    setupAlarms();
    sendResponse({ status: 'updated' });
  }

  if (message.action === 'open_sidepanel') {
    if (sender.tab) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
    }
  }

  if (message.action === 'trigger_immediate_alarm') {
    if (sender.tab) {
      triggerVocabReminderImmediate(sender.tab.id);
    }
  }

  if (message.action === 'capture_screen') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse(dataUrl);
    });
    return true; // async response
  }
});

async function triggerVocabReminderImmediate(tabId) {
  if (tabId) {
    chrome.tabs.sendMessage(tabId, {
      action: "show_reminder"
    });
  }
}

// Synchronize User Profile and Schedule preferences from Web backend
async function syncUserProfile(token) {
  try {
    const baseUrl = await getBaseUrl();
    const userRes = await fetch(`${baseUrl}/study-plan/get`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (userRes.ok) {
      const data = await userRes.json();
      if (data && data.has_plan) {
        await chrome.storage.local.set({
          study_schedule: {
            level: data.preferences.level || 'General',
            topic: data.preferences.topic || 'N/A',
            study_focus: data.preferences.study_focus || 'Toàn diện'
          }
        });
        console.log("User schedule synced: ", data.preferences.topic);
      }
    }

    // Fetch and sync user vocabulary lab
    const vocabRes = await fetch(`${baseUrl}/vocabulary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (vocabRes.ok) {
      const vocabList = await vocabRes.json();
      await chrome.storage.local.set({ user_vocab: vocabList });
      console.log("Synced user vocabulary cards count: ", vocabList.length);

      // Validate and clean up any stale active quiz state
      const { active_quiz_state } = await chrome.storage.local.get(['active_quiz_state']);
      if (active_quiz_state && active_quiz_state.mode === 'vocab' && active_quiz_state.shuffledList) {
        const validWords = new Set(vocabList.map(v => (v.word || '').toLowerCase()));
        const isStale = active_quiz_state.shuffledList.some(item => !validWords.has((item.word || '').toLowerCase()));
        if (isStale || vocabList.length < 2) {
          await chrome.storage.local.set({ active_quiz_state: null });
          console.log("Stale active_quiz_state cleared after vocab sync.");
        }
      }
      return vocabList;
    }
  } catch (err) {
    console.error("Failed to sync user data: ", err);
  }
  return [];
}

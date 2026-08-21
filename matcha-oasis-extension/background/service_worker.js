const BASE_URL = 'https://ieltsoasis.site/api';

// Install event
chrome.runtime.onInstalled.addListener(() => {
  console.log("Mát Cha AI Eo extension installed.");
  // Create context menus for selected text
  chrome.contextMenus.create({
    id: "explain-with-matcha",
    title: "Giải thích bằng Mát Cha AI 🍵",
    contexts: ["selection"]
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
        chrome.alarms.create("study-reminder", {
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

    // Send to active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.url && !activeTab.url.includes("ieltsoasis.site")) {
      chrome.tabs.sendMessage(activeTab.id, {
        action: "show_reminder"
      });
    }
  }
});

// Helper to fetch vocab reminder
async function fetchVocabReminder(token) {
  try {
    const response = await fetch(`${BASE_URL}/vocabulary`, {
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
    const userRes = await fetch(`${BASE_URL}/study-plan/get`, {
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
    const vocabRes = await fetch(`${BASE_URL}/vocabulary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (vocabRes.ok) {
      const vocabList = await vocabRes.json();
      await chrome.storage.local.set({ user_vocab: vocabList });
      console.log("Synced user vocabulary cards count: ", vocabList.length);
    }
  } catch (err) {
    console.error("Failed to sync user data: ", err);
  }
}

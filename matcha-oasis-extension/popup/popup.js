document.addEventListener('DOMContentLoaded', async () => {
  const authSection = document.getElementById('auth-section');
  const mainSection = document.getElementById('main-section');
  const btnLogin = document.getElementById('btn-login');
  
  const userNameEl = document.getElementById('user-name');
  const studyLevelEl = document.getElementById('study-level');
  const studyTopicEl = document.getElementById('study-topic');
  const studyFocusEl = document.getElementById('study-focus');
  const toggleReminders = document.getElementById('toggle-reminders');
  const btnOpenPanel = document.getElementById('btn-open-panel');

  // Check current config
  let data = await chrome.storage.local.get(['jwt_token', 'user_info', 'study_schedule', 'reminders_enabled']);
  
  // Dynamic zero-touch token recovery from open ieltsoasis.site tabs
  if (!data.jwt_token) {
    const tabs = await chrome.tabs.query({ url: "*://*.ieltsoasis.site/*" });
    if (tabs && tabs.length > 0) {
      for (const tab of tabs) {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              return {
                token: localStorage.getItem("oasis_token"),
                user: localStorage.getItem("oasis_user")
              };
            }
          });
          if (results && results[0] && results[0].result) {
            const fetched = results[0].result;
            if (fetched.token) {
              await new Promise((resolve) => {
                chrome.runtime.sendMessage({ 
                  action: 'save_jwt_token', 
                  token: fetched.token,
                  user: fetched.user
                }, () => {
                  resolve();
                });
              });
              // Refresh configuration data
              data = await chrome.storage.local.get(['jwt_token', 'user_info', 'study_schedule', 'reminders_enabled']);
              break; // Found token, break loop
            }
          }
        } catch (err) {
          console.error("Failed to recover token from tab ID " + tab.id + ": ", err);
        }
      }
    }
  }

  if (data.jwt_token) {
    authSection.style.display = 'none';
    mainSection.style.display = 'flex';
    
    // Display user profile info
    if (data.user_info) {
      userNameEl.textContent = data.user_info.username || 'Học viên';
    } else {
      // Decode JWT token basic username fallback
      try {
        const payload = JSON.parse(atob(data.jwt_token.split('.')[1]));
        if (payload) {
          userNameEl.textContent = payload.sub || 'Học viên';
        }
      } catch (e) {}
    }
    
    if (data.study_schedule) {
      studyLevelEl.textContent = data.study_schedule.level || 'General';
      studyTopicEl.textContent = data.study_schedule.topic || 'N/A';
      studyFocusEl.textContent = data.study_schedule.study_focus || 'Toàn diện';
    }
    
    // Set toggle state
    toggleReminders.checked = data.reminders_enabled !== false;
  } else {
    authSection.style.display = 'flex';
    mainSection.style.display = 'none';
  }

  // Toggle alarm reminders
  toggleReminders.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.local.set({ reminders_enabled: isEnabled });
    chrome.runtime.sendMessage({ action: 'toggle_reminders', enabled: isEnabled });
  });

  // Open side panel
  btnOpenPanel.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab) {
      chrome.sidePanel.open({ tabId: tab.id });
    }
  });
});

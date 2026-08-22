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
  let data = await chrome.storage.local.get(['jwt_token', 'user_info', 'study_schedule', 'reminders_enabled', 'server_url']);
  
  // Set fallback server URL if not set
  if (!data.server_url) {
    await chrome.storage.local.set({ server_url: 'https://ieltsoasis.site' });
    data.server_url = 'https://ieltsoasis.site';
  }

  // Dynamic zero-touch token recovery from all active tabs to support localhost/VPS
  const tabs = await chrome.tabs.query({});
  if (tabs && tabs.length > 0) {
    for (const tab of tabs) {
      if (!tab.url) continue;
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            return {
              token: localStorage.getItem("oasis_token"),
              user: localStorage.getItem("oasis_user"),
              origin: window.location.origin
            };
          }
        });
        if (results && results[0] && results[0].result) {
          const fetched = results[0].result;
          if (fetched.token) {
            // Dynamically set server URL to match the current running environment (dev / VPS / prod)
            const detectedUrl = fetched.origin;
            await chrome.storage.local.set({ server_url: detectedUrl });
            
            await new Promise((resolve) => {
              chrome.runtime.sendMessage({ 
                action: 'save_jwt_token', 
                token: fetched.token,
                user: fetched.user,
                server_url: detectedUrl
              }, () => {
                resolve();
              });
            });
            // Refresh configuration data
            data = await chrome.storage.local.get(['jwt_token', 'user_info', 'study_schedule', 'reminders_enabled', 'server_url']);
            break; // Found token, break loop
          } else if (fetched.origin && (fetched.origin.includes('localhost') || fetched.origin.includes('ieltsoasis') || fetched.origin.includes('127.0.0.1'))) {
            // Even if not logged in, update server_url to help login button redirect to local/VPS instance
            await chrome.storage.local.set({ server_url: fetched.origin });
            data.server_url = fetched.origin;
          }
        }
      } catch (err) {
        // Ignore script failures on system tabs (chrome:// etc)
      }
    }
  }

  // Update Login button to target active server URL
  btnLogin.href = `${data.server_url}/api/auth/discord/login?redirect_uri=${encodeURIComponent(data.server_url + '/auth/callback')}`;

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

  // Display current server URL
  const serverUrlEl = document.getElementById('current-server-url');
  if (serverUrlEl) {
    serverUrlEl.textContent = data.server_url;
  }

  // Reset server URL button handler
  const btnResetServer = document.getElementById('btn-reset-server');
  if (btnResetServer) {
    btnResetServer.addEventListener('click', async () => {
      const prodUrl = 'https://ieltsoasis.site';
      await chrome.storage.local.set({ 
        server_url: prodUrl,
        jwt_token: null, // Clear token so they can re-login to production
        user_info: null
      });
      alert('Đã khôi phục kết nối về ieltsoasis.site! Tiện ích sẽ tải lại.');
      window.location.reload();
      // Notify service worker to update its cached URL
      chrome.runtime.sendMessage({ action: 'save_jwt_token', token: null });
    });
  }

  // Open side panel
  btnOpenPanel.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab) {
      chrome.sidePanel.open({ tabId: tab.id });
    }
  });
});

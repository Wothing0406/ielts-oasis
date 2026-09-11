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
  let data = await chrome.storage.local.get(['jwt_token', 'user_info', 'study_schedule', 'reminders_enabled', 'server_url', 'user_vocab']);
  
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
            data = await chrome.storage.local.get(['jwt_token', 'user_info', 'study_schedule', 'reminders_enabled', 'server_url', 'user_vocab']);
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

  // Handle Username/Password Login in Popup
  const popupLoginForm = document.getElementById('popup-login-form');
  const popupUsernameInput = document.getElementById('popup-username');
  const popupPasswordInput = document.getElementById('popup-password');
  const btnSubmitPwd = document.getElementById('btn-submit-pwd');
  const popupLoginError = document.getElementById('popup-login-error');

  if (popupLoginForm) {
    popupLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = popupUsernameInput.value.trim();
      const password = popupPasswordInput.value.trim();
      if (!username || !password) return;

      btnSubmitPwd.textContent = 'Đang kiểm tra...';
      btnSubmitPwd.disabled = true;
      popupLoginError.style.display = 'none';

      try {
        const resp = await fetch(`${data.server_url}/api/auth/extension-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        if (resp.ok) {
          const resJson = await resp.json();
          if (resJson && resJson.token) {
            await chrome.storage.local.set({ jwt_token: resJson.token });
            chrome.runtime.sendMessage({ action: 'save_jwt_token', token: resJson.token, user: resJson.user }, () => {
              window.location.reload();
            });
            return;
          }
        }
        const errJson = await resp.json().catch(() => ({}));
        popupLoginError.textContent = errJson.detail || 'Tên đăng nhập hoặc mật khẩu không đúng!';
        popupLoginError.style.display = 'block';
      } catch (err) {
        console.error("Login error:", err);
        popupLoginError.textContent = 'Lỗi kết nối máy chủ. Vui lòng thử lại!';
        popupLoginError.style.display = 'block';
      } finally {
        btnSubmitPwd.textContent = 'Đăng nhập bằng Mật khẩu ➔';
        btnSubmitPwd.disabled = false;
      }
    });
  }

  // Update Login button to target active server URL with direct OAuth redirection
  btnLogin.addEventListener('click', async (e) => {
    e.preventDefault();
    btnLogin.textContent = 'Đang mở Discord...';
    try {
      const redirectUri = encodeURIComponent(data.server_url + '/auth/callback');
      const resp = await fetch(`${data.server_url}/api/auth/discord/login?redirect_uri=${redirectUri}`);
      if (resp.ok) {
        const resJson = await resp.json();
        if (resJson && resJson.url) {
          chrome.tabs.create({ url: resJson.url });
          return;
        }
      }
      chrome.tabs.create({ url: `${data.server_url}/auth/callback` });
    } catch (err) {
      console.error(err);
      chrome.tabs.create({ url: data.server_url });
    } finally {
      btnLogin.textContent = '👾 Đăng nhập Discord OAuth2';
    }
  });

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

    // Display user vocabulary count
    const vocabCountEl = document.getElementById('study-vocab-count');
    if (vocabCountEl) {
      vocabCountEl.textContent = `${data.user_vocab ? data.user_vocab.length : 0} từ`;
    }

    // Proactively refresh vocab count from backend in background
    chrome.runtime.sendMessage({ action: 'sync_vocab', token: data.jwt_token });
    
    // Set toggle state
    toggleReminders.checked = data.reminders_enabled !== false;
  } else {
    authSection.style.display = 'flex';
    mainSection.style.display = 'none';
  }

  // Handle manual sync vocabulary button in popup
  const btnSyncVocab = document.getElementById('btn-sync-vocab');
  if (btnSyncVocab) {
    btnSyncVocab.addEventListener('click', async () => {
      btnSyncVocab.textContent = 'Đang đồng bộ... ⏳';
      btnSyncVocab.disabled = true;
      const res = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: 'sync_vocab', token: data.jwt_token }, resolve);
      }).catch(() => null);
      const fresh = await chrome.storage.local.get(['user_vocab']);
      const count = fresh.user_vocab ? fresh.user_vocab.length : 0;
      const vocabCountEl = document.getElementById('study-vocab-count');
      if (vocabCountEl) vocabCountEl.textContent = `${count} từ`;
      btnSyncVocab.textContent = `Đã đồng bộ (${count} từ) ✅`;
      setTimeout(() => {
        btnSyncVocab.textContent = '🔄 Đồng bộ kho từ vựng';
        btnSyncVocab.disabled = false;
      }, 2000);
    });
  }

  // Real-time update for vocab count if storage updates while popup is open
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.user_vocab) {
      const vocabCountEl = document.getElementById('study-vocab-count');
      if (vocabCountEl) {
        const list = changes.user_vocab.newValue || [];
        vocabCountEl.textContent = `${list.length} từ`;
      }
    }
  });

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

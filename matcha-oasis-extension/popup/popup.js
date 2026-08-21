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
  const data = await chrome.storage.local.get(['jwt_token', 'user_info', 'study_schedule', 'reminders_enabled']);
  
  if (data.jwt_token) {
    authSection.style.display = 'none';
    mainSection.style.display = 'flex';
    
    // Display user profile info
    if (data.user_info) {
      userNameEl.textContent = data.user_info.username || 'Học viên';
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

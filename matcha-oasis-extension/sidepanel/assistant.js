// sidepanel/assistant.js — Mát Cha AI Eo Chatbot v2

let BASE_URL = 'https://ieltsoasis.site/api';
let conversationHistory = []; // Multi-turn history

async function getBaseUrl() {
  const data = await chrome.storage.local.get(['server_url']);
  if (data.server_url) {
    BASE_URL = data.server_url + '/api';
  }
  return BASE_URL;
}

// Simple markdown renderer: bold, italic, code, line breaks
function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:#F1F8E9;padding:1px 4px;border-radius:4px;font-size:0.85em;">$1</code>')
    .replace(/\n/g, '<br>');
}

document.addEventListener('DOMContentLoaded', async () => {
  const chatArea = document.getElementById('chat-area');
  const chatInput = document.getElementById('chat-input');
  const btnSend = document.getElementById('btn-send');
  const userNameEl = document.getElementById('user-name');

  // Load user info to show greeting
  const stored = await chrome.storage.local.get(['selected_word', 'jwt_token', 'user_info']);

  if (stored.user_info && userNameEl) {
    userNameEl.textContent = `Xin chào, ${stored.user_info.username || 'Học viên'}! 🍵`;
  }

  // Handle pre-selected word from context menu
  if (stored.selected_word) {
    const wordMsg = `Giải nghĩa từ: "${stored.selected_word}"`;
    appendMessage('user', wordMsg);
    await sendToAI(wordMsg, stored.jwt_token);
    chrome.storage.local.remove('selected_word');
  }

  btnSend.addEventListener('click', () => handleSend());

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Suggested quick prompts
  document.querySelectorAll('.quick-prompt').forEach(btn => {
    btn.addEventListener('click', () => {
      chatInput.value = btn.getAttribute('data-prompt');
      handleSend();
    });
  });

  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';

    const data = await chrome.storage.local.get(['jwt_token']);
    await sendToAI(text, data.jwt_token);
  }

  async function sendToAI(text, token) {
    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Show typing indicator
    const typingId = appendTyping();

    try {
      const baseUrl = await getBaseUrl();

      // Build a conversational prompt with history context for multi-turn chat
      const recentHistory = conversationHistory.slice(-6);
      const historyContext = recentHistory.length > 1
        ? recentHistory.map(m => `${m.role === 'user' ? 'Học viên' : 'Mát Cha'}: ${m.content}`).join('\n')
        : text;

      const response = await fetch(`${baseUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ text: historyContext })
      });

      removeTyping(typingId);

      if (response.ok) {
        const result = await response.json();
        const aiMsg = result.meaning || 'Mát Cha chưa hiểu ý cậu lắm. Hãy thử lại nhé!';
        appendMessage('ai', aiMsg);
        conversationHistory.push({ role: 'ai', content: aiMsg });
        // Keep history limited to 20 messages
        if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);
      } else {
        appendMessage('ai', '❌ Lỗi kết nối máy chủ. Hãy thử lại hoặc kiểm tra kết nối mạng nhé!');
      }
    } catch (e) {
      console.error(e);
      removeTyping(typingId);
      appendMessage('ai', '❌ Không thể kết nối đến Matcha Server. Hãy kiểm tra đường truyền nhé!');
    }
  }

  function appendMessage(sender, content) {
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;
    if (sender === 'ai') {
      msg.innerHTML = renderMarkdown(content);
    } else {
      msg.textContent = content;
    }
    chatArea.appendChild(msg);
    chatArea.scrollTop = chatArea.scrollHeight;
    return msg;
  }

  function appendTyping() {
    const id = 'typing-' + Date.now();
    const msg = document.createElement('div');
    msg.className = 'message ai typing-indicator';
    msg.id = id;
    msg.innerHTML = '<span></span><span></span><span></span>';
    chatArea.appendChild(msg);
    chatArea.scrollTop = chatArea.scrollHeight;
    return id;
  }

  function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
});


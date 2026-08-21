const BASE_URL = 'https://ieltsoasis.site/api';

document.addEventListener('DOMContentLoaded', async () => {
  const chatArea = document.getElementById('chat-area');
  const chatInput = document.getElementById('chat-input');
  const btnSend = document.getElementById('btn-send');

  // Check if there is an active selection passed from context menu
  const stored = await chrome.storage.local.get(['selected_word', 'jwt_token']);
  if (stored.selected_word) {
    appendMessage('user', `Giải nghĩa từ: "${stored.selected_word}"`);
    explainWord(stored.selected_word, stored.jwt_token);
    // Clear selection
    chrome.storage.local.remove('selected_word');
  }

  btnSend.addEventListener('click', () => {
    handleSend();
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';

    const data = await chrome.storage.local.get(['jwt_token']);
    
    // Check if it is a slash command
    if (text.startsWith('/define ')) {
      const word = text.replace('/define ', '').trim();
      explainWord(word, data.jwt_token);
    } else if (text.startsWith('/rephrase ')) {
      const phrase = text.replace('/rephrase ', '').trim();
      rephraseText(phrase, data.jwt_token);
    } else {
      // General translation query
      explainWord(text, data.jwt_token);
    }
  }

  function appendMessage(sender, content) {
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;
    msg.textContent = content;
    chatArea.appendChild(msg);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  async function explainWord(word, token) {
    appendMessage('ai', 'Mát Cha AI đang suy nghĩ... 🍵');
    try {
      const response = await fetch(`${BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ text: word })
      });
      
      const lastMsg = chatArea.querySelector('.ai:last-child');
      if (lastMsg && lastMsg.textContent.includes("đang suy nghĩ")) {
        chatArea.removeChild(lastMsg);
      }

      if (response.ok) {
        const result = await response.json();
        appendMessage('ai', result.meaning || 'Không tìm thấy kết nghĩa.');
      } else {
        appendMessage('ai', 'Lỗi kết nối máy chủ. Vui lòng kết nối tài khoản Web trước.');
      }
    } catch (e) {
      console.error(e);
      appendMessage('ai', 'Đã xảy ra lỗi khi liên lạc với Matcha Server.');
    }
  }

  async function rephraseText(phrase, token) {
    appendMessage('ai', 'Mát Cha AI đang viết lại câu... 📝');
    try {
      const response = await fetch(`${BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ text: `Hãy viết lại câu sau theo chuẩn học thuật IELTS: "${phrase}"` })
      });
      
      const lastMsg = chatArea.querySelector('.ai:last-child');
      if (lastMsg && lastMsg.textContent.includes("đang viết lại")) {
        chatArea.removeChild(lastMsg);
      }

      if (response.ok) {
        const result = await response.json();
        appendMessage('ai', result.meaning);
      } else {
        appendMessage('ai', 'Lỗi kết nối máy chủ.');
      }
    } catch (e) {
      console.error(e);
      appendMessage('ai', 'Lỗi liên lạc máy chủ.');
    }
  }
});

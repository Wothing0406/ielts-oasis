// content_scripts/pet_overlay.js

(function() {
  if (window.hasMatchaMascotRun) return;
  window.hasMatchaMascotRun = true;

  console.log("Matcha Study Buddy injected.");

  const isMainSite = window.location.hostname.includes("ieltsoasis.site");
  let consecutiveWrong = 0;

  async function getServerUrl() {
    const data = await chrome.storage.local.get(['server_url']);
    return data.server_url || 'https://ieltsoasis.site';
  }

  // Zero-touch token sync if on main website
  if (isMainSite) {
    const token = localStorage.getItem("oasis_token");
    if (token) {
      chrome.runtime.sendMessage({ action: 'save_jwt_token', token: token });
    }
  }

  // Create Shadow DOM Container
  const mascotRoot = document.createElement('div');
  mascotRoot.id = 'matcha-mascot-container';
  const shadow = mascotRoot.attachShadow({ mode: 'closed' });
  document.documentElement.appendChild(mascotRoot);

  // Injected CSS Styles
  const style = document.createElement('style');
  style.textContent = `
    #matcha-pet-wrapper {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 80px;
      height: 80px;
      z-index: 2147483647;
      font-family: 'Segoe UI', system-ui, sans-serif;
      pointer-events: none;
    }
    
    .pet-sprite {
      width: 80px;
      height: 80px;
      cursor: grab;
      pointer-events: auto;
      transition: transform 0.2s ease;
    }
    
    .pet-sprite:active {
      cursor: grabbing;
      transform: scale(1.1);
    }
    
    .speech-bubble {
      position: absolute;
      bottom: 90px;
      right: 0;
      background-color: #FFFDF5;
      border: 2px solid #A7D08C;
      border-radius: 1.5rem;
      padding: 12px 16px;
      width: 280px;
      box-sizing: border-box;
      color: #5D4037;
      box-shadow: 0 10px 30px rgba(167, 208, 140, 0.3);
      display: none;
      flex-direction: column;
      gap: 8px;
      pointer-events: auto;
    }

    .bubble-header {
      font-weight: bold;
      font-size: 0.95rem;
      border-bottom: 1px solid rgba(167, 208, 140, 0.3);
      padding-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .word {
      font-size: 1.1rem;
      font-weight: bold;
      color: #3b7a13;
    }

    .phonetic {
      color: #8D6E63;
      font-size: 0.85rem;
    }

    .meaning {
      font-size: 0.9rem;
      line-height: 1.3;
    }

    .example {
      font-size: 0.8rem;
      color: #795548;
      font-style: italic;
    }

    .actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      margin-top: 4px;
    }

    .btn {
      padding: 4px 10px;
      border: none;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: bold;
      cursor: pointer;
    }

    .btn-yes {
      background-color: #A7D08C;
      color: #5D4037;
    }

    .btn-no {
      background-color: #E0E0E0;
      color: #5D4037;
    }

    .close-btn {
      cursor: pointer;
      font-weight: bold;
      color: #8D6E63;
    }

    /* Interactive Quiz elements */
    .btn-choice {
      width: 100%;
      padding: 8px 12px;
      background: #FFFDF5;
      border: 1.5px solid #A7D08C;
      border-radius: 12px;
      text-align: left;
      font-size: 0.8rem;
      cursor: pointer !important;
      color: #5D4037;
      font-weight: bold;
      transition: all 0.2s;
      pointer-events: all !important;
    }

    .btn-choice:hover {
      background: #E8F5E9;
      transform: scale(1.02);
    }

    .quiz-input {
      width: 100%;
      padding: 8px 12px;
      border: 2px solid #A7D08C;
      border-radius: 12px;
      font-size: 0.85rem;
      outline: none;
      background: #FFFDF5;
      color: #5D4037;
      box-sizing: border-box;
      pointer-events: all !important;
      user-select: text !important;
      -webkit-user-select: text !important;
      position: relative;
      z-index: 1;
    }



    .quiz-feedback {
      font-weight: bold;
      font-size: 0.85rem;
      margin-top: 4px;
      text-align: center;
    }

    /* Scrollable items */
    .matcha-scroll-list {
      max-height: 150px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-right: 4px;
    }

    .matcha-scroll-list::-webkit-scrollbar {
      width: 4px;
    }

    .matcha-scroll-list::-webkit-scrollbar-thumb {
      background: #A7D08C;
      border-radius: 4px;
    }

    .list-item {
      padding: 6px 8px;
      background: #FAF8F5;
      border-left: 3px solid #A7D08C;
      font-size: 0.75rem;
      border-radius: 4px;
    }

    /* Lockout Overlay style */
    .lockout-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(167, 208, 140, 0.85);
      z-index: 2147483646;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #5D4037;
      font-family: sans-serif;
      text-align: center;
      pointer-events: auto;
    }
  `;
  shadow.appendChild(style);

  // Animation states definition
  const animationFrames = {
    idle: [
      chrome.runtime.getURL('assets/mascot/idle_1.png'),
      chrome.runtime.getURL('assets/mascot/idle_2.png'),
      chrome.runtime.getURL('assets/mascot/idle_3.png'),
      chrome.runtime.getURL('assets/mascot/idle_4.png')
    ],
    alert: [
      chrome.runtime.getURL('assets/mascot/alert_1.png'),
      chrome.runtime.getURL('assets/mascot/alert_2.png'),
      chrome.runtime.getURL('assets/mascot/alert_3.png')
    ],
    celebrating: [
      chrome.runtime.getURL('assets/mascot/celebrating_1.png'),
      chrome.runtime.getURL('assets/mascot/celebrating_2.png'),
      chrome.runtime.getURL('assets/mascot/celebrating_3.png'),
      chrome.runtime.getURL('assets/mascot/celebrating_4.png')
    ],
    crying: [
      chrome.runtime.getURL('assets/mascot/crying_1.png'),
      chrome.runtime.getURL('assets/mascot/crying_2.png'),
      chrome.runtime.getURL('assets/mascot/crying_3.png')
    ],
    tantrum: [
      chrome.runtime.getURL('assets/mascot/tantrum_1.png'),
      chrome.runtime.getURL('assets/mascot/tantrum_2.png'),
      chrome.runtime.getURL('assets/mascot/tantrum_3.png')
    ]
  };

  let currentAction = isMainSite ? 'celebrating' : 'idle';
  let frameIndex = 0;
  let animationInterval = null;

  function startAnimation(action) {
    if (animationInterval) clearInterval(animationInterval);
    currentAction = action;
    frameIndex = 0;
    
    animationInterval = setInterval(() => {
      const frames = animationFrames[currentAction];
      if (frames && frames.length > 0) {
        img.src = frames[frameIndex];
        frameIndex = (frameIndex + 1) % frames.length;
      }
    }, 300); // 300ms frame rate
  }

  // Mascot DOM Element Structure
  const wrapper = document.createElement('div');
  wrapper.id = 'matcha-pet-wrapper';
  
  const bubble = document.createElement('div');
  bubble.className = 'speech-bubble';
  
  const img = document.createElement('img');
  img.className = 'pet-sprite';
  img.alt = "Mát Cha Pet";

  wrapper.appendChild(bubble);
  wrapper.appendChild(img);
  shadow.appendChild(wrapper);

  // Start default animation loop
  startAnimation(currentAction);

  // Dragging & Clicking Implementation
  let isDragging = false;
  let dragStarted = false;
  let offsetX = 0;
  let offsetY = 0;
  let startX = 0;
  let startY = 0;

  img.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStarted = false;
    startX = e.clientX;
    startY = e.clientY;
    const rect = wrapper.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    wrapper.style.right = 'auto';
    wrapper.style.bottom = 'auto';
    wrapper.style.left = `${rect.left}px`;
    wrapper.style.top = `${rect.top}px`;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const travel = Math.sqrt((e.clientX - startX) ** 2 + (e.clientY - startY) ** 2);
      if (travel > 5) {
        dragStarted = true;
        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;
        
        // Prevent going off-screen (mascot is 80px)
        const minLeft = 10;
        const maxLeft = window.innerWidth - 90;
        const minTop = 10;
        const maxTop = window.innerHeight - 90;
        
        newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
        newTop = Math.max(minTop, Math.min(newTop, maxTop));

        wrapper.style.left = `${newLeft}px`;
        wrapper.style.top = `${newTop}px`;
      }
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Toggle Mascot menu on Click
  img.addEventListener('click', () => {
    if (!dragStarted) {
      toggleMascotMenu();
    }
  });

  function openBubble(html) {
    bubble.innerHTML = html;
    bubble.style.display = 'flex';
    const rect = wrapper.getBoundingClientRect();
    if (rect.left < 210) {
      bubble.style.right = 'auto';
      bubble.style.left = '0';
    } else {
      bubble.style.left = 'auto';
      bubble.style.right = '0';
    }

    // Stop the page from intercepting clicks/keyboard inside the bubble
    bubble.addEventListener('click', (e) => e.stopPropagation(), { capture: true });
    bubble.addEventListener('keydown', (e) => e.stopPropagation(), { capture: true });
    bubble.addEventListener('keyup', (e) => e.stopPropagation(), { capture: true });
    bubble.addEventListener('mousedown', (e) => e.stopPropagation(), { capture: true });
    bubble.addEventListener('pointerdown', (e) => e.stopPropagation(), { capture: true });

    // Auto-focus first input or textarea inside the bubble
    setTimeout(() => {
      const input = shadow.querySelector('.quiz-input') || shadow.querySelector('input') || shadow.querySelector('textarea');
      if (input) {
        input.focus();
        input.click();
      }
    }, 80);
  }

  function toggleMascotMenu() {
    if (bubble.style.display === 'flex') {
      closeBubble();
      return;
    }

    const menuHtml = `
      <div class="bubble-header">
        <span>Mát Cha AI Eo 🍵</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div style="font-weight: bold; margin: 4px 0; font-size: 0.85rem; text-align: center;">Tớ có thể giúp gì cho cậu?</div>
      <div class="actions" style="flex-direction: column; gap: 4px; align-items: stretch; width: 100%; margin: 0;">
        <button class="btn btn-yes" id="btn-sidepanel" style="width: 100%; padding: 6px;">💬 Trò chuyện AI</button>
        <button class="btn btn-yes" id="btn-ocr" style="width: 100%; padding: 6px; background: #E8F5E9; border: 1.5px solid #81C784;">📸 Quét từ vựng (OCR)</button>
        <button class="btn btn-yes" id="btn-add-vocab-ui" style="width: 100%; padding: 6px; background: #E3F2FD; border: 1.5px solid #64B5F6;">➕ Thêm nhanh từ mới</button>
        <button class="btn btn-yes" id="btn-view-vocab" style="width: 100%; padding: 6px; background: #FFF3E0; border: 1.5px solid #FFB74D;">📚 Tủ từ vựng của tớ</button>
        <button class="btn btn-yes" id="btn-grammar-quiz" style="width: 100%; padding: 6px; background: #FCE4EC; border: 1.5px solid #F48FB1;">🧩 Quiz Ngữ Pháp AI</button>
        <button class="btn btn-yes" id="btn-vocab-quiz" style="width: 100%; padding: 6px; background: #FFF9E6; border: 1.5px solid #A7D08C;">📝 Ôn từ vựng (Quiz)</button>
        <button class="btn btn-yes" id="btn-view-schedule" style="width: 100%; padding: 6px; background: #F3E5F5; border: 1.5px solid #BA68C8;">📅 Lịch học của tớ</button>
      </div>
    `;
    openBubble(menuHtml);
    startAnimation('alert');

    // Hook Menu Events
    shadow.getElementById('close-bubble').addEventListener('click', closeBubble);
    
    shadow.getElementById('btn-sidepanel').addEventListener('click', () => {
      closeBubble();
      chrome.runtime.sendMessage({ action: 'open_sidepanel' });
    });

    shadow.getElementById('btn-ocr').addEventListener('click', () => {
      closeBubble();
      if (window.startMatchaOCR) {
        window.startMatchaOCR(handleOCRWordDetected);
      }
    });

    shadow.getElementById('btn-add-vocab-ui').addEventListener('click', showQuickAddForm);

    shadow.getElementById('btn-view-vocab').addEventListener('click', showVocabListUI);

    shadow.getElementById('btn-grammar-quiz').addEventListener('click', showGrammarQuizUI);

    shadow.getElementById('btn-vocab-quiz').addEventListener('click', async () => {
      closeBubble();
      chrome.runtime.sendMessage({ action: 'trigger_immediate_alarm' });
    });

    shadow.getElementById('btn-view-schedule').addEventListener('click', showStudyScheduleUI);
  }


  // Quick Manual Add Word UI
  function showQuickAddForm() {
    const formHtml = `
      <div class="bubble-header">
        <span>Thêm nhanh từ mới ➕</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; width:100%; max-height: 250px; overflow-y: auto;">
        <input type="text" id="add-word" class="quiz-input" placeholder="Từ tiếng Anh (e.g. dynamic)" required />
        <button class="btn btn-yes" id="btn-ai-autofill" style="padding:6px; background:#E8F5E9; border:1px solid #81C784; font-size:0.75rem;">🤖 Tự động dịch (AI)</button>
        <input type="text" id="add-phonetic" class="quiz-input" placeholder="Phát âm /.../ (Không bắt buộc)" />
        <input type="text" id="add-meaning" class="quiz-input" placeholder="Nghĩa tiếng Việt (Không bắt buộc nếu dùng AI)" />
        <input type="text" id="add-example" class="quiz-input" placeholder="Ví dụ minh họa (Không bắt buộc)" />
        
        <label style="display:flex; align-items:center; gap:6px; font-size:0.75rem; font-weight:bold; color:#5D4037; padding:4px 0;">
          <input type="checkbox" id="add-global" checked />
          <span>Chia sẻ lên cộng đồng 🌍</span>
        </label>
        
        <button class="btn btn-yes" id="btn-submit-quick-add" style="margin-top:4px; padding:8px;">Lưu Từ Vựng 🍵</button>
      </div>
    `;
    openBubble(formHtml);

    shadow.getElementById('close-bubble').addEventListener('click', closeBubble);

    const wordInput = shadow.getElementById('add-word');
    const meaningInput = shadow.getElementById('add-meaning');
    const phoneticInput = shadow.getElementById('add-phonetic');
    const autofillBtn = shadow.getElementById('btn-ai-autofill');

    autofillBtn.addEventListener('click', async () => {
      const word = wordInput.value.trim();
      if (!word) {
        alert("Vui lòng nhập từ tiếng Anh trước!");
        return;
      }
      autofillBtn.textContent = "Đang tra cứu AI...";
      autofillBtn.setAttribute('disabled', 'true');
      try {
        const serverUrl = await getServerUrl();
        // Use full=1 flag to request complete vocab card data
        const response = await fetch(`${serverUrl}/api/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: word, full: true })
        });
        if (response.ok) {
          const result = await response.json();
          // Parse structured response — server returns full meaning block
          const raw = result.meaning || '';
          // Try to extract phonetic /.../ pattern
          const phoneticMatch = raw.match(new RegExp('\/[^\/]+\/'));
          if (phoneticMatch && !phoneticInput.value) {
            phoneticInput.value = phoneticMatch[0];
          }
          // Set full meaning (strip phonetic if extracted)
          meaningInput.value = raw.replace(new RegExp('\/[^\/]+\/'), '').replace(/^[,\s]+/, '').trim() || raw;
          // Extract example — look for sentence after 'VD:' or 'Example:'
          const exampleMatch = raw.match(new RegExp('(?:VD|V\u00ed d\u1ee5|Example)[:\\s]+(.+?)(?:\\n|$)', 'i'));
          const exampleInput = shadow.getElementById('add-example');
          if (exampleMatch && exampleInput && !exampleInput.value) {
            exampleInput.value = exampleMatch[1].trim();
          }
        }
      } catch (err) {
        console.error(err);
        alert('Lỗi kết nối. Vui lòng nhập thủ công!');
      } finally {
        autofillBtn.textContent = "🤖 Tự động dịch (AI)";
        autofillBtn.removeAttribute('disabled');
      }
    });

    shadow.getElementById('btn-submit-quick-add').addEventListener('click', async () => {
      const word = wordInput.value.trim();
      const phonetic = phoneticInput.value.trim();
      const meaning = meaningInput.value.trim();
      const example = shadow.getElementById('add-example').value.trim();
      const isGlobal = shadow.getElementById('add-global').checked;

      if (!word) {
        alert("Vui lòng điền Từ tiếng Anh!");
        return;
      }

      const data = await chrome.storage.local.get(['jwt_token']);
      if (!data.jwt_token) {
        alert("Vui lòng kết nối tài khoản ở popup tiện ích trước nhé!");
        return;
      }

      try {
        const serverUrl = await getServerUrl();
        const res = await fetch(`${serverUrl}/api/vocabulary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.jwt_token}`
          },
          body: JSON.stringify({
            word,
            meaning: meaning || "Đang dịch tự động...",
            phonetic: phonetic || "/.../",
            example,
            is_global: isGlobal,
            topic: 'General',
            source: 'Mascot Quick Add'
          })
        });
        if (res.ok) {
          alert(`Đã lưu thành công từ "${word}" vào Tủ Từ! 🍵`);
          closeBubble();
          // Trigger a sync refresh
          chrome.runtime.sendMessage({ action: 'save_jwt_token', token: data.jwt_token });
        } else {
          const errData = await res.json();
          alert(errData.detail || "Lỗi lưu từ vựng.");
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  // Show Synced Vocabulary List directly inside Pet bubble
  async function showVocabListUI() {
    const data = await chrome.storage.local.get(['user_vocab']);
    const list = data.user_vocab || [];

    let listHtml = '';
    if (list.length === 0) {
      listHtml = '<div style="font-size:0.8rem; text-align:center; padding:10px;">Kho từ trống. Hãy thêm từ vựng mới nhé! 🍵</div>';
    } else {
      listHtml = `<div class="matcha-scroll-list" id="vocab-scroll-list">`;
      list.forEach((v, idx) => {
        listHtml += `
          <div class="list-item vocab-clickable" data-idx="${idx}" style="cursor:pointer; transition:background 0.15s;">
            <div style="font-weight:bold; color:#3b7a13; font-size:0.8rem; display:flex; justify-content:space-between;">
              <span>${v.word}</span>
              <span style="font-weight:normal; color:#8D6E63; font-size:0.7rem;">${v.phonetic || ''}</span>
            </div>
            <div style="color:#5D4037; font-size:0.75rem;">${v.meaning ? v.meaning.slice(0, 60) + (v.meaning.length > 60 ? '...' : '') : ''}</div>
          </div>
        `;
      });
      listHtml += `</div>`;
    }

    const listHtmlContent = `
      <div class="bubble-header">
        <span>Tủ từ của tớ (${list.length}) 📚</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div style="font-size:0.7rem; color:#8D6E63; text-align:center; margin-bottom:4px;">Bấm vào từng từ để xem chi tiết & mẹo nhớ 👇</div>
      ${listHtml}
      <button class="btn btn-yes" id="btn-back-menu" style="width:100%; margin-top:4px;">Quay lại</button>
    `;
    openBubble(listHtmlContent);

    shadow.getElementById('close-bubble').addEventListener('click', closeBubble);
    shadow.getElementById('btn-back-menu').addEventListener('click', toggleMascotMenu);

    // Attach click handlers to each word item
    shadow.querySelectorAll('.vocab-clickable').forEach(el => {
      el.addEventListener('mouseenter', () => { el.style.background = '#E8F5E9'; });
      el.addEventListener('mouseleave', () => { el.style.background = ''; });
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-idx'));
        showVocabDetailPopup(list[idx]);
      });
    });
  }

  // Show detail card for a single vocabulary word
  async function showVocabDetailPopup(v) {
    // Fetch extra AI tips if memory_hook is missing
    let memoryHook = v.memory_hook || '';
    if (!memoryHook && v.word) {
      try {
        const serverUrl = await getServerUrl();
        const resp = await fetch(`${serverUrl}/api/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `Mẹo nhớ nhanh từ vựng: ${v.word}` })
        });
        if (resp.ok) {
          const r = await resp.json();
          memoryHook = r.meaning || '';
        }
      } catch(e) { /* ignore */ }
    }

    const masteryStars = '⭐'.repeat(Math.min(v.mastery_level || 1, 5));
    const detailHtml = `
      <div class="bubble-header">
        <span>Chi tiết từ vựng 📖</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; font-size:0.82rem;">
        <div style="text-align:center;">
          <div style="font-size:1.3rem; font-weight:bold; color:#3b7a13;">${v.word}</div>
          <div style="color:#8D6E63; font-size:0.85rem;">${v.phonetic || ''}</div>
          <div style="color:#A7D08C; font-size:0.75rem; margin-top:2px;">Độ thuần thục: ${masteryStars}</div>
        </div>
        <div style="background:#F1F8E9; border-left:3px solid #A7D08C; padding:6px 8px; border-radius:6px;">
          <div style="font-weight:bold; color:#5D4037; font-size:0.75rem; margin-bottom:2px;">📝 Nghĩa:</div>
          <div style="color:#5D4037;">${v.meaning || 'Chưa có nghĩa'}</div>
        </div>
        ${v.example ? `
        <div style="background:#FFF9E6; border-left:3px solid #FFD54F; padding:6px 8px; border-radius:6px;">
          <div style="font-weight:bold; color:#5D4037; font-size:0.75rem; margin-bottom:2px;">💬 Ví dụ:</div>
          <div style="color:#795548; font-style:italic;">"${v.example}"</div>
        </div>` : ''}
        ${memoryHook ? `
        <div style="background:#F3E5F5; border-left:3px solid #CE93D8; padding:6px 8px; border-radius:6px;">
          <div style="font-weight:bold; color:#5D4037; font-size:0.75rem; margin-bottom:2px;">🧠 Mẹo nhớ:</div>
          <div style="color:#6A1B9A; font-size:0.78rem;">${memoryHook}</div>
        </div>` : '<div style="color:#8D6E63; font-size:0.72rem; text-align:center;">Đang tải mẹo nhớ...</div>'}
      </div>
      <button class="btn btn-yes" id="btn-back-list" style="width:100%; margin-top:6px;">← Quay lại danh sách</button>
    `;
    openBubble(detailHtml);

    shadow.getElementById('close-bubble').addEventListener('click', closeBubble);
    shadow.getElementById('btn-back-list').addEventListener('click', showVocabListUI);
  }

  // Grammar Quiz UI — fetches from backend or uses local vocab
  async function showGrammarQuizUI() {
    openBubble(`
      <div class="bubble-header">
        <span>Quiz Ngữ Pháp 📝</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div style="text-align:center; padding:16px; font-size:0.85rem; color:#5D4037;">
        ⏳ Đang tải câu hỏi từ server...
      </div>
    `);
    shadow.getElementById('close-bubble').addEventListener('click', closeBubble);

    try {
      const serverUrl = await getServerUrl();
      const resp = await fetch(`${serverUrl}/api/quiz/grammar`);
      if (!resp.ok) throw new Error('Server error');
      const result = await resp.json();
      const questions = result.questions || [];

      if (!questions.length) {
        openBubble(`<div class="bubble-header"><span>Quiz 📝</span><span class="close-btn" id="close-bubble">×</span></div><div style="text-align:center;padding:10px;font-size:0.82rem;">Không lấy được câu hỏi. Thử lại sau! 🍵</div>`);
        shadow.getElementById('close-bubble').addEventListener('click', closeBubble);
        return;
      }

      let currentQ = 0;
      let score = 0;

      function renderQuestion() {
        if (currentQ >= questions.length) {
          // Show result
          openBubble(`
            <div class="bubble-header">
              <span>Kết quả Quiz 🎉</span>
              <span class="close-btn" id="close-bubble">×</span>
            </div>
            <div style="text-align:center; padding:12px; font-size:0.9rem;">
              <div style="font-size:2rem; margin-bottom:8px;">${score >= questions.length * 0.7 ? '🎉' : score >= questions.length * 0.5 ? '😊' : '😢'}</div>
              <div style="font-weight:bold; color:#3b7a13; font-size:1.1rem;">${score}/${questions.length} câu đúng!</div>
              <div style="color:#8D6E63; margin-top:4px; font-size:0.78rem;">${score >= questions.length * 0.7 ? 'Xuất sắc! Cậu học giỏi lắm! 🍵' : score >= questions.length * 0.5 ? 'Khá tốt, tiếp tục cố gắng nhé!' : 'Ôn luyện thêm một chút nữa nhé!'}</div>
            </div>
            <button class="btn btn-yes" id="btn-retry-quiz" style="width:100%; margin-top:6px;">Chơi lại 🔄</button>
            <button class="btn btn-no" id="btn-back-menu-quiz" style="width:100%; margin-top:4px;">Quay lại Menu</button>
          `);
          shadow.getElementById('close-bubble').addEventListener('click', closeBubble);
          shadow.getElementById('btn-retry-quiz').addEventListener('click', () => { currentQ = 0; score = 0; renderQuestion(); });
          shadow.getElementById('btn-back-menu-quiz').addEventListener('click', toggleMascotMenu);
          if (score >= questions.length * 0.7) startAnimation('celebrating');
          else startAnimation('crying');
          return;
        }

        const q = questions[currentQ];
        const choices = q.choices || [];
        const quizHtml = `
          <div class="bubble-header">
            <span>Quiz ${currentQ + 1}/${questions.length} 📝</span>
            <span class="close-btn" id="close-bubble">×</span>
          </div>
          <div style="font-size:0.82rem; color:#5D4037; margin-bottom:6px; line-height:1.4;">${q.question}</div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            ${choices.map((c, i) => `
              <button class="btn-choice" data-ans="${c}" data-correct="${c === q.answer}">
                ${String.fromCharCode(65+i)}. ${c}
              </button>
            `).join('')}
          </div>
          <div id="qfeedback" class="quiz-feedback"></div>
        `;
        openBubble(quizHtml);
        shadow.getElementById('close-bubble').addEventListener('click', closeBubble);

        shadow.querySelectorAll('.btn-choice').forEach(btn => {
          btn.addEventListener('click', () => {
            const isCorrect = btn.getAttribute('data-correct') === 'true';
            const fb = shadow.getElementById('qfeedback');
            shadow.querySelectorAll('.btn-choice').forEach(b => b.setAttribute('disabled', 'true'));
            if (isCorrect) {
              score++;
              btn.style.background = '#E8F5E9';
              btn.style.borderColor = '#81C784';
              fb.innerHTML = '<span style="color:#2E7D32;">✓ Chính xác! 🍵</span>';
              startAnimation('celebrating');
            } else {
              btn.style.background = '#FFEBEE';
              btn.style.borderColor = '#E57373';
              fb.innerHTML = `<span style="color:#C62828;">✗ Đáp án đúng: <b>${q.answer}</b></span>`;
              startAnimation('crying');
            }
            setTimeout(() => { currentQ++; renderQuestion(); }, 2000);
          });
        });
      }

      renderQuestion();

    } catch (err) {
      console.error(err);
      // Fallback: vocab quiz using local words
      showVocabReminder();
    }
  }

  // Show Synced Study Plan details
  async function showStudyScheduleUI() {
    const data = await chrome.storage.local.get(['study_schedule', 'user_info']);
    const sched = data.study_schedule || { level: 'General', topic: 'N/A', study_focus: 'Toàn diện' };
    const user = data.user_info || { username: 'Học viên' };

    const schedHtml = `
      <div class="bubble-header">
        <span>Lịch học của tớ 📅</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:6px;">
        <div><b>Học viên:</b> ${user.username}</div>
        <div><b>Trình độ hiện tại:</b> ${sched.level || 'General'}</div>
        <div><b>Chủ đề học mục tiêu:</b> ${sched.topic || 'Chưa thiết lập'}</div>
        <div><b>Kỹ năng tập trung:</b> ${sched.study_focus || 'Toàn diện'}</div>
      </div>
      <button class="btn btn-yes" id="btn-back-menu" style="width:100%; margin-top:6px;">Quay lại</button>
    `;
    openBubble(schedHtml);

    shadow.getElementById('close-bubble').addEventListener('click', closeBubble);
    shadow.getElementById('btn-back-menu').addEventListener('click', toggleMascotMenu);
  }

  // Reminders and Quiz triggers
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'show_reminder' && !isMainSite) {
      showVocabReminder();
    }
  });



  // Full Vocabulary Quiz Session — covers ALL words, no server needed
  async function showVocabReminder() {
    const data = await chrome.storage.local.get(['user_vocab']);
    const list = data.user_vocab || [];

    const defaultList = [
      { word: 'academic', meaning: 'tính học thuật', phonetic: '/ˌæk.əˈdem.ɪk/', example: 'She has high academic standards.' },
      { word: 'dynamic', meaning: 'năng động, biến đổi không ngừng', phonetic: '/daɪˈnæm.ɪk/', example: 'A dynamic study environment.' },
      { word: 'acquire', meaning: 'gặt hái, thu nhận được', phonetic: '/əˈkwaɪər/', example: 'To acquire language skills.' },
      { word: 'diligent', meaning: 'chăm chỉ, siêng năng', phonetic: '/ˈdɪl.ɪ.dʒənt/', example: 'A diligent student passes tests.' },
      { word: 'havoc', meaning: 'tàn phá, hỗn loạn', phonetic: '/ˈhæv.ək/', example: 'The storm wreaked havoc.' }
    ];

    const activeList = list.length >= 2 ? list : defaultList;

    // Shuffle all words — Fisher-Yates
    const shuffled = [...activeList].sort(() => Math.random() - 0.5);
    const total = shuffled.length;

    let currentIdx = 0;
    let score = 0;
    let sessionConsecutiveWrong = 0;

    function renderQuestion() {
      if (currentIdx >= total) {
        showQuizResult();
        return;
      }

      const targetWord = shuffled[currentIdx];
      const progress = `${currentIdx + 1}/${total}`;
      const pct = Math.round((currentIdx / total) * 100);

      // Alternate ABCD (even index) and Fill-in-blank (odd index)
      const quizMode = currentIdx % 2 === 0 ? 'abcd' : 'blank';

      // Generate distractors from the FULL list (not just 3)
      const pool = activeList.filter(item => item.word !== targetWord.word);
      const distractors = pool.sort(() => Math.random() - 0.5).slice(0, 3);
      const choices = [targetWord, ...distractors].sort(() => Math.random() - 0.5);

      const progressBar = `
        <div style="margin-bottom:6px;">
          <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:#8D6E63; margin-bottom:2px;">
            <span>Câu ${progress}</span>
            <span>Điểm: ${score}/${currentIdx}</span>
          </div>
          <div style="background:#E8F5E9; border-radius:6px; height:6px; overflow:hidden;">
            <div style="width:${pct}%; background:#A7D08C; height:100%; border-radius:6px; transition:width 0.3s;"></div>
          </div>
        </div>
      `;

      let quizBodyHtml = '';
      if (quizMode === 'abcd') {
        quizBodyHtml = `
          <div style="font-size:0.82rem; text-align:center; margin-bottom:4px; color:#5D4037;">
            Nghĩa tiếng Việt của:<br/>
            <strong style="font-size:1.1rem; color:#3b7a13;">${targetWord.word}</strong>
            <span style="font-size:0.72rem; color:#8D6E63; display:block;">${targetWord.phonetic || ''}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:4px; width:100%;">
            ${choices.map((c, i) => `
              <button class="btn-choice" data-correct="${c.word === targetWord.word}">
                ${String.fromCharCode(65 + i)}. ${c.meaning}
              </button>
            `).join('')}
          </div>
          <div id="quiz-feedback" class="quiz-feedback"></div>
        `;
      } else {
        quizBodyHtml = `
          <div style="font-size:0.82rem; text-align:center; margin-bottom:4px; color:#5D4037;">
            Từ tiếng Anh nào có nghĩa là:<br/>
            <strong style="font-size:1rem; color:#3b7a13;">"${targetWord.meaning}"</strong>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
            <input type="text" id="blank-input" class="quiz-input" placeholder="Gõ từ tiếng Anh..." />
            <button class="btn btn-yes" id="btn-submit-blank" style="padding:8px;">Kiểm tra ✓</button>
          </div>
          <div id="quiz-feedback" class="quiz-feedback"></div>
        `;
      }

      const fullHtml = `
        <div class="bubble-header">
          <span>📝 Ôn từ vựng</span>
          <span class="close-btn" id="close-bubble">×</span>
        </div>
        ${progressBar}
        ${quizBodyHtml}
        <button class="btn btn-no" id="btn-skip-word" style="width:100%; margin-top:4px; font-size:0.72rem;">Bỏ qua →</button>
      `;

      openBubble(fullHtml);
      shadow.getElementById('close-bubble').addEventListener('click', closeBubble);

      // Skip button — go to next without penalty
      shadow.getElementById('btn-skip-word').addEventListener('click', () => {
        currentIdx++;
        renderQuestion();
      });

      if (quizMode === 'abcd') {
        shadow.querySelectorAll('.btn-choice').forEach(btn => {
          btn.addEventListener('click', () => {
            const isCorrect = btn.getAttribute('data-correct') === 'true';
            const feedback = shadow.getElementById('quiz-feedback');
            shadow.querySelectorAll('.btn-choice').forEach(b => b.setAttribute('disabled', 'true'));
            shadow.getElementById('btn-skip-word').setAttribute('disabled', 'true');

            if (isCorrect) {
              score++;
              sessionConsecutiveWrong = 0;
              consecutiveWrong = 0;
              btn.style.borderColor = '#81C784';
              btn.style.background = '#E8F5E9';
              feedback.innerHTML = '<span style="color:#2E7D32;">✓ Chính xác! 🍵</span>';
              startAnimation('celebrating');
            } else {
              sessionConsecutiveWrong++;
              consecutiveWrong++;
              btn.style.borderColor = '#E57373';
              btn.style.background = '#FFEBEE';
              // highlight correct answer
              shadow.querySelectorAll('.btn-choice').forEach(b => {
                if (b.getAttribute('data-correct') === 'true') {
                  b.style.borderColor = '#81C784';
                  b.style.background = '#E8F5E9';
                }
              });
              feedback.innerHTML = `<span style="color:#C62828;">✗ Đáp án đúng: "${targetWord.meaning}"</span>`;
              startAnimation('crying');
            }
            setTimeout(() => {
              if (consecutiveWrong >= 3) {
                triggerTantrumLockout();
              } else {
                currentIdx++;
                renderQuestion();
              }
            }, 2200);
          });
        });

      } else {
        // Fill-in-blank mode
        const submitBtn = shadow.getElementById('btn-submit-blank');
        const inputEl = shadow.getElementById('blank-input');

        const checkAnswer = () => {
          const userAnswer = inputEl.value.trim().toLowerCase();
          const correctAnswer = targetWord.word.trim().toLowerCase();
          const feedback = shadow.getElementById('quiz-feedback');
          inputEl.setAttribute('disabled', 'true');
          submitBtn.setAttribute('disabled', 'true');
          shadow.getElementById('btn-skip-word').setAttribute('disabled', 'true');

          // Accept partial match if >80% similar (allow minor typos)
          const isCorrect = userAnswer === correctAnswer || userAnswer === correctAnswer.split(' ')[0].toLowerCase();

          if (isCorrect) {
            score++;
            sessionConsecutiveWrong = 0;
            consecutiveWrong = 0;
            feedback.innerHTML = '<span style="color:#2E7D32;">✓ Xuất sắc! Đúng rồi! 🍵</span>';
            startAnimation('celebrating');
          } else {
            sessionConsecutiveWrong++;
            consecutiveWrong++;
            feedback.innerHTML = `<span style="color:#C62828;">✗ Đáp án đúng: <b>${targetWord.word}</b></span>`;
            startAnimation('crying');
          }
          setTimeout(() => {
            if (consecutiveWrong >= 3) {
              triggerTantrumLockout();
            } else {
              currentIdx++;
              renderQuestion();
            }
          }, 2200);
        };

        submitBtn.addEventListener('click', checkAnswer);
        inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); checkAnswer(); }
        });
      }
    }

    function showQuizResult() {
      const pct = Math.round((score / total) * 100);
      const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '😊' : '😢';
      const msg = pct >= 80 ? 'Xuất sắc! Cậu thuộc hết rồi! 🍵' : pct >= 60 ? 'Khá tốt, tiếp tục ôn nhé!' : 'Cần ôn thêm, đừng nản lòng!';

      openBubble(`
        <div class="bubble-header">
          <span>Kết quả ôn tập 🏆</span>
          <span class="close-btn" id="close-bubble">×</span>
        </div>
        <div style="text-align:center; padding:8px 0;">
          <div style="font-size:2.2rem; margin-bottom:4px;">${emoji}</div>
          <div style="font-size:1.1rem; font-weight:bold; color:#3b7a13;">${score}/${total} từ đúng</div>
          <div style="font-size:0.78rem; color:#8D6E63; margin-top:4px;">${msg}</div>
          <div style="margin-top:8px; background:#F1F8E9; border-radius:10px; padding:8px;">
            <div style="font-size:0.75rem; color:#5D4037; margin-bottom:4px;">Điểm số</div>
            <div style="background:#E8F5E9; border-radius:6px; height:10px; overflow:hidden;">
              <div style="width:${pct}%; background:${pct>=80?'#66BB6A':pct>=60?'#FFA726':'#EF5350'}; height:100%; border-radius:6px;"></div>
            </div>
            <div style="font-size:0.8rem; font-weight:bold; color:#3b7a13; margin-top:4px;">${pct}%</div>
          </div>
        </div>
        <button class="btn btn-yes" id="btn-retry-vocab" style="width:100%; margin-top:6px;">🔄 Học lại từ đầu</button>
        <button class="btn btn-no" id="btn-back-menu-quiz" style="width:100%; margin-top:4px;">Quay lại Menu</button>
      `);

      shadow.getElementById('close-bubble').addEventListener('click', closeBubble);
      shadow.getElementById('btn-retry-vocab').addEventListener('click', () => { showVocabReminder(); });
      shadow.getElementById('btn-back-menu-quiz').addEventListener('click', toggleMascotMenu);

      if (pct >= 80) startAnimation('celebrating');
      else if (pct < 50) startAnimation('crying');
      else startAnimation('idle');
    }

    // Start the session
    renderQuestion();
  }


  // Strict Lockout Blocker when user fails 3 consecutive times
  function triggerTantrumLockout() {
    closeBubble();
    startAnimation('tantrum');
    img.style.width = '120px';
    img.style.height = '120px';

    const existing = shadow.querySelector('.lockout-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'lockout-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(167, 208, 140, 0.95);
      z-index: 2147483646;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      backdrop-filter: blur(5px);
    `;
    overlay.innerHTML = `
      <div style="background:#FFFDF5; border:3px solid #E57373; padding:28px; border-radius:24px; width:360px; box-sizing:border-box; text-align:center; box-shadow:0 15px 50px rgba(93,64,55,0.35); font-family: 'Segoe UI', system-ui, sans-serif;">
        <h2 style="color:#C62828; margin:0 0 10px 0; font-size:1.3rem;">MÁT CHA ĐANG DỖI! 😭</h2>
        <p style="font-size:0.85rem; color:#5D4037; line-height:1.4; margin:0 0 16px 0; font-weight:bold;">
          Cậu trả lời sai liên tiếp 3 từ rồi đó! Tớ khóa màn hình không cho cậu lướt web nữa. Hãy trả lời đúng câu dưới đây để dỗ tớ đi!
        </p>
        <div id="lockout-quiz-box" style="text-align:left; display:flex; flex-direction:column; gap:8px;"></div>
        <div id="lockout-feedback" style="margin-top:12px; font-weight:bold; font-size:0.85rem; text-align:center; min-height:20px;"></div>
      </div>
    `;
    shadow.appendChild(overlay);
    generateLockoutQuiz(overlay);
  }

  async function generateLockoutQuiz(overlay) {
    const data = await chrome.storage.local.get(['user_vocab']);
    const list = data.user_vocab || [];
    const defaultList = [
      { word: 'academic', meaning: 'tính học thuật', phonetic: '/ˌæk.əˈdem.ɪk/', example: 'She has high academic standards.' },
      { word: 'dynamic', meaning: 'năng động, biến đổi không ngừng', phonetic: '/daɪˈnæm.ɪk/', example: 'A dynamic study environment.' },
      { word: 'acquire', meaning: 'gặt hái, thu nhận được', phonetic: '/əˈkwaɪər/', example: 'To acquire language skills.' }
    ];
    const activeList = list.length >= 4 ? list : defaultList;
    const target = activeList[Math.floor(Math.random() * activeList.length)];

    const incorrectPool = activeList.filter(item => item.word !== target.word);
    const shuffledIncorrect = incorrectPool.sort(() => 0.5 - Math.random()).slice(0, 3);
    const choices = [target, ...shuffledIncorrect].sort(() => 0.5 - Math.random());

    const quizBox = shadow.getElementById('lockout-quiz-box');
    quizBox.innerHTML = `
      <div style="font-size:0.85rem; color:#5D4037; font-weight:bold; text-align:center; margin-bottom:6px;">
        Nghĩa của từ: <strong style="font-size:1.05rem; color:#3b7a13;">${target.word}</strong>
      </div>
      ${choices.map((c, i) => `
        <button class="btn-choice lockout-choice" data-correct="${c.word === target.word}" style="padding:10px;">
          ${String.fromCharCode(65 + i)}. ${c.meaning}
        </button>
      `).join('')}
    `;

    const choiceBtns = shadow.querySelectorAll('.lockout-choice');
    choiceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.getAttribute('data-correct') === 'true';
        const feedback = shadow.getElementById('lockout-feedback');

        choiceBtns.forEach(b => b.setAttribute('disabled', 'true'));

        if (isCorrect) {
          btn.style.borderColor = '#81C784';
          btn.style.background = '#E8F5E9';
          feedback.innerHTML = '<span style="color:#2E7D32;">Chính xác! Ngoan lắm, tớ cho qua nha! 🍵</span>';
          startAnimation('celebrating');
          consecutiveWrong = 0;
          setTimeout(() => {
            overlay.remove();
            img.style.width = '80px';
            img.style.height = '80px';
            startAnimation('idle');
          }, 2500);
        } else {
          btn.style.borderColor = '#E57373';
          btn.style.background = '#FFEBEE';
          feedback.innerHTML = `<span style="color:#C62828;">Sai rồi! Thử lại câu khác nhé! 😭</span>`;
          startAnimation('crying');
          setTimeout(() => {
            generateLockoutQuiz(overlay);
          }, 2500);
        }
      });
    });
  }

  function closeBubble() {
    bubble.style.display = 'none';
    startAnimation('idle');
  }

  // Crying/Lockout simulation if user neglects mascot for too long
  let neglectTimer = setTimeout(() => {
    if (!isMainSite) {
      triggerTantrum();
    }
  }, 7200000); // 2 hours neglect

  function triggerTantrum() {
    // Switch animation to tantrum state
    startAnimation('tantrum');
    img.style.width = '120px';
    img.style.height = '120px';
    
    // Lockout Overlay
    const overlay = document.createElement('div');
    overlay.className = 'lockout-overlay';
    overlay.innerHTML = `
      <h1 style="margin: 10px 0;">CẬU BỎ RƠI TỚ LÂU QUÁ! 😭</h1>
      <p style="font-size:1.2rem; max-width: 500px;">Tớ đang khóc nhè đây này. Hãy quay lại học trên ieltsoasis.site ngay để dỗ tớ đi nhé! 🍵</p>
      <a href="https://ieltsoasis.site" style="margin-top:20px; padding:12px 24px; background:#5D4037; color:#FFFDF5; text-decoration:none; border-radius:30px; font-weight:bold; font-size:1.1rem;">Đi Học Ngay Thôi!</a>
    `;
    shadow.appendChild(overlay);
  }

  async function handleOCRWordDetected(wordData) {
    const ocrHtml = `
      <div class="bubble-header">
        <span>Đã Quét Từ Vựng 📸</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div>
        <span class="word">${wordData.word}</span>
        <span class="phonetic">${wordData.phonetic || ''}</span>
      </div>
      <div class="meaning">${wordData.meaning}</div>
      <div class="actions">
        <button class="btn btn-yes" id="btn-save-vocab">Lưu vào Tủ Từ 🍵</button>
      </div>
    `;
    openBubble(ocrHtml);
    startAnimation('celebrating');

    shadow.getElementById('close-bubble').addEventListener('click', closeBubble);
    shadow.getElementById('btn-save-vocab').addEventListener('click', async () => {
      const data = await chrome.storage.local.get(['jwt_token']);
      if (!data.jwt_token) {
        alert("Vui lòng kết nối tài khoản ở popup tiện ích trước nhé!");
        return;
      }
      try {
        const serverUrl = await getServerUrl();
        const res = await fetch(`${serverUrl}/api/vocabulary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.jwt_token}`
          },
          body: JSON.stringify({
            word: wordData.word,
            meaning: wordData.meaning,
            phonetic: wordData.phonetic,
            example: wordData.example || '',
            topic: wordData.topic || 'General',
            source: 'Matcha OCR'
          })
        });
        if (res.ok) {
          alert(`Đã lưu thành công từ "${wordData.word}" vào Tủ Từ! 🍵`);
          closeBubble();
        } else {
          const errData = await res.json();
          alert(errData.detail || "Lỗi lưu từ vựng.");
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
})();

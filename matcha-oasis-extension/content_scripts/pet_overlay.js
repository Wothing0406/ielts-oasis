// content_scripts/pet_overlay.js

(function () {
  if (window.hasMatchaMascotRun) return;
  window.hasMatchaMascotRun = true;

  console.log("Matcha Study Buddy injected.");

  const isMainSite = window.location.hostname.includes("ieltsoasis.site");
  let consecutiveWrong = 0;

  async function getServerUrl() {
    const data = await chrome.storage.local.get(['server_url']);
    return data.server_url || 'https://ieltsoasis.site';
  }

  // Helper to save active quiz state
  async function saveActiveQuizState(shuffledList, currentIdx, score, mode) {
    await chrome.storage.local.set({
      active_quiz_state: {
        shuffledList,
        currentIdx,
        score,
        mode,
        timestamp: Date.now()
      }
    });
  }

  // Helper to clear active quiz state
  async function clearActiveQuizState() {
    await chrome.storage.local.set({ active_quiz_state: null });
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
      animation: floatBubble 3s ease-in-out infinite;
    }

    .speech-bubble::before {
      content: '';
      position: absolute;
      bottom: -12px;
      right: 30px;
      border-width: 12px 10px 0;
      border-style: solid;
      border-color: #A7D08C transparent;
      display: block;
      width: 0;
    }

    .speech-bubble::after {
      content: '';
      position: absolute;
      bottom: -9px;
      right: 31px;
      border-width: 10px 9px 0;
      border-style: solid;
      border-color: #FFFDF5 transparent;
      display: block;
      width: 0;
    }

    @keyframes floatBubble {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
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

  // Angry Run Animation State
  let isAngryRunning = false;
  let angryAnimFrameId = null;
  let runningCats = [];
  let consecutiveIgnored = 0;
  let reminderTimer = null;
  let snoozeTimeout = null;

  function applySnoozeState(snoozedUntil) {
    closeBubble();
    wrapper.style.transition = 'all 0.5s ease';
    wrapper.style.left = 'auto';
    wrapper.style.top = 'auto';
    wrapper.style.bottom = '20px';
    wrapper.style.right = '-60px';
    wrapper.style.opacity = '0.35';
    wrapper.style.pointerEvents = 'auto'; // allow hover/click
    img.style.cursor = 'pointer';

    wrapper.onmouseenter = () => {
      wrapper.style.right = '-40px';
      wrapper.style.opacity = '0.7';
    };
    wrapper.onmouseleave = () => {
      wrapper.style.right = '-60px';
      wrapper.style.opacity = '0.35';
    };

    if (snoozeTimeout) clearTimeout(snoozeTimeout);
    const timeLeft = snoozedUntil - Date.now();
    if (timeLeft > 0) {
      snoozeTimeout = setTimeout(() => {
        restoreMascotFromSnooze();
      }, timeLeft);
    }
  }

  async function restoreMascotFromSnooze() {
    if (snoozeTimeout) clearTimeout(snoozeTimeout);
    wrapper.onmouseenter = null;
    wrapper.onmouseleave = null;
    wrapper.style.transition = 'all 0.5s ease';
    wrapper.style.opacity = '1';
    wrapper.style.right = '20px';
    wrapper.style.bottom = '20px';
    wrapper.style.left = 'auto';
    wrapper.style.top = 'auto';
    img.style.cursor = 'grab';
    await chrome.storage.local.set({ snoozed_until: null });
  }

  function createCatClone() {
    const clone = document.createElement('div');
    clone.className = 'matcha-cat-clone';
    clone.style.cssText = `
      position: fixed;
      width: 80px;
      height: 80px;
      z-index: 2147483647;
      pointer-events: auto;
    `;
    const cloneImg = document.createElement('img');
    cloneImg.className = 'pet-sprite';
    cloneImg.alt = "Mát Cha Pet Clone";
    cloneImg.src = img.src;

    cloneImg.addEventListener('click', () => {
      if (isAngryRunning) {
        flashLockoutBox();
      }
    });

    clone.appendChild(cloneImg);
    shadow.appendChild(clone);
    return { element: clone, img: cloneImg };
  }

  function startAngryRun(count = 4) {
    if (isAngryRunning) return;
    isAngryRunning = true;
    startAnimation('tantrum');
    closeBubble();

    shadow.querySelectorAll('.matcha-cat-clone').forEach(c => c.remove());
    runningCats = [];

    // Original wrapper
    runningCats.push({
      element: wrapper,
      img: img,
      x: window.innerWidth - 100,
      y: window.innerHeight - 100,
      vx: (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 4),
      vy: (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 4),
      isOriginal: true
    });

    // Clones
    for (let i = 0; i < count - 1; i++) {
      const { element, img: cloneImg } = createCatClone();
      runningCats.push({
        element: element,
        img: cloneImg,
        x: Math.random() * (window.innerWidth - 100),
        y: Math.random() * (window.innerHeight - 100),
        vx: (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 4),
        vy: (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 4),
        isOriginal: false
      });
    }

    let cloneFrameIdx = 0;
    const animateClonesInterval = setInterval(() => {
      if (!isAngryRunning) {
        clearInterval(animateClonesInterval);
        return;
      }
      const frames = animationFrames['tantrum'];
      if (frames && frames.length > 0) {
        runningCats.forEach(cat => {
          if (!cat.isOriginal) {
            cat.img.src = frames[cloneFrameIdx];
          }
        });
        cloneFrameIdx = (cloneFrameIdx + 1) % frames.length;
      }
    }, 300);

    function animate() {
      if (!isAngryRunning) return;

      runningCats.forEach(cat => {
        cat.x += cat.vx;
        cat.y += cat.vy;

        const maxX = window.innerWidth - 80;
        const maxY = window.innerHeight - 80;

        if (cat.x <= 0) {
          cat.x = 0;
          cat.vx *= -1;
        } else if (cat.x >= maxX) {
          cat.x = maxX;
          cat.vx *= -1;
        }

        if (cat.y <= 0) {
          cat.y = 0;
          cat.vy *= -1;
        } else if (cat.y >= maxY) {
          cat.y = maxY;
          cat.vy *= -1;
        }

        cat.element.style.left = `${cat.x}px`;
        cat.element.style.top = `${cat.y}px`;
        cat.element.style.right = 'auto';
        cat.element.style.bottom = 'auto';
      });

      angryAnimFrameId = requestAnimationFrame(animate);
    }
    animate();
    chrome.storage.local.set({ is_punishment_mode: true });
  }

  function stopAngryRun() {
    isAngryRunning = false;
    if (angryAnimFrameId) cancelAnimationFrame(angryAnimFrameId);

    shadow.querySelectorAll('.matcha-cat-clone').forEach(c => c.remove());
    runningCats = [];

    startAnimation('idle');
    img.style.width = '80px';
    img.style.height = '80px';

    wrapper.style.left = 'auto';
    wrapper.style.top = 'auto';
    wrapper.style.right = '20px';
    wrapper.style.bottom = '20px';
    chrome.storage.local.set({ is_punishment_mode: false });
  }

  function flashLockoutBox() {
    const box = shadow.querySelector('.lockout-overlay > div');
    if (box) {
      box.style.transform = 'scale(1.05)';
      box.style.transition = 'transform 0.1s ease';
      setTimeout(() => {
        box.style.transform = 'scale(1)';
      }, 100);
    }
  }

  // Check snooze & punishment states on load
  chrome.storage.local.get(['is_punishment_mode', 'snoozed_until'], (data) => {
    if (data.is_punishment_mode) {
      triggerTantrumLockout();
    } else if (data.snoozed_until && Date.now() < data.snoozed_until) {
      applySnoozeState(data.snoozed_until);
    }
  });

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
  img.addEventListener('click', async () => {
    if (!dragStarted) {
      const data = await chrome.storage.local.get(['snoozed_until']);
      if (data.snoozed_until && Date.now() < data.snoozed_until) {
        // Show wake up confirmation
        const minsLeft = Math.ceil((data.snoozed_until - Date.now()) / 60000);
        openBubble(`
          <div class="bubble-header">
            <span>Đánh thức Mát Cha? 🍵</span>
            <span class="close-btn" id="close-bubble">×</span>
          </div>
          <div style="font-size:0.8rem; text-align:center; padding:10px;">
            Tớ đang ngủ tạm (còn ${minsLeft} phút nữa). Cậu muốn đánh thức tớ dậy học cùng ngay không?
          </div>
          <button class="btn btn-yes" id="btn-wake-up" style="width:100%; margin-top:6px;">Đánh thức dậy ☀️</button>
        `);
        shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);
        shadow.querySelector('#btn-wake-up').addEventListener('click', () => {
          restoreMascotFromSnooze();
          closeBubble();
        });
        return;
      }

      if (isAngryRunning) {
        flashLockoutBox();
      } else {
        toggleMascotMenu();
      }
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
    bubble.addEventListener('click', (e) => e.stopPropagation());
    bubble.addEventListener('keydown', (e) => e.stopPropagation());
    bubble.addEventListener('keyup', (e) => e.stopPropagation());
    bubble.addEventListener('mousedown', (e) => e.stopPropagation());
    bubble.addEventListener('pointerdown', (e) => e.stopPropagation());

    // Auto-focus first input or textarea inside the bubble
    setTimeout(() => {
      const input = shadow.querySelector('.quiz-input') || shadow.querySelector('input') || shadow.querySelector('textarea');
      if (input) {
        input.focus();
        input.click();
      }
    }, 80);
  }

  async function toggleMascotMenu() {
    if (bubble.style.display === 'flex') {
      closeBubble();
      return;
    }

    const data = await chrome.storage.local.get(['jwt_token']);
    if (!data.jwt_token) {
      showExtensionLoginForm();
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
        <button class="btn btn-no" id="btn-snooze-pet" style="width: 100%; padding: 6px; background: #efebe9; border: 1.5px solid #d7ccc8; margin-top: 4px;">💤 Tạm ẩn Mascot 30 phút</button>
      </div>
    `;
    openBubble(menuHtml);
    startAnimation('alert');

    // Hook Menu Events
    shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);

    shadow.querySelector('#btn-sidepanel').addEventListener('click', () => {
      closeBubble();
      chrome.runtime.sendMessage({ action: 'open_sidepanel' });
    });

    shadow.querySelector('#btn-ocr').addEventListener('click', () => {
      closeBubble();
      if (window.startMatchaOCR) {
        window.startMatchaOCR(handleOCRWordDetected);
      }
    });

    shadow.querySelector('#btn-add-vocab-ui').addEventListener('click', showQuickAddForm);

    shadow.querySelector('#btn-view-vocab').addEventListener('click', showVocabListUI);

    shadow.querySelector('#btn-grammar-quiz').addEventListener('click', showGrammarQuizUI);

    shadow.querySelector('#btn-vocab-quiz').addEventListener('click', async () => {
      showVocabReminder(false);
    });

    shadow.querySelector('#btn-view-schedule').addEventListener('click', showStudyScheduleUI);

    shadow.querySelector('#btn-snooze-pet').addEventListener('click', async () => {
      const snoozedUntil = Date.now() + 30 * 60 * 1000;
      await chrome.storage.local.set({ snoozed_until: snoozedUntil });
      applySnoozeState(snoozedUntil);
    });
  }

  function showExtensionLoginForm(errorMessage = '') {
    const loginHtml = `
      <div class="bubble-header">
        <span>Kết nối tài khoản 🔑</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div style="font-weight: bold; margin: 4px 0; font-size: 0.8rem; text-align: center; color: #D84315;">
        Cậu cần kết nối tài khoản để sử dụng tiện ích Mát Cha AI Eo!
      </div>
      ${errorMessage ? `<div style="color:#C62828; font-size:0.75rem; text-align:center; margin-bottom:6px; font-weight:bold;">${errorMessage}</div>` : ''}
      <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
        <input type="text" id="login-username" class="quiz-input" placeholder="Tên đăng nhập" style="padding: 8px; font-size: 0.8rem;" required />
        <input type="password" id="login-password" class="quiz-input" placeholder="Mật khẩu" style="padding: 8px; font-size: 0.8rem;" required />
        <button class="btn btn-yes" id="btn-submit-login" style="margin-top:6px; padding:10px; font-size:0.85rem; font-weight:bold; cursor: pointer;">Đăng nhập ➔</button>
        <div style="font-size:0.72rem; text-align:center; color:#795548; margin-top:4px;">
          Chưa có tài khoản? Hãy đăng ký tại <a href="https://ieltsoasis.site" target="_blank" style="color:#3b7a13; font-weight:bold; text-decoration:none;">ieltsoasis.site</a>
        </div>
      </div>
    `;
    openBubble(loginHtml);
    startAnimation('alert');

    shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);

    const submitBtn = shadow.querySelector('#btn-submit-login');
    submitBtn.addEventListener('click', async () => {
      const usernameInput = shadow.querySelector('#login-username').value.trim();
      const passwordInput = shadow.querySelector('#login-password').value.trim();

      if (!usernameInput || !passwordInput) {
        showExtensionLoginForm('Vui lòng điền đầy đủ thông tin!');
        return;
      }

      submitBtn.textContent = 'Đang kết nối...';
      submitBtn.disabled = true;

      try {
        const serverUrl = await getServerUrl();
        const response = await fetch(`${serverUrl}/api/auth/extension-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: usernameInput,
            password: passwordInput
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.token) {
            await chrome.storage.local.set({ jwt_token: result.token });
            chrome.runtime.sendMessage({ action: 'save_jwt_token', token: result.token });
            toggleMascotMenu();
          } else {
            showExtensionLoginForm('Đăng nhập thất bại. Không nhận được token.');
          }
        } else {
          const errData = await response.json();
          showExtensionLoginForm(errData.detail || 'Tên đăng nhập hoặc mật khẩu không đúng!');
        }
      } catch (err) {
        console.error(err);
        showExtensionLoginForm('Lỗi kết nối máy chủ. Vui lòng thử lại!');
      }
    });
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

    shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);

    const wordInput = shadow.querySelector('#add-word');
    const meaningInput = shadow.querySelector('#add-meaning');
    const phoneticInput = shadow.querySelector('#add-phonetic');
    const autofillBtn = shadow.querySelector('#btn-ai-autofill');

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
          // Now the server returns structured JSON
          if (result.word) {
            wordInput.value = result.word;
          }
          if (result.phonetic && !phoneticInput.value) {
            phoneticInput.value = result.phonetic;
          }
          if (result.meaning) {
            meaningInput.value = result.meaning;
          }
          if (result.example) {
            const exampleInput = shadow.querySelector('#add-example');
            if (exampleInput && !exampleInput.value) {
              exampleInput.value = result.example;
            }
          }
          // Note: we can also optionally use result.memory_hook if we add an input for it later.
        }
      } catch (err) {
        console.error(err);
        alert('Lỗi kết nối. Vui lòng nhập thủ công!');
      } finally {
        autofillBtn.textContent = "🤖 Tự động dịch (AI)";
        autofillBtn.removeAttribute('disabled');
      }
    });

    shadow.querySelector('#btn-submit-quick-add').addEventListener('click', async () => {
      const word = wordInput.value.trim();
      const phonetic = phoneticInput.value.trim();
      const meaning = meaningInput.value.trim();
      const example = shadow.querySelector('#add-example').value.trim();
      const isGlobal = shadow.querySelector('#add-global').checked;

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

    shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);
    shadow.querySelector('#btn-back-menu').addEventListener('click', toggleMascotMenu);

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
          body: JSON.stringify({ text: v.word, full: true })
        });
        if (resp.ok) {
          const r = await resp.json();
          memoryHook = r.memory_hook || '';
          // We can also opportunistically update other missing fields
          if (!v.phonetic && r.phonetic) v.phonetic = r.phonetic;
          if (!v.example && r.example) v.example = r.example;
        }
      } catch (e) { /* ignore */ }
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

    shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);
    shadow.querySelector('#btn-back-list').addEventListener('click', showVocabListUI);
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
    shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);

    const data = await chrome.storage.local.get(['active_quiz_state']);
    let savedState = data.active_quiz_state;
    if (savedState && savedState.mode === 'grammar' && (Date.now() - savedState.timestamp < 2 * 60 * 60 * 1000)) {
      openBubble(`
        <div class="bubble-header">
          <span>Tiếp tục học? 🍵</span>
          <span class="close-btn" id="close-bubble">×</span>
        </div>
        <div style="font-size:0.82rem; text-align:center; padding:10px;">
          Tớ thấy cậu đang làm dở bài Quiz Ngữ Pháp trước đó (đến câu ${savedState.currentIdx + 1}). Cậu muốn làm tiếp hay chơi lại từ đầu?
        </div>
        <button class="btn btn-yes" id="btn-resume-quiz" style="width:100%; margin-top:6px;">Tiếp tục làm ➔</button>
        <button class="btn btn-no" id="btn-restart-quiz" style="width:100%; margin-top:4px;">Chơi lại từ đầu 🔄</button>
      `);
      shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);
      shadow.querySelector('#btn-resume-quiz').addEventListener('click', () => {
        startGrammarQuizSession(savedState.shuffledList, savedState.currentIdx, savedState.score);
      });
      shadow.querySelector('#btn-restart-quiz').addEventListener('click', () => {
        clearActiveQuizState();
        showGrammarQuizUI();
      });
      return;
    }

    try {
      const serverUrl = await getServerUrl();
      const resp = await fetch(`${serverUrl}/api/quiz/grammar`);
      if (!resp.ok) throw new Error('Server error');
      const result = await resp.json();
      const questions = result.questions || [];

      if (!questions.length) {
        openBubble(`<div class="bubble-header"><span>Quiz 📝</span><span class="close-btn" id="close-bubble">×</span></div><div style="text-align:center;padding:10px;font-size:0.82rem;">Không lấy được câu hỏi. Thử lại sau! 🍵</div>`);
        shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);
        return;
      }

      startGrammarQuizSession(questions);
    } catch (err) {
      console.error(err);
      openBubble(`<div class="bubble-header"><span>Quiz 📝</span><span class="close-btn" id="close-bubble">×</span></div><div style="text-align:center;padding:10px;font-size:0.82rem;color:#C62828;">Lỗi kết nối máy chủ. Thử lại sau! 🍵</div>`);
      shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);
    }
  }

  function startGrammarQuizSession(questions, startIdx = 0, initialScore = 0) {
    let currentQ = startIdx;
    let score = initialScore;

    function renderQuestion() {
      if (currentQ >= questions.length) {
        clearActiveQuizState();
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
        shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);
        shadow.querySelector('#btn-retry-quiz').addEventListener('click', () => { startGrammarQuizSession(questions); });
        shadow.querySelector('#btn-back-menu-quiz').addEventListener('click', toggleMascotMenu);
        if (score >= questions.length * 0.7) {
          startAnimation('celebrating');
          stopAngryRun();
        } else if (score < questions.length * 0.5) {
          setTimeout(() => {
            triggerTantrumLockout();
          }, 1500);
        } else {
          startAnimation('crying');
          stopAngryRun();
        }
        return;
      }

      // Save state
      saveActiveQuizState(questions, currentQ, score, 'grammar');

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
              ${String.fromCharCode(65 + i)}. ${c}
            </button>
          `).join('')}
        </div>
        <div id="qfeedback" class="quiz-feedback"></div>
      `;
      openBubble(quizHtml);

      shadow.querySelector('#close-bubble').addEventListener('click', () => {
        consecutiveIgnored++;
        if (consecutiveIgnored >= 3) {
          triggerTantrumLockout();
        } else {
          closeBubble();
        }
      });

      shadow.querySelectorAll('.btn-choice').forEach(btn => {
        btn.addEventListener('click', () => {
          const isCorrect = btn.getAttribute('data-correct') === 'true';
          const fb = shadow.querySelector('#qfeedback');
          shadow.querySelectorAll('.btn-choice').forEach(b => b.setAttribute('disabled', 'true'));
          if (isCorrect) {
            score++;
            consecutiveIgnored = 0;
            btn.style.background = '#E8F5E9';
            btn.style.borderColor = '#81C784';
            fb.innerHTML = '<span style="color:#2E7D32;">✓ Chính xác! 🍵</span>';
            startAnimation('celebrating');
          } else {
            consecutiveIgnored++;
            btn.style.background = '#FFEBEE';
            btn.style.borderColor = '#E57373';
            fb.innerHTML = `<span style="color:#C62828;">✗ Đáp án đúng: <b>${q.answer}</b></span>`;
            startAnimation('crying');
          }
          setTimeout(() => {
            if (consecutiveIgnored >= 3) {
              triggerTantrumLockout();
            } else {
              currentQ++;
              renderQuestion();
            }
          }, 2000);
        });
      });
    }

    renderQuestion();
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

    shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);
    shadow.querySelector('#btn-back-menu').addEventListener('click', toggleMascotMenu);
  }

  // Reminders and Quiz triggers
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'show_reminder' && !isMainSite) {
      showVocabReminder(true);
    }
  });



  // Full Vocabulary Quiz Session — covers ALL words, no server needed
  async function showVocabReminder(isAutomatic = false) {
    if (reminderTimer) clearTimeout(reminderTimer);

    const data = await chrome.storage.local.get(['user_vocab', 'active_quiz_state']);
    const list = data.user_vocab || [];

    const defaultList = [
      { word: 'academic', meaning: 'tính học thuật', phonetic: '/ˌæk.əˈdem.ɪk/', example: 'She has high academic standards.' },
      { word: 'dynamic', meaning: 'năng động, biến đổi không ngừng', phonetic: '/daɪˈnæm.ɪk/', example: 'A dynamic study environment.' },
      { word: 'acquire', meaning: 'gặt hái, thu nhận được', phonetic: '/əˈkwaɪər/', example: 'To acquire language skills.' },
      { word: 'diligent', meaning: 'chăm chỉ, siêng năng', phonetic: '/ˈdɪl.ɪ.dʒənt/', example: 'A diligent student passes tests.' },
      { word: 'havoc', meaning: 'tàn phá, hỗn loạn', phonetic: '/ˈhæv.ək/', example: 'The storm wreaked havoc.' }
    ];

    const activeList = list.length >= 2 ? list : defaultList;

    let savedState = data.active_quiz_state;
    if (savedState && savedState.mode === 'vocab' && (Date.now() - savedState.timestamp < 2 * 60 * 60 * 1000)) {
      openBubble(`
        <div class="bubble-header">
          <span>Tiếp tục học? 🍵</span>
          <span class="close-btn" id="close-bubble">×</span>
        </div>
        <div style="font-size:0.82rem; text-align:center; padding:10px;">
          Tớ thấy cậu đang làm dở bài Quiz Từ Vựng trước đó (đến câu ${savedState.currentIdx + 1}). Cậu muốn làm tiếp hay học lại từ đầu?
        </div>
        <button class="btn btn-yes" id="btn-resume-quiz" style="width:100%; margin-top:6px;">Tiếp tục làm ➔</button>
        <button class="btn btn-no" id="btn-restart-quiz" style="width:100%; margin-top:4px;">Học lại từ đầu 🔄</button>
      `);
      shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);
      shadow.querySelector('#btn-resume-quiz').addEventListener('click', () => {
        startVocabQuizSession(activeList, savedState.shuffledList, savedState.currentIdx, savedState.score);
      });
      shadow.querySelector('#btn-restart-quiz').addEventListener('click', () => {
        clearActiveQuizState();
        showVocabReminder(isAutomatic);
      });
      return;
    }

    if (!isAutomatic) {
      startVocabQuizSession(activeList);
      return;
    }

    // Automatic reminder popup -> Show learning flashcard with 25s auto-dismiss
    const targetWord = activeList[Math.floor(Math.random() * activeList.length)];
    startAnimation('alert');

    const cardHtml = `
      <div class="bubble-header">
        <span>Gợi ý học từ vựng 💡</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; font-size:0.82rem; color:#5D4037; font-family: 'Segoe UI', system-ui, sans-serif;">
        <div style="text-align:center; position:relative;">
          <div style="font-size:1.3rem; font-weight:bold; color:#3b7a13; display:inline-block; vertical-align:middle;">${targetWord.word}</div>
          <button id="btn-speak-word" style="background:none; border:none; cursor:pointer; font-size:1.1rem; vertical-align:middle; margin-left:6px; padding:2px;">🔊</button>
          <div style="color:#8D6E63; font-size:0.85rem;">${targetWord.phonetic || ''}</div>
        </div>
        <div style="background:#F1F8E9; border-left:3px solid #A7D08C; padding:6px 8px; border-radius:6px;">
          <div style="font-weight:bold; font-size:0.75rem; margin-bottom:2px;">📝 Nghĩa:</div>
          <div>${targetWord.meaning}</div>
        </div>
        ${targetWord.example ? `
        <div style="background:#FFF9E6; border-left:3px solid #FFD54F; padding:6px 8px; border-radius:6px;">
          <div style="font-weight:bold; font-size:0.75rem; margin-bottom:2px;">💬 Ví dụ:</div>
          <div style="font-style:italic;">"${targetWord.example}"</div>
        </div>` : ''}
        ${targetWord.memory_hook ? `
        <div style="background:#F3E5F5; border-left:3px solid #CE93D8; padding:6px 8px; border-radius:6px;">
          <div style="font-weight:bold; font-size:0.75rem; margin-bottom:2px;">🧠 Mẹo nhớ:</div>
          <div style="color:#6A1B9A; font-size:0.78rem;">${targetWord.memory_hook}</div>
        </div>` : ''}
        
        <div style="margin-top:6px;">
          <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#8D6E63; margin-bottom:2px;">
            <span>Tự đóng sau <b id="reminder-seconds">25</b>s</span>
            <span>Ngó lơ ${consecutiveIgnored}/3 lần sẽ bị phạt! ⚠️</span>
          </div>
          <div style="background:#efebe9; border-radius:4px; height:4px; overflow:hidden;">
            <div id="reminder-progress" style="width:100%; background:#EF5350; height:100%; transition: width 1s linear;"></div>
          </div>
        </div>
      </div>
      <div style="display:flex; gap:6px; margin-top:8px;">
        <button class="btn btn-yes" id="btn-know-word" style="flex:1; padding:8px; font-size:0.78rem;">Đã thuộc ✓</button>
        <button class="btn btn-no" id="btn-quiz-word" style="flex:1; padding:8px; background:#e3f2fd; border:1px solid #90caf9; font-size:0.78rem;">Luyện tập 📝</button>
      </div>
    `;

    openBubble(cardHtml);

    shadow.querySelector('#btn-speak-word').addEventListener('click', () => {
      const utterance = new SpeechSynthesisUtterance(targetWord.word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    });

    shadow.querySelector('#close-bubble').addEventListener('click', () => {
      if (reminderTimer) clearTimeout(reminderTimer);
      consecutiveIgnored++;
      if (consecutiveIgnored >= 3) {
        triggerTantrumLockout();
      } else {
        closeBubble();
      }
    });

    shadow.querySelector('#btn-know-word').addEventListener('click', () => {
      if (reminderTimer) clearTimeout(reminderTimer);
      consecutiveIgnored = 0;
      closeBubble();
      startAnimation('celebrating');
      setTimeout(() => startAnimation('idle'), 2000);
    });

    shadow.querySelector('#btn-quiz-word').addEventListener('click', () => {
      if (reminderTimer) clearTimeout(reminderTimer);
      consecutiveIgnored = 0;
      startVocabQuizSession(activeList);
    });

    let timeLeft = 25;
    const progressEl = shadow.querySelector('#reminder-progress');
    const secondsEl = shadow.querySelector('#reminder-seconds');

    const updateTimer = () => {
      timeLeft--;
      if (secondsEl) secondsEl.textContent = timeLeft;
      if (progressEl) progressEl.style.width = `${(timeLeft / 25) * 100}%`;

      if (timeLeft <= 0) {
        consecutiveIgnored++;
        if (consecutiveIgnored >= 3) {
          triggerTantrumLockout();
        } else {
          closeBubble();
        }
      } else {
        reminderTimer = setTimeout(updateTimer, 1000);
      }
    };

    reminderTimer = setTimeout(updateTimer, 1000);
  }

  function startVocabQuizSession(activeList, shuffledList = null, startIdx = 0, initialScore = 0) {
    const shuffled = shuffledList || [...activeList].sort(() => Math.random() - 0.5);
    const total = shuffled.length;

    let currentIdx = startIdx;
    let score = initialScore;
    let sessionConsecutiveWrong = 0;

    function renderQuestion() {
      if (currentIdx >= total) {
        clearActiveQuizState();
        showQuizResult();
        return;
      }

      // Save state
      saveActiveQuizState(shuffled, currentIdx, score, 'vocab');

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

      shadow.querySelector('#close-bubble').addEventListener('click', () => {
        consecutiveIgnored++;
        if (consecutiveIgnored >= 3) {
          triggerTantrumLockout();
        } else {
          closeBubble();
        }
      });

      // Skip button — go to next without penalty
      shadow.querySelector('#btn-skip-word').addEventListener('click', () => {
        consecutiveIgnored++;
        if (consecutiveIgnored >= 3) {
          triggerTantrumLockout();
        } else {
          currentIdx++;
          renderQuestion();
        }
      });

      if (quizMode === 'abcd') {
        shadow.querySelectorAll('.btn-choice').forEach(btn => {
          btn.addEventListener('click', () => {
            const isCorrect = btn.getAttribute('data-correct') === 'true';
            const feedback = shadow.querySelector('#quiz-feedback');
            shadow.querySelectorAll('.btn-choice').forEach(b => b.setAttribute('disabled', 'true'));
            shadow.querySelector('#btn-skip-word').setAttribute('disabled', 'true');

            function showNextBtn() {
              shadow.querySelector('#btn-skip-word').style.display = 'none';
              const nextBtn = document.createElement('button');
              nextBtn.className = 'btn btn-yes';
              nextBtn.style.cssText = 'width:100%; margin-top:8px; padding:10px; font-size:0.85rem; font-weight:bold;';
              nextBtn.textContent = 'Câu tiếp theo ➔';
              nextBtn.addEventListener('click', () => {
                currentIdx++;
                renderQuestion();
              });
              shadow.querySelector('#btn-skip-word').parentElement.appendChild(nextBtn);
            }

            if (isCorrect) {
              score++;
              consecutiveIgnored = 0;
              sessionConsecutiveWrong = 0;
              consecutiveWrong = 0;
              btn.style.borderColor = '#81C784';
              btn.style.background = '#E8F5E9';
              feedback.innerHTML = '<span style="color:#2E7D32;">✓ Chính xác! 🍵</span>';
              startAnimation('celebrating');
            } else {
              consecutiveIgnored++;
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
              if (consecutiveIgnored >= 3) {
                triggerTantrumLockout();
              } else {
                showNextBtn();
              }
            }, 1000);
          });
        });

      } else {
        // Fill-in-blank mode
        const submitBtn = shadow.querySelector('#btn-submit-blank');
        const inputEl = shadow.querySelector('#blank-input');

        const checkAnswer = () => {
          const userAnswer = inputEl.value.trim().toLowerCase();
          const correctAnswer = targetWord.word.trim().toLowerCase();
          const feedback = shadow.querySelector('#quiz-feedback');
          inputEl.setAttribute('disabled', 'true');
          submitBtn.setAttribute('disabled', 'true');
          shadow.querySelector('#btn-skip-word').setAttribute('disabled', 'true');

          const isCorrect = userAnswer === correctAnswer || userAnswer === correctAnswer.split(' ')[0].toLowerCase();

          function showNextBtn() {
            shadow.querySelector('#btn-skip-word').style.display = 'none';
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-yes';
            nextBtn.style.cssText = 'width:100%; margin-top:8px; padding:10px; font-size:0.85rem; font-weight:bold;';
            nextBtn.textContent = 'Câu tiếp theo ➔';
            nextBtn.addEventListener('click', () => {
              currentIdx++;
              renderQuestion();
            });
            shadow.querySelector('#btn-skip-word').parentElement.appendChild(nextBtn);
          }

          if (isCorrect) {
            score++;
            consecutiveIgnored = 0;
            sessionConsecutiveWrong = 0;
            consecutiveWrong = 0;
            feedback.innerHTML = '<span style="color:#2E7D32;">✓ Xuất sắc! Đúng rồi! 🍵</span>';
            startAnimation('celebrating');
          } else {
            consecutiveIgnored++;
            sessionConsecutiveWrong++;
            consecutiveWrong++;
            feedback.innerHTML = `<span style="color:#C62828;">✗ Đáp án đúng: <b>${targetWord.word}</b></span>`;
            startAnimation('crying');
          }
          setTimeout(() => {
            if (consecutiveIgnored >= 3) {
              triggerTantrumLockout();
            } else {
              showNextBtn();
            }
          }, 1000);
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
              <div style="width:${pct}%; background:${pct >= 80 ? '#66BB6A' : pct >= 60 ? '#FFA726' : '#EF5350'}; height:100%; border-radius:6px;"></div>
            </div>
            <div style="font-size:0.8rem; font-weight:bold; color:#3b7a13; margin-top:4px;">${pct}%</div>
          </div>
        </div>
        <button class="btn btn-yes" id="btn-retry-vocab" style="width:100%; margin-top:6px;">🔄 Học lại từ đầu</button>
        <button class="btn btn-no" id="btn-back-menu-quiz" style="width:100%; margin-top:4px;">Quay lại Menu</button>
      `);

      shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);
      shadow.querySelector('#btn-retry-vocab').addEventListener('click', () => { showVocabReminder(); });
      shadow.querySelector('#btn-back-menu-quiz').addEventListener('click', toggleMascotMenu);

      if (pct >= 80) {
        startAnimation('celebrating');
        stopAngryRun();
      } else if (pct < 50) {
        setTimeout(() => {
          triggerTantrumLockout();
        }, 1500);
      } else {
        startAnimation('idle');
        stopAngryRun();
      }
    }

    renderQuestion();
  }


  // Strict Lockout Blocker when user fails 3 consecutive times or neglects mascot
  function triggerTantrumLockout() {
    closeBubble();
    restoreMascotFromSnooze(); // Cancel snooze if tucked

    // Spawn 5 bouncing cats!
    startAngryRun(5);

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
      <div style="background:#FFFDF5; border:3px solid #E57373; padding:28px; border-radius:24px; width:360px; box-sizing:border-box; text-align:center; box-shadow:0 15px 50px rgba(93,64,55,0.35); font-family: 'Segoe UI', system-ui, sans-serif; z-index: 2147483647;">
        <h2 style="color:#C62828; margin:0 0 10px 0; font-size:1.3rem;">MÁT CHA ĐANG DỖI! 😭</h2>
        <p style="font-size:0.85rem; color:#5D4037; line-height:1.4; margin:0 0 16px 0; font-weight:bold;">
          Cậu học tập không nghiêm túc hoặc ngó lơ tớ rồi! Tớ khóa màn hình không cho cậu lướt web nữa. Hãy trả lời đúng câu dưới đây để dỗ tớ đi!
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

    const quizBox = shadow.querySelector('#lockout-quiz-box');
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
        const feedback = shadow.querySelector('#lockout-feedback');

        choiceBtns.forEach(b => b.setAttribute('disabled', 'true'));

        if (isCorrect) {
          btn.style.borderColor = '#81C784';
          btn.style.background = '#E8F5E9';
          feedback.innerHTML = '<span style="color:#2E7D32;">Chính xác! Ngoan lắm, tớ cho qua nha! 🍵</span>';
          startAnimation('celebrating');
          consecutiveWrong = 0;
          consecutiveIgnored = 0;
          setTimeout(() => {
            overlay.remove();
            stopAngryRun();
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
    triggerTantrumLockout();
  }

  async function handleOCRWordDetected(wordsList) {
    if (!Array.isArray(wordsList)) {
      wordsList = [wordsList];
    }
    
    let listHtml = '';
    wordsList.forEach((wordData, idx) => {
      listHtml += `
        <div style="border-bottom:1px dashed #A7D08C; padding:6px 0; display:flex; flex-direction:column; gap:2px; text-align:left;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:bold; color:#3b7a13; font-size:0.85rem;">${wordData.word}</span>
            <span style="font-size:0.7rem; color:#8D6E63;">${wordData.phonetic || ''}</span>
          </div>
          <div style="font-size:0.75rem; color:#5D4037; font-weight:500;">${wordData.meaning}</div>
          ${wordData.example ? `<div style="font-size:0.65rem; color:#795548; font-style:italic; line-height:1.2; margin-top:2px;">Cảnh: "${wordData.example}"</div>` : ''}
          <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:4px;">
            <button class="btn btn-yes btn-save-ocr-item" data-idx="${idx}" style="padding:4px 8px; font-size:0.65rem; border-radius:4px; font-weight:bold; cursor:pointer;">Lưu từ 🍵</button>
          </div>
        </div>
      `;
    });

    const ocrHtml = `
      <div class="bubble-header">
        <span>Từ vựng đã quét (${wordsList.length}) 📸</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div class="matcha-scroll-list" style="max-height: 220px; overflow-y: auto; padding:0 4px;">
        ${listHtml}
      </div>
    `;
    openBubble(ocrHtml);
    startAnimation('celebrating');

    shadow.querySelector('#close-bubble').addEventListener('click', closeBubble);

    shadow.querySelectorAll('.btn-save-ocr-item').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        const wordData = wordsList[idx];
        
        btn.textContent = 'Đang lưu...';
        btn.disabled = true;

        const data = await chrome.storage.local.get(['jwt_token']);
        if (!data.jwt_token) {
          alert("Vui lòng kết nối tài khoản ở popup tiện ích trước nhé!");
          btn.textContent = 'Lưu từ 🍵';
          btn.disabled = false;
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
              source: 'Matcha OCR',
              is_global: true // Save to library & share to community!
            })
          });
          if (res.ok) {
            btn.textContent = 'Đã lưu ✔';
            btn.style.background = '#81C784';
            btn.style.border = '1px solid #4CAF50';
            btn.style.color = '#FFFFFF';
            // Trigger storage update
            chrome.runtime.sendMessage({ action: 'save_jwt_token', token: data.jwt_token });
          } else {
            const errData = await res.json();
            alert(errData.detail || "Lỗi lưu từ vựng.");
            btn.textContent = 'Lưu từ 🍵';
            btn.disabled = false;
          }
        } catch (err) {
          console.error(err);
          btn.textContent = 'Lưu từ 🍵';
          btn.disabled = false;
        }
      });
    });
  }
})();

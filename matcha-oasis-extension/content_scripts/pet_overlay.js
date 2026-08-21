// content_scripts/pet_overlay.js

(function() {
  if (window.hasMatchaMascotRun) return;
  window.hasMatchaMascotRun = true;

  console.log("Matcha Study Buddy injected.");

  const isMainSite = window.location.hostname.includes("ieltsoasis.site");
  let consecutiveWrong = 0;

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
  document.body.appendChild(mascotRoot);

  // Injected CSS Styles
  const style = document.createElement('style');
  style.textContent = `
    #matcha-pet-wrapper {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
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
      cursor: pointer;
      color: #5D4037;
      font-weight: bold;
      transition: all 0.2s;
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
        wrapper.style.left = `${e.clientX - offsetX}px`;
        wrapper.style.top = `${e.clientY - offsetY}px`;
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

  function toggleMascotMenu() {
    if (bubble.style.display === 'flex') {
      closeBubble();
      return;
    }

    bubble.innerHTML = `
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
        <button class="btn btn-yes" id="btn-view-schedule" style="width: 100%; padding: 6px; background: #F3E5F5; border: 1.5px solid #BA68C8;">📅 Lịch học của tớ</button>
        <button class="btn btn-yes" id="btn-test-reminder" style="width: 100%; padding: 6px; background: #FFF9E6; border: 1.5px solid #A7D08C;">📝 Ôn từ (Quiz)</button>
      </div>
    `;
    bubble.style.display = 'flex';
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

    shadow.getElementById('btn-view-schedule').addEventListener('click', showStudyScheduleUI);

    shadow.getElementById('btn-test-reminder').addEventListener('click', async () => {
      closeBubble();
      chrome.runtime.sendMessage({ action: 'trigger_immediate_alarm' });
    });
  }

  // Quick Manual Add Word UI
  function showQuickAddForm() {
    bubble.innerHTML = `
      <div class="bubble-header">
        <span>Thêm nhanh từ vựng ➕</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
        <input type="text" id="add-word" class="quiz-input" placeholder="Từ tiếng Anh (e.g. dynamic)" required />
        <input type="text" id="add-phonetic" class="quiz-input" placeholder="Phát âm (e.g. /daɪˈnæm.ɪk/)" />
        <input type="text" id="add-meaning" class="quiz-input" placeholder="Nghĩa tiếng Việt" required />
        <input type="text" id="add-example" class="quiz-input" placeholder="Ví dụ minh họa" />
        <button class="btn btn-yes" id="btn-submit-quick-add" style="margin-top:4px; padding:8px;">Lưu Từ Vựng 🍵</button>
      </div>
    `;

    shadow.getElementById('close-bubble').addEventListener('click', closeBubble);
    shadow.getElementById('btn-submit-quick-add').addEventListener('click', async () => {
      const word = shadow.getElementById('add-word').value.trim();
      const phonetic = shadow.getElementById('add-phonetic').value.trim();
      const meaning = shadow.getElementById('add-meaning').value.trim();
      const example = shadow.getElementById('add-example').value.trim();

      if (!word || !meaning) {
        alert("Vui lòng điền Từ tiếng Anh và Nghĩa tiếng Việt!");
        return;
      }

      const data = await chrome.storage.local.get(['jwt_token']);
      if (!data.jwt_token) {
        alert("Vui lòng kết nối tài khoản ở popup tiện ích trước nhé!");
        return;
      }

      try {
        const res = await fetch('https://ieltsoasis.site/api/vocabulary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.jwt_token}`
          },
          body: JSON.stringify({
            word,
            meaning,
            phonetic,
            example,
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
      listHtml = `<div class="matcha-scroll-list">`;
      list.forEach(v => {
        listHtml += `
          <div class="list-item">
            <div style="font-weight:bold; color:#3b7a13; font-size:0.8rem;">${v.word} <span style="font-weight:normal; color:#8D6E63;">${v.phonetic || ''}</span></div>
            <div style="color:#5D4037; font-size:0.75rem;">${v.meaning}</div>
          </div>
        `;
      });
      listHtml += `</div>`;
    }

    bubble.innerHTML = `
      <div class="bubble-header">
        <span>Tủ từ của tớ (${list.length}) 📚</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      ${listHtml}
      <button class="btn btn-yes" id="btn-back-menu" style="width:100%; margin-top:4px;">Quay lại</button>
    `;

    shadow.getElementById('close-bubble').addEventListener('click', closeBubble);
    shadow.getElementById('btn-back-menu').addEventListener('click', toggleMascotMenu);
  }

  // Show Synced Study Plan details
  async function showStudyScheduleUI() {
    const data = await chrome.storage.local.get(['study_schedule', 'user_info']);
    const sched = data.study_schedule || { level: 'General', topic: 'N/A', study_focus: 'Toàn diện' };
    const user = data.user_info || { username: 'Học viên' };

    bubble.innerHTML = `
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

    shadow.getElementById('close-bubble').addEventListener('click', closeBubble);
    shadow.getElementById('btn-back-menu').addEventListener('click', toggleMascotMenu);
  }

  // Reminders and Quiz triggers
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'show_reminder' && !isMainSite) {
      showVocabReminder();
    }
  });

  // Dynamic Quiz Generator matching web styles
  async function showVocabReminder() {
    const data = await chrome.storage.local.get(['user_vocab']);
    const list = data.user_vocab || [];

    // Fallback vocabulary words if empty
    const defaultList = [
      { word: 'academic', meaning: 'tính học thuật', phonetic: '/ˌæk.əˈdem.ɪk/', example: 'She has high academic standards.' },
      { word: 'dynamic', meaning: 'năng động, biến đổi không ngừng', phonetic: '/daɪˈnæm.ɪk/', example: 'A dynamic study environment.' },
      { word: 'acquire', meaning: 'gặt hái, thu nhận được', phonetic: '/əˈkwaɪər/', example: 'To acquire language skills.' },
      { word: 'diligent', meaning: 'chăm chỉ, siêng năng', phonetic: '/ˈdɪl.ɪ.dʒənt/', example: 'A diligent student passes tests.' },
      { word: 'havoc', meaning: 'tàn phá, hỗn loạn', phonetic: '/ˈhæv.ək/', example: 'The storm wreaked havoc.' }
    ];

    const activeList = list.length >= 4 ? list : defaultList;
    const targetIdx = Math.floor(Math.random() * activeList.length);
    const targetWord = activeList[targetIdx];

    // Pick quiz mode (0: ABCD, 1: Fill in the blank)
    const quizMode = Math.random() > 0.5 ? 0 : 1;

    if (quizMode === 0) {
      // ABCD Multiple Choice Quiz
      // Generate distractors
      const incorrectPool = activeList.filter(item => item.word !== targetWord.word);
      const shuffledIncorrect = incorrectPool.sort(() => 0.5 - Math.random()).slice(0, 3);
      const choices = [targetWord, ...shuffledIncorrect].sort(() => 0.5 - Math.random());

      bubble.innerHTML = `
        <div class="bubble-header">
          <span>Trắc nghiệm từ vựng (ABCD) 📝</span>
          <span class="close-btn" id="close-bubble">×</span>
        </div>
        <div style="font-size: 0.85rem; text-align: center; margin-bottom: 4px;">
          Nghĩa tiếng Việt của từ: <br/>
          <strong style="font-size:1.1rem; color:#3b7a13;">${targetWord.word}</strong>
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

      shadow.getElementById('close-bubble').addEventListener('click', closeBubble);
      
      const choiceButtons = shadow.querySelectorAll('.btn-choice');
      choiceButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const isCorrect = btn.getAttribute('data-correct') === 'true';
          const feedback = shadow.getElementById('quiz-feedback');
          
          choiceButtons.forEach(b => b.setAttribute('disabled', 'true'));

          if (isCorrect) {
            consecutiveWrong = 0;
            btn.style.borderColor = '#81C784';
            btn.style.background = '#E8F5E9';
            feedback.innerHTML = '<span style="color:#2E7D32;">Chính xác! Cậu giỏi lắm! 🍵</span>';
            startAnimation('celebrating');
            setTimeout(() => {
              closeBubble();
              startAnimation('idle');
            }, 3500);
          } else {
            consecutiveWrong++;
            btn.style.borderColor = '#E57373';
            btn.style.background = '#FFEBEE';
            feedback.innerHTML = `<span style="color:#C62828;">Chưa đúng rồi! Nghĩa đúng: "${targetWord.meaning}" 😭</span>`;
            startAnimation('crying');
            setTimeout(() => {
              if (consecutiveWrong >= 3) {
                triggerTantrumLockout();
              } else {
                showVocabReminder(); // Load new question immediately
              }
            }, 3500);
          }
        });
      });

    } else {
      // Fill in the blank Quiz
      bubble.innerHTML = `
        <div class="bubble-header">
          <span>Điền từ tiếng Anh còn thiếu ✏️</span>
          <span class="close-btn" id="close-bubble">×</span>
        </div>
        <div style="font-size: 0.85rem; text-align: center; margin-bottom: 6px;">
          Từ tiếng Anh nào có nghĩa là: <br/>
          <strong style="font-size:1rem; color:#3b7a13;">"${targetWord.meaning}"</strong>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
          <input type="text" id="blank-input" class="quiz-input" placeholder="Gõ từ tiếng Anh..." autofocus />
          <button class="btn btn-yes" id="btn-submit-blank" style="padding:8px;">Kiểm tra</button>
        </div>
        <div id="quiz-feedback" class="quiz-feedback"></div>
      `;

      shadow.getElementById('close-bubble').addEventListener('click', closeBubble);

      const submitBtn = shadow.getElementById('btn-submit-blank');
      const inputEl = shadow.getElementById('blank-input');

      submitBtn.addEventListener('click', () => {
        const userAnswer = inputEl.value.trim().toLowerCase();
        const correctAnswer = targetWord.word.trim().toLowerCase();
        const feedback = shadow.getElementById('quiz-feedback');

        inputEl.setAttribute('disabled', 'true');
        submitBtn.setAttribute('disabled', 'true');

        if (userAnswer === correctAnswer) {
          consecutiveWrong = 0;
          feedback.innerHTML = '<span style="color:#2E7D32;">Xuất sắc! Cậu viết đúng rồi! 🍵</span>';
          startAnimation('celebrating');
          setTimeout(() => {
            closeBubble();
            startAnimation('idle');
          }, 3500);
        } else {
          consecutiveWrong++;
          feedback.innerHTML = `<span style="color:#C62828;">Chưa đúng rồi! Từ đúng là: "${targetWord.word}" 😭</span>`;
          startAnimation('crying');
          setTimeout(() => {
            if (consecutiveWrong >= 3) {
              triggerTantrumLockout();
            } else {
              showVocabReminder(); // Load new question immediately
            }
          }, 3500);
        }
      });
    }
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
    bubble.innerHTML = `
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
    bubble.style.display = 'flex';
    startAnimation('celebrating');

    shadow.getElementById('close-bubble').addEventListener('click', closeBubble);
    shadow.getElementById('btn-save-vocab').addEventListener('click', async () => {
      const data = await chrome.storage.local.get(['jwt_token']);
      if (!data.jwt_token) {
        alert("Vui lòng kết nối tài khoản ở popup tiện ích trước nhé!");
        return;
      }
      try {
        const res = await fetch('https://ieltsoasis.site/api/vocabulary', {
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

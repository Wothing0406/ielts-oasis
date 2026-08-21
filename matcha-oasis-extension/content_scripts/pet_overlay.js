// content_scripts/pet_overlay.js

(function() {
  if (window.hasMatchaMascotRun) return;
  window.hasMatchaMascotRun = true;

  console.log("Matcha Study Buddy injected.");

  const isMainSite = window.location.hostname.includes("ieltsoasis.site");

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
      max-width: 250px;
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

  // Dragging Implementation
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  img.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - wrapper.offsetLeft;
    offsetY = e.clientY - wrapper.offsetTop;
    wrapper.style.right = 'auto'; // Disable default right pinning
    wrapper.style.bottom = 'auto'; // Disable default bottom pinning
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      wrapper.style.left = `${e.clientX - offsetX}px`;
      wrapper.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Reminders and Quiz triggers
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'show_reminder' && !isMainSite) {
      showVocabReminder(message.vocab);
    }
  });

  function showVocabReminder(vocab) {
    bubble.innerHTML = `
      <div class="bubble-header">
        <span>Gợi ý từ vựng 🍵</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div>
        <span class="word">${vocab.word}</span>
        <span class="phonetic">${vocab.phonetic || ''}</span>
      </div>
      <div class="meaning">${vocab.meaning}</div>
      <div class="example">" ${vocab.example || ''} "</div>
      <div class="actions">
        <button class="btn btn-yes" id="btn-know">Đã nhớ</button>
        <button class="btn btn-no" id="btn-forgot">Quên</button>
      </div>
    `;
    bubble.style.display = 'flex';
    
    // Switch to alert animation
    startAnimation('alert');

    // Hook events
    shadow.getElementById('close-bubble').addEventListener('click', closeBubble);
    shadow.getElementById('btn-know').addEventListener('click', () => {
      closeBubble();
      startAnimation('celebrating');
      setTimeout(() => startAnimation('idle'), 3000);
    });
    shadow.getElementById('btn-forgot').addEventListener('click', () => {
      closeBubble();
      startAnimation('crying');
      setTimeout(() => startAnimation('idle'), 3000);
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
})();

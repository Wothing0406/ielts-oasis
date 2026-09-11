// content_scripts/pet_overlay.js

(function () {
  if (window.hasMatchaMascotRun) return;
  window.hasMatchaMascotRun = true;

  console.log("Matcha Study Buddy injected.");

  function checkIsOasisSite() {
    const host = window.location.hostname;
    if (
      host.includes("ieltsoasis") ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("100.") ||
      host.startsWith("192.168.") ||
      host.startsWith("10.")
    ) {
      return true;
    }
    if (
      typeof localStorage !== "undefined" &&
      (localStorage.getItem("oasis_token") ||
        localStorage.getItem("oasis_guest_id"))
    ) {
      return true;
    }
    if (document.title && document.title.includes("IELTS Oasis")) {
      return true;
    }
    return false;
  }
  const isMainSite = checkIsOasisSite();
  let consecutiveWrong = 0;

  async function getServerUrl() {
    const data = await chrome.storage.local.get(["server_url"]);
    return data.server_url || "https://ieltsoasis.site";
  }

  // Helper to save active quiz state
  async function saveActiveQuizState(shuffledList, currentIdx, score, mode) {
    await chrome.storage.local.set({
      active_quiz_state: {
        shuffledList,
        currentIdx,
        score,
        mode,
        timestamp: Date.now(),
      },
    });
  }

  // Helper to clear active quiz state
  async function clearActiveQuizState() {
    await chrome.storage.local.set({ active_quiz_state: null });
  }

  // Zero-touch token auto-recovery on load (checks current tab localStorage)
  const origin = window.location.origin;
  let localToken = null;
  let localUser = null;
  try {
    localToken = localStorage.getItem("oasis_token");
    localUser = localStorage.getItem("oasis_user");
  } catch (e) {}

  if (localToken) {
    chrome.storage.local.set({ server_url: origin, jwt_token: localToken });
    chrome.runtime.sendMessage({
      action: "save_jwt_token",
      token: localToken,
      user: localUser,
      server_url: origin,
    });
    console.log(
      "[Matcha Mascot] Auto-synced active token from page localStorage.",
    );
  } else if (isMainSite) {
    chrome.storage.local.set({ server_url: origin });
  }

  // Unified handler for real-time events from IELTS Oasis web app
  async function handleOasisEvent(data) {
    if (!data || typeof data !== "object" || !data.type) return;

    if (data.type === "OASIS_AUTH_SYNC") {
      const siteOrigin = data.origin || window.location.origin;
      const token = data.token;
      if (token) {
        await chrome.storage.local.set({
          server_url: siteOrigin,
          jwt_token: token,
          user_info: data.user || null,
        });
        chrome.runtime.sendMessage({
          action: "save_jwt_token",
          token: token,
          user: data.user,
          server_url: siteOrigin,
        });
        console.log("[Matcha Mascot] Synced auth token from web app!");
      }
    } else if (data.type === "OASIS_VOCAB_UPDATED" && data.vocab) {
      console.log(
        "[Matcha Mascot] Received OASIS_VOCAB_UPDATED:",
        data.vocab.word,
      );
      const siteOrigin = data.origin || window.location.origin;
      const token =
        data.token ||
        localToken ||
        (await chrome.storage.local.get(["jwt_token"])).jwt_token;
      await chrome.storage.local.set({ server_url: siteOrigin });
      if (token) {
        await chrome.storage.local.set({ jwt_token: token });
      }

      // Optimistic 0ms instant prepend to local storage
      const res = await chrome.storage.local.get(["user_vocab"]);
      const list = res.user_vocab || [];
      const newWord = data.vocab;
      if (
        !list.some(
          (v) =>
            (v.word || "").toLowerCase() === (newWord.word || "").toLowerCase(),
        )
      ) {
        const updatedList = [newWord, ...list];
        await chrome.storage.local.set({ user_vocab: updatedList });
        console.log(
          "[Matcha Mascot] Instantly added vocab to extension storage:",
          newWord.word,
        );
      }

      if (token) {
        chrome.runtime.sendMessage({ action: "sync_vocab", token: token });
      }
      await clearActiveQuizState();
    } else if (data.type === "OASIS_VOCAB_DELETED" && (data.id || data.word)) {
      console.log(
        "[Matcha Mascot] Received OASIS_VOCAB_DELETED:",
        data.id || data.word,
      );
      const res = await chrome.storage.local.get(["user_vocab"]);
      if (res.user_vocab) {
        const filtered = res.user_vocab.filter(
          (v) =>
            (data.id && v.id !== data.id) ||
            (data.word && v.word?.toLowerCase() !== data.word?.toLowerCase()),
        );
        await chrome.storage.local.set({ user_vocab: filtered });
      }
      const token =
        data.token ||
        localToken ||
        (await chrome.storage.local.get(["jwt_token"])).jwt_token;
      if (token) {
        chrome.runtime.sendMessage({ action: "sync_vocab", token: token });
      }
      await clearActiveQuizState();
    }
  }

  // Listen to both window message (postMessage) and CustomEvent unconditionally
  window.addEventListener("message", (event) => {
    if (event.data) handleOasisEvent(event.data);
  });
  window.addEventListener("oasis_extension_sync", (event) => {
    if (event.detail) handleOasisEvent(event.detail);
  });

  // Listen to localStorage token changes across tabs on main website
  window.addEventListener("storage", (e) => {
    if (e.key === "oasis_token" && e.newValue) {
      chrome.runtime.sendMessage({
        action: "save_jwt_token",
        token: e.newValue,
        server_url: origin,
      });
    }
  });

  // Create Shadow DOM Container
  const mascotRoot = document.createElement("div");
  mascotRoot.id = "matcha-mascot-container";
  const shadow = mascotRoot.attachShadow({ mode: "closed" });
  document.documentElement.appendChild(mascotRoot);

  // Injected CSS Styles
  const style = document.createElement("style");
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
      bottom: 85px;
      right: 0;
      background-color: #FFFDF5;
      border: 2px solid #A7D08C;
      border-radius: 1.25rem;
      padding: 14px 16px 16px 16px;
      width: 310px;
      min-width: 220px;
      max-width: 580px;
      max-height: 82vh;
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain !important;
      box-sizing: border-box;
      color: #5D4037;
      box-shadow: 0 10px 30px rgba(167, 208, 140, 0.35);
      display: none;
      flex-direction: column;
      gap: 8px;
      pointer-events: auto;
      font-size: 0.95rem;
      touch-action: pan-y !important;
      -webkit-overflow-scrolling: touch !important;
      z-index: 1000;
    }

    .bubble-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      border-bottom: 1.5px solid rgba(167, 208, 140, 0.4);
      padding-bottom: 6px;
      margin-bottom: 6px;
      box-sizing: border-box;
      position: relative;
      cursor: grab;
      user-select: none;
      touch-action: none;
    }

    .bubble-header:active {
      cursor: grabbing;
    }

    .bubble-header-title {
      font-size: 1rem;
      font-weight: 700;
      color: #2E7D32;
      display: flex;
      align-items: center;
      gap: 5px;
      user-select: none;
      pointer-events: none;
    }

    .bubble-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: default;
    }

    /* Window resize handles like desktop OS windows */
    .bubble-resize-handle {
      position: absolute;
      z-index: 1002;
      user-select: none;
      pointer-events: auto;
      touch-action: none;
    }

    .bubble-resize-se {
      bottom: 0px;
      right: 0px;
      width: 18px;
      height: 18px;
      cursor: nwse-resize;
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      padding: 3px;
      opacity: 0.6;
      transition: opacity 0.15s ease;
    }
    .bubble-resize-se:hover { opacity: 1; }
    .bubble-resize-se::after {
      content: '';
      width: 9px;
      height: 9px;
      border-right: 2.5px solid #81C784;
      border-bottom: 2.5px solid #81C784;
      border-radius: 1px;
    }

    .bubble-resize-sw {
      bottom: 0px;
      left: 0px;
      width: 18px;
      height: 18px;
      cursor: nesw-resize;
      display: flex;
      align-items: flex-end;
      justify-content: flex-start;
      padding: 3px;
      opacity: 0.6;
      transition: opacity 0.15s ease;
    }
    .bubble-resize-sw:hover { opacity: 1; }
    .bubble-resize-sw::after {
      content: '';
      width: 9px;
      height: 9px;
      border-left: 2.5px solid #81C784;
      border-bottom: 2.5px solid #81C784;
      border-radius: 1px;
    }

    .bubble-resize-e {
      top: 20px;
      right: 0px;
      bottom: 20px;
      width: 8px;
      cursor: ew-resize;
    }

    .bubble-resize-w {
      top: 20px;
      left: 0px;
      bottom: 20px;
      width: 8px;
      cursor: ew-resize;
    }

    .close-btn {
      cursor: pointer;
      font-weight: bold;
      color: #8D6E63;
      font-size: 1.35rem;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      border-radius: 6px;
      transition: all 0.15s ease;
      user-select: none;
    }

    .close-btn:hover {
      background: #FFEBEE;
      color: #D32F2F;
    }

    /* Vertical Action Menu list */
    .menu-vertical-list {
      display: flex;
      flex-direction: column;
      gap: 7px;
      width: 100%;
      box-sizing: border-box;
    }

    .menu-item-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      border: 1.5px solid #A7D08C;
      background: #FFFDF5;
      color: #43281C;
      transition: all 0.18s ease;
      text-align: left;
      box-sizing: border-box;
      width: 100%;
    }

    .menu-item-btn:hover {
      transform: translateX(3px);
      box-shadow: 0 2px 8px rgba(167, 208, 140, 0.35);
    }

    .menu-item-btn .menu-icon {
      font-size: 1.15rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .word {
      font-size: 1.35rem;
      font-weight: bold;
      color: #2E7D32;
    }

    .phonetic {
      color: #8D6E63;
      font-size: 1rem;
    }

    .meaning {
      font-size: 1.05rem;
      line-height: 1.4;
    }

    .example {
      font-size: 0.95rem;
      color: #795548;
      font-style: italic;
    }

    .actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 6px;
    }

    .btn {
      padding: 8px 14px;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: bold;
      cursor: pointer;
    }

    .btn-yes {
      background-color: #A7D08C;
      color: #43281C;
    }

    .btn-no {
      background-color: #E0E0E0;
      color: #5D4037;
    }

    /* Interactive Quiz elements */
    .btn-choice {
      width: 100%;
      padding: 10px 14px;
      background: #FFFDF5;
      border: 1.5px solid #A7D08C;
      border-radius: 12px;
      text-align: left;
      font-size: 0.95rem;
      cursor: pointer !important;
      color: #43281C;
      font-weight: 600;
      line-height: 1.35;
      transition: all 0.2s;
      pointer-events: all !important;
    }

    .btn-choice:hover {
      background: #E8F5E9;
      transform: scale(1.01);
    }

    .quiz-input {
      width: 100%;
      padding: 10px 14px;
      border: 2px solid #A7D08C;
      border-radius: 12px;
      font-size: 1rem;
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
      font-size: 1rem;
      margin-top: 6px;
      text-align: center;
    }

    /* Scrollable items */
    .matcha-scroll-list {
      max-height: 260px;
      overflow-y: auto !important;
      overflow-x: hidden;
      overscroll-behavior: contain !important;
      touch-action: pan-y !important;
      -webkit-overflow-scrolling: touch !important;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-right: 6px;
    }

    .matcha-scroll-list::-webkit-scrollbar {
      width: 6px;
    }

    .matcha-scroll-list::-webkit-scrollbar-thumb {
      background: #A7D08C;
      border-radius: 4px;
    }

    .list-item {
      padding: 8px 12px;
      background: #FAF8F5;
      border-left: 4px solid #A7D08C;
      border-radius: 6px;
      font-size: 0.92rem;
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

    @keyframes matchaTantrumShake {
      0% { transform: translateY(0) rotate(0deg); }
      25% { transform: translateY(-4px) rotate(-4deg); }
      50% { transform: translateY(0) rotate(0deg); }
      75% { transform: translateY(-4px) rotate(4deg); }
      100% { transform: translateY(0) rotate(0deg); }
    }

    @keyframes matchaHappyJump {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-12px) scale(1.08); }
    }

    @keyframes matchaSadTremble {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }

    .lockout-mascot-tantrum {
      animation: matchaTantrumShake 0.4s infinite ease-in-out;
    }

    .lockout-mascot-celebrating {
      animation: matchaHappyJump 0.5s infinite ease-in-out;
    }

    .lockout-mascot-crying {
      animation: matchaSadTremble 0.35s infinite ease-in-out;
    }
  `;
  shadow.appendChild(style);

  // Animation states definition
  const animationFrames = {
    idle: [
      chrome.runtime.getURL("assets/mascot/idle_1.png"),
      chrome.runtime.getURL("assets/mascot/idle_2.png"),
      chrome.runtime.getURL("assets/mascot/idle_3.png"),
      chrome.runtime.getURL("assets/mascot/idle_4.png"),
    ],
    alert: [
      chrome.runtime.getURL("assets/mascot/alert_1.png"),
      chrome.runtime.getURL("assets/mascot/alert_2.png"),
      chrome.runtime.getURL("assets/mascot/alert_3.png"),
    ],
    celebrating: [
      chrome.runtime.getURL("assets/mascot/celebrating_1.png"),
      chrome.runtime.getURL("assets/mascot/celebrating_2.png"),
      chrome.runtime.getURL("assets/mascot/celebrating_3.png"),
      chrome.runtime.getURL("assets/mascot/celebrating_4.png"),
    ],
    crying: [
      chrome.runtime.getURL("assets/mascot/crying_1.png"),
      chrome.runtime.getURL("assets/mascot/crying_2.png"),
      chrome.runtime.getURL("assets/mascot/crying_3.png"),
    ],
    tantrum: [
      chrome.runtime.getURL("assets/mascot/tantrum_1.png"),
      chrome.runtime.getURL("assets/mascot/tantrum_2.png"),
      chrome.runtime.getURL("assets/mascot/tantrum_3.png"),
    ],
  };

  let currentAction = isMainSite ? "celebrating" : "idle";
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
  const wrapper = document.createElement("div");
  wrapper.id = "matcha-pet-wrapper";

  const bubble = document.createElement("div");
  bubble.className = "speech-bubble";

  const img = document.createElement("img");
  img.className = "pet-sprite";
  img.alt = "Mát Cha Pet";

  wrapper.appendChild(bubble);
  wrapper.appendChild(img);
  shadow.appendChild(wrapper);

  // Start default animation loop
  startAnimation(currentAction);

  // Angry Run Animation State
  let isAngryRunning = false;
  let angryAnimFrameId = null;
  let lockoutMascotInterval = null;
  let runningCats = [];
  let consecutiveIgnored = 0;
  let reminderTimer = null;
  let snoozeTimeout = null;

  function setLockoutMascotAction(action) {
    if (lockoutMascotInterval) {
      clearInterval(lockoutMascotInterval);
      lockoutMascotInterval = null;
    }
    const mascotImg = shadow.querySelector("#lockout-mascot-img");
    if (!mascotImg) return;

    mascotImg.classList.remove(
      "lockout-mascot-tantrum",
      "lockout-mascot-celebrating",
      "lockout-mascot-crying"
    );
    if (action === "tantrum") {
      mascotImg.classList.add("lockout-mascot-tantrum");
    } else if (action === "celebrating") {
      mascotImg.classList.add("lockout-mascot-celebrating");
    } else if (action === "crying") {
      mascotImg.classList.add("lockout-mascot-crying");
    }

    let fIdx = 0;
    const updateFrame = () => {
      const frames = animationFrames[action];
      if (frames && frames.length > 0) {
        mascotImg.src = frames[fIdx];
        fIdx = (fIdx + 1) % frames.length;
      }
    };
    updateFrame();
    lockoutMascotInterval = setInterval(updateFrame, 280);
  }

  function applySnoozeState(snoozedUntil) {
    closeBubble();
    wrapper.style.transition = "all 0.5s ease";
    wrapper.style.left = "auto";
    wrapper.style.top = "auto";
    wrapper.style.bottom = "20px";
    wrapper.style.right = "-60px";
    wrapper.style.opacity = "0.35";
    wrapper.style.pointerEvents = "auto"; // allow hover/click
    img.style.cursor = "pointer";

    wrapper.onmouseenter = () => {
      wrapper.style.right = "-40px";
      wrapper.style.opacity = "0.7";
    };
    wrapper.onmouseleave = () => {
      wrapper.style.right = "-60px";
      wrapper.style.opacity = "0.35";
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
    wrapper.style.transition = "all 0.5s ease";
    wrapper.style.opacity = "1";
    wrapper.style.right = "20px";
    wrapper.style.bottom = "20px";
    wrapper.style.left = "auto";
    wrapper.style.top = "auto";
    img.style.cursor = "grab";
    await chrome.storage.local.set({ snoozed_until: null });
  }

  function restoreMascotPosition() {
    chrome.storage.local.get(["pet_pos_x", "pet_pos_y"], (res) => {
      if (
        res &&
        typeof res.pet_pos_x === "number" &&
        typeof res.pet_pos_y === "number"
      ) {
        const maxX = Math.max(5, window.innerWidth - 85);
        const maxY = Math.max(5, window.innerHeight - 85);
        const posX = Math.max(5, Math.min(res.pet_pos_x, maxX));
        const posY = Math.max(5, Math.min(res.pet_pos_y, maxY));
        wrapper.style.right = "auto";
        wrapper.style.bottom = "auto";
        wrapper.style.left = `${posX}px`;
        wrapper.style.top = `${posY}px`;
      } else {
        wrapper.style.left = "auto";
        wrapper.style.top = "auto";
        wrapper.style.right = "20px";
        wrapper.style.bottom = "20px";
      }
    });
  }

  function startAngryRun() {
    if (isAngryRunning) return;
    isAngryRunning = true;
    closeBubble();
    shadow.querySelectorAll(".matcha-cat-clone").forEach((c) => c.remove());
    runningCats = [];
    if (angryAnimFrameId) {
      cancelAnimationFrame(angryAnimFrameId);
      angryAnimFrameId = null;
    }
    chrome.storage.local.set({ is_punishment_mode: true });
  }

  function stopAngryRun() {
    isAngryRunning = false;
    if (angryAnimFrameId) {
      cancelAnimationFrame(angryAnimFrameId);
      angryAnimFrameId = null;
    }
    if (lockoutMascotInterval) {
      clearInterval(lockoutMascotInterval);
      lockoutMascotInterval = null;
    }

    shadow.querySelectorAll(".matcha-cat-clone").forEach((c) => c.remove());
    runningCats = [];

    const overlay = shadow.querySelector(".lockout-overlay");
    if (overlay) overlay.remove();
    const card = shadow.querySelector(".lockout-card");
    if (card) card.remove();

    wrapper.style.display = "block";
    wrapper.style.opacity = "1";
    wrapper.style.transition = "all 0.4s ease";
    restoreMascotPosition();

    startAnimation("idle");
    img.style.width = "80px";
    img.style.height = "80px";

    chrome.storage.local.set({ is_punishment_mode: false });
  }

  function flashLockoutBox() {
    const card = shadow.querySelector(".lockout-card");
    if (card) {
      card.style.transform = "translate(-50%, -50%) scale(1.04)";
      card.style.transition = "transform 0.12s ease";
      setTimeout(() => {
        card.style.transform = "translate(-50%, -50%) scale(1)";
      }, 120);
    }
  }

  // Check snooze & punishment states on load
  chrome.storage.local.get(["is_punishment_mode", "snoozed_until"], (data) => {
    if (data.is_punishment_mode) {
      triggerTantrumLockout();
    } else if (data.snoozed_until && Date.now() < data.snoozed_until) {
      applySnoozeState(data.snoozed_until);
    }
  });

  // Listen to cross-tab storage changes (e.g. user answered lockout in another tab)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;

    if (changes.is_punishment_mode) {
      if (changes.is_punishment_mode.newValue === false) {
        // Dismiss lockout instantly across all open tabs
        const overlay = shadow.querySelector(".lockout-overlay");
        if (overlay) overlay.remove();
        const card = shadow.querySelector(".lockout-card");
        if (card) card.remove();
        stopAngryRun();
      } else if (
        changes.is_punishment_mode.newValue === true &&
        !isAngryRunning
      ) {
        triggerTantrumLockout();
      }
    }

    if (
      changes.lockout_quiz_state &&
      changes.lockout_quiz_state.newValue === null
    ) {
      const overlay = shadow.querySelector(".lockout-overlay");
      if (overlay) overlay.remove();
      const card = shadow.querySelector(".lockout-card");
      if (card) card.remove();
      stopAngryRun();
    }

    if (changes.user_vocab) {
      // If vocab list or loading bubble is currently visible in bubble, re-render it
      const headerTitle = shadow.querySelector(".bubble-header-title");
      if (
        headerTitle &&
        (headerTitle.textContent.includes("Tủ từ") ||
          headerTitle.textContent.includes("Kho từ")) &&
        bubble.style.display === "flex"
      ) {
        showVocabListUI();
      }
    }
  });

  // Restore pet position from local storage
  chrome.storage.local.get(["pet_pos_x", "pet_pos_y"], (res) => {
    if (
      res &&
      typeof res.pet_pos_x === "number" &&
      typeof res.pet_pos_y === "number"
    ) {
      const maxX = Math.max(5, window.innerWidth - 85);
      const maxY = Math.max(5, window.innerHeight - 85);
      const posX = Math.max(5, Math.min(res.pet_pos_x, maxX));
      const posY = Math.max(5, Math.min(res.pet_pos_y, maxY));
      wrapper.style.right = "auto";
      wrapper.style.bottom = "auto";
      wrapper.style.left = `${posX}px`;
      wrapper.style.top = `${posY}px`;
    }
  });

  // Mascot Dragging & Clicking Implementation
  let isDraggingMascot = false;
  let hasDraggedMascot = false;
  let lastDragEndTime = 0;
  let mascotOffsetX = 0;
  let mascotOffsetY = 0;
  let mascotStartX = 0;
  let mascotStartY = 0;

  function startMascotDrag(clientX, clientY) {
    isDraggingMascot = true;
    hasDraggedMascot = false;
    mascotStartX = clientX;
    mascotStartY = clientY;
    const rect = wrapper.getBoundingClientRect();
    mascotOffsetX = clientX - rect.left;
    mascotOffsetY = clientY - rect.top;

    wrapper.style.right = "auto";
    wrapper.style.bottom = "auto";
    wrapper.style.left = `${rect.left}px`;
    wrapper.style.top = `${rect.top}px`;
  }

  function moveMascotDrag(clientX, clientY) {
    if (!isDraggingMascot) return;
    const travel = Math.sqrt(
      (clientX - mascotStartX) ** 2 + (clientY - mascotStartY) ** 2,
    );
    if (travel > 4) {
      hasDraggedMascot = true;
      let newLeft = clientX - mascotOffsetX;
      let newTop = clientY - mascotOffsetY;

      // Restrict mascot (80x80) fully inside current viewport
      const minLeft = 5;
      const maxLeft = Math.max(minLeft, window.innerWidth - 85);
      const minTop = 5;
      const maxTop = Math.max(minTop, window.innerHeight - 85);

      newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
      newTop = Math.max(minTop, Math.min(newTop, maxTop));

      wrapper.style.left = `${newLeft}px`;
      wrapper.style.top = `${newTop}px`;

      if (bubble.style.display === "flex") {
        adjustBubblePosition();
      }
    }
  }

  function endMascotDrag() {
    if (!isDraggingMascot) return;
    isDraggingMascot = false;
    if (hasDraggedMascot) {
      lastDragEndTime = Date.now();
      const rect = wrapper.getBoundingClientRect();
      chrome.storage.local.set({
        pet_pos_x: Math.round(rect.left),
        pet_pos_y: Math.round(rect.top),
      });
    }
  }

  // Mouse events for mascot
  img.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    startMascotDrag(e.clientX, e.clientY);
  });

  // Touch events for mascot (mobile/touch-screen laptops)
  img.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        startMascotDrag(t.clientX, t.clientY);
      }
    },
    { passive: true },
  );

  window.addEventListener(
    "mousemove",
    (e) => {
      moveMascotDrag(e.clientX, e.clientY);
    },
    { passive: false },
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (isDraggingMascot && e.touches.length > 0) {
        const t = e.touches[0];
        moveMascotDrag(t.clientX, t.clientY);
        if (hasDraggedMascot && e.cancelable) e.preventDefault();
      }
    },
    { passive: false },
  );

  window.addEventListener("mouseup", () => {
    endMascotDrag();
  });

  window.addEventListener("touchend", () => {
    endMascotDrag();
  });

  // Toggle Mascot menu on Click - STRICTLY blocked if user was dragging/swiping
  img.addEventListener("click", async (e) => {
    if (hasDraggedMascot || Date.now() - lastDragEndTime < 350) {
      hasDraggedMascot = false;
      return;
    }

    const data = await chrome.storage.local.get(["snoozed_until"]);
    if (data.snoozed_until && Date.now() < data.snoozed_until) {
      // Show wake up confirmation
      const minsLeft = Math.ceil((data.snoozed_until - Date.now()) / 60000);
      openBubble(`
        <div class="bubble-header">
          <div class="bubble-header-title">Đánh thức Mát Cha? 🍵</div>
          <div class="bubble-header-actions">
            <span class="close-btn" id="close-bubble" title="Đóng">×</span>
          </div>
        </div>
        <div style="font-size:0.95rem; text-align:center; padding:10px 6px;">
          Tớ đang ngủ tạm (còn ${minsLeft} phút nữa). Cậu muốn đánh thức tớ dậy học cùng ngay không?
        </div>
        <button class="btn btn-yes" id="btn-wake-up" style="width:100%; margin-top:6px;">Đánh thức dậy ☀️</button>
      `);
      const closeBtn = shadow.querySelector("#close-bubble");
      if (closeBtn) closeBtn.addEventListener("click", closeBubble);
      const wakeBtn = shadow.querySelector("#btn-wake-up");
      if (wakeBtn) {
        wakeBtn.addEventListener("click", () => {
          restoreMascotFromSnooze();
          closeBubble();
        });
      }
      return;
    }

    if (isAngryRunning) {
      flashLockoutBox();
    } else {
      toggleMascotMenu();
    }
  });

  // Dynamic Bubble Width & Font Scaling
  let currentBubbleWidth = 310;
  chrome.storage.local.get(["bubble_width"], (res) => {
    if (res && res.bubble_width && typeof res.bubble_width === "number") {
      currentBubbleWidth = Math.max(240, Math.min(640, res.bubble_width));
      applyBubbleSize();
    }
  });

  function applyBubbleSize() {
    bubble.style.width = `${currentBubbleWidth}px`;
    const scaleRatio = currentBubbleWidth / 310;
    bubble.style.fontSize = `${Math.max(0.85, Math.min(1.35, 0.95 * scaleRatio))}rem`;
  }

  function closeBubble() {
    bubble.style.display = "none";
    bubble.innerHTML = "";
  }

  // Smart bubble positioning so mascot sprite is NEVER covered and bubble stays inside viewport
  function adjustBubblePosition() {
    const wrapRect = wrapper.getBoundingClientRect();
    const bw = currentBubbleWidth;
    const petH = 80;

    // Vertical placement: if close to top edge, show below pet; otherwise show above pet
    if (wrapRect.top < 360) {
      bubble.style.bottom = "auto";
      bubble.style.top = `${petH + 8}px`;
    } else {
      bubble.style.top = "auto";
      bubble.style.bottom = `${petH + 8}px`;
    }

    // Horizontal placement: align to avoid overflowing viewport left or right
    if (wrapRect.left < bw - 80) {
      bubble.style.right = "auto";
      bubble.style.left = "0px";
    } else {
      bubble.style.left = "auto";
      bubble.style.right = "0px";
    }
  }

  function openBubble(html) {
    bubble.innerHTML = html;

    // 1. Add Desktop-like Window Resize Handles (SE corner, SW corner, Right edge, Left edge)
    const handleSE = document.createElement("div");
    handleSE.className = "bubble-resize-handle bubble-resize-se";
    handleSE.title = "Kéo góc để chỉnh kích cỡ bảng";
    bubble.appendChild(handleSE);

    const handleSW = document.createElement("div");
    handleSW.className = "bubble-resize-handle bubble-resize-sw";
    handleSW.title = "Kéo góc để chỉnh kích cỡ bảng";
    bubble.appendChild(handleSW);

    const handleE = document.createElement("div");
    handleE.className = "bubble-resize-handle bubble-resize-e";
    bubble.appendChild(handleE);

    const handleW = document.createElement("div");
    handleW.className = "bubble-resize-handle bubble-resize-w";
    bubble.appendChild(handleW);

    function initResizeListener(element, direction) {
      let isResizing = false;
      let startX = 0;
      let initWidth = currentBubbleWidth;

      const onMove = (moveEv) => {
        if (!isResizing) return;
        const currentX =
          moveEv.clientX || (moveEv.touches && moveEv.touches[0].clientX);
        if (currentX === undefined) return;
        const deltaX = currentX - startX;
        let change = 0;
        if (direction === "se" || direction === "e") {
          const isRightAligned = bubble.style.left === "auto";
          change = isRightAligned ? -deltaX : deltaX;
        } else {
          // 'sw' or 'w'
          const isRightAligned = bubble.style.left === "auto";
          change = isRightAligned ? deltaX : -deltaX;
        }
        const newWidth = Math.round(
          Math.max(240, Math.min(640, initWidth + change)),
        );
        currentBubbleWidth = newWidth;
        applyBubbleSize();
      };

      const onEnd = () => {
        if (!isResizing) return;
        isResizing = false;
        document.body.style.cursor = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onEnd);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onEnd);
        chrome.storage.local.set({ bubble_width: currentBubbleWidth });
      };

      const onStart = (startEv) => {
        startEv.stopPropagation();
        startEv.preventDefault();
        isResizing = true;
        startX =
          startEv.clientX || (startEv.touches && startEv.touches[0].clientX);
        initWidth = currentBubbleWidth;
        document.body.style.cursor =
          direction === "se"
            ? "nwse-resize"
            : direction === "sw"
              ? "nesw-resize"
              : "ew-resize";
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onEnd);
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("touchend", onEnd);
      };

      element.addEventListener("mousedown", onStart);
      element.addEventListener("touchstart", onStart, { passive: false });
    }

    initResizeListener(handleSE, "se");
    initResizeListener(handleSW, "sw");
    initResizeListener(handleE, "e");
    initResizeListener(handleW, "w");

    // 2. Enable Window Dragging via Bubble Header (just like dragging a tab or app window!)
    const header = bubble.querySelector(".bubble-header");
    if (header) {
      header.title = "Kéo tiêu đề để di chuyển cửa sổ";
      let isHeaderDragging = false;
      let headOffsetX = 0;
      let headOffsetY = 0;

      const onHeaderMove = (moveEv) => {
        if (!isHeaderDragging) return;
        const cx =
          moveEv.clientX || (moveEv.touches && moveEv.touches[0].clientX);
        const cy =
          moveEv.clientY || (moveEv.touches && moveEv.touches[0].clientY);
        if (cx === undefined || cy === undefined) return;

        let newLeft = cx - headOffsetX;
        let newTop = cy - headOffsetY;

        const minLeft = 5;
        const maxLeft = Math.max(minLeft, window.innerWidth - 85);
        const minTop = 5;
        const maxTop = Math.max(minTop, window.innerHeight - 85);

        newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
        newTop = Math.max(minTop, Math.min(newTop, maxTop));

        wrapper.style.left = `${newLeft}px`;
        wrapper.style.top = `${newTop}px`;
      };

      const onHeaderEnd = () => {
        if (!isHeaderDragging) return;
        isHeaderDragging = false;
        document.body.style.cursor = "";
        window.removeEventListener("mousemove", onHeaderMove);
        window.removeEventListener("mouseup", onHeaderEnd);
        window.removeEventListener("touchmove", onHeaderMove);
        window.removeEventListener("touchend", onHeaderEnd);

        const rect = wrapper.getBoundingClientRect();
        chrome.storage.local.set({
          pet_pos_x: Math.round(rect.left),
          pet_pos_y: Math.round(rect.top),
        });
      };

      const onHeaderStart = (startEv) => {
        // Do not drag if user clicked buttons or actions inside header
        if (
          startEv.target.closest(".bubble-header-actions") ||
          startEv.target.classList.contains("close-btn")
        ) {
          return;
        }
        startEv.stopPropagation();
        isHeaderDragging = true;
        document.body.style.cursor = "grabbing";
        const cx =
          startEv.clientX || (startEv.touches && startEv.touches[0].clientX);
        const cy =
          startEv.clientY || (startEv.touches && startEv.touches[0].clientY);
        const rect = wrapper.getBoundingClientRect();
        headOffsetX = cx - rect.left;
        headOffsetY = cy - rect.top;

        wrapper.style.right = "auto";
        wrapper.style.bottom = "auto";
        wrapper.style.left = `${rect.left}px`;
        wrapper.style.top = `${rect.top}px`;

        window.addEventListener("mousemove", onHeaderMove);
        window.addEventListener("mouseup", onHeaderEnd);
        window.addEventListener("touchmove", onHeaderMove, { passive: false });
        window.addEventListener("touchend", onHeaderEnd);
      };

      header.addEventListener("mousedown", onHeaderStart);
      header.addEventListener("touchstart", onHeaderStart, { passive: true });
    }

    bubble.style.display = "flex";
    applyBubbleSize();
    adjustBubblePosition();

    // Stop page events from intercepting bubble interaction
    bubble.addEventListener("click", (e) => e.stopPropagation());
    bubble.addEventListener("keydown", (e) => e.stopPropagation());
    bubble.addEventListener("keyup", (e) => e.stopPropagation());
    bubble.addEventListener("mousedown", (e) => e.stopPropagation());
    bubble.addEventListener("pointerdown", (e) => e.stopPropagation());
    bubble.addEventListener("wheel", (e) => e.stopPropagation(), {
      passive: true,
    });

    // Auto-focus first input or textarea inside the bubble
    setTimeout(() => {
      const input =
        shadow.querySelector(".quiz-input") ||
        shadow.querySelector("input") ||
        shadow.querySelector("textarea");
      if (input) {
        input.focus();
        input.click();
      }
    }, 80);
  }

  async function toggleMascotMenu() {
    if (bubble.style.display === "flex") {
      closeBubble();
      return;
    }

    let data = await chrome.storage.local.get(["jwt_token"]);
    if (!data.jwt_token) {
      // 1. Try local page recovery
      let recoveredToken = null;
      try {
        recoveredToken = localStorage.getItem("oasis_token");
      } catch (e) {}

      // 2. If not found, ask background service worker to check other open tabs
      if (!recoveredToken) {
        const bgRes = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: "recover_token_from_tabs" },
            resolve,
          );
        }).catch(() => null);
        if (bgRes && bgRes.token) {
          recoveredToken = bgRes.token;
        }
      }

      if (recoveredToken) {
        data.jwt_token = recoveredToken;
        await chrome.storage.local.set({ jwt_token: recoveredToken });
        chrome.runtime.sendMessage({
          action: "sync_vocab",
          token: recoveredToken,
        });
      } else {
        showExtensionLoginForm();
        return;
      }
    }

    // Vertical 1-column layout with clean header, icons, and top-right close button
    const menuHtml = `
      <div class="bubble-header">
        <div class="bubble-header-title">Mát Cha AI Eo 🍵</div>
        <div class="bubble-header-actions">
          <span class="close-btn" id="close-bubble" title="Đóng">×</span>
        </div>
      </div>
      <div style="font-weight: bold; margin: 2px 0 6px; font-size: 0.95rem; text-align: center; color: #43281C;">Tớ có thể giúp gì cho cậu?</div>
      <div class="menu-vertical-list">
        <button class="menu-item-btn" id="btn-sidepanel"><span class="menu-icon">💬</span> Chat AI</button>
        <button class="menu-item-btn" id="btn-ocr" style="background: #F1F8E9; border-color: #81C784;"><span class="menu-icon">📸</span> Quét OCR</button>
        <button class="menu-item-btn" id="btn-add-vocab-ui" style="background: #E3F2FD; border-color: #64B5F6;"><span class="menu-icon">➕</span> Thêm từ vựng</button>
        <button class="menu-item-btn" id="btn-view-vocab" style="background: #FFF3E0; border-color: #FFB74D;"><span class="menu-icon">📚</span> Tủ từ vựng</button>
        <button class="menu-item-btn" id="btn-grammar-quiz" style="background: #FCE4EC; border-color: #F48FB1;"><span class="menu-icon">🧩</span> Quiz Ngữ pháp</button>
        <button class="menu-item-btn" id="btn-vocab-quiz" style="background: #FFF9E6; border-color: #A7D08C;"><span class="menu-icon">📝</span> Ôn từ vựng</button>
        <button class="menu-item-btn" id="btn-view-schedule" style="background: #F3E5F5; border-color: #BA68C8;"><span class="menu-icon">📅</span> Lịch học</button>
        <button class="menu-item-btn" id="btn-snooze-pet" style="background: #EFEBE9; border-color: #BCAAA4;"><span class="menu-icon">💤</span> Ẩn pet 30 phút</button>
      </div>
    `;
    openBubble(menuHtml);
    startAnimation("alert");

    // Hook Menu Events
    const closeBtn = shadow.querySelector("#close-bubble");
    if (closeBtn) closeBtn.addEventListener("click", closeBubble);

    shadow.querySelector("#btn-sidepanel").addEventListener("click", () => {
      closeBubble();
      chrome.runtime.sendMessage({ action: "open_sidepanel" });
    });

    shadow.querySelector("#btn-ocr").addEventListener("click", () => {
      closeBubble();
      if (window.startMatchaOCR) {
        window.startMatchaOCR(handleOCRWordDetected);
      }
    });

    shadow
      .querySelector("#btn-add-vocab-ui")
      .addEventListener("click", showQuickAddForm);

    shadow
      .querySelector("#btn-view-vocab")
      .addEventListener("click", showVocabListUI);

    shadow
      .querySelector("#btn-grammar-quiz")
      .addEventListener("click", showGrammarQuizUI);

    shadow
      .querySelector("#btn-vocab-quiz")
      .addEventListener("click", async () => {
        showVocabReminder(false);
      });

    shadow
      .querySelector("#btn-view-schedule")
      .addEventListener("click", showStudyScheduleUI);

    shadow
      .querySelector("#btn-snooze-pet")
      .addEventListener("click", async () => {
        const snoozedUntil = Date.now() + 30 * 60 * 1000;
        await chrome.storage.local.set({ snoozed_until: snoozedUntil });
        applySnoozeState(snoozedUntil);
      });
  }

  function showExtensionLoginForm(errorMessage = "") {
    const loginHtml = `
      <div class="bubble-header">
        <div class="bubble-header-title">Kết nối tài khoản 🔑</div>
        <div class="bubble-header-actions">
          <span class="close-btn" id="close-bubble" title="Đóng">×</span>
        </div>
      </div>
      <div style="font-weight: bold; margin: 4px 0; font-size: 0.8rem; text-align: center; color: #D84315;">
        Cậu cần kết nối tài khoản để sử dụng tiện ích Mát Cha AI Eo!
      </div>
      ${errorMessage ? `<div style="color:#C62828; font-size:0.75rem; text-align:center; margin-bottom:6px; font-weight:bold;">${errorMessage}</div>` : ""}
      <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
        <input type="text" id="login-username" class="quiz-input" placeholder="Tên đăng nhập" style="padding: 8px; font-size: 0.8rem;" required />
        <input type="password" id="login-password" class="quiz-input" placeholder="Mật khẩu" style="padding: 8px; font-size: 0.8rem;" required />
        <button class="btn btn-yes" id="btn-submit-login" style="margin-top:4px; padding:9px; font-size:0.85rem; font-weight:bold; cursor: pointer;">Đăng nhập ➔</button>
        <div style="display:flex; align-items:center; gap:6px; margin: 4px 0;">
          <div style="flex:1; height:1px; background:#e0e0e0;"></div>
          <span style="font-size:0.7rem; color:#9e9e9e;">HOẶC</span>
          <div style="flex:1; height:1px; background:#e0e0e0;"></div>
        </div>
        <button class="btn btn-yes" id="btn-oauth-login" style="padding:8px; font-size:0.8rem; font-weight:bold; background:#5865F2; border-color:#4752C4; color:#fff; cursor:pointer;">
          👾 Đăng nhập Discord OAuth2
        </button>
        <div style="font-size:0.72rem; text-align:center; color:#795548; margin-top:4px;">
          Chưa có tài khoản? Hãy đăng ký tại <a href="https://ieltsoasis.site" target="_blank" style="color:#3b7a13; font-weight:bold; text-decoration:none;">ieltsoasis.site</a>
        </div>
      </div>
    `;
    openBubble(loginHtml);
    startAnimation("alert");

    shadow
      .querySelector("#close-bubble")
      .addEventListener("click", closeBubble);

    const oauthBtn = shadow.querySelector("#btn-oauth-login");
    if (oauthBtn) {
      oauthBtn.addEventListener("click", async () => {
        try {
          oauthBtn.textContent = "Đang mở Discord...";
          oauthBtn.disabled = true;
          const serverUrl = await getServerUrl();
          const redirectUri = encodeURIComponent(serverUrl + "/auth/callback");
          const resp = await fetch(
            `${serverUrl}/api/auth/discord/login?redirect_uri=${redirectUri}`,
          );
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.url) {
              window.open(data.url, "_blank");
              return;
            }
          }
          // Fallback
          window.open(`${serverUrl}/auth/callback`, "_blank");
        } catch (err) {
          console.error("OAuth error:", err);
          const serverUrl = await getServerUrl();
          window.open(serverUrl, "_blank");
        } finally {
          oauthBtn.textContent = "👾 Đăng nhập Discord OAuth2";
          oauthBtn.disabled = false;
        }
      });
    }

    const submitBtn = shadow.querySelector("#btn-submit-login");
    submitBtn.addEventListener("click", async () => {
      const usernameInput = shadow
        .querySelector("#login-username")
        .value.trim();
      const passwordInput = shadow
        .querySelector("#login-password")
        .value.trim();

      if (!usernameInput || !passwordInput) {
        showExtensionLoginForm("Vui lòng điền đầy đủ thông tin!");
        return;
      }

      submitBtn.textContent = "Đang kết nối...";
      submitBtn.disabled = true;

      try {
        const serverUrl = await getServerUrl();
        const response = await fetch(`${serverUrl}/api/auth/extension-login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: usernameInput,
            password: passwordInput,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.token) {
            await chrome.storage.local.set({ jwt_token: result.token });
            chrome.runtime.sendMessage({
              action: "save_jwt_token",
              token: result.token,
            });
            toggleMascotMenu();
          } else {
            showExtensionLoginForm(
              "Đăng nhập thất bại. Không nhận được token.",
            );
          }
        } else {
          const errData = await response.json();
          showExtensionLoginForm(
            errData.detail || "Tên đăng nhập hoặc mật khẩu không đúng!",
          );
        }
      } catch (err) {
        console.error(err);
        showExtensionLoginForm("Lỗi kết nối máy chủ. Vui lòng thử lại!");
      }
    });
  }

  // Quick Manual Add Word UI
  function showQuickAddForm() {
    const formHtml = `
      <div class="bubble-header">
        <div class="bubble-header-title">Thêm nhanh từ mới ➕</div>
        <div class="bubble-header-actions">
          <span class="close-btn" id="close-bubble" title="Đóng">×</span>
        </div>
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

    shadow
      .querySelector("#close-bubble")
      .addEventListener("click", closeBubble);

    const wordInput = shadow.querySelector("#add-word");
    const meaningInput = shadow.querySelector("#add-meaning");
    const phoneticInput = shadow.querySelector("#add-phonetic");
    const autofillBtn = shadow.querySelector("#btn-ai-autofill");

    let autoData = {};

    autofillBtn.addEventListener("click", async () => {
      const word = wordInput.value.trim();
      if (!word) {
        alert("Vui lòng nhập từ tiếng Anh trước!");
        return;
      }
      autofillBtn.textContent = "Đang tra cứu AI...";
      autofillBtn.setAttribute("disabled", "true");
      try {
        const serverUrl = await getServerUrl();
        // Use full=1 flag to request complete vocab card data
        const response = await fetch(`${serverUrl}/api/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: word, full: true }),
        });
        if (response.ok) {
          const result = await response.json();
          autoData = result;
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
            const exampleInput = shadow.querySelector("#add-example");
            if (exampleInput && !exampleInput.value) {
              exampleInput.value = result.example;
            }
          }
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi kết nối. Vui lòng nhập thủ công!");
      } finally {
        autofillBtn.textContent = "🤖 Tự động dịch (AI)";
        autofillBtn.removeAttribute("disabled");
      }
    });

    shadow
      .querySelector("#btn-submit-quick-add")
      .addEventListener("click", async () => {
        const word = wordInput.value.trim();
        const phonetic = phoneticInput.value.trim();
        const meaning = meaningInput.value.trim();
        const example = shadow.querySelector("#add-example").value.trim();
        const isGlobal = shadow.querySelector("#add-global").checked;

        if (!word) {
          alert("Vui lòng điền Từ tiếng Anh!");
          return;
        }

        const data = await chrome.storage.local.get(["jwt_token"]);
        if (!data.jwt_token) {
          alert("Vui lòng kết nối tài khoản ở popup tiện ích trước nhé!");
          return;
        }

        try {
          const serverUrl = await getServerUrl();
          const res = await fetch(`${serverUrl}/api/vocabulary`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.jwt_token}`,
            },
            body: JSON.stringify({
              word,
              meaning: meaning || autoData.meaning || "Đang dịch tự động...",
              phonetic: phonetic || autoData.phonetic || "/.../",
              example: example || autoData.example || "",
              synonyms: autoData.synonyms || [],
              memory_hook: autoData.memory_hook || "",
              is_global: isGlobal,
              topic: autoData.topic || "General",
              source: "Mascot Quick Add",
            }),
          });
          if (res.ok) {
            alert(`Đã lưu thành công từ "${word}" vào Tủ Từ! 🍵`);
            closeBubble();
            // Trigger a sync refresh
            chrome.runtime.sendMessage({
              action: "save_jwt_token",
              token: data.jwt_token,
            });
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
    let tokenData = await chrome.storage.local.get(["jwt_token", "user_vocab"]);
    let list = tokenData.user_vocab || [];
    let token = tokenData.jwt_token;

    if (!token) {
      try {
        token = localStorage.getItem("oasis_token");
      } catch (e) {}
    }

    // If list is empty but we have an active token or can recover one, show loading and fetch directly!
    if (list.length === 0) {
      if (!token) {
        const bgRes = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: "recover_token_from_tabs" },
            resolve,
          );
        }).catch(() => null);
        if (bgRes && bgRes.token) {
          token = bgRes.token;
          await chrome.storage.local.set({ jwt_token: token });
        }
      }

      if (token) {
        const loadingHtml = `
          <div class="bubble-header">
            <div class="bubble-header-title">Tủ từ của tớ 📚</div>
            <div class="bubble-header-actions">
              <span class="close-btn" id="close-bubble" title="Đóng">×</span>
            </div>
          </div>
          <div style="font-size:0.92rem; text-align:center; padding:24px 12px; color:#2E7D32; display:flex; flex-direction:column; align-items:center; gap:8px;">
            <div style="font-size:2rem; animation:spin 1s linear infinite;">⏳</div>
            <div style="font-weight:bold;">Đang đồng bộ kho từ vựng từ IELTS Oasis...</div>
            <div style="font-size:0.75rem; color:#8D6E63;">Đợi Mát Cha một chút nhé 🍵</div>
          </div>
          <button class="btn btn-yes" id="btn-back-menu" style="width:100%; margin-top:8px; padding:10px; font-size:0.95rem;">Quay lại</button>
        `;
        openBubble(loadingHtml);
        shadow
          .querySelector("#close-bubble")
          ?.addEventListener("click", closeBubble);
        shadow
          .querySelector("#btn-back-menu")
          ?.addEventListener("click", toggleMascotMenu);

        const syncResult = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: "sync_vocab", token: token },
            resolve,
          );
        }).catch(() => null);

        const freshData = await chrome.storage.local.get(["user_vocab"]);
        list =
          freshData.user_vocab ||
          (syncResult && syncResult.vocab ? syncResult.vocab : []);
      }
    } else if (token) {
      // Background sync to ensure freshness
      chrome.runtime.sendMessage({ action: "sync_vocab", token: token });
    }

    let listHtml = "";
    if (list.length === 0) {
      listHtml =
        '<div style="font-size:0.95rem; text-align:center; padding:16px; color:#5D4037;">Kho từ trống. Hãy thêm từ vựng mới trên web nhé! 🍵</div>';
    } else {
      listHtml = `<div class="matcha-scroll-list" id="vocab-scroll-list">`;
      list.forEach((v, idx) => {
        listHtml += `
          <div class="list-item vocab-clickable" data-idx="${idx}" style="cursor:pointer; transition:background 0.15s; padding: 10px 12px; position:relative;">
            <div style="font-weight:bold; color:#2E7D32; font-size:1.05rem; display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span>${v.word}</span>
                <button class="btn-item-audio" data-word="${v.word}" title="Phát âm từ vựng" style="background:none; border:none; cursor:pointer; font-size:1.1rem; padding:0 3px; line-height:1; color:#2E7D32; display:flex; align-items:center;">🔊</button>
              </div>
              <span style="font-weight:normal; color:#8D6E63; font-size:0.85rem;">${v.phonetic || ""}</span>
            </div>
            <div style="color:#43281C; font-size:0.92rem; margin-top:2px; line-height:1.35;">${v.meaning ? v.meaning.slice(0, 80) + (v.meaning.length > 80 ? "..." : "") : ""}</div>
          </div>
        `;
      });
      listHtml += `</div>`;
    }

    const listHtmlContent = `
      <div class="bubble-header">
        <div class="bubble-header-title">Tủ từ của tớ (${list.length}) 📚</div>
        <div class="bubble-header-actions">
          <span class="close-btn" id="close-bubble" title="Đóng">×</span>
        </div>
      </div>
      <div style="font-size:0.85rem; color:#8D6E63; text-align:center; margin-bottom:4px;">Bấm 🔊 để nghe phát âm, hoặc bấm vào từ xem chi tiết 👇</div>
      ${listHtml}
      <button class="btn btn-yes" id="btn-back-menu" style="width:100%; margin-top:8px; padding:10px; font-size:0.95rem;">Quay lại</button>
    `;
    openBubble(listHtmlContent);

    shadow
      .querySelector("#close-bubble")
      .addEventListener("click", closeBubble);
    shadow
      .querySelector("#btn-back-menu")
      .addEventListener("click", toggleMascotMenu);

    // Audio pronounce button inside list
    shadow.querySelectorAll(".btn-item-audio").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // prevent opening detail popup
        const word = btn.getAttribute("data-word");
        if (word) {
          const utterance = new SpeechSynthesisUtterance(word);
          utterance.lang = "en-US";
          window.speechSynthesis.speak(utterance);
        }
      });
    });

    // Attach click handlers to each word item
    shadow.querySelectorAll(".vocab-clickable").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        el.style.background = "#E8F5E9";
      });
      el.addEventListener("mouseleave", () => {
        el.style.background = "";
      });
      el.addEventListener("click", () => {
        const idx = parseInt(el.getAttribute("data-idx"));
        showVocabDetailPopup(list[idx]);
      });
    });
  }

  // Show detail card for a single vocabulary word
  async function showVocabDetailPopup(v) {
    // Fetch extra AI tips if memory_hook is missing
    let memoryHook = v.memory_hook || "";
    if (!memoryHook && v.word) {
      try {
        const serverUrl = await getServerUrl();
        const resp = await fetch(`${serverUrl}/api/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: v.word, full: true }),
        });
        if (resp.ok) {
          const r = await resp.json();
          memoryHook = r.memory_hook || "";
          // We can also opportunistically update other missing fields
          if (!v.phonetic && r.phonetic) v.phonetic = r.phonetic;
          if (!v.example && r.example) v.example = r.example;
        }
      } catch (e) {
        /* ignore */
      }
    }

    const masteryStars = "⭐".repeat(Math.min(v.mastery_level || 1, 5));
    const detailHtml = `
      <div class="bubble-header">
        <span>Chi tiết từ vựng 📖</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; font-size:0.95rem;">
        <div style="text-align:center;">
          <div style="display:inline-flex; align-items:center; justify-content:center; gap:8px;">
            <span style="font-size:1.45rem; font-weight:bold; color:#2E7D32;">${v.word}</span>
            <button id="btn-detail-speak" title="Phát âm từ này" style="background:none; border:none; cursor:pointer; font-size:1.3rem; padding:2px; line-height:1; display:flex; align-items:center;">🔊</button>
          </div>
          <div style="color:#8D6E63; font-size:0.95rem; margin-top:2px;">${v.phonetic || ""}</div>
          <div style="color:#F57F17; font-size:0.85rem; margin-top:4px;">Độ thuần thục: ${masteryStars}</div>
        </div>
        <div style="background:#F1F8E9; border-left:4px solid #A7D08C; padding:8px 12px; border-radius:8px;">
          <div style="font-weight:bold; color:#43281C; font-size:0.85rem; margin-bottom:3px;">📝 Nghĩa:</div>
          <div style="color:#2E7D32; font-size:1rem; font-weight:500;">${v.meaning || "Chưa có nghĩa"}</div>
        </div>
        ${
          v.example
            ? `
        <div style="background:#FFF9E6; border-left:4px solid #FFD54F; padding:8px 12px; border-radius:8px;">
          <div style="font-weight:bold; color:#43281C; font-size:0.85rem; margin-bottom:3px;">💬 Ví dụ:</div>
          <div style="color:#5D4037; font-style:italic; font-size:0.92rem; line-height:1.4;">"${v.example}"</div>
        </div>`
            : ""
        }
        ${
          v.synonyms && v.synonyms.length > 0
            ? `
        <div style="background:#E0F2F1; border-left:4px solid #4DB6AC; padding:8px 12px; border-radius:8px;">
          <div style="font-weight:bold; color:#43281C; font-size:0.85rem; margin-bottom:4px;">🔄 Từ đồng nghĩa:</div>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${v.synonyms.map((syn) => `<span style="background:#FFFFFF; border:1px solid #B2DFDB; color:#00695C; font-size:0.8rem; padding:2px 8px; border-radius:12px; font-weight:500;">${syn}</span>`).join("")}
          </div>
        </div>`
            : ""
        }
        ${
          memoryHook
            ? `
        <div style="background:#F3E5F5; border-left:4px solid #CE93D8; padding:8px 12px; border-radius:8px;">
          <div style="font-weight:bold; color:#43281C; font-size:0.85rem; margin-bottom:3px;">🧠 Mẹo nhớ:</div>
          <div style="color:#6A1B9A; font-size:0.92rem; line-height:1.4;">${memoryHook}</div>
        </div>`
            : '<div style="color:#8D6E63; font-size:0.85rem; text-align:center;">Đang tải mẹo nhớ...</div>'
        }
      </div>
      <button class="btn btn-yes" id="btn-back-list" style="width:100%; margin-top:8px; padding:10px; font-size:0.95rem;">← Quay lại danh sách</button>
    `;
    openBubble(detailHtml);

    shadow
      .querySelector("#close-bubble")
      .addEventListener("click", closeBubble);
    shadow
      .querySelector("#btn-back-list")
      .addEventListener("click", showVocabListUI);

    const speakBtn = shadow.querySelector("#btn-detail-speak");
    if (speakBtn) {
      speakBtn.addEventListener("click", () => {
        const utterance = new SpeechSynthesisUtterance(v.word);
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
      });
    }
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
    shadow
      .querySelector("#close-bubble")
      .addEventListener("click", closeBubble);

    const data = await chrome.storage.local.get(["active_quiz_state"]);
    let savedState = data.active_quiz_state;
    if (
      savedState &&
      savedState.mode === "grammar" &&
      Date.now() - savedState.timestamp < 2 * 60 * 60 * 1000
    ) {
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
      shadow
        .querySelector("#close-bubble")
        .addEventListener("click", closeBubble);
      shadow.querySelector("#btn-resume-quiz").addEventListener("click", () => {
        startGrammarQuizSession(
          savedState.shuffledList,
          savedState.currentIdx,
          savedState.score,
        );
      });
      shadow
        .querySelector("#btn-restart-quiz")
        .addEventListener("click", () => {
          clearActiveQuizState();
          showGrammarQuizUI();
        });
      return;
    }

    try {
      const serverUrl = await getServerUrl();
      const resp = await fetch(`${serverUrl}/api/quiz/grammar`);
      if (!resp.ok) throw new Error("Server error");
      const result = await resp.json();
      const questions = result.questions || [];

      if (!questions.length) {
        openBubble(
          `<div class="bubble-header"><span>Quiz 📝</span><span class="close-btn" id="close-bubble">×</span></div><div style="text-align:center;padding:10px;font-size:0.82rem;">Không lấy được câu hỏi. Thử lại sau! 🍵</div>`,
        );
        shadow
          .querySelector("#close-bubble")
          .addEventListener("click", closeBubble);
        return;
      }

      startGrammarQuizSession(questions);
    } catch (err) {
      console.error(err);
      openBubble(
        `<div class="bubble-header"><span>Quiz 📝</span><span class="close-btn" id="close-bubble">×</span></div><div style="text-align:center;padding:10px;font-size:0.82rem;color:#C62828;">Lỗi kết nối máy chủ. Thử lại sau! 🍵</div>`,
      );
      shadow
        .querySelector("#close-bubble")
        .addEventListener("click", closeBubble);
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
            <div style="font-size:2rem; margin-bottom:8px;">${score >= questions.length * 0.7 ? "🎉" : score >= questions.length * 0.5 ? "😊" : "😢"}</div>
            <div style="font-weight:bold; color:#3b7a13; font-size:1.1rem;">${score}/${questions.length} câu đúng!</div>
            <div style="color:#8D6E63; margin-top:4px; font-size:0.78rem;">${score >= questions.length * 0.7 ? "Xuất sắc! Cậu học ngữ pháp rất vững! 🍵" : score >= questions.length * 0.5 ? "Khá tốt, tiếp tục cố gắng nhé!" : "Ôn luyện thêm một chút nữa nhé!"}</div>
          </div>
          <button class="btn btn-yes" id="btn-retry-quiz" style="width:100%; margin-top:6px;">Chơi lại 🔄</button>
          <button class="btn btn-no" id="btn-back-menu-quiz" style="width:100%; margin-top:4px;">Quay lại Menu</button>
        `);
        shadow
          .querySelector("#close-bubble")
          .addEventListener("click", closeBubble);
        shadow
          .querySelector("#btn-retry-quiz")
          .addEventListener("click", () => {
            startGrammarQuizSession(questions);
          });
        shadow
          .querySelector("#btn-back-menu-quiz")
          .addEventListener("click", toggleMascotMenu);
        if (score >= questions.length * 0.7) {
          startAnimation("celebrating");
          stopAngryRun();
        } else if (score < questions.length * 0.5) {
          setTimeout(() => {
            triggerTantrumLockout();
          }, 1500);
        } else {
          startAnimation("crying");
          stopAngryRun();
        }
        return;
      }

      // Save state
      saveActiveQuizState(questions, currentQ, score, "grammar");

      const q = questions[currentQ];
      const choices = q.options || q.choices || [];
      const correctAnswer = (q.correct_answer || q.answer || "").trim();
      const explanation = q.explanation || "";

      // Alternate mode: even index = ABCD Multiple Choice, odd index = Fill In The Blank
      const isBlankMode = currentQ % 2 === 1;

      const progressPct = Math.round((currentQ / questions.length) * 100);
      const progressBar = `
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#8D6E63; margin-bottom:4px; font-weight:600;">
            <span>Câu ${currentQ + 1}/${questions.length} (${isBlankMode ? "Điền từ" : "Trắc nghiệm"})</span>
            <span>Đúng: ${score}/${questions.length}</span>
          </div>
          <div style="background:#E8F5E9; border-radius:6px; height:8px; overflow:hidden;">
            <div style="width:${progressPct}%; background:#A7D08C; height:100%; border-radius:6px; transition:width 0.3s;"></div>
          </div>
        </div>
      `;

      let questionBodyHtml = "";
      if (!isBlankMode) {
        questionBodyHtml = `
          <div style="font-size:1.02rem; color:#43281C; margin-bottom:10px; line-height:1.5; font-weight:600;">
            ${q.question}
          </div>
          <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
            ${choices
              .map(
                (c, i) => `
              <button class="btn-choice" data-ans="${c}" data-correct="${c.trim().toLowerCase() === correctAnswer.toLowerCase()}" style="padding: 10px 14px; font-size: 0.95rem;">
                ${String.fromCharCode(65 + i)}. ${c}
              </button>
            `,
              )
              .join("")}
          </div>
        `;
      } else {
        questionBodyHtml = `
          <div style="font-size:1.02rem; color:#43281C; margin-bottom:10px; line-height:1.5; font-weight:600;">
            Điền từ còn thiếu vào chỗ trống:<br/>
            <strong style="color:#2E7D32; display:block; margin-top:6px; font-size:1.05rem;">${q.question}</strong>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px; width:100%;">
            <input type="text" id="grammar-blank-input" class="quiz-input" placeholder="Nhập từ cần điền..." autocomplete="off" style="padding: 10px 14px; font-size: 1rem;" />
            <button class="btn btn-yes" id="btn-submit-grammar-blank" style="padding:10px; font-size:0.95rem; font-weight:bold;">Kiểm tra đáp án ✓</button>
          </div>
        `;
      }

      const quizHtml = `
        <div class="bubble-header">
          <span>Quiz Ngữ Pháp 📝</span>
          <span class="close-btn" id="close-bubble">×</span>
        </div>
        ${progressBar}
        ${questionBodyHtml}
        <div id="qfeedback" class="quiz-feedback" style="margin-top:8px;"></div>
        <div id="qexplanation" style="display:none; margin-top:8px; padding:10px 12px; background:#F1F8E9; border:1px solid #C8E6C9; border-radius:10px; font-size:0.9rem; color:#2E7D32; line-height:1.45; text-align:left; max-height:140px; overflow-y:auto;"></div>
        <button class="btn btn-no" id="btn-skip-grammar" style="width:100%; margin-top:8px; font-size:0.85rem; padding:8px;">Bỏ qua câu này →</button>
      `;
      openBubble(quizHtml);

      shadow
        .querySelector("#close-bubble")
        .addEventListener("click", closeBubble);

      const skipBtn = shadow.querySelector("#btn-skip-grammar");
      skipBtn.addEventListener("click", () => {
        currentQ++;
        renderQuestion();
      });

      function handleFeedbackDisplay(isCorrect, chosenText) {
        const fb = shadow.querySelector("#qfeedback");
        const expBox = shadow.querySelector("#qexplanation");
        skipBtn.style.display = "none";

        if (isCorrect) {
          score++;
          fb.innerHTML =
            '<span style="color:#2E7D32; font-size:0.85rem;">✓ Chính xác! Rất giỏi 🍵</span>';
          startAnimation("celebrating");
        } else {
          fb.innerHTML = `<span style="color:#C62828; font-size:0.82rem;">✗ Chưa đúng! Đáp án chính xác: <b>${correctAnswer}</b></span>`;
          startAnimation("crying");
        }

        if (explanation) {
          expBox.style.display = "block";
          expBox.innerHTML = `<strong>💡 Giải thích chi tiết:</strong><br/>${explanation}`;
        }

        // Add explicit "Next Question" button so the user can read the explanation
        const nextBtn = document.createElement("button");
        nextBtn.className = "btn btn-yes";
        nextBtn.style.cssText =
          "width:100%; margin-top:8px; padding:8px; font-size:0.82rem; font-weight:bold; cursor:pointer;";
        nextBtn.textContent = "Câu tiếp theo ➔";
        nextBtn.addEventListener("click", () => {
          currentQ++;
          renderQuestion();
        });
        fb.parentElement.appendChild(nextBtn);
      }

      if (!isBlankMode) {
        shadow.querySelectorAll(".btn-choice").forEach((btn) => {
          btn.addEventListener("click", () => {
            shadow
              .querySelectorAll(".btn-choice")
              .forEach((b) => b.setAttribute("disabled", "true"));
            const isCorrect = btn.getAttribute("data-correct") === "true";
            if (isCorrect) {
              btn.style.background = "#E8F5E9";
              btn.style.borderColor = "#81C784";
            } else {
              btn.style.background = "#FFEBEE";
              btn.style.borderColor = "#E57373";
              // Highlight the right answer
              shadow.querySelectorAll(".btn-choice").forEach((b) => {
                if (b.getAttribute("data-correct") === "true") {
                  b.style.background = "#E8F5E9";
                  b.style.borderColor = "#81C784";
                }
              });
            }
            handleFeedbackDisplay(isCorrect, btn.getAttribute("data-ans"));
          });
        });
      } else {
        const blankInput = shadow.querySelector("#grammar-blank-input");
        const blankBtn = shadow.querySelector("#btn-submit-grammar-blank");

        const submitBlank = () => {
          const val = blankInput.value.trim();
          if (!val) return;
          blankInput.setAttribute("disabled", "true");
          blankBtn.setAttribute("disabled", "true");

          const norm = (s) =>
            (s || "")
              .toLowerCase()
              .replace(
                /\s*\((n|v|adj|adv|prep|conj|pron|phr|idiom|slang)\b[^)]*\)/gi,
                "",
              )
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
              .replace(/\s+/g, " ")
              .trim();

          const cleanVal = norm(val);
          const cleanCorrect = norm(correctAnswer);

          const isCorrect =
            val.toLowerCase() === correctAnswer.toLowerCase() ||
            cleanVal === cleanCorrect ||
            (cleanCorrect.length > 2 &&
              cleanVal === cleanCorrect.split(" ")[0]);

          if (isCorrect) {
            blankInput.style.borderColor = "#81C784";
            blankInput.style.background = "#E8F5E9";
          } else {
            blankInput.style.borderColor = "#E57373";
            blankInput.style.background = "#FFEBEE";
          }
          handleFeedbackDisplay(isCorrect, val);
        };

        blankBtn.addEventListener("click", submitBlank);
        blankInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submitBlank();
          }
        });
      }
    }

    renderQuestion();
  }

  // Show Synced Study Plan details
  async function showStudyScheduleUI() {
    const data = await chrome.storage.local.get([
      "study_schedule",
      "user_info",
    ]);
    const sched = data.study_schedule || {
      level: "General",
      topic: "N/A",
      study_focus: "Toàn diện",
    };
    const user = data.user_info || { username: "Học viên" };

    const schedHtml = `
      <div class="bubble-header">
        <span>Lịch học của tớ 📅</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:6px;">
        <div><b>Học viên:</b> ${user.username}</div>
        <div><b>Trình độ hiện tại:</b> ${sched.level || "General"}</div>
        <div><b>Chủ đề học mục tiêu:</b> ${sched.topic || "Chưa thiết lập"}</div>
        <div><b>Kỹ năng tập trung:</b> ${sched.study_focus || "Toàn diện"}</div>
      </div>
      <button class="btn btn-yes" id="btn-back-menu" style="width:100%; margin-top:6px;">Quay lại</button>
    `;
    openBubble(schedHtml);

    shadow
      .querySelector("#close-bubble")
      .addEventListener("click", closeBubble);
    shadow
      .querySelector("#btn-back-menu")
      .addEventListener("click", toggleMascotMenu);
  }

  // Reminders and Quiz triggers
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "show_reminder" && !isMainSite) {
      showVocabReminder(true);
    }
  });

  // Full Vocabulary Quiz Session — covers ALL words, no server needed
  async function showVocabReminder(isAutomatic = false) {
    if (reminderTimer) clearTimeout(reminderTimer);

    const data = await chrome.storage.local.get([
      "user_vocab",
      "active_quiz_state",
    ]);
    const list = data.user_vocab || [];

    const defaultList = [
      {
        word: "academic",
        meaning: "tính học thuật",
        phonetic: "/ˌæk.əˈdem.ɪk/",
        example: "She has high academic standards.",
      },
      {
        word: "dynamic",
        meaning: "năng động, biến đổi không ngừng",
        phonetic: "/daɪˈnæm.ɪk/",
        example: "A dynamic study environment.",
      },
      {
        word: "acquire",
        meaning: "gặt hái, thu nhận được",
        phonetic: "/əˈkwaɪər/",
        example: "To acquire language skills.",
      },
      {
        word: "diligent",
        meaning: "chăm chỉ, siêng năng",
        phonetic: "/ˈdɪl.ɪ.dʒənt/",
        example: "A diligent student passes tests.",
      },
      {
        word: "havoc",
        meaning: "tàn phá, hỗn loạn",
        phonetic: "/ˈhæv.ək/",
        example: "The storm wreaked havoc.",
      },
    ];

    const activeList = list.length >= 2 ? list : defaultList;

    let savedState = data.active_quiz_state;
    if (
      savedState &&
      savedState.mode === "vocab" &&
      Date.now() - savedState.timestamp < 2 * 60 * 60 * 1000
    ) {
      // Check if savedState words are still valid in current activeList
      const activeWordSet = new Set(
        activeList.map((item) => (item.word || "").toLowerCase()),
      );
      const hasStaleWord =
        savedState.shuffledList &&
        savedState.shuffledList.some(
          (item) => !activeWordSet.has((item.word || "").toLowerCase()),
        );

      if (hasStaleWord) {
        // Automatically purge stale quiz state
        await clearActiveQuizState();
        savedState = null;
      } else {
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
        shadow
          .querySelector("#close-bubble")
          .addEventListener("click", closeBubble);
        shadow
          .querySelector("#btn-resume-quiz")
          .addEventListener("click", () => {
            startVocabQuizSession(
              activeList,
              savedState.shuffledList,
              savedState.currentIdx,
              savedState.score,
            );
          });
        shadow
          .querySelector("#btn-restart-quiz")
          .addEventListener("click", () => {
            clearActiveQuizState();
            showVocabReminder(isAutomatic);
          });
        return;
      }
    }

    if (!isAutomatic) {
      startVocabQuizSession(activeList);
      return;
    }

    // Automatic reminder popup -> Show learning flashcard with 25s auto-dismiss
    const targetWord =
      activeList[Math.floor(Math.random() * activeList.length)];
    startAnimation("alert");

    const cardHtml = `
      <div class="bubble-header">
        <span>Gợi ý học từ vựng 💡</span>
        <span class="close-btn" id="close-bubble">×</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; font-size:0.82rem; color:#5D4037; font-family: 'Segoe UI', system-ui, sans-serif;">
        <div style="text-align:center; position:relative;">
          <div style="font-size:1.3rem; font-weight:bold; color:#3b7a13; display:inline-block; vertical-align:middle;">${targetWord.word}</div>
          <button id="btn-speak-word" style="background:none; border:none; cursor:pointer; font-size:1.1rem; vertical-align:middle; margin-left:6px; padding:2px;">🔊</button>
          <div style="color:#8D6E63; font-size:0.85rem;">${targetWord.phonetic || ""}</div>
        </div>
        <div style="background:#F1F8E9; border-left:3px solid #A7D08C; padding:6px 8px; border-radius:6px;">
          <div style="font-weight:bold; font-size:0.75rem; margin-bottom:2px;">📝 Nghĩa:</div>
          <div>${targetWord.meaning}</div>
        </div>
        ${
          targetWord.example
            ? `
        <div style="background:#FFF9E6; border-left:3px solid #FFD54F; padding:6px 8px; border-radius:6px;">
          <div style="font-weight:bold; font-size:0.75rem; margin-bottom:2px;">💬 Ví dụ:</div>
          <div style="font-style:italic;">"${targetWord.example}"</div>
        </div>`
            : ""
        }
        ${
          targetWord.memory_hook
            ? `
        <div style="background:#F3E5F5; border-left:3px solid #CE93D8; padding:6px 8px; border-radius:6px;">
          <div style="font-weight:bold; font-size:0.75rem; margin-bottom:2px;">🧠 Mẹo nhớ:</div>
          <div style="color:#6A1B9A; font-size:0.78rem;">${targetWord.memory_hook}</div>
        </div>`
            : ""
        }
        
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

    shadow.querySelector("#btn-speak-word").addEventListener("click", () => {
      const utterance = new SpeechSynthesisUtterance(targetWord.word);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    });

    shadow.querySelector("#close-bubble").addEventListener("click", () => {
      if (reminderTimer) clearTimeout(reminderTimer);
      consecutiveIgnored++;
      if (consecutiveIgnored >= 3) {
        triggerTantrumLockout();
      } else {
        closeBubble();
      }
    });

    shadow.querySelector("#btn-know-word").addEventListener("click", () => {
      if (reminderTimer) clearTimeout(reminderTimer);
      consecutiveIgnored = 0;
      closeBubble();
      startAnimation("celebrating");
      setTimeout(() => startAnimation("idle"), 2000);
    });

    shadow.querySelector("#btn-quiz-word").addEventListener("click", () => {
      if (reminderTimer) clearTimeout(reminderTimer);
      consecutiveIgnored = 0;
      startVocabQuizSession(activeList);
    });

    let timeLeft = 25;
    const progressEl = shadow.querySelector("#reminder-progress");
    const secondsEl = shadow.querySelector("#reminder-seconds");

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

  function startVocabQuizSession(
    activeList,
    shuffledList = null,
    startIdx = 0,
    initialScore = 0,
  ) {
    const shuffled =
      shuffledList || [...activeList].sort(() => Math.random() - 0.5);
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
      saveActiveQuizState(shuffled, currentIdx, score, "vocab");

      const targetWord = shuffled[currentIdx];
      const progress = `${currentIdx + 1}/${total}`;
      const pct = Math.round((currentIdx / total) * 100);

      // Alternate ABCD (even index) and Fill-in-blank (odd index)
      const quizMode = currentIdx % 2 === 0 ? "abcd" : "blank";

      // Generate distractors from the FULL list (not just 3)
      const pool = activeList.filter((item) => item.word !== targetWord.word);
      const distractors = pool.sort(() => Math.random() - 0.5).slice(0, 3);
      const choices = [targetWord, ...distractors].sort(
        () => Math.random() - 0.5,
      );

      const progressBar = `
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#8D6E63; margin-bottom:4px; font-weight:600;">
            <span>Câu ${progress}</span>
            <span>Đúng: ${score}/${total}</span>
          </div>
          <div style="background:#E8F5E9; border-radius:6px; height:8px; overflow:hidden;">
            <div style="width:${pct}%; background:#A7D08C; height:100%; border-radius:6px; transition:width 0.3s;"></div>
          </div>
        </div>
      `;

      let quizBodyHtml = "";
      if (quizMode === "abcd") {
        quizBodyHtml = `
          <div style="font-size:0.95rem; text-align:center; margin-bottom:6px; color:#5D4037;">
            Nghĩa tiếng Việt của:<br/>
            <strong style="font-size:1.35rem; color:#2E7D32; display:block; margin: 4px 0 2px;">${targetWord.word}</strong>
            <span style="font-size:0.9rem; color:#8D6E63; display:block;">${targetWord.phonetic || ""}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
            ${choices
              .map(
                (c, i) => `
              <button class="btn-choice" data-correct="${c.word === targetWord.word}" style="padding: 10px 14px; font-size: 0.95rem;">
                ${String.fromCharCode(65 + i)}. ${c.meaning}
              </button>
            `,
              )
              .join("")}
          </div>
          <div id="quiz-feedback" class="quiz-feedback"></div>
        `;
      } else {
        quizBodyHtml = `
          <div style="font-size:0.95rem; text-align:center; margin-bottom:6px; color:#5D4037;">
            Từ tiếng Anh nào có nghĩa là:<br/>
            <strong style="font-size:1.15rem; color:#2E7D32; display:block; margin-top:4px;">"${targetWord.meaning}"</strong>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px; width:100%;">
            <input type="text" id="blank-input" class="quiz-input" placeholder="Gõ từ tiếng Anh..." style="padding: 10px 14px; font-size: 1rem;" />
            <button class="btn btn-yes" id="btn-submit-blank" style="padding:10px; font-size:0.95rem; font-weight:bold;">Kiểm tra ✓</button>
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
        <button class="btn btn-no" id="btn-skip-word" style="width:100%; margin-top:8px; font-size:0.85rem; padding:8px;">Bỏ qua →</button>
      `;

      openBubble(fullHtml);

      shadow.querySelector("#close-bubble").addEventListener("click", () => {
        closeBubble();
      });

      // Skip button — go to next without penalty
      shadow.querySelector("#btn-skip-word").addEventListener("click", () => {
        currentIdx++;
        renderQuestion();
      });

      if (quizMode === "abcd") {
        shadow.querySelectorAll(".btn-choice").forEach((btn) => {
          btn.addEventListener("click", () => {
            const isCorrect = btn.getAttribute("data-correct") === "true";
            const feedback = shadow.querySelector("#quiz-feedback");
            shadow
              .querySelectorAll(".btn-choice")
              .forEach((b) => b.setAttribute("disabled", "true"));
            shadow
              .querySelector("#btn-skip-word")
              .setAttribute("disabled", "true");

            function showNextBtn() {
              shadow.querySelector("#btn-skip-word").style.display = "none";
              const nextBtn = document.createElement("button");
              nextBtn.className = "btn btn-yes";
              nextBtn.style.cssText =
                "width:100%; margin-top:8px; padding:10px; font-size:0.85rem; font-weight:bold;";
              nextBtn.textContent = "Câu tiếp theo ➔";
              nextBtn.addEventListener("click", () => {
                currentIdx++;
                renderQuestion();
              });
              shadow
                .querySelector("#btn-skip-word")
                .parentElement.appendChild(nextBtn);
            }

            if (isCorrect) {
              score++;
              sessionConsecutiveWrong = 0;
              consecutiveWrong = 0;
              btn.style.borderColor = "#81C784";
              btn.style.background = "#E8F5E9";
              feedback.innerHTML =
                '<span style="color:#2E7D32;">✓ Chính xác! 🍵</span>';
              startAnimation("celebrating");
            } else {
              sessionConsecutiveWrong++;
              consecutiveWrong++;
              btn.style.borderColor = "#E57373";
              btn.style.background = "#FFEBEE";
              // highlight correct answer
              shadow.querySelectorAll(".btn-choice").forEach((b) => {
                if (b.getAttribute("data-correct") === "true") {
                  b.style.borderColor = "#81C784";
                  b.style.background = "#E8F5E9";
                }
              });
              feedback.innerHTML = `<span style="color:#C62828;">✗ Đáp án đúng: "${targetWord.meaning}"</span>`;
              startAnimation("crying");
            }
            setTimeout(() => {
              showNextBtn();
            }, 1000);
          });
        });
      } else {
        // Fill-in-blank mode
        const submitBtn = shadow.querySelector("#btn-submit-blank");
        const inputEl = shadow.querySelector("#blank-input");

        const checkAnswer = () => {
          // Normalize function: strips (n), (v), (adj), (adv), (prep) and surrounding punctuation
          const normalizeWord = (str) => {
            return (str || "")
              .toLowerCase()
              .replace(
                /\s*\((n|v|adj|adv|prep|conj|pron|phr|idiom|slang)\b[^)]*\)/gi,
                "",
              ) // remove (n), (v), (adj)...
              .replace(/[\/\\()]/g, " ") // replace slashes and brackets with space
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~]/g, "") // remove punctuation
              .replace(/\s+/g, " ")
              .trim();
          };

          const rawUser = inputEl.value.trim().toLowerCase();
          const cleanUser = normalizeWord(inputEl.value);
          const rawCorrect = targetWord.word.trim().toLowerCase();
          const cleanCorrect = normalizeWord(targetWord.word);

          const feedback = shadow.querySelector("#quiz-feedback");
          inputEl.setAttribute("disabled", "true");
          submitBtn.setAttribute("disabled", "true");
          shadow
            .querySelector("#btn-skip-word")
            .setAttribute("disabled", "true");

          // Match exact clean word, raw word, or root token
          const isCorrect =
            cleanUser === cleanCorrect ||
            rawUser === rawCorrect ||
            (cleanCorrect.length > 2 &&
              cleanUser === cleanCorrect.split(" ")[0]) ||
            (cleanUser.length > 2 &&
              cleanCorrect.split(" ").includes(cleanUser));

          function showNextBtn() {
            shadow.querySelector("#btn-skip-word").style.display = "none";
            const nextBtn = document.createElement("button");
            nextBtn.className = "btn btn-yes";
            nextBtn.style.cssText =
              "width:100%; margin-top:8px; padding:10px; font-size:0.85rem; font-weight:bold;";
            nextBtn.textContent = "Câu tiếp theo ➔";
            nextBtn.addEventListener("click", () => {
              currentIdx++;
              renderQuestion();
            });
            shadow
              .querySelector("#btn-skip-word")
              .parentElement.appendChild(nextBtn);
          }

          if (isCorrect) {
            score++;
            sessionConsecutiveWrong = 0;
            consecutiveWrong = 0;
            feedback.innerHTML =
              '<span style="color:#2E7D32;">✓ Xuất sắc! Đúng rồi! 🍵</span>';
            startAnimation("celebrating");
          } else {
            sessionConsecutiveWrong++;
            consecutiveWrong++;
            feedback.innerHTML = `<span style="color:#C62828;">✗ Đáp án đúng: <b>${cleanCorrect || targetWord.word}</b></span>`;
            startAnimation("crying");
          }
          setTimeout(() => {
            showNextBtn();
          }, 1000);
        };

        submitBtn.addEventListener("click", checkAnswer);
        inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            checkAnswer();
          }
        });
      }
    }

    function showQuizResult() {
      const pct = Math.round((score / total) * 100);
      const emoji = pct >= 80 ? "🎉" : pct >= 60 ? "😊" : "😢";
      const msg =
        pct >= 80
          ? "Xuất sắc! Cậu thuộc hết rồi! 🍵"
          : pct >= 60
            ? "Khá tốt, tiếp tục ôn nhé!"
            : "Cần ôn thêm, đừng nản lòng!";

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
              <div style="width:${pct}%; background:${pct >= 80 ? "#66BB6A" : pct >= 60 ? "#FFA726" : "#EF5350"}; height:100%; border-radius:6px;"></div>
            </div>
            <div style="font-size:0.8rem; font-weight:bold; color:#3b7a13; margin-top:4px;">${pct}%</div>
          </div>
        </div>
        <button class="btn btn-yes" id="btn-retry-vocab" style="width:100%; margin-top:6px;">🔄 Học lại từ đầu</button>
        <button class="btn btn-no" id="btn-back-menu-quiz" style="width:100%; margin-top:4px;">Quay lại Menu</button>
      `);

      shadow
        .querySelector("#close-bubble")
        .addEventListener("click", closeBubble);
      shadow.querySelector("#btn-retry-vocab").addEventListener("click", () => {
        showVocabReminder();
      });
      shadow
        .querySelector("#btn-back-menu-quiz")
        .addEventListener("click", toggleMascotMenu);

      if (pct >= 80) {
        startAnimation("celebrating");
        stopAngryRun();
      } else if (pct < 50) {
        setTimeout(() => {
          triggerTantrumLockout();
        }, 1500);
      } else {
        startAnimation("idle");
        stopAngryRun();
      }
    }

    renderQuestion();
  }

  // Strict Lockout Blocker when user fails 3 consecutive times or neglects mascot
  function triggerTantrumLockout() {
    closeBubble();
    restoreMascotFromSnooze(); // Cancel snooze if tucked

    startAngryRun();

    // Hide original mascot wrapper so it does not wander, freeze, or lie behind the card
    wrapper.style.display = "none";

    const existingOverlay = shadow.querySelector(".lockout-overlay");
    if (existingOverlay) existingOverlay.remove();
    const existingCard = shadow.querySelector(".lockout-card");
    if (existingCard) existingCard.remove();

    const overlay = document.createElement("div");
    overlay.className = "lockout-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(167, 208, 140, 0.85);
      z-index: 2147483645;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      backdrop-filter: blur(5px);
    `;
    shadow.appendChild(overlay);

    const card = document.createElement("div");
    card.className = "lockout-card";
    card.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #FFFDF5;
      border: 3px solid #E57373;
      padding: 24px 28px 28px 28px;
      border-radius: 24px;
      width: 380px;
      max-width: 92vw;
      box-sizing: border-box;
      text-align: center;
      box-shadow: 0 16px 50px rgba(93, 64, 55, 0.35);
      font-family: 'Segoe UI', system-ui, sans-serif;
      z-index: 2147483649;
      pointer-events: auto;
      overflow: visible;
    `;
    card.innerHTML = `
      <div id="lockout-mascot-badge" style="margin-top: -68px; margin-bottom: 8px; display: flex; justify-content: center; position: relative; z-index: 2147483652;">
        <img id="lockout-mascot-img" 
             src="${animationFrames.tantrum[0]}" 
             alt="Mát Cha Dỗi" 
             class="lockout-mascot-tantrum"
             style="width: 96px; height: 96px; filter: drop-shadow(0 8px 16px rgba(93, 64, 55, 0.25)); cursor: pointer; user-select: none;" 
        />
      </div>
      <h2 style="color:#C62828; margin:0 0 8px 0; font-size:1.3rem;">MÁT CHA ĐANG DỖI! 😭</h2>
      <p style="font-size:0.86rem; color:#5D4037; line-height:1.45; margin:0 0 16px 0; font-weight:600;">
        Cậu học tập không nghiêm túc hoặc ngó lơ tớ rồi! Tớ khóa màn hình không cho cậu lướt web nữa. Hãy trả lời đúng câu dưới đây để dỗ tớ đi!
      </p>
      <div id="lockout-quiz-box" style="text-align:left; display:flex; flex-direction:column; gap:8px;"></div>
      <div id="lockout-feedback" style="margin-top:12px; font-weight:bold; font-size:0.85rem; text-align:center; min-height:20px;"></div>
    `;
    shadow.appendChild(card);

    setLockoutMascotAction("tantrum");

    const mascotImg = card.querySelector("#lockout-mascot-img");
    if (mascotImg) {
      mascotImg.addEventListener("click", () => {
        flashLockoutBox();
      });
    }

    generateLockoutQuiz(card);
  }

  async function generateLockoutQuiz(card, forceNew = false) {
    const data = await chrome.storage.local.get([
      "user_vocab",
      "lockout_quiz_state",
    ]);
    const list = data.user_vocab || [];
    const defaultList = [
      {
        word: "academic",
        meaning: "tính học thuật",
        phonetic: "/ˌæk.əˈdem.ɪk/",
        example: "She has high academic standards.",
      },
      {
        word: "dynamic",
        meaning: "năng động, biến đổi không ngừng",
        phonetic: "/daɪˈnæm.ɪk/",
        example: "A dynamic study environment.",
      },
      {
        word: "acquire",
        meaning: "gặt hái, thu nhận được",
        phonetic: "/əˈkwaɪər/",
        example: "To acquire language skills.",
      },
    ];
    const activeList = list.length >= 4 ? list : defaultList;

    let target = null;
    let choices = null;

    // Check if another tab already created a shared lockout quiz within the last 15 minutes
    const shared = data.lockout_quiz_state;
    const activeWordSet = new Set(
      activeList.map((item) => (item.word || "").toLowerCase()),
    );

    if (
      !forceNew &&
      shared &&
      Date.now() - shared.timestamp < 15 * 60 * 1000 &&
      activeWordSet.has((shared.target?.word || "").toLowerCase())
    ) {
      target = shared.target;
      choices = shared.choices;
    } else {
      target = activeList[Math.floor(Math.random() * activeList.length)];
      const incorrectPool = activeList.filter(
        (item) => item.word !== target.word,
      );
      const shuffledIncorrect = incorrectPool
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      choices = [target, ...shuffledIncorrect].sort(() => 0.5 - Math.random());

      // Persist shared lockout question so all browser tabs show the EXACT same question
      await chrome.storage.local.set({
        lockout_quiz_state: {
          target,
          choices,
          timestamp: Date.now(),
        },
      });
    }

    const quizBox = card.querySelector("#lockout-quiz-box");
    quizBox.innerHTML = `
      <div style="font-size:0.85rem; color:#5D4037; font-weight:bold; text-align:center; margin-bottom:6px;">
        Nghĩa của từ: <strong style="font-size:1.05rem; color:#3b7a13;">${target.word}</strong>
      </div>
      ${choices
        .map(
          (c, i) => `
        <button class="btn-choice lockout-choice" data-correct="${c.word === target.word}" style="padding:10px;">
          ${String.fromCharCode(65 + i)}. ${c.meaning}
        </button>
      `,
        )
        .join("")}
    `;

    const choiceBtns = card.querySelectorAll(".lockout-choice");
    choiceBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const isCorrect = btn.getAttribute("data-correct") === "true";
        const feedback = card.querySelector("#lockout-feedback");

        choiceBtns.forEach((b) => b.setAttribute("disabled", "true"));

        // Helper to cleanly release lockout and unlock screen
        const unlockScreen = async () => {
          consecutiveWrong = 0;
          consecutiveIgnored = 0;
          await chrome.storage.local.set({
            lockout_quiz_state: null,
            is_punishment_mode: false,
          });
          const overlay = shadow.querySelector(".lockout-overlay");
          if (overlay) overlay.remove();
          card.remove();
          stopAngryRun();
          startAnimation("idle");
        };

        if (isCorrect) {
          btn.style.borderColor = "#81C784";
          btn.style.background = "#E8F5E9";
          setLockoutMascotAction("celebrating");

          let countdown = 3;
          feedback.innerHTML = `
            <div style="background:#E8F5E9; border:2px solid #81C784; border-radius:14px; padding:12px; margin-top:8px; text-align:center;">
              <div style="font-size:1.05rem; font-weight:bold; color:#2E7D32; margin-bottom:4px;">
                🎉 CHÍNH XÁC! Matcha hết dỗi rồi! 🍵
              </div>
              <div style="font-size:0.85rem; color:#388E3C; margin-bottom:8px;">
                Mở khóa màn hình trong <strong id="lockout-countdown" style="font-size:1.1rem; color:#1B5E20;">${countdown}</strong>s...
              </div>
              <button id="btn-unlock-now" class="btn btn-yes" style="width:100%; padding:9px; font-weight:bold; font-size:0.88rem; background:#4CAF50; border-color:#388E3C; color:#fff; cursor:pointer;">
                Trở lại lướt web ngay ➔
              </button>
            </div>
          `;

          const countTimer = setInterval(() => {
            countdown--;
            const countEl = card.querySelector("#lockout-countdown");
            if (countEl) countEl.textContent = countdown;
            if (countdown <= 0) {
              clearInterval(countTimer);
              unlockScreen();
            }
          }, 1000);

          const unlockBtn = card.querySelector("#btn-unlock-now");
          if (unlockBtn) {
            unlockBtn.addEventListener("click", () => {
              clearInterval(countTimer);
              unlockScreen();
            });
          }
        } else {
          btn.style.borderColor = "#E57373";
          btn.style.background = "#FFEBEE";
          // Highlight correct answer
          choiceBtns.forEach((b) => {
            if (b.getAttribute("data-correct") === "true") {
              b.style.borderColor = "#81C784";
              b.style.background = "#E8F5E9";
            }
          });

          setLockoutMascotAction("crying");

          feedback.innerHTML = `
            <div style="background:#FFEBEE; border:1.5px solid #EF9A9A; border-radius:14px; padding:12px; margin-top:8px; text-align:center;">
              <div style="font-weight:bold; color:#C62828; font-size:0.95rem; margin-bottom:4px;">
                ❌ Chưa chính xác rồi!
              </div>
              <div style="font-size:0.85rem; color:#5D4037; margin-bottom:10px; line-height:1.4;">
                "${target.word}" có nghĩa chuẩn là: <strong style="color:#2E7D32;">${target.meaning}</strong>
              </div>
              <div style="display:flex; flex-direction:column; gap:6px;">
                <button id="btn-lockout-retry" class="btn btn-yes" style="width:100%; padding:9px; font-size:0.85rem; font-weight:bold; background:#FFA726; border-color:#FB8C00; color:#fff; cursor:pointer;">
                  🔄 Làm câu hỏi khác
                </button>
                <button id="btn-lockout-forgive" class="btn btn-no" style="width:100%; padding:7px; font-size:0.8rem; background:#FFF; border:1px solid #D7CCC8; color:#795548; cursor:pointer;">
                  🥺 Tha cho tớ lần này nhé (Bỏ qua)
                </button>
              </div>
            </div>
          `;

          const retryBtn = card.querySelector("#btn-lockout-retry");
          if (retryBtn) {
            retryBtn.addEventListener("click", () => {
              setLockoutMascotAction("tantrum");
              generateLockoutQuiz(card, true);
            });
          }

          const forgiveBtn = card.querySelector("#btn-lockout-forgive");
          if (forgiveBtn) {
            forgiveBtn.addEventListener("click", () => {
              setLockoutMascotAction("celebrating");
              let forgiveCountdown = 3;
              feedback.innerHTML = `
                <div style="background:#FFF8E1; border:1.5px solid #FFE082; border-radius:14px; padding:12px; margin-top:8px; text-align:center;">
                  <div style="font-weight:bold; color:#F57F17; font-size:0.95rem; margin-bottom:4px;">
                    🍵 Hứa phải chăm học hơn đấy nhé!
                  </div>
                  <div style="font-size:0.82rem; color:#5D4037; margin-bottom:8px; line-height:1.4;">
                    Lần này Matcha tha cho cậu đó! Nhớ sớm ôn lại từ "${target.word}" nha. Mở khóa trong <strong id="forgive-count" style="font-size:1.05rem; color:#E65100;">${forgiveCountdown}</strong>s...
                  </div>
                  <button id="btn-forgive-unlock-now" class="btn btn-yes" style="width:100%; padding:8px; font-size:0.85rem; font-weight:bold; background:#4CAF50; border-color:#388E3C; color:#fff; cursor:pointer;">
                    Cảm ơn Matcha, tớ hứa! ➔
                  </button>
                </div>
              `;

              const forgiveTimer = setInterval(() => {
                forgiveCountdown--;
                const countEl = card.querySelector("#forgive-count");
                if (countEl) countEl.textContent = forgiveCountdown;
                if (forgiveCountdown <= 0) {
                  clearInterval(forgiveTimer);
                  unlockScreen();
                }
              }, 1000);

              const forgiveNowBtn = card.querySelector(
                "#btn-forgive-unlock-now",
              );
              if (forgiveNowBtn) {
                forgiveNowBtn.addEventListener("click", () => {
                  clearInterval(forgiveTimer);
                  unlockScreen();
                });
              }
            });
          }
        }
      });
    });
  }

  function closeBubble() {
    bubble.style.display = "none";
    startAnimation("idle");
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

    let listHtml = "";
    wordsList.forEach((wordData, idx) => {
      listHtml += `
        <div style="border-bottom:1px dashed #A7D08C; padding:6px 0; display:flex; flex-direction:column; gap:2px; text-align:left;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:bold; color:#3b7a13; font-size:0.85rem;">${wordData.word}</span>
            <span style="font-size:0.7rem; color:#8D6E63;">${wordData.phonetic || ""}</span>
          </div>
          <div style="font-size:0.75rem; color:#5D4037; font-weight:500;">${wordData.meaning}</div>
          ${wordData.example ? `<div style="font-size:0.65rem; color:#795548; font-style:italic; line-height:1.2; margin-top:2px;">Cảnh: "${wordData.example}"</div>` : ""}
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
    startAnimation("celebrating");

    shadow
      .querySelector("#close-bubble")
      .addEventListener("click", closeBubble);

    shadow.querySelectorAll(".btn-save-ocr-item").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const idx = parseInt(btn.getAttribute("data-idx"));
        const wordData = wordsList[idx];

        btn.textContent = "Đang lưu...";
        btn.disabled = true;

        const data = await chrome.storage.local.get(["jwt_token"]);
        if (!data.jwt_token) {
          alert("Vui lòng kết nối tài khoản ở popup tiện ích trước nhé!");
          btn.textContent = "Lưu từ 🍵";
          btn.disabled = false;
          return;
        }
        try {
          const serverUrl = await getServerUrl();
          const res = await fetch(`${serverUrl}/api/vocabulary`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.jwt_token}`,
            },
            body: JSON.stringify({
              word: wordData.word,
              meaning: wordData.meaning,
              phonetic: wordData.phonetic,
              example: wordData.example || "",
              synonyms: wordData.synonyms || [],
              memory_hook: wordData.memory_hook || "",
              topic: wordData.topic || "General",
              source: "Matcha OCR",
              is_global: true, // Save to library & share to community!
            }),
          });
          if (res.ok) {
            btn.textContent = "Đã lưu ✔";
            btn.style.background = "#81C784";
            btn.style.border = "1px solid #4CAF50";
            btn.style.color = "#FFFFFF";
            // Trigger storage update
            chrome.runtime.sendMessage({
              action: "save_jwt_token",
              token: data.jwt_token,
            });
          } else {
            const errData = await res.json();
            alert(errData.detail || "Lỗi lưu từ vựng.");
            btn.textContent = "Lưu từ 🍵";
            btn.disabled = false;
          }
        } catch (err) {
          console.error(err);
          btn.textContent = "Lưu từ 🍵";
          btn.disabled = false;
        }
      });
    });
  }
})();

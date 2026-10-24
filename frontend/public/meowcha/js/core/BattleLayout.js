/* The canvas, character, input and collision line share measured viewport geometry. */
(function(root) {
  const M = root.Meowcha = root.Meowcha || {};
  M.refreshBattleLayout = function(canvas) {
    const fallback = { catY: canvas.height - 128, bottomThreshold: canvas.height - 130 };
    if (typeof document === 'undefined') return fallback;
    const keyboard = document.getElementById('virtualKeyboardContainer');
    const keyRect = keyboard && keyboard.getBoundingClientRect();
    const visibleKeyboard = !!(keyRect && keyRect.height && getComputedStyle(keyboard).display !== 'none' && getComputedStyle(keyboard).visibility !== 'hidden');
    document.documentElement.classList.toggle('keyboard-visible', visibleKeyboard);
    const canvasRect = canvas.getBoundingClientRect && canvas.getBoundingClientRect();
    if (canvasRect) {
      const width = Math.round(canvasRect.width), height = Math.round(canvasRect.height);
      if (width && canvas.width !== width) canvas.width = width;
      if (height && canvas.height !== height) canvas.height = height;
    }
    const keyboardHeight = visibleKeyboard && keyRect.left < canvas.width - 10 ? Math.max(0, canvas.height - keyRect.top) : 0;
    document.documentElement.style.setProperty('--mc-keyboard-height', `${keyboardHeight}px`);
    const compact = canvas.width <= 768 || canvas.height < 550 || (M.Device && M.Device.info.isTouchDevice);
    if (!compact && !keyboardHeight) { M.battleLayout = fallback; return fallback; }
    const hud = document.querySelector('.sect-scroll-hud');
    const hudBottom = hud ? hud.getBoundingClientRect().bottom : 90;
    const altar = document.getElementById('swordIntentBox');
    const altarHeight = altar ? Math.min(100, altar.getBoundingClientRect().height) : 65;
    const catY = Math.max(hudBottom + 70, canvas.height - keyboardHeight - altarHeight - 28);
    M.battleLayout = { catY, bottomThreshold: Math.max(hudBottom + 30, catY - 50) };
    return M.battleLayout;
  };
  M.getBattleLayout = canvas => M.battleLayout || M.refreshBattleLayout(canvas);
})(typeof window !== 'undefined' ? window : globalThis);

/* The canvas, character, input and collision line share measured viewport geometry. */
(function(root) {
  const M = root.Meowcha = root.Meowcha || {};
  // Crop around the authored temple/terrace, with only enough bleed for screen shake.
  M.getSceneFrame = function(imageWidth,imageHeight,width,height,portrait=false) {
    const bleed=6,scale=Math.max((width+bleed*2)/imageWidth,(height+bleed*2)/imageHeight);
    const sw=(width+bleed*2)/scale,sh=(height+bleed*2)/scale;
    const focalY=portrait?.58:.5;
    return {sx:Math.max(0,(imageWidth-sw)/2),sy:Math.max(0,Math.min(imageHeight-sh,imageHeight*focalY-sh/2)),
      sw,sh,dx:-bleed,dy:-bleed,dw:width+bleed*2,dh:height+bleed*2};
  };
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
    const hud = document.querySelector('.sect-scroll-hud');
    const hudBottom = hud ? hud.getBoundingClientRect().bottom : 90;
    const altar = document.getElementById('swordIntentBox');
    const altarHeight = altar ? altar.getBoundingClientRect().height : 65;
    const wideShort = canvas.height < 500 && (root.innerWidth || canvas.width) > canvas.height * 1.3;
    const tight = wideShort || (visibleKeyboard && canvas.width <= 600 && canvas.height <= 650);
    const characterSize = tight ? 90 : canvas.width <= 768 ? 125 : 180;
    const catX = wideShort ? Math.max(characterSize*.55,canvas.width*.18) : canvas.width / 2;
    const catY = Math.max(hudBottom + 90, canvas.height - keyboardHeight - altarHeight - (tight ? 18 : 28));
    M.battleLayout = { catX, catY, hudBottom, characterSize, tight,
      attackX: catX + characterSize * .16, attackY: catY - characterSize * .54,
      bottomThreshold: Math.max(hudBottom + 30, catY - 50) };
    return M.battleLayout;
  };
  M.getBattleLayout = canvas => M.battleLayout || M.refreshBattleLayout(canvas);
})(typeof window !== 'undefined' ? window : globalThis);

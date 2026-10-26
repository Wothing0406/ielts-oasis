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
  M.computeBattleLayout = function({width,height,hudBottom=80,keyboardHeight=0,controlsHeight=110,touch=false}) {
    const landscape=height<500&&width>height*1.3;
    const fieldWidth=landscape&&keyboardHeight?Math.floor(width*.52):width;
    const compact=width<=600||landscape;
    const characterSize=compact?64:100;
    const controlsWidth=Math.min(1100,fieldWidth-32);
    const controlsLeft=(fieldWidth-controlsWidth)/2;
    // Keyboard sits beside the field in landscape, underneath it in portrait.
    const keyboardBelow=landscape?0:keyboardHeight;
    // A fixed reserve prevents new skills or an expanded review from lifting the hero.
    const footer=touch&&keyboardHeight?122:compact?146:188;
    const heroFloor=Math.max(0,height-keyboardBelow-20);
    const defenseY=Math.min(Math.max(hudBottom+124,height-keyboardBelow-footer),Math.max(0,heroFloor-characterSize-40));
    const catX=fieldWidth/2;
    const catY=Math.min(heroFloor,defenseY+characterSize+40);
    const barrierHeight=compact?44:56;
    const heroLaneWidth=Math.min(fieldWidth,characterSize*2.4+32);
    return {catX,catY,hudBottom,characterSize,tight:compact,fieldWidth,defenseY,barrierHeight,heroLaneWidth,
      controlsWidth,controlsLeft,keyboardBelow,landscape,
      attackX:catX+characterSize*.2,attackY:catY-characterSize*.6,
      bottomThreshold:defenseY-(compact?27:40)};
  };
  M.refreshBattleLayout = function(canvas) {
    const fallback = { catY: canvas.height - 128, bottomThreshold: canvas.height - 130 };
    if (typeof document === 'undefined') return fallback;
    const keyboard = document.getElementById('virtualKeyboardContainer');
    const keyRect = keyboard && keyboard.getBoundingClientRect();
    const visibleKeyboard = !!(!M.Device?.info.isDesktop && keyboard && !keyboard.hidden && keyRect && keyRect.height && getComputedStyle(keyboard).display !== 'none' && getComputedStyle(keyboard).visibility !== 'hidden');
    document.documentElement.classList.toggle('keyboard-visible', visibleKeyboard);
    const canvasRect = canvas.getBoundingClientRect && canvas.getBoundingClientRect();
    if (canvasRect) {
      const width = Math.round(canvasRect.width), height = Math.round(canvasRect.height);
      if (width && canvas.width !== width) canvas.width = width;
      if (height && canvas.height !== height) canvas.height = height;
    }
    const commandDock=document.getElementById('battleCommandDock');
    const keyboardHeight = M.Device?.info.isTouchDevice ? Math.max(visibleKeyboard?keyRect.height:0,commandDock?.getBoundingClientRect().height||0) : 0;
    document.documentElement.style.setProperty('--mc-keyboard-height', `${keyRect?.height||0}px`);
    const hud = document.querySelector('.sect-scroll-hud');
    const hudBottom = Math.max(64,hud ? hud.getBoundingClientRect().bottom-(canvasRect?.top||0) : 80);
    const altar = document.getElementById('swordIntentBox');
    const altarHeight = altar ? altar.getBoundingClientRect().height : 110;
    M.battleLayout=M.computeBattleLayout({width:canvas.width,height:canvas.height,hudBottom,
      keyboardHeight,controlsHeight:altarHeight,touch:!!M.Device?.info.isTouchDevice});
    for(const [name,value] of Object.entries({
      'defense-y':M.battleLayout.defenseY,'field-width':M.battleLayout.fieldWidth,
      'controls-left':M.battleLayout.controlsLeft,'controls-width':M.battleLayout.controlsWidth,
      'hero-lane':M.battleLayout.heroLaneWidth,
      'footer-bottom':M.battleLayout.keyboardBelow,'controls-limit':M.battleLayout.tight?140:160
    }))document.documentElement.style.setProperty('--mc-'+name,value+'px');
    return M.battleLayout;
  };
  M.getBattleLayout = canvas => M.battleLayout || M.refreshBattleLayout(canvas);
  M.drawDefenseBarrier=function(ctx,canvas,asset){
    if(!asset?.loaded)return;
    const field=M.getBattleLayout(canvas);
    // The authored top rail is at 38%. Keep the whole fence above the hero.
    const height=field.barrierHeight||56,width=height*3;
    // A transient zero/overfull viewport during rotation must never create a negative tile step.
    if(!Number.isFinite(width)||width<=0||!Number.isFinite(field.fieldWidth)||field.fieldWidth<=0)return;
    const top=field.defenseY-height*.38;
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.beginPath();ctx.rect(0,0,field.fieldWidth,canvas.height);ctx.clip();
    const tiles=Math.min(32,Math.ceil(field.fieldWidth/width));
    for(let i=0;i<tiles;i++)ctx.drawImage(asset.img,i*width,top,width,height);
    ctx.restore();
  };
})(typeof window !== 'undefined' ? window : globalThis);

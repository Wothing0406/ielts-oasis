const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.join(__dirname,'../public/meowcha');
function setup(){
 const storage=new Map(),timers=[],box={console,performance,Date,Math,crypto:require('node:crypto').webcrypto,
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},
 document:{getElementById:()=>null,addEventListener(){}},addEventListener(){},setTimeout:(fn,ms)=>{if(ms===3500)timers.push(fn);return 1;},clearTimeout(){}};
 box.window=box;vm.createContext(box);
 for(const f of ['data/RealmsData.js','data/TalentsData.js','core/GameState.js','core/SaveSystem.js','core/BattleLayout.js','entities/AsteroidManager.js','combat/TypingEngine.js','combat/BreakthroughFlow.js','ui/ArtIcons.js','ui/DesignSystem.js','ui/UIManager.js'])vm.runInContext(fs.readFileSync(path.join(base,'js',f),'utf8'),box);
 const M=box.Meowcha,state=new M.GameState();state.currentScene='BATTLE';
 for(const f of ['effects/FloatingText.js','main.js'])vm.runInContext(fs.readFileSync(path.join(base,'js',f),'utf8'),box);
 M.battleLayout={catX:600,catY:650,attackX:625,attackY:560,bottomThreshold:600};
 const noop=new Proxy({}, {get:()=>()=>{}}),save=new M.SaveSystem(),manager=new M.AsteroidManager();manager.gameState=state;
 const typing=new M.TypingEngine(state,manager,noop,noop,noop,noop,noop,null,null,save);
 const flow=new M.BreakthroughFlow(state,noop,null);
 return {box,M,state,noop,save,manager,typing,flow,timers};
}
test('all four realm gates complete their actual three-shield boss, offer once and retain the choice in a save',()=>{
 const r=setup(),canvas={width:1200,height:800};let offers=[];
 r.flow.onShowTalentModal=choices=>offers=choices;
 for(let target=1;target<5;target++){
  r.state.realmIdx=target-1;r.state.score=r.M.CULTIVATION_REALMS[target].minScore;r.state.wordsSlain=r.M.CULTIVATION_REALMS[target].minWords;
  r.flow.onSpawnBoss=pool=>r.manager.spawnBoss(pool,canvas.width);
  r.typing.onBossDefeated=()=>r.flow.onBossSlain(target);
  assert.equal(r.flow.checkProgress(r.manager),true);
  const boss=r.manager.asteroids[0];assert.equal(boss.totalShields,3);
  for(let shield=0;shield<3;shield++){
   const word=boss.word;r.typing.currentTarget=boss;
   for(const key of word)r.typing.processKey(key,canvas);
   assert.equal(boss.currentShieldIdx,shield+1);
  }
  assert.equal(r.manager.count,0);assert.equal(r.state.pendingBreakthrough,true);
  assert.equal(r.timers.length,1);r.timers.pop()();
  assert.equal(r.state.realmIdx,target);assert.equal(offers.length,3);
  const keys=r.state.correctKeystrokes,choice=offers.find(c=>c.isSkill)||offers[0];
  assert.equal(r.flow.selectTalent(choice),true);assert.equal(r.flow.selectTalent(offers[1]),false);
  assert.equal(r.state.correctKeystrokes,keys);
  r.save.saveGame(1,r.state);const snapshot=r.save.getSlotModeData(1,'DIRECT');
  const loaded=new r.M.GameState();loaded.loadFromModeData(snapshot,'DIRECT');
  assert.equal(loaded.realmIdx,target);assert.deepEqual({...loaded.skillLevels},{...r.state.skillLevels});
  assert.equal(r.flow.isBossEncounterActive,false);
 }
});
test('defeat actions invoke one owner callback without resetting or submitting a second empty run',()=>{
 const r=setup();let restarted=0,returned=0;
 const modal={style:{display:'flex'}};
 const ui=Object.assign(Object.create(r.M.UIManager.prototype),{state:r.state,modalGameOver:modal,audio:r.noop,
 onRestartBattle(){restarted++;},onReturnLobby(){returned++;}});
 const run=r.state.runId;r.state.gameMode='AUDIO';
 assert.equal(ui.finishGameOver(true),true);assert.equal(ui.finishGameOver(true),false);
 assert.equal(restarted,1);assert.equal(r.state.runId,run);assert.equal(r.state.gameMode,'AUDIO');
 modal.style.display='flex';ui.finishGameOver(false);ui.finishGameOver(false);assert.equal(returned,1);
});
test('shared stat text keeps zero, Vietnamese and IPA literal without turning it into player HTML',()=>{
 const r=setup();const html=r.M.ui.stat('listening','Thính âm /dʒeɪd/',0);
 assert.match(html,/>0<\/dd>/);assert.match(html,/Thính âm/);
 assert.doesNotMatch(r.M.ui.stat('accuracy','<img src=x>','<script>'),/<img|<script/);
});

test('ordinary rocks and reward occupy a compact field while preserving complete IPA text',()=>{
 const r=setup(),ctx={canvas:{width:390,height:844},measureText:text=>({width:Array.from(text).length*7})};
 const ast=r.manager.spawn({word:'JADE',ipa:'/dʒeɪd/',meaning:'ngọc bích'},390);
 assert.equal(ast.radius,32);const card=r.manager.cardLayout(ctx,ast);assert.ok(card.paperW<=220);assert.ok(card.paperH<100);
 const ipa='/ˌɪnkɒmprɪˈhensəbl/',f=new r.M.FloatingText();
 const layout=f.getBurstLayout(ctx,{word:'INCOMPREHENSIBLE',ipa,meaning:'không thể hiểu được',type:'adjective',x:195,y:200});
 assert.ok(layout.width<=246);assert.ok(layout.height<180);assert.equal(layout.ipaLines.join(''),ipa);
});

test('four meteor types at every realm move, freeze and collide once with their scaled damage',()=>{
 const r=setup(),baseDamage={ice:8,fire:12,void:16,thunder:22};
 for(let realm=0;realm<5;realm++)for(const type of Object.keys(baseDamage)){
  r.manager.clear();const meteor=r.manager.spawn({word:'JADE',meaning:'ngọc bích'},390,realm,1,0,type);
  assert.equal(meteor.damage,baseDamage[type]+realm*2);
  const y=meteor.y;meteor.freezeTimer=.1;r.manager.update(.05,1000,()=>assert.fail('frozen collision'),390);
  assert.equal(meteor.y,y);meteor.freezeTimer=0;r.manager.update(.1,1000,()=>assert.fail('early collision'),390);
  assert.ok(meteor.y>y);let hits=0;
  meteor.y=1001;r.manager.update(.016,1000,a=>{assert.equal(a,meteor);hits++;},390);
  r.manager.update(.016,1000,()=>hits++,390);assert.equal(hits,1);assert.equal(r.manager.count,0);
 }
});

test('portrait framing keeps the authored temple and terrace inside every supported portrait viewport',()=>{
 const {M}=setup();
 for(const [w,h] of [[320,568],[360,640],[375,667],[390,844],[430,932],[768,1024]]){
  const f=M.getSceneFrame(862,1824,w,h,true);
  assert.ok(f.sx>=0&&f.sy>=0&&f.sx+f.sw<=862.01&&f.sy+f.sh<=1824.01);
  assert.ok(f.sx<=100&&f.sx+f.sw>=762,'temple width');
  assert.ok(f.sy<=540&&f.sy+f.sh>=1540,'temple and terrace height');
  assert.ok(Math.abs(f.sw/f.sh-f.dw/f.dh)<.0001,'uniform scale');
 }
});

test('ten fast completions in each mode cannot spawn over their reward and retain full IPA and type',()=>{
 for(const mode of ['DIRECT','CLOZE','AUDIO']){
  const r=setup(),canvas={width:390,height:844};r.state.gameMode=mode;
  r.M.REALM_DECKS={0:['CAT','DOG','TEA','SUN','SKY','MOON','JADE','BOOK','TREE','WIND'].map(word=>({word,ipa:'/dʒeɪd/',type:'noun',meaning:'ngọc bích'}))};
  const floating=new r.M.FloatingText();r.typing.floatingText=floating;
  const app=Object.assign(Object.create(r.M.App.prototype),{gameState:r.state,canvas,asteroids:r.manager,typing:r.typing,floatingText:floating,breakthrough:r.flow,saveSystem:r.save});
  const lifetime={DIRECT:2,CLOZE:2.8,AUDIO:3.6}[mode];
  for(let i=0;i<10;i++){
   app.spawnWord();assert.equal(r.manager.count,1);const target=r.manager.asteroids[0],x=target.x;
   assert.equal(target.vx,0);assert.ok(target.y<0);r.manager.update(.1,1000,()=>{},390);assert.equal(target.x,x);
   for(const key of target.word)r.typing.processKey(key,canvas);
   assert.equal(r.manager.count,0);assert.equal(floating.bursts[0].ipa,'/dʒeɪd/');assert.equal(floating.bursts[0].type,'noun');
   assert.equal(floating.bursts[0].life,lifetime);app.spawnWord();assert.equal(r.manager.count,0);
   floating.update(lifetime-.05);app.spawnWord();assert.equal(r.manager.count,0);
   floating.update(.06);assert.equal(floating.hasBlockingReward(),false);
  }
  assert.equal(r.state.learningAttempts,10);assert.equal(r.state.firstSuccesses,10);assert.equal(r.state.humanWords,10);
 }
});

test('learning outcomes distinguish first answers, pre-answer replays, hints and meteor falls across save/load',()=>{
 const r=setup(),canvas={width:390,height:844};r.state.gameMode='AUDIO';
 let target=r.manager.spawn({word:'CAT'},390);r.typing.currentTarget=target;r.typing.replayCurrentAudio();
 for(const c of target.word)r.typing.processKey(c,canvas);
 assert.equal(r.state.replayCount,1);assert.equal(r.state.firstSuccesses,0);
 r.state.gameMode='CLOZE';r.state.passiveModifiers.mindHint=true;
 target=r.manager.spawn({word:'DOG'},390);r.typing.currentTarget=target;
 r.typing.processKey('X',canvas);r.typing.processKey('X',canvas);
 for(const c of target.word)r.typing.processKey(c,canvas);
 assert.equal(r.state.hintsUsed,1);assert.equal(r.state.assisted,true);assert.equal(r.state.firstSuccesses,0);
 r.state.recordLearningOutcome({word:'MISS'},false);assert.equal(r.state.learningAttempts,3);
 r.save.saveGame(1,r.state);const loaded=new r.M.GameState();loaded.loadFromModeData(r.save.getSlotModeData(1,'CLOZE'),'CLOZE');
 assert.equal(loaded.learningAttempts,3);assert.equal(loaded.replayCount,1);assert.equal(loaded.hintsUsed,1);
 loaded.resetForNewMode('AUDIO');assert.equal(loaded.learningAttempts,0);assert.equal(loaded.replayCount,0);
});

test('resuming after a completed word still opens its saved realm gate after the reward clears',()=>{
 const r=setup(),canvas={width:390,height:844},floating=new r.M.FloatingText();
 r.state.score=2000;r.state.wordsSlain=15;r.flow.onSpawnBoss=pool=>r.manager.spawnBoss(pool,390);
 const app=Object.assign(Object.create(r.M.App.prototype),{gameState:r.state,canvas,asteroids:r.manager,typing:r.typing,floatingText:floating,breakthrough:r.flow,saveSystem:r.save});
 floating.addInSituBurst(195,200,{word:'JADE',gameMode:'DIRECT'});app.spawnWord();assert.equal(r.manager.count,0);
 floating.update(2.1);app.spawnWord();assert.equal(r.manager.asteroids[0].isBoss,true);
});

test('an empty newly selected mode cannot hide another saved journey at startup',()=>{
 const r=setup();r.state.score=2000;r.state.wordsSlain=15;r.state.realmIdx=1;r.state.hp=38;r.state.maxHp=50;
 r.state.skillLevels.WIND_SWORD_DOMAIN=1;r.state.correctKeystrokes=55;r.state.totalKeystrokes=60;
 r.save.saveGame(1,r.state);r.state.resetForNewMode('AUDIO');r.save.saveGame(1,r.state);
 const resumed=r.save.hasActiveSave();assert.equal(resumed.activeMode,'DIRECT');
 const loaded=new r.M.GameState();loaded.loadFromSlot(resumed);
 assert.equal(loaded.hp,38);assert.equal(loaded.realmIdx,1);assert.equal(loaded.skillLevels.WIND_SWORD_DOMAIN,1);
 assert.equal(loaded.correctKeystrokes,55);assert.equal(loaded.gameMode,'DIRECT');
});

test('game over remains latched through the real purge, submits and sounds once, then permits a future run',()=>{
 const r=setup(),calls={submitted:0,reset:0,shown:0,silenced:0},floating=new r.M.FloatingText();r.state.score=100;
 const app=Object.assign(Object.create(r.M.App.prototype),{gameState:r.state,canvas:{width:390,height:844},asteroids:r.manager,
  projectiles:r.noop,particles:r.noop,floatingText:floating,typing:r.typing,breakthrough:r.flow,realmVFX:r.noop,unityBridge:r.noop,
  saveSystem:{resetActiveSave(){calls.reset++;}},audio:{silenceAll(){calls.silenced++;},play(){}},
  ui:{autoSubmitScoreToPantheon(){calls.submitted++;},updateHUD(){},showGameOverModal(){calls.shown++;}}});
 app.handleGameOver();app.handleGameOver();app.handleGameOver();
 assert.deepEqual(calls,{submitted:1,reset:1,shown:1,silenced:1});assert.equal(r.state.isPaused,true);
 app.purgeAllBattleState();r.state.resetForNewMode('DIRECT');r.state.score=100;app.handleGameOver();assert.equal(calls.shown,2);
});

test('defense geometry keeps the hero below the field and ignores growth of skills and review panels',()=>{
 const {M}=setup();
 for(const [width,height,keyboardHeight] of [[1920,1080,0],[1280,720,0],[390,844,286],[320,568,246],[844,390,270]]){
  const input={width,height,keyboardHeight,hudBottom:80,touch:keyboardHeight>0};
  const first=M.computeBattleLayout({...input,controlsHeight:40}),expanded=M.computeBattleLayout({...input,controlsHeight:1000});
  assert.equal(first.catY,expanded.catY);assert.equal(first.defenseY,expanded.defenseY);
  assert.equal(first.catX,first.fieldWidth/2);
  assert.ok(first.catY-first.characterSize>first.defenseY+24);
  assert.ok(first.bottomThreshold<first.defenseY);assert.ok(first.bottomThreshold>first.hudBottom+80);
  assert.ok(first.controlsLeft+first.controlsWidth<first.fieldWidth);
 }
});

test('registered sprites render at equal visible heights across all five realms below the defense boundary',()=>{
 const r=setup();vm.runInContext(fs.readFileSync(path.join(base,'js/entities/CatCultivator.js'),'utf8'),r.box);
 const rawBounds=[[64,154,296,325],[25,47,335,327],[73,110,288,330],[48,110,313,330],[83,113,278,330]];
 for(const [width,height,keyboardHeight] of [[1280,720,0],[320,568,168]]){
  r.M.battleLayout=r.M.computeBattleLayout({width,height,keyboardHeight});
  for(let realm=0;realm<5;realm++){
   const draws=[],ctx=new Proxy({drawImage:(...args)=>draws.push(args)},{get:(o,k)=>k in o?o[k]:()=>{}});
   r.state.realmIdx=realm;r.state.catState='IDLE';
   const cat=new r.M.CatCultivator({},r.noop,{getCharacterFrame:()=>({img:{},isSheet:true,sx:0,sy:0,sw:360,sh:360})});
   cat.draw(ctx,{width,height},r.state,null);
   const [,,,,,x,y,w,h]=draws[0],b=rawBounds[realm],visibleHeight=(b[3]-b[1])/360*h;
   assert.ok(Math.abs(visibleHeight-r.M.battleLayout.characterSize)<.01);
   assert.ok(y+b[1]/360*h>r.M.battleLayout.defenseY);
  }
 }
});

test('first words have a calm timed window on small and large fields; long and listening words get more time',()=>{
 const r=setup();
 for(const bottomThreshold of [240,700]){
  r.M.battleLayout={hudBottom:80,bottomThreshold};
  const manager=new r.M.AsteroidManager();manager.gameState=r.state;
  r.state.wordsSlain=0;r.state.gameMode='DIRECT';const a=manager.spawn({word:'JADE'},320,0,1);
  assert.equal(a.typingSeconds,24);let hits=0;
  for(let i=0;i<250;i++)manager.update(.1,bottomThreshold,()=>hits++);
  assert.equal(hits,0);for(let i=0;i<20;i++)manager.update(.1,bottomThreshold,()=>hits++);
  assert.equal(hits,1);
  manager.clear();r.state.gameMode='AUDIO';const heard=manager.spawn({word:'INCOMPREHENSIBLE'},320,0,1);
  assert.ok(heard.typingSeconds>30);
 }
});

test('stun blocks physical and virtual typing equally without fabricated errors; cues respect reduced motion',()=>{
 const r=setup();vm.runInContext(fs.readFileSync(path.join(base,'js/core/CombatFeedback.js'),'utf8'),r.box);
 const ast=r.manager.spawn({word:'JADE'},1280);r.typing.currentTarget=ast;
 r.state.triggerStun(420);assert.equal(r.state.typoCount,0);assert.equal(r.state.speedMultiplier,1);
 r.typing.processKey('J',{width:1280,height:720});assert.equal(r.state.totalKeystrokes,0);
 r.state.stunTimer=0;r.state.updateStun();r.typing.processKey('J',{width:1280,height:720});assert.equal(r.state.correctKeystrokes,1);
 r.state.screenShake=0;r.box.matchMedia=()=>({matches:true});r.M.combatFeedback(r.state,'impact');
 assert.equal(r.state.screenShake,0);assert.match(r.state.combatCue.label,/kết giới/);
});

test('rotating a viewport preserves remaining typing time instead of immediately hitting a closer boundary',()=>{
 const r=setup();r.M.battleLayout={hudBottom:80,bottomThreshold:600};
 const ast=r.manager.spawn({word:'JADE'},1280);ast.entering=false;
 r.manager.update(12,600,()=>assert.fail('too early'));
 const remaining=ast.remainingSeconds;assert.ok(ast.y>200);
 r.M.battleLayout={hudBottom:80,bottomThreshold:200};r.manager.update(.1,200,()=>assert.fail('resize caused a miss'));
 assert.ok(ast.y<200);assert.ok(Math.abs(ast.remainingSeconds-(remaining-.1))<.001);
});

test('opening last-word review pauses the run, replays without typing and restores the previous pause state',()=>{
 const r=setup(),panel={open:false,querySelector:()=>({})};
 r.M.applyDesignSystem=()=>{};
 r.box.document.getElementById=id=>id==='lastLearnedWord'?panel:null;
 r.typing.showCompletedWord({word:'JADE',ipa:'/dʒeɪd/',meaning:'ngọc bích'});
 panel.open=true;panel.ontoggle();assert.equal(r.state.isPaused,true);
 const keys=r.state.correctKeystrokes;r.typing.processKey('J',{width:320,height:568});assert.equal(r.state.correctKeystrokes,keys);
 panel.open=false;panel.ontoggle();assert.equal(r.state.isPaused,false);
 r.state.setPaused(true);panel.open=true;panel.ontoggle();panel.open=false;panel.ontoggle();assert.equal(r.state.isPaused,true);
});

test('rotation with an overfull header or transient zero viewport cannot create an unbounded fence draw',()=>{
 const r=setup();
 vm.runInContext(fs.readFileSync(path.join(base,'js/core/BattleLayout.js'),'utf8'),r.box);
 for(const dims of [{width:844,height:390,hudBottom:380,keyboardHeight:240,touch:true},{width:320,height:0,hudBottom:100,keyboardHeight:220,touch:true}]){
  r.M.battleLayout=r.M.computeBattleLayout(dims);
  assert.ok(r.M.battleLayout.catY>=r.M.battleLayout.defenseY);
  let draws=0;const ctx={save(){},restore(){},beginPath(){},rect(){},clip(){},drawImage(){draws++;}};
  r.M.drawDefenseBarrier(ctx,dims,{loaded:true,img:{}});assert.ok(draws<=32);
 }
});

test('the real render loop advances lobby actors, freezes battle actors while paused and resumes once per tick',()=>{
 const r=setup();let actor=0,clips=0,physics=0;
 const app={lastFrameTime:0,isLoopRunning:false,gameState:r.state,particles:{spawnQiMote(){},update(){}},canvas:{width:1280,height:720},cat:{update(){actor++;}},animator:{update(){clips++;}},draw(){},update(){physics++;}};
 r.state.currentScene='LOBBY';r.M.App.prototype.gameLoop.call(app,100);r.M.App.prototype.gameLoop.call(app,200);
 assert.equal(actor,2);assert.equal(clips,2);assert.equal(physics,0);
 r.state.currentScene='BATTLE';r.state.isPaused=true;r.M.App.prototype.gameLoop.call(app,300);
 assert.equal(actor,2);assert.equal(clips,2);
 r.state.isPaused=false;r.M.App.prototype.gameLoop.call(app,400);
 assert.equal(actor,3);assert.equal(clips,3);assert.equal(physics,1);
});

test('all realms select changing real frames, bound one-shots to actual sheets and animate during rapid input',()=>{
 const r=setup();vm.runInContext(fs.readFileSync(path.join(base,'js/core/SpriteAnimator.js'),'utf8'),r.box);
 for(let realm=0;realm<5;realm++){
  const assets={};for(const key of ['idle','attack','hurt','defeated','ultimate'])assets[`char_r${realm}_${key}_sheet`]={loaded:true,img:{naturalWidth:360*(key==='idle'?4:key==='ultimate'?6:4),naturalHeight:360}};
  const actor=new r.M.SpriteAnimator(assets),state={realmIdx:realm,catState:'IDLE',catAnimationId:0};
  const seen=new Set();for(let i=0;i<12;i++){actor.update(.1,state);seen.add(actor.getCharacterFrame(realm,'IDLE').sx);}
  assert.equal(seen.size,4);assert.ok(actor.frameIndex<4);
  state.catState='WEAK_ATTACK';const strikes=new Set();
  for(let i=0;i<24;i++){state.catAnimationId++;actor.update(.05,state);strikes.add(actor.frameIndex);}
  assert.ok(strikes.size>=3,'fast input must not pin frame zero or the last frame');
  state.catState='HURT';state.catAnimationId++;for(let i=0;i<8;i++)actor.update(.1,state);
  assert.equal(actor.frameIndex,3);
  state.catState='DEFEATED';state.catAnimationId++;for(let i=0;i<20;i++)actor.update(.1,state);
  assert.equal(actor.frameIndex,3);assert.equal(actor.getCharacterFrame(realm,'DEFEATED').frameIndex,3);
 }
});

test('shared cutout motion changes head and body at game size, while reduced motion preserves a still pose',()=>{
 const r=setup();vm.runInContext(fs.readFileSync(path.join(base,'js/core/ActorMotion.js'),'utf8'),r.box);
 for(let realm=0;realm<5;realm++){
  const before=r.M.actorMotion(0,realm),after=r.M.actorMotion(1,realm);
  assert.notEqual(before.nod,after.nod);assert.notEqual(before.bob,after.bob);
  const still=r.M.actorMotion(4,realm,true);assert.equal(still.bob,0);assert.equal(still.nod,0);assert.equal(still.blink,0);assert.equal(still.breath,1);
  let draws=0;const ctx=new Proxy({drawImage(){draws++;}},{get:(o,k)=>k in o?o[k]:()=>{}});
  r.M.drawActorFrame(ctx,{img:{},sx:0,sy:0,sw:360,sh:360,isSheet:true},{x:0,y:0,size:180,realm,time:1,state:'IDLE'});
  assert.equal(draws,2);
 }
});

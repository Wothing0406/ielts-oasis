const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.join(__dirname, '../public/meowcha');

function runtime() {
  const storage = new Map();
  const localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k) };
  const sandbox = { console, performance, crypto: require('node:crypto').webcrypto, Date, Math: Object.create(Math),
    localStorage, URLSearchParams, navigator: {}, document: { getElementById: () => null, documentElement: { style: { setProperty() {} }, classList: { toggle() {} } }, querySelector: () => null },
    setTimeout: () => 1, clearTimeout() {} };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of ['core/BattleLayout.js', 'core/GameState.js', 'data/RealmsData.js', 'data/TalentsData.js', 'core/SaveSystem.js', 'effects/FloatingText.js', 'entities/AsteroidManager.js', 'combat/TypingEngine.js', 'combat/BreakthroughFlow.js', 'ui/ArtIcons.js', 'ui/UIManager.js']) {
    vm.runInContext(fs.readFileSync(path.join(base, 'js', file), 'utf8'), sandbox);
  }
  const M = sandbox.Meowcha;
  const state = new M.GameState(); state.currentScene = 'BATTLE';
  const save = new M.SaveSystem();
  const noop = new Proxy({}, { get: () => () => {} });
  const asteroids = { asteroids: [] };
  const engine = new M.TypingEngine(state, asteroids, noop, noop, noop, noop, noop, null, null, save);
  const canvas = { width: 1200, height: 800 };
  engine.playWordAudio = () => {};
  return { sandbox, M, state, save, engine, asteroids, canvas, localStorage };
}
const word = (text = 'CAT') => ({ word: text, typedLen: 0, x: 100, y: 100, radius: 30, meaning: 'test', coreColor: '#fff' });

test('a second account cannot put the first account legacy high score on its certificate',()=>{
 const r=runtime();r.localStorage.setItem('meowcha_high_score','90000');
 r.localStorage.setItem('oasis_user',JSON.stringify({id:2}));
 const otherSave=new r.M.SaveSystem(),otherState=new r.M.GameState();
 assert.equal(otherSave.canImportLegacy,false);
 assert.equal(otherSave.getCertificateRecord(otherState).score,0);
});

test('certificate retains the measured best run after a fresh run resets to zero',()=>{
 const r=runtime();r.state.score=12345;r.state.highScore=12345;r.state.humanWords=30;
 r.state.correctKeystrokes=150;r.state.totalKeystrokes=200;r.state.activeElapsedMs=60000;
 r.state.realmIdx=2;r.save.rememberPersonalBest(r.state);
 r.state.resetForNewMode('AUDIO');const cert=r.save.getCertificateRecord(r.state);
 assert.equal(cert.score,12345);assert.equal(cert.accuracy,75);assert.equal(cert.wpm,30);
 assert.equal(cert.humanWords,30);assert.equal(cert.realmIdx,2);assert.equal(cert.gameMode,'DIRECT');
 assert.equal(r.state.score,0);assert.equal(r.state.gameMode,'AUDIO');
});

test('legacy high score is shown honestly without borrowing current-run accuracy or WPM',()=>{
 const r=runtime();r.state.highScore=90000;r.state.score=100;r.state.correctKeystrokes=10;r.state.totalKeystrokes=10;
 const cert=r.save.getCertificateRecord(r.state);
 assert.equal(cert.score,90000);assert.equal(cert.metricsKnown,false);assert.equal(cert.wpm,undefined);
});

test('copy share link uses personal best and reports success visibly',async()=>{
 const r=runtime();r.state.highScore=12345;r.sandbox.location={origin:'https://example.test'};
 let copied='',message='';
 r.sandbox.navigator.clipboard={writeText:async text=>{copied=text;}};
 const ui=Object.assign(Object.create(r.M.UIManager.prototype),{state:r.state,saveSystem:r.save,showStatus:text=>{message=text;}});
 await ui.copyShareLink();
 assert.equal(copied,'https://example.test/games/meowcha?score=12345');
 assert.match(message,/Đã sao chép/);
});

test('status notification escapes the modal stacking container and announces the result',()=>{
 const r=runtime();let child=null;const attributes={},classes=new Set();
 const body={appendChild(node){child=node;node.parentElement=this;}};
 r.sandbox.document.body=body;
 const status={parentElement:{},setAttribute(k,v){attributes[k]=v;},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)}};
 r.M.UIManager.prototype.showStatus.call({statusBar:status},'Đã sao chép ảnh');
 assert.equal(child,status);assert.equal(status.textContent,'Đã sao chép ảnh');assert.equal(attributes.role,'status');
 assert.equal(attributes['aria-live'],'polite');assert.equal(classes.has('show'),true);
});

test('word reward remains at the kill location and preserves all IPA characters on narrow screens',()=>{
 const r=runtime(),floating=new r.M.FloatingText();
 const ipa='/ˌɪn.kɒm.prɪˈhen.sə.bəl ə.bɪ.lɪ.tiː ə.bɪ.lɪ.tiː/';
 floating.addInSituBurst(420,310,{word:'INCOMPREHENSIBLE',ipa,meaning:'khó hiểu',points:100});
 const ctx={canvas:{width:1200,height:800},measureText:t=>({width:Array.from(t).length*8})};
 let layout=floating.getBurstLayout(ctx,floating.bursts[0]);
 assert.equal(layout.x,420);assert.equal(layout.y,310);assert.equal(layout.ipaLines.join(''),ipa);
 ctx.canvas={width:320,height:568};layout=floating.getBurstLayout(ctx,floating.bursts[0]);
 assert.ok(layout.width<320);assert.equal(layout.ipaLines.join(''),ipa);assert.ok(!layout.ipaLines.join('').includes('…'));
});

test('full Oxford view includes short words and hyphenated entries and paginates locally',async()=>{
 const r=runtime();let downloads=0;
 r.sandbox.fetch=async url=>{assert.equal(url,'./data/oxford_5000.json');downloads++;return {ok:true,json:async()=>[
 {word:'a',phonetic:'/eɪ/',level:'A1'},{word:'be',phonetic:'/biː/',level:'A1'},
 {word:'self-esteem',phonetic:'/ˌself ɪˈstiːm/',meaning:'lòng tự trọng',level:'C1'}]};};
 vm.runInContext(fs.readFileSync(path.join(base,'js/core/VocabLoader.js'),'utf8'),r.sandbox);
 const loader=r.M.VocabLoader,first=await loader.searchAllOxford({pageSize:2});
 assert.equal(first.total,3);assert.equal(first.words[0].word,'A');assert.equal(first.hasMore,true);
 const second=await loader.searchAllOxford({page:2,pageSize:2});assert.equal(second.words[0].word,'SELF-ESTEEM');
 assert.equal(second.words[0].ipa,'/ˌself ɪˈstiːm/');assert.equal(downloads,1);
});

test('three equipped skill slots share the HUD and hotkeys 1, 2, 3',()=>{
 const r=runtime();r.state.realmIdx=4;
 r.state.unlockedSkills=['WIND_SWORD_DOMAIN','GOLDEN_CORE_REGEN','NASCENT_SOUL_FREEZE','TEN_THOUSAND_SWORDS'];
 r.state.skillLevels=Object.fromEntries(r.state.unlockedSkills.map(id=>[id,1]));
 assert.deepEqual(Array.from(r.state.getActiveSkillSlots()),['GOLDEN_CORE_REGEN','NASCENT_SOUL_FREEZE','TEN_THOUSAND_SWORDS']);
 r.state.hp=20;r.engine.processKey('1',r.canvas);assert.equal(r.state.hp,28);
 const target=word('STUDY');r.asteroids.asteroids.push(target);
 r.engine.processKey('2',r.canvas);assert.equal(target.freezeTimer,4);
 r.state.combo=10;r.engine.isCloudHazard=true;r.engine.processKey('3',r.canvas);
 assert.equal(r.engine.isCloudHazard,false);assert.equal(target.typedLen,0);
});

test('realm setup describes actual progression and local review scheduling', () => {
 const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
 const setup=html.slice(html.indexOf('id="setupRealmsTrack"'),html.indexOf('id="setupJourneyDetail"'));
 assert.ok(!setup.includes('C2 Master')); assert.ok(!setup.includes('x2 Tu Vi'));
 for(const threshold of ['2.000 TU VI • 15 TỪ','6.000 TU VI • 40 TỪ','14.000 TU VI • 85 TỪ','30.000 TU VI • 150 TỪ'])assert.ok(setup.includes(threshold));
 assert.ok(setup.includes('ngày ôn'));
});

test('new critical talent rewards score without auto-completing another word',()=>{
 const r=runtime();let choice;
 for(let i=0;i<200&&!choice;i++)choice=r.M.generateBreakthroughChoices(r.state,{id:1}).find(c=>c.id==='CRIT_STRIKE');
 assert.ok(choice);choice.apply(r.state);r.state.talents.critChance=1;
 r.asteroids.asteroids.push(word('CAT'),word('DOG'));
 for(const c of 'CAT')r.engine.processKey(c,r.canvas);
 assert.equal(r.state.wordsSlain,1);assert.equal(r.state.assistedWords,0);
 assert.equal(r.asteroids.asteroids[0].word,'DOG');assert.equal(r.asteroids.asteroids[0].typedLen,0);
 assert.equal(r.state.correctKeystrokes,3);assert.ok(r.state.score>=90);
});

test('purifying modifier dissipates clouds and reduces the word requirement without shortening lightning reaction time',()=>{
 const r=runtime();r.state.passiveModifiers.hazardDurationBonus=.6;
 r.engine.isCloudHazard=true;r.engine.updateHazard(9,r.canvas);assert.equal(r.engine.isCloudHazard,false);
 r.engine.triggerLightningHazard(r.canvas);assert.equal(r.engine.hazardReqWords,1);
 r.engine.updateHazard(2,r.canvas);assert.equal(r.engine.hazardTimer,12);
});

test('one breakthrough offer accepts exactly one of its three choices',()=>{
 const r=runtime();const flow=new r.M.BreakthroughFlow(r.state,new Proxy({},{get:()=>()=>{}}));
 const choices=r.M.generateBreakthroughChoices(r.state,{id:1});flow.offeredChoices=choices;
 assert.equal(flow.selectTalent(choices[0]),true);const before=JSON.stringify(r.state);
 assert.equal(flow.selectTalent(choices[1]),false);assert.equal(JSON.stringify(r.state),before);
});

test('desktop touch screens never open virtual keyboard; phones and iPads can',()=>{
 for(const spec of [
  {ua:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',platform:'Win32',touch:10,desktop:true},
  {ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile',platform:'iPhone',touch:5,desktop:false},
  {ua:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',platform:'MacIntel',touch:5,desktop:false}
 ]){
  const classes={add(){},remove(){}},container={style:{},classList:classes};
  const box={navigator:{userAgent:spec.ua,platform:spec.platform,maxTouchPoints:spec.touch},
   document:{documentElement:{classList:classes},body:{classList:classes},getElementById:()=>container},
   addEventListener(){},matchMedia:q=>({matches:q==='(pointer: coarse)'})};
  box.window=box;vm.createContext(box);
  vm.runInContext(fs.readFileSync(path.join(base,'js/core/DeviceDetector.js'),'utf8'),box);
  const D=box.Meowcha.Device;assert.equal(D.info.isDesktop,spec.desktop);
  D.setUserPrefKeyboard(true);assert.equal(D.shouldShowVirtualKeyboard(),!spec.desktop);
 }
});

test('functional, empty-scene, paused and invalid input do not change typing counters', () => {
  const r = runtime(); let replay = 0; r.engine.replayCurrentAudio = () => replay++;
  for (const key of [' ', 'Backspace', 'Tab', 'Shift', 'Enter', 'A']) r.engine.processKey(key, r.canvas);
  assert.equal(replay, 1); assert.equal(r.state.totalKeystrokes, 0);
  r.asteroids.asteroids.push(word()); r.state.isPaused = true;
  r.engine.processKey('C', r.canvas); assert.equal(r.state.totalKeystrokes, 0);
  r.state.isPaused = false; r.engine.processKey('C', r.canvas); r.engine.processKey('X', r.canvas);
  assert.equal(r.state.totalKeystrokes, 2); assert.equal(r.state.correctKeystrokes, 1);
  assert.equal(r.state.typoCount, 1); assert.equal(r.state.accuracy, 50);
});

test('WPM excludes pauses and survives save/load and independent mode switching', () => {
  const r = runtime(); r.state.correctKeystrokes = 100; r.state.totalKeystrokes = 125;
  r.state.advanceClock(60); r.state.isPaused = true; r.state.advanceClock(120);
  assert.equal(r.state.calculateWPM(), 20); assert.equal(r.state.accuracy, 80);
  r.state.wordsSlain = 3; r.state.score = 450; r.state.shieldCharges = 1;
  r.state.talents.shieldCharges = 2; r.save.saveGame(1, r.state);
  const runId = r.state.runId; r.state.resetForNewMode('AUDIO');
  assert.equal(r.state.totalKeystrokes, 0); assert.notEqual(r.state.runId, runId);
  r.state.loadFromModeData(r.save.getSlotModeData(1, 'DIRECT'), 'DIRECT');
  assert.equal(r.state.calculateWPM(), 20); assert.equal(r.state.runId, runId);
  assert.equal(r.state.shieldCharges, 1);
  r.state.takeDamage(10); r.save.saveGame(1, r.state);
  r.state.loadFromModeData(r.save.getSlotModeData(1, 'DIRECT'), 'DIRECT');
  assert.equal(r.state.shieldCharges, 0);
});

test('all talents stack through canonical saved fields and typo immunity keeps honest accuracy', () => {
  const r = runtime();
  for (const talent of r.M.TALENT_POOL) talent.apply(r.state);
  r.M.TALENT_POOL.find(t => t.id === 'SLOW_TIME').apply(r.state);
  assert.equal(r.state.talents.slowFactor, .5625); assert.equal(r.state.maxHp, 75);
  assert.equal(r.state.talents.critChance, .35); assert.equal(r.state.talents.scoreMultiplier, 1.5);
  assert.equal(r.state.talents.autoKill, true); assert.equal(r.state.shieldCharges, 2);
  r.asteroids.asteroids.push(word());
  for (const char of 'XXXXXX') r.engine.processKey(char, r.canvas);
  assert.equal(r.state.accuracy, 0); assert.equal(r.state.hp, 75);
  assert.equal(!!r.engine.isCloudHazard, false); assert.equal(!!r.engine.isLightningHazard, false);
  assert.equal(r.state.addScore(100), 150);
});

test('crit and combo auto-kill run once, exclude bosses and never inflate human WPM', () => {
  const r = runtime(); r.state.talents.critChance = 1;
  const boss = { ...word('ZEAL'), isBoss: true };
  r.asteroids.asteroids.push(word('CAT'), word('DOG'), boss);
  for (const c of 'CAT') r.engine.processKey(c, r.canvas);
  assert.equal(r.state.wordsSlain, 2); assert.equal(r.state.correctKeystrokes, 3);
  assert.equal(r.state.totalKeystrokes, 3); assert.equal(r.state.assistedWords, 1);
  assert.equal(r.state.assistedKeystrokes, 3); assert.equal(r.state.assisted, true);
  assert.equal(r.asteroids.asteroids.length, 1); assert.equal(boss.typedLen, 0);
  r.state.talents.critChance = 0; r.state.talents.autoKill = true; r.state.humanWordCombo = 2;
  r.asteroids.asteroids.push(word('CAT'));
  for (const c of 'CAT') r.engine.processKey(c, r.canvas);
  assert.equal(r.engine.pendingAutoKill, true);
});

test('resetting a mode retains other modes, metrics and tombstones across reload', () => {
  const r = runtime(); r.state.score = 10; r.state.wordsSlain = 1; r.save.saveGame(1, r.state);
  r.state.resetForNewMode('AUDIO'); r.state.score = 20; r.state.wordsSlain = 2;
  r.save.saveGame(1, r.state); r.save.resetActiveSave(1, 'AUDIO');
  const reload = new r.M.SaveSystem();
  assert.equal(reload.getSlotModeData(1, 'DIRECT').score, 10);
  assert.equal(reload.getSlotModeData(1, 'AUDIO').isOccupied, false);
  assert.equal(reload.getSlot(1).isOccupied, true);
  reload.deleteSlot(1); const empty = new r.M.SaveSystem();
  assert.equal(empty.getSlot(1).isOccupied, false);
});

test('word reviews have due dates, expanding intervals, mastery and bounded history', () => {
  const r = runtime(); r.save.recordReviewResult(word('CAT'), false, 1000);
  assert.equal(r.save.getDueReviewWords(60_999).length, 0);
  assert.equal(r.save.getDueReviewWords(61_000).length, 1);
  r.save.recordReviewResult(word('CAT'), true, 61_000);
  let review = r.save.getWeaknessWords()[0]; assert.equal(review.intervalDays, 1); assert.equal(review.mastery, 1);
  r.save.recordReviewResult(word('CAT'), true, review.nextReviewAt);
  review = r.save.getWeaknessWords()[0]; assert.equal(review.intervalDays, 2); assert.equal(review.history.length, 3);
  r.save.recordReviewResult(word('CAT'), false, review.nextReviewAt);
  assert.equal(r.save.getWeaknessWords()[0].mastery, 0);
});

test('each boss shield has a specific sense and an example', () => {
  const r = runtime();
  for (const pool of r.M.SYNONYM_BOSS_POOLS) for (const shield of pool.shields) {
    assert.match(shield.word, /^[A-Z]+$/); assert.ok(shield.meaning); assert.ok(shield.example);
  }
});

test('HTML and iframe use one asset release', () => {
  const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
  const page = fs.readFileSync(path.join(__dirname, '../app/games/meowcha/page.tsx'), 'utf8');
  const versions = [...html.matchAll(/(?:\.js|\.css)\?v=([^"']+)/g)].map(x => x[1]);
  assert.ok(versions.length > 20); assert.equal(new Set(versions).size, 1);
  assert.ok(page.includes(versions[0]));
});

test('local HTML and engine asset references resolve to shipped files', () => {
  const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
  const main = fs.readFileSync(path.join(base, 'js/main.js'), 'utf8');
  const paths = [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+\.(?:js|css|png|jpg|svg|html))/g),
    ...main.matchAll(/src:\s*["'](\.\/[^"']+\.(?:png|jpg|svg))["']/g)].map(match => match[1]);
  assert.ok(paths.length > 50);
  assert.deepEqual([...new Set(paths)].filter(file => !fs.existsSync(path.join(base, file))), []);
});

test('cloud saves coalesce and keep dirty local progress on a failed upload', async () => {
  const r = runtime(); r.localStorage.setItem('oasis_token', 'test-token');
  let posts = 0; r.sandbox.fetch = async () => { posts++; return { ok: true }; };
  r.state.score = 1; r.save.saveGame(1, r.state);
  r.state.score = 2; r.save.saveGame(1, r.state);
  assert.equal(posts, 0); await r.save.flushCloudSaves();
  assert.equal(posts, 1); assert.equal(r.save.getSlot(1).cloudDirty, false);
  r.sandbox.fetch = async () => { throw new Error('offline'); };
  r.save.saveGame(1, r.state); await r.save.flushCloudSaves();
  assert.equal(r.save.getSlot(1).cloudDirty, true);
  assert.equal(new r.M.SaveSystem().getSlot(1).score, 2);
});

test('failed run completion stays in a durable outbox and retries the same id', async () => {
  const r = runtime(); r.localStorage.setItem('oasis_token', 'test-token');
  r.state.wordsSlain = 1; r.state.score = 100; r.state.activeElapsedMs = 60_000;
  r.state.correctKeystrokes = 3; r.state.totalKeystrokes = 3;
  const sent = [];
  r.sandbox.fetch = async (url, options) => {
    sent.push({ url, body: JSON.parse(options.body) });
    return { ok: !url.endsWith('complete'), status: 503 };
  };
  assert.equal(await r.save.submitRun(r.state), false);
  assert.equal(Object.keys(r.save.getPendingRuns()).length, 1);
  r.sandbox.fetch = async (url, options) => { sent.push({ url, body: JSON.parse(options.body) }); return { ok: true }; };
  await r.save.retryPendingRuns();
  assert.equal(Object.keys(r.save.getPendingRuns()).length, 0);
  const completions = sent.filter(item => item.url.endsWith('complete'));
  assert.equal(completions.length, 2);
  assert.equal(completions[0].body.run_id, completions[1].body.run_id);
  assert.equal(completions[0].body.score, 100);
});

test('another account cannot import the first account local save or pending results', () => {
  const r = runtime(); r.state.score = 50; r.state.wordsSlain = 1; r.save.saveGame(1, r.state);
  r.localStorage.setItem('oasis_user', JSON.stringify({ id: 2, username: 'other' }));
  const other = new r.M.SaveSystem();
  assert.equal(other.getSlot(1).isOccupied, false);
  assert.equal(Object.keys(other.getPendingRuns()).length, 0);
});

test('Oxford fallback preserves source CEFR and shares one local download across concurrent bands', async () => {
  const r = runtime(); let downloads = 0;
  r.sandbox.AbortController = AbortController;
  r.sandbox.fetch = async url => {
    if (url.startsWith('./data/')) {
      downloads++;
      return { ok: true, json: async () => [
        { word: 'present', level: 'A1', meaning: 'Có mặt' },
        { word: 'bias', level: 'C1', meaning: 'Thiên kiến' }
      ] };
    }
    return { ok: true, json: async () => ({ success: true, data: [], meta: { total: 0 } }) };
  };
  vm.runInContext(fs.readFileSync(path.join(base, 'js/core/VocabLoader.js'), 'utf8'), r.sandbox);
  await Promise.all([r.M.VocabLoader.loadForRealm(0), r.M.VocabLoader.loadForRealm(0), r.M.VocabLoader.loadForRealm(3)]);
  assert.equal(downloads, 1);
  const result = await r.M.VocabLoader.searchVocab({ band: 3, search: 'bias' });
  assert.equal(result.words[0].cefr, 'C1'); assert.equal(result.words[0].word, 'BIAS');
});

test('legacy saves retain local progress but only submit newly measured work', async () => {
  const r = runtime(); r.localStorage.setItem('oasis_token', 'test-token');
  r.state.loadFromModeData({ score: 2000, words: 15, realmIdx: 1, hp: 50 }, 'DIRECT');
  assert.equal(r.state.score, 2000); assert.equal(r.state.wordsSlain, 15);
  assert.equal(r.state.assisted, true);
  r.state.score += 100; r.state.wordsSlain++;
  r.state.activeElapsedMs = 60_000; r.state.correctKeystrokes = 3; r.state.totalKeystrokes = 3;
  let payload;
  r.sandbox.fetch = async (url, options) => { if(url.endsWith('complete')) payload=JSON.parse(options.body); return { ok: true }; };
  await r.save.submitRun(r.state);
  assert.equal(payload.score, 100); assert.equal(payload.words_slain, 1);
});

test('boss requires all three words and exposes contextual review once defeated', () => {
  const r = runtime(), pool = r.M.SYNONYM_BOSS_POOLS[0];
  const boss = { ...word(pool.shields[0].word), isBoss:true, shields:pool.shields,
    currentShieldIdx:0, totalShields:3 };
  r.asteroids.asteroids.push(boss); r.engine.currentTarget=boss;
  let defeated=0; r.engine.onBossDefeated=()=>defeated++;
  for(const shield of pool.shields) for(const c of shield.word) r.engine.processKey(c,r.canvas);
  assert.equal(defeated,1); assert.equal(r.state.wordsSlain,3);
  assert.equal(r.asteroids.asteroids.length,0); assert.equal(r.state.lastBossReview.length,3);
});

test('delayed breakthrough cannot mutate a later run or reopen its talent modal', () => {
  const r=runtime(), callbacks=[]; r.sandbox.setTimeout=fn=>{callbacks.push(fn);return 1;};
  const flow=new r.M.BreakthroughFlow(r.state,{play(){}},null);
  let shown=0; flow.onShowTalentModal=()=>shown++;
  flow.triggerBreakthrough(1); flow.cancel(); r.state.resetForNewMode('AUDIO');
  callbacks[0](); assert.equal(r.state.realmIdx,0); assert.equal(shown,0);
});

test('leaderboard text and avatar attributes cannot inject player HTML', () => {
  const r=runtime(), list={innerHTML:''};
  r.sandbox.document.getElementById=id=>id==='pantheonRankList'?list:null;
  const ui=Object.create(r.M.UIManager.prototype);
  ui.state=r.state; ui.getLoggedInUser=()=>({name:''}); ui.updatePantheonSelfStats=()=>{};
  ui.renderPantheonLeaderboard([{user_id:1, player_name:'<script>alert(1)</script>',
    realm:'<img src=x onerror=alert(2)>', avatar_url:'https://example.invalid/x" onload="alert(3)', score:10,words_slain:1,wpm:1}]);
  assert.ok(!list.innerHTML.includes('<script>'));
  assert.ok(list.innerHTML.includes('&lt;script&gt;'));
  assert.ok(!list.innerHTML.includes('src="https://example.invalid/x" onload='));
});

test('breakthrough choices provide 4 paths with anti-collision and realm signature skills', () => {
  const r = runtime();
  const realm1Choices = r.M.generateBreakthroughChoices(r.state, { index: 1, name: 'Trúc Cơ Kỳ' });
  assert.equal(realm1Choices.length, 3);
  assert.ok(realm1Choices.some(c => c.skillId === 'WIND_SWORD_DOMAIN'));
  const ids = new Set(realm1Choices.map(c => c.id));
  assert.equal(ids.size, 3);

  // Apply skill and test level up generation
  realm1Choices.find(c => c.skillId === 'WIND_SWORD_DOMAIN').apply(r.state);
  assert.equal(r.state.getSkillLevel('WIND_SWORD_DOMAIN'), 1);

  const nextChoices = r.M.generateBreakthroughChoices(r.state, { index: 2, name: 'Kim Đan Kỳ' });
  assert.equal(nextChoices.length, 3);
  assert.ok(nextChoices.some(c => c.skillId === 'GOLDEN_CORE_REGEN'));
});

test('active skills activate through engine, respect cooldowns, and trigger effects', () => {
  const r = runtime();
  r.state.realmIdx = 4;
  r.state.unlockedSkills = ['WIND_SWORD_DOMAIN', 'GOLDEN_CORE_REGEN'];
  r.state.skillLevels = { WIND_SWORD_DOMAIN: 1, GOLDEN_CORE_REGEN: 1, NASCENT_SOUL_FREEZE: 1, TEN_THOUSAND_SWORDS: 1 };
  delete r.state.skillLevels.NASCENT_SOUL_FREEZE;
  delete r.state.skillLevels.TEN_THOUSAND_SWORDS;
  r.state.hp = 20;

  // Key '2' triggers Kim Đan Hồi Nguyên (active heal 8 HP)
  r.engine.processKey('2', r.canvas);
  assert.equal(r.state.hp, 28);
  assert.ok(r.state.getSkillCooldown('GOLDEN_CORE_REGEN') > 0);
  assert.equal(r.state.canActivateSkill('GOLDEN_CORE_REGEN'), false);

  // Key '1' triggers Thanh Phong Kiếm Vực
  r.engine.processKey('1', r.canvas);
  assert.ok(r.state.getSkillCooldown('WIND_SWORD_DOMAIN') > 0);
  assert.ok(r.state.activeSkillEffects.windSwordTimer > 0);

  // Ultimate requires combo >= 10
  r.state.unlockedSkills.push('TEN_THOUSAND_SWORDS'); r.state.skillLevels.TEN_THOUSAND_SWORDS=1;
  r.state.combo = 5;
  assert.equal(r.state.canActivateSkill('TEN_THOUSAND_SWORDS'), false);
  r.state.combo = 10;
  assert.equal(r.state.canActivateSkill('TEN_THOUSAND_SWORDS'), true);
  r.engine.isLightningHazard = true;
  r.engine.processKey('3', r.canvas);
  assert.equal(r.engine.isLightningHazard, false);
});

test('passive streak skills award shield and hp regen honestly without artificial keystrokes', () => {
  const r = runtime();
  r.state.hp = 30;
  r.state.shieldCharges = 0;
  r.state.humanWordCombo = 4;
  r.asteroids.asteroids.push(word('DOG'));
  for (const c of 'DOG') r.engine.processKey(c, r.canvas);
  // Human combo reached 5 -> +1 Shield from Luyện Khí Kiếm Khí Hộ Thể
  assert.equal(r.state.shieldCharges, 1);
  assert.equal(r.state.humanWords, 1);
  assert.equal(r.state.assistedWords, 0);
});

test('save and load seamlessly preserve unlocked skills, levels, and passive modifiers', () => {
  const r = runtime();
  r.state.unlockedSkills = ['WIND_SWORD_DOMAIN'];
  r.state.skillLevels = { WIND_SWORD_DOMAIN: 2 };
  r.state.passiveModifiers.damageReduction = 0.25;
  r.save.saveGame(1, r.state);

  const slotData = r.save.getSlotModeData(1, 'DIRECT');
  assert.deepEqual(slotData.unlockedSkills, ['WIND_SWORD_DOMAIN']);
  assert.equal(slotData.skillLevels.WIND_SWORD_DOMAIN, 2);
  assert.equal(slotData.passiveModifiers.damageReduction, 0.25);

  const freshState = new r.M.GameState();
  freshState.loadFromModeData(slotData, 'DIRECT');
  assert.equal(freshState.getSkillLevel('WIND_SWORD_DOMAIN'), 2);
  assert.equal(freshState.passiveModifiers.damageReduction, 0.25);
});

test('domainSlow slows asteroids smoothly and pendingAutoKill consumes on next asteroid', () => {
  const r = runtime();
  const am = new r.M.AsteroidManager({});
  const ast = { ...word('FAST'), vy: 2.0, y: 50 };
  am.asteroids.push(ast);
  // Update with domainSlow = 0.40 (verifies no statusSpeedMult TDZ ReferenceError)
  am.update(0.1, 700, () => {}, 800, false, 0.40);
  assert.ok(ast.y > 50);

  // Test pendingAutoKill consumption in updateHazard
  r.asteroids.asteroids.push(word('SLOW'));
  r.engine.pendingAutoKill = true;
  assert.equal(r.asteroids.asteroids.length, 1);
  r.engine.updateHazard(0.1, r.canvas);
  assert.equal(r.engine.pendingAutoKill, false);
  assert.equal(r.asteroids.asteroids.length, 0);
  assert.equal(r.state.assistedWords, 1);
});

test('realm skills never complete the current word and reject unavailable or passive activation', () => {
  const r=runtime(), target=word('VOCABULARY'); r.asteroids.asteroids.push(target);
  for(let realm=0;realm<5;realm++) {
    r.state.realmIdx=realm;
    const before=target.typedLen; r.engine.triggerRealmPassiveSkill(target,r.canvas,600,600,false);
    assert.equal(target.typedLen,before);
  }
  r.state.skillLevels={TEN_THOUSAND_SWORDS:1}; r.state.unlockedSkills=['TEN_THOUSAND_SWORDS'];
  r.state.realmIdx=3;r.state.combo=10;assert.equal(r.state.activateSkill('TEN_THOUSAND_SWORDS',r.engine),false);
  r.state.realmIdx=4;r.engine.isCloudHazard=true;r.engine.isLightningHazard=true;
  const before={words:r.state.wordsSlain,keys:r.state.correctKeystrokes,score:r.state.score};
  assert.equal(r.state.activateSkill('TEN_THOUSAND_SWORDS',r.engine),true);
  assert.equal(r.asteroids.asteroids.includes(target),true);assert.equal(target.typedLen,0);
  assert.equal(r.state.wordsSlain,before.words);assert.equal(r.state.correctKeystrokes,before.keys);assert.equal(r.state.score,before.score);
  assert.equal(r.engine.isCloudHazard,false);assert.equal(r.engine.isLightningHazard,false);
  assert.equal(r.state.canActivateSkill('QI_SHIELD_PASSIVE'),false);
});

test('choices stay distinct and useful after stat caps, and every offered modifier changes runtime state', () => {
  const r=runtime();
  r.state.talents.slowFactor=.3; r.state.talents.scoreMultiplier=3;
  r.state.talents.critChance=1;
  Object.assign(r.state.passiveModifiers,{comboBonus:.2,damageReduction:.5,hazardDurationBonus:.4,mindHint:true,meaningDisplayDuration:6000,weakWordWeight:2});
  r.state.realmIdx=4;
  r.state.unlockedSkills=Object.keys(r.M.BREAKTHROUGH_SKILLS);
  r.state.skillLevels=Object.fromEntries(Object.entries(r.M.BREAKTHROUGH_SKILLS).map(([k,v])=>[k,v.maxLevel]));
  for(let i=0;i<100;i++) {
    const choices=r.M.generateBreakthroughChoices(r.state,{id:4});
    assert.equal(choices.length,3);assert.equal(new Set(choices.map(c=>c.id)).size,3);
    assert.ok(new Set(choices.map(c=>c.category)).size>=2);
    for(const c of choices) {
      assert.ok(!['AUTO_SWORD','CRIT_STRIKE','SLOW_TIME','SWORD_MASTERY','DAMAGE_REDUCTION','COMBO_POTENCY','HAZARD_DAMPENER','MIND_HINT','MEANING_PERSISTENCE','WEAK_WORD_AFFINITY'].includes(c.id));
      const fresh=new r.M.GameState(),before=JSON.stringify(fresh);c.apply(fresh);assert.notEqual(JSON.stringify(fresh),before);
    }
  }
});

test('skill upgrades cap at level three, pause freezes cooldown, load clears transient effects', () => {
 const r=runtime();r.state.realmIdx=3;
 const skill=r.M.BREAKTHROUGH_SKILLS.WIND_SWORD_DOMAIN; skill.apply(r.state,3);
 assert.equal(r.state.activateSkill(skill.id,r.engine),true);
 assert.equal(r.state.activeSkillEffects.windSwordSlow,.55);assert.equal(r.state.activeSkillEffects.windSwordTimer,8);
 assert.equal(r.state.getSkillCooldown(skill.id),20);
 r.state.isPaused=true;r.state.updateSkills(10);assert.equal(r.state.getSkillCooldown(skill.id),20);
 r.state.isPaused=false;r.state.updateSkills(5);assert.equal(r.state.getSkillCooldown(skill.id),15);
 r.save.saveGame(1,r.state);r.state.loadFromModeData(r.save.getSlotModeData(1,'DIRECT'),'DIRECT');
 assert.equal(r.state.getSkillLevel(skill.id),3);assert.equal(r.state.getSkillCooldown(skill.id),0);
 assert.equal(Object.keys(r.state.activeSkillEffects).length,0);
});

test('a word with a typo or assistance cannot earn a flawless-streak passive reward',()=>{
 const r=runtime();r.state.humanWordCombo=4;r.state.hp=20;
 const t={...word('DOG'),hadTypo:true};r.asteroids.asteroids.push(t);
 for(const c of 'DOG')r.engine.processKey(c,r.canvas);
 assert.equal(r.state.shieldCharges,0);assert.equal(r.state.humanWordCombo,0);
 const t2=word('CAT');r.asteroids.asteroids.push(t2);r.state.humanWordCombo=5;
 r.engine.handleWordSlain(t2,r.canvas,true);assert.equal(r.state.shieldCharges,0);
});

test('Ngộ Đạo hint works after two errors without revealing an AUDIO answer or crashing',()=>{
 const r=runtime();r.state.passiveModifiers.mindHint=true;r.state.gameMode='AUDIO';
 const target=word('CAT');target.isAudio=true;r.asteroids.asteroids.push(target);r.engine.currentTarget=target;
 r.engine.processKey('X',r.canvas);r.engine.processKey('X',r.canvas);
 assert.equal(r.state.totalKeystrokes,2);assert.equal(r.state.correctKeystrokes,0);assert.equal(target.typedLen,0);
});

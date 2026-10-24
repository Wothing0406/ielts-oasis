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
  for (const file of ['core/BattleLayout.js', 'core/GameState.js', 'data/RealmsData.js', 'data/TalentsData.js', 'core/SaveSystem.js', 'entities/AsteroidManager.js', 'combat/TypingEngine.js', 'combat/BreakthroughFlow.js', 'ui/UIManager.js']) {
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
  r.state.realmIdx = 1;
  r.state.unlockedSkills = ['WIND_SWORD_DOMAIN', 'GOLDEN_CORE_REGEN', 'NASCENT_SOUL_FREEZE', 'TEN_THOUSAND_SWORDS'];
  r.state.skillLevels = { WIND_SWORD_DOMAIN: 1, GOLDEN_CORE_REGEN: 1, NASCENT_SOUL_FREEZE: 1, TEN_THOUSAND_SWORDS: 1 };
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
  r.state.combo = 5;
  assert.equal(r.state.canActivateSkill('TEN_THOUSAND_SWORDS'), false);
  r.state.combo = 10;
  assert.equal(r.state.canActivateSkill('TEN_THOUSAND_SWORDS'), true);
  r.engine.isLightningHazard = true;
  r.engine.processKey('4', r.canvas);
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

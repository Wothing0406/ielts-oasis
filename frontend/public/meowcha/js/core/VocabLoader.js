/**
 * VocabLoader.js - Bộ Triệu Hồi Đan Dược Từ Điển Oxford 5000
 * Singleton fetch từ API backend `/api/meowcha/vocab`, cache per band, hỗ trợ tìm kiếm & phân trang, fallback về static WordDecks.
 */
(function(root) {
  const CACHE = {};
  const FETCH_STATE = {};
  const PENDING = {};
  let localOxfordPromise;
  const loadLocalOxford = () => {
    if (!localOxfordPromise) localOxfordPromise = fetch('./data/oxford_5000.json?v='+(root.Meowcha.RELEASE||'17.0')).then(r => {
      if (!r.ok) throw new Error('Local Oxford unavailable');
      return r.json().then(data => { if(root.Meowcha.registerLearningLexicon) root.Meowcha.registerLearningLexicon(data); return data; });
    }).catch(err => { localOxfordPromise = null; throw err; });
    return localOxfordPromise;
  };

  const API_BASE = '/api/meowcha/vocab';
  const WORDS_PER_BAND = 2500;

  function _fetchBand(bandIdx) {
    const key = String(bandIdx);
    if (PENDING[key]) return PENDING[key];
    PENDING[key] = _fetchBandOnce(bandIdx).finally(() => { delete PENDING[key]; });
    return PENDING[key];
  }

  async function _fetchBandOnce(bandIdx) {
    const key = String(bandIdx);
    if (CACHE[key] && CACHE[key].length > 0) return CACHE[key];
    if (FETCH_STATE[key] === 'loading') return null;

    FETCH_STATE[key] = 'loading';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(API_BASE + '?band=' + bandIdx + '&limit=' + WORDS_PER_BAND, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const res = await resp.json();
      const rawWords = Array.isArray(res.data) ? res.data : (res.data && res.data.words ? res.data.words : (res.words || []));
      
      // Khử triệt để trùng lặp từ vựng
      const seenMap = new Map();
      if (Array.isArray(rawWords)) {
        for (let i = 0; i < rawWords.length; i++) {
          const w = rawWords[i];
          const wText = (w.word || '').trim().toUpperCase();
          if (!wText || wText.length < 3) continue;
          if (!seenMap.has(wText)) {
            seenMap.set(wText, {
              id: w.id || (bandIdx * 10000 + i),
              word: wText,
              ipa: w.ipa || w.phonetic || w.default_ipa || '/.../',
              meaning: w.meaning || w.definition || w.vietnamese || '',
              type: w.type || w.pos || w.part_of_speech || 'vocab',
              audio_url: w.audio_url || '',
              cefr: w.cefr || w.level || null,
              example: w.example || '',
              band_level: w.band_level !== undefined ? w.band_level : bandIdx,
              asteroid_type: w.asteroid_type || 'FROST'
            });
          }
        }
      }
      const words = Array.from(seenMap.values());
      try {
        const dictionary = await loadLocalOxford();
        const details = new Map(dictionary.map(w => [String(w.word).trim().toUpperCase(), w]));
        for (const word of words) {
          const entry = details.get(word.word);
          if (!entry) continue;
          if (!word.ipa || word.ipa === '/.../') word.ipa = entry.phonetic || entry.ipa || '';
          if (!word.audio_url) word.audio_url = entry.audio_url || '';
          if (!word.meaning) word.meaning = entry.meaning || '';
          if (!word.cefr) word.cefr = entry.level || null;
        }
      } catch (_) { /* API words remain usable when the optional local dictionary is unavailable. */ }

      if (words.length === 0) throw new Error('Empty response');
      if(root.Meowcha.normalizeLearningWord) words.forEach((w,i) => { words[i] = root.Meowcha.normalizeLearningWord(w); });
      CACHE[key] = words;
      FETCH_STATE[key] = 'done';
      var M = root.Meowcha || {};
      if (M.REALM_DECKS) {
        M.REALM_DECKS[bandIdx] = words;
      }
      return words;
    } catch (err) {
      console.warn('[VocabLoader] API fetch failed, trying local static ./data/oxford_5000.json:', err.message);
      try {
        {
          const allOxford = await loadLocalOxford();
          if (Array.isArray(allOxford)) {
            const levelMap = { 0: ['A1', 'A2'], 1: ['B1'], 2: ['B2'], 3: ['C1'] };
            const targetLevels = levelMap[bandIdx] || ['A1', 'A2'];
            const filtered = allOxford.filter(w => targetLevels.includes(w.level) && w.word && w.word.length >= 3 && !w.word.includes(' ') && !w.word.includes('-'));
            const words = filtered.map((w, i) => ({
              id: bandIdx * 10000 + i,
              word: w.word.trim().toUpperCase(),
              ipa: w.phonetic || '/.../',
              meaning: w.meaning || '',
              type: w.type || 'vocab',
              audio_url: w.audio_url || '',
              cefr: w.level || null,
              example: w.example || '',
              band_level: bandIdx,
              asteroid_type: bandIdx === 0 ? 'FROST' : bandIdx === 1 ? 'FIRE' : bandIdx === 2 ? 'VOID' : 'THUNDER'
            }));
            if (words.length > 0) {
              CACHE[key] = words;
              FETCH_STATE[key] = 'done';
              var M = root.Meowcha || {};
              if (M.REALM_DECKS) M.REALM_DECKS[bandIdx] = words;
              console.log(`[VocabLoader] Loaded ${words.length} Oxford words from local static data for Band ${bandIdx}`);
              return words;
            }
          }
        }
      } catch (localErr) {
        console.warn('[VocabLoader] Local static fetch failed:', localErr.message);
      }
      FETCH_STATE[key] = 'error';
      return _getStaticFallback(bandIdx);
    }
  }

  function _getStaticFallback(bandIdx) {
    var M = root.Meowcha || {};
    var decks = M.REALM_DECKS || {};
    var key = String(bandIdx);
    var deck = decks[bandIdx] || decks[0] || [];
    CACHE[key] = deck;
    FETCH_STATE[key] = 'done';
    return deck;
  }

  async function loadForRealm(realmIdx) {
    var band = Math.max(0, Math.min(3, realmIdx));
    return await _fetchBand(band);
  }

  async function preloadAllBands() {
    try {
      await Promise.all([0, 1, 2, 3].map(b => _fetchBand(b)));
      console.log('[VocabLoader] Đã nạp thành công các cảnh giới từ vựng Oxford 5000 vào bộ nhớ game.');
    } catch (e) {
      console.warn('[VocabLoader] Preload thất bại, dùng fallback:', e);
    }
  }

  async function searchVocab({ band = 0, search = '', page = 1, pageSize = 20 } = {}) {
    try {
      const params = new URLSearchParams();
      if (band !== null && band !== undefined) params.append('band', band);
      if (search && search.trim()) params.append('search', search.trim());
      params.append('page', page);
      params.append('page_size', pageSize);

      const resp = await fetch(`${API_BASE}?${params.toString()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const res = await resp.json();
      if (res.success && res.data) {
        const rawList = Array.isArray(res.data) ? res.data : (res.data.words || []);
        const wordsList = rawList.map(function(w) {
          return {
            id:      w.id,
            word:    (w.word || '').toUpperCase(),
            ipa:     w.ipa || w.phonetic || w.default_ipa || '/.../',
            meaning: w.meaning || w.definition || w.vietnamese || '',
            type:    w.type || w.pos || w.part_of_speech || 'vocab',
            audio_url: w.audio_url || '',
            cefr: w.cefr || w.level || null,
            example: w.example || '',
            band_level: w.band_level !== undefined ? w.band_level : band,
            asteroid_type: w.asteroid_type || 'FROST'
          };
        }).filter(function(w) { return w.word && w.word.length > 0; })
          .map(w => root.Meowcha.normalizeLearningWord ? root.Meowcha.normalizeLearningWord(w) : w);

        const totalCount = (res.meta && res.meta.total !== undefined)
          ? res.meta.total
          : ((res.data && res.data.total_matches !== undefined) ? res.data.total_matches : wordsList.length);
        const curPage = (res.meta && res.meta.page) || page;
        const curPageSize = (res.meta && res.meta.page_size) || pageSize;
        const hasMore = (res.meta && res.meta.has_more !== undefined)
          ? res.meta.has_more
          : (curPage * curPageSize < totalCount);

        if (wordsList.length || totalCount > 0) {
          return { words: wordsList, total: totalCount, page: curPage, hasMore };
        }
      }
    } catch (e) {
      console.warn('[VocabLoader.searchVocab] Fallback to local memory:', e.message);
    }

    // Fallback tìm kiếm trên cache hoặc static deck
    let pool;
    if (band === null || band === undefined) {
      await preloadAllBands();
      pool = [...new Map(Object.values(CACHE).flat().map(w => [w.word, w])).values()];
    } else {
      pool = CACHE[String(band)] || await _fetchBand(band);
    }
    if (search && search.trim()) {
      const q = search.trim().toUpperCase();
      pool = pool.filter(w => w.word.includes(q) || (w.meaning && w.meaning.toUpperCase().includes(q)));
    }
    const start = (page - 1) * pageSize;
    const paged = pool.slice(start, start + pageSize);
    return {
      words: paged,
      total: pool.length,
      page: page,
      hasMore: start + pageSize < pool.length
    };
  }

  async function searchAllOxford({ search = '', page = 1, pageSize = 20 } = {}) {
    const source = await loadLocalOxford();
    const query = search.trim().toLocaleUpperCase('vi');
    const words = source.map((w, i) => ({ id:'oxford-' + i, word:(w.word || '').trim().toUpperCase(),
      ipa:w.phonetic || w.ipa || '', meaning:w.meaning || '', type:w.type || '',
      audio_url:w.audio_url || '', cefr:w.level || null, example:w.example || '' }))
      .filter(w => w.word && (!query || w.word.includes(query) || w.meaning.toLocaleUpperCase('vi').includes(query)));
    const offset = Math.max(0, page - 1) * pageSize;
    return { words:words.slice(offset, offset + pageSize), total:words.length, page,
      hasMore:offset + pageSize < words.length };
  }

  function getRandomWords(bandIdx, n, deckId) {
    n = n || 12;
    var M = root.Meowcha || {};
    var activeDeck = deckId || (M.app && M.app.gameState && M.app.gameState.activeDeckId) || "oxford_5000";

    // 1. Nếu chọn Ngọc Giản chuyên sâu (Listening 1200 / Reading Academic / Flashcard SRS)
    if (activeDeck && activeDeck !== "oxford_5000" && M.TANG_KINH_DECKS) {
      const specializedDeck = M.TANG_KINH_DECKS.find(d => d.id === activeDeck);
      if (specializedDeck && specializedDeck.words && specializedDeck.words.length > 0) {
        const pool = specializedDeck.words;
        const result = [];
        const used = {};
        const attempts = pool.length * 2;
        for (let i = 0; i < attempts && result.length < n; i++) {
          const idx = Math.floor(Math.random() * pool.length);
          if (!used[idx]) {
            used[idx] = true;
            result.push(pool[idx]);
          }
        }
        if (result.length > 0) return result;
      }
    }

    var key = String(Math.max(0, Math.min(3, bandIdx)));
    var pool = CACHE[key];
    if (!pool || pool.length === 0) pool = _getStaticFallback(bandIdx);
    if (!pool || pool.length === 0) return [];
    var result = [];
    var used = {};
    var attempts = pool.length * 2;
    for (var i = 0; i < attempts && result.length < n; i++) {
      var idx = Math.floor(Math.random() * pool.length);
      if (!used[idx]) {
        used[idx] = true;
        result.push(pool[idx]);
      }
    }
    return result;
  }

  function isReady(bandIdx) {
    return FETCH_STATE[String(bandIdx)] === 'done';
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.VocabLoader = {
    loadForRealm: loadForRealm,
    preloadAllBands: preloadAllBands,
    searchVocab: searchVocab,
    searchAllOxford: searchAllOxford,
    getRandomWords: getRandomWords,
    isReady: isReady
  };
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * VocabLoader.js - Bộ Triệu Hồi Đan Dược Từ Điển Oxford 5000
 * Singleton fetch từ API backend `/api/meowcha/vocab`, cache per band, hỗ trợ tìm kiếm & phân trang, fallback về static WordDecks.
 */
(function(root) {
  const CACHE = {};
  const FETCH_STATE = {};

  const API_BASE = '/api/meowcha/vocab';
  const WORDS_PER_BAND = 2500;

  async function _fetchBand(bandIdx) {
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
              band_level: w.band_level !== undefined ? w.band_level : bandIdx,
              asteroid_type: w.asteroid_type || 'FROST'
            });
          }
        }
      }
      const words = Array.from(seenMap.values());

      if (words.length === 0) throw new Error('Empty response');
      CACHE[key] = words;
      FETCH_STATE[key] = 'done';
      var M = root.Meowcha || {};
      if (M.REALM_DECKS) {
        M.REALM_DECKS[bandIdx] = words;
      }
      return words;
    } catch (err) {
      FETCH_STATE[key] = 'error';
      console.warn('[VocabLoader] Band ' + bandIdx + ' fetch failed:', err.message, '-- sử dụng static fallback');
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
            band_level: w.band_level !== undefined ? w.band_level : band,
            asteroid_type: w.asteroid_type || 'FROST'
          };
        }).filter(function(w) { return w.word && w.word.length > 0; });

        const totalCount = (res.meta && res.meta.total !== undefined)
          ? res.meta.total
          : ((res.data && res.data.total_matches !== undefined) ? res.data.total_matches : wordsList.length);
        const curPage = (res.meta && res.meta.page) || page;
        const curPageSize = (res.meta && res.meta.page_size) || pageSize;
        const hasMore = (res.meta && res.meta.has_more !== undefined)
          ? res.meta.has_more
          : (curPage * curPageSize < totalCount);

        return {
          words: wordsList,
          total: totalCount,
          page: curPage,
          hasMore: hasMore
        };
      }
    } catch (e) {
      console.warn('[VocabLoader.searchVocab] Fallback to local memory:', e.message);
    }

    // Fallback tìm kiếm trên cache hoặc static deck
    let pool = CACHE[String(band)] || _getStaticFallback(band);
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

  function getRandomWords(bandIdx, n) {
    n = n || 12;
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
    getRandomWords: getRandomWords,
    isReady: isReady
  };
})(typeof window !== 'undefined' ? window : globalThis);

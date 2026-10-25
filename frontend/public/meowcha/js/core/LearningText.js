/* Keep one reviewed sense on the battlefield, including words restored from SRS. */
(function(root) {
  const M = root.Meowcha = root.Meowcha || {}, lexicon = new Map();
  M.registerLearningLexicon = function(source) {
    for(const entry of source || []) {
      const key = String(entry.word || '').trim().toUpperCase();
      const entries = lexicon.get(key) || [];
      if(!entries.some(e => e.type === entry.type)) entries.push(entry);
      lexicon.set(key, entries);
    }
  };
  M.normalizeLearningWord = function(item) {
    const result = {...item}, key = String(item.word || '').trim().toUpperCase();
    const pos = String(item.type || item.part_of_speech || '').split(/[,|/]/)[0].trim();
    const entries = lexicon.get(key) || [];
    const entry = entries.find(e => e.type === pos) || entries[0];
    const type = entry ? entry.type : pos;
    const fix = (M.MEANING_CORRECTIONS || {})[key.toLowerCase() + '|' + type];
    let meaning = fix || (entry && entry.meaning) || item.meaning || item.definition || '';
    if(/từ vựng học thuật/i.test(meaning)) meaning = '';
    result.meaning = meaning.split('|')[0].trim();
    result.type = type;
    if(entry) {
      result.cefr = entry.level || result.cefr;
      result.example = entry.example || result.example;
      if(!result.ipa || result.ipa === '/.../') result.ipa = entry.phonetic || entry.ipa || '';
      result.audio_url = result.audio_url || entry.audio_url || '';
    }
    return result;
  };
  M.primaryMeaning = value => String(value || '').split(/[;|]/)[0].trim();
  M.wrapLearningText = function(ctx, text, width) {
    const lines = []; let line = '';
    for(const word of String(text || '').split(/\s+/)) {
      if(!word) continue;
      if(ctx.measureText((line ? line + ' ' : '') + word).width <= width) { line += (line ? ' ' : '') + word; continue; }
      if(line) { lines.push(line); line = ''; }
      for(const char of word) {
        if(line && ctx.measureText(line + char).width > width) { lines.push(line); line = ''; }
        line += char;
      }
    }
    if(line) lines.push(line);
    return lines;
  };
})(typeof window !== 'undefined' ? window : globalThis);

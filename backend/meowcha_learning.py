"""Game-only reviewed senses; do not change the shared Oxford dataset."""
import json
import re
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parent


@lru_cache(maxsize=1)
def learning_lexicon():
    source = json.loads((ROOT / 'services/oxford_5000_cefr.json').read_text(encoding='utf-8'))
    fixes = json.loads((ROOT / 'game_data/meowcha_meaning_corrections.json').read_text(encoding='utf-8'))
    lexicon = {}
    for entry in source:
        item = dict(entry)
        key = str(item['word']).strip().lower()
        item['meaning'] = fixes.get(key + '|' + item.get('type', ''), item.get('meaning', ''))
        lexicon.setdefault(key, []).append(item)
    return lexicon


def normalize_word(item):
    result = dict(item)
    entries = learning_lexicon().get(str(item.get('word', '')).strip().lower(), [])
    pos = re.split(r'[,|/]', item.get('type') or item.get('part_of_speech') or '')[0].strip()
    entry = next((e for e in entries if e.get('type') == pos), entries[0] if entries else None)
    if entry:
        result.update(meaning=entry.get('meaning', ''), type=entry.get('type', ''),
                      cefr=entry.get('level'), example=entry.get('example', ''),
                      difficulty_source='oxford_lexicon')
        if not result.get('ipa') or result['ipa'] == '/.../':
            result['ipa'] = entry.get('phonetic', '')
        if not result.get('audio_url'):
            result['audio_url'] = entry.get('audio_url', '')
        result['senses'] = [{'type': e.get('type'), 'meaning': e.get('meaning')} for e in entries]
    else:
        meaning = str(result.get('meaning') or '')
        result['meaning'] = '' if 'từ vựng học thuật' in meaning.lower() else meaning.split('|')[0].strip()
    return result

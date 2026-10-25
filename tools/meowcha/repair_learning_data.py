"""Apply reviewed game-only glosses to shipped game data, not other vocabulary features."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[2]
fixes = json.loads((root / 'backend/game_data/meowcha_meaning_corrections.json').read_text(encoding='utf-8'))
target = root / 'frontend/public/meowcha/data/oxford_5000.json'
entries = json.loads(target.read_text(encoding='utf-8'))
changed = []
for entry in entries:
    key = entry['word'].lower() + '|' + entry['type'].lower()
    if key in fixes:
        entry['meaning'] = fixes[key]
        entry['memory_hook'] = f"{entry['word']}: {entry['meaning']}"
        changed.append(key)
assert not any('từ vựng học thuật' in entry.get('meaning', '').lower() for entry in entries)
target.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

decks = root / 'frontend/public/meowcha/js/data/WordDecks.js'
text = decks.read_text(encoding='utf-8')
def repair_block(match):
    block = match.group(0)
    word = re.search(r'"word":\s*"([^"]+)"', block)
    pos = re.search(r'"type":\s*"([^"]+)"', block)
    key = word[1].lower() + '|' + pos[1].lower() if word and pos else ''
    if key in fixes:
        block = re.sub(r'"meaning":\s*"(?:[^"\\]|\\.)*"', '"meaning": ' + json.dumps(fixes[key], ensure_ascii=False), block)
    return block
text = re.sub(r'\{\s*"word":\s*"[^}]+?\}', repair_block, text)
assert not re.search(r'"meaning":\s*"Từ vựng học thuật', text)
decks.write_text(text, encoding='utf-8')
generated = '/* Generated from backend/game_data/meowcha_meaning_corrections.json. */\n(function(root){root.Meowcha=root.Meowcha||{};root.Meowcha.MEANING_CORRECTIONS=' + json.dumps(fixes, ensure_ascii=False, indent=2) + ';})(typeof window!=="undefined"?window:globalThis);\n'
(root / 'frontend/public/meowcha/js/data/MeaningCorrections.js').write_text(generated, encoding='utf-8')
print(json.dumps({'reviewed_senses': len(fixes), 'updated_game_entries': len(changed), 'placeholder_remaining': 0}))

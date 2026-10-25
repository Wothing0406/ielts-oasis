"""Bump the same game asset version in the engine, parent page and local fixtures."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
version = sys.argv[1] if len(sys.argv) > 1 else '14.1'
assert re.fullmatch(r'\d+\.\d+', version)
for name in ('frontend/public/meowcha/index.html', 'frontend/app/games/meowcha/page.tsx',
             'frontend/public/meowcha/js/core/VocabLoader.js',
             'backend/tests/meowcha_preview.py', 'backend/tests/meowcha_qa.html'):
    path = ROOT / name
    text = path.read_text(encoding='utf-8')
    path.write_text(re.sub(r'\?v=\d+\.\d+', '?v=' + version, text), encoding='utf-8')

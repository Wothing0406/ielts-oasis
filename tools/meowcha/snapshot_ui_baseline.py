"""Freeze only engine text sources for visual comparison; reuse existing art via the fixture."""
import json
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
ref=sys.argv[1] if len(sys.argv)>1 else '0bfdb09'
revision=subprocess.check_output(['git','rev-parse',ref],cwd=ROOT,text=True).strip()
target=ROOT/'artifacts/meowcha-ui-baseline'
names=subprocess.check_output(['git','ls-tree','-r','--name-only',revision,'frontend/public/meowcha/js','frontend/public/meowcha/css'],cwd=ROOT,text=True).splitlines()
names.append('frontend/public/meowcha/index.html')
for name in names:
    output=target/Path(name).relative_to('frontend/public/meowcha')
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_bytes(subprocess.check_output(['git','show',revision+':'+name],cwd=ROOT))
(target/'source.json').write_text(json.dumps({'revision':revision,'files':len(names)}),encoding='utf-8')
print(json.dumps({'revision':revision,'files':len(names)}))

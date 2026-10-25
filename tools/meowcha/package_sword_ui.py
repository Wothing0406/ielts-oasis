"""Package the generated transparent master; no procedural illustration."""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image

source = Path(sys.argv[1])
destination = Path('frontend/public/meowcha/assets/ui/sword-command-v1.png')
image = Image.open(source).convert('RGBA')
bounds = image.getchannel('A').point(lambda alpha: 255 if alpha >= 32 else 0).getbbox()
assert bounds and image.getchannel('A').getextrema()[0] == 0
image = image.crop(bounds)
image.thumbnail((1080, 320), Image.Resampling.LANCZOS)
destination.parent.mkdir(parents=True, exist_ok=True)
image.save(destination, optimize=True)
print(json.dumps({'file': str(destination), 'size': image.size, 'source_size': Image.open(source).size,
    'alpha_bounds': bounds, 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest(), 'art_source': 'host_image'}, ensure_ascii=False))

for path in Path('frontend/public/meowcha/sprites/characters/realm0_qi_refining').rglob('*sheet.png'):
    print(str(path), Image.open(path).size)

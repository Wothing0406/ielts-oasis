"""Package approved generated raster masters, preserving their alpha."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path.home() / '.codex/generated_images/01a16e8b-2b14-76c3-8022-5ac4ae49ad97'
for source, name, width in [
    ('exec-b087160a-81dc-4acd-aa32-af23bfff5838.png', 'carved-plaque-v1.png', 1000),
    ('exec-55a993a7-e85b-4d6e-81ba-46bf8713014e.png', 'jade-frame-v1.png', 640),
]:
    image = Image.open(SOURCE / source).convert('RGBA')
    image = image.crop(image.getchannel('A').getbbox())
    image = image.resize((width, round(width * image.height / image.width)), Image.Resampling.LANCZOS)
    target = ROOT / 'frontend/public/meowcha/assets/ui' / name
    image.save(target, optimize=True)
    print(name, image.size, target.stat().st_size)

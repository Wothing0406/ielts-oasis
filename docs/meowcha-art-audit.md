# Meow-Cha art audit — release 2026.10.24.2

Runtime audited: `frontend/public/meowcha/index.html`, `UIManager.js`,
`XianxiaIcons.js`, `CatCultivator.js`, existing `assets/ui` and `sprites`.

| Group | Confirmed issue | Treatment |
| --- | --- | --- |
| Jade navigation | Tiny dark silhouettes, code-built polygon discs and unreadable labels | Reuse `menu_jade_cloud.png`; remove the clipped disc behind it; consistent cream functional icons, focus state and responsive labels |
| Functional icons | Mixed filter/glow treatment | Preserve existing game-icons silhouettes; consistent dimensions and contrast; don't replace functional SVGs with new illustrations |
| Character platform | Hidden polygon/ellipse placeholder and a floating character | Replace lobby geometry with `cultivation-dais-v1.png`; reuse the same authored stone/formation asset under the battle character |
| Formation/corners | A large luminous ring competes with the character; duplicate crude L-shaped corner generator | Remove the redundant lobby ring; engraved formation is part of the dais; reuse the existing cloud-corner asset in `meanderCorner()` |
| Buttons/mobile | Decorative tips compete with labels; keyboard loses visibility through a legacy desktop CSS rule; fixed pixel reserves overlap the altar | Hide decorative tips; keep keyboard rules consistent, expose explicit keyboard toggle; measure the input dock and use a side dock in short landscape |

Keep the existing pixel background and character sprites sharp. The palette remains
dark wood `#281711`, cinnabar `#761d20`, antique gold `#d4a849`, jade `#27685d` and
cream text. New contrast/focus/reduced-motion rules live in `meowcha-polish.css`;
legacy art rules were not globally deleted.

## New asset provenance and prompt

File: `frontend/public/meowcha/assets/ui/cultivation-dais-v1.png` (2062×763 RGBA).
Generated with the built-in image generation tool, then copied into the project.
It is an AI-created asset, not an illustration attributed to a human artist.

Prompt:

> A single isolated horizontal ancient dark jade/grey stone meditation dais for a
> Chinese xianxia pixel-art game; low three-quarter front view, wide flattened
> elliptical top with standing space for a small seated cat. Weathered stone,
> restrained carved auspicious clouds and antique-gold eight-trigram inlay. Crisp
> deliberate pixel clusters and stepped contours, charcoal slate, jade #27685D,
> gold #D4A849, tiny cream highlights. Transparent alpha; no character, environment,
> lettering, white matte, neon, bloom or particles. Entire platform contained,
> roughly 3:1, designed for about 230×85 CSS pixels.

The original full prompt was supplied to the built-in tool in this chat. No
external asset library was downloaded. Existing icon attribution is retained.

## Remaining art scope

The current work does not claim a bespoke illustrated set for every potion,
inventory item, mode medallion or modal frame. Those still use the existing
functional vector system. A full commissioned illustration/nine-slice pack would
be separate work; the good background and character sprites have been preserved.

# Asset pixel tạo ngày 25/10/2026

Công cụ: imagegen tích hợp. Hai ảnh được tạo mới với alpha trong suốt, giữ nguyên
bản gốc, sao chép vào repo; atlas được cắt bằng tọa độ CSS 4×2, không vẽ lại bằng SVG.

## Giấy tiên

Tệp: `frontend/public/meowcha/assets/ui/ivory-scroll-v1.png`.

Prompt chính xác:

> Use case: stylized-concept. Asset type: finished transparent PNG sprite for cozy 2D pixel-art Chinese xianxia vocabulary game. ONE blank unfolded horizontal ivory rice-paper scroll, viewed straight on, centered and fully contained. Wide 3:1 shape. Tiny warm jade wooden rollers left and right with understated antique gold endcaps, a small soft peach red knot/tassel at bottom left, delicate jade cloud motif at the corners only. Large completely blank warm cream #F5E7C7 central writing space occupies 85% of paper; no text, no letters, no stamps in writing area. Authentic deliberate 16-bit pixel clusters, crisp stepped silhouette, subtle tactile paper shading, readable at 300x100 CSS pixels. Friendly, handmade, cute cultivation school mood. Palette warm ivory, muted jade #70B998, aged gold #E5BE72, peach #D88781, dark jade wood #20332D. No black panels, no neon, no glow, no modern UI card, no smooth vector strokes, no environment, no character. Transparent alpha background.

## Atlas cơ duyên

Tệp: `frontend/public/meowcha/assets/ui/cultivation-icons-v1.png`.

Thứ tự: kiếm, khiên, cuộn thư, chuông; đan lô, băng liên, vạn kiếm, sen ngộ đạo.

Prompt chính xác:

> Use case: stylized-concept. Asset type: ONE transparent PNG icon atlas for a cozy 2D pixel Chinese xianxia game. Exact 4 columns by 2 rows grid of EIGHT separate centered icons, same size, evenly spaced, each icon fits inside its cell with 20 percent transparent padding and no crossing cells. Order left to right: TOP ROW 1 jade flying sword with peach silk knot, 2 round pale jade protective shield with cloud carving, 3 little ivory open cultivation scroll with jade rollers, 4 bronze wind bell with peach tassel. BOTTOM ROW 5 small jade potion cauldron with soft peach elixir, 6 blue ice lotus snowflake crystal, 7 small warm golden bundle of three flying swords, 8 pink lotus wisdom flower on jade leaves. Designed deliberate crisp 16-bit pixel clusters and stepped contours, shaded jewel surfaces, charming soft proportions, readable at 48 pixels, consistent commercial RPG inventory icons. Palette jade #70B998, cream #F5E7C7, aged gold #E5BE72, peach #D88781, spirit blue #9CB7D4, dark jade outline #20332D. NO TEXT NO LABELS NO LETTERS, no backgrounds, no panels, no circle medals, no glows, no vector art, no character. Entire background transparent alpha. Produce exactly eight icons in a uniform 4x2 atlas.

## Tích hợp

`ArtIcons.js` dùng chung tọa độ icon cho sảnh, pháp môn, lựa chọn cơ duyên và HUD kỹ năng.
`FloatingText.js` dùng ảnh giấy cho phần thưởng từ; `AsteroidManager.js` dùng cùng
chất liệu giấy, giữ các sprite nguyên tố đã có. `meowcha-cozy.css` điều chỉnh
tương phản ở bề mặt tương tác, giữ nguyên môi trường ban đêm.

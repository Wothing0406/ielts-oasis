# MEOW-CHA — COMPLETE XIANXIA AUDIO SYSTEM REBUILD

Repository: Wothing0406/ielts-oasis
Branch: game/meowcha-cultivation

Bạn là Senior Game Audio Designer, Web Audio Engineer và Gameplay Engineer.

Mục tiêu là sửa lỗi âm thanh hiện tại và xây dựng một hệ thống audio hoàn chỉnh phù hợp với phong cách:

Cute Pixel Xianxia + Stylish Sword Combat + Educational Typing Game.

Không chỉ thêm vài oscillator hoặc tăng volume.

## 1. FIX AUDIO RELIABILITY FIRST

Kiểm tra toàn bộ:
- frontend/public/meowcha/js/core/AudioManager.js
- frontend/public/meowcha/js/combat/TypingEngine.js
- frontend/public/meowcha/js/main.js
- frontend/public/meowcha/js/ui/UIManager.js
- Audio HTML5
- Web Audio API
- speechSynthesis
- pronunciation audio URLs

Bug cần tái hiện:

Sau khi ma thạch bị phá:
- BGM có lúc biến mất.
- pronunciation/voice có lúc không phát tiếp.
- một số SFX không còn hoạt động.

Phải xác định nguyên nhân thực tế.

Kiểm tra:
- AudioContext.state
- suspended
- interrupted
- closed
- promise rejection của HTMLAudioElement.play()
- speechSynthesis.cancel()
- currentAudioInstance
- audio element lifecycle
- timers của BGM
- visibilitychange
- pagehide/pageshow
- mobile autoplay restrictions
- iframe interaction
- mute state

Không chữa bằng việc gọi startZenGuqin() liên tục.

## 2. TÁCH AUDIO THÀNH 4 BUS

Tạo kiến trúc:

MASTER

├── BGM BUS
├── SFX BUS
├── VOICE BUS
└── AMBIENCE BUS

Mỗi bus có GainNode riêng.

Volume mặc định ví dụ:
MASTER 1.0
BGM 0.50
SFX 0.70
VOICE 1.00
AMBIENCE 0.30

Các giá trị phải tune thực tế.

Không nối tất cả âm thanh trực tiếp vào ctx.destination như hiện tại.

## 3. AUDIO DUCKING

VOICE luôn được ưu tiên.

Khi pronunciation bắt đầu:
- giảm BGM nhẹ
- giảm ambience
- giảm SFX không thiết yếu

Ví dụ:
BGM 0.50 → 0.25

Sau khi voice ended:
BGM trở lại 0.50 trong khoảng 250–500ms.

Không pause BGM.
Không restart track.

Explosion và slash không được che pronunciation.

## 4. TYPING SOUND DESIGN

### Correct key
Âm:
- jade tick
- tiny sword qi
- nhẹ và rất ngắn

Không dùng beep điện tử khó chịu.

Có thể thay đổi pitch rất nhẹ theo combo.

### Wrong key
Âm:
- wooden knock
- muted string
- low jade crack

Không quá lớn.
Không tạo cảm giác punishment khó chịu.

### Last correct character
Khác với từng phím bình thường:
- stronger sword unsheathe
- slash trigger

## 5. WORD KILL AUDIO SEQUENCE

Khi hoàn thành một từ:

Không phát mọi sound cùng thời điểm.

Timeline đề xuất:

0ms
last-key hit

40ms
sword slash

100ms
asteroid crack

170ms
stone/jade shatter

300ms
small cultivation chime

350–500ms
pronunciation starts

Sau pronunciation:
subtle cultivation orb / EXP collect sound.

Tối ưu timeline theo cảm giác thực tế.

## 6. AUDIO MODE — THÍNH LÔI BIỆN ÂM

VOICE là mechanic chính.

Khi word spawn:
- giảm BGM nhẹ
- phát pronunciation rõ
- không phát SFX gây nhiễu trong cùng thời điểm

Replay:
- pronunciation phát lại
- không tính là typing error
- không bị overlap với voice trước

Nếu đang có voice:
cancel hoặc crossfade đúng cách trước khi phát voice mới.

Sau khi trả lời đúng:
- phát slash/shatter
- reward card hiển thị word + IPA
- có thể phát pronunciation thêm một lần nếu UX yêu cầu

Không spam pronunciation.

## 7. THREE MODE AUDIO IDENTITY

DIRECT:
- sword-heavy
- responsive
- crisp typing sounds

CLOZE:
- softer
- jade / bell
- “enlightenment” sound khi recall thành công

AUDIO:
- voice-centered
- minimal interference
- lighter SFX before answer

Không cần ba soundtrack hoàn toàn khác nhau.
Có thể dùng chung BGM nhưng đổi layer hoặc motif.

## 8. COMBO AUDIO

Không phát cue cho mọi combo.

Milestones:
Combo 5
Combo 10
Combo 20
Combo 30+

Mỗi milestone có musical accent nhỏ.

Không làm người chơi mệt vì âm thanh liên tục.

## 9. BREAKTHROUGH AUDIO

Đột phá cảnh giới cần sequence riêng:

1. combat SFX giảm.
2. linh khí tụ.
3. low resonance.
4. guqin glissando.
5. bell / bronze chime.
6. breakthrough impact.
7. realm reveal.
8. BGM trở lại với motif mới.

Không dừng toàn bộ audio context.

## 10. UI AUDIO

Thiết kế sound cho:
- select pháp môn
- open modal
- close modal
- select talent
- pause
- resume
- return lobby
- save
- leaderboard
- tab switching

Giữ âm nhỏ.

Không cần phát âm hover trên thiết bị cảm ứng.

Pause:
sound “tra kiếm vào vỏ” + bell nhẹ.

Resume:
sound “rút kiếm” rất ngắn.

## 11. AMBIENCE

Thêm lớp ambience rất nhẹ:
- mountain wind
- distant temple bell
- bamboo leaves
- subtle spirit motes

Không loop ngắn dễ nhận thấy.

Không che pronunciation.

## 12. MUSIC DIRECTION

BGM nên có phong cách:
- Guqin
- Xiao/Dizi rất nhẹ
- bells
- soft pads / wind ambience
- Chinese pentatonic inspiration

Cute, peaceful, mystical.

Không dùng synth drone quá điện tử làm âm chính.

Có thể giữ Web Audio procedural layer làm nền phụ, nhưng soundtrack chính nên dùng audio asset thực tế nếu có asset được cấp phép phù hợp.

Không dùng copyrighted music không rõ giấy phép.

## 13. REAL AUDIO ASSETS VS PROCEDURAL SOUND

Web Audio oscillator phù hợp cho:
- tiny UI tick
- magical ping
- subtle feedback

Không nên dùng oscillator đơn giản làm toàn bộ:
- explosion
- sword slash
- stone shatter
- BGM

Ưu tiên sample/audio asset chất lượng cho các âm phức tạp.

Nếu chưa có asset:
ghi rõ asset cần sản xuất.
Không coi oscillator placeholder là final production audio.

## 14. AUDIO SETTINGS

Tạo settings:

Âm thanh tổng
Nhạc nền
Hiệu ứng
Phát âm
Âm môi trường

Có:
Mute all.

Lưu setting vào localStorage hoặc profile.

Không tự bật lại nếu user đã mute.

## 15. VISIBILITY / MOBILE RECOVERY

Xử lý:
document.visibilitychange
AudioContext statechange
pageshow
user interaction unlock

Nếu AudioContext suspended:
chỉ resume đúng lúc hợp lệ.

Nếu OS/mobile interrupt:
khôi phục BGM khi người chơi quay lại và soundEnabled=true.

Không tạo hai BGM loop cùng lúc.

## 16. PERFORMANCE

Preload SFX cần thiết.

Không tạo hàng trăm Audio objects.

Reuse buffer khi có thể.

Sử dụng AudioBuffer cho SFX ngắn.

HTMLAudioElement hoặc streaming phù hợp cho voice/BGM dài.

Không gây memory leak khi chơi lâu.

## 17. QA

Test tối thiểu:

- gõ 20 từ DIRECT.
- sai nhiều phím.
- combo.
- CLOZE.
- AUDIO.
- replay pronunciation.
- phá liên tục 20 ma thạch.
- pause/resume.
- đổi tab.
- minimize browser.
- mobile lock/unlock nếu có thể.
- mute/unmute.
- trở về lobby.
- vào trận lại.
- breakthrough.
- game over.

Sau mỗi case xác minh:
BGM còn hoạt động.
SFX còn hoạt động.
VOICE còn hoạt động.
Không overlap sai.
Không double-play.

## 18. ACCEPTANCE CRITERIA

Chỉ hoàn thành khi:
- nhạc nền không tự mất sau asteroid explosion.
- typing sound hoạt động ổn định.
- sword/shatter SFX hoạt động.
- pronunciation hoạt động xuyên suốt.
- AUDIO mode rõ voice.
- pause/resume không phá audio.
- mobile hoạt động.
- volume cân bằng.
- audio có chất Xianxia và không còn cảm giác synth web demo.

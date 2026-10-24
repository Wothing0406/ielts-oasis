import os

def update_typing_idle():
    path = "frontend/public/meowcha/js/combat/TypingEngine.js"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_idle = """          const isMobile = (typeof window !== "undefined" && window.innerWidth <= 768);
          const idleMsgs = {
            DIRECT: isMobile ? "[ 斩 ] TRỰC DIỆN TRẢM MA • GÕ CỔ TỐC ĐỘ" : "[ 斩 ] TRỰC DIỆN TRẢM MA • GÕ CỔ TỰ TỐC ĐỘ ĐỂ XUẤT KIẾM [ 诀 ]",
            CLOZE:  isMobile ? "[ 悟 ] NGỘ ĐẠO • ĐOÁN TỰ PHÁ PHÙ" : "[ 悟 ] NGỘ ĐẠO THÔNG LINH • NHÌN NGHĨA TIẾNG VIỆT ĐOÁN TỰ PHÁ PHÙ [ 诀 ]",
            AUDIO:  isMobile ? "[ 听 ] THÍNH TIÊN • NGHE CHÂN NGÔN" : "[ 听 ] THÍNH TIÊN BIỆN ÂM • LẮNG NGHE CHÂN NGÔN (PHÍM TAB NGHE LẠI) [ 诀 ]"
          };"""

    new_idle = """          const isMobile = (typeof window !== "undefined" && window.innerWidth <= 768);
          const idleMsgs = {
            DIRECT: isMobile ? "[ 斩 ] TRỰC DIỆN TRẢM MA" : "[ 斩 ] TRỰC DIỆN TRẢM MA • GÕ CỔ TỰ TỐC ĐỘ ĐỂ XUẤT KIẾM [ 诀 ]",
            CLOZE:  isMobile ? "[ 悟 ] NGỘ ĐẠO THÔNG LINH" : "[ 悟 ] NGỘ ĐẠO THÔNG LINH • NHÌN NGHĨA TIẾNG VIỆT ĐOÁN TỰ PHÁ PHÙ [ 诀 ]",
            AUDIO:  isMobile ? "[ 听 ] THÍNH TIÊN BIỆN ÂM" : "[ 听 ] THÍNH TIÊN BIỆN ÂM • LẮNG NGHE CHÂN NGÔN (PHÍM TAB NGHE LẠI) [ 诀 ]"
          };"""

    c_norm = content.replace("\r\n", "\n")
    o_norm = old_idle.replace("\r\n", "\n")
    n_norm = new_idle.replace("\r\n", "\n")
    if o_norm in c_norm:
        content = c_norm.replace(o_norm, n_norm)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated TypingEngine.js with punchy idle message!")
    else:
        print("Failed to find idleMsgs in TypingEngine.js")

def update_css():
    path = "frontend/public/meowcha/css/meowcha-ui.css"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    new_css = """
/* DIALOGUE BANNER POSITIONING FIX: Sit comfortably right above altar */
.altar-dialogue-wrap {
  position: absolute !important;
  bottom: 84px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  width: auto !important;
  max-width: 440px !important;
  display: flex !important;
  justify-content: center !important;
  pointer-events: none !important;
  z-index: 44 !important;
  margin: 0 !important;
}

@media (max-width: 768px) {
  .altar-dialogue-wrap {
    position: fixed !important;
    bottom: calc(var(--kb-height, 178px) + 58px) !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 92vw !important;
    max-width: 360px !important;
    margin: 0 !important;
    z-index: 44 !important;
  }
  .altar-word-display,
  #swordIntentText,
  .altar-idle-msg {
    font-size: 13.5px !important;
    white-space: nowrap !important;
    text-overflow: clip !important;
  }
}
"""
    content += new_css
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Appended dialogue positioning CSS to meowcha-ui.css!")

if __name__ == "__main__":
    update_typing_idle()
    update_css()

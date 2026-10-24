import os
import re

def update_index_html():
    path = "frontend/public/meowcha/index.html"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add instant platform detection script in head
    head_tag = "<meta http-equiv=\"Expires\" content=\"0\" />"
    detect_script = """<meta http-equiv="Expires" content="0" />
    <!-- Immediate Multi-Factor Platform Recognition (PC vs Mobile Native) -->
    <script>
      (function() {
        try {
          var nav = navigator || {};
          var ua = nav.userAgent || '';
          var platform = nav.platform || '';
          var maxTouch = nav.maxTouchPoints || 0;
          var isMobileUA = Boolean(
            (nav.userAgentData && nav.userAgentData.mobile) ||
            /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)
          );
          var isIPad = /iPad/i.test(ua) || (platform === 'MacIntel' && maxTouch > 1);
          var isTabletUA = isIPad || /Tablet|PlayBook|Silk|Kindle/i.test(ua);
          var hasHover = false;
          try { hasHover = window.matchMedia && window.matchMedia('(hover: hover)').matches; } catch(e){}
          var isDesktop = (!isMobileUA && !isTabletUA) || (hasHover && !isMobileUA);
          var rootClass = isDesktop ? 'platform-pc' : 'platform-mobile';
          document.documentElement.classList.add(rootClass);
        } catch (_) {}
      })();
    </script>"""

    if detect_script not in content:
        content = content.replace(head_tag, detect_script)
        print("Added immediate platform detection in index.html <head>!")

    # 2. Add DeviceDetector.js before main.js
    if "DeviceDetector.js" not in content:
        main_script = "<script src=\"./js/main.js?v=11.7\"></script>"
        if main_script not in content:
            main_script = "<script src=\"./js/main.js"
            idx = content.find(main_script)
            end_idx = content.find("</script>", idx) + 9
            old_str = content[idx:end_idx]
            new_str = "<script src=\"./js/core/DeviceDetector.js?v=11.8\"></script>\n    " + old_str
            content = content.replace(old_str, new_str)
        else:
            content = content.replace(
                main_script,
                "<script src=\"./js/core/DeviceDetector.js?v=11.8\"></script>\n    <script src=\"./js/main.js?v=11.8\"></script>"
            )
        print("Added DeviceDetector.js script tag in index.html!")

    # 3. Add floating restore button for virtual keyboard
    if "floatingKbRestoreBtn" not in content:
        restore_btn_html = """
      <!-- NÚT PHÙ HIỆN BÀN PHÍM ẢO TRÊN THIẾT BỊ DI ĐỘNG KHI ĐÃ THU GỌN -->
      <button id="floatingKbRestoreBtn" class="floating-kb-restore-btn" type="button" title="Mở lại Trận Pháp Phù Thạch">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8"></path></svg>
        <span>[ ⌨ Hiện Bàn Phím ▲ ]</span>
      </button>"""
        idx = content.find("<div id=\"virtualKeyboardContainer\"></div>")
        if idx != -1:
            content = content[:idx] + restore_btn_html + "\n      " + content[idx:]
            print("Added floatingKbRestoreBtn in index.html!")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def update_virtual_keyboard():
    path = "frontend/public/meowcha/js/ui/VirtualKeyboard.js"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Add minimize button to headerBar
    old_header = """      headerBar.innerHTML = `
        <span class="kb-seal-title">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style="vertical-align: -1px; margin-right: 4px;"><polygon points="8,1 15,8 8,15 1,8" fill="#78350F" stroke="#F3C644" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="#2DE28D"/></svg>
          TRẬN PHÁP PHÙ THẠCH BÀN
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style="vertical-align: -1px; margin-left: 4px;"><polygon points="8,1 15,8 8,15 1,8" fill="#78350F" stroke="#F3C644" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="#2DE28D"/></svg>
        </span>
        <span class="kb-stun-badge" id="kbStunBadge">TÂM MA NHIỄU LOẠN</span>
      `;"""

    new_header = """      headerBar.innerHTML = `
        <span class="kb-seal-title">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style="vertical-align: -1px; margin-right: 4px;"><polygon points="8,1 15,8 8,15 1,8" fill="#78350F" stroke="#F3C644" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="#2DE28D"/></svg>
          TRẬN PHÁP PHÙ THẠCH BÀN
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style="vertical-align: -1px; margin-left: 4px;"><polygon points="8,1 15,8 8,15 1,8" fill="#78350F" stroke="#F3C644" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="#2DE28D"/></svg>
        </span>
        <span class="kb-stun-badge" id="kbStunBadge">TÂM MA NHIỄU LOẠN</span>
        <button class="kb-minimize-btn" id="btnMinimizeKeyboard" type="button" title="Thu gọn bàn phím ảo">
          <span>[ Ẩn Bàn Phím ▼ ]</span>
        </button>
      `;

      const btnMin = headerBar.querySelector("#btnMinimizeKeyboard");
      if (btnMin) {
        btnMin.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const D = root.Meowcha && root.Meowcha.Device;
          if (D) D.setUserPrefKeyboard(false);
          else this.hide();
          const restoreBtn = document.getElementById("floatingKbRestoreBtn");
          if (restoreBtn) restoreBtn.style.display = "inline-flex";
        });
      }"""

    c_norm = content.replace("\r\n", "\n")
    o_norm = old_header.replace("\r\n", "\n")
    n_norm = new_header.replace("\r\n", "\n")

    if o_norm in c_norm:
        c_norm = c_norm.replace(o_norm, n_norm)
        with open(path, "w", encoding="utf-8") as f:
            f.write(c_norm)
        print("Updated VirtualKeyboard.js with minimize toggle!")
    else:
        print("Failed to find old_header in VirtualKeyboard.js")

def update_main_js():
    path = "frontend/public/meowcha/js/main.js"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    c_norm = content.replace("\r\n", "\n")

    # Wire up restore button in main.js init
    old_init_kb = """      const kbContainer = document.getElementById("virtualKeyboardContainer");
      if (kbContainer) {
        this.vKeyboard = new M.VirtualKeyboard(kbContainer, (key) => {
          this.typing.processKey(key, this.canvas);
        });
      }"""

    new_init_kb = """      const kbContainer = document.getElementById("virtualKeyboardContainer");
      if (kbContainer) {
        this.vKeyboard = new M.VirtualKeyboard(kbContainer, (key) => {
          this.typing.processKey(key, this.canvas);
        });
      }

      // Nút khôi phục bàn phím ảo khi người dùng di động bấm thu gọn
      const restoreBtn = document.getElementById("floatingKbRestoreBtn");
      if (restoreBtn) {
        restoreBtn.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const D = root.Meowcha && root.Meowcha.Device;
          if (D) D.setUserPrefKeyboard(true);
          else if (this.vKeyboard) this.vKeyboard.show();
          restoreBtn.style.display = "none";
        });
      }

      // Khi người dùng bấm phím cứng thực tế -> Tự động ẩn bàn phím ảo nếu đang vô tình bật trên PC
      if (root.Meowcha && root.Meowcha.Device) {
        root.Meowcha.Device.onPhysicalKeyboardUsed = () => {
          if (root.Meowcha.Device.info.isDesktop && this.vKeyboard) {
            this.vKeyboard.hide();
          }
        };
      }"""

    if old_init_kb in c_norm:
        c_norm = c_norm.replace(old_init_kb, new_init_kb)
        print("Updated main.js with floating restore button binding & physical key listener!")

    # Replace naive conditions in resize
    old_resize = """        if (this.vKeyboard && this.gameState.currentScene === "BATTLE") {
          if (window.innerWidth <= 768 || 'ontouchstart' in window) {
            this.vKeyboard.show();
          } else {
            this.vKeyboard.hide();
          }
        }"""

    new_resize = """        if (this.vKeyboard && this.gameState.currentScene === "BATTLE") {
          const D = root.Meowcha && root.Meowcha.Device;
          if (D && D.shouldShowVirtualKeyboard()) {
            this.vKeyboard.show();
          } else {
            this.vKeyboard.hide();
          }
        }"""

    if old_resize in c_norm:
        c_norm = c_norm.replace(old_resize, new_resize)
        print("Updated main.js resize event to use DeviceDetector!")

    # Replace naive conditions in startBattle
    old_start_kb = """      // Tự động hiển thị bàn phím ảo trên thiết bị di động / cảm ứng
      if (this.vKeyboard && (window.innerWidth <= 768 || 'ontouchstart' in window)) {
        this.vKeyboard.show();
      }"""

    new_start_kb = """      // Tự động hiển thị bàn phím ảo CHỈ KHI LÀ THIẾT BỊ DI ĐỘNG / TOUCH NATIVE
      const D = root.Meowcha && root.Meowcha.Device;
      if (this.vKeyboard && D && D.shouldShowVirtualKeyboard()) {
        this.vKeyboard.show();
      } else if (this.vKeyboard) {
        this.vKeyboard.hide();
      }"""

    if old_start_kb in c_norm:
        c_norm = c_norm.replace(old_start_kb, new_start_kb)
        print("Updated main.js startBattle to use DeviceDetector!")

    # Replace naive conditions in restartBattle
    old_restart_kb = """      if (this.vKeyboard && (window.innerWidth <= 768 || 'ontouchstart' in window)) {
        this.vKeyboard.show();
      }"""

    new_restart_kb = """      const DRestart = root.Meowcha && root.Meowcha.Device;
      if (this.vKeyboard && DRestart && DRestart.shouldShowVirtualKeyboard()) {
        this.vKeyboard.show();
      } else if (this.vKeyboard) {
        this.vKeyboard.hide();
      }"""

    if old_restart_kb in c_norm:
        c_norm = c_norm.replace(old_restart_kb, new_restart_kb)
        print("Updated main.js restartBattle to use DeviceDetector!")

    # Replace isMobile detection in main.js line 732
    old_ismobile_line = "const isMobile = this.canvas.width <= 768 || (this.canvas.height > this.canvas.width);"
    new_ismobile_line = "const DPlatform = root.Meowcha && root.Meowcha.Device;\n      const isMobile = DPlatform ? DPlatform.info.isMobile : (this.canvas.width <= 768);"

    if old_ismobile_line in c_norm:
        c_norm = c_norm.replace(old_ismobile_line, new_ismobile_line)
        print("Updated main.js isMobile determination (No more height > width false mobile on PC)!")

    with open(path, "w", encoding="utf-8") as f:
        f.write(c_norm)

def update_css():
    path = "frontend/public/meowcha/css/meowcha-ui.css"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    new_css = """
/* ============================================================
   ROBUST MULTI-FACTOR PLATFORM RULES: PC DESKTOP VS MOBILE NATIVE
   ============================================================ */

/* 1. PC PLATFORM: Tuyệt đối KHÔNG BAO GIỜ hiện bàn phím ảo tự động! */
html.platform-pc #virtualKeyboardContainer,
body.platform-pc #virtualKeyboardContainer {
  display: none !important;
}

/* Chỉ hiện trên PC khi người dùng chủ động mở */
html.platform-pc #virtualKeyboardContainer.user-force-opened,
body.platform-pc #virtualKeyboardContainer.user-force-opened {
  display: flex !important;
}

html.platform-pc #floatingKbRestoreBtn,
body.platform-pc #floatingKbRestoreBtn {
  display: none !important;
}

/* 2. MOBILE PLATFORM: Giao diện Native Portrait Touch cao cấp */
html.platform-mobile #virtualKeyboardContainer,
body.platform-mobile #virtualKeyboardContainer {
  display: flex;
}

/* Nút Thu Gọn Bàn Phím Ảo trên Header Trận Pháp */
.kb-minimize-btn {
  background: transparent;
  border: 1px solid rgba(245, 158, 11, 0.45);
  border-radius: 4px;
  color: #FEF08A;
  font-family: var(--font-xianxia-title, serif);
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.2s ease;
  outline: none;
}
.kb-minimize-btn:hover {
  background: rgba(245, 158, 11, 0.25);
  border-color: #FDE047;
  color: #FFFFFF;
}

/* Nút Phù Khôi Phục Bàn Phím Nổi */
.floating-kb-restore-btn {
  position: fixed;
  bottom: 12px;
  right: 14px;
  z-index: 50;
  background: linear-gradient(135deg, #064E3B 0%, #022C22 100%);
  border: 1.5px solid #34D399;
  border-radius: 20px;
  padding: 6px 14px;
  color: #FEF08A;
  font-family: var(--font-xianxia-title, serif);
  font-size: 11px;
  font-weight: 800;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.8), 0 0 10px rgba(52, 211, 153, 0.4);
  cursor: pointer;
  display: none;
  align-items: center;
  gap: 5px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.floating-kb-restore-btn:hover {
  border-color: #FDE047;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.9), 0 0 14px rgba(253, 224, 71, 0.6);
}
"""

    content += new_css
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Appended device platform CSS rules to meowcha-ui.css!")

def update_nextjs_page():
    path = "frontend/app/games/meowcha/page.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace("v=11.7", "v=11.8")
    content = content.replace("params.set(\"v\", \"11.7\");", "params.set(\"v\", \"11.8\");")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated frontend/app/games/meowcha/page.tsx to v=11.8!")

if __name__ == "__main__":
    update_index_html()
    update_virtual_keyboard()
    update_main_js()
    update_css()
    update_nextjs_page()

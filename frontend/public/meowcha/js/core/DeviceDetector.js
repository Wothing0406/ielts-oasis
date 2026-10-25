/**
 * DeviceDetector.js - Hệ Thống Nhận Diện Thiết Bị & Nền Tảng Chuyên Nghiệp (Multi-Factor Detection)
 * Tuyệt đối không đoán mò dựa trên độ rộng màn hình hoặc 'ontouchstart' đơn thuần.
 * Phân định chính xác 100%:
 *  - PC / Laptop (kể cả có màn hình cảm ứng như Surface, ThinkPad Touch, Dell XPS) -> DESKTOP, KHÔNG BAO GIỜ TỰ HIỆN PHÍM ẢO!
 *  - Điện thoại (iPhone, Android Phone) -> MOBILE, Tối ưu giao diện Native Mobile dọc 9:16.
 *  - Máy tính bảng (iPad, Android Tablet) -> TABLET.
 */
(function(root) {
  class DeviceDetector {
    constructor() {
      this.info = this.detect();
      this.userPrefKeyboard = null; // null: auto theo thiết bị, true: cưỡng chế mở, false: cưỡng chế đóng
      this.onPhysicalKeyboardUsed = null;
      this.applyDOMClasses();
      this.bindEvents();
    }

    detect() {
      const nav = typeof navigator !== "undefined" ? navigator : {};
      const ua = nav.userAgent || "";
      const platform = nav.platform || "";
      const maxTouchPoints = nav.maxTouchPoints || 0;

      // 1. Kiểm tra User-Agent Client Hints & Regex di động thực tế
      const isMobileUA = Boolean(
        (nav.userAgentData && nav.userAgentData.mobile) ||
        /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)
      );

      // 2. Kiểm tra iPad & Tablet (iPadOS 13+ tự xưng là MacIntel nhưng có nhiều điểm cảm ứng)
      const isIPad = /iPad/i.test(ua) || (platform === "MacIntel" && maxTouchPoints > 1);
      const isTabletUA = isIPad || /Tablet|PlayBook|Silk|Kindle/i.test(ua);

      // 3. Kiểm tra Media Capabilities con trỏ (Pointer & Hover)
      let hasCoarsePointer = false;
      let hasHoverCapability = false;
      let hasFinePointer = false;
      if (typeof window !== "undefined" && window.matchMedia) {
        try {
          hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
          hasHoverCapability = window.matchMedia("(hover: hover)").matches;
          hasFinePointer = window.matchMedia("(pointer: fine)").matches || window.matchMedia("(any-pointer: fine)").matches;
        } catch (_) {}
      }

      // 4. Nhận diện hệ điều hành máy tính (PC / Laptop / Mac / Linux)
      // Laptop có màn hình cảm ứng (Windows Touch, Surface, ThinkPad Touch) VẪN CÓ CHUỘT / PHÍM CỨNG VÀ HOVER!
      // -> Đây là DESKTOP ĐÍCH THỰC, KHÔNG PHẢI ĐIỆN THOẠI!
      const isDesktopOS = /Windows NT|Macintosh|X11|Linux x86_64/i.test(ua) && !isMobileUA && !isTabletUA;

      let type = "DESKTOP";
      if (isMobileUA && !isTabletUA) {
        type = "MOBILE";
      } else if (isTabletUA) {
        type = "TABLET";
      } else if (isDesktopOS) {
        type = "DESKTOP";
      } else if (hasCoarsePointer && !hasHoverCapability && maxTouchPoints > 0) {
        // Thiết bị thuần cảm ứng ngón tay, không có chuột hover
        type = "MOBILE";
      } else if (isDesktopOS) {
        type = "DESKTOP";
      } else {
        type = "DESKTOP";
      }

      const isTouchDevice = (type === "MOBILE" || type === "TABLET");
      const isDesktop = (type === "DESKTOP");

      return {
        type: type, // "DESKTOP" | "MOBILE" | "TABLET"
        isDesktop: isDesktop,
        isMobile: type === "MOBILE",
        isTablet: type === "TABLET",
        isTouchDevice: isTouchDevice,
        hasPhysicalKeyboard: isDesktop,
        hasCoarsePointer: hasCoarsePointer,
        hasHoverCapability: hasHoverCapability,
        maxTouchPoints: maxTouchPoints
      };
    }

    applyDOMClasses() {
      if (typeof document === "undefined") return;
      const docEl = document.documentElement;
      const body = document.body;

      const classesToRemove = ["platform-pc", "platform-mobile", "platform-tablet"];
      classesToRemove.forEach(cls => {
        docEl.classList.remove(cls);
        if (body) body.classList.remove(cls);
      });

      const activeClass = this.info.isDesktop ? "platform-pc" : (this.info.isTablet ? "platform-tablet" : "platform-mobile");
      docEl.classList.add(activeClass);
      if (body) body.classList.add(activeClass);
    }

    bindEvents() {
      // Khi người dùng bấm phím cứng thực tế -> Ghi nhận và tự động ẩn bàn phím ảo nếu đang vô tình bật
      if (typeof window !== "undefined") {
        window.addEventListener("keydown", (e) => {
          if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            this.info.hasPhysicalKeyboard = true;
            if (this.onPhysicalKeyboardUsed) {
              this.onPhysicalKeyboardUsed();
            }
          }
        }, { passive: true });
      }
    }

    shouldShowVirtualKeyboard() {
      if (this.info.isDesktop) return false;
      // Nếu người dùng đã tự bấm nút Bật/Tắt phím ảo, tôn trọng lựa chọn người dùng
      if (this.userPrefKeyboard !== null) {
        return this.userPrefKeyboard;
      }
      // Trên PC / Laptop: Tuyệt đối KHÔNG BAO GIỜ tự ý hiện bàn phím ảo!
      if (this.info.isDesktop) {
        return false;
      }
      // Trên Mobile / Tablet cảm ứng: Kích hoạt bàn phím ảo
      return this.info.isTouchDevice;
    }

    setUserPrefKeyboard(show) {
      show = Boolean(show) && !this.info.isDesktop;
      this.userPrefKeyboard = show;
      const container = document.getElementById("virtualKeyboardContainer");
      if (container) {
        if (show) {
          container.classList.add("user-force-opened");
          container.style.display = "flex";
        } else {
          container.classList.remove("user-force-opened");
          container.style.display = "none";
        }
      }
    }

    toggleVirtualKeyboard() {
      const current = this.shouldShowVirtualKeyboard();
      this.setUserPrefKeyboard(!current);
      return !current;
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.Device = new DeviceDetector();
})(typeof window !== 'undefined' ? window : globalThis);

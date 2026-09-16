/**
 * UnityBridge.js - Cầu Nối WebGL Unity 3D/2D Character Model
 * Tích hợp điều khiển mô hình sống động qua postMessage và tự động fallback về canvas
 */
(function(root) {
  class UnityBridge {
    constructor(iframeId = "unityCharFrame", mountId = "unityCharacterMount") {
      this.iframeId = iframeId;
      this.mountId = mountId;
      this.iframeEl = null;
      this.mountEl = null;
      this.ready = false;
      this.failed = false;
      this.pendingCommands = [];
    }

    init() {
      this.iframeEl = document.getElementById(this.iframeId);
      this.mountEl = document.getElementById(this.mountId);

      if (!this.iframeEl || !this.mountEl) {
        this.failed = true;
        return;
      }

      window.addEventListener("message", (e) => {
        if (!e.data || typeof e.data !== "object") return;

        if (e.data.type === "UNITY_READY") {
          this.ready = true;
          this.mountEl.style.opacity = "1";
          console.log("[UnityBridge] Mô hình Unity WebGL đã sẵn sàng!");
          this.pendingCommands.forEach(cmd => this.send(cmd.method, cmd.args));
          this.pendingCommands = [];
        }
      });

      // Timeout fallback 8 giây: Nếu Unity không sẵn sàng thì ẩn overlay, dùng canvas cat
      setTimeout(() => {
        if (!this.ready) {
          console.warn("[UnityBridge] Unity timeout — fallback về canvas cat 2D");
          this.failed = true;
          if (this.mountEl) this.mountEl.style.display = "none";
        }
      }, 8000);
    }

    send(method, args = "") {
      if (!this.iframeEl || !this.iframeEl.contentWindow) return;
      try {
        this.iframeEl.contentWindow.postMessage(
          { type: "MEOWCHA_CMD", method: method, args: String(args) },
          "*"
        );
      } catch (err) {
        console.warn("[UnityBridge] Lỗi gửi lệnh:", err);
      }
    }

    dispatch(method, args = "") {
      if (this.failed) return;
      if (this.ready) {
        this.send(method, args);
      } else {
        this.pendingCommands.push({ method, args });
      }
    }

    setRealm(realmIdx) {
      this.dispatch("SetRealm", realmIdx);
    }

    triggerWeakAttack(targetX, targetY) {
      this.dispatch("TriggerWeakAttack", `${targetX},${targetY}`);
    }

    triggerUltimateBlast() {
      this.dispatch("TriggerUltimateBlast", "");
    }

    triggerHurt() {
      this.dispatch("TriggerHurt", "");
    }

    triggerDefeated() {
      this.dispatch("TriggerDefeated", "");
    }

    isReady() {
      return this.ready;
    }

    isFailed() {
      return this.failed;
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.UnityBridge = UnityBridge;
})(typeof window !== 'undefined' ? window : globalThis);

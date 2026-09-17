/**
 * SaveSystem.js - Hệ Thống 3 Ngọc Giản Lưu Trữ (Save Slots)
 * Lưu cục bộ qua LocalStorage và tự động đồng bộ API MySQL nếu có kết nối
 */
(function(root) {
  const STORAGE_KEY = "meowcha_save_slots_v3";

  class SaveSystem {
    constructor() {
      this.slots = this.loadLocalSlots();
    }

    getDefaultSlot(slotId) {
      return {
        slotId: slotId,
        slotName: `Ngọc Giản ${slotId}`,
        isOccupied: false,
        dateStr: "",
        realm: "Luyện Khí Kỳ",
        realmIdx: 0,
        title: "Tiểu Miêu Kiếm Đồng",
        hp: 50,
        maxHp: 50,
        score: 0,
        words: 0,
        bandIdx: 0,
        talents: {}
      };
    }

    loadLocalSlots() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            1: parsed[1] || this.getDefaultSlot(1),
            2: parsed[2] || this.getDefaultSlot(2),
            3: parsed[3] || this.getDefaultSlot(3)
          };
        }
      } catch (e) {
        console.warn("[SaveSystem] Lỗi đọc LocalStorage, dùng cấu hình mặc định:", e);
      }
      return {
        1: this.getDefaultSlot(1),
        2: this.getDefaultSlot(2),
        3: this.getDefaultSlot(3)
      };
    }

    saveLocalSlots() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.slots));
      } catch (e) {
        console.warn("[SaveSystem] Không thể ghi LocalStorage:", e);
      }
    }

    getSlot(slotId) {
      return this.slots[slotId] || this.getDefaultSlot(slotId);
    }

    getAllSlots() {
      return this.slots;
    }

    getAuthHeaders() {
      let token = "";
      try {
        token = localStorage.getItem("oasis_token") || "";
        if (!token && typeof window !== "undefined" && window.parent && window.parent !== window) {
          try {
            token = window.parent.localStorage.getItem("oasis_token") || "";
          } catch (crossErr) {}
        }
      } catch (e) {}

      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      return headers;
    }

    saveGame(slotId, gameState) {
      if (!gameState || gameState.isGameOver || gameState.hp <= 0) {
        // Đạo tiêu thân vong: Tuyệt đối không lưu lại kiếp đã chết!
        this.deleteSlot(slotId);
        return null;
      }

      const now = new Date();
      const dateStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} • ${now.getDate()}/${now.getMonth() + 1}`;
      const realms = root.Meowcha.CULTIVATION_REALMS || [];
      const realmData = realms[gameState.realmIdx] || realms[0];

      const slotData = {
        slotId: slotId,
        slotName: `Đạo Quả [${realmData.title}]`,
        isOccupied: true,
        dateStr: dateStr,
        realm: realmData.name,
        realmIdx: gameState.realmIdx,
        title: realmData.title,
        hp: gameState.hp,
        maxHp: gameState.maxHp,
        score: gameState.score,
        highScore: Math.max(gameState.highScore || 0, gameState.score || 0),
        words: gameState.wordsSlain,
        bandIdx: gameState.selectedBandIdx || 0,
        talents: JSON.parse(JSON.stringify(gameState.talents || {}))
      };

      this.slots[slotId] = slotData;
      this.saveLocalSlots();

      // Đồng bộ ngầm lên Backend SQL theo tài khoản người dùng
      if (typeof fetch !== "undefined") {
        fetch('/api/meowcha/saves', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            slot_id: slotId,
            slot_name: slotData.slotName,
            is_occupied: true,
            realm: slotData.realm,
            realm_idx: slotData.realmIdx,
            title: slotData.title,
            hp: slotData.hp,
            max_hp: slotData.maxHp,
            score: slotData.score,
            words_slain: slotData.words,
            band_idx: slotData.bandIdx,
            talents: slotData.talents
          })
        }).catch(err => console.log("[SaveSystem] Lưu offline cục bộ (API chưa kết nối)"));
      }

      return slotData;
    }

    deleteSlot(slotId) {
      this.slots[slotId] = this.getDefaultSlot(slotId);
      this.saveLocalSlots();

      if (typeof fetch !== "undefined") {
        fetch(`/api/meowcha/saves/${slotId}`, { 
          method: 'DELETE',
          headers: this.getAuthHeaders()
        }).catch(() => {});
      }
    }

    hasActiveSave() {
      const slot1 = this.getSlot(1);
      return slot1 && slot1.isOccupied && (slot1.hp > 0) && (slot1.score > 0 || slot1.realmIdx > 0 || slot1.words > 0);
    }

    resetActiveSave() {
      this.deleteSlot(1);
    }

    syncWithBackend() {
      if (typeof fetch === "undefined") return Promise.resolve(this.slots);

      return fetch('/api/meowcha/saves', {
        headers: this.getAuthHeaders()
      })
        .then(r => {
          if (!r.ok) return null;
          return r.json().catch(() => null);
        })
        .then(res => {
          if (res && res.success && res.data) {
            for (let s = 1; s <= 3; s++) {
              const remote = res.data[s];
              if (remote && remote.is_occupied) {
                this.slots[s] = {
                  slotId: s,
                  slotName: remote.slot_name || `Ngọc Giản ${s}`,
                  isOccupied: true,
                  dateStr: remote.updated_at ? new Date(remote.updated_at).toLocaleDateString("vi-VN") : "Đám mây",
                  realm: remote.realm,
                  realmIdx: remote.realm_idx,
                  title: remote.title,
                  hp: remote.hp,
                  maxHp: remote.max_hp,
                  score: remote.score,
                  words: remote.words_slain,
                  bandIdx: remote.band_idx || 0,
                  talents: remote.talents || {}
                };
              }
            }
            this.saveLocalSlots();
          }
          return this.slots;
        })
        .catch(err => {
          console.log("[SaveSystem] Dùng bộ nhớ cục bộ:", err ? err.message : "");
          return this.slots;
        });
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.SaveSystem = SaveSystem;
})(typeof window !== 'undefined' ? window : globalThis);

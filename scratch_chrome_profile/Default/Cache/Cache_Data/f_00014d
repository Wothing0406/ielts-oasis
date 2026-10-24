/**
 * SaveSystem.js - Hệ Thống 3 Ngọc Giản Lưu Trữ (Save Slots)
 * Lưu cục bộ qua LocalStorage và tự động đồng bộ API MySQL nếu có kết nối
 */
(function(root) {
  const STORAGE_KEY = "meowcha_save_slots_v3";

  // Bộ lưu trữ In-Memory an toàn tuyệt đối khi chạy trong môi trường iframe sandboxed hoặc Private Browsing
  const MemoryStorage = {
    _data: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  };

  function getSafeStorage() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.getItem("__probe__");
        return window.localStorage;
      }
    } catch (e) {
      console.warn("[SaveSystem] LocalStorage bị chặn (sandboxed), chuyển sang MemoryStorage:", e.message);
    }
    return MemoryStorage;
  }

  class SaveSystem {
    constructor() {
      this.storage = getSafeStorage();
      this.slots = this.loadLocalSlots();
      this.syncSrsDeck();
    }

    syncSrsDeck() {
      try {
        const words = this.getWeaknessWords();
        const M = root.Meowcha || {};
        if (M.TANG_KINH_DECKS && Array.isArray(M.TANG_KINH_DECKS)) {
          const srsDeck = M.TANG_KINH_DECKS.find(d => d.id === "flashcard_srs");
          if (srsDeck) {
            srsDeck.words = words.length > 0 ? words : [
              { word: "PERSEVERE", ipa: "/ˌpɜː.sɪˈvɪər/", type: "verb", meaning: "Kiên trì bền bỉ vượt nghịch cảnh" },
              { word: "RESILIENT", ipa: "/rɪˈzɪl.jənt/", type: "adj", meaning: "Kiên cường dẻo dai trước thử thách" },
              { word: "TRANSCEND", ipa: "/trænˈsend/", type: "verb", meaning: "Vượt qua giới hạn, phi thăng" }
            ];
            srsDeck.wordsCount = srsDeck.words.length;
          }
        }
      } catch (e) {
        console.warn("[SaveSystem.syncSrsDeck] Lỗi khởi tạo SRS deck:", e);
      }
    }

    recordWeaknessWord(wordItem) {
      if (!wordItem || !wordItem.word) return;
      try {
        const key = "meowcha_srs_weaknesses";
        const raw = this.storage.getItem(key);
        let list = raw ? JSON.parse(raw) : [];
        const wordUpper = wordItem.word.toUpperCase();
        const existing = list.find(w => w.word === wordUpper);
        if (existing) {
          existing.missCount = (existing.missCount || 1) + 1;
          existing.lastMissed = Date.now();
        } else {
          list.push({
            word: wordUpper,
            ipa: wordItem.ipa || "/.../",
            meaning: wordItem.meaning || "",
            type: wordItem.type || "vocab",
            missCount: 1,
            lastMissed: Date.now()
          });
        }
        if (list.length > 200) list = list.slice(-200);
        this.storage.setItem(key, JSON.stringify(list));
        this.syncSrsDeck();

        if (typeof fetch !== "undefined") {
          fetch("/api/vocabulary", {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
              word: wordUpper,
              definition: wordItem.meaning,
              ipa: wordItem.ipa,
              tag: "meowcha_weakness"
            })
          }).catch(() => {});
        }
      } catch (e) {
        console.warn("[SaveSystem.recordWeaknessWord] Không thể ghi từ yếu:", e);
      }
    }

    getWeaknessWords() {
      try {
        const raw = this.storage.getItem("meowcha_srs_weaknesses");
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return [];
    }

    getDefaultModeState(mName, rData) {
      return {
        mode: mName,
        isOccupied: false,
        score: 0,
        highScore: 0,
        words: 0,
        realmIdx: 0,
        realm: (rData && rData.name) || "Luyện Khí Kỳ",
        title: (rData && rData.title) || "Bạch Miêu Tiên Đồng",
        hp: 50,
        maxHp: 50,
        talents: {}
      };
    }

    getDefaultSlot(slotId) {
      const rData = { name: "Luyện Khí Kỳ", title: "Bạch Miêu Tiên Đồng" };
      return {
        slotId: slotId,
        slotName: `Ngọc Giản ${slotId}`,
        isOccupied: false,
        activeMode: "DIRECT",
        modes: {
          DIRECT: this.getDefaultModeState("DIRECT", rData),
          CLOZE:  this.getDefaultModeState("CLOZE", rData),
          AUDIO:  this.getDefaultModeState("AUDIO", rData)
        },
        dateStr: "",
        realm: "Luyện Khí Kỳ",
        realmIdx: 0,
        title: "Bạch Miêu Tiên Đồng",
        hp: 50,
        maxHp: 50,
        score: 0,
        words: 0,
        bandIdx: 0,
        talents: {}
      };
    }

    normalizeSlot(slot, slotId) {
      if (!slot || typeof slot !== "object") return this.getDefaultSlot(slotId);

      const realms = (root.Meowcha && root.Meowcha.CULTIVATION_REALMS) || [
        { name: "Luyện Khí Kỳ", title: "Bạch Miêu Tiên Đồng" },
        { name: "Trúc Cơ Kỳ", title: "Thanh Vân Ngự Kiếm Miêu" },
        { name: "Kim Đan Kỳ", title: "Bát Quái Kim Đan Miêu" },
        { name: "Nguyên Anh Kỳ", title: "Nguyên Anh Đại Năng" },
        { name: "Độ Kiếp Kỳ", title: "Vạn Kiếm Chí Tôn" }
      ];

      let rIdx = parseInt(slot.realmIdx, 10);
      if (isNaN(rIdx) || rIdx < 0) {
        const rStr = String(slot.realm || "").toLowerCase();
        if (rStr.includes("trúc cơ")) rIdx = 1;
        else if (rStr.includes("kim đan")) rIdx = 2;
        else if (rStr.includes("nguyên anh")) rIdx = 3;
        else if (rStr.includes("độ kiếp") || rStr.includes("hóa thần") || rStr.includes("chí tôn")) rIdx = 4;
        else rIdx = 0;
      }
      rIdx = Math.max(0, Math.min(4, rIdx));
      const rData = realms[rIdx] || realms[0];

      const scoreNum = typeof slot.score === "number" ? Math.max(0, slot.score) : (parseInt(slot.score, 10) || 0);
      const wordsNum = typeof slot.words === "number" ? Math.max(0, slot.words) : (parseInt(slot.words, 10) || 0);
      const hpNum = typeof slot.hp === "number" ? Math.max(0, slot.hp) : (parseInt(slot.hp, 10) || 50);
      const maxHpNum = typeof slot.maxHp === "number" ? Math.max(10, slot.maxHp) : (parseInt(slot.maxHp, 10) || 50);
      const bandNum = typeof slot.bandIdx === "number" ? Math.max(0, Math.min(3, slot.bandIdx)) : Math.min(3, rIdx);

      const isOccupied = Boolean(slot.isOccupied || scoreNum > 0 || wordsNum > 0 || rIdx > 0);

      // Chuẩn hóa cấu trúc độc lập 3 Pháp Môn (DIRECT, CLOZE, AUDIO)
      const existingModes = (slot.modes && typeof slot.modes === "object") ? slot.modes : {};
      const activeMode = slot.activeMode || slot.gameMode || "DIRECT";

      const normModes = {
        DIRECT: Object.assign(this.getDefaultModeState("DIRECT", rData), existingModes.DIRECT || {}),
        CLOZE:  Object.assign(this.getDefaultModeState("CLOZE", rData), existingModes.CLOZE || {}),
        AUDIO:  Object.assign(this.getDefaultModeState("AUDIO", rData), existingModes.AUDIO || {})
      };

      // Tương thích ngược: Nếu save cũ chưa có modes.DIRECT mà slot cha có điểm, gán vào mode tương ứng!
      if (!existingModes[activeMode] && isOccupied) {
        normModes[activeMode] = {
          mode: activeMode,
          isOccupied: true,
          score: scoreNum,
          highScore: slot.highScore || scoreNum,
          words: wordsNum,
          realmIdx: rIdx,
          realm: slot.realm || rData.name,
          title: slot.title || rData.title,
          hp: hpNum,
          maxHp: maxHpNum,
          talents: (slot.talents && typeof slot.talents === "object") ? slot.talents : {}
        };
      }

      return {
        slotId: slotId,
        slotName: slot.slotName || `Ngọc Giản ${slotId}`,
        isOccupied: isOccupied,
        activeMode: activeMode,
        modes: normModes,
        dateStr: slot.dateStr || (isOccupied ? "Tiền Triều Đạo Quả" : ""),
        realm: slot.realm || rData.name,
        realmIdx: rIdx,
        title: slot.title || rData.title,
        hp: hpNum,
        maxHp: maxHpNum,
        score: scoreNum,
        words: wordsNum,
        bandIdx: bandNum,
        talents: (slot.talents && typeof slot.talents === "object") ? slot.talents : {}
      };
    }

    loadLocalSlots() {
      const candidateKeys = [
        STORAGE_KEY,
        "meowcha_save_slots_v2",
        "meowcha_save_slots",
        "meowcha_save_game",
        "meowcha_save"
      ];

      for (const k of candidateKeys) {
        try {
          const raw = this.storage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
              const res = {
                1: this.normalizeSlot(parsed[1] || (parsed.slotId === 1 ? parsed : null), 1),
                2: this.normalizeSlot(parsed[2] || (parsed.slotId === 2 ? parsed : null), 2),
                3: this.normalizeSlot(parsed[3] || (parsed.slotId === 3 ? parsed : null), 3)
              };
              if (res[1].isOccupied || res[2].isOccupied || res[3].isOccupied) {
                try { this.storage.setItem(STORAGE_KEY, JSON.stringify(res)); } catch (se) {}
                console.log("[SaveSystem] Đã nạp và chuẩn hóa save từ key:", k);
                return res;
              }
            }
          }
        } catch (e) {
          console.warn("[SaveSystem] Lỗi nạp lưu trữ từ key:", k, e.message);
        }
      }

      return {
        1: this.getDefaultSlot(1),
        2: this.getDefaultSlot(2),
        3: this.getDefaultSlot(3)
      };
    }

    saveLocalSlots() {
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(this.slots));
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
        if (typeof window !== "undefined" && window.location && window.location.search) {
          const sp = new URLSearchParams(window.location.search);
          token = sp.get("token") || "";
        }
        if (!token) {
          token = localStorage.getItem("oasis_token") || "";
        }
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

    getActiveSlotId() {
      let saved = 1;
      try {
        const val = parseInt(localStorage.getItem("meowcha_active_slot_id"), 10);
        if (val === 1 || val === 2 || val === 3) saved = val;
      } catch (e) {}
      return saved;
    }

    setActiveSlotId(slotId) {
      const id = (slotId === 2 || slotId === 3) ? slotId : 1;
      try {
        localStorage.setItem("meowcha_active_slot_id", String(id));
      } catch (e) {}
      return id;
    }

    getSlotModeData(slotId, mode = "DIRECT") {
      const s = this.getSlot(slotId);
      if (s && s.modes && s.modes[mode]) {
        return s.modes[mode];
      }
      return this.getDefaultModeState(mode, { name: "Luyện Khí Kỳ", title: "Bạch Miêu Tiên Đồng" });
    }

    hasActiveSaveForMode(mode = "DIRECT", slotId = null) {
      const targetSlotId = slotId || this.getActiveSlotId();
      const mData = this.getSlotModeData(targetSlotId, mode);
      return Boolean(mData && mData.isOccupied && mData.hp > 0 && (mData.score > 0 || mData.realmIdx > 0 || mData.words > 0));
    }

    saveGame(slotId, gameState) {
      const targetSlot = (slotId === 1 || slotId === 2 || slotId === 3)
        ? slotId
        : ((gameState && gameState.activeSlotId) || this.getActiveSlotId());

      const curMode = (gameState && gameState.gameMode) || "DIRECT";

      if (!gameState || gameState.isGameOver || gameState.hp <= 0) {
        // Đạo tiêu thân vong: Chỉ xóa tiến trình của pháp môn hiện tại, bảo toàn pháp môn khác!
        this.resetActiveSave(targetSlot, curMode);
        return null;
      }

      const now = new Date();
      const dateStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} • ${now.getDate()}/${now.getMonth() + 1}`;
      const realms = root.Meowcha.CULTIVATION_REALMS || [];
      const realmData = realms[gameState.realmIdx] || realms[0];

      const currentSlot = this.getSlot(targetSlot);
      currentSlot.modes = currentSlot.modes || {};

      const prevHighScore = (currentSlot.modes[curMode] && currentSlot.modes[curMode].highScore) || 0;
      const newHighScore = Math.max(prevHighScore, gameState.highScore || 0, gameState.score || 0);

      const modeData = {
        mode: curMode,
        isOccupied: true,
        dateStr: dateStr,
        realm: realmData.name,
        realmIdx: gameState.realmIdx,
        title: realmData.title,
        hp: gameState.hp,
        maxHp: gameState.maxHp,
        score: gameState.score,
        highScore: newHighScore,
        words: gameState.wordsSlain,
        talents: JSON.parse(JSON.stringify(gameState.talents || {}))
      };

      currentSlot.modes[curMode] = modeData;
      currentSlot.activeMode = curMode;
      currentSlot.isOccupied = true;
      currentSlot.dateStr = dateStr;
      currentSlot.realm = realmData.name;
      currentSlot.realmIdx = gameState.realmIdx;
      currentSlot.title = realmData.title;
      currentSlot.hp = gameState.hp;
      currentSlot.maxHp = gameState.maxHp;
      currentSlot.score = gameState.score;
      currentSlot.highScore = Math.max(currentSlot.highScore || 0, newHighScore);
      currentSlot.words = gameState.wordsSlain;
      currentSlot.bandIdx = gameState.selectedBandIdx || 0;
      currentSlot.talents = modeData.talents;

      this.slots[targetSlot] = currentSlot;
      this.saveLocalSlots();
      this.setActiveSlotId(targetSlot);
      if (gameState) gameState.activeSlotId = targetSlot;

      // Đồng bộ ngầm lên Backend SQL theo tài khoản người dùng
      if (typeof fetch !== "undefined") {
        fetch(`/api/meowcha/saves/${targetSlot}`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            slot_id: targetSlot,
            slot_name: currentSlot.slotName || `Đạo Quả [${realmData.title}]`,
            is_occupied: true,
            realm: currentSlot.realm,
            realm_idx: currentSlot.realmIdx,
            title: currentSlot.title,
            hp: currentSlot.hp,
            max_hp: currentSlot.maxHp,
            score: currentSlot.score,
            words_slain: currentSlot.words,
            band_idx: currentSlot.bandIdx,
            talents: currentSlot.talents
          })
        }).catch(err => console.log("[SaveSystem] Lưu offline cục bộ (API chưa kết nối)"));
      }

      return currentSlot;
    }

    deleteSlot(slotId) {
      const targetSlot = (slotId === 1 || slotId === 2 || slotId === 3) ? slotId : 1;
      this.slots[targetSlot] = this.getDefaultSlot(targetSlot);
      this.saveLocalSlots();

      if (typeof fetch !== "undefined") {
        fetch(`/api/meowcha/saves/${targetSlot}`, { 
          method: 'DELETE',
          headers: this.getAuthHeaders()
        }).catch(() => {});
      }
    }

    hasActiveSave(preferredSlotId = null, mode = null) {
      const checkSlotHasSave = (slot, checkMode) => {
        if (!slot) return null;
        if (checkMode) {
          if (slot.modes && slot.modes[checkMode]) {
            const m = slot.modes[checkMode];
            if (m.isOccupied && (m.hp > 0) && (m.score > 0 || m.realmIdx > 0 || m.words > 0)) {
              return Object.assign({}, slot, m);
            }
          }
          return null;
        }
        if (slot.isOccupied && (slot.hp > 0) && (slot.score > 0 || slot.realmIdx > 0 || slot.words > 0)) {
          return slot;
        }
        return null;
      };

      // 1. Kiểm tra preferredSlotId nếu có
      if (preferredSlotId && (preferredSlotId === 1 || preferredSlotId === 2 || preferredSlotId === 3)) {
        const found = checkSlotHasSave(this.getSlot(preferredSlotId), mode);
        if (found) return found;
      }

      // 2. Kiểm tra slot active đã lưu
      const activeId = this.getActiveSlotId();
      const activeFound = checkSlotHasSave(this.getSlot(activeId), mode);
      if (activeFound) return activeFound;

      // 3. Fallback tìm bất kỳ slot nào có tiến trình hợp lệ
      for (let s = 1; s <= 3; s++) {
        const otherFound = checkSlotHasSave(this.getSlot(s), mode);
        if (otherFound) return otherFound;
      }
      return null;
    }

    resetActiveSave(slotId = null, mode = null) {
      const targetId = (slotId === 1 || slotId === 2 || slotId === 3) ? slotId : this.getActiveSlotId();
      if (mode && this.slots[targetId] && this.slots[targetId].modes && this.slots[targetId].modes[mode]) {
        const rData = { name: "Luyện Khí Kỳ", title: "Bạch Miêu Tiên Đồng" };
        this.slots[targetId].modes[mode] = this.getDefaultModeState(mode, rData);

        // Nếu mode này trùng với activeMode của slot, reset chỉ số hiển thị của slot cha
        if (this.slots[targetId].activeMode === mode) {
          this.slots[targetId].isOccupied = false;
          this.slots[targetId].score = 0;
          this.slots[targetId].words = 0;
          this.slots[targetId].realmIdx = 0;
          this.slots[targetId].hp = 50;
        }
        this.saveLocalSlots();
        return;
      }
      this.deleteSlot(targetId);
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

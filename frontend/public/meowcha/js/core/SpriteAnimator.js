/**
 * SpriteAnimator.js - Động Cơ Diễn Hoạt Đa Khung Hình (Multi-Frame Sprite Sheet & VFX Animator)
 * Tích hợp chuẩn Agent Sprite Forge (animation.json + horizontal sprite sheets 360x360)
 * Hỗ trợ 5 Cảnh Giới Nhân Vật (Realm 0 -> 4), 5 Trạng Thái (IDLE, WEAK_ATTACK, ULTIMATE_BLAST, HURT, DEFEATED)
 * và các hiệu ứng VFX động (Slashes, Impacts, Beams, Companion Soul).
 */
(function (root) {
  const REALM_FOLDERS = [
    "realm0_qi_refining",
    "realm1_foundation",
    "realm2_golden_core",
    "realm3_nascent_soul",
    "realm4_tribulation",
  ];

  // Cấu hình tốc độ khung hình (FPS) và chế độ lặp cho từng trạng thái nhân vật
  const STATE_CLIP_CONFIG = {
    IDLE: {
      key: "idle",
      fps: 8,
      loop: true,
      frames: 6,
      frameW: 360,
      frameH: 360,
    },
    WEAK_ATTACK: {
      key: "attack",
      fps: 18,
      loop: false,
      frames: 4,
      frameW: 360,
      frameH: 360,
      hitFrame: 1,
    },
    ULTIMATE_BLAST: {
      key: "ultimate",
      fps: 14,
      loop: false,
      frames: 6,
      frameW: 360,
      frameH: 360,
      hitFrame: 2,
    },
    BREAKTHROUGH: {
      key: "ultimate",
      fps: 12,
      loop: true,
      frames: 6,
      frameW: 360,
      frameH: 360,
    },
    HURT: {
      key: "hurt",
      fps: 14,
      loop: false,
      frames: 4,
      frameW: 360,
      frameH: 360,
    },
    DEFEATED: {
      key: "defeated",
      fps: 6,
      loop: false,
      frames: 4,
      frameW: 360,
      frameH: 360,
    },
  };

  class SpriteAnimator {
    constructor(assets) {
      this.assets = assets || {};
      this.currentRealmIdx = 0;
      this.currentState = "IDLE";
      this.frameIndex = 0;
      this.frameTimer = 0;
      this.motionTime = 0;
      this.clipElapsed = 0;
      this.observedAnimationId = -1;
      this.pendingRepeat = false;
      this.activeVFXClips = []; // Các hiệu ứng chém / nổ multi-frame đang phát trên chiến trường
    }

    /**
     * Lấy thư mục định danh của cảnh giới (0..4)
     */
    getRealmFolder(realmIdx) {
      const idx = Math.min(4, Math.max(0, realmIdx || 0));
      return REALM_FOLDERS[idx];
    }

    /**
     * Đặt hoặc chuyển trạng thái hoạt ảnh nhân vật
     */
    setState(newState, realmIdx = 0, forceReset = false) {
      const normalized = STATE_CLIP_CONFIG[newState] ? newState : "IDLE";
      if (
        this.currentState !== normalized ||
        this.currentRealmIdx !== realmIdx ||
        forceReset
      ) {
        this.currentState = normalized;
        this.currentRealmIdx = Math.min(4, Math.max(0, realmIdx || 0));
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.clipElapsed = 0;
        this.pendingRepeat = false;
      }
    }

    /**
     * Cập nhật bộ đếm frame của nhân vật và các hiệu ứng VFX động
     */
    update(dt = 0.016, gameState) {
      dt=Math.max(0,Math.min(.1,Number(dt)||0));this.motionTime+=dt;
      const targetState = (gameState && gameState.catState) || "IDLE";
      const targetRealm = Math.min(
        4,
        Math.max(0, (gameState && gameState.realmIdx) || 0),
      );

      if (
        targetState !== this.currentState ||
        targetRealm !== this.currentRealmIdx
      ) {
        this.setState(targetState, targetRealm, true);
      }

      const animationId=gameState?.catAnimationId||0;
      if(animationId!==this.observedAnimationId){
        if(targetState==='WEAK_ATTACK')this.pendingRepeat=this.clipElapsed>0;
        else if(targetState==='HURT'||targetState==='ULTIMATE_BLAST')this.setState(targetState,targetRealm,true);
        this.observedAnimationId=animationId;
      }

      const cfg = STATE_CLIP_CONFIG[this.currentState] || STATE_CLIP_CONFIG.IDLE;
      const sheet=this.assets[`char_r${targetRealm}_${cfg.key}_sheet`];
      const frames=sheet?.loaded&&sheet.img?.naturalWidth>=cfg.frameW?Math.max(1,Math.floor(sheet.img.naturalWidth/cfg.frameW)):cfg.frames;
      const frameDuration = 1.0 / (cfg.fps || 8);
      const finished=this.frameIndex>=frames-1;
      this.clipElapsed+=dt;
      this.frameTimer += dt;

      if (this.frameTimer >= frameDuration) {
        const steps = Math.floor(this.frameTimer / frameDuration);
        this.frameTimer -= steps * frameDuration;

        if (cfg.loop) {
          this.frameIndex = (this.frameIndex + steps) % frames;
        } else {
          this.frameIndex = Math.min(frames - 1, this.frameIndex + steps);
          if(finished&&this.pendingRepeat){this.frameIndex=0;this.frameTimer=0;this.clipElapsed=0;this.pendingRepeat=false;}
        }
      }

      // Cập nhật các hiệu ứng VFX multi-frame trên chiến trường
      for (let i = this.activeVFXClips.length - 1; i >= 0; i--) {
        const fx = this.activeVFXClips[i];
        fx.timer += dt;
        const fxFrameDur = 1.0 / (fx.fps || 18);
        fx.frameIndex = Math.floor(fx.timer / fxFrameDur);
        if (fx.frameIndex >= fx.frames) {
          if (fx.loop) {
            fx.timer = fx.timer % (fx.frames * fxFrameDur);
            fx.frameIndex = 0;
          } else {
            this.activeVFXClips.splice(i, 1);
          }
        }
      }
    }

    /**
     * Trả về thông tin frame hiện tại để vẽ nhân vật (hỗ trợ cả Sprite Sheet đa frame & Fallback ảnh đơn)
     * @returns {{ img: HTMLImageElement, sx: number, sy: number, sw: number, sh: number, isSheet: boolean, frameIndex: number, totalFrames: number } | null}
     */
    getCharacterFrame(realmIdx, catState) {
      const rIdx = Math.min(4, Math.max(0, realmIdx || 0));
      const stateKey = STATE_CLIP_CONFIG[catState] ? catState : "IDLE";
      const cfg = STATE_CLIP_CONFIG[stateKey];

      // 1. Ưu tiên tìm Sprite Sheet đa khung hình: char_r{rIdx}_{cfg.key}_sheet
      const sheetAssetKey = `char_r${rIdx}_${cfg.key}_sheet`;
      const sheetAsset = this.assets[sheetAssetKey];
      if (
        sheetAsset &&
        sheetAsset.loaded &&
        sheetAsset.img &&
        sheetAsset.img.naturalWidth >= cfg.frameW * 2
      ) {
        const totalFrames = Math.max(
          1,
          Math.floor(sheetAsset.img.naturalWidth / cfg.frameW),
        );
        const fIdx = Math.min(totalFrames - 1, this.frameIndex % totalFrames);
        return {
          img: sheetAsset.img,
          sx: fIdx * cfg.frameW,
          sy: 0,
          sw: cfg.frameW,
          sh: sheetAsset.img.naturalHeight || cfg.frameH,
          isSheet: true,
          frameIndex: fIdx,
          totalFrames: totalFrames,
        };
      }

      // 2. Fallback tìm ảnh đơn theo đúng cảnh giới và trạng thái: char_r{rIdx}_{cfg.key}
      const singleAssetKey = `char_r${rIdx}_${cfg.key}`;
      const singleAsset = this.assets[singleAssetKey];
      if (singleAsset && singleAsset.loaded && singleAsset.img) {
        const w = singleAsset.img.naturalWidth || 360;
        const h = singleAsset.img.naturalHeight || 360;
        return {
          img: singleAsset.img,
          sx: 0,
          sy: 0,
          sw: w,
          sh: h,
          isSheet: false,
          frameIndex: 0,
          totalFrames: 1,
        };
      }

      // 3. Fallback về key legacy để đảm bảo không bao giờ mất hình
      const legacyMap = {
        0: {
          idle: "cat_idle",
          attack: "cat_weak_attack",
          ultimate: "cat_ultimate_blast",
          hurt: "cat_hurt",
          defeated: "cat_defeated",
        },
        1: {
          idle: "cat_idle",
          attack: "cat_weak_attack",
          ultimate: "cat_ultimate_blast",
          hurt: "cat_hurt",
          defeated: "cat_defeated",
        },
        2: {
          idle: "cat_golden_core",
          attack: "cat_golden_core",
          ultimate: "cat_golden_core",
          hurt: "cat_golden_core",
          defeated: "cat_defeated",
        },
        3: {
          idle: "cat_nascent_soul",
          attack: "cat_nascent_soul",
          ultimate: "cat_nascent_soul",
          hurt: "cat_nascent_soul",
          defeated: "cat_defeated",
        },
        4: {
          idle: "cat_celestial_sovereign",
          attack: "cat_celestial_sovereign",
          ultimate: "cat_celestial_sovereign",
          hurt: "cat_celestial_sovereign",
          defeated: "cat_defeated",
        },
      };
      const fallbackKey =
        (legacyMap[rIdx] && legacyMap[rIdx][cfg.key]) || "cat_idle";
      const fallbackAsset = this.assets[fallbackKey] || this.assets.cat_idle;
      if (fallbackAsset && fallbackAsset.loaded && fallbackAsset.img) {
        const w = fallbackAsset.img.naturalWidth || 360;
        const h = fallbackAsset.img.naturalHeight || 360;
        return {
          img: fallbackAsset.img,
          sx: 0,
          sy: 0,
          sw: w,
          sh: h,
          isSheet: false,
          frameIndex: 0,
          totalFrames: 1,
        };
      }

      return null;
    }

    /**
     * Phát một hiệu ứng VFX hoạt ảnh đa frame tại tọa độ (x, y)
     */
    spawnVFXClip(assetKey, x, y, options = {}) {
      const asset = this.assets[assetKey];
      const frames = options.frames || 6;
      const frameW = options.frameW || 128;
      const frameH = options.frameH || 128;

      this.activeVFXClips.push({
        assetKey,
        asset,
        x,
        y,
        size: options.size || 110,
        rotation: options.rotation || 0,
        fps: options.fps || 20,
        frames,
        frameW,
        frameH,
        color: options.color || "#FDE047",
        loop: !!options.loop,
        timer: 0,
        frameIndex: 0,
      });
    }

    /**
     * Vẽ toàn bộ các hiệu ứng VFX multi-frame đang hoạt động
     */
    drawVFXClips(ctx) {
      if (!this.activeVFXClips || this.activeVFXClips.length === 0) return;

      ctx.save();
      for (const fx of this.activeVFXClips) {
        const asset = fx.asset || this.assets[fx.assetKey];
        if (!asset || !asset.loaded || !asset.img) continue;

        const img = asset.img;
        const totalFrames = Math.max(
          1,
          Math.floor(img.naturalWidth / fx.frameW),
        );
        const fIdx = Math.min(totalFrames - 1, fx.frameIndex);

        ctx.save();
        ctx.translate(fx.x, fx.y);
        if (fx.rotation) ctx.rotate(fx.rotation);
        ctx.imageSmoothingEnabled = false;
        if (fx.color) {
          ctx.shadowColor = fx.color;
          ctx.shadowBlur = 18;
        }
        ctx.drawImage(
          img,
          fIdx * fx.frameW,
          0,
          fx.frameW,
          img.naturalHeight || fx.frameH,
          -fx.size / 2,
          -fx.size / 2,
          fx.size,
          fx.size,
        );
        ctx.restore();
      }
      ctx.restore();
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.SpriteAnimator = SpriteAnimator;
  root.Meowcha.REALM_FOLDERS = REALM_FOLDERS;
  root.Meowcha.STATE_CLIP_CONFIG = STATE_CLIP_CONFIG;
})(typeof window !== "undefined" ? window : globalThis);

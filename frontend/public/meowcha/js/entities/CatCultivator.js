/**
 * CatCultivator.js - Thực Thể Nhân Vật Miêu Kiếm Tôn Đa Cảnh Giới
 * Quản lý 5 cảnh giới nhân vật, 6 tư thế động (Poses), vật lý squash & stretch và pháp tướng độc quyền
 */
(function (root) {
  class CatCultivator {
    constructor(assets, realmVFX, animator = null) {
      this.assets = assets;
      this.realmVFX = realmVFX;
      this.animator = animator;
      this.time = 0;
    }

    update(dt = 0.016, gameState) {
      this.time += dt;

      // Hồi phục mượt mà sau khi bị choáng/đánh trúng
      if (gameState.catRecoveryPulse > 0) {
        gameState.catRecoveryPulse = Math.max(
          0,
          gameState.catRecoveryPulse - dt * 2.5,
        );
      }

      // Tự động chuyển về IDLE khi hết thời gian timer
      if (
        gameState.catStateTimer > 0 &&
        performance.now() >= gameState.catStateTimer
      ) {
        if (gameState.catState !== "DEFEATED") {
          gameState.catState = "IDLE";
          gameState.catStateTimer = 0;
        }
      }
    }

    draw(ctx, canvas, gameState, currentTarget) {
      const D = root.Meowcha && root.Meowcha.Device;
      const isMobile = D ? D.info.isMobile : (canvas.width <= 768);
      // Trên mobile: Đặt Miêu Tôn trang nghiêm trên đài phù vân, cách thanh thư cuộn bên dưới khoảng cách thoáng đãng
      const layout = (root.Meowcha && typeof root.Meowcha.getBattleLayout === 'function')
        ? root.Meowcha.getBattleLayout(canvas)
        : { catY: (canvas.height || 600) * 0.75, bottomThreshold: (canvas.height || 600) * 0.72 };
      const BASE_X = layout.catX || canvas.width / 2;
      const BASE_Y = layout.catY;
      const renderSize = layout.characterSize || (isMobile ? 125 : 180);
      const floatOffset = Math.sin(this.time * 2.8) * 4; // Miêu Tôn luôn bồng bềnh lơ lửng
      let drawX = BASE_X - renderSize / 2;
      let drawY = BASE_Y - renderSize + floatOffset;

      const realmIdx = Math.min(4, Math.max(0, gameState.realmIdx));
      const catState = gameState.catState;

      // 1. CHỌN SPRITE ĐỘNG ĐA KHUNG HÌNH THEO CẢNH GIỚI & TRẠNG THÁI (SPRITE ANIMATOR)
      const animFrame = this.animator
        ? this.animator.getCharacterFrame(realmIdx, catState)
        : null;
      const sprite = animFrame?.img || this.assets.cat_idle?.img;
      if (!sprite) return;

      ctx.save();
      const t = this.time * 2.5;

      // Authored pixel-art dais shared by the lobby and battlefield.
      const dais = this.assets.cultivation_dais;
      if (dais && dais.loaded) {
        const width = isMobile ? 150 : 190;
        ctx.drawImage(dais.img, BASE_X - width / 2, BASE_Y - 12, width, width * 763 / 2062);
      }

      // 2. PHÁP TƯỚNG & NỀN ĐÀI RIÊNG BIỆT CHO TỪNG CẢNH GIỚI (VẼ PHÍA SAU MÈO)
      if (realmIdx === 0) {
        this.realmVFX.drawRealm0(ctx, BASE_X, BASE_Y, catState);
      } else if (realmIdx === 1) {
        this.realmVFX.drawRealm1(ctx, BASE_X, BASE_Y, catState);
      } else if (realmIdx === 2) {
        this.realmVFX.drawRealm2(ctx, BASE_X, BASE_Y, drawY, catState);
      } else if (realmIdx === 3) {
        this.realmVFX.drawRealm3(ctx, BASE_X, BASE_Y, drawY, catState);
      } else if (realmIdx >= 4) {
        this.realmVFX.drawRealm4(ctx, BASE_X, BASE_Y, drawY, catState);
      }

      // 3. NGUYÊN ANH HỘ ĐẠO (CHIBI COMPANION CHO CẢNH GIỚI 3 - NGUYÊN ANH KỲ)
      if (realmIdx === 3 && this.assets?.chibi_companion?.loaded) {
        ctx.save();
        const chibiSize = isMobile ? 54 : 74;
        const chibiX = BASE_X - (isMobile ? 58 : 86) + Math.cos(t * 1.4) * 5;
        const chibiY = drawY + (isMobile ? 8 : 14) + Math.sin(t * 2.2) * 7;
        ctx.shadowColor = gameState.chibiAttackFlash > 0 ? "#FDE047" : "#C084FC";
        ctx.shadowBlur = gameState.chibiAttackFlash > 0 ? 28 : 16;
        ctx.drawImage(
          this.assets.chibi_companion.img,
          chibiX - chibiSize / 2,
          chibiY - chibiSize / 2,
          chibiSize,
          chibiSize,
        );
        ctx.restore();
      }

      // 4. BIẾN HÌNH ĐỘNG HỌC (SQUASH & STRETCH, LUNGE, RECOIL)
      let attackOffsetY = 0;
      let attackScaleX = 1.0;
      let attackScaleY = 1.0;
      let attackTilt = 0;

      if (catState === "WEAK_ATTACK") {
        const prog =
          gameState.catStateTimer > 0
            ? Math.max(
                0,
                Math.min(
                  1,
                  (gameState.catStateTimer - performance.now()) / 180,
                ),
              )
            : 0;
        const strikeWave = Math.sin(prog * Math.PI);
        attackOffsetY = -strikeWave * (isMobile ? 18 : 28);
        attackScaleX = 1.0 - strikeWave * 0.12;
        attackScaleY = 1.0 + strikeWave * 0.22;
        attackTilt = strikeWave * (realmIdx % 2 === 0 ? 0.11 : -0.11);

        // ============================================================
        // 5 ĐẠI PHÁP ẤN XUẤT CHIÊU TU TIÊN THEO CẢNH GIỚI (CASTING SEALS & AURAS)
        // ============================================================
        ctx.save();
        const shockColors = [
          "#22C55E",
          "#38BDF8",
          "#FBBF24",
          "#C084FC",
          "#F59E0B",
        ];
        const curColor = shockColors[realmIdx] || "#22C55E";
        ctx.shadowColor = curColor;

        if (realmIdx === 0) {
          // CẢNH 0 - THANH PHONG TRÚC DIỆP (Lá trúc xoay tròn cuốn kiếm khí)
          ctx.strokeStyle = "#22C55E";
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.ellipse(
            BASE_X,
            BASE_Y - 8,
            (1 - prog) * 55,
            (1 - prog) * 20,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();

          // Lá trúc bay
          for (let l = 0; l < 4; l++) {
            const la = (t * 4 + l * (Math.PI / 2)) % (Math.PI * 2);
            const lr = 35 * (1 - prog);
            ctx.fillStyle = "#10B981";
            ctx.fillRect(
              BASE_X + Math.cos(la) * lr - 3,
              BASE_Y - 10 + Math.sin(la) * (lr * 0.4) - 2,
              6,
              4,
            );
          }
        } else if (realmIdx === 1) {
          // CẢNH 1 - ÂM DƯƠNG THÁI CỰC KIẾT ẤN (Vòng Thái Cực lam ngọc xoay trước ngực)
          ctx.save();
          ctx.translate(BASE_X, BASE_Y - 35);
          ctx.rotate(t * 5);
          ctx.strokeStyle = "#38BDF8";
          ctx.lineWidth = 2.2;
          ctx.shadowBlur = 22;
          ctx.beginPath();
          ctx.arc(0, 0, 24 * strikeWave, 0, Math.PI * 2);
          ctx.stroke();

          // Hai vầng Âm Dương [ 陰 陽 ]
          ctx.fillStyle = "#67E8F9";
          ctx.beginPath();
          ctx.arc(8 * strikeWave, 0, 6 * strikeWave, 0, Math.PI * 2);
          ctx.arc(-8 * strikeWave, 0, 6 * strikeWave, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Sóng nước đài sen lan tỏa
          ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(
            BASE_X,
            BASE_Y - 10,
            (1 - prog) * 65,
            (1 - prog) * 24,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        } else if (realmIdx === 2) {
          // CẢNH 2 - KIM ĐAN KHAI QUANG • BÁT QUÁI HUY HOÀNG
          ctx.save();
          const coreY = BASE_Y - 82;
          // Kim Đan phát sáng chói lọi đỉnh đầu
          const grad = ctx.createRadialGradient(
            BASE_X,
            coreY,
            2,
            BASE_X,
            coreY,
            28,
          );
          grad.addColorStop(0, "#FFFBEB");
          grad.addColorStop(0.4, "#FDE047");
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(BASE_X, coreY, 26 * strikeWave, 0, Math.PI * 2);
          ctx.fill();

          // Vòng Bát Quái vàng kim phóng lớn
          ctx.strokeStyle = "#F59E0B";
          ctx.lineWidth = 2.4;
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.arc(BASE_X, BASE_Y - 30, (1 - prog) * 75, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (realmIdx === 3) {
          // CẢNH 3 - CỬU THIÊN THẦN LÔI • TỬ ĐIỆN QUANG TRỤ
          ctx.save();
          ctx.strokeStyle = "#F3E8FF";
          ctx.shadowColor = "#A855F7";
          ctx.shadowBlur = 28;
          ctx.lineWidth = 2.5;

          // Hồ quang sét đánh rực rỡ quanh Miêu Tôn
          ctx.beginPath();
          for (let z = 0; z < 5; z++) {
            const za = (z * Math.PI * 2) / 5 + t * 4;
            const zx = BASE_X + Math.cos(za) * (42 * strikeWave);
            const zy = BASE_Y - 45 + Math.sin(za) * (36 * strikeWave);
            ctx.moveTo(BASE_X, BASE_Y - 45);
            ctx.lineTo(zx, zy);
          }
          ctx.stroke();

          // Sóng xung kích sấm sét tím
          ctx.strokeStyle = "#C084FC";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(
            BASE_X,
            BASE_Y - 12,
            (1 - prog) * 85,
            (1 - prog) * 28,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
          ctx.restore();
        } else if (realmIdx >= 4) {
          // CẢNH 4 - THÁI THƯỢNG ĐẾ QUANG • CHÂN LONG HÓA HÌNH
          ctx.save();
          ctx.shadowColor = "#F59E0B";
          ctx.shadowBlur = 32;

          // Vòng hào quang Thái Dương bừng sáng sau lưng
          const sunGrad = ctx.createRadialGradient(
            BASE_X,
            BASE_Y - 55,
            10,
            BASE_X,
            BASE_Y - 55,
            68,
          );
          sunGrad.addColorStop(0, "rgba(254, 240, 138, 0.85)");
          sunGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.55)");
          sunGrad.addColorStop(1, "transparent");
          ctx.fillStyle = sunGrad;
          ctx.beginPath();
          ctx.arc(BASE_X, BASE_Y - 55, 62 * strikeWave, 0, Math.PI * 2);
          ctx.fill();

          // 6 Đạo Kiếm Quang màu vàng kim rực lửa phóng xòe hình quạt
          ctx.strokeStyle = "#FEF08A";
          ctx.lineWidth = 2.8;
          for (let k = 0; k < 6; k++) {
            const kang = -Math.PI / 2 + (k - 2.5) * 0.32;
            const kDist = (1 - prog) * 95;
            ctx.beginPath();
            ctx.moveTo(BASE_X, BASE_Y - 50);
            ctx.lineTo(
              BASE_X + Math.cos(kang) * kDist,
              BASE_Y - 50 + Math.sin(kang) * kDist,
            );
            ctx.stroke();
          }
          ctx.restore();
        }

        ctx.restore();
      } else if (catState === "ULTIMATE_BLAST") {
        const prog =
          gameState.catStateTimer > 0
            ? Math.max(
                0,
                Math.min(
                  1,
                  (gameState.catStateTimer - performance.now()) / 600,
                ),
              )
            : 0;
        const blastWave = Math.sin(prog * Math.PI);
        attackOffsetY = -blastWave * 42;
        attackScaleX = 1.0 - blastWave * 0.12;
        attackScaleY = 1.0 + blastWave * 0.24;

        ctx.save();
        ctx.strokeStyle = "#FDE047";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#F59E0B";
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(BASE_X, BASE_Y - 20, (1 - prog) * 88, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (catState === "HURT") {
        // Tẩu hỏa nhập ma: Miêu Tôn giật lùi nhẹ (recoil) kèm thở dốc rồi nhanh chóng định thần
        const recoilProg =
          gameState.catStateTimer > 0
            ? Math.max(
                0,
                Math.min(
                  1,
                  (gameState.catStateTimer - performance.now()) /
                    (gameState.isStunned ? 160 : 350),
                ),
              )
            : 0;
        const recoilWave = Math.sin(recoilProg * Math.PI);
        drawX += Math.sin(this.time * 24) * 4 * recoilWave;
        attackOffsetY = recoilWave * 10;
        attackScaleX = 1.0 + recoilWave * 0.06;
        attackScaleY = 1.0 - recoilWave * 0.08;
      }

      // Nhịp thở tĩnh tọa khi IDLE
      const breathScaleY = 1.0 + Math.sin(this.time * 3.2) * 0.02;
      const breathScaleX = 1.0 - Math.sin(this.time * 3.2) * 0.015;

      ctx.save();
      ctx.translate(BASE_X, BASE_Y + attackOffsetY);
      ctx.rotate(attackTilt);
      ctx.scale(breathScaleX * attackScaleX, breathScaleY * attackScaleY);
      ctx.translate(-BASE_X, -(BASE_Y + attackOffsetY));

      // Bộ lọc ánh sáng
      if (catState === "HURT") {
        ctx.filter = "drop-shadow(0 0 16px rgba(239, 68, 68, 0.95))";
      } else if (catState === "ULTIMATE_BLAST") {
        ctx.filter = "drop-shadow(0 0 22px rgba(251, 191, 36, 0.95))";
      } else if (realmIdx >= 2) {
        ctx.filter =
          realmIdx >= 4
            ? "drop-shadow(0 0 18px rgba(251, 191, 36, 0.85))"
            : realmIdx === 3
              ? "drop-shadow(0 0 15px rgba(192, 132, 252, 0.8))"
              : "drop-shadow(0 0 12px rgba(245, 158, 11, 0.75))";
      }

      if (animFrame && animFrame.isSheet) {
        ctx.drawImage(
          sprite,
          animFrame.sx,
          animFrame.sy,
          animFrame.sw,
          animFrame.sh,
          drawX,
          drawY,
          renderSize,
          renderSize,
        );
      } else {
        ctx.drawImage(sprite, drawX, drawY, renderSize, renderSize);
      }

      ctx.restore();
      ctx.restore();

      // 7. KHIÊN HỘ THÂN NỨT RẠN KHI BỊ ĐÁNH
      if (catState === "HURT" && gameState.shieldCharges > 0) {
        ctx.save();
        ctx.strokeStyle = "#F59E0B";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#F59E0B";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(BASE_X, drawY + 75, 65, 0, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(BASE_X - 35, drawY + 50);
        ctx.lineTo(BASE_X - 12, drawY + 72);
        ctx.lineTo(BASE_X - 18, drawY + 98);
        ctx.moveTo(BASE_X + 30, drawY + 55);
        ctx.lineTo(BASE_X + 10, drawY + 78);
        ctx.lineTo(BASE_X + 22, drawY + 94);
        ctx.stroke();
        ctx.restore();
      }

      // 9. VÒNG SAO HOA MẮT KHI BỊ CHOÁNG (STUN DIZZY RUNES)
      if (gameState.isStunned || gameState.catState === "HURT") {
        ctx.save();
        const headX = BASE_X;
        const headY = drawY + renderSize * 0.25;
        const stunRot = this.time * 6.5;
        const stunRad = isMobile ? 28 : 40;
        for (let s = 0; s < 4; s++) {
          const sa = stunRot + s * (Math.PI / 2);
          const sx = headX + Math.cos(sa) * stunRad;
          const sy = headY + Math.sin(sa) * (stunRad * 0.38);
          ctx.fillStyle = s % 2 === 0 ? "#FDE047" : "#F43F5E";
          ctx.shadowColor = "#F59E0B";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(sx, sy, isMobile ? 3.5 : 4.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.CatCultivator = CatCultivator;
})(typeof window !== 'undefined' ? window : globalThis);

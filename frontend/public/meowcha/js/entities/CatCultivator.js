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
      const isMobile = canvas.width <= 768 || canvas.height > canvas.width;
      const BASE_X = canvas.width / 2;
      // Trên mobile: Đẩy tọa độ Miêu Tôn lên ngay trên mép bàn phím ảo (~38-40% tính từ dưới lên = ~61% từ đỉnh xuống)
      const BASE_Y = isMobile ? (canvas.height * 0.48) : (canvas.height - 128);
      const renderSize = isMobile ? 125 : 180;
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

      // ============================================================
      // 8. PHI KIẾM TỎA KHÍ & SỢI TƠ KIẾM Ý KHÓA MỤC TIÊU (QI TETHER)
      // ============================================================
      this.drawAimingSwordAndTether(
        ctx,
        BASE_X,
        BASE_Y,
        realmIdx,
        currentTarget,
        gameState,
      );

      // 8.5 THANH TỤ KHÍ TUYỆT KỸ CẢNH GIỚI (REALM SKILL GAUGE)
      if (gameState.getRealmPassiveConfig) {
        const pCfg = gameState.getRealmPassiveConfig();
        const curCharge = Math.min(pCfg.max, gameState.realmPassiveCharge || 0);
        const barW = isMobile ? 96 : 124;
        const barH = 5;
        const barX = BASE_X - barW / 2;
        const barY = BASE_Y - (isMobile ? 4 : 8);

        ctx.save();
        ctx.fillStyle = "rgba(10, 5, 18, 0.78)";
        ctx.strokeStyle = "rgba(253, 224, 71, 0.45)";
        ctx.lineWidth = 1;
        ctx.fillRect(barX - 2, barY - 1, barW + 4, barH + 2);
        ctx.strokeRect(barX - 2, barY - 1, barW + 4, barH + 2);

        const segW = (barW - (pCfg.max - 1) * 2) / pCfg.max;
        for (let s = 0; s < pCfg.max; s++) {
          const sx = barX + s * (segW + 2);
          if (s < curCharge) {
            ctx.fillStyle = pCfg.color;
            ctx.shadowColor = pCfg.color;
            ctx.shadowBlur = 8;
          } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
            ctx.shadowBlur = 0;
          }
          ctx.fillRect(sx, barY, segW, barH);
        }

        ctx.font = isMobile ? "bold 8.5px 'Cinzel', serif" : "bold 9.5px 'Cinzel', serif";
        ctx.fillStyle = pCfg.color;
        ctx.textAlign = "center";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 4;
        ctx.fillText(pCfg.name, BASE_X, barY + (isMobile ? 12 : 14));
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

    drawAimingSwordAndTether(
      ctx,
      baseX,
      baseY,
      realmIdx,
      currentTarget,
      gameState,
    ) {
      const isMobile =
        (ctx.canvas && ctx.canvas.width <= 768) ||
        (typeof window !== "undefined" && window.innerWidth <= 768);
      const swordColors = [
        "#22C55E",
        "#38BDF8",
        "#F59E0B",
        "#C084FC",
        "#F59E0B",
      ];
      const auraColors = [
        "rgba(34, 197, 94, 0.75)",
        "rgba(56, 189, 248, 0.8)",
        "rgba(245, 158, 11, 0.85)",
        "rgba(192, 132, 252, 0.9)",
        "rgba(251, 191, 36, 0.95)",
      ];
      const curSwordColor = swordColors[realmIdx] || swordColors[0];
      const curAuraColor = auraColors[realmIdx] || auraColors[0];

      // ĐỊNH VỊ PHI KIẾM: Luôn bồng bềnh bên vai phải, KHÔNG BAO GIỜ đè ngang bụng Miêu Tôn
      let swordBaseX = baseX + (isMobile ? 52 : 72);
      let swordBaseY = baseY - (isMobile ? 80 : 112);
      let swordAngle = -Math.PI / 4; // Mặc định chúc lên 45 độ

      if (currentTarget && currentTarget.word) {
        // Có mục tiêu đang khóa: Kiếm ngự phong bay bổng lên cao chĩa thẳng vào mục tiêu
        swordBaseX = baseX + (isMobile ? 44 : 62);
        swordBaseY =
          baseY - (isMobile ? 98 : 138) + Math.sin(this.time * 6) * 5;

        const targetX = currentTarget.x;
        const targetY = currentTarget.y;
        swordAngle = Math.atan2(targetY - swordBaseY, targetX - swordBaseX);

        // Xuất kiếm: Khi gõ trúng (WEAK_ATTACK), phi kiếm phóng vút tới trước theo góc ngắm
        if (gameState && gameState.catState === "WEAK_ATTACK") {
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
          const thrust = Math.sin(prog * Math.PI) * (isMobile ? 20 : 34);
          swordBaseX += Math.cos(swordAngle) * thrust;
          swordBaseY += Math.sin(swordAngle) * thrust;
        }

        const swordTipX =
          swordBaseX + Math.cos(swordAngle) * (isMobile ? 28 : 42);
        const swordTipY =
          swordBaseY + Math.sin(swordAngle) * (isMobile ? 28 : 42);

        // ============================================================
        // A. TIA BẮN KIẾM KHÍ ĐIỆN ẢNH CỔ PHONG (CINEMATIC XIANXIA QI BEAM)
        // Dải lụa kiếm khí đa tầng, vòng linh phù xoay chuyển và lõi laser rực rỡ
        // ============================================================
        ctx.save();
        const keyPulse = ((gameState && gameState.catRecoveryPulse) || 0) * 1.8;

        // 1. Dải lụa sương mù kiếm khí uốn lượn bên ngoài (Outer Waving Silk Qi Mist)
        ctx.strokeStyle = curAuraColor;
        ctx.shadowColor = curSwordColor;
        ctx.shadowBlur = 24 + keyPulse * 20;
        ctx.lineWidth = Math.max(
          3.2,
          (4.2 + keyPulse * 3.0) * (isMobile ? 0.8 : 1.0),
        );
        ctx.beginPath();
        ctx.moveTo(swordTipX, swordTipY);
        const distToTarget = Math.hypot(
          targetX - swordTipX,
          targetY - swordTipY,
        );
        const midWave = Math.sin(this.time * 16) * (isMobile ? 4.5 : 8.5);
        const perpX = -(targetY - swordTipY) / distToTarget;
        const perpY = (targetX - swordTipX) / distToTarget;
        const midX = (swordTipX + targetX) / 2 + perpX * midWave;
        const midY = (swordTipY + targetY) / 2 + perpY * midWave;
        ctx.quadraticCurveTo(midX, midY, targetX, targetY);
        ctx.stroke();

        // 2. Dải sóng kiếm ý đối xứng ngược chiều (Braided Counter Wave)
        ctx.lineWidth = Math.max(
          1.8,
          (2.4 + keyPulse * 2.0) * (isMobile ? 0.75 : 0.95),
        );
        ctx.beginPath();
        ctx.moveTo(swordTipX, swordTipY);
        const midX2 = (swordTipX + targetX) / 2 - perpX * midWave * 0.8;
        const midY2 = (swordTipY + targetY) / 2 - perpY * midWave * 0.8;
        ctx.quadraticCurveTo(midX2, midY2, targetX, targetY);
        ctx.stroke();

        // 3. Lõi chùm Laser Bạch Quang phát sáng rực rỡ ở tâm tia
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = Math.max(1.4, 1.4 + keyPulse * 1.2);
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(swordTipX, swordTipY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        // 3.4 SPRITE TIA BẮN PIXEL ART ĐỘC BẢN TỪNG NHÂN VẬT (AUTHENTIC CHARACTER BEAM SPRITE)
        const beamSheetAsset = this.assets && this.assets[`char_r${realmIdx}_beam_sheet`];
        const beamSingleAsset = this.assets && this.assets[`char_r${realmIdx}_beam`];
        if ((beamSheetAsset && beamSheetAsset.loaded) || (beamSingleAsset && beamSingleAsset.loaded)) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.translate(swordTipX, swordTipY);
          ctx.rotate(swordAngle);
          const beamH = (isMobile ? 36 : 54) * (1.0 + keyPulse * 0.35);
          ctx.globalAlpha = Math.min(1.0, 0.82 + keyPulse * 0.18);
          ctx.shadowColor = curSwordColor;
          ctx.shadowBlur = 18 + keyPulse * 12;

          if (beamSheetAsset && beamSheetAsset.loaded) {
            const frameIdx = Math.floor(this.time * 14) % 4;
            const fw = Math.floor(beamSheetAsset.img.width / 4);
            const fh = beamSheetAsset.img.height;
            ctx.drawImage(
              beamSheetAsset.img,
              frameIdx * fw,
              0,
              fw,
              fh,
              0,
              -beamH / 2,
              distToTarget,
              beamH
            );
          } else if (beamSingleAsset && beamSingleAsset.loaded) {
            ctx.drawImage(
              beamSingleAsset.img,
              0,
              -beamH / 2,
              distToTarget,
              beamH
            );
          }
          ctx.restore();
        }

        // 3.5 TUYỆT KỸ TIA BẮN ĐẶC TRƯNG TỪNG CẢNH GIỚI (REALM-SPECIFIC BEAM SIGNATURES)
        if (realmIdx === 1) {
          // Trúc Cơ: Song Kiếm Hàn Băng Xoắn Kép (Twin Frost Helix)
          ctx.strokeStyle = "#67E8F9";
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          for (let step = 0; step <= 16; step++) {
            const u = step / 16;
            const hw = Math.sin(u * Math.PI * 4 - this.time * 18) * (isMobile ? 7 : 12);
            const hx = swordTipX + (targetX - swordTipX) * u + perpX * hw;
            const hy = swordTipY + (targetY - swordTipY) * u + perpY * hw;
            if (step === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.stroke();
        } else if (realmIdx === 2) {
          // Kim Đan: Hỏa Liên Nhật Viêm Trụ (Solar Core Pulse Rings)
          ctx.strokeStyle = "#FEF08A";
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(swordTipX, swordTipY);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();
        } else if (realmIdx === 3) {
          // Nguyên Anh: Tử Điện Lôi Mạch (Jagged Lightning Chain + Chibi Companion Tether)
          ctx.strokeStyle = "#E9D5FF";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(swordTipX, swordTipY);
          for (let z = 1; z <= 8; z++) {
            const u = z / 8;
            const jit = z < 8 ? (Math.sin(this.time * 35 + z * 4.1) * 10) : 0;
            ctx.lineTo(
              swordTipX + (targetX - swordTipX) * u + perpX * jit,
              swordTipY + (targetY - swordTipY) * u + perpY * jit,
            );
          }
          ctx.stroke();

          // Tia lôi điện phụ từ Chibi Nguyên Anh Hộ Đạo bên vai trái
          const chibiX = baseX - (isMobile ? 58 : 86);
          const chibiY = baseY - (isMobile ? 105 : 148);
          ctx.strokeStyle = gameState.chibiAttackFlash > 0 ? "#FDE047" : "rgba(192, 132, 252, 0.65)";
          ctx.lineWidth = gameState.chibiAttackFlash > 0 ? 3.0 : 1.5;
          ctx.beginPath();
          ctx.moveTo(chibiX, chibiY);
          ctx.quadraticCurveTo((chibiX + targetX) / 2, (chibiY + targetY) / 2 - 24, targetX, targetY);
          ctx.stroke();
        } else if (realmIdx >= 4) {
          // Độ Kiếp: Chân Long Đế Quang Mạch (Coiling Golden Dragon Spine Wave)
          ctx.strokeStyle = "#FDE047";
          ctx.lineWidth = 3.0;
          ctx.beginPath();
          for (let step = 0; step <= 20; step++) {
            const u = step / 20;
            const dw = Math.sin(u * Math.PI * 5 - this.time * 22) * (isMobile ? 9 : 15);
            const dx = swordTipX + (targetX - swordTipX) * u + perpX * dw;
            const dy = swordTipY + (targetY - swordTipY) * u + perpY * dw;
            if (step === 0) ctx.moveTo(dx, dy);
            else ctx.lineTo(dx, dy);
          }
          ctx.stroke();
        }

        // 4. VÒNG LINH PHÙ XOAY TRÒN CHẠY DỌC THEO TIA BẮN (TRAVELING RUNIC RINGS)
        const ringProgress = (this.time * 2.2) % 1.0;
        for (let r = 0; r < 3; r++) {
          const prog = (ringProgress + r * 0.33) % 1.0;
          const rx = swordTipX + (targetX - swordTipX) * prog;
          const ry = swordTipY + (targetY - swordTipY) * prog;
          ctx.save();
          ctx.translate(rx, ry);
          ctx.rotate(swordAngle + Math.PI / 2);
          ctx.strokeStyle = prog < 0.5 ? curSwordColor : "#FEF08A";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            isMobile ? 7 : 11,
            isMobile ? 3 : 5,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
          ctx.restore();
        }

        // 5. HẠT LINH KHÍ XUNG KÍCH CHẠY DỌC TIA KIẾM
        for (let sp = 0; sp < 4; sp++) {
          const sProg = (this.time * 4.5 + sp * 0.25) % 1.0;
          const sx =
            swordTipX +
            (targetX - swordTipX) * sProg +
            (Math.random() - 0.5) * 6;
          const sy =
            swordTipY +
            (targetY - swordTipY) * sProg +
            (Math.random() - 0.5) * 6;
          ctx.fillStyle = "#FFFBEB";
          ctx.shadowColor = curSwordColor;
          ctx.shadowBlur = 12;
          ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
        }

        ctx.restore();

        // HÀO QUANG ĐỌT KIẾM & HIỆU ỨNG BẮN RA ĐỘC BẢN TỪNG NHÂN VẬT (CHARACTER MUZZLE FIRING BURST)
        ctx.save();
        const tipPulse = 1.0 + Math.sin(this.time * 12) * 0.3 + keyPulse;
        const muzzleSheetAsset = this.assets && this.assets[`char_r${realmIdx}_muzzle_sheet`];
        const muzzleSingleAsset = this.assets && this.assets[`char_r${realmIdx}_muzzle`];
        const isFiringNow = (gameState && (gameState.catState === "WEAK_ATTACK" || gameState.catState === "ULTIMATE_BLAST")) || keyPulse > 0.08;

        if ((muzzleSheetAsset && muzzleSheetAsset.loaded) || (muzzleSingleAsset && muzzleSingleAsset.loaded)) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.translate(swordTipX, swordTipY);
          ctx.rotate(swordAngle);
          const burstScale = isFiringNow ? (1.28 + keyPulse * 0.45) : (0.72 + Math.sin(this.time * 10) * 0.08);
          const burstW = (isMobile ? 54 : 78) * burstScale;
          const burstH = (isMobile ? 36 : 52) * burstScale;
          ctx.globalAlpha = isFiringNow ? 0.98 : 0.78;
          ctx.shadowColor = curSwordColor;
          ctx.shadowBlur = isFiringNow ? 28 : 16;

          if (muzzleSheetAsset && muzzleSheetAsset.loaded) {
            const fIdx = Math.floor(this.time * (isFiringNow ? 22 : 12)) % 4;
            const fw = Math.floor(muzzleSheetAsset.img.width / 4);
            const fh = muzzleSheetAsset.img.height;
            ctx.drawImage(
              muzzleSheetAsset.img,
              fIdx * fw,
              0,
              fw,
              fh,
              -burstW * 0.22,
              -burstH / 2,
              burstW,
              burstH
            );
          } else if (muzzleSingleAsset && muzzleSingleAsset.loaded) {
            ctx.drawImage(
              muzzleSingleAsset.img,
              -burstW * 0.22,
              -burstH / 2,
              burstW,
              burstH
            );
          }
          ctx.restore();
        } else {
          ctx.fillStyle = "#FFFFFF";
          ctx.shadowColor = curSwordColor;
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.arc(swordTipX, swordTipY, 4.5 * tipPulse, 0, Math.PI * 2);
          ctx.fill();
        }

        // PHÁP TRẬN BÁT QUÁI KHÓA MỤC TIÊU CỔ TRANG TẠI THIÊN THẠCH
        ctx.translate(targetX, targetY);
        const isMob =
          (ctx.canvas && ctx.canvas.width <= 600) ||
          (typeof window !== "undefined" && window.innerWidth <= 600);
        const reticleRadius =
          (currentTarget.radius || (isMob ? 38 : 46)) + (isMob ? 4 : 8);
        const rot = this.time * 1.6;

        // Vòng ngoài phong ấn đứt đoạn xoay chậm ôm sát ma thạch
        ctx.strokeStyle = "rgba(253, 224, 71, 0.85)";
        ctx.lineWidth = isMob ? 1.2 : 1.6;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, reticleRadius, rot, rot + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 4 Chữ triện phong ấn 4 phương [ 乾 坤 坎 离 ]
        const seals = ["乾", "坤", "坎", "离"];
        ctx.font = isMob
          ? "bold 9px 'Cinzel', serif"
          : "bold 10.5px 'Cinzel', serif";
        ctx.fillStyle = "#FEF08A";
        ctx.shadowColor = "#F59E0B";
        ctx.shadowBlur = 8;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let b = 0; b < 4; b++) {
          ctx.save();
          const ang = rot + b * (Math.PI / 2);
          const tx = Math.cos(ang) * (reticleRadius + (isMob ? 2 : 3));
          const ty = Math.sin(ang) * (reticleRadius + (isMob ? 2 : 3));
          ctx.fillText(seals[b], tx, ty);
          ctx.restore();
        }
        ctx.restore();
      } else {
        // Không có mục tiêu: Kiếm hộ thân lơ lửng bồng bềnh bên vai phải
        swordBaseY += Math.sin(this.time * 3.5) * 8;
        swordAngle = -Math.PI / 3.5 + Math.sin(this.time * 2.5) * 0.08;
      }

      // ============================================================
      // B. VẼ THANH PHI KIẾM HỘ THÂN ĐỘC BẢN THEO CẢNH GIỚI (PIXEL ART)
      // ============================================================
      ctx.save();
      ctx.translate(swordBaseX, swordBaseY);
      ctx.rotate(swordAngle);

      // Vầng kiếm khí bọc ngoài (Sword Aura)
      ctx.shadowColor = curSwordColor;
      ctx.shadowBlur = currentTarget ? 26 : 16;

      // CHỌN ASSET KIẾM RIÊNG TỪNG CẢNH GIỚI
      let swordImg = null;
      if (realmIdx === 0) {
        // Cảnh 0 (Luyện Khí): Thanh Trúc Kiếm
        swordImg =
          (this.assets?.prop_bamboo_sword?.loaded &&
            this.assets.prop_bamboo_sword.img) ||
          (this.assets?.prop_jade_sword?.loaded &&
            this.assets.prop_jade_sword.img) ||
          null;
      } else if (realmIdx === 1) {
        // Cảnh 1 (Trúc Cơ): Lam Ngọc Kiếm
        swordImg =
          (this.assets?.prop_jade_sword?.loaded &&
            this.assets.prop_jade_sword.img) ||
          (this.assets?.prop_bamboo_sword?.loaded &&
            this.assets.prop_bamboo_sword.img) ||
          null;
      } else if (realmIdx === 2) {
        // Cảnh 2 (Kim Đan): Kim Đan Bát Quái Kiếm (Hoàng Kim Phi Kiếm)
        swordImg =
          (this.assets?.prop_golden_sword?.loaded &&
            this.assets.prop_golden_sword.img) ||
          (this.assets?.prop_jade_sword?.loaded &&
            this.assets.prop_jade_sword.img) ||
          null;
      } else if (realmIdx === 3) {
        // Cảnh 3 (Nguyên Anh): Cửu Thiên Thần Lôi Kiếm (Tử Điện Lôi Thần)
        swordImg =
          (this.assets?.sword_realm3_thunder?.loaded &&
            this.assets.sword_realm3_thunder.img) ||
          (this.assets?.prop_jade_sword?.loaded &&
            this.assets.prop_jade_sword.img) ||
          null;
      } else if (realmIdx >= 4) {
        // Cảnh 4 (Hóa Thần / Thái Thượng Miêu Hoàng): Chân Long Hoàng Kim Kiếm
        swordImg =
          (this.assets?.sword_realm4_dragon?.loaded &&
            this.assets.sword_realm4_dragon.img) ||
          (this.assets?.sword_realm3_thunder?.loaded &&
            this.assets.sword_realm3_thunder.img) ||
          (this.assets?.prop_jade_sword?.loaded &&
            this.assets.prop_jade_sword.img) ||
          null;
      }

      if (swordImg) {
        ctx.imageSmoothingEnabled = false; // Chuẩn Retro Pixel Art
        const swordLen = isMobile ? 52 : 68;
        ctx.save();
        // Cân chỉnh góc xoay riêng từng loại kiếm để mũi kiếm chỉ thẳng trục +X (hướng tới mục tiêu)
        if (realmIdx === 0) {
          // Thanh Trúc Kiếm (185x280) nghiêng -75.7° -> xoay +1.322 rad
          const drawH = swordLen;
          const drawW = Math.round(185 * (drawH / 280));
          ctx.rotate(1.322);
          ctx.drawImage(swordImg, -drawW / 2, -drawH / 2 + 8, drawW, drawH);
        } else if (realmIdx === 1) {
          // Lam Ngọc Kiếm (190x280) nghiêng -74.2° -> xoay +1.295 rad
          const drawH = swordLen;
          const drawW = Math.round(190 * (drawH / 280));
          ctx.rotate(1.295);
          ctx.drawImage(swordImg, -drawW / 2, -drawH / 2 + 10, drawW, drawH);
        } else if (realmIdx === 2) {
          // Kim Đan Bát Quái Kiếm (190x280) mũi hướng lên -90° -> xoay +PI/2 rad
          const drawH = swordLen + 4;
          const drawW = Math.round(190 * (drawH / 280));
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(swordImg, -drawW / 2, -drawH / 2 + 6, drawW, drawH);
        } else if (realmIdx === 3) {
          // Cửu Thiên Thần Lôi Kiếm (256x256) nghiêng -50.1° -> xoay +0.875 rad
          const drawSize = swordLen;
          ctx.rotate(0.875);
          ctx.drawImage(swordImg, -drawSize / 2, -drawSize / 2 + 1, drawSize, drawSize);
        } else {
          // Chân Long Thái Sơ Kiếm (256x256) nghiêng -52.1° -> xoay +0.909 rad
          const drawSize = swordLen + 6;
          ctx.rotate(0.909);
          ctx.drawImage(swordImg, -drawSize / 2, -drawSize / 2 - 3, drawSize, drawSize);
        }
        ctx.restore();

        // Hiệu ứng phụ riêng: Cảnh 2 có vòng Bát Quái, Cảnh 3 có tia sét, Cảnh 4 có rồng vàng lượn
        if (realmIdx === 2) {
          ctx.strokeStyle = "rgba(253, 224, 71, 0.75)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.stroke();
        } else if (realmIdx === 3) {
          ctx.strokeStyle = "#F3E8FF";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-10, (Math.random() - 0.5) * 6);
          ctx.lineTo(12, (Math.random() - 0.5) * 8);
          ctx.stroke();
        } else if (realmIdx >= 4) {
          ctx.strokeStyle = "#FEF08A";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(4, 0, 20, 0, Math.PI * 1.5);
          ctx.stroke();
        }
      } else {
        // Fallback nếu ảnh chưa tải xong
        ctx.fillStyle = curSwordColor;
        ctx.beginPath();
        ctx.moveTo(34, 0);
        ctx.lineTo(-6, -5);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-6, 5);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.CatCultivator = CatCultivator;
})(typeof window !== "undefined" ? window : globalThis);

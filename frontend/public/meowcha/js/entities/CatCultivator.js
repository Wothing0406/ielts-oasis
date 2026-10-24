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
      const BASE_X = canvas.width / 2;
      // Trên mobile: Đặt Miêu Tôn trang nghiêm trên đài phù vân, cách thanh thư cuộn bên dưới khoảng cách thoáng đãng
      const BASE_Y = root.Meowcha.getBattleLayout(canvas).catY;
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

      // 8. PHI KIẾM TỎA KHÍ & SỢI TƠ KIẾM Ý KHÓA MỤC TIÊU (QI TETHER)
      this.drawAimingSwordAndTether(
        ctx,
        BASE_X,
        BASE_Y,
        realmIdx,
        currentTarget,
        gameState,
      );

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

        // Điểm ngắm cắm vào mép dưới của thiên thạch, tuyệt đối không đâm xuyên qua tâm chữ cái
        const aimTargetX = currentTarget.x;
        const aimTargetY = currentTarget.y + (isMobile ? 48 : 56);
        swordAngle = Math.atan2(aimTargetY - swordBaseY, aimTargetX - swordBaseX);

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
        // SỢI TƠ KIẾM Ý TIÊN THIÊN (CELESTIAL QI THREAD)
        // Thanh thoát, mỏng nhẹ (1.2px), bán trong suốt, uốn lượn cắm vào đáy thiên thạch
        // Tuyệt đối KHÔNG che khuất từ ngữ hay tạo dải beam đặc 50px
        // ============================================================
        ctx.save();
        ctx.strokeStyle = "rgba(45, 226, 141, 0.4)";
        ctx.shadowColor = curSwordColor;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([6, 5]);

        const distToTarget = Math.hypot(aimTargetX - swordTipX, aimTargetY - swordTipY);
        const midWave = Math.sin(this.time * 12) * (isMobile ? 3 : 5);
        const perpX = -(aimTargetY - swordTipY) / (distToTarget || 1);
        const perpY = (aimTargetX - swordTipX) / (distToTarget || 1);
        const midX = (swordTipX + aimTargetX) / 2 + perpX * midWave;
        const midY = (swordTipY + aimTargetY) / 2 + perpY * midWave;

        ctx.beginPath();
        ctx.moveTo(swordTipX, swordTipY);
        ctx.quadraticCurveTo(midX, midY, aimTargetX, aimTargetY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Điểm sáng nhỏ tinh tế ở đầu mũi kiếm
        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = curSwordColor;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(swordTipX, swordTipY, 2.8, 0, Math.PI * 2);
        ctx.fill();
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

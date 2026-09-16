/**
 * CatCultivator.js - Thực Thể Nhân Vật Miêu Kiếm Tôn Đa Cảnh Giới
 * Quản lý 5 cảnh giới nhân vật, 6 tư thế động (Poses), vật lý squash & stretch và pháp tướng độc quyền
 */
(function(root) {
  class CatCultivator {
    constructor(assets, realmVFX) {
      this.assets = assets;
      this.realmVFX = realmVFX;
      this.time = 0;
    }

    update(dt = 0.016, gameState) {
      this.time += dt;

      // Hồi phục mượt mà sau khi bị choáng/đánh trúng
      if (gameState.catRecoveryPulse > 0) {
        gameState.catRecoveryPulse = Math.max(0, gameState.catRecoveryPulse - dt * 2.5);
      }

      // Tự động chuyển về IDLE khi hết thời gian timer
      if (gameState.catStateTimer > 0 && performance.now() >= gameState.catStateTimer) {
        if (gameState.catState !== "DEFEATED") {
          gameState.catState = "IDLE";
          gameState.catStateTimer = 0;
        }
      }
    }

    draw(ctx, canvas, gameState, currentTarget) {
      const isMobile = canvas.width <= 768 || (canvas.height > canvas.width);
      const BASE_X = canvas.width / 2;
      // Trên mobile: Đẩy tọa độ Miêu Tôn lên ngay trên mép bàn phím ảo (~38-40% tính từ dưới lên = ~61% từ đỉnh xuống)
      const BASE_Y = isMobile ? (canvas.height * 0.61) : (canvas.height - 35);
      const renderSize = isMobile ? 125 : 180;
      const floatOffset = Math.sin(this.time * 2.8) * 4; // Miêu Tôn luôn bồng bềnh lơ lửng
      let drawX = BASE_X - renderSize / 2;
      let drawY = BASE_Y - renderSize + floatOffset;

      const realmIdx = Math.min(4, Math.max(0, gameState.realmIdx));
      const catState = gameState.catState;

      // 1. CHỌN SPRITE THEO CẢNH GIỚI NHÂN VẬT (BẢO LƯU DANH TÍNH)
      let sprite = this.assets.cat_idle?.img;

      if (catState === "DEFEATED" && this.assets.cat_defeated?.loaded) {
        sprite = this.assets.cat_defeated.img;
      } else if (catState === "HURT" && this.assets.cat_hurt?.loaded) {
        // Khi bị đánh: Nếu là Luyện Khí dùng cat_hurt, các cảnh giới cao giữ hình thể cảnh giới kèm hiệu ứng chấn thương
        if (realmIdx === 0) {
          sprite = this.assets.cat_hurt.img;
        } else if (realmIdx === 1) {
          sprite = this.assets.cat_weak_attack?.loaded ? this.assets.cat_weak_attack.img : this.assets.cat_idle.img;
        } else if (realmIdx === 2 && this.assets.cat_golden_core?.loaded) {
          sprite = this.assets.cat_golden_core.img;
        } else if (realmIdx === 3 && this.assets.cat_nascent_soul?.loaded) {
          sprite = this.assets.cat_nascent_soul.img;
        } else if (realmIdx >= 4 && this.assets.cat_celestial_sovereign?.loaded) {
          sprite = this.assets.cat_celestial_sovereign.img;
        }
      } else if (catState === "ULTIMATE_BLAST") {
        if (realmIdx <= 1 && this.assets.cat_ultimate_blast?.loaded) {
          sprite = this.assets.cat_ultimate_blast.img;
        } else if (realmIdx === 2 && this.assets.cat_golden_core?.loaded) {
          sprite = this.assets.cat_golden_core.img;
        } else if (realmIdx === 3 && this.assets.cat_nascent_soul?.loaded) {
          sprite = this.assets.cat_nascent_soul.img;
        } else if (realmIdx >= 4 && this.assets.cat_celestial_sovereign?.loaded) {
          sprite = this.assets.cat_celestial_sovereign.img;
        } else {
          sprite = this.assets.cat_idle?.loaded ? this.assets.cat_idle.img : null;
        }
      } else if (catState === "WEAK_ATTACK") {
        // TƯ THẾ XUẤT CHIÊU KHI GÕ PHÍM TRÚNG
        if (realmIdx <= 1 && this.assets.cat_weak_attack?.loaded) {
          sprite = this.assets.cat_weak_attack.img;
        } else if (realmIdx === 2 && this.assets.cat_golden_core?.loaded) {
          sprite = this.assets.cat_golden_core.img;
        } else if (realmIdx === 3 && this.assets.cat_nascent_soul?.loaded) {
          sprite = this.assets.cat_nascent_soul.img;
        } else if (realmIdx >= 4 && this.assets.cat_celestial_sovereign?.loaded) {
          sprite = this.assets.cat_celestial_sovereign.img;
        } else {
          sprite = this.assets.cat_idle?.loaded ? this.assets.cat_idle.img : null;
        }
      } else {
        // TƯ THẾ TĨNH TỌA THIỀN ĐỊNH (IDLE) CHUẨN CẢNH GIỚI
        if (realmIdx >= 4 && this.assets.cat_celestial_sovereign?.loaded) {
          sprite = this.assets.cat_celestial_sovereign.img; // Thái Thượng
        } else if (realmIdx === 3 && this.assets.cat_nascent_soul?.loaded) {
          sprite = this.assets.cat_nascent_soul.img;        // Nguyên Anh
        } else if (realmIdx === 2 && this.assets.cat_golden_core?.loaded) {
          sprite = this.assets.cat_golden_core.img;        // Kim Đan
        } else if (realmIdx === 1) {
          sprite = this.assets.cat_idle?.loaded ? this.assets.cat_idle.img : null;
        } else {
          sprite = this.assets.cat_idle?.loaded ? this.assets.cat_idle.img : null;
        }
      }

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

      // 3. ĐUÔI TIÊN MÈO VE VẨY BỒNG BỀNH (CUTE VIBE)
      ctx.save();
      const tailBaseX = BASE_X + 28;
      const tailBaseY = BASE_Y - 48;
      const tailSway = Math.sin(t * 1.8) * 16;
      const tailLift = catState === "WEAK_ATTACK" ? -14 : (catState === "HURT" ? 10 : 0);
      ctx.strokeStyle = realmIdx >= 2 ? "#FEF08A" : "#FDE68A";
      ctx.lineWidth = 9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tailBaseX, tailBaseY);
      ctx.bezierCurveTo(tailBaseX + 18, tailBaseY - 12 + tailLift, tailBaseX + 26 + tailSway, tailBaseY - 32 + tailLift, tailBaseX + 16 + tailSway, tailBaseY - 48 + tailLift);
      ctx.stroke();

      // Chóp đuôi trắng muốt
      ctx.strokeStyle = "#FFFDF5";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(tailBaseX + 24 + tailSway * 0.8, tailBaseY - 38 + tailLift);
      ctx.lineTo(tailBaseX + 16 + tailSway, tailBaseY - 48 + tailLift);
      ctx.stroke();
      ctx.restore();

      // 4. BIẾN HÌNH ĐỘNG HỌC (SQUASH & STRETCH, LUNGE, RECOIL)
      let attackOffsetY = 0;
      let attackScaleX = 1.0;
      let attackScaleY = 1.0;
      let attackTilt = 0;

      if (catState === "WEAK_ATTACK") {
        const prog = gameState.catStateTimer > 0 ? Math.max(0, Math.min(1, (gameState.catStateTimer - performance.now()) / 180)) : 0;
        const strikeWave = Math.sin(prog * Math.PI);
        attackOffsetY = -strikeWave * (isMobile ? 18 : 28);
        attackScaleX = 1.0 - strikeWave * 0.12;
        attackScaleY = 1.0 + strikeWave * 0.22;
        attackTilt = strikeWave * (realmIdx % 2 === 0 ? 0.11 : -0.11);

        // ============================================================
        // 5 ĐẠI PHÁP ẤN XUẤT CHIÊU TU TIÊN THEO CẢNH GIỚI (CASTING SEALS & AURAS)
        // ============================================================
        ctx.save();
        const shockColors = ["#22C55E", "#38BDF8", "#FBBF24", "#C084FC", "#F59E0B"];
        const curColor = shockColors[realmIdx] || "#22C55E";
        ctx.shadowColor = curColor;

        if (realmIdx === 0) {
          // CẢNH 0 - THANH PHONG TRÚC DIỆP (Lá trúc xoay tròn cuốn kiếm khí)
          ctx.strokeStyle = "#22C55E";
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.ellipse(BASE_X, BASE_Y - 8, (1 - prog) * 55, (1 - prog) * 20, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Lá trúc bay
          for (let l = 0; l < 4; l++) {
            const la = (t * 4 + l * (Math.PI / 2)) % (Math.PI * 2);
            const lr = 35 * (1 - prog);
            ctx.fillStyle = "#10B981";
            ctx.fillRect(BASE_X + Math.cos(la) * lr - 3, BASE_Y - 10 + Math.sin(la) * (lr * 0.4) - 2, 6, 4);
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
          ctx.ellipse(BASE_X, BASE_Y - 10, (1 - prog) * 65, (1 - prog) * 24, 0, 0, Math.PI * 2);
          ctx.stroke();

        } else if (realmIdx === 2) {
          // CẢNH 2 - KIM ĐAN KHAI QUANG • BÁT QUÁI HUY HOÀNG
          ctx.save();
          const coreY = BASE_Y - 82;
          // Kim Đan phát sáng chói lọi đỉnh đầu
          const grad = ctx.createRadialGradient(BASE_X, coreY, 2, BASE_X, coreY, 28);
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
          ctx.ellipse(BASE_X, BASE_Y - 12, (1 - prog) * 85, (1 - prog) * 28, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

        } else if (realmIdx >= 4) {
          // CẢNH 4 - THÁI THƯỢNG ĐẾ QUANG • CHÂN LONG HÓA HÌNH
          ctx.save();
          ctx.shadowColor = "#F59E0B";
          ctx.shadowBlur = 32;

          // Vòng hào quang Thái Dương bừng sáng sau lưng
          const sunGrad = ctx.createRadialGradient(BASE_X, BASE_Y - 55, 10, BASE_X, BASE_Y - 55, 68);
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
            ctx.lineTo(BASE_X + Math.cos(kang) * kDist, BASE_Y - 50 + Math.sin(kang) * kDist);
            ctx.stroke();
          }
          ctx.restore();
        }

        ctx.restore();

      } else if (catState === "ULTIMATE_BLAST") {
        const prog = gameState.catStateTimer > 0 ? Math.max(0, Math.min(1, (gameState.catStateTimer - performance.now()) / 600)) : 0;
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
        const recoilProg = gameState.catStateTimer > 0 ? Math.max(0, Math.min(1, (gameState.catStateTimer - performance.now()) / (gameState.isStunned ? 160 : 350))) : 0;
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
        ctx.filter = realmIdx >= 4 ? "drop-shadow(0 0 18px rgba(251, 191, 36, 0.85))" : (realmIdx === 3 ? "drop-shadow(0 0 15px rgba(192, 132, 252, 0.8))" : "drop-shadow(0 0 12px rgba(245, 158, 11, 0.75))");
      }

      ctx.drawImage(sprite, drawX, drawY, renderSize, renderSize);

      // 5. CUTE VIBE: ĐÔI MÁ HỒNG ĐÀO HOA
      ctx.fillStyle = "rgba(255, 120, 150, 0.42)";
      ctx.beginPath();
      ctx.arc(BASE_X - 22, drawY + 88, 6.5, 0, Math.PI * 2);
      ctx.arc(BASE_X + 22, drawY + 88, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // 6. CHỚP MẮT
      if (catState === "HURT") {
        ctx.strokeStyle = "#DC2626";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(BASE_X - 16, drawY + 76, 5, 0, Math.PI * 2);
        ctx.arc(BASE_X + 16, drawY + 76, 5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const isBlinking = (Math.floor(this.time * 1.5) % 6 === 0) && (Math.sin(this.time * 15) > 0.6);
        if (isBlinking && catState === "IDLE") {
          ctx.strokeStyle = "#38240D";
          ctx.lineWidth = 2.5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.arc(BASE_X - 15, drawY + 76, 5, Math.PI, 0);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(BASE_X + 15, drawY + 76, 5, Math.PI, 0);
          ctx.stroke();
        }
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
      this.drawAimingSwordAndTether(ctx, BASE_X, BASE_Y, realmIdx, currentTarget, gameState);

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

    drawAimingSwordAndTether(ctx, baseX, baseY, realmIdx, currentTarget, gameState) {
      const isMobile = (ctx.canvas && ctx.canvas.width <= 768) || (typeof window !== "undefined" && window.innerWidth <= 768);
      const swordColors = ["#22C55E", "#38BDF8", "#F59E0B", "#C084FC", "#F59E0B"];
      const auraColors = ["rgba(34, 197, 94, 0.75)", "rgba(56, 189, 248, 0.8)", "rgba(245, 158, 11, 0.85)", "rgba(192, 132, 252, 0.9)", "rgba(251, 191, 36, 0.95)"];
      const curSwordColor = swordColors[realmIdx] || swordColors[0];
      const curAuraColor = auraColors[realmIdx] || auraColors[0];

      // ĐỊNH VỊ PHI KIẾM: Luôn bồng bềnh bên vai phải, KHÔNG BAO GIỜ đè ngang bụng Miêu Tôn
      let swordBaseX = baseX + (isMobile ? 52 : 72);
      let swordBaseY = baseY - (isMobile ? 80 : 112);
      let swordAngle = -Math.PI / 4; // Mặc định chúc lên 45 độ

      if (currentTarget && currentTarget.word) {
        // Có mục tiêu đang khóa: Kiếm ngự phong bay bổng lên cao chĩa thẳng vào mục tiêu
        swordBaseX = baseX + (isMobile ? 44 : 62);
        swordBaseY = baseY - (isMobile ? 98 : 138) + Math.sin(this.time * 6) * 5;

        const targetX = currentTarget.x;
        const targetY = currentTarget.y;
        swordAngle = Math.atan2(targetY - swordBaseY, targetX - swordBaseX);

        // Xuất kiếm: Khi gõ trúng (WEAK_ATTACK), phi kiếm phóng vút tới trước theo góc ngắm
        if (gameState && gameState.catState === "WEAK_ATTACK") {
          const prog = gameState.catStateTimer > 0 ? Math.max(0, Math.min(1, (gameState.catStateTimer - performance.now()) / 180)) : 0;
          const thrust = Math.sin(prog * Math.PI) * (isMobile ? 20 : 34);
          swordBaseX += Math.cos(swordAngle) * thrust;
          swordBaseY += Math.sin(swordAngle) * thrust;
        }

        const swordTipX = swordBaseX + Math.cos(swordAngle) * (isMobile ? 28 : 42);
        const swordTipY = swordBaseY + Math.sin(swordAngle) * (isMobile ? 28 : 42);

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
        ctx.lineWidth = Math.max(3.2, (4.2 + keyPulse * 3.0) * (isMobile ? 0.8 : 1.0));
        ctx.beginPath();
        ctx.moveTo(swordTipX, swordTipY);
        const distToTarget = Math.hypot(targetX - swordTipX, targetY - swordTipY);
        const midWave = Math.sin(this.time * 16) * (isMobile ? 4.5 : 8.5);
        const perpX = -(targetY - swordTipY) / distToTarget;
        const perpY = (targetX - swordTipX) / distToTarget;
        const midX = (swordTipX + targetX) / 2 + perpX * midWave;
        const midY = (swordTipY + targetY) / 2 + perpY * midWave;
        ctx.quadraticCurveTo(midX, midY, targetX, targetY);
        ctx.stroke();

        // 2. Dải sóng kiếm ý đối xứng ngược chiều (Braided Counter Wave)
        ctx.lineWidth = Math.max(1.8, (2.4 + keyPulse * 2.0) * (isMobile ? 0.75 : 0.95));
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
          ctx.ellipse(0, 0, isMobile ? 7 : 11, isMobile ? 3 : 5, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // 5. HẠT LINH KHÍ XUNG KÍCH CHẠY DỌC TIA KIẾM
        for (let sp = 0; sp < 4; sp++) {
          const sProg = ((this.time * 4.5 + sp * 0.25) % 1.0);
          const sx = swordTipX + (targetX - swordTipX) * sProg + (Math.random() - 0.5) * 6;
          const sy = swordTipY + (targetY - swordTipY) * sProg + (Math.random() - 0.5) * 6;
          ctx.fillStyle = "#FFFBEB";
          ctx.shadowColor = curSwordColor;
          ctx.shadowBlur = 12;
          ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
        }

        ctx.restore();

        // HÀO QUANG ĐỌT KIẾM TỤ LINH KHÍ (SWORD TIP CONCENTRATION)
        ctx.save();
        const tipPulse = 1.0 + Math.sin(this.time * 12) * 0.3 + keyPulse;
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = curSwordColor;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(swordTipX, swordTipY, 4.5 * tipPulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = curSwordColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(swordTipX, swordTipY, 10 * tipPulse, 0, Math.PI * 2);
        ctx.stroke();

        // PHÁP TRẬN BÁT QUÁI KHÓA MỤC TIÊU CỔ TRANG TẠI THIÊN THẠCH
        ctx.translate(targetX, targetY);
        const reticleRadius = (currentTarget.radius || 48) + 16;
        const rot = this.time * 1.6;

        // Vòng ngoài phong ấn đứt đoạn xoay chậm
        ctx.strokeStyle = "rgba(253, 224, 71, 0.85)";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, reticleRadius, rot, rot + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 4 Chữ triện phong ấn 4 phương [ 乾 坤 坎 离 ]
        const seals = ["乾", "坤", "坎", "离"];
        ctx.font = "bold 11px 'Cinzel', serif";
        ctx.fillStyle = "#FEF08A";
        ctx.shadowColor = "#F59E0B";
        ctx.shadowBlur = 10;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let b = 0; b < 4; b++) {
          ctx.save();
          const ang = rot + b * (Math.PI / 2);
          const tx = Math.cos(ang) * (reticleRadius + 4);
          const ty = Math.sin(ang) * (reticleRadius + 4);
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
        swordImg = (this.assets?.prop_bamboo_sword?.loaded && this.assets.prop_bamboo_sword.img) ||
                   (this.assets?.prop_jade_sword?.loaded && this.assets.prop_jade_sword.img) || null;
      } else if (realmIdx === 1) {
        // Cảnh 1 (Trúc Cơ): Lam Ngọc Kiếm
        swordImg = (this.assets?.prop_jade_sword?.loaded && this.assets.prop_jade_sword.img) ||
                   (this.assets?.prop_bamboo_sword?.loaded && this.assets.prop_bamboo_sword.img) || null;
      } else if (realmIdx === 2) {
        // Cảnh 2 (Kim Đan): Kim Đan Trảm Tiên Kiếm (Ngọc kiếm mạ hoàng kim)
        swordImg = (this.assets?.prop_jade_sword?.loaded && this.assets.prop_jade_sword.img) || null;
      } else if (realmIdx === 3) {
        // Cảnh 3 (Nguyên Anh): Cửu Thiên Thần Lôi Kiếm (Tử Điện Lôi Thần)
        swordImg = (this.assets?.sword_realm3_thunder?.loaded && this.assets.sword_realm3_thunder.img) ||
                   (this.assets?.prop_jade_sword?.loaded && this.assets.prop_jade_sword.img) || null;
      } else if (realmIdx >= 4) {
        // Cảnh 4 (Hóa Thần / Thái Thượng Miêu Hoàng): Chân Long Hoàng Kim Kiếm
        swordImg = (this.assets?.sword_realm4_dragon?.loaded && this.assets.sword_realm4_dragon.img) ||
                   (this.assets?.sword_realm3_thunder?.loaded && this.assets.sword_realm3_thunder.img) ||
                   (this.assets?.prop_jade_sword?.loaded && this.assets.prop_jade_sword.img) || null;
      }

      if (swordImg) {
        ctx.imageSmoothingEnabled = false; // Chuẩn Retro Pixel Art
        const swordLen = isMobile ? 48 : 64;
        const swordW = isMobile ? 26 : 34;
        ctx.save();
        // Cân chỉnh góc kiếm từ sprite gốc (chếch 45 độ) thành hướng ngang theo trục mũi kiếm
        ctx.rotate(-Math.PI / 4);
        ctx.drawImage(swordImg, -swordW / 2, -swordLen * 0.82, swordW, swordLen);
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
})(typeof window !== 'undefined' ? window : globalThis);

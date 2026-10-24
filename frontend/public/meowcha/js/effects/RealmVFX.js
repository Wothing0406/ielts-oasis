/**
 * RealmVFX.js - Hiệu Ứng Pháp Tướng Độc Quyền Từng Cảnh Giới
 * Đài sen vàng, sương mây tím, Chibi Anh Linh, Lục Kiếm Trận 3D & Chân Long
 */
(function(root) {
  class RealmVFX {
    constructor(assets) {
      this.assets = assets || {};
      this.time = 0;
      this.cloudAlpha = 0;
      this.cloudTimer = 0;
      this.isPunishCloud = false;
      this.nextPeriodicMistTime = performance.now() + 45000;
    }

    triggerCloudHazard(duration = 3.0) {
      this.cloudTimer = performance.now() + duration * 1000;
    }

    triggerPunishCloud() {
      this.isPunishCloud = true;
      this.cloudAlpha = 0.85;
      this.cloudTimer = performance.now() + 180000; // Giữ nguyên phạt cho tới khi được tha
    }

    clearClouds() {
      this.isPunishCloud = false;
      this.cloudAlpha = 0;
      this.cloudTimer = 0;
    }

    update(dt = 0.016, gameState) {
      this.time += dt;
      const now = performance.now();

      // Nếu đang trong trạng thái Phạt Thiên Đạo: Giữ mây che phủ dày đặc
      if (this.isPunishCloud) {
        this.cloudAlpha = Math.min(0.88, this.cloudAlpha + dt * 2.0);
        return;
      }

      // Cảnh giới cấp cao (Kim Đan, Nguyên Anh, Hóa Thần, realmIdx >= 2):
      // Thỉnh thoảng có làn tiên khí / chướng khí mờ ảo lướt qua (chu kỳ ~45-55s một lần, chỉ kéo dài 3.5s)
      const realmIdx = gameState ? (gameState.realmIdx || 0) : 0;
      if (realmIdx >= 2 && now > this.nextPeriodicMistTime) {
        this.triggerCloudHazard(3.5);
        this.nextPeriodicMistTime = now + (45000 + Math.random() * 20000);
      }

      // Mây mờ mộng ảo khi không bị phạt
      const targetMaxAlpha = 0.30;

      if (now < this.cloudTimer) {
        this.cloudAlpha = Math.min(targetMaxAlpha, this.cloudAlpha + dt * 1.2);
      } else {
        this.cloudAlpha = Math.max(0, this.cloudAlpha - dt * 0.7);
      }
    }

    // 1. Cảnh giới 0: Trà Viện Thanh Tịnh (Khói tiên trà & Gió thoảng lá trúc)
    drawRealm0(ctx, baseX, baseY, catState) {
      const t = this.time * 2.5;

      // Chén ngọc tiên trà
      const cupX = baseX - 68;
      const cupY = baseY - 22;

      ctx.save();
      ctx.fillStyle = "#10B981";
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cupX, cupY, 8, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Khói trà bốc lên hình chữ S
      ctx.strokeStyle = "rgba(209, 250, 229, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const wave1 = Math.sin(t * 1.5) * 5;
      const wave2 = Math.cos(t * 1.2) * 7;
      ctx.moveTo(cupX, cupY - 3);
      ctx.bezierCurveTo(cupX - 4 + wave1, cupY - 15, cupX + 6 + wave2, cupY - 28, cupX + 2, cupY - 42);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Cảnh giới 1: Bích Ngọc Trúc Cơ (Linh khí lam ngọc & Sóng nước đài sen)
    drawRealm1(ctx, baseX, baseY, catState) {
      const t = this.time * 2.0;

      ctx.save();
      // Vòng sóng nước linh khí lan tỏa dưới chân
      ctx.strokeStyle = "rgba(6, 182, 212, 0.45)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 2; i++) {
        const prog = (t * 0.4 + i * 0.5) % 1.0;
        const radius = prog * 55;
        ctx.globalAlpha = 1.0 - prog;
        ctx.beginPath();
        ctx.ellipse(baseX, baseY - 8, radius, radius * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Song kiếm Bích Ngọc đan chéo sau lưng mèo phát quang lam sắc
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(baseX - 25, baseY - 60);
      ctx.lineTo(baseX + 20, baseY - 15);
      ctx.moveTo(baseX + 25, baseY - 60);
      ctx.lineTo(baseX - 20, baseY - 15);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Cảnh giới 2: Kim Đan Chân Nhân (Kim Liên Đài 8 cánh & Kim Đan Linh Châu)
    drawRealm2(ctx, baseX, baseY, drawY, catState) {
      const t = this.time * 2.0;

      ctx.save();
      // Kim Liên Đài 8 cánh xoay tròn 3D
      const lotusY = baseY - 12;
      const lotusRot = t * 0.3;

      ctx.save();
      ctx.translate(baseX, lotusY);
      ctx.scale(1.0, 0.45);
      for (let p = 0; p < 8; p++) {
        const ang = p * (Math.PI / 4) + lotusRot;
        const px = Math.cos(ang) * 44;
        const py = Math.sin(ang) * 44;
        ctx.fillStyle = "rgba(251, 191, 36, 0.75)";
        ctx.strokeStyle = "#F59E0B";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(px, py, 14, 8, ang, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // Kim Đan Linh Châu lơ lửng trước ngực
      const danX = baseX;
      const danY = drawY + 96 + Math.sin(t * 2.0) * 3;
      const danPulse = 1.0 + Math.sin(t * 3.5) * 0.12;

      ctx.fillStyle = "#FEF08A";
      ctx.shadowColor = "#F59E0B";
      ctx.shadowBlur = catState === "WEAK_ATTACK" ? 26 : 14;
      ctx.beginPath();
      ctx.arc(danX, danY, (catState === "WEAK_ATTACK" ? 9 : 6.5) * danPulse, 0, Math.PI * 2);
      ctx.fill();

      // Vòng hào quang Thái Cực quanh Kim Đan
      ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(danX, danY, 15 * danPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Cảnh giới 3: Nguyên Anh Tiên Tôn (Tử Vân & Chibi Anh Linh Hộ Đạo)
    drawRealm3(ctx, baseX, baseY, drawY, catState) {
      const t = this.time * 2.0;

      ctx.save();
      // Tử Vân sương tím bồng bềnh dưới đài tọa
      const cloudY = baseY - 16;
      ctx.fillStyle = "rgba(168, 85, 247, 0.45)";
      ctx.shadowColor = "#C084FC";
      ctx.shadowBlur = 15;
      for (let c = -2; c <= 2; c++) {
        const cx = baseX + c * 22 + Math.sin(t + c) * 4;
        const cy = cloudY + Math.cos(t * 1.3 + c) * 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 18 - Math.abs(c) * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // CHIBI NGUYÊN ANH ANH LINH TÍ HON
      const soulOffset = catState === "HURT" ? 18 : 0;
      const soulX = baseX - 55 + Math.sin(t * 2.0) * 6 + (catState === "HURT" ? 15 : 0);
      const soulY = drawY + 35 + Math.cos(t * 2.2) * 6 + soulOffset;

      ctx.save();
      ctx.translate(soulX, soulY);
      ctx.shadowColor = "#67E8F9";
      ctx.shadowBlur = 14;

      // Thân thể linh hồn trong suốt
      ctx.fillStyle = "rgba(224, 242, 254, 0.88)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tai mèo nhỏ màu tím
      ctx.fillStyle = "rgba(192, 132, 252, 0.9)";
      ctx.beginPath();
      ctx.moveTo(-8, -10); ctx.lineTo(-12, -20); ctx.lineTo(-2, -14); ctx.fill();
      ctx.moveTo(8, -10); ctx.lineTo(12, -20); ctx.lineTo(2, -14); ctx.fill();

      // Mắt xanh ngọc
      ctx.fillStyle = "#0284C7";
      ctx.beginPath();
      ctx.arc(-4, -2, 2, 0, Math.PI * 2);
      ctx.arc(4, -2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Thanh kiếm nhỏ trong tay Chibi Anh Linh
      ctx.save();
      ctx.rotate((catState === "WEAK_ATTACK" ? -0.8 : -0.2) + Math.sin(t * 3.0) * 0.15);
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(7, 2);
      ctx.lineTo(16, -12);
      ctx.stroke();
      ctx.restore();

      // Tia sét khi xuất chiêu
      if (catState === "WEAK_ATTACK") {
        ctx.strokeStyle = "#E0F2FE";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(14, -10);
        ctx.lineTo(24 + (Math.random() * 8 - 4), -24);
        ctx.stroke();
      }

      ctx.restore();
      ctx.restore();
    }

    // 5. Cảnh giới 4: Thái Thượng Kiếm Tôn (Lục Kiếm Trận 3D & Chân Long Hoàng Kim)
    drawRealm4(ctx, baseX, baseY, drawY, catState) {
      const t = this.time * 2.0;

      ctx.save();
      // Lục Kiếm Trận 3D xoay quanh
      const speed = catState === "WEAK_ATTACK" ? 3.5 : 1.4;
      const radius = catState === "WEAK_ATTACK" ? 95 : 82;

      for (let s = 0; s < 6; s++) {
        const ang = t * speed + (s * (Math.PI * 2 / 6));
        const sx = baseX + Math.cos(ang) * radius;
        const sy = drawY + 86 + Math.sin(ang) * 28;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(ang + Math.PI / 2);
        ctx.fillStyle = "#FDE047";
        ctx.shadowColor = "#F59E0B";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(3.5, 4);
        ctx.lineTo(-3.5, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // HOÀNG KIM CHÂN LONG UỐN LƯỢN QUANH NGỌC TỌA
      const dragonT = t * 1.8;
      ctx.save();
      ctx.strokeStyle = "rgba(251, 191, 36, 0.85)";
      ctx.shadowColor = "#F59E0B";
      ctx.shadowBlur = 16;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();

      const segCount = 14;
      let headX = baseX, headY = drawY + 60;
      for (let seg = 0; seg <= segCount; seg++) {
        const st = dragonT - seg * 0.14;
        const dx = baseX + Math.sin(st) * 72;
        const dy = drawY + 75 + Math.cos(st * 2) * 30;
        if (seg === 0) {
          ctx.moveTo(dx, dy);
          headX = dx; headY = dy;
        } else {
          ctx.lineTo(dx, dy);
        }
      }
      ctx.stroke();

      // Đầu rồng & mắt đỏ uy nghiêm
      ctx.fillStyle = "#FDE047";
      ctx.beginPath();
      ctx.arc(headX, headY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#DC2626";
      ctx.beginPath();
      ctx.arc(headX - 2, headY - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Râu rồng kim sắc
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(headX + 2, headY - 5);
      ctx.lineTo(headX + 7, headY - 13);
      ctx.stroke();

      ctx.restore();
      ctx.restore();
    }

    // ============================================================
    // 6. THIÊN KIẾP HIỂM CẢNH: MÂY MÙ U ÁM TRÔI NGANG (MYSTIC MIST HAZARD)
    // ============================================================
    // 6. THIÊN KIẾP HIỂM CẢNH: CHƯỚNG KHÍ U MINH MA VỤ DÀY ĐẶC
    // ============================================================
    // 6. THIÊN KIẾP HIỂM CẢNH: TIÊN KHÍ SƯƠNG MỜ QUẤY RỐI TẦM NHÌN
    // Khi bình thường: Sương khói nhẹ bay lượn ở 2 rìa màn hình
    // Khi bị phạt Ma Vân Tụ Khí: 4 cụm sương ma tím lượn sóng trôi ngang qua lại quấy nhiễu tầm nhìn
    // ============================================================
    drawMysticClouds(ctx, width, height, isPunishMode = false) {
      if (this.cloudAlpha <= 0.01) return;
      ctx.save();

      const isMobile = width <= 768;
      const t = this.time * (isPunishMode ? 28 : 18);
      // Trên PC màn ngang: cần nhiều đám mây hơn để che khuất tầm nhìn
      const cloudCount = isPunishMode ? (isMobile ? 4 : 8) : (isMobile ? 2 : 3);
      const cloudImg = this.assets?.prop_mystic_cloud?.loaded ? this.assets.prop_mystic_cloud.img : null;
      const totalW = width + 500;

      for (let i = 0; i < cloudCount; i++) {
        const speedFactor = 0.4 + i * 0.22;
        // Trôi ngang lượn sóng
        const cx = ((t * speedFactor + i * (totalW / cloudCount)) % totalW) - 250;
        // Vị trí độ cao: Phạt thì trôi rải đều từ 15% đến 80% màn hình để che khuất mạnh hơn
        const baseY = isPunishMode 
          ? height * (0.15 + (i % 5) * 0.14) 
          : height * (0.18 + (i % 2) * 0.14);
        const cy = baseY + Math.sin(this.time * 1.5 + i * 1.8) * 20;
        // Kích thước mây lớn hơn trên PC để che khuất đủ
        const cSize = isPunishMode 
          ? (isMobile ? 200 : 320)
          : (isMobile ? 110 : 180);

        ctx.save();
        ctx.globalAlpha = isPunishMode 
          ? Math.min(0.72, this.cloudAlpha * 1.3) 
          : Math.min(0.25, this.cloudAlpha);
        ctx.translate(cx, cy);
        ctx.rotate(Math.sin(this.time * 0.4 + i) * 0.12);

        if (cloudImg) {
          ctx.imageSmoothingEnabled = false;
          ctx.shadowColor = isPunishMode ? "#7E22CE" : "#A855F7";
          ctx.shadowBlur = isPunishMode ? 32 : 16;
          ctx.drawImage(cloudImg, -cSize / 2, -cSize / 2, cSize, cSize);
        } else {
          // Fallback sương khói ma mị
          const baseR = cSize * 0.38;
          ctx.fillStyle = isPunishMode ? "rgba(88, 28, 135, 0.70)" : "rgba(147, 51, 234, 0.35)";
          ctx.shadowColor = isPunishMode ? "#9333EA" : "#C084FC";
          ctx.shadowBlur = isPunishMode ? 30 : 18;
          ctx.beginPath();
          ctx.arc(0, 0, baseR, 0, Math.PI * 2);
          ctx.arc(-baseR * 0.6, 6, baseR * 0.65, 0, Math.PI * 2);
          ctx.arc(baseR * 0.6, 4, baseR * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }

        // Khi bị phạt: Thêm vài tia điện tím tí tách lướt trong mây ma
        if (isPunishMode && Math.random() < 0.28) {
          ctx.strokeStyle = "#E9D5FF";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo((Math.random() - 0.5) * cSize * 0.5, (Math.random() - 0.5) * cSize * 0.3);
          ctx.lineTo((Math.random() - 0.5) * cSize * 0.5, (Math.random() - 0.5) * cSize * 0.3);
          ctx.stroke();
        }

        ctx.restore();
      }

      ctx.restore();
    }

    // ============================================================
    // 7. THIÊN LÔI GIÁNG THẾ: CHỚP SÉT XÉ TOẠC BẦU TRỜI (LIGHTNING FLASH)
    // ============================================================
    drawLightning(ctx, width, height, flashIntensity = 0) {
      if (flashIntensity <= 0) return;
      ctx.save();

      // Lớp phủ chớp sáng toàn màn hình
      ctx.fillStyle = `rgba(238, 210, 255, ${Math.min(0.7, flashIntensity * 0.65)})`;
      ctx.fillRect(0, 0, width, height);

      // Tia sét ziczac tím - trắng rạch ngang trời
      if (flashIntensity > 0.4) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.shadowColor = "#C084FC";
        ctx.shadowBlur = 24;
        ctx.lineWidth = 3.5;
        ctx.beginPath();

        let lx = width * (0.3 + (Math.sin(this.time * 30) * 0.2 + 0.2));
        let ly = 0;
        ctx.moveTo(lx, ly);

        const segments = 6;
        const segH = height * 0.65 / segments;
        for (let s = 1; s <= segments; s++) {
          lx += (Math.random() - 0.5) * 60;
          ly += segH;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();

        // Nhánh sét phụ
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = "#E9D5FF";
        ctx.beginPath();
        ctx.moveTo(lx, ly * 0.5);
        ctx.lineTo(lx + (Math.random() > 0.5 ? 45 : -45), ly * 0.7);
        ctx.stroke();
      }

      ctx.restore();
    }

    // ============================================================
    // 8. TONE MÀU CỔ ĐIỂN TRUNG HOA PIXEL (RETRO DARK XIANXIA VIGNETTE)
    // Sắc đỏ chu sa, hổ phách và viền khung đá cổ xưa
    // ============================================================
    drawRetroPixelVignette(ctx, width, height) {
      ctx.save();
      // Viền góc phù văn cổ điển Trung Hoa 4 góc màn hình
      const cornerSize = width <= 768 ? 24 : 36;
      ctx.strokeStyle = "rgba(217, 119, 6, 0.45)"; // Hoàng kim cổ
      ctx.lineWidth = 2.0;

      // Góc Tây Bắc
      ctx.beginPath();
      ctx.moveTo(10, 10 + cornerSize);
      ctx.lineTo(10, 10);
      ctx.lineTo(10 + cornerSize, 10);
      ctx.stroke();

      // Góc Đông Bắc
      ctx.beginPath();
      ctx.moveTo(width - 10 - cornerSize, 10);
      ctx.lineTo(width - 10, 10);
      ctx.lineTo(width - 10, 10 + cornerSize);
      ctx.stroke();

      // Góc Tây Nam
      ctx.beginPath();
      ctx.moveTo(10, height - 10 - cornerSize);
      ctx.lineTo(10, height - 10);
      ctx.lineTo(10 + cornerSize, height - 10);
      ctx.stroke();

      // Góc Đông Nam
      ctx.beginPath();
      ctx.moveTo(width - 10 - cornerSize, height - 10);
      ctx.lineTo(width - 10, height - 10);
      ctx.lineTo(width - 10, height - 10 - cornerSize);
      ctx.stroke();

      ctx.restore();
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.RealmVFX = RealmVFX;
})(typeof window !== 'undefined' ? window : globalThis);

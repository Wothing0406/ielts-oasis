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
    }

    triggerCloudHazard(duration = 3.5) {
      this.cloudTimer = performance.now() + duration * 1000;
    }

    update(dt = 0.016, gameState) {
      this.time += dt;

      // Độ mờ chướng khí mây mù: Chướng khí thiên kiếp dày đặc thực thụ (0.82 - 0.96)
      const now = performance.now();
      const realmIdx = gameState ? Math.min(4, Math.max(0, gameState.realmIdx)) : 0;
      let targetMaxAlpha = 0.90;
      let isPeriodicCloud = false;

      if (realmIdx === 0) {
        targetMaxAlpha = 0.82;
        isPeriodicCloud = (Math.sin(this.time * 0.25) > 0.72); // Chu kỳ ~25s
      } else if (realmIdx === 1) {
        targetMaxAlpha = 0.88;
        isPeriodicCloud = (Math.sin(this.time * 0.28) > 0.65); // Chu kỳ ~22s
      } else if (realmIdx === 2) {
        targetMaxAlpha = 0.92;
        isPeriodicCloud = (Math.sin(this.time * 0.32) > 0.58); // Chu kỳ ~18s
      } else {
        targetMaxAlpha = 0.96;
        isPeriodicCloud = (Math.sin(this.time * 0.36) > 0.50); // Chu kỳ ~14s
      }

      if (now < this.cloudTimer || isPeriodicCloud) {
        this.cloudAlpha = Math.min(targetMaxAlpha, this.cloudAlpha + dt * 2.2);
      } else {
        this.cloudAlpha = Math.max(0, this.cloudAlpha - dt * 0.65);
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
    // Thực sự che khuất từ vựng ở tầng giữa, thử thách phản xạ & trí nhớ
    // ============================================================
    drawMysticClouds(ctx, width, height, activeAsteroids = []) {
      if (this.cloudAlpha <= 0.01) return;
      ctx.save();

      const isMobile = width <= 768;
      const t = this.time * 24;

      // 1. DẢI SƯƠNG MÙ CUỘN SÓNG TOÀN CHIỀU NGANG (DENSE ATMOSPHERIC FOG STRIP)
      // Che phủ vùng y từ 16% đến 48% chiều cao màn hình - nơi ma thạch và chữ đang rơi
      const fogY1 = height * 0.16;
      const fogH = height * 0.32;
      const fogGrad = ctx.createLinearGradient(0, fogY1, 0, fogY1 + fogH);
      fogGrad.addColorStop(0, "transparent");
      fogGrad.addColorStop(0.2, `rgba(18, 10, 32, ${this.cloudAlpha * 0.88})`);
      fogGrad.addColorStop(0.5, `rgba(28, 14, 48, ${this.cloudAlpha * 0.96})`);
      fogGrad.addColorStop(0.8, `rgba(22, 12, 38, ${this.cloudAlpha * 0.90})`);
      fogGrad.addColorStop(1, "transparent");

      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, fogY1, width, fogH);

      // 2. CÁC CỤM MÂY MA VẬT PIXEL TO DÀY TRÔI NGANG (OVERLAPPING BILLOWING CLUSTERS)
      const cloudCount = isMobile ? 5 : 6;
      const cloudImg = this.assets?.prop_mystic_cloud?.loaded ? this.assets.prop_mystic_cloud.img : null;
      const totalW = width + 480;

      for (let i = 0; i < cloudCount; i++) {
        const speedFactor = 0.5 + (i % 3) * 0.28;
        const cx = ((t * speedFactor + i * (totalW / cloudCount)) % totalW) - 240;
        const cy = height * (0.22 + (i % 3) * 0.08) + Math.sin(this.time * 1.5 + i * 1.8) * 16;
        const cSize = (isMobile ? 220 : 340) * (0.9 + (i % 2) * 0.3);

        ctx.save();
        ctx.globalAlpha = Math.min(1.0, this.cloudAlpha * 0.95);
        ctx.translate(cx, cy);
        ctx.rotate(Math.sin(this.time * 0.4 + i) * 0.1);

        if (cloudImg) {
          ctx.imageSmoothingEnabled = false;
          ctx.shadowColor = "#7E22CE";
          ctx.shadowBlur = 24;
          // Vẽ đệm khối mây đen đặc bên dưới trước khi vẽ texture
          ctx.fillStyle = "rgba(14, 8, 24, 0.94)";
          ctx.beginPath();
          ctx.ellipse(0, 0, cSize * 0.45, cSize * 0.28, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.drawImage(cloudImg, -cSize / 2, -cSize / 2, cSize, cSize);
        } else {
          // Fallback mây bồng bềnh đặc quánh
          const baseR = isMobile ? 58 : 88;
          ctx.fillStyle = i % 2 === 0 ? "rgba(18, 10, 32, 0.92)" : "rgba(32, 16, 52, 0.95)";
          ctx.shadowColor = "#A855F7";
          ctx.shadowBlur = 22;
          ctx.beginPath();
          ctx.arc(0, 0, baseR, 0, Math.PI * 2);
          ctx.arc(-baseR * 0.75, 6, baseR * 0.7, 0, Math.PI * 2);
          ctx.arc(baseR * 0.75, 4, baseR * 0.72, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. KIẾM Ý XÉ TOẠC SƯƠNG MÙ (DISPEL HOLE CHO TỪ ĐANG GÕ ĐÚNG)
      if (activeAsteroids && activeAsteroids.length > 0) {
        for (const ast of activeAsteroids) {
          if (ast.typedLen > 0) {
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            const dispelGrad = ctx.createRadialGradient(ast.x, ast.y, 10, ast.x, ast.y, ast.radius + 50);
            dispelGrad.addColorStop(0, "rgba(0, 0, 0, 0.85)");
            dispelGrad.addColorStop(0.6, "rgba(0, 0, 0, 0.5)");
            dispelGrad.addColorStop(1, "transparent");
            ctx.fillStyle = dispelGrad;
            ctx.beginPath();
            ctx.arc(ast.x, ast.y, ast.radius + 50, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
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

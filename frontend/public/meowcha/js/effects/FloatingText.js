/**
 * FloatingText.js - Hiệu Ứng Nổ Từ Vựng Tại Chỗ (In-situ Burst) & Hút Tu Vi (EXP Orb)
 * Hiển thị từ vựng + phiên âm IPA + nghĩa ngay tại tâm nổ, EXP bay hút về Miêu Kiếm Tôn
 */
(function (root) {
  class FloatingText {
    constructor() {
      this.texts = [];
      this.bursts = []; // Vòng sáng nổ từ vựng tại chỗ (In-situ bursts)
      this.expOrbs = []; // Hạt tinh hoa tu vi bay hút về Mèo Tôn
      this.celestialBanner = null; // Biểu tượng Chiếu Chỉ Thiên Đình rơi từ đỉnh trời
    }

    clear() {
      this.texts = [];
      this.bursts = [];
      this.expOrbs = [];
      this.celestialBanner = null;
    }
    // CHIẾU CHỈ THIÊN ĐÌNH / THIÊN LÔI MẬT CHỈ RƠI TỪ ĐỈNH TRỜI (CELESTIAL EDICT)
    addCelestialEdict(canvasW, title, content, type = 'warning') {
      const isMobile = canvasW <= 768;
      this.celestialBanner = {
        title: title,
        content: content,
        type: type, // 'warning' (vàng cam) | 'lightning' (tím sấm sét) | 'purified' (ngọc bích)
        y: -120, // Bắt đầu rơi từ tít trên đỉnh trời
        targetY: isMobile ? 85 : 70, // Dừng lại ở vị trí trang trọng giữa trời
        vy: 18,
        alpha: 0,
        life: 3.2, // Tồn tại 3.2s
        maxLife: 3.2,
        unrollW: 0.1, // Hoạt ảnh cuộn mở thánh chỉ
        sparkTimer: 0
      };
    }


    // Chữ nổi thông thường (Bạo kích, sát thương)
    add(x, y, text, color = "#FDE047", size = 18, vy = -1.6) {
      this.texts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        size: size,
        alpha: 1.0,
        vy: vy,
        decay: 0.02
      });
    }

    // HIỆN PHÙ CHÚ BÁT QUÁI & PHIÊN ÂM IPA NGAY TẠI TÂM NỔ (IN-SITU BURST)
    addInSituBurst(x, y, wordItem) {
      // Đảm bảo tọa độ nổ luôn nằm bên dưới thanh HUD (y >= 125) để người chơi nhìn thấy rõ ràng phiên âm IPA kể cả khi gõ từ trên đỉnh
      const safeY = Math.max(125, y);
      this.bursts.push({
        x: x,
        y: safeY,
        word: wordItem.word,
        ipa: wordItem.ipa || "",
        meaning: wordItem.meaning || "",
        type: wordItem.type || "",
        scale: 0.2,
        maxScale: 1.0,
        rot: 0,
        alpha: 1.0,
        life: 1.2, // Thời lượng 1.2s rõ ràng
        maxLife: 1.2
      });
    }

    // HẠT TU VI BAY HÚT VỀ MÈO TÔN (EXP ABSORPTION ORB)
    addExpOrb(startX, startY, targetX, targetY, points = 100) {
      this.expOrbs.push({
        x: startX,
        y: startY,
        startX: startX,
        startY: startY,
        targetX: targetX,
        targetY: targetY,
        points: points,
        t: 0,
        speed: 1.4, // Bay trong ~0.7s
        color: "#FDE047"
      });
    }

    update(dt = 0.016, onExpArrived) {
      // 0. Cập nhật Chiếu Chỉ Thiên Đình rơi từ trời xuống
      if (this.celestialBanner) {
        const cb = this.celestialBanner;
        cb.life -= dt;

        // Rơi từ trời xuống vị trí targetY với quán tính nảy nhẹ
        if (cb.y < cb.targetY) {
          cb.y += (cb.targetY - cb.y) * Math.min(1.0, dt * 8.5);
          cb.alpha = Math.min(1.0, cb.alpha + dt * 4.0);
        }

        // Mở rộng chiếu chỉ
        if (cb.unrollW < 1.0) {
          cb.unrollW = Math.min(1.0, cb.unrollW + dt * 4.0);
        }

        // Mờ dần khi hết thời gian
        if (cb.life < 0.6) {
          cb.alpha = Math.max(0, cb.life / 0.6);
        }

        if (cb.life <= 0) {
          this.celestialBanner = null;
        }
      }
      // 1. Cập nhật chữ nổi
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const item = this.texts[i];
        item.y += item.vy;
        item.alpha -= item.decay;
        if (item.alpha <= 0) {
          this.texts.splice(i, 1);
        }
      }

      // 2. Cập nhật vòng nổ tại chỗ (In-situ Bursts)
      for (let i = this.bursts.length - 1; i >= 0; i--) {
        const b = this.bursts[i];
        b.life -= dt;
        b.rot += dt * 1.5;

        // Scale pop-up 0.2s đầu
        if (b.scale < b.maxScale) {
          b.scale = Math.min(b.maxScale, b.scale + dt * 5.0);
        }

        // Fade out ở 0.3s cuối
        if (b.life < 0.35) {
          b.alpha = Math.max(0, b.life / 0.35);
        }

        if (b.life <= 0) {
          this.bursts.splice(i, 1);
        }
      }

      // 3. Cập nhật hạt tu vi hút về Mèo Tôn (Bezier curve arc)
      for (let i = this.expOrbs.length - 1; i >= 0; i--) {
        const orb = this.expOrbs[i];
        orb.t += dt * orb.speed;

        // Quỹ đạo cong Parabol hút về
        const t = Math.min(1.0, orb.t);
        const controlX = (orb.startX + orb.targetX) / 2 + (orb.startX > orb.targetX ? 60 : -60);
        const controlY = Math.min(orb.startY, orb.targetY) - 50;

        // Bezier B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
        orb.x = Math.pow(1 - t, 2) * orb.startX + 2 * (1 - t) * t * controlX + Math.pow(t, 2) * orb.targetX;
        orb.y = Math.pow(1 - t, 2) * orb.startY + 2 * (1 - t) * t * controlY + Math.pow(t, 2) * orb.targetY;

        if (t >= 1.0) {
          if (onExpArrived) onExpArrived(orb);
          this.expOrbs.splice(i, 1);
        }
      }
    }

    draw(ctx) {
      // 0. Vẽ Chiếu Chỉ Thiên Đình Rơi Từ Trời Xuống (Celestial Edict Scroll)
      if (this.celestialBanner && this.celestialBanner.alpha > 0) {
        const cb = this.celestialBanner;
        ctx.save();
        // 0. VẼ CHIẾU CHỈ TIÊN ĐÌNH CỔ PHONG TRONG SUỐT (SEMI-TRANSPARENT XIANXIA SCROLL)
        ctx.globalAlpha = Math.max(0, Math.min(1.0, cb.alpha));
        const canvasW = ctx.canvas.width;
        const isMobile = canvasW <= 768;

        const maxW = isMobile ? Math.min(canvasW - 24, 330) : 450;
        const w = maxW * cb.unrollW;
        const h = isMobile ? 52 : 60;
        const cx = canvasW / 2;
        const cy = cb.y;
        const halfW = w / 2;
        const halfH = h / 2;

        // Bối cảnh ánh sáng / sấm sét / mây mù huyền ảo xung quanh chiếu chỉ
        if (cb.type === 'lightning') {
          ctx.shadowColor = 'rgba(192, 132, 252, 0.85)';
          ctx.shadowBlur = 24;
        } else if (cb.type === 'cloud') {
          ctx.shadowColor = 'rgba(168, 85, 247, 0.7)';
          ctx.shadowBlur = 20;
        } else if (cb.type === 'purified') {
          ctx.shadowColor = 'rgba(52, 211, 153, 0.8)';
          ctx.shadowBlur = 20;
        } else {
          ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
          ctx.shadowBlur = 20;
        }

        // Thân chiếu chỉ: THIẾT KẾ TRONG SUỐT CỔ TRANG (TRANSPARENT GLASSMORPHISM CỔ PHONG)
        // Tuyệt đối không nhựa / hiện đại, sử dụng gradient bán trong suốt mờ ảo như ngọc lụa tiên giới
        const bgGrad = ctx.createLinearGradient(cx - halfW, cy - halfH, cx + halfW, cy + halfH);
        if (cb.type === 'lightning') {
          // MẬT LỆNH THIÊN LÔI: Sắc tử lôi huyền bí bán trong suốt
          bgGrad.addColorStop(0, 'rgba(35, 12, 58, 0.42)');
          bgGrad.addColorStop(0.5, 'rgba(22, 6, 40, 0.48)');
          bgGrad.addColorStop(1, 'rgba(45, 15, 75, 0.42)');
        } else if (cb.type === 'cloud') {
          // MẬT LỆNH MA VÂN: Sương khói tím sẫm bán trong suốt
          bgGrad.addColorStop(0, 'rgba(28, 15, 45, 0.38)');
          bgGrad.addColorStop(0.5, 'rgba(18, 8, 30, 0.44)');
          bgGrad.addColorStop(1, 'rgba(32, 16, 52, 0.38)');
        } else if (cb.type === 'purified') {
          // THIÊN ÂN XÁ TỘI: Bích ngọc thanh tịnh trong suốt
          bgGrad.addColorStop(0, 'rgba(6, 42, 32, 0.38)');
          bgGrad.addColorStop(0.5, 'rgba(3, 28, 20, 0.45)');
          bgGrad.addColorStop(1, 'rgba(6, 46, 34, 0.38)');
        } else {
          // HOÀNG KIM CHIẾU CHỈ: Hổ phách trong suốt
          bgGrad.addColorStop(0, 'rgba(46, 26, 10, 0.40)');
          bgGrad.addColorStop(0.5, 'rgba(26, 14, 5, 0.46)');
          bgGrad.addColorStop(1, 'rgba(52, 30, 12, 0.40)');
        }

        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.roundRect(cx - halfW, cy - halfH, w, h, 6);
        ctx.fill();

        // Viền chiếu chỉ cổ phong ngọc giản
        ctx.lineWidth = 1.4;
        if (cb.type === 'lightning') {
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.65)';
        } else if (cb.type === 'cloud') {
          ctx.strokeStyle = 'rgba(216, 180, 254, 0.55)';
        } else if (cb.type === 'purified') {
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
        } else {
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.60)';
        }
        ctx.stroke();

        // Hoa văn góc cổ trang (Ancient corner accents)
        const cornerLen = isMobile ? 6 : 8;
        ctx.lineWidth = 1.6;
        // Góc trên trái & dưới phải
        ctx.beginPath();
        ctx.moveTo(cx - halfW, cy - halfH + cornerLen);
        ctx.lineTo(cx - halfW, cy - halfH);
        ctx.lineTo(cx - halfW + cornerLen, cy - halfH);

        ctx.moveTo(cx + halfW - cornerLen, cy + halfH);
        ctx.lineTo(cx + halfW, cy + halfH);
        ctx.lineTo(cx + halfW, cy + halfH - cornerLen);
        ctx.stroke();

        // Hai trục ngọc cổ quyển ở 2 đầu chiếu chỉ
        const rollerW = isMobile ? 4 : 5;
        const rollerH = h + 8;
        if (cb.type === 'lightning') {
          ctx.fillStyle = '#C084FC';
        } else if (cb.type === 'cloud') {
          ctx.fillStyle = '#D8B4FE';
        } else if (cb.type === 'purified') {
          ctx.fillStyle = '#34D399';
        } else {
          ctx.fillStyle = '#F59E0B';
        }
        ctx.fillRect(cx - halfW - rollerW, cy - rollerH / 2, rollerW, rollerH);
        ctx.fillRect(cx + halfW, cy - rollerH / 2, rollerW, rollerH);

        // Nội dung chiếu chỉ (chỉ hiển thị khi đã mở cuộn đủ rộng)
        if (cb.unrollW > 0.55) {
          ctx.shadowBlur = 0;
          ctx.textAlign = 'center';

          // Tiêu đề Thiên Đình Cổ Trang
          ctx.font = `900 ${isMobile ? 12 : 13.5}px 'Cinzel', 'Be Vietnam Pro', serif`;
          if (cb.type === 'lightning') {
            ctx.fillStyle = '#F3E8FF';
            ctx.shadowColor = '#A855F7';
            ctx.shadowBlur = 8;
          } else if (cb.type === 'cloud') {
            ctx.fillStyle = '#E9D5FF';
            ctx.shadowColor = '#9333EA';
            ctx.shadowBlur = 7;
          } else if (cb.type === 'purified') {
            ctx.fillStyle = '#D1FAE5';
            ctx.shadowColor = '#10B981';
            ctx.shadowBlur = 8;
          } else {
            ctx.fillStyle = '#FEF08A';
            ctx.shadowColor = '#EAB308';
            ctx.shadowBlur = 8;
          }
          ctx.fillText(cb.title, cx, cy - (isMobile ? 8 : 9));

          // Nội dung thánh chỉ
          ctx.font = `500 ${isMobile ? 10 : 11.5}px 'Be Vietnam Pro', sans-serif`;
          ctx.fillStyle = 'rgba(248, 250, 252, 0.92)';
          ctx.shadowBlur = 0;
          ctx.fillText(cb.content, cx, cy + (isMobile ? 11 : 12));
        }

        ctx.restore();
      }

      // 1. Vẽ Vòng Sáng Nổ Tại Chỗ (In-situ Bursts)
      if (this.bursts.length > 0) {
        ctx.save();
        const canvasW = ctx.canvas.width;
        const canvasH = ctx.canvas.height;
        const isMobile = canvasW <= 600;

        // Kích thước ngọc giản nhỏ gọn, thanh thoát, cân đối hoàn hảo trên màn hình
        const pw = isMobile ? 140 : 166;
        const ph = isMobile ? 48 : 54;
        const cut = isMobile ? 6 : 8;
        const halfW = pw / 2;
        const halfH = ph / 2;

        for (const b of this.bursts) {
          ctx.save();

          // NỔ NGAY TẠI TÂM MA THẠCH BỊ BẮN (BẢO TOÀN TỌA ĐỘ VAI CHẠM CHÍNH XÁC, LUÔN DƯỚI THANH HUD)
          const halfW = pw / 2;
          const halfH = ph / 2;
          const safeX = Math.max(halfW + 10, Math.min(canvasW - halfW - 10, b.x));
          const minY = isMobile ? 100 : 125;
          const safeY = Math.max(minY, Math.min(canvasH - halfH - 20, b.y));

          ctx.translate(safeX, safeY);
          ctx.scale(b.scale, b.scale);
          ctx.globalAlpha = Math.max(0, b.alpha);

          // Vòng hào quang Bát Quái xoay tròn mờ ảo
          ctx.save();
          ctx.rotate(b.rot);
          ctx.strokeStyle = "rgba(253, 224, 71, 0.75)";
          ctx.lineWidth = 1.2;
          ctx.shadowColor = "#F59E0B";
          ctx.shadowBlur = 10;

          const ringR = isMobile ? 32 : 40;
          ctx.beginPath();
          ctx.arc(0, 0, ringR, 0, Math.PI * 2);
          ctx.stroke();

          // Các vạch quẻ dịch bát quái 8 hướng
          for (let q = 0; q < 8; q++) {
            const qa = q * (Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(Math.cos(qa) * (ringR - 5), Math.sin(qa) * (ringR - 5));
            ctx.lineTo(Math.cos(qa) * (ringR + 5), Math.sin(qa) * (ringR + 5));
            ctx.stroke();
          }
          ctx.restore();

          // ============================================================
          // THIÊN THƯ TRÚC GIẢN • NGỌC GIẢN TRUYỀN CÔNG CỔ PHONG NHỎ GỌN
          // ============================================================
          // 1. Trục Cuộn Tranh / Nẹp Thần Mộc Sơn Mài Hai Đầu
          ctx.save();
          const rollerW = 4.5;
          const rollerH = ph + 4;
          ctx.fillStyle = "rgba(45, 24, 10, 0.88)";
          ctx.strokeStyle = "#D4AF37";
          ctx.lineWidth = 0.8;
          // Trục bên trái
          ctx.fillRect(-halfW - rollerW + 1, -rollerH / 2, rollerW, rollerH);
          ctx.strokeRect(-halfW - rollerW + 1, -rollerH / 2, rollerW, rollerH);
          // Đầu bịt hoàng kim trục trái
          ctx.fillStyle = "#FDE047";
          ctx.fillRect(-halfW - rollerW - 1, -rollerH / 2 - 1, rollerW + 2, 2.5);
          ctx.fillRect(-halfW - rollerW - 1, rollerH / 2 - 1.5, rollerW + 2, 2.5);

          // Trục bên phải
          ctx.fillStyle = "rgba(45, 24, 10, 0.88)";
          ctx.fillRect(halfW - 1, -rollerH / 2, rollerW, rollerH);
          ctx.strokeRect(halfW - 1, -rollerH / 2, rollerW, rollerH);
          // Đầu bịt hoàng kim trục phải
          ctx.fillStyle = "#FDE047";
          ctx.fillRect(halfW - 1, -rollerH / 2 - 1, rollerW + 2, 2.5);
          ctx.fillRect(halfW - 1, rollerH / 2 - 1.5, rollerW + 2, 2.5);
          ctx.restore();

          // 2. Thân Ngọc Giản Lụa Cổ Bán Trong Suốt
          ctx.beginPath();
          ctx.moveTo(-halfW + cut, -halfH);
          ctx.lineTo(halfW - cut, -halfH);
          ctx.lineTo(halfW, -halfH + cut);
          ctx.lineTo(halfW, halfH - cut);
          ctx.lineTo(halfW - cut, halfH);
          ctx.lineTo(-halfW + cut, halfH);
          ctx.lineTo(-halfW, halfH - cut);
          ctx.lineTo(-halfW, -halfH + cut);
          ctx.closePath();

          const scrollGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
          scrollGrad.addColorStop(0, "rgba(26, 14, 8, 0.82)");
          scrollGrad.addColorStop(0.5, "rgba(18, 10, 5, 0.80)");
          scrollGrad.addColorStop(1, "rgba(12, 6, 3, 0.78)");
          ctx.fillStyle = scrollGrad;
          ctx.fill();

          // Viền Gấm Hoàng Kim Ngoài
          ctx.strokeStyle = "rgba(212, 175, 55, 0.85)";
          ctx.lineWidth = 1.2;
          ctx.shadowColor = "#F59E0B";
          ctx.shadowBlur = 8;
          ctx.stroke();

          // 3. Dấu Triện Chu Sa Tiên Đạo
          ctx.save();
          const sealW = isMobile ? 32 : 36;
          const sealH = isMobile ? 10 : 12;
          const sealX = -halfW + (isMobile ? 20 : 23);
          const sealY = -halfH + (isMobile ? 7 : 8);
          ctx.fillStyle = "rgba(153, 27, 27, 0.85)";
          ctx.strokeStyle = "#F87171";
          ctx.lineWidth = 0.6;
          ctx.fillRect(sealX - sealW / 2, sealY - sealH / 2, sealW, sealH);
          ctx.strokeRect(sealX - sealW / 2, sealY - sealH / 2, sealW, sealH);
          ctx.fillStyle = "#FFFBEB";
          ctx.font = "900 6.5px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("仙 篆 • IELTS", sealX, sealY);
          ctx.restore();

          // 4. TỪ VỰNG TIẾNG ANH (CHỮ MẠ HOÀNG KIM NỔI BẬT NẰM Ở TRÊN)
          ctx.font = isMobile ? "900 13px 'Cinzel', serif" : "900 15px 'Cinzel', serif";
          ctx.fillStyle = "#FEF08A";
          ctx.shadowColor = "#F59E0B";
          ctx.shadowBlur = 6;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(b.word, 0, isMobile ? -8 : -10);

          // 5. PHIÊN ÂM IPA CỔ TỰ (PHÁT QUANG BÍCH NGỌC PHÍA DƯỚI)
          ctx.font = isMobile ? "700 9.5px monospace" : "700 10.5px monospace";
          ctx.fillStyle = "#38BDF8";
          ctx.shadowColor = "#0284C7";
          ctx.shadowBlur = 5;
          ctx.fillText(b.ipa || "/.../", 0, isMobile ? 3 : 4);

          // 6. MINH CHÚ NGHĨA TIẾNG VIỆT (CHUẨN FONT TIẾNG VIỆT, KHÔNG LỖI DẤU)
          if (b.meaning) {
            ctx.font = isMobile ? "600 8.5px 'Be Vietnam Pro', system-ui, sans-serif" : "600 9.5px 'Be Vietnam Pro', system-ui, sans-serif";
            ctx.fillStyle = "#FEF9C3";
            ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
            ctx.shadowBlur = 4;
            const maxLen = isMobile ? 22 : 28;
            const shortMeaning = b.meaning.length > maxLen ? (b.meaning.substring(0, maxLen - 2) + "...") : b.meaning;
            ctx.fillText(shortMeaning, 0, isMobile ? 14 : 17);
          }

          // 7. Đom Đóm Linh Khí Bay Lên
          for (let m = 0; m < 2; m++) {
            const mx = Math.sin(b.life * 4 + m * 2) * (pw * 0.3);
            const my = -halfH - ((b.maxLife - b.life) * 20 + m * 6);
            ctx.fillStyle = "rgba(254, 240, 138, 0.85)";
            ctx.beginPath();
            ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
        ctx.restore();
      }

      // 2. Vẽ Hạt Tu Vi Hút Về (EXP Orbs)
      if (this.expOrbs.length > 0) {
        ctx.save();
        for (const orb of this.expOrbs) {
          ctx.fillStyle = "#FDE047";
          ctx.shadowColor = "#F59E0B";
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, 6.5, 0, Math.PI * 2);
          ctx.fill();

          // Đuôi sáng của viên đan tu vi
          ctx.strokeStyle = "rgba(253, 224, 71, 0.45)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(orb.x, orb.y);
          ctx.lineTo(orb.x + (Math.random() - 0.5) * 8, orb.y + 10);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Vẽ Chữ Nổi Thông Thường
      if (this.texts.length > 0) {
        ctx.save();
        for (const item of this.texts) {
          ctx.globalAlpha = Math.max(0, item.alpha);
          ctx.fillStyle = item.color;
          ctx.shadowColor = item.color;
          ctx.shadowBlur = 10;
          ctx.font = `bold ${item.size}px 'Playfair Display', 'Be Vietnam Pro', serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(item.text, item.x, item.y);
        }
        ctx.restore();
      }
    }

    // Bong bóng thoại bên hông Mèo Tôn (không che trận chiến)
    drawSideSpeechBubble(ctx, x, y, text) {
      if (!text) return;
      ctx.save();
      ctx.font = "italic 13px 'Be Vietnam Pro', sans-serif";
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const boxW = Math.max(130, textWidth + 28);
      const boxH = 34;

      const boxX = x - boxW / 2;
      const boxY = y - boxH;

      ctx.fillStyle = "rgba(18, 10, 32, 0.92)";
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x, y + 8);
      ctx.lineTo(x + 6, y);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FEF3C7";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, boxY + boxH / 2);
      ctx.restore();
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.FloatingText = FloatingText;
})(typeof window !== 'undefined' ? window : globalThis);

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
    }

    clear() {
      this.texts = [];
      this.bursts = [];
      this.expOrbs = [];
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
      this.bursts.push({
        x: x,
        y: y,
        word: wordItem.word,
        ipa: wordItem.ipa || "",
        meaning: wordItem.meaning || "",
        type: wordItem.type || "",
        scale: 0.2,
        maxScale: 1.0,
        rot: 0,
        alpha: 1.0,
        life: 1.0, // Thời lượng 1.0s thanh thoát, không che khuất màn hình
        maxLife: 1.0
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

          // CĂN GIỮA HOÀN MỸ THEO TRỤC NGANG: Tuyệt đối không bị lệch sang mép trái hay phải
          const safeX = canvasW / 2;
          // Căn trục dọc ở tầm nhìn thoáng đãng, không đè mèo, không đè HUD
          const safeY = Math.max(105, Math.min(canvasH * 0.40, b.y));

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

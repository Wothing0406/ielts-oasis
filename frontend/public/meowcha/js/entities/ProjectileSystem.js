/**
 * ProjectileSystem.js - Hệ Thống 5 Đại Tuyệt Kỹ Phi Kiếm Cổ Phong (Dương Quá Kiếm Ý)
 * 5 Cảnh Giới mang 5 hình thái kiếm khí độc bản tuyệt đối:
 * - Cảnh 0 (Luyện Khí): Thanh Trúc Kiếm Khí (Lưỡi kiếm tre ngọc bích để lại vệt lá trúc bay lượn)
 * - Cảnh 1 (Trúc Cơ): Song Kiếm Âm Dương Hợp Bích (Hai thanh phi kiếm xoay quanh nhau theo quỹ đạo xoắn ốc)
 * - Cảnh 2 (Kim Đan): Hoàng Kim Trảm Tiên Kiếm (Đại kiếm hoàng kim mang luồng linh khí Bát Quái & hoa sen Kim Liên)
 * - Cảnh 3 (Nguyên Anh): Cửu Thiên Thần Lôi Kiếm (Tia sét tím chớp giật xé toạc hư không, hồ quang lôi điện bao bọc)
 * - Cảnh 4 (Hóa Thần): Lục Kiếm Trận • Chân Long Hóa Hình (Lục đại kiếm luân xoay tròn hóa thành đầu Chân Long gầm thét)
 */
(function(root) {
  class ProjectileSystem {
    constructor(assets) {
      this.assets = assets || {};
      this.projectiles = [];
      this.skyStrikes = []; // Đòn sấm sét từ đỉnh trời / Long kiếm giáng thế khi kết liễu từ
      this.shockwaves = []; // Sóng xung kích kiếm quang bung tròn khi va chạm
      this.time = 0;
    }

    clear() {
      this.projectiles = [];
      this.skyStrikes = [];
      this.shockwaves = [];
    }

    spawnShockwave(x, y, color = "#FDE047") {
      this.shockwaves.push({
        x: x,
        y: y,
        r: 6,
        maxR: 52,
        color: color,
        alpha: 1.0,
        speed: 140
      });
    }

    // Phóng phi kiếm chiêu thức theo cảnh giới
    spawn(fromX, fromY, targetX, targetY, realmIdx = 0, color = "#22C55E") {
      const angle = Math.atan2(targetY - fromY, targetX - fromX);
      const speed = 25.0;

      this.projectiles.push({
        x: fromX,
        y: fromY,
        startX: fromX,
        startY: fromY,
        targetX: targetX,
        targetY: targetY,
        speed: speed,
        angle: angle,
        color: color,
        realmIdx: Math.min(4, Math.max(0, realmIdx)),
        length: 32,
        birthTime: performance.now(),
        trail: [] // Lưu lại các điểm dấu vết đường bay
      });
    }

    // Đòn thiên giáng tối thượng khi trảm xong 1 từ (Sky Strike / Thunder / Dragon)
    spawnSkyStrike(targetX, targetY, realmIdx = 0) {
      this.skyStrikes.push({
        x: targetX,
        y: targetY,
        realmIdx: realmIdx,
        life: 0.45,
        maxLife: 0.45,
        boltPath: this._generateLightningPath(targetX, 0, targetX, targetY)
      });
    }

    _generateLightningPath(x1, y1, x2, y2) {
      const points = [{ x: x1, y: y1 }];
      const segments = 12;
      const dy = (y2 - y1) / segments;
      let curX = x1;
      let curY = y1;

      for (let i = 1; i < segments; i++) {
        curY += dy;
        curX += (Math.random() - 0.5) * 36;
        points.push({ x: curX, y: curY });
      }
      points.push({ x: x2, y: y2 });
      return points;
    }

    update(dt = 0.016, onHit) {
      this.time += dt;

      // 1. Cập nhật phi kiếm thông thường
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.x += Math.cos(p.angle) * p.speed * 60 * dt;
        p.y += Math.sin(p.angle) * p.speed * 60 * dt;

        // Lưu vệt bay xé gió
        p.trail.unshift({ x: p.x, y: p.y });
        if (p.trail.length > 12) p.trail.pop();

        // Kiểm tra va chạm mục tiêu
        const dist = Math.hypot(p.targetX - p.x, p.targetY - p.y);
        if (dist <= p.speed * 1.6 || p.y <= p.targetY) {
          if (onHit) onHit(p);
          this.spawnShockwave(p.targetX, p.targetY, p.color);
          this.projectiles.splice(i, 1);
        }
      }

      // 2. Cập nhật đòn sấm giáng / thiên kiếm
      for (let i = this.skyStrikes.length - 1; i >= 0; i--) {
        const s = this.skyStrikes[i];
        s.life -= dt;
        if (s.life <= 0) {
          this.skyStrikes.splice(i, 1);
        }
      }

      // 3. Cập nhật sóng xung kích va chạm (Shockwaves)
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.r += sw.speed * dt;
        sw.alpha -= dt * 2.6;
        if (sw.alpha <= 0 || sw.r >= sw.maxR) {
          this.shockwaves.splice(i, 1);
        }
      }
    }

    draw(ctx) {
      // 1. VẼ ĐÒN THIÊN GIÁNG TỐI THƯỢNG (SẤM SÉT CỬU THIÊN HOẶC LONG KIẾM)
      if (this.skyStrikes.length > 0) {
        ctx.save();
        for (const s of this.skyStrikes) {
          const alpha = s.life / s.maxLife;
          ctx.globalAlpha = alpha;

          if (s.realmIdx === 3) {
            // CỬU THIÊN THẦN LÔI GIÁNG THẾ (Cột sét tím từ đỉnh trời xé rách mây)
            ctx.strokeStyle = "#F3E8FF";
            ctx.lineWidth = 6;
            ctx.shadowColor = "#C084FC";
            ctx.shadowBlur = 35;
            ctx.beginPath();
            for (let idx = 0; idx < s.boltPath.length; idx++) {
              const pt = s.boltPath[idx];
              if (idx === 0) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();

            // Vỏ lôi quang bên ngoài
            ctx.strokeStyle = "#A855F7";
            ctx.lineWidth = 14;
            ctx.stroke();

          } else if (s.realmIdx >= 4) {
            // CHÂN LONG GIÁNG LÂM (Cột kiếm quang hoàng kim khổng lồ)
            const grad = ctx.createLinearGradient(s.x, 0, s.x, s.y);
            grad.addColorStop(0, "rgba(254, 240, 138, 0.9)");
            grad.addColorStop(0.7, "rgba(245, 158, 11, 0.8)");
            grad.addColorStop(1, "rgba(239, 68, 68, 0.95)");

            ctx.fillStyle = grad;
            ctx.shadowColor = "#F59E0B";
            ctx.shadowBlur = 40;
            ctx.beginPath();
            ctx.moveTo(s.x - 28, 0);
            ctx.lineTo(s.x + 28, 0);
            ctx.lineTo(s.x + 8, s.y);
            ctx.lineTo(s.x - 8, s.y);
            ctx.closePath();
            ctx.fill();

          } else if (s.realmIdx === 1) {
            // SONG KIẾM X-SLASH (Vết chém chữ X lam ngọc sắc bén - Sprite Pixel Art)
            if (this.assets?.prop_sword_slash?.loaded) {
              ctx.imageSmoothingEnabled = false;
              const slashSize = 78 * (1 - alpha * 0.35);
              ctx.save();
              ctx.translate(s.x, s.y);
              ctx.shadowColor = "#38BDF8";
              ctx.shadowBlur = 25;
              ctx.rotate(Math.PI / 4);
              ctx.drawImage(this.assets.prop_sword_slash.img, -slashSize / 2, -slashSize / 2, slashSize, slashSize);
              ctx.rotate(Math.PI / 2);
              ctx.drawImage(this.assets.prop_sword_slash.img, -slashSize / 2, -slashSize / 2, slashSize, slashSize);
              ctx.restore();
            } else {
              ctx.strokeStyle = "#38BDF8";
              ctx.lineWidth = 4.5;
              ctx.shadowColor = "#0284C7";
              ctx.shadowBlur = 20;
              const size = 50 * (1 - alpha);
              ctx.beginPath();
              ctx.moveTo(s.x - size, s.y - size);
              ctx.lineTo(s.x + size, s.y + size);
              ctx.moveTo(s.x + size, s.y - size);
              ctx.lineTo(s.x - size, s.y + size);
              ctx.stroke();
            }

          } else if (s.realmIdx === 2) {
            // ĐÀI SEN VÀNG NỞ RỘ DƯỚI MA THẠCH
            ctx.strokeStyle = "#FDE047";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = "#F59E0B";
            ctx.shadowBlur = 25;
            const r = 45 * (1 - alpha * 0.5);
            for (let pet = 0; pet < 8; pet++) {
              const pa = pet * (Math.PI / 4) + s.life * 4;
              ctx.beginPath();
              ctx.arc(s.x + Math.cos(pa) * (r * 0.5), s.y + Math.sin(pa) * (r * 0.5), r * 0.4, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      // 1.1 VẼ SÓNG XUNG KÍCH VA CHẠM BUNG TRÒN & NỔ BỤI LINH TRÀ (AUTHENTIC PIXEL TEA EXPLOSION)
      if (this.shockwaves && this.shockwaves.length > 0) {
        ctx.save();
        for (const sw of this.shockwaves) {
          ctx.globalAlpha = Math.max(0, sw.alpha);

          // Vẽ Sprite Nổ Trà / Burst Pixel Art Chân Thực
          if (this.assets?.prop_tea_explosion?.loaded) {
            ctx.imageSmoothingEnabled = false;
            const expSize = sw.r * 2.2;
            ctx.save();
            ctx.translate(sw.x, sw.y);
            ctx.shadowColor = sw.color;
            ctx.shadowBlur = 18;
            ctx.drawImage(this.assets.prop_tea_explosion.img, -expSize / 2, -expSize / 2, expSize, expSize);
            ctx.restore();
          }

          ctx.strokeStyle = sw.color;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = sw.color;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
          ctx.stroke();

          // Vòng gợn sóng thứ 2 bên trong
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, Math.max(0, sw.r * 0.55), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. VẼ 5 ĐẠI CHIÊU THỨC PHI KIẾM THEO TỪNG CẢNH GIỚI
      if (this.projectiles.length === 0) return;

      ctx.save();
      for (const p of this.projectiles) {
        // Vệt kiếm quang phát quang xé toạc tầng mây (Glowing Blade Ribbon Trail)
        if (p.trail && p.trail.length > 1) {
          ctx.save();
          ctx.strokeStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 20;
          ctx.lineCap = "round";
          for (let t = 0; t < p.trail.length - 1; t++) {
            const pt1 = p.trail[t];
            const pt2 = p.trail[t + 1];
            const ratio = 1.0 - (t / p.trail.length);
            ctx.globalAlpha = ratio * 0.85;
            ctx.lineWidth = Math.max(1.2, ratio * 7.5);
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.stroke();
          }
          ctx.restore();
        }

        const realm = p.realmIdx;

        if (realm === 0) {
          // ============================================================
          // CHIÊU 0 - LUYỆN KHÍ: THANH TRÚC KIẾM KHÍ (PIXEL ART BAMBOO SWORD)
          // ============================================================
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          const bambooImg = this.assets?.prop_bamboo_sword?.loaded ? this.assets.prop_bamboo_sword.img : null;
          if (bambooImg) {
            ctx.imageSmoothingEnabled = false;
            ctx.shadowColor = "#22C55E";
            ctx.shadowBlur = 18;
            const sLen = 42;
            const sW = 24;
            ctx.save();
            // Xoay -45 độ do sprite gốc vẽ kiếm chéo góc 45 độ
            ctx.rotate(-Math.PI / 4);
            ctx.drawImage(bambooImg, -sW / 2, -sLen * 0.8, sW, sLen);
            ctx.restore();
          } else {
            // Fallback nếu ảnh chưa nạp xong
            ctx.shadowColor = "#10B981";
            ctx.shadowBlur = 16;
            ctx.fillStyle = "#052E16";
            ctx.strokeStyle = "#22C55E";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.length, 0);
            ctx.lineTo(-p.length * 0.4, -4.5);
            ctx.lineTo(-p.length * 0.2, 0);
            ctx.lineTo(-p.length * 0.4, 4.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();

        } else if (realm === 1) {
          // ============================================================
          // CHIÊU 1 - TRÚC CƠ: SONG KIẾM ÂM DƯƠNG HỢP BÍCH (PIXEL ART JADE SWORDS)
          // ============================================================
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          const timeShift = (performance.now() - p.birthTime) * 0.015;
          const orbitOffset = Math.sin(timeShift) * 14;
          const jadeImg = this.assets?.prop_jade_sword?.loaded ? this.assets.prop_jade_sword.img : null;

          if (jadeImg) {
            ctx.imageSmoothingEnabled = false;
            const sLen = 38;
            const sW = 20;

            // Kiếm Dương (Lam Ngọc bay bên trên)
            ctx.save();
            ctx.translate(0, orbitOffset);
            ctx.shadowColor = "#38BDF8";
            ctx.shadowBlur = 18;
            ctx.rotate(-Math.PI / 4);
            ctx.drawImage(jadeImg, -sW / 2, -sLen * 0.8, sW, sLen);
            ctx.restore();

            // Kiếm Âm (Thanh Ngọc bay đối xứng bên dưới)
            ctx.save();
            ctx.translate(0, -orbitOffset);
            ctx.shadowColor = "#67E8F9";
            ctx.shadowBlur = 18;
            ctx.rotate(-Math.PI / 4);
            ctx.drawImage(jadeImg, -sW / 2, -sLen * 0.8, sW, sLen);
            ctx.restore();

            // Dải lụa kiếm khí xoắn ốc liên kết 2 kiếm
            ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, orbitOffset);
            ctx.lineTo(-p.length * 0.6, 0);
            ctx.lineTo(0, -orbitOffset);
            ctx.stroke();
          } else {
            // Fallback
            ctx.save();
            ctx.translate(0, orbitOffset);
            ctx.shadowColor = "#38BDF8";
            ctx.shadowBlur = 18;
            ctx.fillStyle = "#0C4A6E";
            ctx.strokeStyle = "#38BDF8";
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(p.length * 0.9, 0);
            ctx.lineTo(-p.length * 0.3, -3.5);
            ctx.lineTo(-p.length * 0.1, 0);
            ctx.lineTo(-p.length * 0.3, 3.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
          ctx.restore();

        } else if (realm === 2) {
          // ============================================================
          // CHIÊU 2 - KIM ĐAN: HOÀNG KIM TRẢM TIÊN BÁT QUÁI KIẾM (PIXEL ART)
          // ============================================================
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          // Hào quang đại đạo hoàng kim
          ctx.shadowColor = "#F59E0B";
          ctx.shadowBlur = 25;

          const jadeImg = this.assets?.prop_jade_sword?.loaded ? this.assets.prop_jade_sword.img : null;
          if (jadeImg) {
            ctx.imageSmoothingEnabled = false;
            const sLen = 50;
            const sW = 28;
            ctx.save();
            ctx.rotate(-Math.PI / 4);
            ctx.drawImage(jadeImg, -sW / 2, -sLen * 0.8, sW, sLen);
            ctx.restore();
          } else {
            ctx.fillStyle = "rgba(120, 53, 15, 0.95)";
            ctx.strokeStyle = "#FDE047";
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            ctx.moveTo(p.length * 1.1, 0);
            ctx.lineTo(-p.length * 0.4, -6.5);
            ctx.lineTo(-p.length * 0.2, 0);
            ctx.lineTo(-p.length * 0.4, 6.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }

          // Vòng Bát Quái hộ thể xoay quanh thân kiếm
          const baguaRot = (performance.now() - p.birthTime) * 0.008;
          ctx.save();
          ctx.translate(-p.length * 0.1, 0);
          ctx.rotate(baguaRot);
          ctx.strokeStyle = "#FDE047";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.stroke();
          for (let q = 0; q < 4; q++) {
            const qa = q * (Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(Math.cos(qa) * 13, Math.sin(qa) * 13);
            ctx.lineTo(Math.cos(qa) * 19, Math.sin(qa) * 19);
            ctx.stroke();
          }
          ctx.restore();
          ctx.restore();

        } else if (realm === 3) {
          // ============================================================
          // CHIÊU 3 - NGUYÊN ANH: CỬU THIÊN THẦN LÔI KIẾM (TỬ ĐIỆN PIXEL ART)
          // ============================================================
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          ctx.shadowColor = "#C084FC";
          ctx.shadowBlur = 28;

          // Luồng sét nhánh ngoằn ngoèo xé gió
          ctx.strokeStyle = "#F3E8FF";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-p.length, 0);
          for (let seg = 1; seg <= 5; seg++) {
            const segX = -p.length + (seg / 5) * p.length * 2.1;
            const segY = (Math.random() - 0.5) * 10;
            ctx.lineTo(segX, segY);
          }
          ctx.stroke();

          const thunderImg = (this.assets?.sword_realm3_thunder?.loaded && this.assets.sword_realm3_thunder.img) ||
                             (this.assets?.prop_jade_sword?.loaded && this.assets.prop_jade_sword.img) || null;
          if (thunderImg) {
            ctx.imageSmoothingEnabled = false;
            const sLen = 48;
            const sW = 26;
            ctx.save();
            ctx.rotate(-Math.PI / 4);
            ctx.drawImage(thunderImg, -sW / 2, -sLen * 0.8, sW, sLen);
            ctx.restore();
          } else {
            ctx.fillStyle = "rgba(59, 7, 100, 0.9)";
            ctx.strokeStyle = "#A855F7";
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(p.length * 1.2, 0);
            ctx.lineTo(-p.length * 0.5, -5.5);
            ctx.lineTo(-p.length * 0.2, 0);
            ctx.lineTo(-p.length * 0.5, 5.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }

          // Hồ quang phóng ra ngoài
          ctx.strokeStyle = "#E9D5FF";
          ctx.lineWidth = 1.5;
          for (let arc = 0; arc < 3; arc++) {
            const arcAngle = (arc * Math.PI * 2) / 3 + this.time * 8;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(arcAngle) * 18, Math.sin(arcAngle) * 18);
            ctx.stroke();
          }
          ctx.restore();

        } else {
          // ============================================================
          // CHIÊU 4 - HÓA THẦN: LỤC KIẾM TRẬN • CHÂN LONG HÓA HÌNH
          // ============================================================
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          ctx.shadowColor = "#F59E0B";
          ctx.shadowBlur = 35;

          // 1. ĐẦU CHÂN LONG HOÀNG KIM (GOLDEN DRAGON HEAD)
          ctx.fillStyle = "#F59E0B";
          ctx.strokeStyle = "#FEF08A";
          ctx.lineWidth = 2.5;

          // Hàm rồng & sừng rồng
          ctx.beginPath();
          ctx.moveTo(p.length * 1.4, 0); // Mõm rồng
          ctx.lineTo(p.length * 0.8, -10); // Sừng trên
          ctx.lineTo(p.length * 0.4, -6);
          ctx.lineTo(-p.length * 0.2, -12); // Vây rồng
          ctx.lineTo(-p.length * 0.4, 0);
          ctx.lineTo(-p.length * 0.2, 12);
          ctx.lineTo(p.length * 0.4, 6);
          ctx.lineTo(p.length * 0.8, 10); // Sừng dưới
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Mắt rồng đỏ rực phát quang
          ctx.fillStyle = "#EF4444";
          ctx.shadowColor = "#EF4444";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(p.length * 0.7, -3.5, 2.5, 0, Math.PI * 2);
          ctx.arc(p.length * 0.7, 3.5, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Râu rồng uốn lượn
          ctx.strokeStyle = "#FEF08A";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(p.length * 1.3, -2);
          ctx.quadraticCurveTo(p.length * 1.5, -12, p.length * 1.8, -8);
          ctx.moveTo(p.length * 1.3, 2);
          ctx.quadraticCurveTo(p.length * 1.5, 12, p.length * 1.8, 8);
          ctx.stroke();

          // 2. LỤC KIẾM LUÂN (6 THANH PHI KIẾM PIXEL ART XOAY TRÒN SAU ĐẦU RỒNG)
          const rotPhase = (performance.now() - p.birthTime) * 0.012;
          const dragonImg = (this.assets?.sword_realm4_dragon?.loaded && this.assets.sword_realm4_dragon.img) ||
                            (this.assets?.sword_realm3_thunder?.loaded && this.assets.sword_realm3_thunder.img) ||
                            (this.assets?.prop_jade_sword?.loaded && this.assets.prop_jade_sword.img) || null;

          for (let k = 0; k < 6; k++) {
            const kAngle = (k * Math.PI) / 3 + rotPhase;
            const kx = -p.length * 0.4 + Math.cos(kAngle) * 22;
            const ky = Math.sin(kAngle) * 22;

            ctx.save();
            ctx.translate(kx, ky);
            ctx.rotate(kAngle + Math.PI / 2);

            if (dragonImg) {
              ctx.imageSmoothingEnabled = false;
              ctx.shadowColor = "#FDE047";
              ctx.shadowBlur = 16;
              ctx.rotate(-Math.PI / 4);
              ctx.drawImage(dragonImg, -8, -15, 16, 28);
            } else {
              ctx.fillStyle = "#FDE047";
              ctx.strokeStyle = "#B45309";
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(12, 0);
              ctx.lineTo(-6, -2.5);
              ctx.lineTo(-6, 2.5);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            }
            ctx.restore();
          }

          ctx.restore();
        }
      }
      ctx.restore();
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.ProjectileSystem = ProjectileSystem;
})(typeof window !== 'undefined' ? window : globalThis);


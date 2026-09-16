/**
 * AsteroidManager.js - Quản Lý Ma Thạch Cổ Ngữ (3D Craggy Meteor, Magma Veins & Carved Runes)
 * Loại bỏ hoàn toàn nhãn dán phẳng. Tái tạo ma thạch chân thực với đuôi lửa, sóng xung kích,
 * lõi đá nứt rực sáng và từng cổ phù khắc kim phát quang theo nhịp gõ kiếm đạo.
 */
(function(root) {
  class AsteroidManager {
    constructor(assets) {
      this.assets = assets || {};
      this.asteroids = [];
      this.time = 0;
    }

    clear() {
      this.asteroids = [];
    }

    get count() {
      return this.asteroids.length;
    }

    spawn(wordItem, canvasWidth, realmIdx = 0, slowFactor = 1.0, bandIdx = 0) {
      if (!wordItem || !wordItem.word) return null;
      const wordUpper = wordItem.word.toUpperCase();
      if (this.asteroids.some(a => a.word === wordUpper)) {
        return null; // Skip duplicate word spawn
      }
      const bIdx = Math.max(0, Math.min(3, bandIdx !== undefined && bandIdx !== null ? bandIdx : realmIdx));
      let asteroidType = "ice";
      let coreColor = "#38BDF8";
      let glowColor = "#0284C7";
      let runeColor = "#E0F2FE";
      let trailColors = ["#38BDF8", "#7DD3FC", "#BAE6FD", "#FFFFFF", "#0284C7"];

      if (bIdx === 1) {
        asteroidType = "fire";
        coreColor = "#F97316";
        glowColor = "#EF4444";
        runeColor = "#FEF08A";
        trailColors = ["#F97316", "#EF4444", "#FEF08A", "#991B1B", "#292524"];
      } else if (bIdx === 2) {
        asteroidType = "void";
        coreColor = "#A855F7";
        glowColor = "#7E22CE";
        runeColor = "#F3E8FF";
        trailColors = ["#A855F7", "#C084FC", "#E9D5FF", "#581C87", "#1E1B4B"];
      } else if (bIdx >= 3) {
        asteroidType = "chaos";
        coreColor = "#F59E0B";
        glowColor = "#D97706";
        runeColor = "#FFFBEB";
        trailColors = ["#F59E0B", "#FDE047", "#FEF08A", "#78350F", "#451A03"];
      }

      const word = wordItem.word.toUpperCase();
      this.canvasWidth = canvasWidth;
      const isMobile = canvasWidth <= 600;
      const charW = isMobile ? 15 : 20;
      const totalWordW = word.length * charW;
      const halfWordW = totalWordW / 2;
      const baseRadius = isMobile ? Math.max(38, word.length * 5.8) : Math.max(46, word.length * 8.2);
      const safeMargin = Math.max(baseRadius + 24, halfWordW + 36);
      const minX = safeMargin;
      const maxX = Math.max(minX + 20, canvasWidth - safeMargin);
      const spawnX = minX + Math.random() * (maxX - minX);

      const realms = (root && root.Meowcha && root.Meowcha.CULTIVATION_REALMS) || [];
      const realmData = realms[realmIdx] || { speedMult: 1.0 };
      let baseSpeed = (0.28 + realmIdx * 0.15) * (realmData.speedMult || 1.0) * slowFactor;
      if (realmIdx >= 4) {
        // DẠNG THẦN CAO NHẤT: Ma thạch giáng lâm cực tốc hỗn độn
        baseSpeed *= 1.35;
      }

      // Góc nghiêng tự nhiên (-10° đến +10°)
      const lateralDrift = (Math.random() - 0.5) * 0.5;
      const vy = baseSpeed;
      const vx = lateralDrift;
      const fallAngle = Math.atan2(vy, vx);

      // Tạo hình dạng đá gồ ghề (12 đỉnh góc đa giác tự nhiên)
      const craggyPoints = [];
      const numVertices = 12;
      for (let i = 0; i < numVertices; i++) {
        const ang = (i / numVertices) * Math.PI * 2;
        const radOffset = (Math.random() - 0.5) * (isMobile ? 8 : 14);
        craggyPoints.push({
          angle: ang,
          r: baseRadius + radOffset
        });
      }

      // Vết nứt dung nham / lôi điện trên bề mặt
      const veins = [];
      for (let v = 0; v < 3; v++) {
        const a1 = Math.random() * Math.PI * 2;
        const a2 = a1 + (Math.random() - 0.5) * 1.8;
        const r1 = baseRadius * (0.3 + Math.random() * 0.4);
        const r2 = baseRadius * (0.6 + Math.random() * 0.35);
        veins.push({
          x1: Math.cos(a1) * r1,
          y1: Math.sin(a1) * r1,
          midX: (Math.cos(a1) * r1 + Math.cos(a2) * r2) / 2 + (Math.random() - 0.5) * 10,
          midY: (Math.sin(a1) * r1 + Math.sin(a2) * r2) / 2 + (Math.random() - 0.5) * 10,
          x2: Math.cos(a2) * r2,
          y2: Math.sin(a2) * r2
        });
      }

      const asteroid = {
        id: Date.now() + Math.random(),
        word: word,
        ipa: wordItem.ipa || "/.../",
        meaning: wordItem.meaning || "",
        archetype: asteroidType,
        asteroidType: asteroidType,
        bandIdx: bIdx,
        trailColors: trailColors,
        x: spawnX,
        y: -70,
        vx: vx,
        vy: vy,
        fallAngle: fallAngle,
        radius: baseRadius,
        craggyPoints: craggyPoints,
        veins: veins,
        coreColor: coreColor,
        glowColor: glowColor,
        runeColor: runeColor,
        typedLen: 0,
        wobbleSeed: Math.random() * 100,
        wobbleSpeed: 1.2 + Math.random() * 0.6,
        rot: 0,
        rotSpeed: (Math.random() - 0.5) * 0.4,
        hitReaction: 0,
        trail: [] // Hạt đuôi bụi linh khí pixel
      };

      this.asteroids.push(asteroid);
      return asteroid;
    }

    update(dt = 0.016, bottomThreshold, onBottomHit, canvasWidth) {
      this.time += dt;
      const cWidth = canvasWidth || this.canvasWidth || (typeof window !== "undefined" ? window.innerWidth : 800);

      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const ast = this.asteroids[i];
        ast.x += ast.vx * 60 * dt;
        ast.y += ast.vy * 60 * dt;
        ast.vy += dt * 0.04; // Trọng lực ma giới kéo ma thạch tăng tốc dần khi rơi
        ast.rot += ast.rotSpeed * dt;

        // Giữ ma thạch và toàn bộ từ vựng luôn nằm trọn trong chiến trường, không bao giờ bay tràn mép
        const isMobileScreen = cWidth <= 600;
        const charW = isMobileScreen ? 15 : 20;
        const halfWordW = ((ast.word && ast.word.length) ? ast.word.length : 6) * charW / 2;
        const safeMargin = Math.max((ast.radius || 46) + 24, halfWordW + 36);
        if (ast.x < safeMargin) {
          ast.x = safeMargin;
          ast.vx = Math.abs(ast.vx);
        } else if (ast.x > cWidth - safeMargin) {
          ast.x = cWidth - safeMargin;
          ast.vx = -Math.abs(ast.vx);
        }

        if (ast.hitReaction > 0) {
          ast.hitReaction = Math.max(0, ast.hitReaction - dt * 4.5);
        }

        // Sinh hạt đuôi linh khí & tàn tro pixel rơi rụng theo quỹ đạo rơi
        if (Math.random() < 0.85) {
          const trailAngle = ast.fallAngle + Math.PI + (Math.random() - 0.5) * 0.6;
          const trailSpeed = 1.4 + Math.random() * 2.8;
          const colors = ast.trailColors || [ast.coreColor, "#FEF08A", "#EF4444", "#F97316", "#292524"];
          ast.trail.push({
            x: ast.x + (Math.random() - 0.5) * ast.radius * 0.75,
            y: ast.y + (Math.random() - 0.5) * ast.radius * 0.45,
            vx: Math.cos(trailAngle) * trailSpeed,
            vy: Math.sin(trailAngle) * trailSpeed - 0.6, // Tàn tro bốc ngược nhẹ
            size: Math.floor(Math.random() * 4) + 3, // 3, 4, 5, 6px vuông vức chuẩn pixel
            alpha: 0.95,
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }

        // Cập nhật các hạt đuôi lửa
        for (let t = ast.trail.length - 1; t >= 0; t--) {
          const p = ast.trail[t];
          p.x += p.vx;
          p.y += p.vy;
          p.size = Math.max(0.8, p.size - dt * 2.5);
          p.alpha -= dt * 1.6;
          if (p.alpha <= 0) {
            ast.trail.splice(t, 1);
          }
        }

        if (ast.y >= bottomThreshold) {
          const missedAst = this.asteroids.splice(i, 1)[0];
          if (onBottomHit) onBottomHit(missedAst);
        }
      }
    }

    draw(ctx, screenFlash = 0) {
      for (const ast of this.asteroids) {
        ctx.save();
        const flashJitter = screenFlash > 0.05 ? (Math.random() - 0.5) * 6 * screenFlash : 0;
        const wobbleX = Math.sin(this.time * ast.wobbleSpeed + ast.wobbleSeed) * 4;
        const reactionShake = (Math.random() - 0.5) * ast.hitReaction * 16;
        const posX = ast.x + wobbleX + reactionShake + flashJitter;
        const posY = ast.y;

        // ============================================================
        // 1. VẼ CÁC HẠT ĐUÔI LỬA & BỤI THAN PIXEL (PIXEL EMBER PARTICLES)
        // ============================================================
        ctx.save();
        for (const p of ast.trail) {
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.restore();

        // ============================================================
        // 2. ĐUÔI LỬA BỐC KHÓI CUỒN CUỘN (ATMOSPHERIC FLARE CONE)
        // ============================================================
        ctx.save();
        const tailLength = ast.radius * 2.4;
        const tailAngle = ast.fallAngle + Math.PI; // Ngược chiều rơi
        const tailEndX = posX + Math.cos(tailAngle) * tailLength;
        const tailEndY = posY + Math.sin(tailAngle) * tailLength;

        const flameGrad = ctx.createLinearGradient(posX, posY, tailEndX, tailEndY);
        flameGrad.addColorStop(0, ast.coreColor);
        flameGrad.addColorStop(0.35, "rgba(239, 68, 68, 0.65)");
        flameGrad.addColorStop(0.75, "rgba(120, 20, 20, 0.3)");
        flameGrad.addColorStop(1, "transparent");

        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        const perpX = -Math.sin(tailAngle);
        const perpY = Math.cos(tailAngle);
        const w1 = ast.radius * 0.85;

        ctx.moveTo(posX - perpX * w1, posY - perpY * w1);
        ctx.quadraticCurveTo(
          (posX + tailEndX) / 2 + Math.sin(this.time * 12) * 8,
          (posY + tailEndY) / 2,
          tailEndX,
          tailEndY
        );
        ctx.quadraticCurveTo(
          (posX + tailEndX) / 2 - Math.sin(this.time * 12) * 8,
          (posY + tailEndY) / 2,
          posX + perpX * w1,
          posY + perpY * w1
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // ============================================================
        // 3. SÓNG XUNG KÍCH NÉN KHÍ Ở MŨI (BOW SHOCKWAVE ARCS)
        // ============================================================
        ctx.save();
        const noseX = posX + Math.cos(ast.fallAngle) * (ast.radius * 0.9);
        const noseY = posY + Math.sin(ast.fallAngle) * (ast.radius * 0.9);
        const shockWavePulse = Math.sin(this.time * 10) * 3;

        ctx.strokeStyle = "rgba(254, 240, 138, 0.55)";
        ctx.lineWidth = 2.0;
        ctx.shadowColor = ast.coreColor;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(noseX, noseY, ast.radius * 0.45 + shockWavePulse, ast.fallAngle - Math.PI / 2.2, ast.fallAngle + Math.PI / 2.2);
        ctx.stroke();
        ctx.restore();

        // ============================================================
        // 4. MA THẠCH HUYỀN THIÊN PIXEL ART CHÂN THỰC (AUTHENTIC PIXEL SPRITE)
        // ============================================================
        ctx.save();
        ctx.translate(posX, posY);
        ctx.rotate(ast.rot);

        // Đổ bóng hào quang ma vật rực lửa
        ctx.shadowColor = ast.hitReaction > 0 ? "#FFFFFF" : ast.glowColor;
        ctx.shadowBlur = ast.hitReaction > 0 ? 32 : 20;

        let spriteImg = null;
        if (ast.asteroidType === "ice") {
          spriteImg = (this.assets?.prop_asteroid_ice?.loaded && this.assets.prop_asteroid_ice.img) ||
                      (this.assets?.prop_asteroid?.loaded && this.assets.prop_asteroid.img) || null;
        } else if (ast.asteroidType === "fire") {
          spriteImg = (this.assets?.prop_asteroid_fire?.loaded && this.assets.prop_asteroid_fire.img) ||
                      (this.assets?.prop_asteroid?.loaded && this.assets.prop_asteroid.img) || null;
        } else if (ast.asteroidType === "void") {
          spriteImg = (this.assets?.prop_asteroid_void?.loaded && this.assets.prop_asteroid_void.img) ||
                      (this.assets?.prop_asteroid?.loaded && this.assets.prop_asteroid.img) || null;
        } else {
          spriteImg = (this.assets?.prop_asteroid?.loaded && this.assets.prop_asteroid.img) ||
                      (this.assets?.prop_asteroid_fire?.loaded && this.assets.prop_asteroid_fire.img) || null;
        }

        if (spriteImg) {
          ctx.imageSmoothingEnabled = false; // Chuẩn Retro Pixel Art
          const size = ast.radius * 2.35;
          ctx.drawImage(spriteImg, -size / 2, -size / 2, size, size);
        } else {
          // Graceful fallback nếu ảnh mạng tải chậm (KHÔNG BAO GIỜ VẼ ĐA GIÁC THÔ SỢI CAM)
          const rockGrad = ctx.createRadialGradient(-ast.radius * 0.25, -ast.radius * 0.25, 4, 0, 0, ast.radius * 1.05);
          rockGrad.addColorStop(0, ast.runeColor || "#FEF08A");
          rockGrad.addColorStop(0.35, ast.coreColor || "#F97316");
          rockGrad.addColorStop(0.75, "#180C06");
          rockGrad.addColorStop(1, "#0A0503");

          ctx.fillStyle = rockGrad;
          ctx.beginPath();
          ctx.arc(0, 0, ast.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = ast.glowColor || ast.coreColor;
          ctx.lineWidth = 2.0;
          ctx.stroke();
        }

        ctx.restore(); // Thoát khỏi phép xoay khối đá

        // ============================================================
        // 5. CỔ PHÙ KHẮC KIM (CARVED SACRED RUNES - KHÔNG CÓ KHUNG GIẤY THẺ)
        // ============================================================
        ctx.save();
        const word = ast.word;
        const isMobileScreen = (ctx.canvas && ctx.canvas.width <= 600) || (typeof window !== "undefined" && window.innerWidth <= 600);
        const charSpacing = isMobileScreen ? 14.5 : 20;
        const totalWordW = word.length * charSpacing;
        const startCharX = posX - totalWordW / 2 + charSpacing / 2;
        const runeY = posY;

        // Đệm hào quang kiếm ý mờ bảo hộ chữ
        const bgGlowGrad = ctx.createRadialGradient(posX, runeY, 10, posX, runeY, totalWordW / 1.6);
        bgGlowGrad.addColorStop(0, "rgba(10, 5, 18, 0.75)");
        bgGlowGrad.addColorStop(0.8, "rgba(10, 5, 18, 0.35)");
        bgGlowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = bgGlowGrad;
        ctx.beginPath();
        ctx.ellipse(posX, runeY, totalWordW / 1.8 + 12, isMobileScreen ? 17 : 22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = isMobileScreen ? "900 15.5px 'Cinzel', serif" : "900 20px 'Cinzel', 'Playfair Display', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let c = 0; c < word.length; c++) {
          const letter = word[c];
          const cx = startCharX + c * charSpacing;

          if (c < ast.typedLen) {
            // ĐÃ GÕ ĐÚNG: Kiếm khí Bích Ngọc xé toạc, bốc cháy ngọc quang
            ctx.save();
            ctx.fillStyle = "#10B981";
            ctx.shadowColor = "#34D399";
            ctx.shadowBlur = 14;
            ctx.fillText(letter, cx, runeY);

            // Vết kiếm chém xé toạc ký tự
            ctx.strokeStyle = "#ECFDF5";
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(cx - 9, runeY + 8);
            ctx.lineTo(cx + 9, runeY - 8);
            ctx.stroke();
            ctx.restore();

          } else if (c === ast.typedLen) {
            // KÝ TỰ MỤC TIÊU ĐANG GÕ: Rực lửa chu sa bừng sáng dữ dội
            ctx.save();
            const pulse = 1.0 + Math.sin(this.time * 12) * 0.14;
            ctx.translate(cx, runeY);
            ctx.scale(pulse, pulse);

            // Hào quang rực lửa
            ctx.fillStyle = "#FDE047";
            ctx.shadowColor = "#EF4444";
            ctx.shadowBlur = 24;
            ctx.fillText(letter, 0, 0);

            // Vòng phù ấn bao quanh ký tự đang gõ
            ctx.strokeStyle = "rgba(245, 158, 11, 0.85)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 13, 0, Math.PI * 2);
            ctx.stroke();

            // Tia lôi điện nhỏ bốc lên
            if (Math.sin(this.time * 20) > 0.4) {
              ctx.strokeStyle = "#FEF08A";
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(-6, -11);
              ctx.lineTo(0, -18);
              ctx.lineTo(6, -12);
              ctx.stroke();
            }

            ctx.restore();

          } else {
            // KÝ TỰ CHƯA GÕ: Cổ phù huyền thạch mạ vàng (Bị làm mờ nhiễu khi Lôi Kiếp giáng thế)
            ctx.save();
            if (screenFlash > 0.1) {
              const runeJitter = (Math.random() - 0.5) * 3;
              ctx.fillStyle = Math.random() < 0.3 ? "#C084FC" : "rgba(254, 243, 199, 0.4)";
              ctx.shadowColor = "#A855F7";
              ctx.shadowBlur = 18;
              ctx.fillText(letter, cx + runeJitter, runeY + runeJitter);
            } else {
              ctx.fillStyle = "#FEF3C7";
              ctx.shadowColor = "rgba(245, 158, 11, 0.6)";
              ctx.shadowBlur = 8;
              ctx.fillText(letter, cx, runeY);
            }
            ctx.restore();
          }
        }
        ctx.restore();

        ctx.restore();
      }
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.AsteroidManager = AsteroidManager;
})(typeof window !== 'undefined' ? window : globalThis);

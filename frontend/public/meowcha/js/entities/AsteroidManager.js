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

    spawn(wordItem, canvasWidth, realmIdx = 0, slowFactor = 1.0, bandIdx = 0, explicitType = null, explicitDamage = null) {
      if (!wordItem || !wordItem.word) return null;
      const wordUpper = wordItem.word.toUpperCase();
      if (this.asteroids.some(a => a.word === wordUpper)) {
        return null; // Skip duplicate word spawn
      }
      const rIdx = Math.max(0, realmIdx);
      
      // =========================================================================
      // TIẾN TRÌNH MA THẠCH THEO CẢNH GIỚI (PROGRESSION POOL):
      // Cấp 0 (Luyện Khí Kỳ): 100% Băng (ice)
      // Cấp 1 (Trúc Cơ Kỳ):   65% Băng (ice), 35% Hỏa (fire)
      // Cấp 2 (Kim Đan Kỳ):   25% Băng (ice), 45% Hỏa (fire), 30% Hư Không (void)
      // Cấp 3 (Nguyên Anh Kỳ): 10% Băng (ice), 25% Hỏa (fire), 40% Hư Không (void), 25% Huyết Lôi (thunder)
      // Cấp 4+ (Thần Cấp/Độ Kiếp): 5% Băng (ice), 20% Hỏa (fire), 35% Hư Không (void), 40% Huyết Lôi (thunder)
      // =========================================================================
      let asteroidType = explicitType;
      if (!asteroidType) {
        const rand = Math.random();
        if (rIdx === 0) {
          asteroidType = "ice";
        } else if (rIdx === 1) {
          asteroidType = rand < 0.65 ? "ice" : "fire";
        } else if (rIdx === 2) {
          if (rand < 0.25) asteroidType = "ice";
          else if (rand < 0.70) asteroidType = "fire";
          else asteroidType = "void";
        } else if (rIdx === 3) {
          if (rand < 0.10) asteroidType = "ice";
          else if (rand < 0.35) asteroidType = "fire";
          else if (rand < 0.75) asteroidType = "void";
          else asteroidType = "thunder";
        } else {
          if (rand < 0.05) asteroidType = "ice";
          else if (rand < 0.25) asteroidType = "fire";
          else if (rand < 0.60) asteroidType = "void";
          else asteroidType = "thunder";
        }
      }

      let coreColor = "#38BDF8";
      let glowColor = "#0284C7";
      let runeColor = "#E0F2FE";
      let trailColors = ["#38BDF8", "#7DD3FC", "#BAE6FD", "#FFFFFF", "#0284C7"];
      let baseDamage = 8;
      let typeSpeedMultiplier = 1.0;

      if (asteroidType === "fire") {
        coreColor = "#F97316";
        glowColor = "#EF4444";
        runeColor = "#FEF08A";
        trailColors = ["#F97316", "#EF4444", "#FEF08A", "#991B1B", "#292524"];
        baseDamage = 12;
        typeSpeedMultiplier = 1.05;
      } else if (asteroidType === "void") {
        coreColor = "#A855F7";
        glowColor = "#7E22CE";
        runeColor = "#F3E8FF";
        trailColors = ["#A855F7", "#C084FC", "#E9D5FF", "#581C87", "#1E1B4B"];
        baseDamage = 16;
        // Thiên thạch đen rơi êm dịu, tăng dần từ từ theo yêu cầu người chơi
        typeSpeedMultiplier = 0.82;
      } else if (asteroidType === "thunder" || asteroidType === "chaos") {
        asteroidType = "thunder";
        coreColor = "#FDE047";
        glowColor = "#DC2626";
        runeColor = "#FFFBEB";
        trailColors = ["#FDE047", "#F59E0B", "#DC2626", "#991B1B", "#18181B"];
        baseDamage = 22;
        typeSpeedMultiplier = 0.90;
      }

      const totalDamage = explicitDamage || (baseDamage + rIdx * 2);

      const word = wordItem.word.toUpperCase();
      this.canvasWidth = canvasWidth;
      const isMobile = canvasWidth <= 600;
      const charW = isMobile ? 15 : 20;
      const totalWordW = word.length * charW;
      const halfWordW = totalWordW / 2;
      const baseRadius = isMobile ? Math.max(38, word.length * 6.0) : Math.max(46, word.length * 8.2);
      const safeMargin = Math.max(baseRadius + 24, halfWordW + 36);
      // Trên màn hình PC rộng: Thanh ngọc giản HUD ở góc trên bên trái (chiếm ~500px).
      // Để thiên thạch không bị che khuất khi rơi, ưu tiên phân bổ từ x=490px trở sang phải
      const minX = isMobile ? safeMargin : Math.max(safeMargin, Math.min(canvasWidth * 0.38, 490));
      const maxX = Math.max(minX + 40, canvasWidth - safeMargin);
      const spawnX = minX + Math.random() * (maxX - minX);

      const realms = (root && root.Meowcha && root.Meowcha.CULTIVATION_REALMS) || [];
      const realmData = realms[realmIdx] || { speedMult: 1.0 };
      // Tốc độ điều chỉnh êm dịu, tăng dần từ từ, phù hợp hoàn toàn cho người chơi gõ phím bình thường
      const realmSpeedBase = [0.20, 0.23, 0.26, 0.30, 0.35];
      let baseSpeed = (realmSpeedBase[Math.min(4, realmIdx)] || 0.20) * (realmData.speedMult || 1.0) * slowFactor * typeSpeedMultiplier;

      // Rơi thẳng từ đỉnh trời xuống (-3° đến +3°)
      const lateralDrift = (Math.random() - 0.5) * 0.18;
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
          angle1: a1,
          r1: r1,
          angle2: a2,
          r2: r2
        });
      }

      // RƠI TỪ ĐỈNH TRỜI: Xuất phát từ phía trên mép màn hình và trôi êm ái xuống đan điền
      const spawnY = -baseRadius - 15;

      const asteroid = {
        id: Date.now() + Math.random(),
        word: word,
        ipa: wordItem.ipa || "/.../",
        meaning: wordItem.meaning || "",
        audio_url: wordItem.audio_url || "",
        archetype: asteroidType,
        asteroidType: asteroidType,
        damage: totalDamage,
        bandIdx: bandIdx,
        trailColors: trailColors,
        x: spawnX,
        y: spawnY,
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
        // Chuẩn xác góc xoay dọc thẳng đứng theo đúng mẫu đạo hữu đã duyệt:
        // Ice và Void: xoay fallAngle - 3*PI/4 (tương đương -45° khi rơi thẳng 90°)
        // Fire và Thunder: xoay fallAngle - PI/4
        rot: (asteroidType === "ice" || asteroidType === "void") ? (fallAngle - (3 * Math.PI) / 4) : (fallAngle - Math.PI / 4),
        rotSpeed: (Math.random() - 0.5) * 0.08,
        hitReaction: 0,
        trail: [] // Hạt đuôi bụi linh khí pixel
      };

      this.asteroids.push(asteroid);
      return asteroid;
    }

    update(dt = 0.016, bottomThreshold, onBottomHit, canvasWidth, isLightningHazard = false) {
      this.time += dt;
      const cWidth = canvasWidth || this.canvasWidth || (typeof window !== "undefined" ? window.innerWidth : 800);

      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const ast = this.asteroids[i];
        ast.x += ast.vx * 60 * dt;
        // Trong thiên kiếp sét: Tốc độ rơi giữ mức bình thường (1.0x) để người chơi kịp gõ
        const gravMult = 1.0;
        ast.y += ast.vy * 60 * dt * gravMult;
        ast.vy += dt * 0.002; // Gia tốc vi mô cực êm
        // Cập nhật fallAngle và góc xoay chuẩn xác (đứng dọc hướng xuống)
        ast.fallAngle = Math.atan2(ast.vy, ast.vx);
        const wobble = Math.sin(this.time * 2.5 + ast.wobbleSeed) * 0.03;
        if (ast.asteroidType === "ice" || ast.asteroidType === "void") {
          ast.rot = ast.fallAngle - (3 * Math.PI) / 4 + wobble;
        } else {
          ast.rot = ast.fallAngle - Math.PI / 4 + wobble;
        }

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
        } else if (ast.asteroidType === "thunder" || ast.asteroidType === "chaos") {
          spriteImg = (this.assets?.prop_asteroid_thunder?.loaded && this.assets.prop_asteroid_thunder.img) ||
                      (this.assets?.prop_asteroid_fire?.loaded && this.assets.prop_asteroid_fire.img) ||
                      (this.assets?.prop_asteroid?.loaded && this.assets.prop_asteroid.img) || null;
        } else {
          spriteImg = (this.assets?.prop_asteroid?.loaded && this.assets.prop_asteroid.img) ||
                      (this.assets?.prop_asteroid_ice?.loaded && this.assets.prop_asteroid_ice.img) || null;
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
            // ĐÃ GÕ ĐÚNG: Kiếm khí Bích Ngọc rực sáng, sắc nét hoàn hảo (Không có vệt gạch làm mờ)
            ctx.save();
            ctx.fillStyle = "#34D399";
            ctx.shadowColor = "#10B981";
            ctx.shadowBlur = 12;
            // Viền tối nhẹ để chữ nổi bật trên mọi hiệu ứng
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "rgba(4, 30, 20, 0.85)";
            ctx.strokeText(letter, cx, runeY);
            ctx.fillText(letter, cx, runeY);
            ctx.restore();

          } else if (c === ast.typedLen) {
            // KÝ TỰ MỤC TIÊU ĐANG GÕ: Rực lửa chu sa bừng sáng dữ dội
            ctx.save();
            const pulse = 1.0 + Math.sin(this.time * 12) * 0.12;
            ctx.translate(cx, runeY);
            ctx.scale(pulse, pulse);

            // Viền tương phản
            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgba(10, 5, 2, 0.9)";
            ctx.strokeText(letter, 0, 0);

            // Hào quang rực lửa
            ctx.fillStyle = "#FDE047";
            ctx.shadowColor = "#EF4444";
            ctx.shadowBlur = 20;
            ctx.fillText(letter, 0, 0);

            // Vòng phù ấn bao quanh ký tự đang gõ
            ctx.strokeStyle = "rgba(245, 158, 11, 0.9)";
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(0, 0, 13, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();

          } else {
            // KÝ TỰ CHƯA GÕ: Cổ phù hoàng kim sáng bóng, viền đen sắc nét
            ctx.save();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "rgba(10, 5, 2, 0.85)";
            ctx.strokeText(letter, cx, runeY);

            ctx.fillStyle = "#FEF3C7";
            ctx.shadowColor = "rgba(245, 158, 11, 0.65)";
            ctx.shadowBlur = 6;
            ctx.fillText(letter, cx, runeY);
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

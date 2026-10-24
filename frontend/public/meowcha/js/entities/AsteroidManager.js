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

    spawnBoss(bossConfig, canvasWidth) {
      if (!bossConfig) return null;
      const cW = canvasWidth || this.canvasWidth || 800;
      const isMobile = cW <= 600;
      const firstShield = bossConfig.shields[0];
      const word = firstShield.word.toUpperCase();
      const radius = isMobile ? 56 : 74;

      const craggyPoints = [];
      const numVertices = 16;
      for (let i = 0; i < numVertices; i++) {
        const ang = (i / numVertices) * Math.PI * 2;
        const radOffset = (Math.random() - 0.5) * 14;
        craggyPoints.push({ angle: ang, r: radius + radOffset });
      }

      const boss = {
        id: "BOSS_" + Date.now(),
        isBoss: true,
        bossTitle: bossConfig.bossTitle,
        baseWord: bossConfig.baseWord,
        baseMeaning: bossConfig.baseMeaning,
        shields: bossConfig.shields,
        currentShieldIdx: 0,
        totalShields: bossConfig.shields.length,
        word: word,
        ipa: firstShield.ipa,
        meaning: firstShield.meaning,
        example: firstShield.example,
        isCloze: false,
        isAudio: false,
        x: cW / 2,
        y: -radius - 20,
        targetY: isMobile ? 120 : 155,
        vx: 0,
        vy: 0.22,
        fallAngle: Math.PI / 2,
        radius: radius,
        coreColor: "#DC2626",
        glowColor: "#F59E0B",
        runeColor: "#FEF08A",
        trailColors: ["#EF4444", "#F59E0B", "#FDE047", "#991B1B"],
        damage: 15,
        bandIdx: 3,
        typedLen: 0,
        wobbleSeed: 0,
        wobbleSpeed: 1.8,
        rot: 0,
        rotSpeed: 0.012,
        hitReaction: 0,
        slowTimer: 0,
        freezeTimer: 0,
        trail: [],
        craggyPoints: craggyPoints,
        veins: []
      };

      this.asteroids.push(boss);
      return boss;
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
      const isMobile = canvasWidth <= 768 || (typeof window !== "undefined" && window.innerWidth <= 768);
      const charW = isMobile ? 18 : 22;
      const totalWordW = word.length * charW;
      const halfWordW = totalWordW / 2;
      const baseRadius = isMobile ? Math.max(50, word.length * 8.2) : Math.max(52, word.length * 8.8);
      const safeMargin = Math.max(baseRadius + 20, halfWordW + 28);
      // THANH NGỌC GIẢN HUD ĐÃ ĐƯỢC CHIA THÀNH 2 GÓC:
      // Góc trái: Cấp bậc & Mệnh Đan (~260px)
      // Góc phải: Tu vi & Phù chú điều khiển (~290px)
      // KHU VỰC CHÍNH GIỮA (CENTER SKY) LÀ KHOẢNG TRỐNG HOÀN HẢO ĐỂ MA THẠCH RƠI TỰ DO:
      let minX, maxX;
      if (isMobile) {
        minX = Math.max(safeMargin, canvasWidth * 0.20);
        maxX = Math.min(canvasWidth - safeMargin, canvasWidth * 0.80);
        if (maxX <= minX + 30) {
          minX = canvasWidth * 0.22;
          maxX = canvasWidth * 0.78;
        }
      } else {
        const leftAvoidW = 270;
        const rightAvoidW = 290;
        minX = Math.max(safeMargin, leftAvoidW);
        maxX = Math.min(canvasWidth - safeMargin, canvasWidth - rightAvoidW);
        if (maxX <= minX + 60) {
          minX = canvasWidth * 0.22;
          maxX = canvasWidth * 0.78;
        }
      }
      const spawnX = minX + Math.random() * (maxX - minX);

      const realms = (root && root.Meowcha && root.Meowcha.CULTIVATION_REALMS) || [];
      const realmData = realms[realmIdx] || { speedMult: 1.0 };
      // Tốc độ tăng dần ổn định từ sơ cơ đến siêu khó ở các cảnh giới cao
      const realmSpeedBase = [0.22, 0.26, 0.31, 0.38, 0.48];
      let baseSpeed = (realmSpeedBase[Math.min(4, realmIdx)] || 0.22) * (realmData.speedMult || 1.0) * slowFactor * typeSpeedMultiplier;

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

      const M = root.Meowcha || {};
      const appState = this.gameState || (M.app && M.app.gameState) || null;
      const curMode = (appState && appState.gameMode) || "DIRECT";

      const asteroid = {
        cefr: wordItem.cefr || wordItem.level || null,
        example: wordItem.example || '',
        id: Date.now() + Math.random(),
        word: word,
        ipa: wordItem.ipa || "/.../",
        meaning: wordItem.meaning || "",
        audio_url: wordItem.audio_url || "",
        isCloze: curMode === "CLOZE",
        isAudio: curMode === "AUDIO",
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
        slowTimer: 0,
        slowMult: 1.0,
        freezeTimer: 0,
        trail: [] // Hạt đuôi bụi linh khí pixel
      };

      this.asteroids.push(asteroid);
      return asteroid;
    }

    update(dt = 0.016, bottomThreshold, onBottomHit, canvasWidth, isLightningHazard = false, domainSlow = 0) {
      this.time += dt;
      this.isLightningHazard = isLightningHazard;
      const cWidth = canvasWidth || this.canvasWidth || (typeof window !== "undefined" ? window.innerWidth : 800);

      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const ast = this.asteroids[i];
        if (domainSlow > 0) { statusSpeedMult *= Math.max(0.2, 1.0 - domainSlow); }
        let statusSpeedMult = 1.0;
        if (ast.freezeTimer && ast.freezeTimer > 0) {
          ast.freezeTimer = Math.max(0, ast.freezeTimer - dt);
          statusSpeedMult = 0.0; // Định thân hoàn toàn bởi Nguyên Anh Lôi Kích
        } else if (ast.slowTimer && ast.slowTimer > 0) {
          ast.slowTimer = Math.max(0, ast.slowTimer - dt);
          statusSpeedMult = ast.slowMult || 0.78; // Trì hoãn tốc độ rơi bởi Trúc Phong / Hàn Băng
        }
        if (ast.isBoss) {
          if (ast.y < ast.targetY) {
            ast.y += ast.vy * 60 * dt;
          } else {
            ast.y = ast.targetY + Math.sin(this.time * 2.2) * 6;
            ast.x = (cWidth / 2) + Math.cos(this.time * 1.5) * 18;
          }
          ast.rot += ast.rotSpeed;
          continue;
        }

        ast.x += ast.vx * 60 * dt * statusSpeedMult;
        // Khi bị sấm đánh (thiên kiếp sét): Ma thạch bị lôi đình thúc đẩy, tốc độ rơi tăng vọt (+45%) tạo áp lực thử thách
        const gravMult = isLightningHazard ? 1.45 : 1.0;
        ast.y += ast.vy * 60 * dt * gravMult * statusSpeedMult;
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
        // 1. TÀN TRO PIXEL & BỤI LINH KHÍ (SIÊU TỐI ƯU HIỆU NĂNG - ZERO LAG)
        // ============================================================
        ctx.save();
        for (const p of ast.trail) {
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
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
        // 4. CUỘN THƯ BÍ KÍP PHÁP BẢO TIÊN ĐẠO (CONSOLIDATED CELESTIAL SCROLL)
        // Hợp nhất toàn bộ: Ma Thạch Nguyên Tố, Dải Lụa Tiêu Đề, Ký Tự Gõ, và Dải Giải Nghĩa
        // ============================================================
        ctx.save();
        const word = ast.word;
        const D = root.Meowcha && root.Meowcha.Device;
        const isMobileScreen = D ? D.info.isMobile : ((ctx.canvas && ctx.canvas.width <= 768) || (typeof window !== "undefined" && window.innerWidth <= 768));
        const M = root.Meowcha || {};
        const isTarget = (ast.typedLen > 0) || (M.app && M.app.typing && M.app.typing.currentTarget === ast);

        // 4.1 XÁC ĐỊNH NỘI DUNG TIÊU ĐỀ & CHÂN GIẢI NGHĨA (CHUẨN CỔ PHONG TIÊN ĐẠO - KHÔNG DÙNG EMOJI THÔ)
        let topTitle = "[ 斬 ] TRỰC DIỆN TRẢM MA [ 诀 ]";
        let bottomText = `[ 斩 ] Gõ từ tiếng Anh • [${word.length} Ký Tự]`;

        if (ast.isAudio) {
          topTitle = "[ 聽 ] LẮNG NGHE TIÊN ÂM [ 音 ]";
          bottomText = `[ 聽 ] Nghe lại • ${ast.ipa || '/.../'} • [${word.length} Âm]`;
        } else if (ast.isCloze) {
          topTitle = "[ 悟 ] NGỘ ĐẠO THÔNG LINH [ 解 ]";
          bottomText = ast.meaning ? `[ 悟 ] Nghĩa: ${ast.meaning}` : `[ 悟 ] Đoán từ • [${word.length} Ký Tự]`;
        }

        // 4.2 TÍNH TOÁN KÍCH THƯỚC CUỘN THƯ VỪA VẶN MỌI NỘI DUNG
        ctx.font = isMobileScreen ? "700 11px 'Be Vietnam Pro', sans-serif" : "700 12.5px 'Be Vietnam Pro', sans-serif";
        const bottomTextMetrics = ctx.measureText(bottomText).width;
        const charSpacing = isMobileScreen ? 19 : 23;
        const wordWidth = word.length * charSpacing;

        const minW = isMobileScreen ? 175 : 210;
        const maxW = isMobileScreen ? 285 : 350;
        const scrollW = Math.max(minW, Math.min(maxW, Math.max(bottomTextMetrics + 32, wordWidth + 50)));
        const scrollH = isMobileScreen ? 74 : 84;
        const sx = posX - scrollW / 2;
        const sy = posY - scrollH / 2;

        // 4.3 KHỐI THIÊN THẠCH MA THẠCH NGUYÊN TỐ LÀM NỀN DƯỚI (CELESTIAL METEORITE BASE LAYER)
        // Asset thiên thạch thực tế nằm ở LỚP DƯỚI của cuộn thư theo đúng chuẩn thiết kế
        // Giữ nguyên tỷ lệ 1:1 chuẩn pixel art (256x256) để thiên thạch khổng lồ vươn cao trên và dưới cuộn thư
        const astType = ast.asteroidType || "fire";
        const astAssetKey = `prop_asteroid_${astType}`;
        const astAsset = this.assets && this.assets[astAssetKey];

        ctx.save();
        const rockSize = Math.max(isMobileScreen ? 230 : 285, scrollW + 28);
        const rockW = rockSize;
        const rockH = rockSize;

        ctx.translate(posX, posY);
        // Xoay nhẹ theo góc rơi và nhịp thời gian
        ctx.rotate(ast.fallAngle * 0.12 + Math.sin(this.time * 2.2 + (ast.id || 0)) * 0.04);
        ctx.shadowColor = ast.coreColor || "#F59E0B";
        ctx.shadowBlur = isTarget ? 32 : 18;

        if (astAsset && astAsset.loaded) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(astAsset.img, -rockW / 2, -rockH / 2, rockW, rockH);
        } else {
          // Fallback nếu sprite chưa nạp xong: Khối ma thạch phong ấn
          ctx.fillStyle = "rgba(18, 12, 8, 0.96)";
          ctx.strokeStyle = ast.coreColor || "#F59E0B";
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.roundRect(-rockW / 2, -rockH / 2, rockW, rockH, 14);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();

        // 4.4 ĐỔ BÓNG HÀO QUANG CUỘN THƯ
        ctx.shadowColor = ast.hitReaction > 0 ? "#FFFFFF" : (isTarget ? "#F59E0B" : "rgba(0, 0, 0, 0.75)");
        ctx.shadowBlur = ast.hitReaction > 0 ? 28 : (isTarget ? 20 : 12);

        // 4.5 THÂN CUỘN THƯ HOÀNG KIM CỔ PHONG (AGED GOLDEN PARCHMENT)
        const pGrad = ctx.createLinearGradient(sx, sy, sx, sy + scrollH);
        pGrad.addColorStop(0, "rgba(225, 198, 142, 0.96)");
        pGrad.addColorStop(0.12, "rgba(252, 246, 224, 0.95)");
        pGrad.addColorStop(0.5, "rgba(246, 237, 204, 0.94)");
        pGrad.addColorStop(0.88, "rgba(238, 222, 180, 0.95)");
        pGrad.addColorStop(1, "rgba(206, 172, 114, 0.97)");

        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.roundRect(sx, sy, scrollW, scrollH, 7);
        ctx.fill();

        // Viền kép hoàng kim cổ phong
        ctx.strokeStyle = isTarget ? "#F59E0B" : "rgba(180, 130, 45, 0.95)";
        ctx.lineWidth = isTarget ? 2.2 : 1.6;
        ctx.stroke();

        ctx.strokeStyle = "rgba(254, 240, 138, 0.65)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.roundRect(sx + 2, sy + 2, scrollW - 4, scrollH - 4, 5);
        ctx.stroke();

        // 4.5 HAI TRỤC CUỘN NGỌC BÍCH HOÀNG KIM (JADE & GOLD VERTICAL ROLLERS)
        // Trục cuốn bên trái
        const rollerW = 7;
        const rollerH = scrollH + 12;
        const rollerY = sy - 6;

        const leftRollerGrad = ctx.createLinearGradient(sx - rollerW + 1, 0, sx + 1, 0);
        leftRollerGrad.addColorStop(0, "#064E3B");
        leftRollerGrad.addColorStop(0.45, "#10B981");
        leftRollerGrad.addColorStop(1, "#064E3B");

        ctx.fillStyle = leftRollerGrad;
        ctx.fillRect(sx - rollerW + 1, rollerY, rollerW, rollerH);
        ctx.strokeStyle = "#D4AF37";
        ctx.lineWidth = 1;
        ctx.strokeRect(sx - rollerW + 1, rollerY, rollerW, rollerH);

        // Nắp chụp vàng hai đầu trục trái
        ctx.fillStyle = "#FDE047";
        ctx.beginPath();
        ctx.arc(sx - rollerW / 2 + 1, rollerY, 4.5, 0, Math.PI * 2);
        ctx.arc(sx - rollerW / 2 + 1, rollerY + rollerH, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Dây tua rua đỏ bên trái
        ctx.strokeStyle = "#DC2626";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(sx - rollerW / 2 + 1, rollerY + rollerH + 4);
        ctx.lineTo(sx - rollerW / 2 + 1, rollerY + rollerH + 14);
        ctx.stroke();
        ctx.fillStyle = "#FDE047";
        ctx.beginPath();
        ctx.arc(sx - rollerW / 2 + 1, rollerY + rollerH + 15, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Trục cuốn bên phải
        const rightRollerX = sx + scrollW - 1;
        const rightRollerGrad = ctx.createLinearGradient(rightRollerX, 0, rightRollerX + rollerW, 0);
        rightRollerGrad.addColorStop(0, "#064E3B");
        rightRollerGrad.addColorStop(0.45, "#10B981");
        rightRollerGrad.addColorStop(1, "#064E3B");

        ctx.fillStyle = rightRollerGrad;
        ctx.fillRect(rightRollerX, rollerY, rollerW, rollerH);
        ctx.strokeStyle = "#D4AF37";
        ctx.lineWidth = 1;
        ctx.strokeRect(rightRollerX, rollerY, rollerW, rollerH);

        // Nắp chụp vàng hai đầu trục phải
        ctx.fillStyle = "#FDE047";
        ctx.beginPath();
        ctx.arc(rightRollerX + rollerW / 2, rollerY, 4.5, 0, Math.PI * 2);
        ctx.arc(rightRollerX + rollerW / 2, rollerY + rollerH, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Dây tua rua đỏ bên phải
        ctx.strokeStyle = "#DC2626";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(rightRollerX + rollerW / 2, rollerY + rollerH + 4);
        ctx.lineTo(rightRollerX + rollerW / 2, rollerY + rollerH + 14);
        ctx.stroke();
        ctx.fillStyle = "#FDE047";
        ctx.beginPath();
        ctx.arc(rightRollerX + rollerW / 2, rollerY + rollerH + 15, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 4.6 DẢI LỤA ĐỎ TIÊU ĐỀ TÍCH HỢP Ở ĐỈNH CUỘN THƯ (INTEGRATED TOP RED SILK BANNER)
        const topBannerH = isMobileScreen ? 15 : 17;
        const topBannerW = scrollW - 14;
        const topBannerX = sx + 7;
        const topBannerY = sy + 3;

        const silkGrad = ctx.createLinearGradient(topBannerX, 0, topBannerX + topBannerW, 0);
        silkGrad.addColorStop(0, "#7F1D1D");
        silkGrad.addColorStop(0.25, "#991B1B");
        silkGrad.addColorStop(0.5, "#B91C1C");
        silkGrad.addColorStop(0.75, "#991B1B");
        silkGrad.addColorStop(1, "#7F1D1D");

        ctx.fillStyle = silkGrad;
        ctx.beginPath();
        ctx.roundRect(topBannerX, topBannerY, topBannerW, topBannerH, 4);
        ctx.fill();
        ctx.strokeStyle = "rgba(253, 224, 71, 0.85)";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.font = isMobileScreen ? "800 9.5px 'Cinzel', serif" : "800 10.5px 'Cinzel', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#FEF08A";
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 3;
        ctx.fillText(topTitle, posX, topBannerY + topBannerH / 2);

        // 4.7 TÂM ĐIỂM: MA THẠCH PHONG ẤN & PHIẾN THẦN THẠCH ÔM TRỌN TỪ VỰNG
        const cy = sy + scrollH / 2;

        // A. KÍCH THƯỚC PHIẾN MA THẠCH CO GIÃN THEO ĐỘ DÀI TỪ VỰNG (KHÔNG BỊ NHỎ, KHÔNG BỊ ĐÈ NÉT)
        const oreW = Math.min(scrollW - 22, Math.max(wordWidth + (isMobileScreen ? 24 : 32), isMobileScreen ? 135 : 175));
        const oreH = isMobileScreen ? 30 : 34;
        const oreX = posX - oreW / 2;
        const oreY = cy - oreH / 2;

        ctx.save();
        // Vòng Bát Quái Cổ Trận phát quang tinh tế quanh phiến thạch
        const baguaPulse = 0.88 + Math.sin(this.time * 2.8) * 0.12;
        ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(posX, cy, (oreH * 0.85) * baguaPulse, 0, Math.PI * 2);
        ctx.stroke();

        // B. NỀN PHIẾN MA THẠCH NGUYÊN TỐ (TRANSLUCENT ELEMENTAL SPIRIT ORE TABLET)
        let oreGrad = ctx.createLinearGradient(oreX, oreY, oreX + oreW, oreY + oreH);
        let oreBorderCol = "#38BDF8";
        let oreGlowCol = "rgba(56, 189, 248, 0.6)";

        if (ast.asteroidType === "ice") {
          oreGrad.addColorStop(0, "rgba(8, 47, 73, 0.92)");
          oreGrad.addColorStop(0.5, "rgba(2, 132, 199, 0.85)");
          oreGrad.addColorStop(1, "rgba(8, 47, 73, 0.92)");
          oreBorderCol = "#38BDF8";
          oreGlowCol = "rgba(56, 189, 248, 0.55)";
        } else if (ast.asteroidType === "fire") {
          oreGrad.addColorStop(0, "rgba(69, 26, 3, 0.92)");
          oreGrad.addColorStop(0.5, "rgba(180, 83, 9, 0.85)");
          oreGrad.addColorStop(1, "rgba(69, 26, 3, 0.92)");
          oreBorderCol = "#F59E0B";
          oreGlowCol = "rgba(245, 158, 11, 0.55)";
        } else if (ast.asteroidType === "void") {
          oreGrad.addColorStop(0, "rgba(30, 27, 75, 0.92)");
          oreGrad.addColorStop(0.5, "rgba(67, 56, 202, 0.85)");
          oreGrad.addColorStop(1, "rgba(30, 27, 75, 0.92)");
          oreBorderCol = "#818CF8";
          oreGlowCol = "rgba(129, 140, 248, 0.55)";
        } else if (ast.asteroidType === "thunder" || ast.asteroidType === "chaos") {
          oreGrad.addColorStop(0, "rgba(59, 7, 100, 0.92)");
          oreGrad.addColorStop(0.5, "rgba(126, 34, 206, 0.85)");
          oreGrad.addColorStop(1, "rgba(59, 7, 100, 0.92)");
          oreBorderCol = "#C084FC";
          oreGlowCol = "rgba(192, 132, 252, 0.55)";
        } else {
          oreGrad.addColorStop(0, "rgba(6, 78, 59, 0.92)");
          oreGrad.addColorStop(0.5, "rgba(16, 185, 129, 0.85)");
          oreGrad.addColorStop(1, "rgba(6, 78, 59, 0.92)");
          oreBorderCol = "#34D399";
          oreGlowCol = "rgba(52, 211, 153, 0.55)";
        }

        ctx.fillStyle = oreGrad;
        ctx.shadowColor = oreGlowCol;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(oreX, oreY, oreW, oreH, 6);
        ctx.fill();

        // Viền ngọc thần thạch chạm khắc
        ctx.strokeStyle = oreBorderCol;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // C. PHÙ ẤN BỐN GÓC THẦN THẠCH [ 攻 破 ]
        ctx.font = "800 8.5px 'Cinzel', serif";
        ctx.fillStyle = "rgba(253, 224, 71, 0.75)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("攻", oreX + 9, oreY + oreH / 2);
        ctx.fillText("破", oreX + oreW - 9, oreY + oreH / 2);

        ctx.restore();

        // 4.8 KÝ TỰ CỔ PHÙ TRẢM MA (CARVED SACRED RUNES)
        // Hiển thị trực diện trên phiến ma thạch với độ tương phản cao, rõ nét tuyệt đối
        ctx.save();
        ctx.font = isMobileScreen ? "900 17.5px 'Cinzel', serif" : "900 21px 'Cinzel', 'Playfair Display', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const startCharX = posX - (word.length * charSpacing) / 2 + charSpacing / 2;
        const runeY = cy;

        for (let c = 0; c < word.length; c++) {
          const letter = word[c];
          const cx = startCharX + c * charSpacing;

          if (c < ast.typedLen) {
            // ĐÃ GÕ ĐÚNG: Hiện chữ cái thật rực rỡ ngọc bích
            ctx.save();
            ctx.lineWidth = 2.8;
            ctx.strokeStyle = "rgba(6, 78, 59, 0.95)";
            ctx.strokeText(letter, cx, runeY);

            ctx.fillStyle = "#34D399";
            ctx.shadowColor = "#10B981";
            ctx.shadowBlur = 12;
            ctx.fillText(letter, cx, runeY);
            ctx.restore();

          } else if (c === ast.typedLen) {
            // KÝ TỰ MỤC TIÊU ĐANG CẦN GÕ
            ctx.save();
            const pulse = 1.0 + Math.sin(this.time * 12) * 0.12;
            ctx.translate(cx, runeY);
            ctx.scale(pulse, pulse);

            let targetChar = letter;
            let targetColor = "#FDE047";
            let targetGlow = "#F59E0B";

            if (ast.isAudio) {
              targetChar = "_";
              targetColor = "#C084FC";
              targetGlow = "#A855F7";
            } else if (ast.isCloze) {
              // CLOZE: Chỉ hiện gợi ý chữ đầu (khi chưa gõ) và chữ cuối (nếu từ >= 3 ký tự)
              if ((c === 0 && ast.typedLen === 0) || (c === word.length - 1 && word.length >= 3)) {
                targetChar = letter;
                targetColor = "#FDE047";
                targetGlow = "#F59E0B";
              } else {
                targetChar = "_";
                targetColor = "#67E8F9";
                targetGlow = "#38BDF8";
              }
            }

            ctx.lineWidth = 3.0;
            ctx.strokeStyle = "rgba(15, 23, 42, 0.95)";
            ctx.strokeText(targetChar, 0, 0);

            ctx.fillStyle = targetColor;
            ctx.shadowColor = targetGlow;
            ctx.shadowBlur = 16;
            ctx.fillText(targetChar, 0, 0);

            // Vòng tròn kiếm khí nhắm mục tiêu
            ctx.strokeStyle = targetGlow;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(0, 0, isMobileScreen ? 11 : 13, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

          } else {
            // KÝ TỰ CHƯA GÕ (c > ast.typedLen)
            ctx.save();
            ctx.lineWidth = 2.6;
            ctx.strokeStyle = "rgba(15, 23, 42, 0.95)";

            let displayChar = letter;
            let fillCol = "#FEF08A";
            let glowCol = "rgba(254, 240, 138, 0.5)";

            if (ast.isAudio) {
              displayChar = "_";
              fillCol = "#C084FC";
              glowCol = "rgba(192, 132, 252, 0.5)";
            } else if (ast.isCloze) {
              // CLOZE: Ký tự cuối cùng luôn hiện làm gợi ý chốt đuôi nếu từ >= 3 ký tự
              if (c === word.length - 1 && word.length >= 3) {
                displayChar = letter;
                fillCol = "#FDE047";
                glowCol = "rgba(245, 158, 11, 0.6)";
              } else {
                displayChar = "_";
                fillCol = "rgba(103, 232, 249, 0.85)";
                glowCol = "rgba(56, 189, 248, 0.5)";
              }
            }

            ctx.strokeText(displayChar, cx, runeY);
            ctx.fillStyle = fillCol;
            ctx.shadowColor = glowCol;
            ctx.shadowBlur = 8;
            ctx.fillText(displayChar, cx, runeY);

            // Gạch chân ký tự cuối để người chơi nhận diện đây là chữ cái gợi ý
            if (ast.isCloze && c === word.length - 1 && word.length >= 3) {
              ctx.strokeStyle = "#FDE047";
              ctx.lineWidth = 1.4;
              ctx.beginPath();
              ctx.moveTo(cx - 7, runeY + 11);
              ctx.lineTo(cx + 7, runeY + 11);
              ctx.stroke();
            }
            ctx.restore();
          }
        }
        ctx.restore();

        // 4.9 DẢI ĐẾ SẪM MÀU TRANG NHÃ CHỨA PHIÊN ÂM & NGHĨA (INTEGRATED BOTTOM BANNER)
        const btmBannerH = isMobileScreen ? 16 : 18;
        const btmBannerW = scrollW - 14;
        const btmBannerX = sx + 7;
        const btmBannerY = sy + scrollH - btmBannerH - 3;

        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.beginPath();
        ctx.roundRect(btmBannerX, btmBannerY, btmBannerW, btmBannerH, 4);
        ctx.fill();

        ctx.strokeStyle = "rgba(212, 175, 55, 0.55)";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.font = isMobileScreen ? "700 10.5px 'Be Vietnam Pro', sans-serif" : "700 12px 'Be Vietnam Pro', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let btmTextColor = "#FDE047";
        if (ast.isAudio) btmTextColor = "#38BDF8";
        else if (ast.isCloze) btmTextColor = "#34D399";

        ctx.fillStyle = btmTextColor;
        ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
        ctx.shadowBlur = 3;

        let fitText = bottomText;
        const maxTextW = btmBannerW - 14;
        if (ctx.measureText(fitText).width > maxTextW) {
          while (fitText.length > 4 && ctx.measureText(fitText + "...").width > maxTextW) {
            fitText = fitText.slice(0, -1);
          }
          fitText += "...";
        }
        ctx.fillText(fitText, posX, btmBannerY + btmBannerH / 2);

        ctx.restore();
      }
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.AsteroidManager = AsteroidManager;
})(typeof window !== 'undefined' ? window : globalThis);

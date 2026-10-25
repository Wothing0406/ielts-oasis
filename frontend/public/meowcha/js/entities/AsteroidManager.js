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
        minX = Math.max(safeMargin, canvasWidth * 0.22);
        maxX = Math.min(canvasWidth - safeMargin, canvasWidth * 0.78);
        if (maxX <= minX + 20) {
          minX = canvasWidth * 0.18;
          maxX = canvasWidth * 0.82;
        }
      } else {
        const leftAvoidW = 285;
        const rightAvoidW = 305;
        minX = Math.max(safeMargin, leftAvoidW);
        maxX = Math.min(canvasWidth - safeMargin, canvasWidth - rightAvoidW);
        if (maxX <= minX + 40) {
          minX = Math.max(safeMargin, canvasWidth * 0.28);
          maxX = Math.min(canvasWidth - safeMargin, canvasWidth * 0.72);
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
        if (!ast) continue;
        ast.trail = ast.trail || [];
        let statusSpeedMult = 1.0;
        if (domainSlow > 0) { statusSpeedMult *= Math.max(0.2, 1.0 - domainSlow); }
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
        let effectiveLeft = safeMargin;
        let effectiveRight = cWidth - safeMargin;
        if (!isMobileScreen && ast.y < 108) {
          effectiveLeft = Math.max(safeMargin, 280);
          effectiveRight = Math.min(cWidth - safeMargin, cWidth - 300);
        }
        if (ast.x < effectiveLeft) {
          ast.x = effectiveLeft;
          ast.vx = Math.abs(ast.vx);
        } else if (ast.x > effectiveRight) {
          ast.x = effectiveRight;
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

    draw(ctx) {
      for (const ast of this.asteroids) {
        ctx.save();
        ctx.imageSmoothingEnabled=false; ctx.shadowBlur=0;
        const width=ctx.canvas.width, small=width<600;
        const x=Math.max(90,Math.min(width-90,ast.x+Math.sin(this.time*ast.wobbleSpeed+ast.wobbleSeed)*3)), y=ast.y;
        const rock=this.assets['prop_asteroid_'+(ast.asteroidType||'void')];
        const size=ast.isBoss?168:(small?122:148);
        for(const p of ast.trail||[]) {
          ctx.globalAlpha=Math.max(0,p.alpha*.55);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);
        }
        ctx.globalAlpha=1;
        if(rock&&rock.loaded) ctx.drawImage(rock.img,Math.round(x-size/2),Math.round(y-size/2-12),size,size);
        // A quiet authored talisman carries the word; no stacked black/gold windows.
        const cols=Math.min(16,ast.word.length), rows=Math.ceil(ast.word.length/16);
        const paperW=Math.min(width-16,Math.max(190,cols*(small?15:18)+36)), paperH=rows>1?114:94;
        const safeX=Math.max(paperW/2+8,Math.min(width-paperW/2-8,x));
        const paper=this.assets.ivory_scroll;
        if(paper&&paper.loaded) ctx.drawImage(paper.img,safeX-paperW/2,y-paperH/2,paperW,paperH);
        else { ctx.fillStyle='#F5E7C7';ctx.fillRect(safeX-paperW*.45,y-25,paperW*.9,50); }
        const fontSize=small?18:21, gap=Math.min(small?15:18,(paperW*.76)/cols);
        ctx.font="800 "+fontSize+"px 'Be Vietnam Pro',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';
        for(let i=0;i<ast.word.length;i++) {
          const row=Math.floor(i/16), count=Math.min(16,ast.word.length-row*16), col=i%16;
          const visible=i<ast.typedLen || (!ast.isAudio && (!ast.isCloze || i===0 || i===ast.word.length-1));
          ctx.fillStyle=i<ast.typedLen?'#397A61':'#20332D';
          ctx.fillText(visible?ast.word[i]:'·',safeX+(col-(count-1)/2)*gap,y+(row-(rows-1)/2)*(fontSize+2)-3);
        }
        ctx.font=(small?10:11)+"px 'Be Vietnam Pro',sans-serif";ctx.fillStyle='#614734';
        let detail=ast.isBoss ? 'Tâm Ma • '+(ast.currentShieldIdx+1)+'/'+ast.totalShields+' • '+(ast.baseWord||'') :
          ast.isAudio?'Nghe và gõ • Tab nghe lại':ast.isCloze?ast.meaning:(ast.typedLen||0)+' / '+ast.word.length+' ký tự';
        const limit=paperW*.76;
        while(detail.length>2&&ctx.measureText(detail).width>limit) detail=detail.slice(0,-2)+'…';
        ctx.fillText(detail,safeX,y+(rows>1?26:17));
        if(ast.freezeTimer>0) {
          ctx.fillStyle='#9CB7D4';for(let i=0;i<4;i++)ctx.fillRect(x-size/2+i*size/3,y-size/2,4,6);
        }
        if(ast.hitReaction>0) {
          // Tiny chipped jade pixels instead of a white screen/glow.
          ctx.globalAlpha=Math.min(.8,ast.hitReaction);ctx.fillStyle='#F5E7C7';
          ctx.fillRect(x-size*.3,y-32,3,6);ctx.fillRect(x+size*.3,y-8,4,3);
        }
        ctx.restore();
      }
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.AsteroidManager = AsteroidManager;
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * AsteroidManager.js - Quản Lý Ma Thạch Cổ Ngữ (3D Craggy Meteor, Magma Veins & Carved Runes)
 * Loại bỏ hoàn toàn nhãn dán phẳng. Tái tạo ma thạch chân thực với đuôi lửa, sóng xung kích,
 * lõi đá nứt rực sáng và từng cổ phù khắc kim phát quang theo nhịp gõ kiếm đạo.
 */
(function(root) {
  const SPRITE_ROTATION={ice:-Math.PI/4,void:-Math.PI/4,fire:Math.PI/4,thunder:Math.PI/4};
  class AsteroidManager {
    constructor(assets) {
      this.assets = assets || {};
      this.asteroids = [];
      this.time = 0;
    }

    spawnBoss(bossConfig, canvasWidth) {
      if (!bossConfig) return null;
      const cW = root.Meowcha.battleLayout?.fieldWidth || canvasWidth || this.canvasWidth || 800;
      const isMobile = cW <= 600;
      const firstShield = bossConfig.shields[0];
      const word = firstShield.word.toUpperCase();
      const radius = isMobile ? 40 : 52;

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
        y: Math.max(155, ((root.Meowcha.battleLayout || {}).hudBottom || 76) + 80),
        targetY: Math.max(155, ((root.Meowcha.battleLayout || {}).hudBottom || 76) + 80),
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
      if(root.Meowcha.normalizeLearningWord) wordItem = root.Meowcha.normalizeLearningWord(wordItem);
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

      if (asteroidType === "fire") {
        coreColor = "#F97316";
        glowColor = "#EF4444";
        runeColor = "#FEF08A";
        trailColors = ["#F97316", "#EF4444", "#FEF08A", "#991B1B", "#292524"];
        baseDamage = 12;
      } else if (asteroidType === "void") {
        coreColor = "#A855F7";
        glowColor = "#7E22CE";
        runeColor = "#F3E8FF";
        trailColors = ["#A855F7", "#C084FC", "#E9D5FF", "#581C87", "#1E1B4B"];
        baseDamage = 16;
      } else if (asteroidType === "thunder" || asteroidType === "chaos") {
        asteroidType = "thunder";
        coreColor = "#FDE047";
        glowColor = "#DC2626";
        runeColor = "#FFFBEB";
        trailColors = ["#FDE047", "#F59E0B", "#DC2626", "#991B1B", "#18181B"];
        baseDamage = 22;
      }

      const totalDamage = explicitDamage || (baseDamage + rIdx * 2);

      const word = wordItem.word.toUpperCase();
      this.canvasWidth = canvasWidth;
      const isMobile = canvasWidth <= 768 || (typeof window !== "undefined" && window.innerWidth <= 768);
      const charW = isMobile ? 18 : 22;
      const totalWordW = word.length * charW;
      const halfWordW = totalWordW / 2;
      // Collision and debris scale with the rock, not with the word length.
      const baseRadius = isMobile ? 32 : 42;
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
      const field = (root.Meowcha && root.Meowcha.battleLayout) || {};
      const fieldWidth=field.fieldWidth||canvasWidth;
      const spawnX=fieldWidth<800?fieldWidth/2:minX+Math.random()*(maxX-minX);
      const entryTargetY=(field.hudBottom||76)+48;
      // The word card, rock, projectile and reward must share the same visible position.
      const spawnY = -baseRadius-80;
      const appState=this.gameState||root.Meowcha.app?.gameState;
      const mode=appState?.gameMode||'DIRECT';
      // One budget in seconds, independent of pixel distance and stacked realm multipliers.
      const introduction=rIdx===0?6*Math.max(0,1-(appState?.wordsSlain||0)/12):0;
      const typingSeconds=([18,17,15,13.5,12][Math.min(4,rIdx)]+introduction+
        Math.min(10,Math.max(0,word.length-4)*.9)+(mode==='AUDIO'?4:mode==='CLOZE'?3:0))/Math.max(.4,Math.min(1,slowFactor));
      const vy=Math.max(20,(field.bottomThreshold||600)-entryTargetY)/(typingSeconds*60);
      const vx = 0;
      const fallAngle = Math.PI/2;

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

      const M = root.Meowcha || {};
      const curMode = (appState && appState.gameMode) || "DIRECT";

      const asteroid = {
        type: wordItem.type || '',
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
        entering:true,
        entryTargetY,
        entryProgress:0,typingSeconds,remainingSeconds:typingSeconds,layoutThreshold:field.bottomThreshold||null,
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
        rot:SPRITE_ROTATION[asteroidType]||0,
        rotSpeed:0,
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
      const cWidth = root.Meowcha.battleLayout?.fieldWidth || canvasWidth || this.canvasWidth || (typeof window !== "undefined" ? window.innerWidth : 800);

      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const ast = this.asteroids[i];
        if (!ast) continue;
        if(!ast.isBoss&&Number.isFinite(ast.remainingSeconds)&&ast.layoutThreshold!=null&&ast.layoutThreshold!==bottomThreshold){
          const start=(root.Meowcha.battleLayout?.hudBottom||76)+48;
          if(!ast.entering)ast.y=start+(bottomThreshold-start)*(1-ast.remainingSeconds/ast.typingSeconds);
        }
        ast.layoutThreshold=bottomThreshold;
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

        ast.vx=0;
        // A small, bounded hazard increase; never compound realm/score multipliers.
        const gravMult = isLightningHazard ? 1.1 : 1;
        if(ast.y<bottomThreshold){
          if(ast.entering){
            ast.entryTargetY=(root.Meowcha.battleLayout?.hudBottom||76)+48;
            ast.entryProgress=Math.min(1,(ast.entryProgress||0)+dt*statusSpeedMult/1.8);
            const progress=1-Math.pow(1-ast.entryProgress,2);
            ast.y=-ast.radius-80+(ast.entryTargetY+ast.radius+80)*progress;
            ast.entering=ast.entryProgress<1;
          }else if(Number.isFinite(ast.remainingSeconds)){
            ast.remainingSeconds=Math.max(0,ast.remainingSeconds-dt*gravMult*statusSpeedMult);
            const start=(root.Meowcha.battleLayout?.hudBottom||76)+48;
            ast.y=start+(bottomThreshold-start)*(1-ast.remainingSeconds/ast.typingSeconds);
          }else ast.y+=ast.vy*60*dt*gravMult*statusSpeedMult;
        }
        // Cập nhật fallAngle và góc xoay chuẩn xác (đứng dọc hướng xuống)
        ast.fallAngle = Math.PI/2;
        ast.rot=SPRITE_ROTATION[ast.asteroidType]||0;

        if (ast.typoFlash > 0) ast.typoFlash = Math.max(0, ast.typoFlash - dt);
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

    cardLayout(ctx, ast) {
      const M=root.Meowcha, width=M.battleLayout?.fieldWidth||ctx.canvas.width, small=width<600;
      const cols=Math.min(small?14:18,ast.word.length), rows=Math.ceil(ast.word.length/cols), fontSize=small?16:18;
      const paperW=Math.min(width-24,Math.max(small?210:240,cols*(small?12:14)+48));
      const safeX=Math.max(paperW/2+8,Math.min(width-paperW/2-8,ast.x));
      ctx.font="12px 'Be Vietnam Pro',sans-serif";
      const detail=ast.isBoss?'Tâm Ma • '+(ast.currentShieldIdx+1)+'/'+ast.totalShields :
        ast.isAudio?'Nghe và gõ • Tab nghe lại':ast.isCloze?
        ((ast.type?ast.type+' • ':'')+(ast.meaning||'Nhớ từ qua nghĩa')):
        ((ast.ipa&&ast.ipa!=='/.../'?ast.ipa+' • ':'')+(ast.typedLen||0)+' / '+ast.word.length);
      const time=Number.isFinite(ast.remainingSeconds)?' • '+Math.ceil(ast.remainingSeconds)+'s':'';
      const detailLines=M.wrapLearningText?M.wrapLearningText(ctx,detail+time,paperW*.77):[detail+time];
      const paperH=36+rows*(fontSize+2)+detailLines.length*15;
      const battle=M.getBattleLayout?M.getBattleLayout(ctx.canvas):{};
      const top=(battle.hudBottom||76)+6, bottom=Math.max(top+paperH,battle.bottomThreshold||ctx.canvas.height-160);
      const cardY=ast.y;
      return {paperW,paperH,safeX,cardY,cols,rows,fontSize,gap:Math.min(small?12:14,paperW*.76/cols),detailLines};
    }
    draw(ctx) {
      for (const ast of this.asteroids) {
        ctx.save();
        ctx.imageSmoothingEnabled=false; ctx.shadowBlur=0;
        const width=root.Meowcha.battleLayout?.fieldWidth||ctx.canvas.width, small=width<600;
        const x=ast.x, y=ast.y;
        const field=root.Meowcha.getBattleLayout?root.Meowcha.getBattleLayout(ctx.canvas):{};
        ctx.beginPath();ctx.rect(0,(field.hudBottom||76)+6,width,(field.defenseY||ctx.canvas.height)-(field.hudBottom||76)-8);ctx.clip();
        const rock=this.assets['prop_asteroid_'+(ast.asteroidType||'void')];
        const size=ast.isBoss?(small?104:128):(small?78:104);
        for(const p of ast.trail||[]) {
          ctx.globalAlpha=Math.max(0,p.alpha*.55);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);
        }
        ctx.globalAlpha=1;
        if(rock&&rock.loaded){
          const rotation=SPRITE_ROTATION[ast.asteroidType]||0;
          ctx.save();ctx.translate(x,y-12);ctx.rotate(rotation);ctx.drawImage(rock.img,-size/2,-size/2,size,size);ctx.restore();
        }
        const M = root.Meowcha, layout = this.cardLayout(ctx, ast);
        const {paperW,paperH,safeX,cardY,cols,rows,fontSize,gap,detailLines} = layout;
        const paper=this.assets.ivory_scroll;
        ctx.fillStyle='#F5E7C7';ctx.fillRect(safeX-paperW*.4,cardY-paperH*.29,paperW*.8,paperH*.58);
        if(paper&&paper.loaded) ctx.drawImage(paper.img,safeX-paperW/2,cardY-paperH/2,paperW,paperH);
        else { ctx.fillStyle='#F5E7C7';ctx.fillRect(safeX-paperW/2,cardY-paperH/2,paperW,paperH); }
        ctx.font="800 "+fontSize+"px 'Be Vietnam Pro',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';
        const glyphY=cardY-paperH/2+22;
        for(let i=0;i<ast.word.length;i++) {
          const row=Math.floor(i/cols), count=Math.min(cols,ast.word.length-row*cols), col=i%cols;
          const visible=i<ast.typedLen || (!ast.isAudio && (!ast.isCloze || i===0 || i===ast.word.length-1));
          ctx.fillStyle=i<ast.typedLen?'#397A61':'#20332D';
          ctx.fillText(visible?ast.word[i]:'·',safeX+(col-(count-1)/2)*gap,glyphY+row*(fontSize+2));
        }
        ctx.font="12px 'Be Vietnam Pro',sans-serif";ctx.fillStyle='#614734';
        detailLines.forEach((line,i)=>ctx.fillText(line,safeX,glyphY+rows*(fontSize+2)+i*16));
        if(Number.isFinite(ast.remainingSeconds)){
          const left=safeX-paperW*.32,barY=cardY+paperH*.36;
          ctx.fillStyle='#CABB93';ctx.fillRect(left,barY,paperW*.64,3);
          ctx.fillStyle=ast.remainingSeconds<5?'#B85645':'#397A61';ctx.fillRect(left,barY,paperW*.64*ast.remainingSeconds/ast.typingSeconds,3);
        }
        if(ast.freezeTimer>0) {
          ctx.fillStyle='#9CB7D4';for(let i=0;i<4;i++)ctx.fillRect(x-size/2+i*size/3,y-size/2,4,6);
        }
        if(ast.typoFlash>0) {
          ctx.fillStyle='#C95E52';ctx.fillRect(safeX-paperW*.36,y-20,paperW*.72,3);
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
